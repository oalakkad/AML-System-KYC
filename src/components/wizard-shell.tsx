'use client';

// Shared stepper-nav + step-content-card shell, extracted from what was
// three byte-for-byte-identical copies (kyc/wizard.tsx, corporate-wizard.tsx,
// portal-kyc-wizard.tsx) — one place to restyle the wizard chrome instead of
// three. Each wizard keeps its own steps array, form state, save/submit
// logic; this only renders the stepper pills and the card wrapping the
// active step's fields.

import { type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  key: string;
  label: string;
}

export function WizardShell({
  steps,
  currentStep,
  onStepClick,
  title,
  stepOfLabel,
  children,
}: {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (index: number) => void;
  /** Translated label of the active step, shown as the card header. */
  title: string;
  /** Already-interpolated "Step X of Y" string. */
  stepOfLabel: string;
  children: ReactNode;
}) {
  return (
    <>
      <nav className="mb-6 flex items-center gap-1 overflow-x-auto pb-2" aria-label="Steps">
        {steps.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onStepClick(i)}
            className="flex shrink-0 items-center gap-2"
          >
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i === currentStep
                  ? 'bg-primary text-white shadow-sm'
                  : i < currentStep
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-faint ring-1 ring-inset ring-hairline',
              )}
            >
              {i < currentStep ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden whitespace-nowrap text-xs font-medium sm:block',
                i === currentStep ? 'text-ink' : 'text-faint',
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-4 bg-hairline sm:w-6" />}
          </button>
        ))}
      </nav>

      <div className="rounded-xl border border-hairline bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <span className="text-xs text-faint">{stepOfLabel}</span>
        </div>
        {children}
      </div>
    </>
  );
}
