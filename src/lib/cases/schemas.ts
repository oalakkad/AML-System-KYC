// KYC form validation. One schema drives both the client wizard (per-step
// trigger) and the server (full parse on save/submit). Error messages are
// dict.validation.* keys, translated at render time.

import { z } from 'zod';
import {
  EMPLOYMENT_STATUSES,
  FORM_TYPES,
  INCOME_SOURCES,
  MANAGER_TYPES,
  PEP_POSITIONS,
  PREFERRED_CONTACTS,
  RISK_RATINGS,
  TITLES,
} from '@/lib/constants';
import { isValidIban } from '@/lib/iban';

const req = { message: 'required' } as const;

const dateStr = z
  .string()
  .min(1, req.message)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'invalidDate' });

const pastDate = dateStr.refine((v) => Date.parse(v) < Date.now(), { message: 'pastDate' });
const futureDate = dateStr.refine((v) => Date.parse(v) > Date.now(), { message: 'expiredDocument' });

const optionalStr = z.string().trim().max(500).optional().or(z.literal(''));
const phone = z
  .string()
  .trim()
  .min(1, req.message)
  .regex(/^\+?[0-9 ()-]{7,20}$/, { message: 'invalidPhone' });
const optionalPhone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, { message: 'invalidPhone' })
  .optional()
  .or(z.literal(''));

const numericStr = z
  .string()
  .trim()
  .min(1, req.message)
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, { message: 'positiveNumber' });

const optionalEmail = z
  .string()
  .trim()
  .email({ message: 'invalidEmail' })
  .optional()
  .or(z.literal(''));

const iban = z
  .string()
  .trim()
  .min(1, req.message)
  .max(50)
  .refine((v) => isValidIban(v), { message: 'invalidIban' });

export const kycFormSchema = z
  .object({
    // Step 1 — case info + document checklist
    formType: z.enum(FORM_TYPES),
    clientNo: optionalStr,
    docCivilIdSighted: z.boolean(),
    docBeneficiaryDeclaration: z.boolean(),
    docSalaryCertificate: z.boolean(),

    // Step 2 — personal
    title: z.enum(TITLES, { message: 'required' }),
    fullName: z.string().trim().min(3, req.message).max(200),
    dob: pastDate,
    nationality: z.string().min(2, req.message),
    otherNationalities: z.array(z.string().min(2)).default([]),
    countryOfBirth: z.string().min(2, req.message),
    otherResidencyCountry: optionalStr,
    civilIdNo: z.string().trim().regex(/^\d{12}$/, { message: 'invalidCivilId' }),
    civilIdExpiry: futureDate,
    passportNo: optionalStr,
    passportExpiry: z.string().optional().or(z.literal('')),
    residenceCountry: z.string().min(2, req.message),
    residenceCity: z.string().trim().min(1, req.message).max(100),
    residenceAddress: z.string().trim().min(5, req.message).max(500),
    mobile: phone,
    tel: optionalPhone,
    email: z.string().trim().min(1, req.message).email({ message: 'invalidEmail' }),

    // Step 3 — work & income + bank
    employmentStatus: z.enum(EMPLOYMENT_STATUSES, { message: 'required' }),
    employer: optionalStr,
    sector: optionalStr,
    jobTitle: optionalStr,
    workAddress: optionalStr,
    workPhone: optionalPhone,
    workEmail: optionalEmail,
    preferredContact: z.enum(PREFERRED_CONTACTS, { message: 'required' }),
    yearsOfWork: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 80), {
        message: 'positiveNumber',
      }),
    selfEmploymentDetails: optionalStr,
    sourcesOfIncome: z.array(z.enum(INCOME_SOURCES)).min(1, { message: 'minOneIncome' }),
    otherIncomeDetail: optionalStr,
    annualIncomeKd: numericStr,
    approxWealthKd: numericStr,
    bankBeneficiaryName: z.string().trim().min(1, req.message).max(200),
    bankName: z.string().trim().min(1, req.message).max(200),
    bankBranch: optionalStr,
    bankCountry: z.string().min(2, req.message),
    bankAccountNo: optionalStr,
    bankIban: iban,
    bankSwift: optionalStr,
    bankCurrency: z.string().trim().min(1, req.message).max(10),

    // Step 4 — beneficial owner
    isManagedByOther: z.boolean(),
    managerType: z.enum(MANAGER_TYPES).optional(),
    managerTypeOther: optionalStr,
    boName: optionalStr,
    boNationality: optionalStr,
    boCivilId: optionalStr,
    boPassport: optionalStr,
    boAddress: optionalStr,
    boRelation: optionalStr,

    // Step 5 — PEP
    isPep: z.boolean(),
    hasPepRelative: z.boolean(),
    pepPositions: z.array(z.enum(PEP_POSITIONS)).default([]),
    pepName: optionalStr,
    pepRelationship: optionalStr,
    pepPositionDetails: optionalStr,

    // Step 6 — related parties
    isRelatedParty: z.boolean(),
    relatedParties: z
      .array(
        z.object({
          name: z.string().trim().min(1, req.message).max(200),
          relationship: z.string().trim().min(1, req.message).max(200),
          relativeRelation: optionalStr,
        }),
      )
      .default([]),
    hasControl: z.boolean(),
    isBoardMember: z.boolean(),

    // Step 7 — declaration + risk override
    declarationAccepted: z.boolean(),
    overrideRating: z.enum(RISK_RATINGS).optional().or(z.literal('')),
    overrideJustification: optionalStr,
  })
  .superRefine((data, ctx) => {
    const err = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });

    if (data.formType === 'KYC_UPDATE' && !data.clientNo) err(['clientNo'], 'required');

    // Passport expiry required (and valid) when a passport number is provided
    if (data.passportNo) {
      if (!data.passportExpiry) err(['passportExpiry'], 'required');
      else if (Number.isNaN(Date.parse(data.passportExpiry))) err(['passportExpiry'], 'invalidDate');
      else if (Date.parse(data.passportExpiry) <= Date.now()) err(['passportExpiry'], 'expiredDocument');
    }

    // Work conditionals
    if (data.employmentStatus === 'EMPLOYEE') {
      if (!data.employer) err(['employer'], 'required');
      if (!data.sector) err(['sector'], 'required');
      if (!data.jobTitle) err(['jobTitle'], 'required');
      if (!data.workAddress) err(['workAddress'], 'required');
    }
    if (data.employmentStatus === 'SELF_EMPLOYED' && !data.selfEmploymentDetails) {
      err(['selfEmploymentDetails'], 'required');
    }
    if (data.sourcesOfIncome.includes('OTHER') && !data.otherIncomeDetail) {
      err(['otherIncomeDetail'], 'required');
    }

    // Beneficial owner conditionals
    if (data.isManagedByOther) {
      if (!data.managerType) err(['managerType'], 'required');
      if (data.managerType === 'OTHER' && !data.managerTypeOther) err(['managerTypeOther'], 'required');
      if (!data.boName) err(['boName'], 'required');
      if (!data.boNationality) err(['boNationality'], 'required');
      if (!data.boCivilId) err(['boCivilId'], 'required');
      if (!data.boAddress) err(['boAddress'], 'required');
      if (!data.boRelation) err(['boRelation'], 'required');
    }

    // PEP conditionals
    if (data.isPep || data.hasPepRelative) {
      if (data.pepPositions.length === 0) err(['pepPositions'], 'minOnePepPosition');
      if (!data.pepPositionDetails) err(['pepPositionDetails'], 'required');
    }
    if (data.hasPepRelative) {
      if (!data.pepName) err(['pepName'], 'required');
      if (!data.pepRelationship) err(['pepRelationship'], 'required');
    }

    // Related parties
    if (data.isRelatedParty && data.relatedParties.length === 0) {
      err(['relatedParties'], 'required');
    }

    // Risk override requires justification
    if (data.overrideRating && !data.overrideJustification) {
      err(['overrideJustification'], 'justificationRequired');
    }
  });

export type KycFormValues = z.infer<typeof kycFormSchema>;

/** Extra rules enforced only at final submission. */
export const submitExtraSchema = z.object({
  docCivilIdSighted: z.literal(true, { message: 'docChecklistRequired' }),
  docBeneficiaryDeclaration: z.literal(true, { message: 'docChecklistRequired' }),
  docSalaryCertificate: z.literal(true, { message: 'docChecklistRequired' }),
  declarationAccepted: z.literal(true, { message: 'declarationRequired' }),
});

/**
 * Field groups per wizard step, used for client-side `trigger()` validation.
 * Order matches the wizard's STEPS array: Case Info → Personal → Political
 * Exposure → Work & Income → Beneficial Owner → Related Parties →
 * Review/Documents/Declaration. PEP moved ahead of Work & Income, and the
 * required-documents checklist moved from step 1 to the final step, per
 * 2026-07-13 manager feedback.
 */
export const STEP_FIELDS: (keyof KycFormValues)[][] = [
  ['formType', 'clientNo'],
  [
    'title', 'fullName', 'dob', 'nationality', 'otherNationalities', 'countryOfBirth',
    'otherResidencyCountry', 'civilIdNo', 'civilIdExpiry', 'passportNo', 'passportExpiry',
    'residenceCountry', 'residenceCity', 'residenceAddress', 'mobile', 'tel', 'email',
  ],
  ['isPep', 'hasPepRelative', 'pepPositions', 'pepName', 'pepRelationship', 'pepPositionDetails'],
  [
    'employmentStatus', 'employer', 'sector', 'jobTitle', 'workAddress', 'workPhone',
    'workEmail', 'preferredContact', 'yearsOfWork', 'selfEmploymentDetails', 'sourcesOfIncome',
    'otherIncomeDetail', 'annualIncomeKd', 'approxWealthKd', 'bankBeneficiaryName', 'bankName',
    'bankBranch', 'bankCountry', 'bankAccountNo', 'bankIban', 'bankSwift', 'bankCurrency',
  ],
  [
    'isManagedByOther', 'managerType', 'managerTypeOther', 'boName', 'boNationality',
    'boCivilId', 'boPassport', 'boAddress', 'boRelation',
  ],
  ['isRelatedParty', 'relatedParties', 'hasControl', 'isBoardMember'],
  [
    'docCivilIdSighted', 'docBeneficiaryDeclaration', 'docSalaryCertificate',
    'declarationAccepted', 'overrideRating', 'overrideJustification',
  ],
];

export function defaultFormValues(): KycFormValues {
  return {
    formType: 'NEW_CLIENT',
    clientNo: '',
    docCivilIdSighted: false,
    docBeneficiaryDeclaration: false,
    docSalaryCertificate: false,
    title: 'MR',
    fullName: '',
    dob: '',
    nationality: '',
    otherNationalities: [],
    countryOfBirth: '',
    otherResidencyCountry: '',
    civilIdNo: '',
    civilIdExpiry: '',
    passportNo: '',
    passportExpiry: '',
    residenceCountry: 'KW',
    residenceCity: '',
    residenceAddress: '',
    mobile: '',
    tel: '',
    email: '',
    employmentStatus: 'EMPLOYEE',
    employer: '',
    sector: '',
    jobTitle: '',
    workAddress: '',
    workPhone: '',
    workEmail: '',
    preferredContact: 'PERSONAL',
    yearsOfWork: '',
    selfEmploymentDetails: '',
    sourcesOfIncome: [],
    otherIncomeDetail: '',
    annualIncomeKd: '',
    approxWealthKd: '',
    bankBeneficiaryName: '',
    bankName: '',
    bankBranch: '',
    bankCountry: 'KW',
    bankAccountNo: '',
    bankIban: '',
    bankSwift: '',
    bankCurrency: 'KWD',
    isManagedByOther: false,
    managerType: undefined,
    managerTypeOther: '',
    boName: '',
    boNationality: '',
    boCivilId: '',
    boPassport: '',
    boAddress: '',
    boRelation: '',
    isPep: false,
    hasPepRelative: false,
    pepPositions: [],
    pepName: '',
    pepRelationship: '',
    pepPositionDetails: '',
    isRelatedParty: false,
    relatedParties: [],
    hasControl: false,
    isBoardMember: false,
    declarationAccepted: false,
    overrideRating: '',
    overrideJustification: '',
  };
}
