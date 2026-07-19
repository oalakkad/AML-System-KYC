// Name-matching engine for sanctions/PEP screening. Pure, dependency-free,
// unit-tested — mirrors the hand-rolled style of src/lib/iban.ts and
// src/lib/risk/engine.ts rather than pulling in a general NLP package for a
// narrow need.
//
// "Arabic Phonetic" is Arabic letter-form normalization (unifying common
// spelling variants: أ/إ/آ → ا, ة → ه, ى → ي, stripping diacritics) applied
// before comparison — a standard, real technique for Arabic name matching.
// It is NOT full phonetic/IPA transliteration (no free, actively-maintained
// library exists for that); the label in the UI reflects this honestly.

/** Lowercase, strip diacritics/punctuation, collapse whitespace. */
export function normalizeName(name: string): string {
  return name
    .normalize('NFKD')
    // \p{M} covers every combining mark NFKD can produce — Latin accents,
    // Arabic hamza-above (أ → ا + U+0654), tashkeel, etc. A Latin-only range
    // here would silently leave the Arabic marks in place as non-letter
    // codepoints, which the next line then replaces with a space and splits
    // the word in two.
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

const ARABIC_NORMALIZE_MAP: Record<string, string> = {
  'أ': 'ا', // أ → ا
  'إ': 'ا', // إ → ا
  'آ': 'ا', // آ → ا
  'ة': 'ه', // ة → ه
  'ى': 'ي', // ى → ي
};

/**
 * Normalize common Arabic spelling variants. Tashkeel diacritics are already
 * stripped by normalizeName() (they decompose to combining marks under NFKD).
 */
export function normalizeArabic(name: string): string {
  return normalizeName(name).replace(/[أإآةى]/g, (ch) => ARABIC_NORMALIZE_MAP[ch] ?? ch);
}

/** Jaro similarity, 0–1. */
function jaro(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matchDistance = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);
  let matches = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  return (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
}

/** Jaro-Winkler similarity, 0–1 — boosts scores for matching name prefixes. */
export function jaroWinkler(a: string, b: string, prefixScale = 0.1): number {
  const j = jaro(a, b);
  let prefixLen = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] !== b[i]) break;
    prefixLen++;
  }
  return j + prefixLen * prefixScale * (1 - j);
}

/**
 * Token-set similarity — splits both names into tokens and matches each
 * token in the shorter name against its best counterpart in the longer one,
 * averaging the results. Handles reordered given/family names (e.g. "Ali
 * Hassan" vs "Hassan Ali") which a plain whole-string comparison would miss.
 */
export function tokenSetSimilarity(a: string, b: string): number {
  const tokensA = a.split(' ').filter(Boolean);
  const tokensB = b.split(' ').filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  const total = shorter.reduce((sum, tok) => {
    const best = Math.max(...longer.map((t) => jaroWinkler(tok, t)));
    return sum + best;
  }, 0);
  return total / shorter.length;
}

export interface MatchOptions {
  arabicPhonetic?: boolean;
}

/** Best similarity score (0–100) between a query and a candidate's full name + aliases. */
export function matchScore(query: string, candidateNames: string[], options: MatchOptions = {}): number {
  const normalize = options.arabicPhonetic ? normalizeArabic : normalizeName;
  const q = normalize(query);
  if (!q) return 0;

  let best = 0;
  for (const name of candidateNames) {
    const n = normalize(name);
    if (!n) continue;
    const whole = jaroWinkler(q, n);
    const tokenSet = tokenSetSimilarity(q, n);
    best = Math.max(best, whole, tokenSet);
  }
  return Math.round(best * 100);
}
