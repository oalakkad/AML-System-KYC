import 'server-only';
import { prisma } from '@/lib/db';
import { CASE_STATUSES, ALERT_TYPES, type CaseStatus, type AlertType } from '@/lib/constants';

export async function getReportsOverview(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [totalTxns, txnValue, strsSubmitted, alertsCount] = await Promise.all([
    prisma.transaction.count({ where: { createdAt: { gte: since } } }),
    prisma.transaction.aggregate({ where: { createdAt: { gte: since } }, _sum: { amountKd: true } }),
    prisma.strReport.count({ where: { submittedAt: { gte: since } } }),
    prisma.alert.count({ where: { createdAt: { gte: since } } }),
  ]);

  return {
    totalTransactions: totalTxns,
    transactionValueKd: txnValue._sum.amountKd ?? 0,
    strsSubmitted,
    alertsCount,
  };
}

export async function getKycStatusBreakdown() {
  const grouped = await prisma.kycCase.groupBy({ by: ['status'], _count: { status: true } });
  const countMap = new Map(grouped.map((g) => [g.status, g._count.status]));
  return CASE_STATUSES.map((status) => ({ status, count: countMap.get(status) ?? 0 }));
}

export async function getAlertVolumeByCategory(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const grouped = await prisma.alert.groupBy({
    by: ['alertType'],
    where: { createdAt: { gte: since } },
    _count: { alertType: true },
  });
  const countMap = new Map(grouped.map((g) => [g.alertType, g._count.alertType]));
  return ALERT_TYPES.map((alertType) => ({ alertType, count: countMap.get(alertType) ?? 0 }));
}

export type KycStatusRow = { status: CaseStatus; count: number };
export type AlertVolumeRow = { alertType: AlertType; count: number };
