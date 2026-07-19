// Corporate KYC form validation — mirrors schemas.ts conventions (individual
// KYC). One schema drives both the client wizard (per-step trigger) and the
// server (full parse on save/submit). Error messages are dict.validation.*
// keys, translated at render time.

import { z } from 'zod';
import {
  COMPANY_TYPES,
  CORPORATE_INCOME_SOURCES,
  CORRESPONDENCE_METHODS,
  EXPERIENCE_YEARS,
  FORM_TYPES,
  INVESTMENT_EXPERIENCES,
  INVESTMENT_PERIODS,
  INVESTMENT_PURPOSES,
  INVESTMENT_TYPES,
  CLIENT_CATEGORIES,
  PEP_POSITIONS,
  RISK_RATINGS,
  RISK_TOLERANCES,
  TRANSACTION_BANDS,
} from '@/lib/constants';
import { looksLikeIban, isValidIban } from '@/lib/iban';

const req = { message: 'required' } as const;

const dateStr = z
  .string()
  .min(1, req.message)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'invalidDate' });
const pastDate = dateStr.refine((v) => Date.parse(v) < Date.now(), { message: 'pastDate' });

const optionalStr = z.string().trim().max(1000).optional().or(z.literal(''));
const requiredStr = (max = 300) => z.string().trim().min(1, req.message).max(max);
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
const optionalNumericStr = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), { message: 'positiveNumber' });

const namedPerson = z.object({ name: z.string().trim().min(1, req.message).max(200) });
const boardMember = z.object({
  name: z.string().trim().min(1, req.message).max(200),
  nationality: z.string().trim().min(1, req.message).max(100),
  position: z.string().trim().min(1, req.message).max(200),
  representation: optionalStr,
});
const execMember = z.object({
  name: z.string().trim().min(1, req.message).max(200),
  nationality: z.string().trim().min(1, req.message).max(100),
  position: z.string().trim().min(1, req.message).max(200),
});
const subsidiary = z.object({
  companyName: z.string().trim().min(1, req.message).max(200),
  residencyCountry: z.string().trim().min(1, req.message).max(100),
  registerNumber: optionalStr,
  activity: optionalStr,
  ownershipPercentage: optionalNumericStr,
});
const contactPerson = z.object({
  name: z.string().trim().min(1, req.message).max(200),
  tel: optionalPhone,
});

export const corporateFormSchema = z
  .object({
    // Step 1 — case + company type + documents
    formType: z.enum(FORM_TYPES),
    clientNo: optionalStr,
    companyType: z.enum(COMPANY_TYPES, { message: 'required' }),
    companyTypeOther: optionalStr,
    docLicenseSighted: z.boolean(),
    docMoaSighted: z.boolean(),
    docSignatoriesSighted: z.boolean(),
    docBoardSighted: z.boolean(),
    docFinancialsSighted: z.boolean(),

    // Step 2 — company details
    legalName: z.string().trim().min(2, req.message).max(300),
    incorporationDate: pastDate,
    mainActivities: requiredStr(500),
    registrationNo: requiredStr(100),
    incorporationCountry: z.string().min(2, req.message),
    registeredAddress: requiredStr(500),
    headOfficeAddress: optionalStr,
    businessTel: optionalPhone,
    email: z.string().trim().min(1, req.message).email({ message: 'invalidEmail' }),
    taxResidenceCountry: optionalStr,
    taxIdNumber: optionalStr,
    licenseExpiry: z.string().optional().or(z.literal('')),
    authorizedCapitalKd: optionalNumericStr,
    paidUpCapitalKd: optionalNumericStr,
    licenseNumber: optionalStr,

    // Step 3 — people & structure
    authorizedSignatories: z.array(namedPerson).default([]),
    boardOfDirectors: z.array(boardMember).default([]),
    executiveManagement: z.array(execMember).default([]),
    subsidiaries: z.array(subsidiary).default([]),

    // Step 4 — regulatory & activity + communication
    activityIncludesSecurities: z.boolean(),
    activityHighRisk: z.boolean(),
    activityHighRiskOther: optionalStr,
    isListedOnExchange: z.boolean(),
    listedMarketName: optionalStr,
    isRegulatedEntity: z.boolean(),
    regulatorName: optionalStr,
    hasFatfDealings: z.boolean(),
    fatfDealingsDetail: optionalStr,
    isDirectorOrMajorShareholderOfListed: z.boolean(),
    listedCompanyDetails: optionalStr,
    hasSignificantShareholding: z.boolean(),
    shareholderDetails: optionalStr,
    correspondenceMethod: z.enum(CORRESPONDENCE_METHODS, { message: 'required' }),
    reportRetention: z.boolean(),
    contactPersons: z.array(contactPerson).default([]),

    // Step 5 — financial & investment
    natureOfBusiness: requiredStr(500),
    isRelatedParty: z.boolean(),
    relatedPartyName: optionalStr,
    relatedPartyRelationship: optionalStr,
    annualNetIncomeKd: numericStr,
    annualTurnoverKd: numericStr,
    capitalKd: numericStr,
    approxWealthKd: numericStr,
    sourcesOfIncome: z.array(z.enum(CORPORATE_INCOME_SOURCES)).min(1, { message: 'minOneIncome' }),
    otherIncomeDetail: optionalStr,
    incomeSourcesUsed: z.array(z.string().trim().max(200)).default([]),
    investmentPurpose: z.array(z.enum(INVESTMENT_PURPOSES)).default([]),
    investmentPurposeOther: optionalStr,
    expectedInvestmentPeriod: z.enum(INVESTMENT_PERIODS, { message: 'required' }),
    expectedTransactionBand: z.enum(TRANSACTION_BANDS, { message: 'required' }),
    riskTolerance: z.enum(RISK_TOLERANCES, { message: 'required' }),
    investmentExperience: z.enum(INVESTMENT_EXPERIENCES, { message: 'required' }),
    investmentExperienceOther: optionalStr,
    investmentTypes: z.array(z.enum(INVESTMENT_TYPES)).default([]),
    yearsOfExperience: z.enum(EXPERIENCE_YEARS, { message: 'required' }),

    // Step 6 — bank accounts
    bank1Name: z.string().trim().min(1, req.message).max(200),
    bank1Country: z.string().min(2, req.message),
    bank1Swift: optionalStr,
    bank1Currency: z.string().trim().min(1, req.message).max(10),
    bank1AccountName: z.string().trim().min(1, req.message).max(200),
    bank1AccountNo: z.string().trim().min(1, req.message).max(50),
    bank2Name: optionalStr,
    bank2Country: optionalStr,
    bank2Swift: optionalStr,
    bank2Currency: optionalStr,
    bank2AccountName: optionalStr,
    bank2AccountNo: optionalStr,

    // Step 7 — beneficiaries / controlling persons / PEP
    tradesOnOwnAccount: z.boolean(),
    tradesOnBehalfOfOthersDetail: optionalStr,
    hasSignificantInterestPersons: z.boolean(),
    significantInterestPersons: z.array(namedPerson).default([]),
    boName: optionalStr,
    boNationality: optionalStr,
    boPassportNo: optionalStr,
    boCivilId: optionalStr,
    boAddress: optionalStr,
    boRelation: optionalStr,
    isUsResidentOrNational: z.boolean(),
    hasControllingPersons: z.boolean(),
    controllingPersons: z.array(namedPerson).default([]),
    isPep: z.boolean(),
    pepPositions: z.array(z.enum(PEP_POSITIONS)).default([]),
    pepHolderName: optionalStr,
    pepName: optionalStr,
    pepPositionDetails: optionalStr,
    pepRelation: optionalStr,

    // Step 8 — categorization & declaration
    clientCategory: z.enum(CLIENT_CATEGORIES, { message: 'required' }),
    dealsWithForeignFinancialInstitutions: z.boolean(),
    foreignInstitutionName: optionalStr,
    foreignInstitutionLocation: optionalStr,
    declarationAccepted: z.boolean(),
    authorizedSignatoryName: optionalStr,
    authorizedSignatoryPosition: optionalStr,
    overrideRating: z.enum(RISK_RATINGS).optional().or(z.literal('')),
    overrideJustification: optionalStr,
  })
  .superRefine((data, ctx) => {
    const err = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });

    if (data.formType === 'KYC_UPDATE' && !data.clientNo) err(['clientNo'], 'required');
    if (data.companyType === 'OTHER' && !data.companyTypeOther) err(['companyTypeOther'], 'required');

    if (data.licenseExpiry) {
      if (Number.isNaN(Date.parse(data.licenseExpiry))) err(['licenseExpiry'], 'invalidDate');
      else if (Date.parse(data.licenseExpiry) <= Date.now()) err(['licenseExpiry'], 'expiredDocument');
    }

    if (data.authorizedSignatories.length === 0) err(['authorizedSignatories'], 'required');
    if (data.boardOfDirectors.length === 0) err(['boardOfDirectors'], 'required');

    if (data.activityHighRisk && !data.activityHighRiskOther) {
      // detail is optional context, not mandatory — no error, just informational
    }
    if (data.isListedOnExchange && !data.listedMarketName) err(['listedMarketName'], 'required');
    if (data.isRegulatedEntity && !data.regulatorName) err(['regulatorName'], 'required');
    if (data.hasFatfDealings && !data.fatfDealingsDetail) err(['fatfDealingsDetail'], 'required');
    if (data.isDirectorOrMajorShareholderOfListed && !data.listedCompanyDetails) {
      err(['listedCompanyDetails'], 'required');
    }
    if (data.hasSignificantShareholding && !data.shareholderDetails) {
      err(['shareholderDetails'], 'required');
    }

    if (data.sourcesOfIncome.includes('OTHER') && !data.otherIncomeDetail) {
      err(['otherIncomeDetail'], 'required');
    }
    if (data.investmentPurpose.includes('OTHER') && !data.investmentPurposeOther) {
      err(['investmentPurposeOther'], 'required');
    }
    if (data.investmentExperience === 'OTHER' && !data.investmentExperienceOther) {
      err(['investmentExperienceOther'], 'required');
    }

    if (data.isRelatedParty) {
      if (!data.relatedPartyName) err(['relatedPartyName'], 'required');
      if (!data.relatedPartyRelationship) err(['relatedPartyRelationship'], 'required');
    }

    if (!data.tradesOnOwnAccount && !data.tradesOnBehalfOfOthersDetail) {
      err(['tradesOnBehalfOfOthersDetail'], 'required');
    }
    if (data.hasSignificantInterestPersons && data.significantInterestPersons.length === 0) {
      err(['significantInterestPersons'], 'required');
    }
    if (data.hasControllingPersons && data.controllingPersons.length === 0) {
      err(['controllingPersons'], 'required');
    }

    if (data.isPep) {
      if (data.pepPositions.length === 0) err(['pepPositions'], 'minOnePepPosition');
      if (!data.pepPositionDetails) err(['pepPositionDetails'], 'required');
      if (!data.pepHolderName) err(['pepHolderName'], 'required');
    }

    if (data.dealsWithForeignFinancialInstitutions) {
      if (!data.foreignInstitutionName) err(['foreignInstitutionName'], 'required');
      if (!data.foreignInstitutionLocation) err(['foreignInstitutionLocation'], 'required');
    }

    if (data.overrideRating && !data.overrideJustification) {
      err(['overrideJustification'], 'justificationRequired');
    }

    if (looksLikeIban(data.bank1AccountNo) && !isValidIban(data.bank1AccountNo)) {
      err(['bank1AccountNo'], 'invalidIban');
    }
    if (data.bank2AccountNo && looksLikeIban(data.bank2AccountNo) && !isValidIban(data.bank2AccountNo)) {
      err(['bank2AccountNo'], 'invalidIban');
    }
  });

export type CorporateFormValues = z.infer<typeof corporateFormSchema>;

export const corporateSubmitExtraSchema = z.object({
  docLicenseSighted: z.literal(true, { message: 'docChecklistRequired' }),
  docMoaSighted: z.literal(true, { message: 'docChecklistRequired' }),
  docSignatoriesSighted: z.literal(true, { message: 'docChecklistRequired' }),
  docBoardSighted: z.literal(true, { message: 'docChecklistRequired' }),
  docFinancialsSighted: z.literal(true, { message: 'docChecklistRequired' }),
  declarationAccepted: z.literal(true, { message: 'declarationRequired' }),
});

/**
 * Field groups per wizard step, used for client-side `trigger()` validation.
 * The required-documents checklist moved from step 1 to the final step, per
 * 2026-07-13 manager feedback (mirrors the individual KYC wizard).
 */
export const CORPORATE_STEP_FIELDS: (keyof CorporateFormValues)[][] = [
  ['formType', 'clientNo', 'companyType', 'companyTypeOther'],
  [
    'legalName', 'incorporationDate', 'mainActivities', 'registrationNo', 'incorporationCountry',
    'registeredAddress', 'headOfficeAddress', 'businessTel', 'email', 'taxResidenceCountry',
    'taxIdNumber', 'licenseExpiry', 'authorizedCapitalKd', 'paidUpCapitalKd', 'licenseNumber',
  ],
  ['authorizedSignatories', 'boardOfDirectors', 'executiveManagement', 'subsidiaries'],
  [
    'activityIncludesSecurities', 'activityHighRisk', 'activityHighRiskOther', 'isListedOnExchange',
    'listedMarketName', 'isRegulatedEntity', 'regulatorName', 'hasFatfDealings', 'fatfDealingsDetail',
    'isDirectorOrMajorShareholderOfListed', 'listedCompanyDetails', 'hasSignificantShareholding',
    'shareholderDetails', 'correspondenceMethod', 'reportRetention', 'contactPersons',
  ],
  [
    'natureOfBusiness', 'isRelatedParty', 'relatedPartyName', 'relatedPartyRelationship',
    'annualNetIncomeKd', 'annualTurnoverKd', 'capitalKd', 'approxWealthKd', 'sourcesOfIncome',
    'otherIncomeDetail', 'incomeSourcesUsed', 'investmentPurpose', 'investmentPurposeOther',
    'expectedInvestmentPeriod', 'expectedTransactionBand', 'riskTolerance', 'investmentExperience',
    'investmentExperienceOther', 'investmentTypes', 'yearsOfExperience',
  ],
  [
    'bank1Name', 'bank1Country', 'bank1Swift', 'bank1Currency', 'bank1AccountName', 'bank1AccountNo',
    'bank2Name', 'bank2Country', 'bank2Swift', 'bank2Currency', 'bank2AccountName', 'bank2AccountNo',
  ],
  [
    'tradesOnOwnAccount', 'tradesOnBehalfOfOthersDetail', 'hasSignificantInterestPersons',
    'significantInterestPersons', 'boName', 'boNationality', 'boPassportNo', 'boCivilId', 'boAddress',
    'boRelation', 'isUsResidentOrNational', 'hasControllingPersons', 'controllingPersons',
    'isPep', 'pepPositions', 'pepHolderName', 'pepName', 'pepPositionDetails', 'pepRelation',
  ],
  [
    'docLicenseSighted', 'docMoaSighted', 'docSignatoriesSighted', 'docBoardSighted', 'docFinancialsSighted',
    'clientCategory', 'dealsWithForeignFinancialInstitutions', 'foreignInstitutionName',
    'foreignInstitutionLocation', 'declarationAccepted', 'authorizedSignatoryName',
    'authorizedSignatoryPosition', 'overrideRating', 'overrideJustification',
  ],
];

export function defaultCorporateFormValues(): CorporateFormValues {
  return {
    formType: 'NEW_CLIENT',
    clientNo: '',
    companyType: 'GENERAL_SHAREHOLDING',
    companyTypeOther: '',
    docLicenseSighted: false,
    docMoaSighted: false,
    docSignatoriesSighted: false,
    docBoardSighted: false,
    docFinancialsSighted: false,
    legalName: '',
    incorporationDate: '',
    mainActivities: '',
    registrationNo: '',
    incorporationCountry: 'KW',
    registeredAddress: '',
    headOfficeAddress: '',
    businessTel: '',
    email: '',
    taxResidenceCountry: '',
    taxIdNumber: '',
    licenseExpiry: '',
    authorizedCapitalKd: '',
    paidUpCapitalKd: '',
    licenseNumber: '',
    authorizedSignatories: [],
    boardOfDirectors: [],
    executiveManagement: [],
    subsidiaries: [],
    activityIncludesSecurities: false,
    activityHighRisk: false,
    activityHighRiskOther: '',
    isListedOnExchange: false,
    listedMarketName: '',
    isRegulatedEntity: false,
    regulatorName: '',
    hasFatfDealings: false,
    fatfDealingsDetail: '',
    isDirectorOrMajorShareholderOfListed: false,
    listedCompanyDetails: '',
    hasSignificantShareholding: false,
    shareholderDetails: '',
    correspondenceMethod: 'EMAIL',
    reportRetention: false,
    contactPersons: [],
    natureOfBusiness: '',
    isRelatedParty: false,
    relatedPartyName: '',
    relatedPartyRelationship: '',
    annualNetIncomeKd: '',
    annualTurnoverKd: '',
    capitalKd: '',
    approxWealthKd: '',
    sourcesOfIncome: [],
    otherIncomeDetail: '',
    incomeSourcesUsed: [],
    investmentPurpose: [],
    investmentPurposeOther: '',
    expectedInvestmentPeriod: 'MEDIUM',
    expectedTransactionBand: 'BELOW_150K',
    riskTolerance: 'MEDIUM',
    investmentExperience: 'GOOD',
    investmentExperienceOther: '',
    investmentTypes: [],
    yearsOfExperience: 'ONE_TO_FIVE',
    bank1Name: '',
    bank1Country: 'KW',
    bank1Swift: '',
    bank1Currency: 'KWD',
    bank1AccountName: '',
    bank1AccountNo: '',
    bank2Name: '',
    bank2Country: '',
    bank2Swift: '',
    bank2Currency: '',
    bank2AccountName: '',
    bank2AccountNo: '',
    tradesOnOwnAccount: true,
    tradesOnBehalfOfOthersDetail: '',
    hasSignificantInterestPersons: false,
    significantInterestPersons: [],
    boName: '',
    boNationality: '',
    boPassportNo: '',
    boCivilId: '',
    boAddress: '',
    boRelation: '',
    isUsResidentOrNational: false,
    hasControllingPersons: false,
    controllingPersons: [],
    isPep: false,
    pepPositions: [],
    pepHolderName: '',
    pepName: '',
    pepPositionDetails: '',
    pepRelation: '',
    clientCategory: 'RETAIL',
    dealsWithForeignFinancialInstitutions: false,
    foreignInstitutionName: '',
    foreignInstitutionLocation: '',
    declarationAccepted: false,
    authorizedSignatoryName: '',
    authorizedSignatoryPosition: '',
    overrideRating: '',
    overrideJustification: '',
  };
}
