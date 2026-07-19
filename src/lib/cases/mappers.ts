// Converts between wizard form values and the (partially encrypted) KycProfile
// row, and builds the risk-engine input from form values.

import type { KycProfile } from '@prisma/client';
import { encryptNullable, decryptNullable } from '@/lib/crypto';
import type { IncomeSource, ManagerType, PepPosition, Title, EmploymentStatus } from '@/lib/constants';
import type { KycFormValues } from './schemas';

export { buildCountryExposures, buildRiskInput, countryFieldsOf, type FatfSettings } from './risk-input';

const toDate = (v: string | undefined | null) => (v ? new Date(v) : null);
const toNum = (v: string | undefined | null) => (v === '' || v === null || v === undefined ? null : Number(v));
const orNull = (v: string | undefined | null) => (v ? v : null);

export function formToProfileData(v: KycFormValues) {
  return {
    title: v.title,
    fullName: v.fullName || null,
    dobEnc: encryptNullable(v.dob),
    nationality: orNull(v.nationality),
    otherNationalitiesJson: JSON.stringify(v.otherNationalities ?? []),
    countryOfBirth: orNull(v.countryOfBirth),
    otherResidencyCountry: orNull(v.otherResidencyCountry),
    civilIdNoEnc: encryptNullable(v.civilIdNo),
    civilIdExpiry: toDate(v.civilIdExpiry),
    passportNoEnc: encryptNullable(v.passportNo),
    passportExpiry: toDate(v.passportExpiry),
    residenceCountry: orNull(v.residenceCountry),
    residenceCity: orNull(v.residenceCity),
    residenceAddressEnc: encryptNullable(v.residenceAddress),
    mobileEnc: encryptNullable(v.mobile),
    telEnc: encryptNullable(v.tel),
    emailEnc: encryptNullable(v.email),
    employmentStatus: v.employmentStatus,
    employer: orNull(v.employer),
    sector: orNull(v.sector),
    jobTitle: orNull(v.jobTitle),
    workAddress: orNull(v.workAddress),
    workPhoneEnc: encryptNullable(v.workPhone),
    workEmailEnc: encryptNullable(v.workEmail),
    preferredContact: v.preferredContact,
    yearsOfWork: toNum(v.yearsOfWork) === null ? null : Math.round(Number(v.yearsOfWork)),
    selfEmploymentDetails: orNull(v.selfEmploymentDetails),
    sourcesOfIncomeJson: JSON.stringify(v.sourcesOfIncome ?? []),
    otherIncomeDetail: orNull(v.otherIncomeDetail),
    annualIncomeKd: toNum(v.annualIncomeKd),
    approxWealthKd: toNum(v.approxWealthKd),
    bankBeneficiaryName: orNull(v.bankBeneficiaryName),
    bankName: orNull(v.bankName),
    bankBranch: orNull(v.bankBranch),
    bankCountry: orNull(v.bankCountry),
    bankAccountNoEnc: encryptNullable(v.bankAccountNo),
    bankIbanEnc: encryptNullable(v.bankIban),
    bankSwift: orNull(v.bankSwift),
    bankCurrency: orNull(v.bankCurrency),
    isManagedByOther: v.isManagedByOther,
    managerType: v.isManagedByOther ? (v.managerType ?? null) : null,
    managerTypeOther: v.isManagedByOther ? orNull(v.managerTypeOther) : null,
    boName: v.isManagedByOther ? orNull(v.boName) : null,
    boNationality: v.isManagedByOther ? orNull(v.boNationality) : null,
    boCivilIdEnc: v.isManagedByOther ? encryptNullable(v.boCivilId) : null,
    boPassportEnc: v.isManagedByOther ? encryptNullable(v.boPassport) : null,
    boAddressEnc: v.isManagedByOther ? encryptNullable(v.boAddress) : null,
    boRelation: v.isManagedByOther ? orNull(v.boRelation) : null,
    isPep: v.isPep,
    pepPositionsJson: JSON.stringify(v.pepPositions ?? []),
    hasPepRelative: v.hasPepRelative,
    pepName: orNull(v.pepName),
    pepRelationship: orNull(v.pepRelationship),
    pepPositionDetails: orNull(v.pepPositionDetails),
    isRelatedParty: v.isRelatedParty,
    relatedPartiesJson: JSON.stringify(v.relatedParties ?? []),
    hasControl: v.hasControl,
    isBoardMember: v.isBoardMember,
    docsChecklistJson: JSON.stringify({
      civilIdSighted: v.docCivilIdSighted,
      beneficiaryDeclaration: v.docBeneficiaryDeclaration,
      salaryCertificate: v.docSalaryCertificate,
    }),
    declarationAccepted: v.declarationAccepted,
  };
}

const dateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');
const parseJson = <T,>(s: string | null, fallback: T): T => {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

export function profileToForm(
  profile: KycProfile,
  kase: { formType: string; clientNo: string | null },
): KycFormValues {
  const checklist = parseJson<Record<string, boolean>>(profile.docsChecklistJson, {});
  return {
    formType: kase.formType as KycFormValues['formType'],
    clientNo: kase.clientNo ?? '',
    docCivilIdSighted: !!checklist.civilIdSighted,
    docBeneficiaryDeclaration: !!checklist.beneficiaryDeclaration,
    docSalaryCertificate: !!checklist.salaryCertificate,
    title: (profile.title ?? 'MR') as Title,
    fullName: profile.fullName ?? '',
    dob: decryptNullable(profile.dobEnc) ?? '',
    nationality: profile.nationality ?? '',
    otherNationalities: parseJson<string[]>(profile.otherNationalitiesJson, []),
    countryOfBirth: profile.countryOfBirth ?? '',
    otherResidencyCountry: profile.otherResidencyCountry ?? '',
    civilIdNo: decryptNullable(profile.civilIdNoEnc) ?? '',
    civilIdExpiry: dateInput(profile.civilIdExpiry),
    passportNo: decryptNullable(profile.passportNoEnc) ?? '',
    passportExpiry: dateInput(profile.passportExpiry),
    residenceCountry: profile.residenceCountry ?? 'KW',
    residenceCity: profile.residenceCity ?? '',
    residenceAddress: decryptNullable(profile.residenceAddressEnc) ?? '',
    mobile: decryptNullable(profile.mobileEnc) ?? '',
    tel: decryptNullable(profile.telEnc) ?? '',
    email: decryptNullable(profile.emailEnc) ?? '',
    employmentStatus: (profile.employmentStatus ?? 'EMPLOYEE') as EmploymentStatus,
    employer: profile.employer ?? '',
    sector: profile.sector ?? '',
    jobTitle: profile.jobTitle ?? '',
    workAddress: profile.workAddress ?? '',
    workPhone: decryptNullable(profile.workPhoneEnc) ?? '',
    workEmail: decryptNullable(profile.workEmailEnc) ?? '',
    preferredContact: (profile.preferredContact ?? 'PERSONAL') as KycFormValues['preferredContact'],
    yearsOfWork: profile.yearsOfWork === null ? '' : String(profile.yearsOfWork),
    selfEmploymentDetails: profile.selfEmploymentDetails ?? '',
    sourcesOfIncome: parseJson<IncomeSource[]>(profile.sourcesOfIncomeJson, []),
    otherIncomeDetail: profile.otherIncomeDetail ?? '',
    annualIncomeKd: profile.annualIncomeKd === null ? '' : String(profile.annualIncomeKd),
    approxWealthKd: profile.approxWealthKd === null ? '' : String(profile.approxWealthKd),
    bankBeneficiaryName: profile.bankBeneficiaryName ?? '',
    bankName: profile.bankName ?? '',
    bankBranch: profile.bankBranch ?? '',
    bankCountry: profile.bankCountry ?? 'KW',
    bankAccountNo: decryptNullable(profile.bankAccountNoEnc) ?? '',
    bankIban: decryptNullable(profile.bankIbanEnc) ?? '',
    bankSwift: profile.bankSwift ?? '',
    bankCurrency: profile.bankCurrency ?? 'KWD',
    isManagedByOther: profile.isManagedByOther,
    managerType: (profile.managerType ?? undefined) as ManagerType | undefined,
    managerTypeOther: profile.managerTypeOther ?? '',
    boName: profile.boName ?? '',
    boNationality: profile.boNationality ?? '',
    boCivilId: decryptNullable(profile.boCivilIdEnc) ?? '',
    boPassport: decryptNullable(profile.boPassportEnc) ?? '',
    boAddress: decryptNullable(profile.boAddressEnc) ?? '',
    boRelation: profile.boRelation ?? '',
    isPep: profile.isPep,
    hasPepRelative: profile.hasPepRelative,
    pepPositions: parseJson<PepPosition[]>(profile.pepPositionsJson, []),
    pepName: profile.pepName ?? '',
    pepRelationship: profile.pepRelationship ?? '',
    pepPositionDetails: profile.pepPositionDetails ?? '',
    isRelatedParty: profile.isRelatedParty,
    relatedParties: parseJson<KycFormValues['relatedParties']>(profile.relatedPartiesJson, []),
    hasControl: profile.hasControl,
    isBoardMember: profile.isBoardMember,
    declarationAccepted: profile.declarationAccepted,
    overrideRating: '',
    overrideJustification: '',
  };
}

