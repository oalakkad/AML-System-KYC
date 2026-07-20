'use client';

// Client self-service Individual KYC wizard. Mirrors components/kyc/wizard.tsx
// but: (1) calls the portal-scoped save/submit actions, (2) never renders a
// risk sidebar or the maker risk-override control (PortalStepReview instead
// of StepReview) — the score/rating/factors stay compliance-internal even
// though they're still computed internally to drive the FATF flag popup and
// the source-of-funds document requirement.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { useI18n, interpolate } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { WizardShell } from '@/components/wizard-shell';
import { kycFormSchema, STEP_FIELDS, type KycFormValues } from '@/lib/cases/schemas';
import { buildRiskInput } from '@/lib/cases/risk-input';
import { assessRisk } from '@/lib/risk/engine';
import { saveClientCaseDraft, submitClientCase } from '@/lib/portal/actions';
import type { FatfStatus } from '@/lib/constants';
import { StepCase, StepPersonal, StepWork, StepBeneficialOwner, StepPep, StepRelatedParties } from '@/components/kyc/steps';
import { PortalStepReview } from './portal-step-review';
import { PortalFatfDialog } from './portal-fatf-dialog';
import type { FatfFlag } from '@/components/kyc/fatf-dialog';
import type { CountryOption } from '@/components/kyc/shared';
import type { DocItem } from '@/components/kyc/documents-panel';

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
  { key: 'review', Comp: PortalStepReview },
] as const;

export function PortalKycWizard({
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
    resolver: zodResolver(kycFormSchema) as unknown as Resolver<KycFormValues>,
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const { watch, trigger, getValues, setError } = methods;

  const fatfByCode = useMemo(
    () => new Map<string, FatfStatus>(countries.map((c) => [c.code, c.fatfStatus as FatfStatus])),
    [countries],
  );

  // Computed for internal FATF-flag/source-of-funds logic only — never
  // rendered (see PortalStepReview, which omits the score/rating/factors).
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
    const res = await saveClientCaseDraft(caseId, getValues());
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
      const errs = methods.formState.errors;
      const firstStep = STEP_FIELDS.findIndex((fields) =>
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
    const res = await submitClientCase(caseId, getValues());
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
      <div className="mx-auto max-w-3xl">
        {returnedNotes && (
          <Alert tone="warning" title={dict.caseView.returnedBanner} className="mb-4">
            {returnedNotes}
          </Alert>
        )}

        <WizardShell
          steps={STEPS.map((s) => ({ key: s.key, label: dict.steps[s.key] }))}
          currentStep={step}
          onStepClick={setStep}
          title={dict.steps[STEPS[step].key]}
          stepOfLabel={interpolate(dict.steps.stepOf, { current: step + 1, total: STEPS.length })}
        >
          <Current {...stepProps} />
        </WizardShell>

        {submitError && (
          <Alert tone="danger" className="mt-4">
            {submitError}
          </Alert>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-hairline pt-5">
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

      <PortalFatfDialog
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
