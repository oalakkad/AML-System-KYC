import 'server-only';
import { prisma } from '@/lib/db';
import type { InvestigationStatus } from '@/lib/constants';

export async function getInvestigationsByStatus() {
  const cases = await prisma.investigationCase.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      alert: { select: { severity: true, alertType: true } },
      kycCase: { select: { caseNumber: true, profile: { select: { fullName: true } }, corporateProfile: { select: { legalName: true } } } },
      openedBy: { select: { nameEn: true, nameAr: true } },
    },
  });

  const byStatus = { NEW: [], INVESTIGATING: [], AWAITING_APPROVAL: [], CLOSED: [] } as Record<
    InvestigationStatus,
    typeof cases
  >;
  for (const c of cases) byStatus[c.status as InvestigationStatus].push(c);
  return byStatus;
}

export async function getInvestigationCounts() {
  const grouped = await prisma.investigationCase.groupBy({ by: ['status'], _count: { status: true } });
  const counts = { NEW: 0, INVESTIGATING: 0, AWAITING_APPROVAL: 0, CLOSED: 0 } as Record<InvestigationStatus, number>;
  for (const g of grouped) counts[g.status as InvestigationStatus] = g._count.status;
  return counts;
}

/** Alerts eligible for escalation (not yet linked to an investigation). */
export async function getEscalatableAlerts() {
  return prisma.alert.findMany({
    where: { investigationCase: null, status: { in: ['OPEN', 'IN_REVIEW'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      transaction: {
        include: { case: { select: { caseNumber: true, profile: { select: { fullName: true } }, corporateProfile: { select: { legalName: true } } } } },
      },
      rule: { select: { name: true } },
    },
  });
}
