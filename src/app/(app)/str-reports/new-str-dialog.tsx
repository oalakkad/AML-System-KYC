'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { createStrReport, type CreateStrState } from '@/lib/str/actions';

export function NewStrDialog({
  cases,
  investigations,
}: {
  cases: { id: string; caseNumber: string; displayName: string }[];
  investigations: { id: string; label: string }[];
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CreateStrState, FormData>(createStrReport, {});

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state.ok, router]);

  const errorMessage =
    state.error === 'caseNotFound' ? dict.strReports.caseNotFound : state.error ? dict.strReports.invalidInput : null;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        {dict.strReports.newReport}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={dict.strReports.createTitle}>
        <form action={formAction} className="space-y-4">
          {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}
          <Field label={dict.strReports.selectClient} htmlFor="kycCaseId" required>
            <Select id="kycCaseId" name="kycCaseId" required defaultValue="">
              <option value="" disabled>
                {dict.strReports.selectClientPlaceholder}
              </option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.displayName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={dict.strReports.linkedInvestigation} htmlFor="investigationCaseId">
            <Select id="investigationCaseId" name="investigationCaseId" defaultValue="">
              <option value="">{dict.strReports.none}</option>
              {investigations.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={dict.strReports.narrative} htmlFor="narrative">
            <Textarea id="narrative" name="narrative" rows={5} placeholder={dict.strReports.narrativePlaceholder} />
          </Field>
          <Button type="submit" className="w-full" loading={pending}>
            {pending ? dict.strReports.creating : dict.strReports.create}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
