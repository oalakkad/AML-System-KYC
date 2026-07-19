import { describe, it, expect } from 'vitest';
import { kycFormSchema, submitExtraSchema, defaultFormValues } from './schemas';

function validValues() {
  return {
    ...defaultFormValues(),
    fullName: 'Ahmad Al-Sabah',
    dob: '1990-01-01',
    nationality: 'KW',
    countryOfBirth: 'KW',
    civilIdNo: '290010112345',
    civilIdExpiry: '2032-01-01',
    residenceCity: 'Kuwait City',
    residenceAddress: 'Block 1, Street 2, House 3',
    mobile: '+96599112233',
    email: 'ahmad@example.com',
    employmentStatus: 'EMPLOYEE' as const,
    employer: 'ACME',
    sector: 'Finance',
    jobTitle: 'Analyst',
    workAddress: 'Sharq Tower',
    sourcesOfIncome: ['SALARY' as const],
    annualIncomeKd: '18000',
    approxWealthKd: '60000',
    bankBeneficiaryName: 'Ahmad Al-Sabah',
    bankName: 'NBK',
    bankCountry: 'KW',
    bankIban: 'KW81CBKU0000000000001234560101',
    bankCurrency: 'KWD',
  };
}

describe('kycFormSchema', () => {
  it('accepts a complete valid form', () => {
    const r = kycFormSchema.safeParse(validValues());
    expect(r.success).toBe(true);
  });

  it('rejects a malformed civil ID', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), civilIdNo: '123' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === 'invalidCivilId')).toBe(true);
  });

  it('requires at least one source of income', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), sourcesOfIncome: [] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === 'minOneIncome')).toBe(true);
  });

  it('requires employer details when employed', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), employer: '', jobTitle: '' });
    expect(r.success).toBe(false);
  });

  it('requires beneficial-owner details when managed by another', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), isManagedByOther: true });
    expect(r.success).toBe(false);
  });

  it('requires a client number for KYC updates', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), formType: 'KYC_UPDATE', clientNo: '' });
    expect(r.success).toBe(false);
  });

  it('requires justification when overriding the risk rating', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), overrideRating: 'HIGH', overrideJustification: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === 'justificationRequired')).toBe(true);
  });

  it('requires PEP details when the client is a PEP', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), isPep: true });
    expect(r.success).toBe(false);
  });

  it('rejects a malformed IBAN', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), bankIban: 'KW81CBKU0000000000001234560102' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === 'invalidIban')).toBe(true);
  });

  it('accepts REAL_ESTATE as a source of income', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), sourcesOfIncome: ['REAL_ESTATE'] });
    expect(r.success).toBe(true);
  });

  it('accepts an optional work email, and rejects a malformed one', () => {
    expect(kycFormSchema.safeParse({ ...validValues(), workEmail: '' }).success).toBe(true);
    expect(kycFormSchema.safeParse({ ...validValues(), workEmail: 'ahmad@work.com' }).success).toBe(true);
    const r = kycFormSchema.safeParse({ ...validValues(), workEmail: 'not-an-email' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === 'invalidEmail')).toBe(true);
  });

  it('requires a preferred contact selection', () => {
    const r = kycFormSchema.safeParse({ ...validValues(), preferredContact: undefined });
    expect(r.success).toBe(false);
  });
});

describe('submitExtraSchema', () => {
  it('requires document checklist + declaration at submit', () => {
    expect(submitExtraSchema.safeParse(defaultFormValues()).success).toBe(false);
    expect(
      submitExtraSchema.safeParse({
        docCivilIdSighted: true,
        docBeneficiaryDeclaration: true,
        docSalaryCertificate: true,
        declarationAccepted: true,
      }).success,
    ).toBe(true);
  });
});
