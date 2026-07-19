'use client';

import { useActionState } from 'react';
import { registerClient, type RegisterState } from '@/lib/portal/actions';
import { useI18n } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

export function ClientRegisterForm() {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(registerClient, {});

  const errorMessage = state.error === 'rateLimited' ? dict.auth.rateLimited : state.error ? dict.portal[state.error] : null;

  return (
    <form action={formAction} className="space-y-4">
      {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}
      <Field label={dict.portal.name} htmlFor="nameEn" required>
        <Input id="nameEn" name="nameEn" type="text" autoComplete="name" required />
      </Field>
      <Field label={dict.auth.email} htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          dir="ltr"
          placeholder="name@example.com"
        />
      </Field>
      <Field label={dict.auth.password} htmlFor="password" required hint={dict.portal.passwordHint}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          dir="ltr"
        />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        {pending ? dict.portal.creatingAccount : dict.portal.createAccount}
      </Button>
    </form>
  );
}
