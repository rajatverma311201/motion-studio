import {describe, expect, it} from 'vitest';
import {readSeconds} from './read-time';

describe('readSeconds', () => {
  it('never returns less than 2.5 seconds', () => {
    expect(readSeconds('')).toBe(2.5);
    expect(readSeconds('short')).toBe(2.5);
    expect(readSeconds('x'.repeat(35))).toBe(2.5);
  });

  it('gives one second per 14 characters above the floor', () => {
    expect(readSeconds('x'.repeat(42))).toBe(3);
    expect(readSeconds('x'.repeat(70))).toBe(5);
    expect(readSeconds('x'.repeat(140))).toBe(10);
  });

  it('covers the Short captions', () => {
    expect(readSeconds('Every login ends in a string like this.')).toBeCloseTo(39 / 14);
    expect(readSeconds('Signed does not mean secret.')).toBe(2.5);
  });
});
