'use server';

// Corporate KYC save/submit — mirrors actions.ts's individual saveCaseDraft/submitCase.
// Document upload/download, deletion, and compliance/manager decisions are
// clientType-agnostic and already handled by the shared functions in actions.ts.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';
import { assessCorporateRisk, resolveFinalRating } from '@/lib/risk/engine';
import { canEditCase, transition } from '@/lib/workflow';
import {
  FORM_TYPES,
  COMPANY_TYPES,
  CORPORATE_INCOME_SOURCES,
  CORRESPONDENCE_METHODS,
  EXPERIENCE_YEARS,
  INVESTMENT_EXPERIENCES,
  INVESTMENT_PERIODS,
  INVESTMENT_PURPOSES,
  INVESTMENT_TYPES,
  CLIENT_CATEGORIES,
  PEP_POSITIONS,
  RISK_RATINGS,
  TRANSACTION_BANDS,
  type CaseStatus,
  type DocType,
  type RiskRating,
} from '@/lib/constants';
import {
  corporateFormSchema,
  corporateSubmitExtraSchema,
  defaultCorporateFormValues,
  type CorporateFormValues,
} from './corporate-schemas';
import { corporateFormToProfileData, buildCorporateRiskInput } from './corporate-mappers';
import { loadFatfContext } from './actions';

/** Load a corporate case and assert the current user may still edit it. */
async function getEditableCorporateCase(caseId: string) {
  const session = await requireSession(['FRONT_OFFICE']);
  const kase = await prisma.kycCase.findUnique({
    where: { id: caseId },
    include: { corporateProfile: true },
  });
  if (!kase) throw new Error('Case not found');
  const isMaker = kase.makerId === session.userId;
  if (!canEditCase(kase.status as CaseStatus, session.role, isMaker)) {
    throw new Error('Case is not editable');
  }
  return { session, kase };
}

// Drafts may be incomplete: coerce unknown input into a well-typed
// CorporateFormValues without enforcing business rules (those run at submit).
function sanitizeCorporateDraft(raw: unknown): CorporateFormValues {
  const d = defaultCorporateFormValues();
  if (typeof raw !== 'object' || raw === null) return d;
  const input = raw as Record<string, unknown>;
  const out = { ...d } as Record<string, unknown>;

  const str = (v: unknown) => (typeof v === 'string' ? v.slice(0, 1000) : '');
  const bool = (v: unknown) => v === true;
  const strArray = (v: unknown, allowed?: readonly string[]) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string' && (!allowed || allowed.includes(x))).slice(0, 30)
      : [];
  const enumOr = <T extends string>(v: unknown, allowed: readonly T[], fallback: T) =>
    typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  const objArray = <T extends Record<string, unknown>>(
    v: unknown,
    build: (o: Record<string, unknown>) => T,
    max = 20,
  ): T[] =>
    Array.isArray(v)
      ? v
          .filter((o): o is Record<string, unknown> => typeof o === 'object' && o !== null)
          .map(build)
          .slice(0, max)
      : [];

  for (const key of Object.keys(d) as (keyof CorporateFormValues)[]) {
    const v = input[key];
    if (v === undefined) continue;
    const def = d[key];
    if (typeof def === 'boolean') out[key] = bool(v);
    else if (typeof def === 'string') out[key] = str(v);
  }

  out.formType = enumOr(input.formType, FORM_TYPES, 'NEW_CLIENT');
  out.companyType = enumOr(input.companyType, COMPANY_TYPES, 'GENERAL_SHAREHOLDING');
  out.correspondenceMethod = enumOr(input.correspondenceMethod, CORRESPONDENCE_METHODS, 'EMAIL');
  out.expectedInvestmentPeriod = enumOr(input.expectedInvestmentPeriod, INVESTMENT_PERIODS, 'MEDIUM');
  out.expectedTransactionBand = enumOr(input.expectedTransactionBand, TRANSACTION_BANDS, 'BELOW_150K');
  out.riskTolerance = enumOr(input.riskTolerance, ['HIGH', 'MEDIUM', 'LOW'] as const, 'MEDIUM');
  out.investmentExperience = enumOr(input.investmentExperience, INVESTMENT_EXPERIENCES, 'GOOD');
  out.yearsOfExperience = enumOr(input.yearsOfExperience, EXPERIENCE_YEARS, 'ONE_TO_FIVE');
  out.clientCategory = enumOr(input.clientCategory, CLIENT_CATEGORIES, 'RETAIL');
  out.overrideRating = (typeof input.overrideRating === 'string' &&
  (RISK_RATINGS as readonly string[]).includes(input.overrideRating)
    ? input.overrideRating
    : '') as CorporateFormValues['overrideRating'];

  out.sourcesOfIncome = strArray(input.sourcesOfIncome, CORPORATE_INCOME_SOURCES);
  out.investmentPurpose = strArray(input.investmentPurpose, INVESTMENT_PURPOSES);
  out.investmentTypes = strArray(input.investmentTypes, INVESTMENT_TYPES);
  out.pepPositions = strArray(input.pepPositions, PEP_POSITIONS);
  out.incomeSourcesUsed = strArray(input.incomeSourcesUsed);

  out.authorizedSignatories = objArray(input.authorizedSignatories, (o) => ({ name: str(o.name) }));
  out.boardOfDirectors = objArray(input.boardOfDirectors, (o) => ({
    name: str(o.name),
    nationality: str(o.nationality),
    position: str(o.position),
    representation: str(o.representation),
  }));
  out.executiveManagement = objArray(input.executiveManagement, (o) => ({
    name: str(o.name),
    nationality: str(o.nationality),
    position: str(o.position),
  }));
  out.subsidiaries = objArray(input.subsidiaries, (o) => ({
    companyName: str(o.companyName),
    residencyCountry: str(o.residencyCountry),
    registerNumber: str(o.registerNumber),
    activity: str(o.activity),
    ownershipPercentage: str(o.ownershipPercentage),
  }));
  out.contactPersons = objArray(input.contactPersons, (o) => ({ name: str(o.name), tel: str(o.tel) }), 5);
  out.significantInterestPersons = objArray(input.significantInterestPersons, (o) => ({ name: str(o.name) }), 5);
  out.controllingPersons = objArray(input.controllingPersons, (o) => ({ name: str(o.name) }), 5);

  return out as unknown as CorporateFormValues;
}

async function computeAndStoreCorporateRisk(caseId: string, values: CorporateFormValues) {
  const { fatfByCode, settings } = await loadFatfContext();
  const result = assessCorporateRisk(buildCorporateRiskInput(values, fatfByCode, settings));
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

export interface SaveResult {
  ok: boolean;
  error?: string;
  risk?: { score: number; rating: RiskRating; requiresSourceOfFundsDoc: boolean };
}

/** Autosave a corporate draft (no business validation — that happens at submit). */
export async function saveCorporateCaseDraft(caseId: string, rawValues: unknown): Promise<SaveResult> {
  try {
    const { session, kase } = await getEditableCorporateCase(caseId);
    const values = sanitizeCorporateDraft(rawValues);
    await prisma.corporateProfile.update({
      where: { caseId: kase.id },
      data: corporateFormToProfileData(values),
    });
    await prisma.kycCase.update({
      where: { id: kase.id },
      data: {
        formType: values.formType,
        clientNo: values.clientNo || null,
        clientEmail: values.email ? values.email.trim().toLowerCase() : null,
      },
    });
    const risk = await computeAndStoreCorporateRisk(kase.id, values);
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
    console.error('saveCorporateCaseDraft failed', e);
    return { ok: false, error: 'saveFailed' };
  }
}

export interface SubmitResult {
  ok: boolean;
  fieldErrors?: Record<string, string>;
  missingDocs?: DocType[];
  error?: string;
}

export async function submitCorporateCase(caseId: string, rawValues: unknown): Promise<SubmitResult> {
  const { session, kase } = await getEditableCorporateCase(caseId);
  const values = sanitizeCorporateDraft(rawValues);

  // 1. Full business validation
  const parsed = corporateFormSchema.safeParse(values);
  const extra = corporateSubmitExtraSchema.safeParse(values);
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
  const risk = assessCorporateRisk(buildCorporateRiskInput(data, fatfByCode, settings));

  // 3. Required documents
  const docs = await prisma.document.findMany({ where: { caseId: kase.id }, select: { docType: true } });
  const have = new Set(docs.map((d) => d.docType));
  const missingDocs: DocType[] = [];
  if (risk.requiresSourceOfFundsDoc && !have.has('SOURCE_OF_FUNDS')) missingDocs.push('SOURCE_OF_FUNDS');
  if (!have.has('COMMERCIAL_LICENSE')) missingDocs.push('COMMERCIAL_LICENSE');
  if (!have.has('MEMORANDUM_ARTICLES')) missingDocs.push('MEMORANDUM_ARTICLES');
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
    prisma.corporateProfile.update({ where: { caseId: kase.id }, data: corporateFormToProfileData(data) }),
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
