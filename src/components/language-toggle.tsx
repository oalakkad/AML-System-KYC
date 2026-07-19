'use client';

import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { toggleLocale } from '@/lib/i18n/actions';

export function LanguageToggle() {
  const { dict, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => toggleLocale(locale))}
      disabled={pending}
      className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-hairline-strong bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-subtle hover:text-ink disabled:opacity-50"
    >
      <Languages className="size-4" aria-hidden />
      {dict.common.language}
    </button>
  );
}
