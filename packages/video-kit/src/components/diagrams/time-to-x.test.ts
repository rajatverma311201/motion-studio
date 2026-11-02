import {describe, expect, it} from 'vitest';
import {timeToX} from './time-to-x';

describe('timeToX', () => {
  it('maps the start, middle and end of a window', () => {
    expect(timeToX(0, 0, 10, 100)).toBe(0);
    expect(timeToX(5, 0, 10, 100)).toBe(50);
    expect(timeToX(10, 0, 10, 100)).toBe(100);
  });

  it('clamps outside the window', () => {
    expect(timeToX(-5, 0, 10, 100)).toBe(0);
    expect(timeToX(15, 0, 10, 100)).toBe(100);
  });

  it('maps the JWT hour onto a 1200 px bar', () => {
    expect(timeToX(1767225600, 1767225600, 1767229200, 1200)).toBe(0);
    expect(timeToX(1767227400, 1767225600, 1767229200, 1200)).toBe(600);
    expect(timeToX(1767229200, 1767225600, 1767229200, 1200)).toBe(1200);
  });

  it('returns zero for a zero-length window', () => {
    expect(timeToX(5, 5, 5, 100)).toBe(0);
  });
});
