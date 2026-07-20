import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck, FileCheck2, UploadCloud, PenLine } from 'lucide-react';
import { getClientSession } from '@/lib/auth/client-session';
import { getDict } from '@/lib/i18n';
import { LanguageToggle } from '@/components/language-toggle';
import { ClientLoginForm } from './login-form';

export default async function PortalLoginPage() {
  const session = await getClientSession();
  if (session) redirect('/portal');
  const { dict } = await getDict();

  const features = [
    { icon: FileCheck2, text: dict.portal.loginSubtitle },
    { icon: UploadCloud, text: dict.portal.uploadSectionTitle },
    { icon: PenLine, text: dict.portal.signSectionTitle },
  ];

  return (
    <main className="flex min-h-dvh bg-bg">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-e border-hairline bg-card p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 500px 380px at 15% 15%, rgba(79,70,229,0.14), transparent 60%), radial-gradient(ellipse 460px 420px at 85% 85%, rgba(124,58,237,0.13), transparent 60%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(20,22,43,0.05) 1px, transparent 0)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 90%)',
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
            <ShieldCheck className="size-6" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-bold text-ink">{dict.common.appName}</p>
            <p className="text-sm text-faint">{dict.portal.brandTagline}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-ink text-balance">{dict.portal.loginSubtitle}</h2>
          <ul className="mt-8 space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-hairline bg-card text-primary shadow-card">
                  <f.icon className="size-4.5" aria-hidden />
                </span>
                <span className="text-sm font-bold text-ink">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs font-semibold uppercase tracking-wider text-faint">
          © {new Date().getFullYear()} {dict.common.appName}
        </p>
      </div>

      <div
        className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(20,22,43,0.045) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
              <ShieldCheck className="size-7" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-ink">{dict.common.appName}</h1>
            <p className="text-sm text-muted">{dict.portal.brandTagline}</p>
          </div>

          <div className="rounded-2xl border border-hairline bg-card p-8 shadow-premium">
            <h1 className="text-xl font-bold text-ink">{dict.portal.loginTitle}</h1>
            <p className="mt-1 mb-6 text-sm text-muted">{dict.portal.loginSubtitle}</p>
            <ClientLoginForm />
            <p className="mt-5 text-center text-sm text-muted">
              {dict.portal.noAccount}{' '}
              <Link href="/portal/register" className="font-semibold text-primary hover:underline">
                {dict.portal.createAccount}
              </Link>
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </main>
  );
}
