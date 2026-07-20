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
    <main className="flex min-h-dvh bg-slate-50/50">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#030712] border-r border-white/5 p-16 lg:flex">
        {/* Glowing mesh effects */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        <div className="absolute top-[-10%] left-[-10%] size-[500px] rounded-full bg-primary/20 blur-[100px] opacity-60 mix-blend-screen animate-pulse-glow" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] size-[500px] rounded-full bg-accent/15 blur-[100px] opacity-50 mix-blend-screen animate-pulse-glow" style={{ animationDuration: '12s' }} />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10.5 items-center justify-center overflow-hidden rounded-xl bg-accent text-white shadow-xl shadow-accent/25 ring-1 ring-white/10">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-sm font-black tracking-tight">AM</span>
            )}
          </div>
          <div>
            <p className="text-base font-bold text-white tracking-tight">{dict.common.appName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{dict.common.kycModule}</p>
          </div>
        </div>

        <div className="relative my-auto max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight text-white tracking-tight">{dict.auth.signInSubtitle}</h2>
          <ul className="mt-10 space-y-5">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-4 text-slate-300 group transition-all duration-300 hover:translate-x-1">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10 group-hover:bg-primary/20 group-hover:ring-primary/30 transition-all duration-300">
                  <f.icon className="size-4.5 text-slate-400 group-hover:text-white transition-colors" aria-hidden />
                </span>
                <span className="text-sm font-semibold tracking-wide group-hover:text-white transition-colors">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-600">
          © {new Date().getFullYear()} {dict.common.appName}
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        {/* Soft decorative visual elements in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[450px] rounded-full bg-primary/5 blur-[80px] pointer-events-none lg:block hidden" />

        <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex size-11 items-center justify-center overflow-hidden rounded-xl bg-accent text-white shadow-xl shadow-accent/25">
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

          <div className="rounded-2xl border border-hairline/80 bg-white/80 backdrop-blur-md p-8.5 shadow-premium ring-1 ring-black/[0.01]">
            <h1 className="text-xl font-bold text-ink tracking-tight">{dict.auth.signInTitle}</h1>
            <p className="mt-1 mb-6.5 text-xs text-muted font-semibold">{dict.auth.signInSubtitle}</p>
            <LoginForm />
          </div>

          <div className="mt-8 flex justify-center">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </main>
  );
}

