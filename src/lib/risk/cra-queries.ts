import 'server-only';
import { prisma } from '@/lib/db';
import { CRA_BANDS, type CraBand } from './cra';

export interface CraStats {
  counts: Record<CraBand, number>;
  percentages: Record<CraBand, number>;
  totalAssessed: number;
  totalApprovedClients: number;
  notYetAssessed: number;
}

export async function getCraStats(): Promise<CraStats> {
  const [grouped, totalApprovedClients] = await Promise.all([
    prisma.kycCase.groupBy({
      by: ['craBand'],
      where: { status: 'APPROVED', craBand: { not: null } },
      _count: { craBand: true },
    }),
    prisma.kycCase.count({ where: { status: 'APPROVED' } }),
  ]);

  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<CraBand, number>;
  for (const g of grouped) {
    if (g.craBand) counts[g.craBand as CraBand] = g._count.craBand;
  }
  const totalAssessed = CRA_BANDS.reduce((sum, b) => sum + counts[b], 0);
  const percentages = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<CraBand, number>;
  if (totalAssessed > 0) {
    for (const b of CRA_BANDS) percentages[b] = Math.round((counts[b] / totalAssessed) * 100);
  }

  return {
    counts,
    percentages,
    totalAssessed,
    totalApprovedClients,
    notYetAssessed: totalApprovedClients - totalAssessed,
  };
}
