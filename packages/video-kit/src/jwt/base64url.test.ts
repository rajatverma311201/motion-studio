import {Buffer} from 'node:buffer';
import {describe, expect, it} from 'vitest';
import {seededRandom} from '../animation/seeded-random';
import {decodeBase64Url, decodeBase64UrlText, encodeBase64Url} from './base64url';

describe('encodeBase64Url', () => {
  it('matches the known vectors', () => {
    expect(encodeBase64Url('Man')).toBe('TWFu');
    expect(encodeBase64Url('{"alg"')).toBe('eyJhbGci');
    expect(encodeBase64Url('')).toBe('');
  });

  it('encodes UTF-8 text', () => {
    expect(decodeBase64UrlText(encodeBase64Url('héllo ✓'))).toBe('héllo ✓');
  });

  it('never emits +, / or =', () => {
    for (let i = 0; i < 256; i++) {
      const encoded = encodeBase64Url(new Uint8Array([i, 255 - i, i ^ 0x5a]));
      expect(encoded).not.toMatch(/[+/=]/);
    }
  });
});

describe('decodeBase64Url', () => {
  it('accepts padded input but never produces padding', () => {
    expect(decodeBase64UrlText('TWE=')).toBe('Ma');
    expect(decodeBase64UrlText('TQ==')).toBe('M');
    expect(encodeBase64Url('Ma')).toBe('TWE');
    expect(encodeBase64Url('M')).toBe('TQ');
  });

  it('decodes the URL-safe alphabet', () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0xbf]);
    expect(encodeBase64Url(bytes)).toContain('-');
    expect(Array.from(decodeBase64Url(encodeBase64Url(bytes)))).toEqual([0xfb, 0xff, 0xbf]);
  });

  it('round-trips 200 seeded byte arrays against Node', () => {
    const random = seededRandom(20260101);

    for (let i = 0; i < 200; i++) {
      const length = i % 41;
      const bytes = new Uint8Array(Array.from({length}, () => Math.floor(random() * 256)));
      const encoded = encodeBase64Url(bytes);

      expect(encoded).toBe(Buffer.from(bytes).toString('base64url'));
      expect(Array.from(decodeBase64Url(encoded))).toEqual(Array.from(bytes));
    }
  });

  it('names the invalid character and its index', () => {
    expect(() => decodeBase64Url('TW!u')).toThrow('Invalid Base64URL character "!" at index 2');
    expect(() => decodeBase64Url('TW u')).toThrow('Invalid Base64URL character " " at index 2');
  });

  it('rejects an impossible length', () => {
    expect(() => decodeBase64Url('A')).toThrow(/Invalid Base64URL length/);
  });

  it('rejects padding in the middle', () => {
    expect(() => decodeBase64Url('TW=u')).toThrow('Invalid Base64URL padding "=" at index 2');
  });

  it('rejects more than two padding characters', () => {
    expect(() => decodeBase64Url('T===')).toThrow(/more than two/);
  });
});
