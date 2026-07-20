'use client';

import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { toggleLocale } from '@/lib/i18n/actions';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { dict, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => startTransition(() => toggleLocale(locale))}
      disabled={pending}
    >
      <Languages className="size-4" aria-hidden />
      {dict.common.language}
    </Button>
  );
}
