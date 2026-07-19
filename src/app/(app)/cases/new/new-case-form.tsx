'use client';

import { useState, useTransition } from 'react';
import { useI18n } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { FilePlus2, RefreshCcw, User, Building2 } from 'lucide-react';
import type { ClientType } from '@/lib/constants';

export function NewCaseForm({
  action,
  initialClientType = 'INDIVIDUAL',
}: {
  action: (formData: FormData) => Promise<void>;
  initialClientType?: ClientType;
}) {
  const { dict } = useI18n();
  const [clientType, setClientType] = useState<ClientType>(initialClientType);
  const [formType, setFormType] = useState<'NEW_CLIENT' | 'KYC_UPDATE'>('NEW_CLIENT');
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="space-y-5"
    >
      <input type="hidden" name="clientType" value={clientType} />
      <input type="hidden" name="formType" value={formType} />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {dict.clientType.label}
          <span className="ms-1 text-red-500" aria-hidden>*</span>
        </span>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'INDIVIDUAL', icon: User },
              { value: 'CORPORATE', icon: Building2 },
            ] as const
          ).map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setClientType(value)}
              aria-pressed={clientType === value}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all',
                clientType === value
                  ? 'border-primary/40 bg-primary-soft text-primary shadow-sm'
                  : 'border-hairline bg-white text-muted hover:border-hairline-strong hover:text-ink',
              )}
            >
              <Icon className="size-6" aria-hidden />
              {dict.clientType[value]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {dict.fields.formType}
          <span className="ms-1 text-red-500" aria-hidden>*</span>
        </span>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'NEW_CLIENT', icon: FilePlus2 },
              { value: 'KYC_UPDATE', icon: RefreshCcw },
            ] as const
          ).map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormType(value)}
              aria-pressed={formType === value}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all',
                formType === value
                  ? 'border-primary/40 bg-primary-soft text-primary shadow-sm'
                  : 'border-hairline bg-white text-muted hover:border-hairline-strong hover:text-ink',
              )}
            >
              <Icon className="size-6" aria-hidden />
              {dict.formType[value]}
            </button>
          ))}
        </div>
      </div>
      {formType === 'KYC_UPDATE' && (
        <Field label={dict.fields.clientNo} htmlFor="clientNo" required hint={dict.fields.clientNoHint}>
          <Input id="clientNo" name="clientNo" required maxLength={100} />
        </Field>
      )}
      <Button type="submit" className="w-full" loading={pending}>
        {dict.caseView.newCase}
      </Button>
    </form>
  );
}
