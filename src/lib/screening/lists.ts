// The set of screening list sources shown on the Sanctions Lists page. Only
// OFAC_SDN and UN_CONSOLIDATED are ever populated in SanctionedEntity — both
// are real, free, no-registration public feeds (fetched and snapshotted at
// seed time, not a live daily sync). EU/UK require a registration step we
// haven't built; PEP/Adverse Media have no free equivalent anywhere — see
// IMPLEMENTATION_PLAN.md. Representing this honestly as fixed metadata here
// rather than pretending a live list-management table backs all six.

export type ScreeningListStatus = 'LOADED' | 'LINKING' | 'UNAVAILABLE';

export interface ScreeningListMeta {
  code: string;
  nameEn: string;
  nameAr: string;
  status: ScreeningListStatus;
}

export const SCREENING_LISTS: ScreeningListMeta[] = [
  { code: 'OFAC_SDN', nameEn: 'OFAC SDN', nameAr: 'قائمة أوفاك (OFAC SDN)', status: 'LOADED' },
  { code: 'UN_CONSOLIDATED', nameEn: 'UN Sanctions', nameAr: 'قائمة عقوبات الأمم المتحدة', status: 'LOADED' },
  { code: 'EU_CONSOLIDATED', nameEn: 'EU Consolidated', nameAr: 'القائمة الموحدة للاتحاد الأوروبي', status: 'LINKING' },
  { code: 'UK_HMT', nameEn: 'UK HMT/OFSI', nameAr: 'قائمة المملكة المتحدة (HMT/OFSI)', status: 'LINKING' },
  { code: 'PEP_WORLDWIDE', nameEn: 'PEP Worldwide', nameAr: 'الأشخاص المعرضون سياسياً عالمياً', status: 'UNAVAILABLE' },
  { code: 'ADVERSE_MEDIA', nameEn: 'Adverse Media', nameAr: 'الإعلام السلبي', status: 'UNAVAILABLE' },
];

export const LOADED_LIST_SOURCES = SCREENING_LISTS.filter((l) => l.status === 'LOADED').map((l) => l.code);
