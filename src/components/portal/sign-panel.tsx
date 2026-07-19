'use client';

import { useActionState } from 'react';
import { PenLine } from 'lucide-react';
import { signKycCase, type SignState } from '@/lib/portal/actions';
import { useI18n, interpolate } from '@/lib/i18n/client';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { formatDate } from '@/lib/utils';

export function SignPanel({
  caseId,
  signedAt,
  signedBy,
  disabled,
}: {
  caseId: string;
  signedAt: string | null;
  signedBy: string | null;
  disabled: boolean;
}) {
  const { dict, locale } = useI18n();
  const [state, formAction, pending] = useActionState<SignState, FormData>(signKycCase, {});

  return (
    <Card>
      <CardHeader title={dict.portal.signSectionTitle} />
      <CardBody className="space-y-4">
        {signedAt ? (
          <Alert tone="success">
            {interpolate(dict.portal.alreadySigned, { date: formatDate(signedAt, locale) })}
            {signedBy ? ` — ${signedBy}` : ''}
          </Alert>
        ) : disabled ? (
          <Alert tone="warning">{dict.portal.caseClosed}</Alert>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="caseId" value={caseId} />
            <p className="text-sm text-muted">{dict.portal.signIntro}</p>
            {state.error && <Alert tone="danger">{dict.portal.invalidInput}</Alert>}
            {state.ok && <Alert tone="success">{dict.portal.signSuccess}</Alert>}
            <Field label={dict.portal.signatureNameLabel} htmlFor="signatureName" required>
              <Input id="signatureName" name="signatureName" required minLength={2} maxLength={200} />
            </Field>
            <Button type="submit" loading={pending}>
              <PenLine className="size-4" aria-hidden />
              {dict.portal.submitSignature}
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
