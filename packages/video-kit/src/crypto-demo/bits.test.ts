import {describe, expect, it} from 'vitest';
import {bitDiff, chunkHex, hexToBits} from './bits';
import {DEMO_BITS_DIFFERENT, DEMO_SHA256, DEMO_SHA256_TAMPERED} from './hash-fixtures';

describe('hexToBits', () => {
  it('expands every hex digit to four bits', () => {
    expect(hexToBits('0f')).toBe('00001111');
    expect(hexToBits('a5')).toBe('10100101');
  });

  it('returns 256 bits for a SHA-256 digest', () => {
    expect(hexToBits(DEMO_SHA256)).toHaveLength(256);
    expect(hexToBits(DEMO_SHA256_TAMPERED)).toHaveLength(256);
  });

  it('rejects a non-hex character', () => {
    expect(() => hexToBits('0g')).toThrow(/not a hex digit/);
  });
});

describe('bitDiff', () => {
  it('reports the positions that differ', () => {
    expect(bitDiff('1010', '0011')).toEqual({count: 2, positions: [0, 3]});
  });

  it('returns zero for identical strings', () => {
    expect(bitDiff('1010', '1010')).toEqual({count: 0, positions: []});
  });

  it('rejects strings of different lengths', () => {
    expect(() => bitDiff('101', '1010')).toThrow(/lengths differ/);
  });

  it('finds exactly 125 differing bits between the two SHA-256 digests', () => {
    const diff = bitDiff(hexToBits(DEMO_SHA256), hexToBits(DEMO_SHA256_TAMPERED));
    expect(diff.count).toBe(125);
    expect(diff.count).toBe(DEMO_BITS_DIFFERENT);
    expect(diff.positions).toHaveLength(125);
    expect(diff.positions.every(position => position >= 0 && position < 256)).toBe(true);
  });
});

describe('chunkHex', () => {
  it('splits a SHA-256 digest into four rows of sixteen', () => {
    const rows = chunkHex(DEMO_SHA256, 16);
    expect(rows).toHaveLength(4);
    expect(rows.every(row => row.length === 16)).toBe(true);
    expect(rows.join('')).toBe(DEMO_SHA256);
  });

  it('keeps a short last chunk', () => {
    expect(chunkHex('abcdef', 4)).toEqual(['abcd', 'ef']);
  });

  it('rejects a non-positive size', () => {
    expect(() => chunkHex('aa', 0)).toThrow(/positive integer/);
  });
});
