'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileDown } from 'lucide-react';
import { useI18n, interpolate } from '@/lib/i18n/client';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { importTransactionsBatch, type ImportTransactionsState } from '@/lib/transactions/actions';
import { TRANSACTION_IMPORT_TEMPLATE } from '@/lib/transactions/csv';

const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(TRANSACTION_IMPORT_TEMPLATE)}`;

export function ImportTransactionsDialog() {
  const { dict } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<ImportTransactionsState, FormData>(importTransactionsBatch, {});

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [state.ok, router]);

  const skipLabel = (reason: string) =>
    dict.transactions.skipReason[reason as keyof typeof dict.transactions.skipReason] ?? reason;

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Upload className="size-4" aria-hidden />
        {dict.transactions.importCsv}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={dict.transactions.importTitle}>
        <div className="space-y-4">
          <p className="text-sm text-muted">{dict.transactions.importHint}</p>

          <a
            href={TEMPLATE_HREF}
            download="transactions-template.csv"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <FileDown className="size-4" aria-hidden />
            {dict.transactions.downloadTemplate}
          </a>

          <form action={formAction} className="space-y-4">
            {state.error === 'invalidFile' && <Alert tone="danger">{dict.transactions.importFileRequired}</Alert>}
            {state.error === 'headerError' && <Alert tone="danger">{dict.transactions.importHeaderError}</Alert>}
            {state.ok && (
              <Alert tone="success">
                {interpolate(dict.transactions.importResult, {
                  imported: state.imported ?? 0,
                  alertCount: state.alertCount ?? 0,
                })}
              </Alert>
            )}
            {state.ok && !!state.skipped?.length && (
              <Alert tone="warning">
                <p className="font-medium">{interpolate(dict.transactions.importSkipped, { count: state.skipped.length })}</p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {state.skipped.slice(0, 10).map((s, i) => (
                    <li key={i}>
                      {interpolate(dict.transactions.lineLabel, { line: s.lineNumber })}: {skipLabel(s.reason)}
                    </li>
                  ))}
                  {state.skipped.length > 10 && <li>…</li>}
                </ul>
              </Alert>
            )}
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="w-full text-sm text-muted file:me-3 file:rounded-md file:border-0 file:bg-subtle file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-hairline"
            />
            <Button type="submit" className="w-full" loading={pending}>
              {pending ? dict.transactions.importing : dict.transactions.import}
            </Button>
          </form>
        </div>
      </Dialog>
    </>
  );
}
