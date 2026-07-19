// Client-safe helpers (no Node crypto): build the risk-engine input and FATF
// country exposures from form values. Used by the wizard for live feedback and
// by the server for the authoritative assessment.

import type { FatfStatus } from '@/lib/constants';
import type { KycFormValues } from './schemas';
import type { CountryExposure, RiskInput } from '@/lib/risk/engine';

const toNum = (v: string | undefined | null) =>
  v === '' || v === null || v === undefined ? null : Number(v);

/** Which form fields carry country codes that must be FATF-screened. */
export function countryFieldsOf(v: KycFormValues): { field: string; code: string }[] {
  const out: { field: string; code: string }[] = [];
  const push = (field: string, code?: string | null) => {
    if (code) out.push({ field, code });
  };
  push('nationality', v.nationality);
  for (const c of v.otherNationalities ?? []) push('otherNationalities', c);
  push('countryOfBirth', v.countryOfBirth);
  push('otherResidencyCountry', v.otherResidencyCountry);
  push('residenceCountry', v.residenceCountry);
  push('bankCountry', v.bankCountry);
  if (v.isManagedByOther) push('boNationality', v.boNationality);
  return out;
}

export interface FatfSettings {
  domesticCountryCode: string;
  greyListRequiresDocument: boolean;
}

export function buildCountryExposures(
  v: KycFormValues,
  fatfByCode: Map<string, FatfStatus>,
  settings: FatfSettings,
): CountryExposure[] {
  return countryFieldsOf(v)
    .map(({ field, code }) => {
      const fatfStatus = fatfByCode.get(code) ?? 'NONE';
      const domesticExempt =
        fatfStatus === 'GREY' &&
        (code === settings.domesticCountryCode || !settings.greyListRequiresDocument);
      return { field, countryCode: code, fatfStatus, domesticExempt };
    })
    .filter((e) => e.fatfStatus !== 'NONE');
}

export function buildRiskInput(
  v: KycFormValues,
  fatfByCode: Map<string, FatfStatus>,
  settings: FatfSettings,
): RiskInput {
  return {
    countryExposures: buildCountryExposures(v, fatfByCode, settings),
    isPep: v.isPep,
    hasPepRelative: v.hasPepRelative,
    isManagedByOther: v.isManagedByOther,
    employmentStatus: v.employmentStatus,
    sourcesOfIncome: v.sourcesOfIncome ?? [],
    annualIncomeKd: toNum(v.annualIncomeKd),
    approxWealthKd: toNum(v.approxWealthKd),
    isRelatedParty: v.isRelatedParty,
    hasControl: v.hasControl,
    isBoardMember: v.isBoardMember,
  };
}
