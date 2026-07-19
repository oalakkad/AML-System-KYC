import { describe, it, expect } from 'vitest';
import {
  assessRisk,
  assessCorporateRisk,
  ratingFromScore,
  resolveFinalRating,
  RISK_POINTS,
  CORPORATE_RISK_POINTS,
  type RiskInput,
  type CorporateRiskInput,
} from './engine';

function baseCorporateInput(overrides: Partial<CorporateRiskInput> = {}): CorporateRiskInput {
  return {
    countryExposures: [],
    hasFatfDealings: false,
    activityHighRisk: false,
    isPep: false,
    isRegulatedEntity: true,
    activityIncludesSecurities: false,
    isDirectorOrMajorShareholderOfListed: false,
    hasSignificantShareholding: false,
    isRelatedParty: false,
    annualTurnoverKd: 200_000,
    approxWealthKd: 500_000,
    ...overrides,
  };
}

function baseInput(overrides: Partial<RiskInput> = {}): RiskInput {
  return {
    countryExposures: [],
    isPep: false,
    hasPepRelative: false,
    isManagedByOther: false,
    employmentStatus: 'EMPLOYEE',
    sourcesOfIncome: ['SALARY'],
    annualIncomeKd: 12000,
    approxWealthKd: 50000,
    isRelatedParty: false,
    hasControl: false,
    isBoardMember: false,
    ...overrides,
  };
}

describe('ratingFromScore', () => {
  it('maps scores to bands', () => {
    expect(ratingFromScore(0)).toBe('LOW');
    expect(ratingFromScore(24)).toBe('LOW');
    expect(ratingFromScore(25)).toBe('MEDIUM');
    expect(ratingFromScore(49)).toBe('MEDIUM');
    expect(ratingFromScore(50)).toBe('HIGH');
    expect(ratingFromScore(100)).toBe('HIGH');
  });
});

describe('assessRisk', () => {
  it('rates a clean domestic salaried client as LOW', () => {
    const r = assessRisk(baseInput());
    expect(r.rating).toBe('LOW');
    expect(r.score).toBe(0);
    expect(r.requiresSourceOfFundsDoc).toBe(false);
  });

  it('forces HIGH and requires a document for a black-listed country', () => {
    const r = assessRisk(
      baseInput({
        countryExposures: [
          { field: 'nationality', countryCode: 'IR', fatfStatus: 'BLACK', domesticExempt: false },
        ],
      }),
    );
    expect(r.score).toBeGreaterThanOrEqual(RISK_POINTS.COUNTRY_BLACKLIST);
    expect(r.rating).toBe('HIGH');
    expect(r.requiresSourceOfFundsDoc).toBe(true);
    expect(r.flaggedCountries).toHaveLength(1);
  });

  it('scores a non-exempt grey-listed country and requires a document', () => {
    const r = assessRisk(
      baseInput({
        countryExposures: [
          { field: 'nationality', countryCode: 'LB', fatfStatus: 'GREY', domesticExempt: false },
        ],
      }),
    );
    expect(r.score).toBe(RISK_POINTS.COUNTRY_GREYLIST);
    expect(r.rating).toBe('MEDIUM');
    expect(r.requiresSourceOfFundsDoc).toBe(true);
  });

  it('exempts the domestic grey-listed country (no points, no document)', () => {
    const r = assessRisk(
      baseInput({
        countryExposures: [
          { field: 'nationality', countryCode: 'KW', fatfStatus: 'GREY', domesticExempt: true },
        ],
      }),
    );
    expect(r.score).toBe(0);
    expect(r.rating).toBe('LOW');
    expect(r.requiresSourceOfFundsDoc).toBe(false);
  });

  it('takes the single worst country exposure (black over grey)', () => {
    const r = assessRisk(
      baseInput({
        countryExposures: [
          { field: 'nationality', countryCode: 'LB', fatfStatus: 'GREY', domesticExempt: false },
          { field: 'countryOfBirth', countryCode: 'KP', fatfStatus: 'BLACK', domesticExempt: false },
        ],
      }),
    );
    // Only one country factor is scored, and it's the black-list one
    const countryFactors = r.factors.filter((f) => f.key.startsWith('country'));
    expect(countryFactors).toHaveLength(1);
    expect(countryFactors[0].key).toBe('countryBlacklist');
  });

  it('forces HIGH when the client is a PEP', () => {
    const r = assessRisk(baseInput({ isPep: true }));
    expect(r.rating).toBe('HIGH');
  });

  it('accumulates multiple medium factors into HIGH', () => {
    const r = assessRisk(
      baseInput({
        isManagedByOther: true, // 15
        employmentStatus: 'UNEMPLOYED', // 15
        sourcesOfIncome: ['TRADE_BUSINESS'], // 10
        isRelatedParty: true, // 15
      }),
    );
    expect(r.score).toBe(55);
    expect(r.rating).toBe('HIGH');
  });

  it('flags high wealth over the threshold', () => {
    const r = assessRisk(baseInput({ approxWealthKd: 2_000_000 }));
    expect(r.factors.some((f) => f.key === 'highWealth')).toBe(true);
  });
});

describe('assessCorporateRisk', () => {
  it('rates a clean, regulated, domestic company as LOW', () => {
    const r = assessCorporateRisk(baseCorporateInput());
    expect(r.rating).toBe('LOW');
    expect(r.score).toBe(0);
    expect(r.requiresSourceOfFundsDoc).toBe(false);
  });

  it('forces HIGH on self-disclosed FATF dealings and requires a document', () => {
    const r = assessCorporateRisk(baseCorporateInput({ hasFatfDealings: true }));
    expect(r.score).toBeGreaterThanOrEqual(CORPORATE_RISK_POINTS.FATF_DEALINGS);
    expect(r.rating).toBe('HIGH');
    // FATF dealings alone doesn't add a flagged country — the entity is
    // self-disclosing, not necessarily incorporated/banking there.
    expect(r.factors.some((f) => f.key === 'fatfDealings')).toBe(true);
  });

  it('forces HIGH for a PEP-linked company', () => {
    const r = assessCorporateRisk(baseCorporateInput({ isPep: true }));
    expect(r.rating).toBe('HIGH');
  });

  it('scores a high-risk business activity', () => {
    const r = assessCorporateRisk(baseCorporateInput({ activityHighRisk: true }));
    expect(r.score).toBe(CORPORATE_RISK_POINTS.HIGH_RISK_ACTIVITY);
    expect(r.rating).toBe('MEDIUM');
  });

  it('penalizes dealing in securities without being a regulated entity', () => {
    const r = assessCorporateRisk(
      baseCorporateInput({ activityIncludesSecurities: true, isRegulatedEntity: false }),
    );
    expect(r.factors.some((f) => f.key === 'notRegulatedSecurities')).toBe(true);
  });

  it('does not penalize securities activity when the entity IS regulated', () => {
    const r = assessCorporateRisk(
      baseCorporateInput({ activityIncludesSecurities: true, isRegulatedEntity: true }),
    );
    expect(r.factors.some((f) => f.key === 'notRegulatedSecurities')).toBe(false);
  });

  it('flags a company incorporated in a black-listed country', () => {
    const r = assessCorporateRisk(
      baseCorporateInput({
        countryExposures: [
          { field: 'incorporationCountry', countryCode: 'IR', fatfStatus: 'BLACK', domesticExempt: false },
        ],
      }),
    );
    expect(r.rating).toBe('HIGH');
    expect(r.requiresSourceOfFundsDoc).toBe(true);
  });

  it('exempts the domestic grey-listed incorporation country', () => {
    const r = assessCorporateRisk(
      baseCorporateInput({
        countryExposures: [
          { field: 'incorporationCountry', countryCode: 'KW', fatfStatus: 'GREY', domesticExempt: true },
        ],
      }),
    );
    expect(r.score).toBe(0);
    expect(r.requiresSourceOfFundsDoc).toBe(false);
  });

  it('scores a company-control link (listed director or significant shareholder)', () => {
    const r = assessCorporateRisk(baseCorporateInput({ hasSignificantShareholding: true }));
    expect(r.factors.some((f) => f.key === 'companyControlLink')).toBe(true);
  });

  it('flags high turnover/wealth over the corporate thresholds', () => {
    const r = assessCorporateRisk(baseCorporateInput({ annualTurnoverKd: 2_000_000 }));
    expect(r.factors.some((f) => f.key === 'highWealth')).toBe(true);
  });
});

describe('resolveFinalRating', () => {
  it('keeps the system rating when there is no override', () => {
    expect(resolveFinalRating('MEDIUM', null)).toEqual({ finalRating: 'MEDIUM', overridden: false });
  });

  it('allows raising the rating', () => {
    expect(resolveFinalRating('LOW', 'HIGH')).toEqual({ finalRating: 'HIGH', overridden: true });
  });

  it('rejects lowering the rating', () => {
    expect(() => resolveFinalRating('HIGH', 'LOW')).toThrow();
  });

  it('is a no-op when override equals the system rating', () => {
    expect(resolveFinalRating('MEDIUM', 'MEDIUM')).toEqual({ finalRating: 'MEDIUM', overridden: false });
  });
});
