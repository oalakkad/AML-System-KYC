import 'server-only';
import { cache } from 'react';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { SETTING_KEYS, BRAND_DEFAULTS, type AuditAction, type Role } from '@/lib/constants';

export async function getUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
}

export async function getRoleCounts(): Promise<Record<Role, number>> {
  const rows = await prisma.user.groupBy({ by: ['role'], _count: { role: true }, where: { active: true } });
  const counts = { FRONT_OFFICE: 0, COMPLIANCE_OFFICER: 0, SENIOR_MANAGER: 0, ADMIN: 0 } as Record<Role, number>;
  for (const r of rows) counts[r.role as Role] = r._count.role;
  return counts;
}

export interface AuditLogFilters {
  action?: AuditAction;
  actorId?: string;
  from?: string;
  to?: string;
  page: number;
}

export const AUDIT_PAGE_SIZE = 25;

export async function getAuditLogs(filters: AuditLogFilters) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.action) where.action = filters.action;
  if (filters.actorId) where.OR = [{ actorId: filters.actorId }, { clientActorId: filters.actorId }];
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
    };
  }

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include: {
        actor: { select: { nameEn: true, nameAr: true, email: true } },
        clientActor: { select: { nameEn: true, nameAr: true, email: true } },
        case: { select: { caseNumber: true } },
      },
    }),
  ]);

  return { total, rows, pageCount: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)) };
}

export async function getFatfCountries() {
  return prisma.country.findMany({ orderBy: { nameEn: 'asc' } });
}

export async function getSystemSettings() {
  const settings = await prisma.systemSetting.findMany();
  const map = new Map(settings.map((s) => [s.key, s.value]));
  return {
    domesticCountryCode: map.get(SETTING_KEYS.domesticCountryCode) ?? 'KW',
    greyListRequiresDocument: (map.get(SETTING_KEYS.greyListRequiresDocument) ?? 'true') === 'true',
  };
}

export interface BrandSettings {
  primaryColor: string;
  accentColor: string;
  sidebarFromColor: string;
  sidebarToColor: string;
  /** Public URL of the uploaded logo, or null if none was ever uploaded. */
  logoUrl: string | null;
}

/**
 * Server-Component-safe brand lookup — used by the root layout, app shell, and
 * login page. Wrapped in React's `cache()` so the handful of call sites in the
 * same request tree share one DB round trip instead of each re-querying.
 */
export const getBrandSettings = cache(async (): Promise<BrandSettings> => {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          SETTING_KEYS.brandPrimaryColor,
          SETTING_KEYS.brandAccentColor,
          SETTING_KEYS.brandSidebarFromColor,
          SETTING_KEYS.brandSidebarToColor,
          SETTING_KEYS.brandLogoFile,
          SETTING_KEYS.brandLogoVersion,
        ],
      },
    },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));
  const logoFile = map.get(SETTING_KEYS.brandLogoFile);
  const logoVersion = map.get(SETTING_KEYS.brandLogoVersion) ?? '0';
  return {
    primaryColor: map.get(SETTING_KEYS.brandPrimaryColor) ?? BRAND_DEFAULTS.primaryColor,
    accentColor: map.get(SETTING_KEYS.brandAccentColor) ?? BRAND_DEFAULTS.accentColor,
    sidebarFromColor: map.get(SETTING_KEYS.brandSidebarFromColor) ?? BRAND_DEFAULTS.sidebarFromColor,
    sidebarToColor: map.get(SETTING_KEYS.brandSidebarToColor) ?? BRAND_DEFAULTS.sidebarToColor,
    logoUrl: logoFile ? `/uploads/${logoFile}?v=${logoVersion}` : null,
  };
});
