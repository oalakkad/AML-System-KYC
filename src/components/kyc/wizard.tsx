'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { useI18n, interpolate } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  kycFormSchema,
  STEP_FIELDS,
  type KycFormValues,
} from '@/lib/cases/schemas';
import { saveCaseDraft, submitCase } from '@/lib/cases/actions';
import { buildRiskInput } from '@/lib/cases/risk-input';
import { assessRisk } from '@/lib/risk/engine';
import type { FatfStatus } from '@/lib/constants';
import {
  StepCase,
  StepPersonal,
  StepWork,
  StepBeneficialOwner,
  StepPep,
  StepRelatedParties,
  StepReview,
} from './steps';
import { RiskPanel } from './risk-panel';
import { FatfDialog, type FatfFlag } from './fatf-dialog';
import type { CountryOption } from './shared';
import type { DocItem } from './documents-panel';

interface WizardProps {
  caseId: string;
  initialValues: KycFormValues;
  countries: CountryOption[];
  initialDocs: DocItem[];
  fatfSettings: { domesticCountryCode: string; greyListRequiresDocument: boolean };
  returnedNotes?: string | null;
}

const STEPS = [
  { key: 'caseInfo', Comp: StepCase },
  { key: 'personal', Comp: StepPersonal },
  { key: 'pep', Comp: StepPep },
  { key: 'work', Comp: StepWork },
  { key: 'beneficialOwner', Comp: StepBeneficialOwner },
  { key: 'relatedParties', Comp: StepRelatedParties },
  { key: 'review', Comp: StepReview },
] as const;

export function KycWizard({
  caseId,
  initialValues,
  countries,
  initialDocs,
  fatfSettings,
  returnedNotes,
}: WizardProps) {
  const { dict } = useI18n();
  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState<DocItem[]>(initialDocs);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [fatfOpen, setFatfOpen] = useState(false);
  const [ackFlagKey, setAckFlagKey] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<KycFormValues>({
    // zod v4 output/input types diverge on fields with .default(); the runtime
    // resolver is correct, so we align the static type to the form's value type.
    resolver: zodResolver(kycFormSchema) as unknown as Resolver<KycFormValues>,
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const { watch, trigger, getValues, setError } = methods;

  const fatfByCode = useMemo(
    () => new Map<string, FatfStatus>(countries.map((c) => [c.code, c.fatfStatus as FatfStatus])),
    [countries],
  );

  // Live risk + FATF flags recomputed from the watched form values.
  // Flags come from the engine's flaggedCountries so domestically-exempt
  // countries (e.g. Kuwait) do NOT spuriously trigger the source-of-funds popup.
  const values = watch();
  const { risk, flags } = useMemo(() => {
    const input = buildRiskInput(values as KycFormValues, fatfByCode, fatfSettings);
    const result = assessRisk(input);
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

  // Auto-open the FATF dialog when a new flagged country appears without a doc.
  const hasSourceDoc = docs.some((d) => d.docType === 'SOURCE_OF_FUNDS');
  const flagKey = flags.map((f) => f.countryCode).sort().join(',');
  useEffect(() => {
    if (flagKey && flagKey !== ackFlagKey && !hasSourceDoc) {
      setFatfOpen(true);
    }
  }, [flagKey, ackFlagKey, hasSourceDoc]);

  // Debounced autosave.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doSave = useCallback(async () => {
    setSaveState('saving');
    const res = await saveCaseDraft(caseId, getValues());
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
    const valid = await trigger(STEP_FIELDS[step] as (keyof KycFormValues)[]);
    if (!valid) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async () => {
    setSubmitError(null);
    const valid = await trigger();
    if (!valid) {
      setSubmitError(dict.common.error);
      // jump to the first step containing an error
      const errs = methods.formState.errors;
      const firstStep = STEP_FIELDS.findIndex((fields) =>
        fields.some((f) => (errs as Record<string, unknown>)[f]),
      );
      if (firstStep >= 0) setStep(firstStep);
      return;
    }
    // Require the source-of-funds doc if a country is flagged
    if (flags.length > 0 && !hasSourceDoc) {
      setFatfOpen(true);
      return;
    }
    setSubmitting(true);
    const res = await submitCase(caseId, getValues());
    setSubmitting(false);
    if (res && !res.ok) {
      if (res.missingDocs?.length) {
        setSubmitError(dict.fatf.docMissing);
        if (res.missingDocs.includes('SOURCE_OF_FUNDS')) setFatfOpen(true);
      } else if (res.fieldErrors) {
        for (const [key, msg] of Object.entries(res.fieldErrors)) {
          setError(key as keyof KycFormValues, { message: msg });
        }
        setSubmitError(dict.common.error);
      } else {
        setSubmitError(dict.common.error);
      }
    }
    // success path redirects server-side
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

          {/* Stepper */}
          <nav className="mb-6 flex items-center gap-1 overflow-x-auto pb-2" aria-label="Steps">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(i)}
                className="flex shrink-0 items-center gap-2"
              >
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    i === step
                      ? 'bg-primary text-white shadow-sm'
                      : i < step
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-faint ring-1 ring-inset ring-hairline',
                  )}
                >
                  {i < step ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    'hidden whitespace-nowrap text-xs font-medium sm:block',
                    i === step ? 'text-ink' : 'text-faint',
                  )}
                >
                  {dict.steps[s.key]}
                </span>
                {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-hairline sm:w-6" />}
              </button>
            ))}
          </nav>

          <div className="rounded-xl border border-hairline bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{dict.steps[STEPS[step].key]}</h2>
              <span className="text-xs text-faint">
                {interpolate(dict.steps.stepOf, { current: step + 1, total: STEPS.length })}
              </span>
            </div>
            <Current {...stepProps} />
          </div>

          {submitError && (
            <Alert tone="danger" className="mt-4">
              {submitError}
            </Alert>
          )}

          {/* Nav buttons */}
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

        {/* Risk sidebar */}
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
