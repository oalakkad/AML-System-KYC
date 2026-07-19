'use server';

import path from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';
import { encryptBuffer, sha256 } from '@/lib/crypto';
import { assessRisk, resolveFinalRating } from '@/lib/risk/engine';
import { canEditCase, transition, type WorkflowAction } from '@/lib/workflow';
import {
  ALLOWED_UPLOAD_MIME,
  MAX_UPLOAD_BYTES,
  DOC_TYPES,
  FORM_TYPES,
  CLIENT_TYPES,
  SETTING_KEYS,
  type CaseStatus,
  type DocType,
  type FatfStatus,
  type RiskRating,
} from '@/lib/constants';
import { kycFormSchema, submitExtraSchema, type KycFormValues } from './schemas';
import { formToProfileData, buildRiskInput, type FatfSettings } from './mappers';
import { sanitizeDraft } from './sanitize';

// ---------- shared helpers ----------

export async function loadFatfContext(): Promise<{ fatfByCode: Map<string, FatfStatus>; settings: FatfSettings }> {
  const [countries, settings] = await Promise.all([
    prisma.country.findMany({ select: { code: true, fatfStatus: true } }),
    prisma.systemSetting.findMany(),
  ]);
  const map = new Map(settings.map((s) => [s.key, s.value]));
  return {
    fatfByCode: new Map(countries.map((c) => [c.code, c.fatfStatus as FatfStatus])),
    settings: {
      domesticCountryCode: map.get(SETTING_KEYS.domesticCountryCode) ?? 'KW',
      greyListRequiresDocument: (map.get(SETTING_KEYS.greyListRequiresDocument) ?? 'true') === 'true',
    },
  };
}

export async function nextCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.caseCounter.upsert({
    where: { year },
    create: { year, counter: 1 },
    update: { counter: { increment: 1 } },
  });
  return `KYC-${year}-${String(counter.counter).padStart(5, '0')}`;
}

/** Load a case and assert the current user may still edit it. */
async function getEditableCase(caseId: string) {
  const session = await requireSession(['FRONT_OFFICE']);
  const kase = await prisma.kycCase.findUnique({ where: { id: caseId }, include: { profile: true } });
  if (!kase) throw new Error('Case not found');
  const isMaker = kase.makerId === session.userId;
  if (!canEditCase(kase.status as CaseStatus, session.role, isMaker)) {
    throw new Error('Case is not editable');
  }
  return { session, kase };
}

async function computeAndStoreRisk(caseId: string, values: KycFormValues) {
  const { fatfByCode, settings } = await loadFatfContext();
  const result = assessRisk(buildRiskInput(values, fatfByCode, settings));
  await prisma.kycCase.update({
    where: { id: caseId },
    data: {
      systemRiskScore: result.score,
      systemRiskRating: result.rating,
      riskFactorsJson: JSON.stringify(result.factors),
    },
  });
  return result;
}

// ---------- actions ----------

const createSchema = z.object({
  clientType: z.enum(CLIENT_TYPES).default('INDIVIDUAL'),
  formType: z.enum(FORM_TYPES),
  clientNo: z.string().trim().max(100).optional().or(z.literal('')),
});

export async function createCase(formData: FormData): Promise<void> {
  const session = await requireSession(['FRONT_OFFICE']);
  const parsed = createSchema.safeParse({
    clientType: formData.get('clientType') ?? 'INDIVIDUAL',
    formType: formData.get('formType'),
    // absent optional fields come back as null from FormData; normalize to ''
    clientNo: formData.get('clientNo') ?? '',
  });
  if (!parsed.success) throw new Error('Invalid input');

  const caseNumber = await nextCaseNumber();
  const isCorporate = parsed.data.clientType === 'CORPORATE';
  const kase = await prisma.kycCase.create({
    data: {
      caseNumber,
      clientType: parsed.data.clientType,
      formType: parsed.data.formType,
      clientNo: parsed.data.clientNo || null,
      status: 'DRAFT',
      makerId: session.userId,
      ...(isCorporate ? { corporateProfile: { create: {} } } : { profile: { create: {} } }),
    },
  });
  await logAudit({
    action: 'CASE_CREATED',
    caseId: kase.id,
    actorId: session.userId,
    toStatus: 'DRAFT',
    details: { caseNumber, formType: parsed.data.formType, clientType: parsed.data.clientType },
  });
  redirect(`/cases/${kase.id}/edit`);
}

export interface SaveResult {
  ok: boolean;
  error?: string;
  risk?: { score: number; rating: RiskRating; requiresSourceOfFundsDoc: boolean };
}

/** Autosave a draft (no business validation — that happens at submit). */
export async function saveCaseDraft(caseId: string, rawValues: unknown): Promise<SaveResult> {
  try {
    const { session, kase } = await getEditableCase(caseId);
    const values = sanitizeDraft(rawValues);
    await prisma.kycProfile.update({ where: { caseId: kase.id }, data: formToProfileData(values) });
    await prisma.kycCase.update({
      where: { id: kase.id },
      data: {
        formType: values.formType,
        clientNo: values.clientNo || null,
        clientEmail: values.email ? values.email.trim().toLowerCase() : null,
      },
    });
    const risk = await computeAndStoreRisk(kase.id, values);
    await logAudit({ action: 'CASE_UPDATED', caseId: kase.id, actorId: session.userId });
    return {
      ok: true,
      risk: {
        score: risk.score,
        rating: risk.rating,
        requiresSourceOfFundsDoc: risk.requiresSourceOfFundsDoc,
      },
    };
  } catch (e) {
    console.error('saveCaseDraft failed', e);
    return { ok: false, error: 'saveFailed' };
  }
}

export interface SubmitResult {
  ok: boolean;
  fieldErrors?: Record<string, string>;
  missingDocs?: DocType[];
  error?: string;
}

export async function submitCase(caseId: string, rawValues: unknown): Promise<SubmitResult> {
  const { session, kase } = await getEditableCase(caseId);
  const values = sanitizeDraft(rawValues);

  // 1. Full business validation
  const parsed = kycFormSchema.safeParse(values);
  const extra = submitExtraSchema.safeParse(values);
  if (!parsed.success || !extra.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of [...(parsed.success ? [] : parsed.error.issues), ...(extra.success ? [] : extra.error.issues)]) {
      const key = issue.path.join('.');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;

  // 2. Risk assessment + FATF screening
  const { fatfByCode, settings } = await loadFatfContext();
  const risk = assessRisk(buildRiskInput(data, fatfByCode, settings));

  // 3. Required documents
  const docs = await prisma.document.findMany({ where: { caseId: kase.id }, select: { docType: true } });
  const have = new Set(docs.map((d) => d.docType));
  const missingDocs: DocType[] = [];
  if (risk.requiresSourceOfFundsDoc && !have.has('SOURCE_OF_FUNDS')) missingDocs.push('SOURCE_OF_FUNDS');
  if (data.isManagedByOther && data.managerType === 'POA' && !have.has('POA')) missingDocs.push('POA');
  if (data.isManagedByOther && data.managerType === 'GUARDIAN' && !have.has('COURT_ORDER')) missingDocs.push('COURT_ORDER');
  if (missingDocs.length > 0) return { ok: false, missingDocs };

  // 4. Final rating (maker may only raise)
  let finalRating: RiskRating;
  let overridden = false;
  try {
    const resolved = resolveFinalRating(risk.rating, data.overrideRating || null);
    finalRating = resolved.finalRating;
    overridden = resolved.overridden;
  } catch {
    return { ok: false, fieldErrors: { overrideRating: 'overrideHint' } };
  }

  // 5. Persist + transition
  const fromStatus = kase.status as CaseStatus;
  const toStatus = transition(fromStatus, 'SUBMIT', {
    role: session.role,
    isMaker: true,
    finalRiskRating: finalRating,
  });

  await prisma.$transaction([
    prisma.kycProfile.update({ where: { caseId: kase.id }, data: formToProfileData(data) }),
    prisma.kycCase.update({
      where: { id: kase.id },
      data: {
        formType: data.formType,
        clientNo: data.clientNo || null,
        clientEmail: data.email ? data.email.trim().toLowerCase() : null,
        status: toStatus,
        submittedAt: new Date(),
        systemRiskScore: risk.score,
        systemRiskRating: risk.rating,
        riskFactorsJson: JSON.stringify(risk.factors),
        finalRiskRating: finalRating,
        overrideJustification: overridden ? data.overrideJustification || null : null,
        // resubmission clears the previous review round
        complianceDecision: null,
        complianceNotes: null,
        complianceAt: null,
        checkerId: null,
      },
    }),
  ]);

  if (overridden) {
    await logAudit({
      action: 'RISK_OVERRIDDEN',
      caseId: kase.id,
      actorId: session.userId,
      details: { systemRating: risk.rating, finalRating, justification: data.overrideJustification },
    });
  }
  await logAudit({
    action: 'CASE_SUBMITTED',
    caseId: kase.id,
    actorId: session.userId,
    fromStatus,
    toStatus,
    details: { riskScore: risk.score, finalRating },
  });

  revalidatePath('/cases');
  revalidatePath('/review');
  redirect(`/cases/${kase.id}`);
}

// ---------- documents ----------

const uploadSchema = z.object({
  caseId: z.string().min(1),
  docType: z.enum(DOC_TYPES),
});

export interface UploadResult {
  ok: boolean;
  error?: 'fileTooLarge' | 'fileTypeNotAllowed' | 'uploadFailed';
  doc?: { id: string; docType: DocType; fileName: string };
}

export async function uploadDocument(formData: FormData): Promise<UploadResult> {
  try {
    const parsed = uploadSchema.safeParse({
      caseId: formData.get('caseId'),
      docType: formData.get('docType'),
    });
    const file = formData.get('file');
    if (!parsed.success || !(file instanceof File)) return { ok: false, error: 'uploadFailed' };
    if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'fileTooLarge' };
    if (!(ALLOWED_UPLOAD_MIME as readonly string[]).includes(file.type)) {
      return { ok: false, error: 'fileTypeNotAllowed' };
    }

    const { session, kase } = await getEditableCase(parsed.data.caseId);
    const plain = Buffer.from(await file.arrayBuffer());
    const encrypted = encryptBuffer(plain);
    const hash = sha256(plain);

    const storageRoot = process.env.DOCUMENT_STORAGE_DIR ?? './storage/documents';
    const dir = path.join(storageRoot, kase.id);
    await mkdir(dir, { recursive: true });

    const doc = await prisma.document.create({
      data: {
        caseId: kase.id,
        docType: parsed.data.docType,
        fileName: file.name.slice(0, 255),
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath: '',
        sha256: hash,
        uploadedById: session.userId,
      },
    });
    const storagePath = path.join(dir, `${doc.id}.bin`);
    await writeFile(storagePath, encrypted);
    await prisma.document.update({ where: { id: doc.id }, data: { storagePath } });
    await logAudit({
      action: 'DOC_UPLOADED',
      caseId: kase.id,
      actorId: session.userId,
      details: { docType: parsed.data.docType, fileName: file.name, sha256: hash },
    });
    revalidatePath(`/cases/${kase.id}`);
    return { ok: true, doc: { id: doc.id, docType: parsed.data.docType, fileName: file.name } };
  } catch (e) {
    console.error('uploadDocument failed', e);
    return { ok: false, error: 'uploadFailed' };
  }
}

export async function deleteDocument(docId: string): Promise<{ ok: boolean }> {
  try {
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return { ok: false };
    const { session, kase } = await getEditableCase(doc.caseId);
    await prisma.document.delete({ where: { id: docId } });
    try {
      if (doc.storagePath) await unlink(doc.storagePath);
    } catch {
      // already gone
    }
    await logAudit({
      action: 'DOC_DELETED',
      caseId: kase.id,
      actorId: session.userId,
      details: { docType: doc.docType, fileName: doc.fileName },
    });
    revalidatePath(`/cases/${kase.id}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ---------- review decisions ----------

const decisionSchema = z.object({
  caseId: z.string().min(1),
  action: z.enum([
    'COMPLIANCE_APPROVE',
    'COMPLIANCE_REJECT',
    'COMPLIANCE_RETURN',
    'MANAGER_APPROVE',
    'MANAGER_REJECT',
  ]),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export interface DecisionResult {
  ok: boolean;
  error?: 'notesRequired' | 'decisionFailed';
}

export async function decideCase(formData: FormData): Promise<DecisionResult> {
  const parsed = decisionSchema.safeParse({
    caseId: formData.get('caseId'),
    action: formData.get('action'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) return { ok: false, error: 'decisionFailed' };
  const { caseId, action, notes } = parsed.data;

  const needsNotes = action.endsWith('REJECT') || action.endsWith('RETURN');
  if (needsNotes && !notes) return { ok: false, error: 'notesRequired' };

  const session = await requireSession(['COMPLIANCE_OFFICER', 'SENIOR_MANAGER']);
  const kase = await prisma.kycCase.findUnique({ where: { id: caseId } });
  if (!kase) return { ok: false, error: 'decisionFailed' };

  const fromStatus = kase.status as CaseStatus;
  let toStatus: CaseStatus;
  try {
    toStatus = transition(fromStatus, action as WorkflowAction, {
      role: session.role,
      isMaker: false,
      finalRiskRating: (kase.finalRiskRating ?? 'LOW') as RiskRating,
    });
  } catch (e) {
    console.error('decideCase transition rejected', e);
    return { ok: false, error: 'decisionFailed' };
  }

  const isCompliance = action.startsWith('COMPLIANCE');
  const escalated = action === 'COMPLIANCE_APPROVE' && toStatus === 'PENDING_MANAGER';
  const complianceDecision = escalated
    ? 'ESCALATED'
    : action === 'COMPLIANCE_APPROVE'
      ? 'APPROVED'
      : action === 'COMPLIANCE_REJECT'
        ? 'REJECTED'
        : 'RETURNED';

  await prisma.kycCase.update({
    where: { id: caseId },
    data: {
      status: toStatus,
      ...(isCompliance
        ? {
            checkerId: session.userId,
            complianceDecision,
            complianceNotes: notes || null,
            complianceAt: new Date(),
          }
        : {
            approverId: session.userId,
            managerDecision: action === 'MANAGER_APPROVE' ? 'APPROVED' : 'REJECTED',
            managerNotes: notes || null,
            managerAt: new Date(),
          }),
    },
  });

  const auditAction = escalated
    ? 'COMPLIANCE_ESCALATED'
    : (`${action.replace('APPROVE', 'APPROVED').replace('REJECT', 'REJECTED').replace('RETURN', 'RETURNED')}` as
        | 'COMPLIANCE_APPROVED'
        | 'COMPLIANCE_REJECTED'
        | 'COMPLIANCE_RETURNED'
        | 'MANAGER_APPROVED'
        | 'MANAGER_REJECTED');
  await logAudit({
    action: auditAction,
    caseId,
    actorId: session.userId,
    fromStatus,
    toStatus,
    details: notes ? { notes } : undefined,
  });

  revalidatePath(`/cases/${caseId}`);
  revalidatePath('/cases');
  revalidatePath('/review');
  revalidatePath('/approvals');
  return { ok: true };
}
