// Risk scoring engine — pure and unit-testable. All thresholds/weights live here.
// Rating: HIGH >= 50, MEDIUM >= 25, else LOW. Maker may only raise the final rating.
// Two entry points share the same country-exposure + rating logic: assessRisk
// (individuals) and assessCorporateRisk (corporates).

import type { EmploymentStatus, FatfStatus, IncomeSource, RiskRating } from '@/lib/constants';

export const RISK_THRESHOLDS = { HIGH: 50, MEDIUM: 25 } as const;

export const RISK_POINTS = {
  COUNTRY_BLACKLIST: 50,
  COUNTRY_GREYLIST: 25,
  PEP_SELF: 50,
  PEP_RELATIVE: 30,
  MANAGED_BY_OTHER: 15,
  UNEMPLOYED: 15,
  SELF_EMPLOYED: 10,
  INCOME_TRADE_OR_OTHER: 10,
  INCOME_INHERITANCE: 5,
  HIGH_WEALTH: 10,
  RELATED_PARTY: 15,
} as const;

export const HIGH_ANNUAL_INCOME_KD = 100_000;
export const HIGH_WEALTH_KD = 1_000_000;

export const CORPORATE_RISK_POINTS = {
  FATF_DEALINGS: 50, // self-disclosed dealings in a FATF call-for-action/monitored jurisdiction
  HIGH_RISK_ACTIVITY: 25, // arms, precious metals, virtual currencies, gambling, real estate brokerage, etc.
  PEP: 50,
  NOT_REGULATED_SECURITIES: 10, // deals in securities but is not a regulated/supervised entity
  COMPANY_CONTROL_LINK: 15, // director/major shareholder of a listed co., or 10%+ shareholder of the institution
  RELATED_PARTY: 15,
  HIGH_FINANCIALS: 10,
} as const;

export const HIGH_CORPORATE_TURNOVER_KD = 1_000_000;
export const HIGH_CORPORATE_WEALTH_KD = 5_000_000;

/** A country referenced somewhere on the form, with its FATF classification. */
export interface CountryExposure {
  /** which form field referenced it, e.g. "nationality", "residenceCountry" */
  field: string;
  countryCode: string;
  fatfStatus: FatfStatus;
  /** true when the grey-list document requirement is waived (domestic country) */
  domesticExempt: boolean;
}

export interface RiskFactor {
  /** i18n key under risk.factors.* */
  key: string;
  points: number;
  /** extra context, e.g. the country codes that triggered it */
  detail?: string;
}

export interface RiskResult {
  score: number;
  rating: RiskRating;
  factors: RiskFactor[];
  /** exposures that demand a source-of-funds supporting document */
  flaggedCountries: CountryExposure[];
  requiresSourceOfFundsDoc: boolean;
}

export function ratingFromScore(score: number): RiskRating {
  if (score >= RISK_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

/**
 * Score the single worst country exposure (blacklist beats greylist; multiple
 * greylist hits still only count once). Shared by individual and corporate
 * assessments so "worst country wins" stays consistent across both.
 */
function scoreCountryExposure(exposures: CountryExposure[]): {
  factor: RiskFactor | null;
  flaggedCountries: CountryExposure[];
} {
  const black = exposures.filter((e) => e.fatfStatus === 'BLACK');
  const grey = exposures.filter((e) => e.fatfStatus === 'GREY' && !e.domesticExempt);

  if (black.length > 0) {
    return {
      factor: {
        key: 'countryBlacklist',
        points: RISK_POINTS.COUNTRY_BLACKLIST,
        detail: [...new Set(black.map((e) => e.countryCode))].join(', '),
      },
      flaggedCountries: [...black, ...grey],
    };
  }
  if (grey.length > 0) {
    return {
      factor: {
        key: 'countryGreylist',
        points: RISK_POINTS.COUNTRY_GREYLIST,
        detail: [...new Set(grey.map((e) => e.countryCode))].join(', '),
      },
      flaggedCountries: grey,
    };
  }
  return { factor: null, flaggedCountries: [] };
}

export interface RiskInput {
  countryExposures: CountryExposure[];
  isPep: boolean;
  hasPepRelative: boolean;
  isManagedByOther: boolean;
  employmentStatus?: EmploymentStatus | null;
  sourcesOfIncome: IncomeSource[];
  annualIncomeKd?: number | null;
  approxWealthKd?: number | null;
  isRelatedParty: boolean;
  hasControl: boolean;
  isBoardMember: boolean;
}

export function assessRisk(input: RiskInput): RiskResult {
  const factors: RiskFactor[] = [];

  const country = scoreCountryExposure(input.countryExposures);
  if (country.factor) factors.push(country.factor);

  if (input.isPep) {
    factors.push({ key: 'pepSelf', points: RISK_POINTS.PEP_SELF });
  }
  if (input.hasPepRelative) {
    factors.push({ key: 'pepRelative', points: RISK_POINTS.PEP_RELATIVE });
  }
  if (input.isManagedByOther) {
    factors.push({ key: 'managedByOther', points: RISK_POINTS.MANAGED_BY_OTHER });
  }

  if (input.employmentStatus === 'UNEMPLOYED') {
    factors.push({ key: 'unemployed', points: RISK_POINTS.UNEMPLOYED });
  } else if (input.employmentStatus === 'SELF_EMPLOYED') {
    factors.push({ key: 'selfEmployed', points: RISK_POINTS.SELF_EMPLOYED });
  }

  if (
    input.sourcesOfIncome.includes('TRADE_BUSINESS') ||
    input.sourcesOfIncome.includes('OTHER')
  ) {
    factors.push({ key: 'incomeTradeOrOther', points: RISK_POINTS.INCOME_TRADE_OR_OTHER });
  }
  if (input.sourcesOfIncome.includes('INHERITANCE')) {
    factors.push({ key: 'incomeInheritance', points: RISK_POINTS.INCOME_INHERITANCE });
  }

  if (
    (input.annualIncomeKd ?? 0) > HIGH_ANNUAL_INCOME_KD ||
    (input.approxWealthKd ?? 0) > HIGH_WEALTH_KD
  ) {
    factors.push({ key: 'highWealth', points: RISK_POINTS.HIGH_WEALTH });
  }

  if (input.isRelatedParty || input.hasControl || input.isBoardMember) {
    factors.push({ key: 'relatedParty', points: RISK_POINTS.RELATED_PARTY });
  }

  const score = factors.reduce((sum, f) => sum + f.points, 0);

  return {
    score,
    rating: ratingFromScore(score),
    factors,
    flaggedCountries: country.flaggedCountries,
    requiresSourceOfFundsDoc: country.flaggedCountries.length > 0,
  };
}

export interface CorporateRiskInput {
  countryExposures: CountryExposure[];
  hasFatfDealings: boolean;
  activityHighRisk: boolean;
  isPep: boolean;
  isRegulatedEntity: boolean;
  activityIncludesSecurities: boolean;
  isDirectorOrMajorShareholderOfListed: boolean;
  hasSignificantShareholding: boolean;
  isRelatedParty: boolean;
  annualTurnoverKd?: number | null;
  approxWealthKd?: number | null;
}

export function assessCorporateRisk(input: CorporateRiskInput): RiskResult {
  const factors: RiskFactor[] = [];

  const country = scoreCountryExposure(input.countryExposures);
  if (country.factor) factors.push(country.factor);

  // Self-disclosed FATF dealings is the strongest possible corporate signal —
  // the entity is telling us it transacts with a monitored/high-risk jurisdiction.
  if (input.hasFatfDealings) {
    factors.push({ key: 'fatfDealings', points: CORPORATE_RISK_POINTS.FATF_DEALINGS });
  }
  if (input.activityHighRisk) {
    factors.push({ key: 'highRiskActivity', points: CORPORATE_RISK_POINTS.HIGH_RISK_ACTIVITY });
  }
  if (input.isPep) {
    factors.push({ key: 'pepSelf', points: CORPORATE_RISK_POINTS.PEP });
  }
  if (input.activityIncludesSecurities && !input.isRegulatedEntity) {
    factors.push({
      key: 'notRegulatedSecurities',
      points: CORPORATE_RISK_POINTS.NOT_REGULATED_SECURITIES,
    });
  }
  if (input.isDirectorOrMajorShareholderOfListed || input.hasSignificantShareholding) {
    factors.push({
      key: 'companyControlLink',
      points: CORPORATE_RISK_POINTS.COMPANY_CONTROL_LINK,
    });
  }
  if (input.isRelatedParty) {
    factors.push({ key: 'relatedParty', points: CORPORATE_RISK_POINTS.RELATED_PARTY });
  }
  if (
    (input.annualTurnoverKd ?? 0) > HIGH_CORPORATE_TURNOVER_KD ||
    (input.approxWealthKd ?? 0) > HIGH_CORPORATE_WEALTH_KD
  ) {
    factors.push({ key: 'highWealth', points: CORPORATE_RISK_POINTS.HIGH_FINANCIALS });
  }

  const score = factors.reduce((sum, f) => sum + f.points, 0);

  return {
    score,
    rating: ratingFromScore(score),
    factors,
    flaggedCountries: country.flaggedCountries,
    requiresSourceOfFundsDoc: country.flaggedCountries.length > 0,
  };
}

/**
 * Final rating = the higher of system rating and maker's override.
 * Overrides below the system rating are rejected.
 */
export function resolveFinalRating(
  systemRating: RiskRating,
  makerRating: RiskRating | null | undefined,
): { finalRating: RiskRating; overridden: boolean } {
  const order: Record<RiskRating, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  if (!makerRating || order[makerRating] === order[systemRating]) {
    return { finalRating: systemRating, overridden: false };
  }
  if (order[makerRating] < order[systemRating]) {
    throw new Error('Risk rating cannot be lowered below the system rating');
  }
  return { finalRating: makerRating, overridden: true };
}
