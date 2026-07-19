'use client';

import { useActionState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useI18n, interpolate } from '@/lib/i18n/client';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { changeOwnPassword, type ChangePasswordState } from '@/lib/settings/actions';

export function SecurityPanel({ sessionHours }: { sessionHours: number }) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(changeOwnPassword, {});

  const errorMessage =
    state.error === 'currentPasswordWrong'
      ? dict.settings.security.currentPasswordWrong
      : state.error === 'mismatch'
        ? dict.settings.security.mismatch
        : state.error
          ? dict.settings.security.invalidInput
          : null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title={dict.settings.security.changePassword} />
        <CardBody>
          <form action={formAction} className="max-w-sm space-y-4">
            {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}
            {state.ok && <Alert tone="success">{dict.settings.security.success}</Alert>}
            <Field label={dict.settings.security.currentPassword} htmlFor="currentPassword" required>
              <Input id="currentPassword" name="currentPassword" type="password" dir="ltr" required />
            </Field>
            <Field label={dict.settings.security.newPassword} htmlFor="newPassword" required>
              <Input id="newPassword" name="newPassword" type="password" dir="ltr" minLength={8} required />
            </Field>
            <Field label={dict.settings.security.confirmPassword} htmlFor="confirmPassword" required>
              <Input id="confirmPassword" name="confirmPassword" type="password" dir="ltr" minLength={8} required />
            </Field>
            <Button type="submit" loading={pending}>
              {pending ? dict.settings.security.saving : dict.settings.security.save}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={dict.settings.security.sessionPolicy} />
        <CardBody className="space-y-2 text-sm text-muted">
          <p>{interpolate(dict.settings.security.sessionHours, { hours: sessionHours })}</p>
          <p>{dict.settings.security.rateLimitInfo}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={dict.settings.security.twoFactor} />
        <CardBody>
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-hairline-strong bg-subtle p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-faint" aria-hidden />
            <p className="text-sm text-muted">{dict.settings.security.twoFactorComingSoon}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
