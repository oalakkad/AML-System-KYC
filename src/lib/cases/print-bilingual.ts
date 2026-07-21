import 'server-only';
import type { DisplaySection } from '@/components/kyc/case-summary';

export interface BilingualField {
  labelEn: string;
  labelAr: string;
  value: string | null;
}

export interface BilingualSection {
  titleEn: string;
  titleAr: string;
  fields: BilingualField[];
}

/**
 * The printable KYC form always shows English + Arabic labels together
 * (unlike the on-screen UI, which follows the viewer's language toggle) — to
 * get both without duplicating buildDisplaySections/buildCorporateDisplaySections,
 * callers run the same builder once per locale and zip the two same-shaped
 * results together by index. Both runs branch on the same profile booleans,
 * so section/field counts and order always match.
 */
export function zipBilingualSections(
  enSections: DisplaySection[],
  arSections: DisplaySection[],
): BilingualSection[] {
  return enSections.map((s, i) => ({
    titleEn: s.title,
    titleAr: arSections[i]?.title ?? s.title,
    fields: s.fields.map((f, j) => ({
      labelEn: f.label,
      labelAr: arSections[i]?.fields[j]?.label ?? f.label,
      value: f.value,
    })),
  }));
}
