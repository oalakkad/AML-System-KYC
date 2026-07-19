import { describe, it, expect } from 'vitest';
import { isValidIban, looksLikeIban } from './iban';

describe('looksLikeIban', () => {
  it('matches a 2-letter, 2-digit prefix', () => {
    expect(looksLikeIban('KW81CBKU0000000000001234560101')).toBe(true);
    expect(looksLikeIban('kw81cbku0000000000001234560101')).toBe(true);
  });

  it('rejects plain account numbers', () => {
    expect(looksLikeIban('00123456789')).toBe(false);
    expect(looksLikeIban('')).toBe(false);
  });
});

describe('isValidIban', () => {
  it('accepts known-valid IBANs across countries', () => {
    expect(isValidIban('KW81CBKU0000000000001234560101')).toBe(true); // Kuwait
    expect(isValidIban('DE89370400440532013000')).toBe(true); // Germany
    expect(isValidIban('GB29NWBK60161331926819')).toBe(true); // UK
    expect(isValidIban('FR1420041010050500013M02606')).toBe(true); // France
  });

  it('accepts IBANs with spaces, lowercase letters', () => {
    expect(isValidIban('kw81 cbku 0000 0000 0000 1234 5601 01')).toBe(true);
  });

  it('rejects a tampered digit (bad checksum)', () => {
    expect(isValidIban('KW81CBKU0000000000001234560102')).toBe(false);
  });

  it('rejects garbage input', () => {
    expect(isValidIban('not-an-iban')).toBe(false);
    expect(isValidIban('')).toBe(false);
    expect(isValidIban('KW81')).toBe(false);
  });
});
