import type { Metadata } from 'next';
import { Cairo, Montserrat } from 'next/font/google';
import { getDict } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/client';
import { getBrandSettings } from '@/lib/settings/queries';
import './globals.css';

// Latin display/body face
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
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

// Runs before paint (blocking, inline) so the correct theme is applied on
// first frame — otherwise the page would flash Midnight before JS hydrates
// and reads the saved preference.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('aml_theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { dict, locale, dir } = await getDict();
  const brand = await getBrandSettings();

  // Admin-configurable brand colors (Settings > Branding), applied as inline
  // custom-property overrides on <html> — an inline style always wins over the
  // stylesheet's :root defaults, so this is deterministic regardless of CSS
  // load order. globals.css derives --color-primary/-accent (theme-adjusted)
  // and their hover/soft shades from these two raw values via color-mix(),
  // so every theme stays in sync with a single admin pick.
  const brandStyle = {
    '--color-primary-raw': brand.primaryColor,
    '--color-accent-raw': brand.accentColor,
  } as React.CSSProperties;

  return (
    <html lang={locale} dir={dir} style={brandStyle} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${montserrat.variable} ${cairo.variable} min-h-dvh antialiased`}>
        <I18nProvider dict={dict} locale={locale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
