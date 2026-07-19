'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/lib/auth/actions';
import { useI18n } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

export function LoginForm() {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

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
          placeholder="name@company.com"
        />
      </Field>
      <Field label={dict.auth.password} htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
        />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        {pending ? dict.auth.signingIn : dict.auth.signIn}
      </Button>
    </form>
  );
}
