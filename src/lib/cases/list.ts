import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { CaseRow } from '@/components/case-list';
import type { CaseStatus, RiskRating } from '@/lib/constants';

export async function listCases(where: Prisma.KycCaseWhereInput, orderBy: Prisma.KycCaseOrderByWithRelationInput = { updatedAt: 'desc' }): Promise<CaseRow[]> {
  const cases = await prisma.kycCase.findMany({
    where,
    orderBy,
    include: {
      profile: { select: { fullName: true } },
      corporateProfile: { select: { legalName: true } },
    },
  });
  return cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    clientName: c.profile?.fullName ?? c.corporateProfile?.legalName ?? null,
    formType: c.formType,
    status: c.status as CaseStatus,
    finalRiskRating: c.finalRiskRating as RiskRating | null,
    updatedAt: c.updatedAt.toISOString(),
    submittedAt: c.submittedAt?.toISOString() ?? null,
  }));
}
