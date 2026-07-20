'use client';

import { type ReactNode } from 'react';
import { useFormContext, type FieldErrors } from 'react-hook-form';
import { useI18n } from '@/lib/i18n/client';
import { Select } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Dict } from '@/lib/i18n/en';
import type { KycFormValues } from '@/lib/cases/schemas';

export interface CountryOption {
  code: string;
  nameEn: string;
  nameAr: string;
  fatfStatus: string;
}

/** Resolve a nested error message key and translate it via dict.validation. */
export function errMsg(
  errors: FieldErrors,
  name: string,
  dict: Dict,
): string | undefined {
  const parts = name.split('.');
  let node: unknown = errors;
  for (const p of parts) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[p];
  }
  const key = (node as { message?: string } | undefined)?.message;
  if (!key) return undefined;
  return (dict.validation as Record<string, string>)[key] ?? key;
}

export function useKycField(name: string) {
  const { dict } = useI18n();
  const {
    register,
    formState: { errors },
  } = useFormContext<KycFormValues>();
  return { register, error: errMsg(errors, name, dict), dict };
}

export function CountrySelect({
  id,
  value,
  onChange,
  countries,
  allowEmpty,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (code: string) => void;
  countries: CountryOption[];
  allowEmpty?: boolean;
  invalid?: boolean;
}) {
  const { dict, locale } = useI18n();
  const sorted = [...countries].sort((a, b) =>
    (locale === 'ar' ? a.nameAr : a.nameEn).localeCompare(
      locale === 'ar' ? b.nameAr : b.nameEn,
      locale,
    ),
  );
  return (
    <Select
      id={id}
      value={value}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{allowEmpty ? dict.common.none : dict.common.select}</option>
      {sorted.map((c) => (
        <option key={c.code} value={c.code}>
          {locale === 'ar' ? c.nameAr : c.nameEn}
        </option>
      ))}
    </Select>
  );
}

/** Yes/No segmented control for boolean questions. */
export function YesNoField({
  label,
  value,
  onChange,
  className,
}: {
  label: ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  const { dict } = useI18n();
  return (
    <div className={cn('flex flex-col gap-2 rounded-xl border border-hairline bg-subtle p-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex shrink-0 gap-1 rounded-lg border border-hairline-strong bg-card p-0.5" role="group">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={cn(
              'cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              value === v ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-subtle hover:text-ink',
            )}
          >
            {v ? dict.common.yes : dict.common.no}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckboxRow({
  id,
  label,
  checked,
  onChange,
  error,
}: {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors',
          checked ? 'border-primary/40 bg-primary-soft' : 'border-hairline bg-card hover:border-hairline-strong hover:bg-subtle',
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
        />
        <span className="text-ink">{label}</span>
      </label>
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="border-b border-hairline pb-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-faint">{children}</h3>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
