'use client';

// The eight corporate wizard steps. Each reads/writes the shared react-hook-form
// context. Mirrors src/components/kyc/steps.tsx conventions.

import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  CountrySelect,
  YesNoField,
  CheckboxRow,
  SectionTitle,
  errMsg,
  type CountryOption,
} from '@/components/kyc/shared';
import { DocumentsPanel, type DocItem } from '@/components/kyc/documents-panel';
import { RiskBadge } from '@/components/status-badge';
import {
  COMPANY_TYPES,
  CORPORATE_INCOME_SOURCES,
  CORRESPONDENCE_METHODS,
  EXPERIENCE_YEARS,
  INVESTMENT_EXPERIENCES,
  INVESTMENT_PERIODS,
  INVESTMENT_PURPOSES,
  INVESTMENT_TYPES,
  CLIENT_CATEGORIES,
  PEP_POSITIONS,
  RISK_TOLERANCES,
  RISK_RATINGS,
  TRANSACTION_BANDS,
} from '@/lib/constants';
import type { CorporateFormValues } from '@/lib/cases/corporate-schemas';
import type { RiskResult } from '@/lib/risk/engine';

interface StepProps {
  countries: CountryOption[];
  caseId: string;
  docs: DocItem[];
  onDocsChange: (docs: DocItem[]) => void;
  risk: RiskResult;
}

function useErr() {
  const { dict } = useI18n();
  const {
    formState: { errors },
  } = useFormContext<CorporateFormValues>();
  return (name: string) => errMsg(errors, name, dict);
}

/* ------------------------- Step 1: Company type ------------------------- */
export function CorpStepDocs() {
  const { dict } = useI18n();
  const { register, watch } = useFormContext<CorporateFormValues>();
  const err = useErr();
  const formType = watch('formType');
  const companyType = watch('companyType');
  const c = dict.corporate;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.fields.formType} required error={err('formType')}>
          <Select {...register('formType')}>
            <option value="NEW_CLIENT">{dict.formType.NEW_CLIENT}</option>
            <option value="KYC_UPDATE">{dict.formType.KYC_UPDATE}</option>
          </Select>
        </Field>
        {formType === 'KYC_UPDATE' && (
          <Field label={dict.fields.clientNo} required error={err('clientNo')} hint={dict.fields.clientNoHint}>
            <Input {...register('clientNo')} />
          </Field>
        )}
        <Field label={c.fields.companyType} required error={err('companyType')}>
          <Select {...register('companyType')}>
            {COMPANY_TYPES.map((t) => (
              <option key={t} value={t}>
                {c.options.companyType[t]}
              </option>
            ))}
          </Select>
        </Field>
        {companyType === 'OTHER' && (
          <Field label={c.fields.companyTypeOther} required error={err('companyTypeOther')}>
            <Input {...register('companyTypeOther')} />
          </Field>
        )}
      </div>
    </div>
  );
}

/* ------------------------- Step 2: Company details ------------------------- */
export function CorpStepDetails({ countries }: StepProps) {
  const { dict } = useI18n();
  const { register, control } = useFormContext<CorporateFormValues>();
  const err = useErr();
  const c = dict.corporate;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={c.fields.legalName} required error={err('legalName')} className="lg:col-span-2">
          <Input {...register('legalName')} />
        </Field>
        <Field label={c.fields.incorporationDate} required error={err('incorporationDate')}>
          <Input type="date" {...register('incorporationDate')} />
        </Field>
        <Field label={c.fields.registrationNo} required error={err('registrationNo')}>
          <Input {...register('registrationNo')} />
        </Field>
        <Field label={c.fields.incorporationCountry} required error={err('incorporationCountry')}>
          <Controller
            control={control}
            name="incorporationCountry"
            render={({ field }) => (
              <CountrySelect value={field.value} onChange={field.onChange} countries={countries} invalid={!!err('incorporationCountry')} />
            )}
          />
        </Field>
        <Field label={c.fields.licenseNumber} error={err('licenseNumber')}>
          <Input {...register('licenseNumber')} />
        </Field>
        <Field label={c.fields.licenseExpiry} error={err('licenseExpiry')}>
          <Input type="date" {...register('licenseExpiry')} />
        </Field>
        <Field label={c.fields.authorizedCapitalKd} error={err('authorizedCapitalKd')}>
          <Input dir="ltr" inputMode="decimal" {...register('authorizedCapitalKd')} />
        </Field>
        <Field label={c.fields.paidUpCapitalKd} error={err('paidUpCapitalKd')}>
          <Input dir="ltr" inputMode="decimal" {...register('paidUpCapitalKd')} />
        </Field>
      </div>

      <Field label={c.fields.mainActivities} required error={err('mainActivities')}>
        <Textarea {...register('mainActivities')} />
      </Field>
      <Field label={c.fields.registeredAddress} required error={err('registeredAddress')}>
        <Input {...register('registeredAddress')} />
      </Field>
      <Field label={c.fields.headOfficeAddress} error={err('headOfficeAddress')}>
        <Input {...register('headOfficeAddress')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={c.fields.businessTel} error={err('businessTel')}>
          <Input dir="ltr" type="tel" {...register('businessTel')} />
        </Field>
        <Field label={c.fields.email} required error={err('email')}>
          <Input dir="ltr" type="email" {...register('email')} />
        </Field>
        <Field label={c.fields.taxResidenceCountry} error={err('taxResidenceCountry')}>
          <Controller
            control={control}
            name="taxResidenceCountry"
            render={({ field }) => (
              <CountrySelect value={field.value ?? ''} onChange={field.onChange} countries={countries} allowEmpty />
            )}
          />
        </Field>
        <Field label={c.fields.taxIdNumber} error={err('taxIdNumber')}>
          <Input dir="ltr" {...register('taxIdNumber')} />
        </Field>
      </div>
    </div>
  );
}

/* ------------------------- Step 3: People & structure ------------------------- */
export function CorpStepStructure() {
  const { dict } = useI18n();
  const { register, control } = useFormContext<CorporateFormValues>();
  const err = useErr();
  const c = dict.corporate;

  const signatories = useFieldArray({ control, name: 'authorizedSignatories' });
  const board = useFieldArray({ control, name: 'boardOfDirectors' });
  const executives = useFieldArray({ control, name: 'executiveManagement' });
  const subsidiaries = useFieldArray({ control, name: 'subsidiaries' });

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionTitle>{c.fields.authorizedSignatories}</SectionTitle>
        {signatories.fields.length === 0 && <p className="text-xs text-muted">{err('authorizedSignatories')}</p>}
        {signatories.fields.map((f, i) => (
          <div key={f.id} className="flex items-end gap-2">
            <Field label={c.fields.personName} required error={err(`authorizedSignatories.${i}.name`)} className="flex-1">
              <Input {...register(`authorizedSignatories.${i}.name`)} />
            </Field>
            <Button type="button" variant="ghost" size="sm" onClick={() => signatories.remove(i)} aria-label={dict.common.delete}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => signatories.append({ name: '' })}>
          <Plus className="size-4" aria-hidden />
          {c.fields.addSignatory}
        </Button>
      </div>

      <div className="space-y-3">
        <SectionTitle>{c.fields.boardOfDirectors}</SectionTitle>
        {board.fields.length === 0 && <p className="text-xs text-muted">{err('boardOfDirectors')}</p>}
        {board.fields.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-hairline bg-subtle p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted">#{i + 1}</span>
              <button type="button" onClick={() => board.remove(i)} className="cursor-pointer rounded p-1 text-faint hover:bg-red-50 hover:text-red-600" aria-label={dict.common.delete}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={c.fields.personName} required error={err(`boardOfDirectors.${i}.name`)}>
                <Input {...register(`boardOfDirectors.${i}.name`)} />
              </Field>
              <Field label={c.fields.personNationality} required error={err(`boardOfDirectors.${i}.nationality`)}>
                <Input {...register(`boardOfDirectors.${i}.nationality`)} />
              </Field>
              <Field label={c.fields.personPosition} required error={err(`boardOfDirectors.${i}.position`)}>
                <Input {...register(`boardOfDirectors.${i}.position`)} />
              </Field>
              <Field label={c.fields.personRepresentation} error={err(`boardOfDirectors.${i}.representation`)}>
                <Input {...register(`boardOfDirectors.${i}.representation`)} />
              </Field>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => board.append({ name: '', nationality: '', position: '', representation: '' })}>
          <Plus className="size-4" aria-hidden />
          {c.fields.addBoardMember}
        </Button>
      </div>

      <div className="space-y-3">
        <SectionTitle>{c.fields.executiveManagement}</SectionTitle>
        {executives.fields.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-hairline bg-subtle p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted">#{i + 1}</span>
              <button type="button" onClick={() => executives.remove(i)} className="cursor-pointer rounded p-1 text-faint hover:bg-red-50 hover:text-red-600" aria-label={dict.common.delete}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={c.fields.personName} required error={err(`executiveManagement.${i}.name`)}>
                <Input {...register(`executiveManagement.${i}.name`)} />
              </Field>
              <Field label={c.fields.personNationality} required error={err(`executiveManagement.${i}.nationality`)}>
                <Input {...register(`executiveManagement.${i}.nationality`)} />
              </Field>
              <Field label={c.fields.personPosition} required error={err(`executiveManagement.${i}.position`)}>
                <Input {...register(`executiveManagement.${i}.position`)} />
              </Field>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => executives.append({ name: '', nationality: '', position: '' })}>
          <Plus className="size-4" aria-hidden />
          {c.fields.addExecutive}
        </Button>
      </div>

      <div className="space-y-3">
        <SectionTitle>{c.fields.subsidiaries}</SectionTitle>
        {subsidiaries.fields.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-hairline bg-subtle p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted">#{i + 1}</span>
              <button type="button" onClick={() => subsidiaries.remove(i)} className="cursor-pointer rounded p-1 text-faint hover:bg-red-50 hover:text-red-600" aria-label={dict.common.delete}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={c.fields.subsidiaryCompanyName} required error={err(`subsidiaries.${i}.companyName`)}>
                <Input {...register(`subsidiaries.${i}.companyName`)} />
              </Field>
              <Field label={c.fields.subsidiaryResidencyCountry} required error={err(`subsidiaries.${i}.residencyCountry`)}>
                <Input {...register(`subsidiaries.${i}.residencyCountry`)} />
              </Field>
              <Field label={c.fields.subsidiaryRegisterNumber} error={err(`subsidiaries.${i}.registerNumber`)}>
                <Input {...register(`subsidiaries.${i}.registerNumber`)} />
              </Field>
              <Field label={c.fields.subsidiaryActivity} error={err(`subsidiaries.${i}.activity`)}>
                <Input {...register(`subsidiaries.${i}.activity`)} />
              </Field>
              <Field label={c.fields.subsidiaryOwnership} error={err(`subsidiaries.${i}.ownershipPercentage`)}>
                <Input dir="ltr" inputMode="decimal" {...register(`subsidiaries.${i}.ownershipPercentage`)} />
              </Field>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => subsidiaries.append({ companyName: '', residencyCountry: '', registerNumber: '', activity: '', ownershipPercentage: '' })}>
          <Plus className="size-4" aria-hidden />
          {c.fields.addSubsidiary}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------- Step 4: Regulatory, activity & communication ------------------------- */
export function CorpStepRegulatory() {
  const { dict } = useI18n();
  const { register, control, watch } = useFormContext<CorporateFormValues>();
  const err = useErr();
  const c = dict.corporate;
  const activityHighRisk = watch('activityHighRisk');
  const isListedOnExchange = watch('isListedOnExchange');
  const isRegulatedEntity = watch('isRegulatedEntity');
  const hasFatfDealings = watch('hasFatfDealings');
  const isDirectorOrMajorShareholderOfListed = watch('isDirectorOrMajorShareholderOfListed');
  const hasSignificantShareholding = watch('hasSignificantShareholding');

  const contacts = useFieldArray({ control, name: 'contactPersons' });

  return (
    <div className="space-y-4">
      <Controller control={control} name="activityIncludesSecurities" render={({ field }) => (
        <YesNoField label={c.fields.activityIncludesSecurities} value={field.value} onChange={field.onChange} />
      )} />
      <Controller control={control} name="activityHighRisk" render={({ field }) => (
        <YesNoField label={c.fields.activityHighRisk} value={field.value} onChange={field.onChange} />
      )} />
      {activityHighRisk && (
        <Field label={c.fields.activityHighRiskOther} error={err('activityHighRiskOther')}>
          <Input {...register('activityHighRiskOther')} />
        </Field>
      )}
      <Controller control={control} name="isListedOnExchange" render={({ field }) => (
        <YesNoField label={c.fields.isListedOnExchange} value={field.value} onChange={field.onChange} />
      )} />
      {isListedOnExchange && (
        <Field label={c.fields.listedMarketName} required error={err('listedMarketName')}>
          <Input {...register('listedMarketName')} />
        </Field>
      )}
      <Controller control={control} name="isRegulatedEntity" render={({ field }) => (
        <YesNoField label={c.fields.isRegulatedEntity} value={field.value} onChange={field.onChange} />
      )} />
      {isRegulatedEntity && (
        <Field label={c.fields.regulatorName} required error={err('regulatorName')}>
          <Input {...register('regulatorName')} />
        </Field>
      )}
      <Controller control={control} name="hasFatfDealings" render={({ field }) => (
        <YesNoField label={c.fields.hasFatfDealings} value={field.value} onChange={field.onChange} />
      )} />
      {hasFatfDealings && (
        <Field label={c.fields.fatfDealingsDetail} required error={err('fatfDealingsDetail')}>
          <Textarea {...register('fatfDealingsDetail')} />
        </Field>
      )}
      <Controller control={control} name="isDirectorOrMajorShareholderOfListed" render={({ field }) => (
        <YesNoField label={c.fields.isDirectorOrMajorShareholderOfListed} value={field.value} onChange={field.onChange} />
      )} />
      {isDirectorOrMajorShareholderOfListed && (
        <Field label={c.fields.listedCompanyDetails} required error={err('listedCompanyDetails')}>
          <Textarea {...register('listedCompanyDetails')} />
        </Field>
      )}
      <Controller control={control} name="hasSignificantShareholding" render={({ field }) => (
        <YesNoField label={c.fields.hasSignificantShareholding} value={field.value} onChange={field.onChange} />
      )} />
      {hasSignificantShareholding && (
        <Field label={c.fields.shareholderDetails} required error={err('shareholderDetails')}>
          <Textarea {...register('shareholderDetails')} />
        </Field>
      )}

      <SectionTitle>{c.fields.communicationTitle}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={c.fields.correspondenceMethod} required error={err('correspondenceMethod')}>
          <Select {...register('correspondenceMethod')}>
            {CORRESPONDENCE_METHODS.map((m) => (
              <option key={m} value={m}>{c.options.correspondenceMethod[m]}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Controller control={control} name="reportRetention" render={({ field }) => (
        <CheckboxRow id="reportRetention" label={c.fields.reportRetention} checked={field.value} onChange={field.onChange} />
      )} />

      <div className="space-y-3">
        <SectionTitle>{c.fields.contactPersons}</SectionTitle>
        {contacts.fields.map((f, i) => (
          <div key={f.id} className="flex items-end gap-2">
            <Field label={c.fields.personName} required error={err(`contactPersons.${i}.name`)} className="flex-1">
              <Input {...register(`contactPersons.${i}.name`)} />
            </Field>
            <Field label={c.fields.contactPersonTel} error={err(`contactPersons.${i}.tel`)} className="flex-1">
              <Input dir="ltr" type="tel" {...register(`contactPersons.${i}.tel`)} />
            </Field>
            <Button type="button" variant="ghost" size="sm" onClick={() => contacts.remove(i)} aria-label={dict.common.delete}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
        {contacts.fields.length < 2 && (
          <Button type="button" variant="secondary" size="sm" onClick={() => contacts.append({ name: '', tel: '' })}>
            <Plus className="size-4" aria-hidden />
            {c.fields.addContactPerson}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------- Step 5: Financial & investment ------------------------- */
export function CorpStepFinancial() {
  const { dict } = useI18n();
  const { register, control, watch, setValue } = useFormContext<CorporateFormValues>();
  const err = useErr();
  const c = dict.corporate;
  const isRelatedParty = watch('isRelatedParty');
  const sources = watch('sourcesOfIncome') ?? [];
  const purposes = watch('investmentPurpose') ?? [];
  const experience = watch('investmentExperience');
  const incomeSourcesUsed = watch('incomeSourcesUsed') ?? [];

  return (
    <div className="space-y-4">
      <Field label={c.fields.natureOfBusiness} required error={err('natureOfBusiness')}>
        <Textarea {...register('natureOfBusiness')} />
      </Field>

      <Controller control={control} name="isRelatedParty" render={({ field }) => (
        <YesNoField label={c.fields.isRelatedParty} value={field.value} onChange={field.onChange} />
      )} />
      {isRelatedParty && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={c.fields.relatedPartyName} required error={err('relatedPartyName')}>
            <Input {...register('relatedPartyName')} />
          </Field>
          <Field label={c.fields.relatedPartyRelationship} required error={err('relatedPartyRelationship')}>
            <Input {...register('relatedPartyRelationship')} />
          </Field>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={c.fields.annualNetIncomeKd} required error={err('annualNetIncomeKd')}>
          <Input dir="ltr" inputMode="decimal" {...register('annualNetIncomeKd')} />
        </Field>
        <Field label={c.fields.annualTurnoverKd} required error={err('annualTurnoverKd')}>
          <Input dir="ltr" inputMode="decimal" {...register('annualTurnoverKd')} />
        </Field>
        <Field label={c.fields.capitalKd} required error={err('capitalKd')}>
          <Input dir="ltr" inputMode="decimal" {...register('capitalKd')} />
        </Field>
        <Field label={c.fields.approxWealthKd} required error={err('approxWealthKd')}>
          <Input dir="ltr" inputMode="decimal" {...register('approxWealthKd')} />
        </Field>
      </div>

      <SectionTitle>{c.fields.sourcesOfIncome}</SectionTitle>
      <Controller control={control} name="sourcesOfIncome" render={({ field }) => (
        <div className="grid gap-2 sm:grid-cols-3">
          {CORPORATE_INCOME_SOURCES.map((s) => (
            <CheckboxRow
              key={s}
              id={`income-${s}`}
              label={c.options.sourcesOfIncome[s]}
              checked={field.value?.includes(s) ?? false}
              onChange={(checked) => field.onChange(checked ? [...(field.value ?? []), s] : (field.value ?? []).filter((x) => x !== s))}
            />
          ))}
        </div>
      )} />
      {err('sourcesOfIncome') && <p className="text-xs font-medium text-red-600" role="alert">{err('sourcesOfIncome')}</p>}
      {sources.includes('OTHER') && (
        <Field label={c.fields.otherIncomeDetail} required error={err('otherIncomeDetail')}>
          <Input {...register('otherIncomeDetail')} />
        </Field>
      )}

      <Field label={c.fields.incomeSourcesUsed} hint={c.fields.requiredDocsForIncome}>
        <div className="space-y-2">
          {incomeSourcesUsed.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input {...register(`incomeSourcesUsed.${i}`)} className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue('incomeSourcesUsed', incomeSourcesUsed.filter((_, x) => x !== i))}
                aria-label={dict.common.delete}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
          {incomeSourcesUsed.length < 3 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setValue('incomeSourcesUsed', [...incomeSourcesUsed, ''])}
            >
              <Plus className="size-4" aria-hidden />
              {c.fields.addIncomeSource}
            </Button>
          )}
        </div>
      </Field>

      <SectionTitle>{c.fields.investmentPurpose}</SectionTitle>
      <Controller control={control} name="investmentPurpose" render={({ field }) => (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {INVESTMENT_PURPOSES.map((p) => (
            <CheckboxRow
              key={p}
              id={`purpose-${p}`}
              label={c.options.investmentPurpose[p]}
              checked={field.value?.includes(p) ?? false}
              onChange={(checked) => field.onChange(checked ? [...(field.value ?? []), p] : (field.value ?? []).filter((x) => x !== p))}
            />
          ))}
        </div>
      )} />
      {purposes.includes('OTHER') && (
        <Field label={c.fields.investmentPurposeOther} required error={err('investmentPurposeOther')}>
          <Input {...register('investmentPurposeOther')} />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={c.fields.expectedInvestmentPeriod} required error={err('expectedInvestmentPeriod')}>
          <Select {...register('expectedInvestmentPeriod')}>
            {INVESTMENT_PERIODS.map((p) => <option key={p} value={p}>{c.options.investmentPeriod[p]}</option>)}
          </Select>
        </Field>
        <Field label={c.fields.expectedTransactionBand} required error={err('expectedTransactionBand')}>
          <Select {...register('expectedTransactionBand')}>
            {TRANSACTION_BANDS.map((b) => <option key={b} value={b}>{c.options.transactionBand[b]}</option>)}
          </Select>
        </Field>
        <Field label={c.fields.riskTolerance} required error={err('riskTolerance')}>
          <Select {...register('riskTolerance')}>
            {RISK_TOLERANCES.map((r) => <option key={r} value={r}>{c.options.riskTolerance[r]}</option>)}
          </Select>
        </Field>
        <Field label={c.fields.investmentExperience} required error={err('investmentExperience')}>
          <Select {...register('investmentExperience')}>
            {INVESTMENT_EXPERIENCES.map((e) => <option key={e} value={e}>{c.options.investmentExperience[e]}</option>)}
          </Select>
        </Field>
        <Field label={c.fields.yearsOfExperience} required error={err('yearsOfExperience')}>
          <Select {...register('yearsOfExperience')}>
            {EXPERIENCE_YEARS.map((y) => <option key={y} value={y}>{c.options.experienceYears[y]}</option>)}
          </Select>
        </Field>
      </div>
      {experience === 'OTHER' && (
        <Field label={c.fields.investmentExperienceOther} required error={err('investmentExperienceOther')}>
          <Input {...register('investmentExperienceOther')} />
        </Field>
      )}

      <SectionTitle>{c.fields.investmentTypes}</SectionTitle>
      <Controller control={control} name="investmentTypes" render={({ field }) => (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {INVESTMENT_TYPES.map((t) => (
            <CheckboxRow
              key={t}
              id={`invtype-${t}`}
              label={c.options.investmentType[t]}
              checked={field.value?.includes(t) ?? false}
              onChange={(checked) => field.onChange(checked ? [...(field.value ?? []), t] : (field.value ?? []).filter((x) => x !== t))}
            />
          ))}
        </div>
      )} />
    </div>
  );
}

/* ------------------------- Step 6: Bank accounts ------------------------- */
export function CorpStepBank({ countries }: StepProps) {
  const { dict } = useI18n();
  const { register, control } = useFormContext<CorporateFormValues>();
  const err = useErr();
  const c = dict.corporate;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionTitle hint={c.fields.bankSectionHint}>{c.fields.bank1Title}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={c.fields.bankName} required error={err('bank1Name')}>
            <Input {...register('bank1Name')} />
          </Field>
          <Field label={c.fields.bankCountry} required error={err('bank1Country')}>
            <Controller control={control} name="bank1Country" render={({ field }) => (
              <CountrySelect value={field.value} onChange={field.onChange} countries={countries} invalid={!!err('bank1Country')} />
            )} />
          </Field>
          <Field label={c.fields.bankSwift} error={err('bank1Swift')}>
            <Input dir="ltr" {...register('bank1Swift')} />
          </Field>
          <Field label={c.fields.bankCurrency} required error={err('bank1Currency')}>
            <Input dir="ltr" {...register('bank1Currency')} />
          </Field>
          <Field label={c.fields.bankAccountName} required error={err('bank1AccountName')}>
            <Input {...register('bank1AccountName')} />
          </Field>
          <Field label={c.fields.bankAccountNo} required error={err('bank1AccountNo')}>
            <Input dir="ltr" {...register('bank1AccountNo')} />
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle>{c.fields.bank2Title}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={c.fields.bankName} error={err('bank2Name')}>
            <Input {...register('bank2Name')} />
          </Field>
          <Field label={c.fields.bankCountry} error={err('bank2Country')}>
            <Controller control={control} name="bank2Country" render={({ field }) => (
              <CountrySelect value={field.value ?? ''} onChange={field.onChange} countries={countries} allowEmpty />
            )} />
          </Field>
          <Field label={c.fields.bankSwift} error={err('bank2Swift')}>
            <Input dir="ltr" {...register('bank2Swift')} />
          </Field>
          <Field label={c.fields.bankCurrency} error={err('bank2Currency')}>
            <Input dir="ltr" {...register('bank2Currency')} />
          </Field>
          <Field label={c.fields.bankAccountName} error={err('bank2AccountName')}>
            <Input {...register('bank2AccountName')} />
          </Field>
          <Field label={c.fields.bankAccountNo} error={err('bank2AccountNo')}>
            <Input dir="ltr" {...register('bank2AccountNo')} />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Step 7: Beneficial owner, controlling persons, PEP ------------------------- */
export function CorpStepBeneficialOwner({ countries }: StepProps) {
  const { dict } = useI18n();
  const { register, control, watch } = useFormContext<CorporateFormValues>();
  const err = useErr();
  const c = dict.corporate;
  const tradesOnOwnAccount = watch('tradesOnOwnAccount');
  const hasSignificantInterestPersons = watch('hasSignificantInterestPersons');
  const hasControllingPersons = watch('hasControllingPersons');
  const isPep = watch('isPep');

  const significant = useFieldArray({ control, name: 'significantInterestPersons' });
  const controlling = useFieldArray({ control, name: 'controllingPersons' });

  return (
    <div className="space-y-4">
      <Controller control={control} name="tradesOnOwnAccount" render={({ field }) => (
        <YesNoField label={c.fields.tradesOnOwnAccount} value={field.value} onChange={field.onChange} />
      )} />
      {!tradesOnOwnAccount && (
        <Field label={c.fields.tradesOnBehalfOfOthersDetail} required error={err('tradesOnBehalfOfOthersDetail')}>
          <Input {...register('tradesOnBehalfOfOthersDetail')} />
        </Field>
      )}

      <Controller control={control} name="hasSignificantInterestPersons" render={({ field }) => (
        <YesNoField label={c.fields.hasSignificantInterestPersons} value={field.value} onChange={field.onChange} />
      )} />
      {hasSignificantInterestPersons && (
        <div className="space-y-2">
          {significant.fields.map((f, i) => (
            <div key={f.id} className="flex items-end gap-2">
              <Field label={c.fields.personName} required error={err(`significantInterestPersons.${i}.name`)} className="flex-1">
                <Input {...register(`significantInterestPersons.${i}.name`)} />
              </Field>
              <Button type="button" variant="ghost" size="sm" onClick={() => significant.remove(i)} aria-label={dict.common.delete}>
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
          {significant.fields.length < 3 && (
            <Button type="button" variant="secondary" size="sm" onClick={() => significant.append({ name: '' })}>
              <Plus className="size-4" aria-hidden />
              {c.fields.addPerson}
            </Button>
          )}
        </div>
      )}

      <SectionTitle>{c.fields.boSectionTitle}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={c.fields.boName} error={err('boName')}>
          <Input {...register('boName')} />
        </Field>
        <Field label={c.fields.boNationality} error={err('boNationality')}>
          <Controller control={control} name="boNationality" render={({ field }) => (
            <CountrySelect value={field.value ?? ''} onChange={field.onChange} countries={countries} allowEmpty />
          )} />
        </Field>
        <Field label={c.fields.boPassportNo} error={err('boPassportNo')}>
          <Input dir="ltr" {...register('boPassportNo')} />
        </Field>
        <Field label={c.fields.boCivilId} error={err('boCivilId')}>
          <Input dir="ltr" {...register('boCivilId')} />
        </Field>
        <Field label={c.fields.boAddress} error={err('boAddress')}>
          <Input {...register('boAddress')} />
        </Field>
        <Field label={c.fields.boRelation} error={err('boRelation')}>
          <Input {...register('boRelation')} />
        </Field>
      </div>
      <Controller control={control} name="isUsResidentOrNational" render={({ field }) => (
        <YesNoField label={c.fields.isUsResidentOrNational} value={field.value} onChange={field.onChange} />
      )} />

      <Controller control={control} name="hasControllingPersons" render={({ field }) => (
        <YesNoField label={c.fields.hasControllingPersons} value={field.value} onChange={field.onChange} />
      )} />
      {hasControllingPersons && (
        <div className="space-y-2">
          {controlling.fields.map((f, i) => (
            <div key={f.id} className="flex items-end gap-2">
              <Field label={c.fields.personName} required error={err(`controllingPersons.${i}.name`)} className="flex-1">
                <Input {...register(`controllingPersons.${i}.name`)} />
              </Field>
              <Button type="button" variant="ghost" size="sm" onClick={() => controlling.remove(i)} aria-label={dict.common.delete}>
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
          {controlling.fields.length < 3 && (
            <Button type="button" variant="secondary" size="sm" onClick={() => controlling.append({ name: '' })}>
              <Plus className="size-4" aria-hidden />
              {c.fields.addPerson}
            </Button>
          )}
        </div>
      )}

      <Alert tone="info">{c.fields.pepIntro}</Alert>
      <Controller control={control} name="isPep" render={({ field }) => (
        <YesNoField label={c.fields.isPep} value={field.value} onChange={field.onChange} />
      )} />
      {isPep && (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <SectionTitle>{c.fields.pepPositions}</SectionTitle>
          <Controller control={control} name="pepPositions" render={({ field }) => (
            <div className="grid gap-2 sm:grid-cols-2">
              {PEP_POSITIONS.map((p) => (
                <CheckboxRow
                  key={p}
                  id={`pep-${p}`}
                  label={dict.options.pepPositions[p]}
                  checked={field.value?.includes(p) ?? false}
                  onChange={(checked) => field.onChange(checked ? [...(field.value ?? []), p] : (field.value ?? []).filter((x) => x !== p))}
                />
              ))}
            </div>
          )} />
          {err('pepPositions') && <p className="text-xs font-medium text-red-600" role="alert">{err('pepPositions')}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={c.fields.pepHolderName} required error={err('pepHolderName')}>
              <Input {...register('pepHolderName')} />
            </Field>
            <Field label={c.fields.pepName} error={err('pepName')}>
              <Input {...register('pepName')} />
            </Field>
            <Field label={c.fields.pepRelation} error={err('pepRelation')}>
              <Input {...register('pepRelation')} />
            </Field>
            <Field label={c.fields.pepPositionDetails} required error={err('pepPositionDetails')} className="sm:col-span-2">
              <Textarea {...register('pepPositionDetails')} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- Step 8: Documents, categorization & declaration ------------------------- */
export function CorpStepCategorization({ risk, caseId, docs, onDocsChange }: StepProps) {
  const { dict } = useI18n();
  const { register, control, watch } = useFormContext<CorporateFormValues>();
  const err = useErr();
  const c = dict.corporate;
  const dealsAbroad = watch('dealsWithForeignFinancialInstitutions');
  const overrideRating = watch('overrideRating');
  const order = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const;
  const raisable = RISK_RATINGS.filter((r) => order[r] > order[risk.rating]);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SectionTitle>{c.fields.docsChecklistTitle}</SectionTitle>
        <Controller
          control={control}
          name="docLicenseSighted"
          render={({ field }) => (
            <CheckboxRow id="docLicenseSighted" label={c.fields.docLicense} checked={field.value} onChange={field.onChange} error={err('docLicenseSighted')} />
          )}
        />
        <Controller
          control={control}
          name="docMoaSighted"
          render={({ field }) => (
            <CheckboxRow id="docMoaSighted" label={c.fields.docMoa} checked={field.value} onChange={field.onChange} error={err('docMoaSighted')} />
          )}
        />
        <Controller
          control={control}
          name="docSignatoriesSighted"
          render={({ field }) => (
            <CheckboxRow id="docSignatoriesSighted" label={c.fields.docSignatories} checked={field.value} onChange={field.onChange} error={err('docSignatoriesSighted')} />
          )}
        />
        <Controller
          control={control}
          name="docBoardSighted"
          render={({ field }) => (
            <CheckboxRow id="docBoardSighted" label={c.fields.docBoard} checked={field.value} onChange={field.onChange} error={err('docBoardSighted')} />
          )}
        />
        <Controller
          control={control}
          name="docFinancialsSighted"
          render={({ field }) => (
            <CheckboxRow id="docFinancialsSighted" label={c.fields.docFinancials} checked={field.value} onChange={field.onChange} error={err('docFinancialsSighted')} />
          )}
        />
      </div>

      <div className="space-y-2">
        <SectionTitle>{dict.fields.attachments}</SectionTitle>
        <DocumentsPanel caseId={caseId} docs={docs} onChange={onDocsChange} />
      </div>

      <div className="rounded-xl border border-hairline bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{dict.risk.systemRating}</span>
          <RiskBadge rating={risk.rating} />
        </div>
        <p className="mt-1 text-xs text-muted">
          {dict.risk.score}: <span className="font-semibold tnum text-ink">{risk.score}</span>
        </p>
      </div>

      <Field label={c.fields.clientCategory} required error={err('clientCategory')}>
        <Select {...register('clientCategory')}>
          {CLIENT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{c.options.clientCategory[cat]}</option>)}
        </Select>
      </Field>

      <Controller control={control} name="dealsWithForeignFinancialInstitutions" render={({ field }) => (
        <YesNoField label={c.fields.dealsWithForeignFinancialInstitutions} value={field.value} onChange={field.onChange} />
      )} />
      {dealsAbroad && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={c.fields.foreignInstitutionName} required error={err('foreignInstitutionName')}>
            <Input {...register('foreignInstitutionName')} />
          </Field>
          <Field label={c.fields.foreignInstitutionLocation} required error={err('foreignInstitutionLocation')}>
            <Input {...register('foreignInstitutionLocation')} />
          </Field>
        </div>
      )}

      {raisable.length > 0 && (
        <div className="space-y-3 rounded-xl border border-hairline bg-subtle p-4">
          <Field label={dict.risk.overrideLabel} hint={dict.risk.overrideHint} error={err('overrideRating')}>
            <Select {...register('overrideRating')}>
              <option value="">{dict.common.none}</option>
              {raisable.map((r) => <option key={r} value={r}>{dict.risk[r]}</option>)}
            </Select>
          </Field>
          {overrideRating && (
            <Field label={dict.risk.justification} required error={err('overrideJustification')}>
              <Textarea {...register('overrideJustification')} />
            </Field>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-hairline bg-white p-4">
        <SectionTitle>{c.fields.declarationTitle}</SectionTitle>
        <p className="max-h-48 overflow-y-auto text-xs leading-relaxed text-slate-600">{c.fields.declarationText}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={c.fields.authorizedSignatoryName} error={err('authorizedSignatoryName')}>
            <Input {...register('authorizedSignatoryName')} />
          </Field>
          <Field label={c.fields.authorizedSignatoryPosition} error={err('authorizedSignatoryPosition')}>
            <Input {...register('authorizedSignatoryPosition')} />
          </Field>
        </div>
        <Controller control={control} name="declarationAccepted" render={({ field }) => (
          <CheckboxRow id="declarationAccepted" label={c.fields.declarationAccept} checked={field.value} onChange={field.onChange} error={err('declarationAccepted')} />
        )} />
      </div>
    </div>
  );
}
