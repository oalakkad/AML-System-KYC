import { describe, it, expect } from 'vitest';
import { craBandFromScore, nextCraReviewDate, CRA_REVIEW_MONTHS } from './cra';

describe('craBandFromScore', () => {
  it('buckets scores into the four reference bands', () => {
    expect(craBandFromScore(0)).toBe('LOW');
    expect(craBandFromScore(25)).toBe('LOW');
    expect(craBandFromScore(26)).toBe('MEDIUM');
    expect(craBandFromScore(50)).toBe('MEDIUM');
    expect(craBandFromScore(51)).toBe('HIGH');
    expect(craBandFromScore(75)).toBe('HIGH');
    expect(craBandFromScore(76)).toBe('CRITICAL');
    expect(craBandFromScore(150)).toBe('CRITICAL');
  });
});

describe('nextCraReviewDate', () => {
  it('schedules more frequent review for higher-risk bands', () => {
    const from = new Date('2026-01-15T00:00:00Z');
    expect(nextCraReviewDate('LOW', from).getUTCMonth()).toBe(0); // +12mo -> Jan (next year)
    expect(nextCraReviewDate('CRITICAL', from).getUTCMonth()).toBe(3); // +3mo -> Apr
    expect(CRA_REVIEW_MONTHS.CRITICAL).toBeLessThan(CRA_REVIEW_MONTHS.HIGH);
    expect(CRA_REVIEW_MONTHS.HIGH).toBeLessThan(CRA_REVIEW_MONTHS.MEDIUM);
  });
});
