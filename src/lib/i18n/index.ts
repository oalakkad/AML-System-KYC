import 'server-only';
import { cookies } from 'next/headers';
import { en, type Dict } from './en';
import { ar } from './ar';

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = 'aml_locale';

const dicts: Record<Locale, Dict> = { en, ar };

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === 'ar' ? 'ar' : 'en';
}

export async function getDict(): Promise<{ dict: Dict; locale: Locale; dir: 'ltr' | 'rtl' }> {
  const locale = await getLocale();
  return { dict: dicts[locale], locale, dir: locale === 'ar' ? 'rtl' : 'ltr' };
}

export function dictFor(locale: Locale): Dict {
  return dicts[locale];
}

/** Pick the localized country name. */
export function countryName(
  locale: Locale,
  country: { nameEn: string; nameAr: string },
): string {
  return locale === 'ar' ? country.nameAr : country.nameEn;
}
