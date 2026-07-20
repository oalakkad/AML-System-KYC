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
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center overflow-hidden rounded-xl bg-accent text-white shadow-lg">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-base font-black tracking-tight">AM</span>
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{dict.common.appName}</p>
            <p className="text-sm text-slate-400">{dict.common.kycModule}</p>
          </div>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight text-white">{dict.auth.signInSubtitle}</h2>
          <ul className="mt-8 space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-300">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="size-4.5" aria-hidden />
                </span>
                <span className="text-sm">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} {dict.common.appName}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex size-12 items-center justify-center overflow-hidden rounded-xl bg-accent text-white shadow-lg">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-lg font-black tracking-tight">AM</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-ink">{dict.common.appName}</h1>
            <p className="text-sm text-muted">{dict.auth.signInSubtitle}</p>
          </div>

          <div className="rounded-2xl border border-hairline bg-card p-8 shadow-card">
            <h1 className="text-xl font-bold text-ink">{dict.auth.signInTitle}</h1>
            <p className="mt-1 mb-6 text-sm text-muted">{dict.auth.signInSubtitle}</p>
            <LoginForm />
          </div>

          <div className="mt-6 flex justify-center">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </main>
  );
}
