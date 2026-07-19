import 'server-only';
import { prisma } from '@/lib/db';

export async function getStrStats() {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const [totalThisYear, inPreparation, underReview, submitted] = await Promise.all([
    prisma.strReport.count({ where: { createdAt: { gte: yearStart } } }),
    prisma.strReport.count({ where: { status: 'IN_PREPARATION' } }),
    prisma.strReport.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.strReport.count({ where: { status: 'SUBMITTED' } }),
  ]);
  return { totalThisYear, inPreparation, underReview, submitted };
}

export async function getInvestigationsForStrLink() {
  const cases = await prisma.investigationCase.findMany({
    where: { status: { not: 'CLOSED' } },
    select: { id: true, caseRef: true, kycCase: { select: { profile: { select: { fullName: true } }, corporateProfile: { select: { legalName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return cases.map((c) => ({
    id: c.id,
    label: `${c.caseRef} — ${c.kycCase.profile?.fullName ?? c.kycCase.corporateProfile?.legalName ?? ''}`,
  }));
}

export async function getRecentStrReports(limit = 25) {
  return prisma.strReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      kycCase: { select: { caseNumber: true, profile: { select: { fullName: true } }, corporateProfile: { select: { legalName: true } } } },
      preparedBy: { select: { nameEn: true, nameAr: true } },
      investigationCase: { select: { caseRef: true } },
    },
  });
}
