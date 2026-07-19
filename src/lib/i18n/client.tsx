'use client';

// Client-side i18n context. The server layout injects the active dictionary,
// so client components never bundle both languages.

import { createContext, useContext, type ReactNode } from 'react';
import type { Dict } from './en';
export { interpolate } from './interpolate';

export type Locale = 'en' | 'ar';

interface I18nContextValue {
  dict: Dict;
  locale: Locale;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  dict,
  locale,
  children,
}: {
  dict: Dict;
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ dict, locale, dir: locale === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

