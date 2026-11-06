import {createHash} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {bitDiff, hexToBits} from './bits';
import {
  BASIC_AUTH_EXAMPLE,
  DEMO_BITS_DIFFERENT,
  DEMO_SHA256,
  DEMO_SHA256_TAMPERED,
  DEMO_URL_ENCODED,
} from './hash-fixtures';
import {DEMO_MESSAGE, DEMO_TAMPERED_MESSAGE} from './crypto-fixtures';

const sha256 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

describe('hash fixtures', () => {
  it('matches node:crypto for the demo message', () => {
    expect(sha256(DEMO_MESSAGE)).toBe(DEMO_SHA256);
  });

  it('matches node:crypto for the tampered message', () => {
    expect(sha256(DEMO_TAMPERED_MESSAGE)).toBe(DEMO_SHA256_TAMPERED);
  });

  it('encodes the HTTP Basic example with Buffer', () => {
    expect(Buffer.from(BASIC_AUTH_EXAMPLE.plain, 'utf8').toString('base64')).toBe(BASIC_AUTH_EXAMPLE.base64);
  });

  it('matches encodeURIComponent for the URL example', () => {
    expect(encodeURIComponent(DEMO_MESSAGE)).toBe(DEMO_URL_ENCODED);
  });

  it('records the measured bit difference', () => {
    expect(bitDiff(hexToBits(DEMO_SHA256), hexToBits(DEMO_SHA256_TAMPERED)).count).toBe(DEMO_BITS_DIFFERENT);
  });
});
