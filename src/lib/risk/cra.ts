// Ongoing/perpetual client risk re-assessment (CRA) — periodically re-scores
// already-approved clients using their CURRENT profile data, distinct from
// the one-time onboarding decision made by assessRisk()/assessCorporateRisk()
// at submission time.
//
// Deliberately reuses the SAME scoring engine/weights (RISK_POINTS,
// CORPORATE_RISK_POINTS) rather than a second, independently-tuned weight
// set — one source of truth for "what counts as risky" avoids the two
// engines silently drifting apart. What's new here is purely the four-band
// bucketing (the onboarding engine only ever needed LOW/MEDIUM/HIGH to
// decide the maker→checker→approver routing) and the review-cadence
// mapping, both specific to ongoing monitoring.

export type CraBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export const CRA_BANDS: CraBand[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const CRA_THRESHOLDS = { CRITICAL: 76, HIGH: 51, MEDIUM: 26 } as const;

export function craBandFromScore(score: number): CraBand {
  if (score >= CRA_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (score >= CRA_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= CRA_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

/** Review cadence in months per band — higher risk, more frequent review. */
export const CRA_REVIEW_MONTHS: Record<CraBand, number> = {
  LOW: 12,
  MEDIUM: 12,
  HIGH: 6,
  CRITICAL: 3,
};

export function nextCraReviewDate(band: CraBand, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + CRA_REVIEW_MONTHS[band]);
  return d;
}
