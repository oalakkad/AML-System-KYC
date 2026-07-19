'use client';

// The seven wizard steps. Each reads/writes the shared react-hook-form context.
// Country <select>s and the documents panel are wired via props from the wizard.

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
} from './shared';
import { DocumentsPanel, type DocItem } from './documents-panel';
import { RiskBadge } from '@/components/status-badge';
import {
  EMPLOYMENT_STATUSES,
  INCOME_SOURCES,
  MANAGER_TYPES,
  PEP_POSITIONS,
  PREFERRED_CONTACTS,
  TITLES,
  RISK_RATINGS,
} from '@/lib/constants';
import type { KycFormValues } from '@/lib/cases/schemas';
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
  } = useFormContext<KycFormValues>();
  return (name: string) => errMsg(errors, name, dict);
}

/* ------------------------- Step 1: Case info ------------------------- */
export function StepCase() {
  const { dict } = useI18n();
  const { register, watch } = useFormContext<KycFormValues>();
  const err = useErr();
  const formType = watch('formType');

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
      </div>
    </div>
  );
}

/* ------------------------- Step 2: Personal ------------------------- */
export function StepPersonal({ countries }: StepProps) {
  const { dict } = useI18n();
  const { register, control, watch } = useFormContext<KycFormValues>();
  const err = useErr();
  const passportNo = watch('passportNo');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={dict.fields.title} required error={err('title')}>
          <Select {...register('title')}>
            {TITLES.map((t) => (
              <option key={t} value={t}>
                {dict.options.titles[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={dict.fields.fullName} required error={err('fullName')} className="sm:col-span-2">
          <Input {...register('fullName')} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={dict.fields.dob} required error={err('dob')}>
          <Input type="date" {...register('dob')} />
        </Field>
        <Field label={dict.fields.nationality} required error={err('nationality')}>
          <Controller
            control={control}
            name="nationality"
            render={({ field }) => (
              <CountrySelect value={field.value} onChange={field.onChange} countries={countries} invalid={!!err('nationality')} />
            )}
          />
        </Field>
        <Field label={dict.fields.countryOfBirth} required error={err('countryOfBirth')}>
          <Controller
            control={control}
            name="countryOfBirth"
            render={({ field }) => (
              <CountrySelect value={field.value} onChange={field.onChange} countries={countries} invalid={!!err('countryOfBirth')} />
            )}
          />
        </Field>
        <Field label={dict.fields.otherResidencyCountry} error={err('otherResidencyCountry')}>
          <Controller
            control={control}
            name="otherResidencyCountry"
            render={({ field }) => (
              <CountrySelect value={field.value ?? ''} onChange={field.onChange} countries={countries} allowEmpty />
            )}
          />
        </Field>
        <Field label={dict.fields.civilIdNo} required error={err('civilIdNo')}>
          <Input dir="ltr" inputMode="numeric" maxLength={12} {...register('civilIdNo')} />
        </Field>
        <Field label={dict.fields.civilIdExpiry} required error={err('civilIdExpiry')}>
          <Input type="date" {...register('civilIdExpiry')} />
        </Field>
        <Field label={dict.fields.passportNo} error={err('passportNo')}>
          <Input dir="ltr" {...register('passportNo')} />
        </Field>
        <Field label={dict.fields.passportExpiry} required={!!passportNo} error={err('passportExpiry')}>
          <Input type="date" {...register('passportExpiry')} />
        </Field>
      </div>

      <SectionTitle>{dict.fields.residenceAddress}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={dict.fields.residenceCountry} required error={err('residenceCountry')}>
          <Controller
            control={control}
            name="residenceCountry"
            render={({ field }) => (
              <CountrySelect value={field.value} onChange={field.onChange} countries={countries} invalid={!!err('residenceCountry')} />
            )}
          />
        </Field>
        <Field label={dict.fields.residenceCity} required error={err('residenceCity')}>
          <Input {...register('residenceCity')} />
        </Field>
        <Field label={dict.fields.residenceAddress} required error={err('residenceAddress')} className="lg:col-span-1 sm:col-span-2">
          <Input {...register('residenceAddress')} />
        </Field>
        <Field label={dict.fields.mobile} required error={err('mobile')}>
          <Input dir="ltr" type="tel" {...register('mobile')} />
        </Field>
        <Field label={dict.fields.tel} error={err('tel')}>
          <Input dir="ltr" type="tel" {...register('tel')} />
        </Field>
        <Field label={dict.fields.email} required error={err('email')}>
          <Input dir="ltr" type="email" {...register('email')} />
        </Field>
      </div>
    </div>
  );
}

/* ------------------------- Step 3: Work & income ------------------------- */
export function StepWork({ countries }: StepProps) {
  const { dict } = useI18n();
  const { register, control, watch } = useFormContext<KycFormValues>();
  const err = useErr();
  const employmentStatus = watch('employmentStatus');
  const sources = watch('sourcesOfIncome') ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={dict.fields.employmentStatus} required error={err('employmentStatus')}>
          <Select {...register('employmentStatus')}>
            {EMPLOYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {dict.options.employment[s]}
              </option>
            ))}
          </Select>
        </Field>
        {employmentStatus === 'EMPLOYEE' && (
          <>
            <Field label={dict.fields.employer} required error={err('employer')}>
              <Input {...register('employer')} />
            </Field>
            <Field label={dict.fields.sector} required error={err('sector')}>
              <Input {...register('sector')} />
            </Field>
            <Field label={dict.fields.jobTitle} required error={err('jobTitle')}>
              <Input {...register('jobTitle')} />
            </Field>
            <Field label={dict.fields.workAddress} required error={err('workAddress')}>
              <Input {...register('workAddress')} />
            </Field>
            <Field label={dict.fields.workPhone} error={err('workPhone')}>
              <Input dir="ltr" type="tel" {...register('workPhone')} />
            </Field>
            <Field label={dict.fields.workEmail} error={err('workEmail')}>
              <Input dir="ltr" type="email" {...register('workEmail')} />
            </Field>
          </>
        )}
        {employmentStatus === 'SELF_EMPLOYED' && (
          <Field label={dict.fields.selfEmploymentDetails} required error={err('selfEmploymentDetails')} className="sm:col-span-2">
            <Input {...register('selfEmploymentDetails')} />
          </Field>
        )}
        <Field label={dict.fields.yearsOfWork} error={err('yearsOfWork')}>
          <Input dir="ltr" inputMode="numeric" {...register('yearsOfWork')} />
        </Field>
        <Field label={dict.fields.preferredContact} required error={err('preferredContact')}>
          <Controller
            control={control}
            name="preferredContact"
            render={({ field }) => (
              <div className="flex gap-4 pt-2">
                {PREFERRED_CONTACTS.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="radio"
                      name="preferredContact"
                      value={c}
                      checked={field.value === c}
                      onChange={() => field.onChange(c)}
                      className="size-4 accent-primary"
                    />
                    {dict.options.preferredContact[c]}
                  </label>
                ))}
              </div>
            )}
          />
        </Field>
      </div>

      <SectionTitle>{dict.fields.sourcesOfIncome}</SectionTitle>
      <Controller
        control={control}
        name="sourcesOfIncome"
        render={({ field }) => (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {INCOME_SOURCES.map((s) => (
              <CheckboxRow
                key={s}
                id={`income-${s}`}
                label={dict.options.income[s]}
                checked={field.value?.includes(s) ?? false}
                onChange={(checked) =>
                  field.onChange(
                    checked ? [...(field.value ?? []), s] : (field.value ?? []).filter((x) => x !== s),
                  )
                }
              />
            ))}
          </div>
        )}
      />
      {err('sourcesOfIncome') && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {err('sourcesOfIncome')}
        </p>
      )}
      {sources.includes('OTHER') && (
        <Field label={dict.fields.otherIncomeDetail} required error={err('otherIncomeDetail')}>
          <Input {...register('otherIncomeDetail')} />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.fields.annualIncomeKd} required error={err('annualIncomeKd')}>
          <Input dir="ltr" inputMode="decimal" {...register('annualIncomeKd')} />
        </Field>
        <Field label={dict.fields.approxWealthKd} required error={err('approxWealthKd')}>
          <Input dir="ltr" inputMode="decimal" {...register('approxWealthKd')} />
        </Field>
      </div>

      <SectionTitle hint={dict.fields.bankSectionHint}>{dict.fields.bankSectionTitle}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={dict.fields.bankBeneficiaryName} required error={err('bankBeneficiaryName')}>
          <Input {...register('bankBeneficiaryName')} />
        </Field>
        <Field label={dict.fields.bankName} required error={err('bankName')}>
          <Input {...register('bankName')} />
        </Field>
        <Field label={dict.fields.bankBranch} error={err('bankBranch')}>
          <Input {...register('bankBranch')} />
        </Field>
        <Field label={dict.fields.bankCountry} required error={err('bankCountry')}>
          <Controller
            control={control}
            name="bankCountry"
            render={({ field }) => (
              <CountrySelect value={field.value} onChange={field.onChange} countries={countries} invalid={!!err('bankCountry')} />
            )}
          />
        </Field>
        <Field label={dict.fields.bankAccountNo} error={err('bankAccountNo')}>
          <Input dir="ltr" {...register('bankAccountNo')} />
        </Field>
        <Field label={dict.fields.bankIban} required error={err('bankIban')}>
          <Input dir="ltr" {...register('bankIban')} />
        </Field>
        <Field label={dict.fields.bankSwift} error={err('bankSwift')}>
          <Input dir="ltr" {...register('bankSwift')} />
        </Field>
        <Field label={dict.fields.bankCurrency} required error={err('bankCurrency')}>
          <Input dir="ltr" {...register('bankCurrency')} />
        </Field>
      </div>
    </div>
  );
}

/* ------------------------- Step 4: Beneficial owner ------------------------- */
export function StepBeneficialOwner({ countries }: StepProps) {
  const { dict } = useI18n();
  const { register, control, watch } = useFormContext<KycFormValues>();
  const err = useErr();
  const managed = watch('isManagedByOther');
  const managerType = watch('managerType');

  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name="isManagedByOther"
        render={({ field }) => (
          <YesNoField label={dict.fields.isManagedByOther} value={field.value} onChange={field.onChange} />
        )}
      />
      {managed && (
        <div className="space-y-4 rounded-xl border border-hairline bg-subtle p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={dict.fields.managerType} required error={err('managerType')}>
              <Select {...register('managerType')}>
                <option value="">{dict.common.select}</option>
                {MANAGER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {dict.options.managerType[t]}
                  </option>
                ))}
              </Select>
            </Field>
            {managerType === 'OTHER' && (
              <Field label={dict.fields.managerTypeOther} required error={err('managerTypeOther')}>
                <Input {...register('managerTypeOther')} />
              </Field>
            )}
          </div>
          <SectionTitle>{dict.fields.boSectionTitle}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={dict.fields.boName} required error={err('boName')}>
              <Input {...register('boName')} />
            </Field>
            <Field label={dict.fields.boNationality} required error={err('boNationality')}>
              <Controller
                control={control}
                name="boNationality"
                render={({ field }) => (
                  <CountrySelect value={field.value ?? ''} onChange={field.onChange} countries={countries} invalid={!!err('boNationality')} />
                )}
              />
            </Field>
            <Field label={dict.fields.boCivilId} required error={err('boCivilId')}>
              <Input dir="ltr" {...register('boCivilId')} />
            </Field>
            <Field label={dict.fields.boPassport} error={err('boPassport')}>
              <Input dir="ltr" {...register('boPassport')} />
            </Field>
            <Field label={dict.fields.boAddress} required error={err('boAddress')}>
              <Input {...register('boAddress')} />
            </Field>
            <Field label={dict.fields.boRelation} required error={err('boRelation')}>
              <Input {...register('boRelation')} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- Step 5: PEP ------------------------- */
export function StepPep() {
  const { dict } = useI18n();
  const { register, control, watch } = useFormContext<KycFormValues>();
  const err = useErr();
  const isPep = watch('isPep');
  const hasPepRelative = watch('hasPepRelative');
  const showDetails = isPep || hasPepRelative;

  return (
    <div className="space-y-4">
      <Alert tone="info">{dict.fields.pepIntro}</Alert>
      <Controller
        control={control}
        name="isPep"
        render={({ field }) => (
          <YesNoField label={dict.fields.isPep} value={field.value} onChange={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="hasPepRelative"
        render={({ field }) => (
          <YesNoField label={dict.fields.hasPepRelative} value={field.value} onChange={field.onChange} />
        )}
      />
      {showDetails && (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <SectionTitle>{dict.fields.pepPositions}</SectionTitle>
          <Controller
            control={control}
            name="pepPositions"
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {PEP_POSITIONS.map((p) => (
                  <CheckboxRow
                    key={p}
                    id={`pep-${p}`}
                    label={dict.options.pepPositions[p]}
                    checked={field.value?.includes(p) ?? false}
                    onChange={(checked) =>
                      field.onChange(
                        checked ? [...(field.value ?? []), p] : (field.value ?? []).filter((x) => x !== p),
                      )
                    }
                  />
                ))}
              </div>
            )}
          />
          {err('pepPositions') && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {err('pepPositions')}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {hasPepRelative && (
              <>
                <Field label={dict.fields.pepName} required error={err('pepName')}>
                  <Input {...register('pepName')} />
                </Field>
                <Field label={dict.fields.pepRelationship} required error={err('pepRelationship')}>
                  <Input {...register('pepRelationship')} />
                </Field>
              </>
            )}
            <Field label={dict.fields.pepPositionDetails} required error={err('pepPositionDetails')} className="sm:col-span-2">
              <Textarea {...register('pepPositionDetails')} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- Step 6: Related parties ------------------------- */
export function StepRelatedParties() {
  const { dict } = useI18n();
  const { register, control, watch } = useFormContext<KycFormValues>();
  const err = useErr();
  const isRelated = watch('isRelatedParty');
  const { fields, append, remove } = useFieldArray({ control, name: 'relatedParties' });

  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name="isRelatedParty"
        render={({ field }) => (
          <YesNoField label={dict.fields.isRelatedParty} value={field.value} onChange={field.onChange} />
        )}
      />
      {isRelated && (
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={f.id} className="rounded-xl border border-hairline bg-subtle p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted">#{i + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="cursor-pointer rounded p-1 text-faint transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={dict.common.delete}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={dict.fields.relatedPartyName} required error={err(`relatedParties.${i}.name`)}>
                  <Input {...register(`relatedParties.${i}.name`)} />
                </Field>
                <Field label={dict.fields.relatedPartyRelationship} required error={err(`relatedParties.${i}.relationship`)}>
                  <Input {...register(`relatedParties.${i}.relationship`)} />
                </Field>
                <Field label={dict.fields.relatedPartyRelativeRelation} error={err(`relatedParties.${i}.relativeRelation`)}>
                  <Input {...register(`relatedParties.${i}.relativeRelation`)} />
                </Field>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ name: '', relationship: '', relativeRelation: '' })}
          >
            <Plus className="size-4" aria-hidden />
            {dict.fields.addRelatedParty}
          </Button>
          {err('relatedParties') && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {err('relatedParties')}
            </p>
          )}
        </div>
      )}
      <div className="space-y-3">
        <Controller
          control={control}
          name="hasControl"
          render={({ field }) => (
            <YesNoField label={dict.fields.hasControl} value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="isBoardMember"
          render={({ field }) => (
            <YesNoField label={dict.fields.isBoardMember} value={field.value} onChange={field.onChange} />
          )}
        />
      </div>
    </div>
  );
}

/* ------------------------- Step 7: Documents, review & declaration ------------------------- */
export function StepReview({ risk, caseId, docs, onDocsChange }: StepProps) {
  const { dict } = useI18n();
  const { register, control, watch } = useFormContext<KycFormValues>();
  const err = useErr();
  const overrideRating = watch('overrideRating');
  // Ratings the maker may raise TO (>= system rating)
  const order = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const;
  const raisable = RISK_RATINGS.filter((r) => order[r] > order[risk.rating]);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SectionTitle>{dict.fields.docsChecklistTitle}</SectionTitle>
        <Controller
          control={control}
          name="docCivilIdSighted"
          render={({ field }) => (
            <CheckboxRow
              id="docCivilIdSighted"
              label={dict.fields.docCivilId}
              checked={field.value}
              onChange={field.onChange}
              error={err('docCivilIdSighted')}
            />
          )}
        />
        <Controller
          control={control}
          name="docBeneficiaryDeclaration"
          render={({ field }) => (
            <CheckboxRow
              id="docBeneficiaryDeclaration"
              label={dict.fields.docBeneficialOwnerDecl}
              checked={field.value}
              onChange={field.onChange}
              error={err('docBeneficiaryDeclaration')}
            />
          )}
        />
        <Controller
          control={control}
          name="docSalaryCertificate"
          render={({ field }) => (
            <CheckboxRow
              id="docSalaryCertificate"
              label={dict.fields.docSalaryCert}
              checked={field.value}
              onChange={field.onChange}
              error={err('docSalaryCertificate')}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <SectionTitle>{dict.fields.attachments}</SectionTitle>
        <DocumentsPanel caseId={caseId} docs={docs} onChange={onDocsChange} />
      </div>

      <div className="rounded-xl border border-hairline bg-subtle p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{dict.risk.systemRating}</span>
          <RiskBadge rating={risk.rating} />
        </div>
        <p className="mt-1 text-xs text-muted">
          {dict.risk.score}: <span className="font-semibold tnum text-ink">{risk.score}</span>
        </p>
      </div>

      {raisable.length > 0 && (
        <div className="space-y-3 rounded-xl border border-hairline bg-subtle p-4">
          <Field label={dict.risk.overrideLabel} hint={dict.risk.overrideHint} error={err('overrideRating')}>
            <Select {...register('overrideRating')}>
              <option value="">{dict.common.none}</option>
              {raisable.map((r) => (
                <option key={r} value={r}>
                  {dict.risk[r]}
                </option>
              ))}
            </Select>
          </Field>
          {overrideRating && (
            <Field label={dict.risk.justification} required error={err('overrideJustification')}>
              <Textarea {...register('overrideJustification')} />
            </Field>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-hairline bg-subtle p-4">
        <SectionTitle>{dict.fields.declarationTitle}</SectionTitle>
        <p className="max-h-48 overflow-y-auto text-xs leading-relaxed text-slate-600">
          {dict.fields.declarationText}
        </p>
        <Controller
          control={control}
          name="declarationAccepted"
          render={({ field }) => (
            <CheckboxRow
              id="declarationAccepted"
              label={dict.fields.declarationAccept}
              checked={field.value}
              onChange={field.onChange}
              error={err('declarationAccepted')}
            />
          )}
        />
      </div>
    </div>
  );
}
