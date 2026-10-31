import {describe, expect, it} from 'vitest';
import {formatBits, toHex} from './format';

describe('format', () => {
  it('pads and masks binary values', () => {
    expect(formatBits(5, 8)).toBe('00000101');
    expect(formatBits(12, 4)).toBe('1100');
    expect(formatBits(300, 8)).toBe('00101100');
    expect(formatBits(0, 1)).toBe('0');
  });

  it('writes two upper-case hex digits', () => {
    expect(toHex(0x1c)).toBe('1C');
    expect(toHex(5)).toBe('05');
    expect(toHex(0x1ff)).toBe('FF');
  });
});
