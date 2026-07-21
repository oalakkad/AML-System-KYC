import type { Dict } from '@/lib/i18n/en';

export function riskFactorLabel(key: string, dict: Dict): string {
  return (dict.risk.factors as Record<string, string>)[key] ?? key;
}
