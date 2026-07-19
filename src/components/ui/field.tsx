'use client';

import { type LabelHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Label({ className, children, required, ...props }: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('mb-1.5 block text-sm font-semibold text-slate-700', className)} {...props}>
      {children}
      {required && <span className="ms-1 text-red-500" aria-hidden>*</span>}
    </label>
  );
}

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint + inline error, wired for accessibility. */
export function Field({ label, htmlFor, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
