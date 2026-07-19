// IBAN validation — structural check + the ISO 7064 MOD 97-10 checksum used
// by every real IBAN. Pure and unit-tested; no network/country-length table,
// so it accepts any structurally valid IBAN rather than validating exact
// per-country length (good enough to catch typos/transposed digits, which is
// the actual failure mode this guards against).

/** True if `value` looks like an IBAN at all (2 letters + 2 digits prefix). */
export function looksLikeIban(value: string): boolean {
  return /^[A-Za-z]{2}\d{2}/.test(value.replace(/\s/g, ''));
}

export function isValidIban(value: string): boolean {
  const clean = value.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) return false;

  // Move the 4-char country+checksum prefix to the end, then expand letters
  // to numbers (A=10 … Z=35) per ISO 7064 MOD 97-10.
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const expanded = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));

  // The expanded numeric string can be far longer than any integer type
  // supports — reduce it mod 97 in chunks instead of using BigInt/Number.
  let remainder = 0;
  for (let i = 0; i < expanded.length; i += 7) {
    remainder = Number(`${remainder}${expanded.slice(i, i + 7)}`) % 97;
  }
  return remainder === 1;
}
