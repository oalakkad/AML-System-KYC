import 'server-only';
import type { KycProfile, KycCase } from '@prisma/client';
import { decryptNullable } from '@/lib/crypto';
import { dictFor, countryName, type Locale } from '@/lib/i18n';
import { formatKd } from '@/lib/utils';
import type { DisplaySection } from '@/components/kyc/case-summary';
import type {
  IncomeSource,
  PepPosition,
  Title,
  EmploymentStatus,
  ManagerType,
} from '@/lib/constants';

const parseJson = <T,>(s: string | null, fallback: T): T => {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

const dateStr = (d: Date | null, locale: Locale) =>
  d ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-GB').format(d) : null;

/** Build the labeled, decrypted read-only sections for the case detail view. */
export function buildDisplaySections(
  kase: Pick<KycCase, 'formType' | 'clientNo'>,
  p: KycProfile,
  countries: { code: string; nameEn: string; nameAr: string }[],
  locale: Locale,
): DisplaySection[] {
  const dict = dictFor(locale);
  const cmap = new Map(countries.map((c) => [c.code, c]));
  const country = (code: string | null) => {
    if (!code) return null;
    const c = cmap.get(code);
    return c ? countryName(locale, c) : code;
  };
  const f = dict.fields;

  const otherNats = parseJson<string[]>(p.otherNationalitiesJson, [])
    .map((c) => country(c))
    .filter(Boolean)
    .join(', ');
  const incomes = parseJson<IncomeSource[]>(p.sourcesOfIncomeJson, [])
    .map((s) => dict.options.income[s])
    .join(', ');
  const peps = parseJson<PepPosition[]>(p.pepPositionsJson, [])
    .map((s) => dict.options.pepPositions[s])
    .join(', ');
  const relatedParties = parseJson<{ name: string; relationship: string }[]>(p.relatedPartiesJson, [])
    .map((r) => `${r.name} (${r.relationship})`)
    .join('; ');
  const yesNo = (b: boolean) => (b ? dict.common.yes : dict.common.no);

  const sections: DisplaySection[] = [
    {
      title: dict.caseView.sections.caseInfo,
      fields: [
        { label: f.formType, value: dict.formType[kase.formType as 'NEW_CLIENT'] },
        { label: f.clientNo, value: kase.clientNo },
      ],
    },
    {
      title: dict.caseView.sections.personal,
      fields: [
        { label: f.title, value: p.title ? dict.options.titles[p.title as Title] : null },
        { label: f.fullName, value: p.fullName },
        { label: f.dob, value: decryptNullable(p.dobEnc) },
        { label: f.nationality, value: country(p.nationality) },
        { label: f.otherNationalities, value: otherNats || null },
        { label: f.countryOfBirth, value: country(p.countryOfBirth) },
        { label: f.otherResidencyCountry, value: country(p.otherResidencyCountry) },
        { label: f.civilIdNo, value: decryptNullable(p.civilIdNoEnc) },
        { label: f.civilIdExpiry, value: dateStr(p.civilIdExpiry, locale) },
        { label: f.passportNo, value: decryptNullable(p.passportNoEnc) },
        { label: f.passportExpiry, value: dateStr(p.passportExpiry, locale) },
        { label: f.residenceCountry, value: country(p.residenceCountry) },
        { label: f.residenceCity, value: p.residenceCity },
        { label: f.residenceAddress, value: decryptNullable(p.residenceAddressEnc) },
        { label: f.mobile, value: decryptNullable(p.mobileEnc) },
        { label: f.tel, value: decryptNullable(p.telEnc) },
        { label: f.email, value: decryptNullable(p.emailEnc) },
      ],
    },
    {
      title: dict.caseView.sections.work,
      fields: [
        {
          label: f.employmentStatus,
          value: p.employmentStatus ? dict.options.employment[p.employmentStatus as EmploymentStatus] : null,
        },
        { label: f.employer, value: p.employer },
        { label: f.sector, value: p.sector },
        { label: f.jobTitle, value: p.jobTitle },
        { label: f.workAddress, value: p.workAddress },
        { label: f.workPhone, value: decryptNullable(p.workPhoneEnc) },
        { label: f.yearsOfWork, value: p.yearsOfWork !== null ? String(p.yearsOfWork) : null },
        { label: f.selfEmploymentDetails, value: p.selfEmploymentDetails },
        { label: f.sourcesOfIncome, value: incomes || null },
        { label: f.otherIncomeDetail, value: p.otherIncomeDetail },
        { label: f.annualIncomeKd, value: p.annualIncomeKd !== null ? formatKd(p.annualIncomeKd, locale) : null },
        { label: f.approxWealthKd, value: p.approxWealthKd !== null ? formatKd(p.approxWealthKd, locale) : null },
      ],
    },
    {
      title: dict.caseView.sections.bank,
      fields: [
        { label: f.bankBeneficiaryName, value: p.bankBeneficiaryName },
        { label: f.bankName, value: p.bankName },
        { label: f.bankBranch, value: p.bankBranch },
        { label: f.bankCountry, value: country(p.bankCountry) },
        { label: f.bankAccountNo, value: decryptNullable(p.bankAccountNoEnc) },
        { label: f.bankIban, value: decryptNullable(p.bankIbanEnc) },
        { label: f.bankSwift, value: p.bankSwift },
        { label: f.bankCurrency, value: p.bankCurrency },
      ],
    },
    {
      title: dict.caseView.sections.beneficialOwner,
      fields: [
        { label: f.isManagedByOther, value: yesNo(p.isManagedByOther) },
        ...(p.isManagedByOther
          ? [
              { label: f.managerType, value: p.managerType ? dict.options.managerType[p.managerType as ManagerType] : null },
              { label: f.boName, value: p.boName },
              { label: f.boNationality, value: country(p.boNationality) },
              { label: f.boCivilId, value: decryptNullable(p.boCivilIdEnc) },
              { label: f.boPassport, value: decryptNullable(p.boPassportEnc) },
              { label: f.boAddress, value: decryptNullable(p.boAddressEnc) },
              { label: f.boRelation, value: p.boRelation },
            ]
          : []),
      ],
    },
    {
      title: dict.caseView.sections.pep,
      fields: [
        { label: f.isPep, value: yesNo(p.isPep) },
        { label: f.hasPepRelative, value: yesNo(p.hasPepRelative) },
        ...(p.isPep || p.hasPepRelative
          ? [
              { label: f.pepPositions, value: peps || null },
              { label: f.pepName, value: p.pepName },
              { label: f.pepRelationship, value: p.pepRelationship },
              { label: f.pepPositionDetails, value: p.pepPositionDetails },
            ]
          : []),
      ],
    },
    {
      title: dict.caseView.sections.relatedParties,
      fields: [
        { label: f.isRelatedParty, value: yesNo(p.isRelatedParty) },
        ...(p.isRelatedParty ? [{ label: dict.fields.relatedPartyName, value: relatedParties || null }] : []),
        { label: f.hasControl, value: yesNo(p.hasControl) },
        { label: f.isBoardMember, value: yesNo(p.isBoardMember) },
      ],
    },
  ];

  return sections;
}
