'use server';

// Client self-service portal: register/login/logout, document upload, and
// e-signature. Deliberately separate from src/lib/cases/actions.ts — the
// portal is a different trust boundary (ClientUser, not staff User) with a
// narrower capability set (review, upload, sign — never edit KYC data).

import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { rateLimit, clearRateLimit } from '@/lib/rate-limit';
import { encryptBuffer, sha256 } from '@/lib/crypto';
import { nextCaseNumber, loadFatfContext } from '@/lib/cases/actions';
import { kycFormSchema, submitExtraSchema, type KycFormValues } from '@/lib/cases/schemas';
import { sanitizeDraft } from '@/lib/cases/sanitize';
import { formToProfileData, buildRiskInput } from '@/lib/cases/mappers';
import { assessRisk, resolveFinalRating } from '@/lib/risk/engine';
import {
  createClientSessionToken,
  getClientSession,
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_HOURS,
  type ClientSessionUser,
} from '@/lib/auth/client-session';
import { SECURE_COOKIES } from '@/lib/auth/session';
import {
  ALLOWED_UPLOAD_MIME,
  MAX_UPLOAD_BYTES,
  DOC_TYPES,
  type DocType,
  type CaseStatus,
  type RiskRating,
} from '@/lib/constants';

async function setClientSessionCookie(user: ClientSessionUser) {
  const token = await createClientSessionToken(user);
  const store = await cookies();
  store.set(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: SECURE_COOKIES,
    path: '/',
    maxAge: CLIENT_SESSION_HOURS * 60 * 60,
  });
}

// ---------- registration ----------

const registerSchema = z.object({
  nameEn: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

export interface RegisterState {
  error?: 'emailTaken' | 'invalidInput' | 'rateLimited';
}

export async function registerClient(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    nameEn: formData.get('nameEn'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'invalidInput' };
  const { nameEn, email, password } = parsed.data;

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`portal-register:${ip}`, { max: 5, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return { error: 'rateLimited' };

  const existing = await prisma.clientUser.findUnique({ where: { email } });
  if (existing) return { error: 'emailTaken' };

  const passwordHash = bcrypt.hashSync(password, 12);
  const user = await prisma.clientUser.create({ data: { email, passwordHash, nameEn, nameAr: '' } });

  await setClientSessionCookie({ clientUserId: user.id, email: user.email, nameEn: user.nameEn, nameAr: user.nameAr });
  await logAudit({ action: 'CLIENT_REGISTERED', clientActorId: user.id });
  redirect('/portal');
}

// ---------- login / logout ----------

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export interface ClientLoginState {
  error?: 'invalidCredentials' | 'accountDisabled' | 'rateLimited';
}

export async function clientLogin(_prev: ClientLoginState, formData: FormData): Promise<ClientLoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: 'invalidCredentials' };
  const { email, password } = parsed.data;

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limitKey = `portal-login:${ip}:${email}`;
  const limit = rateLimit(limitKey, { max: 5, windowMs: 5 * 60 * 1000 });
  if (!limit.allowed) return { error: 'rateLimited' };

  const user = await prisma.clientUser.findUnique({ where: { email } });
  // Constant-shape comparison even when the user doesn't exist.
  const passwordOk = user
    ? bcrypt.compareSync(password, user.passwordHash)
    : (bcrypt.compareSync(password, '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZDzcyC5.z1Z1lM8nWn8mDR9V0nOhOG'), false);

  if (!user || !passwordOk) {
    await logAudit({ action: 'CLIENT_LOGIN_FAILED', details: { email } });
    return { error: 'invalidCredentials' };
  }
  if (!user.active) {
    await logAudit({ action: 'CLIENT_LOGIN_FAILED', clientActorId: user.id, details: { reason: 'disabled' } });
    return { error: 'accountDisabled' };
  }

  clearRateLimit(limitKey);
  await setClientSessionCookie({ clientUserId: user.id, email: user.email, nameEn: user.nameEn, nameAr: user.nameAr });
  await logAudit({ action: 'CLIENT_LOGIN_SUCCESS', clientActorId: user.id });
  redirect('/portal');
}

export async function clientLogout(): Promise<void> {
  const store = await cookies();
  const session = await getClientSession();
  store.delete(CLIENT_SESSION_COOKIE);
  if (session) await logAudit({ action: 'CLIENT_LOGOUT', clientActorId: session.clientUserId });
  redirect('/portal/login');
}

// ---------- shared: case ownership check ----------

// A case is "owned" by the client either because they self-created it
// (clientMakerId) or because it's a staff-created case matched to them by
// email (clientEmail). Used for read/upload/sign — NOT for editing, which
// requires the stricter clientMakerId-only check below (a client must never
// edit a case just because an email happens to coincide).
async function getOwnedCase(caseId: string, session: ClientSessionUser) {
  const kase = await prisma.kycCase.findUnique({ where: { id: caseId } });
  if (!kase) return null;
  const owns = kase.clientMakerId === session.clientUserId || kase.clientEmail === session.email;
  return owns ? kase : null;
}

// Strict ownership for editing: only the client who created the case may
// edit it, and only while it's still DRAFT or RETURNED (mirrors canEditCase
// in src/lib/workflow.ts, which is staff-role-shaped and not reusable here).
function isClientEditable(status: CaseStatus): boolean {
  return status === 'DRAFT' || status === 'RETURNED';
}

async function getOwnedEditableCase(caseId: string, session: ClientSessionUser) {
  const kase = await prisma.kycCase.findUnique({ where: { id: caseId } });
  if (!kase || kase.clientMakerId !== session.clientUserId) return null;
  if (!isClientEditable(kase.status as CaseStatus)) return null;
  return kase;
}

// Upload/sign eligibility for getOwnedCase()-scoped cases. DRAFT means two
// different things depending on origin: for a self-created case it's the
// client's own in-progress draft (fully theirs to act on); for a
// staff-created case it means front office hasn't submitted it yet (nothing
// for the client to do). APPROVED/REJECTED are always closed either way.
function clientCanActOnCase(
  kase: { status: string; clientMakerId: string | null },
  session: ClientSessionUser,
): boolean {
  const status = kase.status as CaseStatus;
  if (status === 'APPROVED' || status === 'REJECTED') return false;
  if (status === 'DRAFT') return kase.clientMakerId === session.clientUserId;
  return true;
}

// ---------- document upload ----------

const uploadSchema = z.object({ caseId: z.string().min(1), docType: z.enum(DOC_TYPES) });

export interface ClientUploadResult {
  ok: boolean;
  error?: 'fileTooLarge' | 'fileTypeNotAllowed' | 'uploadFailed' | 'notFound' | 'caseClosed';
  doc?: { id: string; docType: DocType; fileName: string };
}

export async function uploadClientDocument(formData: FormData): Promise<ClientUploadResult> {
  try {
    const session = await getClientSession();
    if (!session) return { ok: false, error: 'notFound' };

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

    const kase = await getOwnedCase(parsed.data.caseId, session);
    if (!kase) return { ok: false, error: 'notFound' };
    if (!clientCanActOnCase(kase, session)) return { ok: false, error: 'caseClosed' };

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
        uploadedByClientId: session.clientUserId,
      },
    });
    const storagePath = path.join(dir, `${doc.id}.bin`);
    await writeFile(storagePath, encrypted);
    await prisma.document.update({ where: { id: doc.id }, data: { storagePath } });
    await logAudit({
      action: 'CLIENT_DOC_UPLOADED',
      caseId: kase.id,
      clientActorId: session.clientUserId,
      details: { docType: parsed.data.docType, fileName: file.name, sha256: hash },
    });
    revalidatePath(`/portal/cases/${kase.id}`);
    return { ok: true, doc: { id: doc.id, docType: parsed.data.docType, fileName: file.name } };
  } catch (e) {
    console.error('uploadClientDocument failed', e);
    return { ok: false, error: 'uploadFailed' };
  }
}

// ---------- e-signature ----------

const signSchema = z.object({
  caseId: z.string().min(1),
  signatureName: z.string().trim().min(2).max(200),
});

export interface SignState {
  ok?: boolean;
  error?: 'notFound' | 'caseClosed' | 'invalidInput';
}

export async function signKycCase(_prev: SignState, formData: FormData): Promise<SignState> {
  const session = await getClientSession();
  if (!session) return { error: 'notFound' };

  const parsed = signSchema.safeParse({
    caseId: formData.get('caseId'),
    signatureName: formData.get('signatureName'),
  });
  if (!parsed.success) return { error: 'invalidInput' };

  const kase = await getOwnedCase(parsed.data.caseId, session);
  if (!kase) return { error: 'notFound' };
  if (!clientCanActOnCase(kase, session)) return { error: 'caseClosed' };

  await prisma.kycCase.update({
    where: { id: kase.id },
    data: { clientSignedAt: new Date(), clientSignatureName: parsed.data.signatureName },
  });
  await logAudit({
    action: 'CLIENT_SIGNED',
    caseId: kase.id,
    clientActorId: session.clientUserId,
    details: { signatureName: parsed.data.signatureName },
  });
  revalidatePath(`/portal/cases/${kase.id}`);
  return { ok: true };
}

// ---------- self-service case creation (Individual KYC only) ----------
//
// A client can start and fill in their own Individual KYC from scratch —
// distinct from the original review/upload/sign flow for staff-created
// cases. The wizard UI (PortalKycWizard) never shows the computed risk
// score/rating/factors or the maker risk-override control to the client;
// those stay compliance-internal. Submitting auto-stamps clientSignedAt/
// clientSignatureName using the portal account's own name — the client
// typed and declared the whole form themselves, so that declaration IS
// their signature; no separate "type your name" step is needed here (unlike
// the staff-created flow, where SignPanel provides that missing step).

export async function createClientCase(): Promise<void> {
  const session = await getClientSession();
  if (!session) redirect('/portal/login');

  const caseNumber = await nextCaseNumber();
  const kase = await prisma.kycCase.create({
    data: {
      caseNumber,
      clientType: 'INDIVIDUAL',
      formType: 'NEW_CLIENT',
      status: 'DRAFT',
      clientMakerId: session.clientUserId,
      clientEmail: session.email,
      profile: { create: {} },
    },
  });
  await logAudit({
    action: 'CASE_CREATED',
    caseId: kase.id,
    clientActorId: session.clientUserId,
    toStatus: 'DRAFT',
    details: { caseNumber, formType: 'NEW_CLIENT', clientType: 'INDIVIDUAL' },
  });
  redirect(`/portal/cases/${kase.id}/edit`);
}

async function computeAndStoreClientRisk(caseId: string, values: KycFormValues) {
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

export interface ClientCaseSaveResult {
  ok: boolean;
  error?: string;
  risk?: { requiresSourceOfFundsDoc: boolean };
}

/** Autosave a client-authored draft. Never exposes the computed score/rating. */
export async function saveClientCaseDraft(caseId: string, rawValues: unknown): Promise<ClientCaseSaveResult> {
  try {
    const session = await getClientSession();
    if (!session) return { ok: false, error: 'notFound' };
    const kase = await getOwnedEditableCase(caseId, session);
    if (!kase) return { ok: false, error: 'notFound' };

    const values = sanitizeDraft(rawValues);
    await prisma.kycProfile.update({ where: { caseId: kase.id }, data: formToProfileData(values) });
    await prisma.kycCase.update({
      where: { id: kase.id },
      data: { clientEmail: values.email ? values.email.trim().toLowerCase() : session.email },
    });
    const risk = await computeAndStoreClientRisk(kase.id, values);
    await logAudit({ action: 'CASE_UPDATED', caseId: kase.id, clientActorId: session.clientUserId });
    return { ok: true, risk: { requiresSourceOfFundsDoc: risk.requiresSourceOfFundsDoc } };
  } catch (e) {
    console.error('saveClientCaseDraft failed', e);
    return { ok: false, error: 'saveFailed' };
  }
}

export interface ClientCaseSubmitResult {
  ok: boolean;
  fieldErrors?: Record<string, string>;
  missingDocs?: DocType[];
  error?: string;
}

export async function submitClientCase(caseId: string, rawValues: unknown): Promise<ClientCaseSubmitResult> {
  const session = await getClientSession();
  if (!session) return { ok: false, error: 'notFound' };
  const kase = await getOwnedEditableCase(caseId, session);
  if (!kase) return { ok: false, error: 'notFound' };
  const values = sanitizeDraft(rawValues);

  // 1. Full business validation — same rules as the staff-side wizard.
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

  // 2. Risk assessment + FATF screening (computed and stored, never shown to the client)
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

  // 4. A self-filed case has no maker to raise the rating — always the system rating.
  const finalRating: RiskRating = resolveFinalRating(risk.rating, null).finalRating;

  // 5. Persist + transition. Submitting a self-authored form is the client's
  // attestation — stamp the e-signature automatically (see comment above).
  const fromStatus = kase.status as CaseStatus;
  await prisma.$transaction([
    prisma.kycProfile.update({ where: { caseId: kase.id }, data: formToProfileData(data) }),
    prisma.kycCase.update({
      where: { id: kase.id },
      data: {
        clientEmail: data.email.trim().toLowerCase(),
        status: 'PENDING_COMPLIANCE',
        submittedAt: new Date(),
        systemRiskScore: risk.score,
        systemRiskRating: risk.rating,
        riskFactorsJson: JSON.stringify(risk.factors),
        finalRiskRating: finalRating,
        overrideJustification: null,
        clientSignedAt: new Date(),
        clientSignatureName: session.nameEn,
        // resubmission clears the previous review round
        complianceDecision: null,
        complianceNotes: null,
        complianceAt: null,
        checkerId: null,
      },
    }),
  ]);

  await logAudit({
    action: 'CASE_SUBMITTED',
    caseId: kase.id,
    clientActorId: session.clientUserId,
    fromStatus,
    toStatus: 'PENDING_COMPLIANCE',
    details: { riskScore: risk.score, finalRating },
  });
  await logAudit({
    action: 'CLIENT_SIGNED',
    caseId: kase.id,
    clientActorId: session.clientUserId,
    details: { signatureName: session.nameEn, auto: true },
  });

  revalidatePath('/portal');
  revalidatePath(`/portal/cases/${kase.id}`);
  redirect(`/portal/cases/${kase.id}`);
}
