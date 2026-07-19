// Client-safe helpers (no Node crypto): build the corporate risk-engine input
// and FATF country exposures from form values. Mirrors risk-input.ts.

import type { FatfStatus } from '@/lib/constants';
import type { CorporateFormValues } from './corporate-schemas';
import type { CorporateRiskInput, CountryExposure } from '@/lib/risk/engine';
import type { FatfSettings } from './risk-input';

const toNum = (v: string | undefined | null) =>
  v === '' || v === null || v === undefined ? null : Number(v);

/** Which form fields carry country codes that must be FATF-screened. */
export function corporateCountryFieldsOf(v: CorporateFormValues): { field: string; code: string }[] {
  const out: { field: string; code: string }[] = [];
  const push = (field: string, code?: string | null) => {
    if (code) out.push({ field, code });
  };
  push('incorporationCountry', v.incorporationCountry);
  push('taxResidenceCountry', v.taxResidenceCountry);
  push('bank1Country', v.bank1Country);
  push('bank2Country', v.bank2Country);
  for (const s of v.subsidiaries ?? []) push('subsidiaries', s.residencyCountry);
  return out;
}

export function buildCorporateCountryExposures(
  v: CorporateFormValues,
  fatfByCode: Map<string, FatfStatus>,
  settings: FatfSettings,
): CountryExposure[] {
  return corporateCountryFieldsOf(v)
    .map(({ field, code }) => {
      const fatfStatus = fatfByCode.get(code) ?? 'NONE';
      const domesticExempt =
        fatfStatus === 'GREY' &&
        (code === settings.domesticCountryCode || !settings.greyListRequiresDocument);
      return { field, countryCode: code, fatfStatus, domesticExempt };
    })
    .filter((e) => e.fatfStatus !== 'NONE');
}

export function buildCorporateRiskInput(
  v: CorporateFormValues,
  fatfByCode: Map<string, FatfStatus>,
  settings: FatfSettings,
): CorporateRiskInput {
  return {
    countryExposures: buildCorporateCountryExposures(v, fatfByCode, settings),
    hasFatfDealings: v.hasFatfDealings,
    activityHighRisk: v.activityHighRisk,
    isPep: v.isPep,
    isRegulatedEntity: v.isRegulatedEntity,
    activityIncludesSecurities: v.activityIncludesSecurities,
    isDirectorOrMajorShareholderOfListed: v.isDirectorOrMajorShareholderOfListed,
    hasSignificantShareholding: v.hasSignificantShareholding,
    isRelatedParty: v.isRelatedParty,
    annualTurnoverKd: toNum(v.annualTurnoverKd),
    approxWealthKd: toNum(v.approxWealthKd),
  };
}
