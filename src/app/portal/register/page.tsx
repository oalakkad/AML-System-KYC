import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getClientSession } from '@/lib/auth/client-session';
import { getDict } from '@/lib/i18n';
import { LanguageToggle } from '@/components/language-toggle';
import { ClientRegisterForm } from './register-form';

export default async function PortalRegisterPage() {
  const session = await getClientSession();
  if (session) redirect('/portal');
  const { dict } = await getDict();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
            <ShieldCheck className="size-7" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-ink">{dict.common.appName}</h1>
          <p className="text-sm text-muted">{dict.portal.brandTagline}</p>
        </div>

        <div className="rounded-2xl border border-hairline bg-card p-8 shadow-card">
          <h1 className="text-xl font-bold text-ink">{dict.portal.registerTitle}</h1>
          <p className="mt-1 mb-6 text-sm text-muted">{dict.portal.registerSubtitle}</p>
          <ClientRegisterForm />
          <p className="mt-5 text-center text-sm text-muted">
            {dict.portal.haveAccount}{' '}
            <Link href="/portal/login" className="font-semibold text-primary hover:underline">
              {dict.auth.signIn}
            </Link>
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <LanguageToggle />
        </div>
      </div>
    </main>
  );
}
