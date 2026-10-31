import {describe, expect, it} from 'vitest';
import {memoryRowY} from './memory-geometry';

describe('memoryRowY', () => {
  it('puts the standard panel rows on the reference grid', () => {
    expect(memoryRowY(-5, 16, 0)).toBe(-300);
    expect(memoryRowY(-5, 16, 4)).toBe(-124);
    expect(memoryRowY(-5, 16, 12)).toBe(228);
    expect(memoryRowY(-5, 16, 15)).toBe(360);
  });

  it('centres a shorter panel on its own height', () => {
    expect(memoryRowY(0, 4, 0)).toBe(-31);
    expect(memoryRowY(0, 4, 3)).toBe(101);
  });
});
