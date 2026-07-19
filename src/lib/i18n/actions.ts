'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALE_COOKIE } from './index';

export async function toggleLocale(current: 'en' | 'ar') {
  const store = await cookies();
  store.set(LOCALE_COOKIE, current === 'en' ? 'ar' : 'en', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
}
