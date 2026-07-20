import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import { getDict } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/client';
import { getBrandSettings } from '@/lib/settings/queries';
import './globals.css';

// Inter — the standard typeface for dense admin/SaaS dashboards (Linear,
// Vercel, GitHub); neutral and highly legible at small sizes, unlike a
// display-oriented face like Montserrat.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
});

// Arabic companion face for RTL text
const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'AML System — KYC',
  description: 'Anti-Money Laundering compliance platform — KYC module',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { dict, locale, dir } = await getDict();
  const brand = await getBrandSettings();

  // Admin-configurable brand colors (Settings > Branding), applied as inline
  // custom-property overrides on <html> — an inline style always wins over the
  // stylesheet's :root defaults, so this is deterministic regardless of CSS
  // load order. --color-primary-hover/-soft and --color-accent-soft derive
  // from these via color-mix() in globals.css, so they stay in sync too.
  const brandStyle = {
    '--color-primary': brand.primaryColor,
    '--color-accent': brand.accentColor,
    '--color-sidebar-from': brand.sidebarFromColor,
    '--color-sidebar-to': brand.sidebarToColor,
  } as React.CSSProperties;

  return (
    <html lang={locale} dir={dir} style={brandStyle}>
      <body className={`${inter.variable} ${cairo.variable} min-h-dvh antialiased`}>
        <I18nProvider dict={dict} locale={locale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
