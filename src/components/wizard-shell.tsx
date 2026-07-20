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
      <nav
        className="mb-5 flex items-center gap-1 overflow-x-auto rounded-2xl border border-hairline bg-card p-1.5 shadow-card"
        aria-label="Steps"
      >
        {steps.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onStepClick(i)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 transition-colors',
              i === currentStep ? 'bg-primary-soft' : 'hover:bg-subtle',
            )}
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                i === currentStep
                  ? 'bg-gradient-to-br from-primary to-accent text-white shadow-sm shadow-primary/30'
                  : i < currentStep
                    ? 'bg-emerald-500 text-white'
                    : 'bg-subtle text-faint ring-1 ring-inset ring-hairline',
              )}
            >
              {i < currentStep ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden whitespace-nowrap text-xs font-bold sm:block',
                i === currentStep ? 'text-primary' : i < currentStep ? 'text-muted' : 'text-faint',
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-4 bg-hairline sm:w-6" aria-hidden />}
          </button>
        ))}
      </nav>

      <div className="rounded-2xl border border-hairline bg-card p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <span className="text-xs font-semibold text-faint">{stepOfLabel}</span>
        </div>
        {children}
      </div>
    </>
  );
}
