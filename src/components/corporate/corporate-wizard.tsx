'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { useI18n, interpolate } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { WizardShell } from '@/components/wizard-shell';
import {
  corporateFormSchema,
  CORPORATE_STEP_FIELDS,
  type CorporateFormValues,
} from '@/lib/cases/corporate-schemas';
import { saveCorporateCaseDraft, submitCorporateCase } from '@/lib/cases/corporate-actions';
import { buildCorporateRiskInput } from '@/lib/cases/corporate-risk-input';
import { assessCorporateRisk } from '@/lib/risk/engine';
import type { FatfStatus } from '@/lib/constants';
import {
  CorpStepDocs,
  CorpStepDetails,
  CorpStepStructure,
  CorpStepRegulatory,
  CorpStepFinancial,
  CorpStepBank,
  CorpStepBeneficialOwner,
  CorpStepCategorization,
} from './corporate-steps';
import { RiskPanel } from '@/components/kyc/risk-panel';
import { FatfDialog, type FatfFlag } from '@/components/kyc/fatf-dialog';
import type { CountryOption } from '@/components/kyc/shared';
import type { DocItem } from '@/components/kyc/documents-panel';

interface WizardProps {
  caseId: string;
  initialValues: CorporateFormValues;
  countries: CountryOption[];
  initialDocs: DocItem[];
  fatfSettings: { domesticCountryCode: string; greyListRequiresDocument: boolean };
  returnedNotes?: string | null;
}

const STEPS = [
  { key: 'companyDocs', Comp: CorpStepDocs },
  { key: 'companyDetails', Comp: CorpStepDetails },
  { key: 'structure', Comp: CorpStepStructure },
  { key: 'regulatory', Comp: CorpStepRegulatory },
  { key: 'financial', Comp: CorpStepFinancial },
  { key: 'bankAccounts', Comp: CorpStepBank },
  { key: 'beneficialOwner', Comp: CorpStepBeneficialOwner },
  { key: 'categorization', Comp: CorpStepCategorization },
] as const;

export function CorporateWizard({
  caseId,
  initialValues,
  countries,
  initialDocs,
  fatfSettings,
  returnedNotes,
}: WizardProps) {
  const { dict } = useI18n();
  const c = dict.corporate;
  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState<DocItem[]>(initialDocs);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [fatfOpen, setFatfOpen] = useState(false);
  const [ackFlagKey, setAckFlagKey] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<CorporateFormValues>({
    resolver: zodResolver(corporateFormSchema) as unknown as Resolver<CorporateFormValues>,
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const { watch, trigger, getValues, setError } = methods;

  const fatfByCode = useMemo(
    () => new Map<string, FatfStatus>(countries.map((c) => [c.code, c.fatfStatus as FatfStatus])),
    [countries],
  );

  const values = watch();
  const { risk, flags } = useMemo(() => {
    const input = buildCorporateRiskInput(values as CorporateFormValues, fatfByCode, fatfSettings);
    const result = assessCorporateRisk(input);
    return {
      risk: result,
      flags: result.flaggedCountries.map<FatfFlag>((e) => ({
        field: e.field,
        countryCode: e.countryCode,
        fatfStatus: e.fatfStatus,
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), fatfByCode, fatfSettings]);

  const hasSourceDoc = docs.some((d) => d.docType === 'SOURCE_OF_FUNDS');
  const flagKey = flags.map((f) => f.countryCode).sort().join(',');
  useEffect(() => {
    if (flagKey && flagKey !== ackFlagKey && !hasSourceDoc) {
      setFatfOpen(true);
    }
  }, [flagKey, ackFlagKey, hasSourceDoc]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doSave = useCallback(async () => {
    setSaveState('saving');
    const res = await saveCorporateCaseDraft(caseId, getValues());
    setSaveState(res.ok ? 'saved' : 'idle');
    if (res.ok) setTimeout(() => setSaveState('idle'), 2000);
  }, [caseId, getValues]);

  useEffect(() => {
    const sub = watch(() => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(doSave, 1500);
    });
    return () => {
      sub.unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [watch, doSave]);

  const goNext = async () => {
    const valid = await trigger(CORPORATE_STEP_FIELDS[step] as (keyof CorporateFormValues)[]);
    if (!valid) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async () => {
    setSubmitError(null);
    const valid = await trigger();
    if (!valid) {
      setSubmitError(dict.common.error);
      const errs = methods.formState.errors;
      const firstStep = CORPORATE_STEP_FIELDS.findIndex((fields) =>
        fields.some((f) => (errs as Record<string, unknown>)[f]),
      );
      if (firstStep >= 0) setStep(firstStep);
      return;
    }
    if (flags.length > 0 && !hasSourceDoc) {
      setFatfOpen(true);
      return;
    }
    setSubmitting(true);
    const res = await submitCorporateCase(caseId, getValues());
    setSubmitting(false);
    if (res && !res.ok) {
      if (res.missingDocs?.length) {
        setSubmitError(dict.fatf.docMissing);
        if (res.missingDocs.includes('SOURCE_OF_FUNDS')) setFatfOpen(true);
      } else if (res.fieldErrors) {
        for (const [key, msg] of Object.entries(res.fieldErrors)) {
          setError(key as keyof CorporateFormValues, { message: msg });
        }
        setSubmitError(dict.common.error);
      } else {
        setSubmitError(dict.common.error);
      }
    }
  };

  const Current = STEPS[step].Comp;
  const stepProps = { countries, caseId, docs, onDocsChange: setDocs, risk };

  return (
    <FormProvider {...methods}>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          {returnedNotes && (
            <Alert tone="warning" title={dict.caseView.returnedBanner} className="mb-4">
              {returnedNotes}
            </Alert>
          )}

          <WizardShell
            steps={STEPS.map((s) => ({ key: s.key, label: c.steps[s.key] }))}
            currentStep={step}
            onStepClick={setStep}
            title={c.steps[STEPS[step].key]}
            stepOfLabel={interpolate(dict.steps.stepOf, { current: step + 1, total: STEPS.length })}
          >
            <Current {...stepProps} />
          </WizardShell>

          {submitError && (
            <Alert tone="danger" className="mt-4">
              {submitError}
            </Alert>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={goPrev} disabled={step === 0}>
              <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
              {dict.common.back}
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-faint" aria-live="polite">
                {saveState === 'saving' && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                    {dict.common.saving}
                  </span>
                )}
                {saveState === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Check className="size-3" aria-hidden />
                    {dict.common.saved}
                  </span>
                )}
              </span>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  {dict.common.next}
                  <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
                </Button>
              ) : (
                <Button type="button" variant="success" onClick={onSubmit} loading={submitting}>
                  <Send className="size-4" aria-hidden />
                  {dict.caseView.submitCase}
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <RiskPanel result={risk} />
        </aside>
      </div>

      <FatfDialog
        open={fatfOpen}
        onClose={() => {
          setFatfOpen(false);
          setAckFlagKey(flagKey);
        }}
        caseId={caseId}
        flags={flags}
        countries={countries}
        docs={docs}
        onDocsChange={setDocs}
      />
    </FormProvider>
  );
}
