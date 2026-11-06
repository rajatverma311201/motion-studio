import {describe, expect, it} from 'vitest';
import {DEMO_BASE64, DEMO_MESSAGE} from './crypto-fixtures';
import {scrambleFrame} from './scramble';

describe('scrambleFrame', () => {
  it('shows same-length noise at progress 0', () => {
    const frame = scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, 0, 7);
    expect(frame).toHaveLength(DEMO_MESSAGE.length);
    expect(frame).not.toBe(DEMO_MESSAGE);
  });

  it('can hold the source string at progress 0', () => {
    expect(scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, 0, 7, {fallback: 'from'})).toBe(DEMO_MESSAGE);
  });

  it('equals the target at progress 1', () => {
    expect(scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, 1, 7)).toBe(DEMO_BASE64);
    expect(scrambleFrame(DEMO_BASE64, DEMO_MESSAGE, 1, 7)).toBe(DEMO_MESSAGE);
  });

  it('is deterministic for the same inputs', () => {
    const first = scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, 0.45, 23);
    const second = scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, 0.45, 23);
    expect(first).toBe(second);
  });

  it('resolves characters left to right', () => {
    const frame = scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, 0.5, 7);
    const resolved = Math.floor(0.5 * DEMO_BASE64.length);
    expect(frame.slice(0, resolved)).toBe(DEMO_BASE64.slice(0, resolved));
  });

  it('moves the length linearly between the two strings', () => {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const frame = scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, progress, 7);
      expect(frame).toHaveLength(
        Math.round(DEMO_MESSAGE.length + (DEMO_BASE64.length - DEMO_MESSAGE.length) * progress),
      );
    }
  });

  it('clamps progress outside 0..1', () => {
    expect(scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, -1, 7)).toBe(scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, 0, 7));
    expect(scrambleFrame(DEMO_MESSAGE, DEMO_BASE64, 2, 7)).toBe(DEMO_BASE64);
  });
});
