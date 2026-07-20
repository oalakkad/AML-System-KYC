'use client';

import Link from 'next/link';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { clientLogout } from '@/lib/portal/actions';
import { LanguageToggle } from '@/components/language-toggle';

export function PortalShell({
  user,
  children,
}: {
  user: { nameEn: string; nameAr: string };
  children: React.ReactNode;
}) {
  const { dict, locale } = useI18n();
  const displayName = locale === 'ar' && user.nameAr ? user.nameAr : user.nameEn;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-40 border-b border-hairline bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 lg:px-6">
          <Link href="/portal" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white shadow-sm shadow-primary/20">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-bold text-ink">{dict.common.appName}</span>
              <span className="block text-xs text-faint">{dict.portal.brandTagline}</span>
            </span>
          </Link>

          <div className="ms-auto flex items-center gap-3">
            <span className="hidden text-sm font-medium text-ink sm:block">{displayName}</span>
            <LanguageToggle />
            <form action={clientLogout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-red-600"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">{dict.common.logout}</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">{children}</main>
    </div>
  );
}
