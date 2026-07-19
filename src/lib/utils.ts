import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, locale: 'en' | 'ar'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(
  date: Date | string | null | undefined,
  locale: 'en' | 'ar',
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatKd(amount: number | null | undefined, locale: 'en' | 'ar'): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-KW' : 'en-KW', {
    maximumFractionDigits: 3,
  }).format(amount);
}
