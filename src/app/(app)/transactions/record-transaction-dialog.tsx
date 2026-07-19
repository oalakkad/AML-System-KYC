'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useI18n, interpolate } from '@/lib/i18n/client';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { recordTransaction, type RecordTransactionState } from '@/lib/transactions/actions';
import { TRANSACTION_TYPES } from '@/lib/constants';
import type { CountryOption } from '@/components/kyc/shared';

export function RecordTransactionDialog({
  cases,
  countries,
}: {
  cases: { id: string; caseNumber: string; displayName: string }[];
  countries: CountryOption[];
}) {
  const { dict, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<RecordTransactionState, FormData>(recordTransaction, {});

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  const errorMessage =
    state.error === 'caseNotFound' ? dict.transactions.caseNotFound : state.error ? dict.transactions.invalidInput : null;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        {dict.transactions.recordNew}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={dict.transactions.recordTitle}>
        <form action={formAction} className="space-y-4">
          {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}
          {state.ok && (
            <Alert tone="success">
              {dict.transactions.recorded}{' '}
              {!!state.alertCount &&
                state.alertCount > 0 &&
                interpolate(dict.transactions.alertsTriggered, { count: state.alertCount })}
            </Alert>
          )}
          <Field label={dict.transactions.selectCase} htmlFor="caseId" required>
            <Select id="caseId" name="caseId" required defaultValue="">
              <option value="" disabled>
                {dict.transactions.selectCasePlaceholder}
              </option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.displayName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={dict.transactions.type} htmlFor="type" required>
            <Select id="type" name="type" required defaultValue="CASH_DEPOSIT">
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {dict.transactionTypes[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={dict.transactions.amountKd} htmlFor="amountKd" required>
            <Input id="amountKd" name="amountKd" type="number" min="0.001" step="0.001" dir="ltr" required />
          </Field>
          <Field label={dict.transactions.counterpartyName} htmlFor="counterpartyName">
            <Input id="counterpartyName" name="counterpartyName" />
          </Field>
          <Field label={dict.transactions.counterpartyCountry} htmlFor="counterpartyCountry">
            <Select id="counterpartyCountry" name="counterpartyCountry" defaultValue="">
              <option value="">{dict.common.none}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {locale === 'ar' ? c.nameAr : c.nameEn}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" className="w-full" loading={pending}>
            {pending ? dict.transactions.recording : dict.transactions.record}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
