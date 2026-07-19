'use server';

// Ongoing risk re-assessment (CRA): re-scores every APPROVED client using
// their CURRENT profile data. Reuses the exact same engine calls the
// onboarding wizard uses (profileToForm -> buildRiskInput -> assessRisk) —
// see src/lib/risk/cra.ts for why this isn't a second, separately-tuned
// scoring system.

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';
import { loadFatfContext } from '@/lib/cases/actions';
import { profileToForm } from '@/lib/cases/mappers';
import { buildRiskInput } from '@/lib/cases/risk-input';
import { corporateProfileToForm } from '@/lib/cases/corporate-mappers';
import { buildCorporateRiskInput } from '@/lib/cases/corporate-risk-input';
import { assessRisk, assessCorporateRisk } from '@/lib/risk/engine';
import { craBandFromScore, nextCraReviewDate } from './cra';

export interface RecalculateAllResult {
  ok: boolean;
  assessedCount?: number;
}

export async function recalculateAllCra(): Promise<RecalculateAllResult> {
  const session = await requireSession(['COMPLIANCE_OFFICER', 'ADMIN']);
  const { fatfByCode, settings } = await loadFatfContext();

  const cases = await prisma.kycCase.findMany({
    where: { status: 'APPROVED' },
    include: { profile: true, corporateProfile: true },
  });

  const now = new Date();
  let assessedCount = 0;

  for (const kase of cases) {
    const isCorporate = kase.clientType === 'CORPORATE';
    if (isCorporate && !kase.corporateProfile) continue;
    if (!isCorporate && !kase.profile) continue;

    const score = isCorporate
      ? assessCorporateRisk(
          buildCorporateRiskInput(
            corporateProfileToForm(kase.corporateProfile!, { formType: kase.formType, clientNo: kase.clientNo }),
            fatfByCode,
            settings,
          ),
        ).score
      : assessRisk(
          buildRiskInput(
            profileToForm(kase.profile!, { formType: kase.formType, clientNo: kase.clientNo }),
            fatfByCode,
            settings,
          ),
        ).score;

    const band = craBandFromScore(score);
    await prisma.kycCase.update({
      where: { id: kase.id },
      data: {
        craScore: score,
        craBand: band,
        craLastAssessedAt: now,
        craNextReviewAt: nextCraReviewDate(band, now),
      },
    });
    assessedCount++;
  }

  await logAudit({
    action: 'CRA_RECALCULATED',
    actorId: session.userId,
    details: { assessedCount, totalApproved: cases.length },
  });

  revalidatePath('/risk-assessment');
  return { ok: true, assessedCount };
}
