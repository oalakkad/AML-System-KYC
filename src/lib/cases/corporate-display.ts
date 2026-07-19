import 'server-only';
import type { CorporateProfile, KycCase } from '@prisma/client';
import { decryptNullable } from '@/lib/crypto';
import { dictFor, countryName, type Locale } from '@/lib/i18n';
import { formatKd } from '@/lib/utils';
import type { DisplaySection } from '@/components/kyc/case-summary';
import type {
  ClientCategory,
  CompanyType,
  CorporateIncomeSource,
  CorrespondenceMethod,
  ExperienceYears,
  InvestmentExperience,
  InvestmentPeriod,
  InvestmentPurpose,
  InvestmentType,
  PepPosition,
  RiskTolerance,
  TransactionBand,
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

/** Build the labeled, decrypted read-only sections for the corporate case detail view. */
export function buildCorporateDisplaySections(
  kase: Pick<KycCase, 'formType' | 'clientNo'>,
  p: CorporateProfile,
  countries: { code: string; nameEn: string; nameAr: string }[],
  locale: Locale,
): DisplaySection[] {
  const dict = dictFor(locale);
  const c = dict.corporate;
  const cmap = new Map(countries.map((cc) => [cc.code, cc]));
  const country = (code: string | null) => {
    if (!code) return null;
    const cc = cmap.get(code);
    return cc ? countryName(locale, cc) : code;
  };
  const yesNo = (b: boolean) => (b ? dict.common.yes : dict.common.no);
  const f = c.fields;

  const signatories = parseJson<{ name: string }[]>(p.authorizedSignatoriesJson, [])
    .map((s) => s.name)
    .join(', ');
  const board = parseJson<{ name: string; position: string }[]>(p.boardOfDirectorsJson, [])
    .map((m) => `${m.name} (${m.position})`)
    .join('; ');
  const executives = parseJson<{ name: string; position: string }[]>(p.executiveManagementJson, [])
    .map((m) => `${m.name} (${m.position})`)
    .join('; ');
  const subsidiaries = parseJson<{ companyName: string; residencyCountry: string }[]>(
    p.subsidiariesJson,
    [],
  )
    .map((s) => `${s.companyName} (${s.residencyCountry})`)
    .join('; ');
  const contacts = parseJson<{ name: string; tel: string }[]>(p.contactPersonsJson, [])
    .map((x) => `${x.name} — ${x.tel}`)
    .join('; ');
  const incomes = parseJson<CorporateIncomeSource[]>(p.sourcesOfIncomeJson, [])
    .map((s) => c.options.sourcesOfIncome[s])
    .join(', ');
  const purposes = parseJson<InvestmentPurpose[]>(p.investmentPurposeJson, [])
    .map((s) => c.options.investmentPurpose[s])
    .join(', ');
  const invTypes = parseJson<InvestmentType[]>(p.investmentTypesJson, [])
    .map((s) => c.options.investmentType[s])
    .join(', ');
  const significantPersons = parseJson<{ name: string }[]>(p.significantInterestPersonsJson, [])
    .map((x) => x.name)
    .join(', ');
  const controllingPersons = parseJson<{ name: string }[]>(p.controllingPersonsJson, [])
    .map((x) => x.name)
    .join(', ');
  const peps = parseJson<PepPosition[]>(p.pepPositionsJson, [])
    .map((s) => dict.options.pepPositions[s])
    .join(', ');

  return [
    {
      title: dict.caseView.sections.caseInfo,
      fields: [
        { label: dict.fields.formType, value: dict.formType[kase.formType as 'NEW_CLIENT'] },
        { label: dict.fields.clientNo, value: kase.clientNo },
      ],
    },
    {
      title: c.caseView.sections.companyType,
      fields: [
        {
          label: f.companyType,
          value: p.companyType ? c.options.companyType[p.companyType as CompanyType] : null,
        },
        { label: f.companyTypeOther, value: p.companyTypeOther },
      ],
    },
    {
      title: c.caseView.sections.companyDetails,
      fields: [
        { label: f.legalName, value: p.legalName },
        { label: f.incorporationDate, value: dateStr(p.incorporationDate, locale) },
        { label: f.mainActivities, value: p.mainActivities },
        { label: f.registrationNo, value: p.registrationNo },
        { label: f.incorporationCountry, value: country(p.incorporationCountry) },
        { label: f.registeredAddress, value: p.registeredAddress },
        { label: f.headOfficeAddress, value: p.headOfficeAddress },
        { label: f.businessTel, value: decryptNullable(p.businessTelEnc) },
        { label: f.email, value: decryptNullable(p.emailEnc) },
        { label: f.taxResidenceCountry, value: country(p.taxResidenceCountry) },
        { label: f.taxIdNumber, value: decryptNullable(p.taxIdNumberEnc) },
        { label: f.licenseExpiry, value: dateStr(p.licenseExpiry, locale) },
        { label: f.authorizedCapitalKd, value: p.authorizedCapitalKd !== null ? formatKd(p.authorizedCapitalKd, locale) : null },
        { label: f.paidUpCapitalKd, value: p.paidUpCapitalKd !== null ? formatKd(p.paidUpCapitalKd, locale) : null },
        { label: f.licenseNumber, value: p.licenseNumber },
      ],
    },
    { title: c.caseView.sections.signatories, fields: [{ label: f.authorizedSignatories, value: signatories || null }] },
    { title: c.caseView.sections.board, fields: [{ label: f.boardOfDirectors, value: board || null }] },
    { title: c.caseView.sections.executives, fields: [{ label: f.executiveManagement, value: executives || null }] },
    { title: c.caseView.sections.subsidiaries, fields: [{ label: f.subsidiaries, value: subsidiaries || null }] },
    {
      title: c.caseView.sections.regulatory,
      fields: [
        { label: f.activityIncludesSecurities, value: yesNo(p.activityIncludesSecurities) },
        { label: f.activityHighRisk, value: yesNo(p.activityHighRisk) },
        ...(p.activityHighRisk ? [{ label: f.activityHighRiskOther, value: p.activityHighRiskOther }] : []),
        { label: f.isListedOnExchange, value: yesNo(p.isListedOnExchange) },
        ...(p.isListedOnExchange ? [{ label: f.listedMarketName, value: p.listedMarketName }] : []),
        { label: f.isRegulatedEntity, value: yesNo(p.isRegulatedEntity) },
        ...(p.isRegulatedEntity ? [{ label: f.regulatorName, value: p.regulatorName }] : []),
        { label: f.hasFatfDealings, value: yesNo(p.hasFatfDealings) },
        ...(p.hasFatfDealings ? [{ label: f.fatfDealingsDetail, value: p.fatfDealingsDetail }] : []),
        {
          label: f.isDirectorOrMajorShareholderOfListed,
          value: yesNo(p.isDirectorOrMajorShareholderOfListed),
        },
        ...(p.isDirectorOrMajorShareholderOfListed
          ? [{ label: f.listedCompanyDetails, value: p.listedCompanyDetails }]
          : []),
        { label: f.hasSignificantShareholding, value: yesNo(p.hasSignificantShareholding) },
        ...(p.hasSignificantShareholding ? [{ label: f.shareholderDetails, value: p.shareholderDetails }] : []),
      ],
    },
    {
      title: c.caseView.sections.communication,
      fields: [
        {
          label: f.correspondenceMethod,
          value: p.correspondenceMethod
            ? c.options.correspondenceMethod[p.correspondenceMethod as CorrespondenceMethod]
            : null,
        },
        { label: f.reportRetention, value: yesNo(p.reportRetention) },
        { label: f.contactPersons, value: contacts || null },
      ],
    },
    {
      title: c.caseView.sections.financial,
      fields: [
        { label: f.natureOfBusiness, value: p.natureOfBusiness },
        { label: f.isRelatedParty, value: yesNo(p.isRelatedParty) },
        ...(p.isRelatedParty
          ? [
              { label: f.relatedPartyName, value: p.relatedPartyName },
              { label: f.relatedPartyRelationship, value: p.relatedPartyRelationship },
            ]
          : []),
        { label: f.annualNetIncomeKd, value: p.annualNetIncomeKd !== null ? formatKd(p.annualNetIncomeKd, locale) : null },
        { label: f.annualTurnoverKd, value: p.annualTurnoverKd !== null ? formatKd(p.annualTurnoverKd, locale) : null },
        { label: f.capitalKd, value: p.capitalKd !== null ? formatKd(p.capitalKd, locale) : null },
        { label: f.approxWealthKd, value: p.approxWealthKd !== null ? formatKd(p.approxWealthKd, locale) : null },
        { label: f.sourcesOfIncome, value: incomes || null },
        { label: f.otherIncomeDetail, value: p.otherIncomeDetail },
        { label: f.investmentPurpose, value: purposes || null },
        {
          label: f.expectedInvestmentPeriod,
          value: p.expectedInvestmentPeriod
            ? c.options.investmentPeriod[p.expectedInvestmentPeriod as InvestmentPeriod]
            : null,
        },
        {
          label: f.expectedTransactionBand,
          value: p.expectedTransactionBand
            ? c.options.transactionBand[p.expectedTransactionBand as TransactionBand]
            : null,
        },
        {
          label: f.riskTolerance,
          value: p.riskTolerance ? c.options.riskTolerance[p.riskTolerance as RiskTolerance] : null,
        },
        {
          label: f.investmentExperience,
          value: p.investmentExperience
            ? c.options.investmentExperience[p.investmentExperience as InvestmentExperience]
            : null,
        },
        { label: f.investmentTypes, value: invTypes || null },
        {
          label: f.yearsOfExperience,
          value: p.yearsOfExperience ? c.options.experienceYears[p.yearsOfExperience as ExperienceYears] : null,
        },
      ],
    },
    {
      title: c.caseView.sections.bank,
      fields: [
        { label: `${f.bank1Title} — ${f.bankName}`, value: p.bank1Name },
        { label: `${f.bank1Title} — ${f.bankCountry}`, value: country(p.bank1Country) },
        { label: `${f.bank1Title} — ${f.bankAccountNo}`, value: decryptNullable(p.bank1AccountNoEnc) },
        { label: `${f.bank2Title} — ${f.bankName}`, value: p.bank2Name },
        { label: `${f.bank2Title} — ${f.bankAccountNo}`, value: decryptNullable(p.bank2AccountNoEnc) },
      ],
    },
    {
      title: c.caseView.sections.beneficialOwner,
      fields: [
        { label: f.tradesOnOwnAccount, value: yesNo(p.tradesOnOwnAccount) },
        ...(!p.tradesOnOwnAccount
          ? [{ label: f.tradesOnBehalfOfOthersDetail, value: p.tradesOnBehalfOfOthersDetail }]
          : []),
        { label: f.hasSignificantInterestPersons, value: yesNo(p.hasSignificantInterestPersons) },
        ...(p.hasSignificantInterestPersons
          ? [{ label: f.significantInterestPersons, value: significantPersons || null }]
          : []),
        { label: f.boName, value: p.boName },
        { label: f.boNationality, value: country(p.boNationality) },
        { label: f.boCivilId, value: decryptNullable(p.boCivilIdEnc) },
        { label: f.boPassportNo, value: decryptNullable(p.boPassportNoEnc) },
        { label: f.boAddress, value: decryptNullable(p.boAddressEnc) },
        { label: f.boRelation, value: p.boRelation },
        { label: f.isUsResidentOrNational, value: yesNo(p.isUsResidentOrNational) },
        { label: f.hasControllingPersons, value: yesNo(p.hasControllingPersons) },
        ...(p.hasControllingPersons ? [{ label: f.controllingPersons, value: controllingPersons || null }] : []),
      ],
    },
    {
      title: c.caseView.sections.pep,
      fields: [
        { label: f.isPep, value: yesNo(p.isPep) },
        ...(p.isPep
          ? [
              { label: f.pepPositions, value: peps || null },
              { label: f.pepHolderName, value: p.pepHolderName },
              { label: f.pepName, value: p.pepName },
              { label: f.pepPositionDetails, value: p.pepPositionDetails },
              { label: f.pepRelation, value: p.pepRelation },
            ]
          : []),
      ],
    },
    {
      title: c.caseView.sections.categorization,
      fields: [
        {
          label: f.clientCategory,
          value: p.clientCategory ? c.options.clientCategory[p.clientCategory as ClientCategory] : null,
        },
        { label: f.dealsWithForeignFinancialInstitutions, value: yesNo(p.dealsWithForeignFinancialInstitutions) },
        ...(p.dealsWithForeignFinancialInstitutions
          ? [
              { label: f.foreignInstitutionName, value: p.foreignInstitutionName },
              { label: f.foreignInstitutionLocation, value: p.foreignInstitutionLocation },
            ]
          : []),
      ],
    },
  ];
}
