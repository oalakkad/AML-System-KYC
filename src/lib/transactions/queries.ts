import 'server-only';
import { prisma } from '@/lib/db';
import type { AlertSeverity, AlertStatus } from '@/lib/constants';

export async function getTransactionStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [today, safe, underReview, blocked] = await Promise.all([
    prisma.transaction.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.transaction.count({ where: { createdAt: { gte: startOfDay }, status: 'SAFE' } }),
    prisma.transaction.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.transaction.count({ where: { status: 'BLOCKED' } }),
  ]);

  return {
    today,
    safePercent: today > 0 ? Math.round((safe / today) * 100) : 0,
    underReview,
    blocked,
  };
}

export async function getRecentTransactions(limit = 25) {
  return prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      case: { select: { caseNumber: true, profile: { select: { fullName: true } }, corporateProfile: { select: { legalName: true } } } },
    },
  });
}

export async function getScreeningRules() {
  return prisma.screeningRule.findMany({
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { nameEn: true, nameAr: true } } },
  });
}

export async function getActiveRules() {
  return prisma.screeningRule.findMany({ where: { status: 'ACTIVE' } });
}

export interface AlertFilters {
  severity?: AlertSeverity;
  status?: AlertStatus;
}

export async function getAlerts(filters: AlertFilters) {
  return prisma.alert.findMany({
    where: {
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.status ? { status: filters.status } : { status: { not: 'DISMISSED' } }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      transaction: {
        include: {
          case: { select: { caseNumber: true, profile: { select: { fullName: true } }, corporateProfile: { select: { legalName: true } } } },
        },
      },
      rule: { select: { name: true } },
      resolvedBy: { select: { nameEn: true, nameAr: true } },
    },
  });
}

/** Approved clients eligible to have a transaction recorded against them. */
export async function getApprovedCasesForTxnEntry() {
  const cases = await prisma.kycCase.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      caseNumber: true,
      profile: { select: { fullName: true } },
      corporateProfile: { select: { legalName: true } },
    },
    orderBy: { caseNumber: 'asc' },
  });
  return cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    displayName: c.profile?.fullName ?? c.corporateProfile?.legalName ?? c.caseNumber,
  }));
}

export async function getAlertCounts() {
  const rows = await prisma.alert.groupBy({
    by: ['severity'],
    where: { status: { not: 'DISMISSED' } },
    _count: { severity: true },
  });
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<AlertSeverity, number>;
  for (const r of rows) counts[r.severity as AlertSeverity] = r._count.severity;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total };
}
