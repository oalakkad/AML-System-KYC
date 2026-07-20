import { redirect } from 'next/navigation';
import { Lock, FileCheck2, Globe2 } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getDict } from '@/lib/i18n';
import { getBrandSettings } from '@/lib/settings/queries';
import { LanguageToggle } from '@/components/language-toggle';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/');
  const { dict } = await getDict();
  const brand = await getBrandSettings();

  const features = [
    { icon: Lock, text: dict.auth.feature1 },
    { icon: FileCheck2, text: dict.auth.feature2 },
    { icon: Globe2, text: dict.auth.feature3 },
  ];

  return (
    <main className="flex min-h-dvh bg-bg">
      {/* Brand panel — light, not dark: soft indigo/violet wash on white, dot-grid texture */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-e border-hairline bg-card p-16 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 500px 380px at 15% 15%, rgba(79,70,229,0.14), transparent 60%), radial-gradient(ellipse 460px 420px at 85% 85%, rgba(124,58,237,0.13), transparent 60%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(20,22,43,0.05) 1px, transparent 0)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 90%)',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10.5 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-xl shadow-primary/30">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-sm font-black tracking-tight">AM</span>
            )}
          </div>
          <div>
            <p className="text-base font-bold text-ink tracking-tight">{dict.common.appName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-faint">{dict.common.kycModule}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight text-ink tracking-tight text-balance">{dict.auth.heroTitle}</h2>
          <p className="mt-3 text-sm font-medium text-muted">{dict.auth.signInSubtitle}</p>
          <ul className="mt-9 space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-hairline bg-card text-primary shadow-card">
                  <f.icon className="size-4" aria-hidden />
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

      {/* Form panel */}
      <div
        className="relative flex w-full flex-col items-center justify-center p-6 lg:w-1/2"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(20,22,43,0.045) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex size-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-xl shadow-primary/30">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-sm font-black tracking-tight">AM</span>
              )}
            </div>
            <h1 className="text-2xl font-black text-ink tracking-tight">{dict.common.appName}</h1>
            <p className="text-sm text-muted mt-1 font-semibold">{dict.auth.signInSubtitle}</p>
          </div>

          <div className="rounded-2xl border border-hairline bg-card p-8.5 shadow-premium">
            <h1 className="text-xl font-bold text-ink tracking-tight">{dict.auth.signInTitle}</h1>
            <p className="mt-1 mb-6.5 text-xs text-muted font-semibold">{dict.auth.signInSubtitle}</p>
            <LoginForm />
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs font-semibold text-faint">
            <Lock className="size-3.5" aria-hidden />
            {dict.auth.trustLine}
          </p>

          <div className="mt-6 flex justify-center">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </main>
  );
}
