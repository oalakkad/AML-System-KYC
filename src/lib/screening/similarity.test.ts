import { describe, it, expect } from 'vitest';
import { normalizeName, normalizeArabic, jaroWinkler, tokenSetSimilarity, matchScore } from './similarity';

describe('normalizeName', () => {
  it('lowercases, strips punctuation/diacritics, collapses whitespace', () => {
    expect(normalizeName('José  García-López')).toBe('jose garcia lopez');
  });
});

describe('normalizeArabic', () => {
  it('unifies common alef/ta-marbuta/alef-maqsura variants', () => {
    expect(normalizeArabic('أحمد')).toBe(normalizeArabic('احمد'));
    expect(normalizeArabic('فاطمة')).toBe(normalizeArabic('فاطمه'));
  });

  it('strips tashkeel diacritics', () => {
    expect(normalizeArabic('مُحَمَّد')).toBe(normalizeArabic('محمد'));
  });
});

describe('jaroWinkler', () => {
  it('scores an exact match as 1', () => {
    expect(jaroWinkler('martha', 'martha')).toBe(1);
  });

  it('scores similar names highly, dissimilar names lowly', () => {
    expect(jaroWinkler('martha', 'marhta')).toBeGreaterThan(0.9);
    expect(jaroWinkler('martha', 'zzzzzz')).toBeLessThan(0.3);
  });
});

describe('tokenSetSimilarity', () => {
  it('handles reordered given/family names', () => {
    const score = tokenSetSimilarity('ali hassan', 'hassan ali');
    expect(score).toBeGreaterThan(0.95);
  });
});

describe('matchScore', () => {
  it('returns a high score for a near-exact alias match', () => {
    const score = matchScore('Ayman Al Zawahiri', ['Dr. Ayman AL ZAWAHIRI', 'Ahmad Fuad SALIM']);
    expect(score).toBeGreaterThan(85);
  });

  it('returns a moderate-to-low score for an unrelated name', () => {
    // Jaro-Winkler is known to produce non-trivial mid-range scores for short,
    // wholly unrelated strings that happen to share a few letters — this is
    // exactly why the screening UI defaults its match threshold to 80%, not 0.
    const score = matchScore('John Smith', ['Abu Abbas', 'Muhammad Zaydan']);
    expect(score).toBeLessThan(65);
  });

  it('returns 0 for an empty query', () => {
    expect(matchScore('', ['Some Name'])).toBe(0);
  });
});
