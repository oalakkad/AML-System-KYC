import { describe, it, expect } from 'vitest';
import {
  encryptField,
  decryptField,
  encryptNullable,
  decryptNullable,
  encryptBuffer,
  decryptBuffer,
  sha256,
} from './crypto';

describe('field encryption', () => {
  it('round-trips a value', () => {
    const plain = 'Civil ID 291010101234';
    const enc = encryptField(plain);
    expect(enc).not.toBe(plain);
    expect(enc.split(':')).toHaveLength(3);
    expect(decryptField(enc)).toBe(plain);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encryptField('same')).not.toBe(encryptField('same'));
  });

  it('round-trips unicode / arabic', () => {
    const plain = 'محمد عبدالله الكويت';
    expect(decryptField(encryptField(plain))).toBe(plain);
  });

  it('fails to decrypt tampered ciphertext (auth tag)', () => {
    const enc = encryptField('secret');
    const [iv, tag, data] = enc.split(':');
    const tampered = `${iv}:${tag}:${Buffer.from('evil').toString('base64')}`;
    expect(() => decryptField(tampered)).toThrow();
    // sanity: the untampered value still decrypts
    expect(decryptField(`${iv}:${tag}:${data}`)).toBe('secret');
  });

  it('handles nullable helpers', () => {
    expect(encryptNullable('')).toBeNull();
    expect(encryptNullable(null)).toBeNull();
    expect(decryptNullable(null)).toBeNull();
    const enc = encryptNullable('x');
    expect(decryptNullable(enc)).toBe('x');
  });
});

describe('buffer encryption', () => {
  it('round-trips a binary blob', () => {
    const buf = Buffer.from([0, 1, 2, 3, 255, 128, 64]);
    const enc = encryptBuffer(buf);
    expect(enc.equals(buf)).toBe(false);
    expect(decryptBuffer(enc).equals(buf)).toBe(true);
  });

  it('rejects a truncated blob', () => {
    expect(() => decryptBuffer(Buffer.from([1, 2, 3]))).toThrow();
  });
});

describe('sha256', () => {
  it('hashes deterministically', () => {
    expect(sha256('abc')).toBe(sha256(Buffer.from('abc')));
    expect(sha256('abc')).toHaveLength(64);
  });
});
