// Shared draft sanitizer for the Individual KYC form — used by both the
// staff maker path (src/lib/cases/actions.ts) and the client self-service
// portal path (src/lib/portal/actions.ts). Coerces unknown input into a
// well-typed KycFormValues without enforcing business rules (those run at
// submit via kycFormSchema/submitExtraSchema).

import {
  FORM_TYPES,
  TITLES,
  EMPLOYMENT_STATUSES,
  MANAGER_TYPES,
  RISK_RATINGS,
  INCOME_SOURCES,
  PEP_POSITIONS,
  PREFERRED_CONTACTS,
} from '@/lib/constants';
import { defaultFormValues, type KycFormValues } from './schemas';

export function sanitizeDraft(raw: unknown): KycFormValues {
  const d = defaultFormValues();
  if (typeof raw !== 'object' || raw === null) return d;
  const input = raw as Record<string, unknown>;
  const out = { ...d } as Record<string, unknown>;

  const str = (v: unknown) => (typeof v === 'string' ? v.slice(0, 1000) : '');
  const bool = (v: unknown) => v === true;
  const strArray = (v: unknown, allowed?: readonly string[]) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string' && (!allowed || allowed.includes(x))).slice(0, 30)
      : [];
  const enumOr = <T extends string>(v: unknown, allowed: readonly T[], fallback: T | undefined) =>
    typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

  for (const key of Object.keys(d) as (keyof KycFormValues)[]) {
    const v = input[key];
    if (v === undefined) continue;
    const def = d[key];
    if (typeof def === 'boolean') out[key] = bool(v);
    else if (typeof def === 'string' || def === undefined) out[key] = str(v);
  }
  out.formType = enumOr(input.formType, FORM_TYPES, 'NEW_CLIENT');
  out.title = enumOr(input.title, TITLES, 'MR');
  out.employmentStatus = enumOr(input.employmentStatus, EMPLOYMENT_STATUSES, 'EMPLOYEE');
  out.managerType = enumOr(input.managerType, MANAGER_TYPES, undefined);
  out.preferredContact = enumOr(input.preferredContact, PREFERRED_CONTACTS, 'PERSONAL');
  out.overrideRating = enumOr(input.overrideRating, RISK_RATINGS, undefined) ?? '';
  out.otherNationalities = strArray(input.otherNationalities);
  out.sourcesOfIncome = strArray(input.sourcesOfIncome, INCOME_SOURCES);
  out.pepPositions = strArray(input.pepPositions, PEP_POSITIONS);
  out.relatedParties = Array.isArray(input.relatedParties)
    ? input.relatedParties
        .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
        .map((p) => ({
          name: str(p.name),
          relationship: str(p.relationship),
          relativeRelation: str(p.relativeRelation),
        }))
        .slice(0, 20)
    : [];
  return out as unknown as KycFormValues;
}
