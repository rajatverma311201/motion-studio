import {describe, expect, it} from 'vitest';
import {seededRandom} from './seeded-random';

describe('seededRandom', () => {
  it('returns the same sequence for the same seed', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const first = Array.from({length: 20}, () => a());
    const second = Array.from({length: 20}, () => b());
    expect(first).toEqual(second);
  });

  it('returns different sequences for different seeds', () => {
    const a = seededRandom(1);
    const b = seededRandom(2);
    expect(Array.from({length: 10}, () => a())).not.toEqual(Array.from({length: 10}, () => b()));
  });

  it('stays inside [0, 1)', () => {
    const random = seededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
