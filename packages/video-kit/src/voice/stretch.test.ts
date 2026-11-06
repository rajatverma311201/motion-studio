import {describe, expect, it} from 'vitest';
import {shouldPause, stretchWait} from './stretch';

describe('stretchWait', () => {
  it('waits for the uncovered part of a longer clip', () => {
    expect(stretchWait(6.4, 3)).toBeCloseTo(3.4);
  });

  it('does not wait when the animation is already longer than the clip', () => {
    expect(stretchWait(6.4, 8)).toBe(0);
  });

  it('does not wait without a clip', () => {
    expect(stretchWait(undefined, 3)).toBe(0);
  });

  it('clamps a negative result to zero', () => {
    expect(stretchWait(-2, 1)).toBe(0);
    expect(stretchWait(5, -3)).toBe(5);
  });

  it('ignores non-finite values', () => {
    expect(stretchWait(Number.NaN, 1)).toBe(0);
    expect(stretchWait(5, Number.NaN)).toBe(0);
    expect(stretchWait(Number.POSITIVE_INFINITY, 1)).toBe(0);
  });
});

describe('shouldPause', () => {
  it('pauses at every beat in beat mode', () => {
    expect(shouldPause('beat', 0)).toBe(true);
    expect(shouldPause('beat', 4)).toBe(true);
  });

  it('pauses only at the first beat of a chapter in chapter mode', () => {
    expect(shouldPause('chapter', 0)).toBe(true);
    expect(shouldPause('chapter', 1)).toBe(false);
    expect(shouldPause('chapter', 7)).toBe(false);
  });

  it('never pauses when off', () => {
    expect(shouldPause('off', 0)).toBe(false);
    expect(shouldPause('off', 3)).toBe(false);
  });
});
