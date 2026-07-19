'use client';

import { useActionState } from 'react';
import { clientLogin, type ClientLoginState } from '@/lib/portal/actions';
import { useI18n } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

export function ClientLoginForm() {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<ClientLoginState, FormData>(clientLogin, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="danger">{dict.auth[state.error]}</Alert>}
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
      <Field label={dict.auth.password} htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required dir="ltr" />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        {pending ? dict.auth.signingIn : dict.auth.signIn}
      </Button>
    </form>
  );
}
