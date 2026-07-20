'use client';

import { useState, useTransition } from 'react';
import { useI18n } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/field';
import { SelectableCard } from '@/components/ui/selectable-card';
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
        <Label required>{dict.clientType.label}</Label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'INDIVIDUAL', icon: User },
              { value: 'CORPORATE', icon: Building2 },
            ] as const
          ).map(({ value, icon: Icon }) => (
            <SelectableCard
              key={value}
              selected={clientType === value}
              icon={Icon}
              label={dict.clientType[value]}
              onClick={() => setClientType(value)}
            />
          ))}
        </div>
      </div>

      <div>
        <Label required>{dict.fields.formType}</Label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'NEW_CLIENT', icon: FilePlus2 },
              { value: 'KYC_UPDATE', icon: RefreshCcw },
            ] as const
          ).map(({ value, icon: Icon }) => (
            <SelectableCard
              key={value}
              selected={formType === value}
              icon={Icon}
              label={dict.formType[value]}
              onClick={() => setFormType(value)}
            />
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
