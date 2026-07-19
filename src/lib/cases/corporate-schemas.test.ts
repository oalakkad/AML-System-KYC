import { describe, it, expect } from 'vitest';
import { corporateFormSchema, corporateSubmitExtraSchema, defaultCorporateFormValues } from './corporate-schemas';

function validValues() {
  return {
    ...defaultCorporateFormValues(),
    legalName: 'Gulf Trading Co. WLL',
    incorporationDate: '2010-05-01',
    mainActivities: 'General trading and investment holding',
    registrationNo: 'REG-12345',
    incorporationCountry: 'KW',
    registeredAddress: 'Sharq, Kuwait City',
    email: 'info@gulftrading.example',
    authorizedSignatories: [{ name: 'Ahmad Al-Sabah' }],
    boardOfDirectors: [
      { name: 'Ahmad Al-Sabah', nationality: 'Kuwaiti', position: 'Chairman', representation: '' },
    ],
    correspondenceMethod: 'EMAIL' as const,
    natureOfBusiness: 'General trading',
    annualNetIncomeKd: '500000',
    annualTurnoverKd: '2000000',
    capitalKd: '1000000',
    approxWealthKd: '3000000',
    sourcesOfIncome: ['AUTHORIZED_ACTIVITIES' as const],
    expectedInvestmentPeriod: 'MEDIUM' as const,
    expectedTransactionBand: 'BAND_250K_500K' as const,
    riskTolerance: 'MEDIUM' as const,
    investmentExperience: 'GOOD' as const,
    yearsOfExperience: 'ONE_TO_FIVE' as const,
    bank1Name: 'NBK',
    bank1Country: 'KW',
    bank1Currency: 'KWD',
    bank1AccountName: 'Gulf Trading Co. WLL',
    bank1AccountNo: 'KW81CBKU0000000000001234560101',
    tradesOnOwnAccount: true,
    clientCategory: 'RETAIL' as const,
  };
}

describe('corporateFormSchema', () => {
  it('accepts a complete valid form', () => {
    const r = corporateFormSchema.safeParse(validValues());
    expect(r.success).toBe(true);
  });

  it('requires at least one authorized signatory', () => {
    const r = corporateFormSchema.safeParse({ ...validValues(), authorizedSignatories: [] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path.join('.') === 'authorizedSignatories')).toBe(true);
  });

  it('requires at least one board member', () => {
    const r = corporateFormSchema.safeParse({ ...validValues(), boardOfDirectors: [] });
    expect(r.success).toBe(false);
  });

  it('requires "other" company type detail when OTHER is selected', () => {
    const r = corporateFormSchema.safeParse({ ...validValues(), companyType: 'OTHER', companyTypeOther: '' });
    expect(r.success).toBe(false);
  });

  it('requires FATF dealings detail when the entity discloses dealings', () => {
    const r = corporateFormSchema.safeParse({
      ...validValues(),
      hasFatfDealings: true,
      fatfDealingsDetail: '',
    });
    expect(r.success).toBe(false);
  });

  it('requires a market name when listed on an exchange', () => {
    const r = corporateFormSchema.safeParse({
      ...validValues(),
      isListedOnExchange: true,
      listedMarketName: '',
    });
    expect(r.success).toBe(false);
  });

  it('requires related-party details when isRelatedParty is true', () => {
    const r = corporateFormSchema.safeParse({
      ...validValues(),
      isRelatedParty: true,
      relatedPartyName: '',
    });
    expect(r.success).toBe(false);
  });

  it('requires at least one source of income', () => {
    const r = corporateFormSchema.safeParse({ ...validValues(), sourcesOfIncome: [] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === 'minOneIncome')).toBe(true);
  });

  it('requires PEP details when the entity discloses a PEP link', () => {
    const r = corporateFormSchema.safeParse({ ...validValues(), isPep: true });
    expect(r.success).toBe(false);
  });

  it('requires a client number for KYC updates', () => {
    const r = corporateFormSchema.safeParse({ ...validValues(), formType: 'KYC_UPDATE', clientNo: '' });
    expect(r.success).toBe(false);
  });

  it('requires justification when overriding the risk rating', () => {
    const r = corporateFormSchema.safeParse({
      ...validValues(),
      overrideRating: 'HIGH',
      overrideJustification: '',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === 'justificationRequired')).toBe(true);
  });

  it('requires detail when the second bank account section is left partially filled is still optional overall', () => {
    // bank2* fields are entirely optional — omitting them should not fail validation
    const r = corporateFormSchema.safeParse(validValues());
    expect(r.success).toBe(true);
  });

  it('rejects an IBAN-shaped bank1AccountNo with a bad checksum', () => {
    const r = corporateFormSchema.safeParse({ ...validValues(), bank1AccountNo: 'KW81CBKU0000000000001234560102' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === 'invalidIban')).toBe(true);
  });

  it('accepts a plain (non-IBAN-shaped) bank1AccountNo unchecked', () => {
    const r = corporateFormSchema.safeParse({ ...validValues(), bank1AccountNo: '00123456789' });
    expect(r.success).toBe(true);
  });

  it('validates bank2AccountNo as an IBAN only when it looks like one', () => {
    expect(
      corporateFormSchema.safeParse({ ...validValues(), bank2AccountNo: 'KW81CBKU0000000000001234560102' })
        .success,
    ).toBe(false);
    expect(corporateFormSchema.safeParse({ ...validValues(), bank2AccountNo: '00987654321' }).success).toBe(true);
  });
});

describe('corporateSubmitExtraSchema', () => {
  it('requires document checklist + declaration at submit', () => {
    expect(corporateSubmitExtraSchema.safeParse(defaultCorporateFormValues()).success).toBe(false);
    expect(
      corporateSubmitExtraSchema.safeParse({
        docLicenseSighted: true,
        docMoaSighted: true,
        docSignatoriesSighted: true,
        docBoardSighted: true,
        docFinancialsSighted: true,
        declarationAccepted: true,
      }).success,
    ).toBe(true);
  });
});
