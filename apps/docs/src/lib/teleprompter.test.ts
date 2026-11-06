import {describe, expect, it} from 'vitest';
import {
  clampFontSize,
  parseTeleprompterSearch,
  stepPosition,
  bulletCount,
  DEFAULT_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  type TeleprompterPosition,
} from './teleprompter';

const chapters = [{notes: ['one', 'two', 'three']}, {notes: ['four']}, {notes: []}, {notes: ['five', 'six']}];

describe('parseTeleprompterSearch', () => {
  it('reads the 1-based URL into zero-based indexes', () => {
    expect(parseTeleprompterSearch({c: '1', b: '3'}, chapters)).toEqual({chapter: 0, bullet: 2});
    expect(parseTeleprompterSearch({c: '2', b: '1'}, chapters)).toEqual({chapter: 1, bullet: 0});
    expect(parseTeleprompterSearch({c: 4, b: 1}, chapters)).toEqual({chapter: 3, bullet: 0});
  });

  it('falls back to the first position for missing or invalid values', () => {
    expect(parseTeleprompterSearch({}, chapters)).toEqual({chapter: 0, bullet: 0});
    expect(parseTeleprompterSearch({c: 'nope', b: '1.5'}, chapters)).toEqual({chapter: 0, bullet: 0});
    expect(parseTeleprompterSearch({c: '0', b: '0'}, chapters)).toEqual({chapter: 0, bullet: 0});
  });

  it('clamps a chapter past the end and a bullet past the chapter', () => {
    expect(parseTeleprompterSearch({c: '99', b: '1'}, chapters)).toEqual({chapter: 3, bullet: 0});
    expect(parseTeleprompterSearch({c: '1', b: '99'}, chapters)).toEqual({chapter: 0, bullet: 2});
  });

  it('keeps the bullet at zero for a chapter without notes', () => {
    expect(parseTeleprompterSearch({c: '3', b: '4'}, chapters)).toEqual({chapter: 2, bullet: 0});
  });

  it('handles a lesson without chapters', () => {
    expect(parseTeleprompterSearch({c: '2', b: '3'}, [])).toEqual({chapter: 0, bullet: 0});
  });
});

describe('bulletCount', () => {
  it('counts notes and treats an empty chapter as one step', () => {
    expect(bulletCount(chapters[0])).toBe(3);
    expect(bulletCount(chapters[2])).toBe(1);
    expect(bulletCount(undefined)).toBe(1);
  });
});

describe('stepPosition', () => {
  const at = (chapter: number, bullet: number): TeleprompterPosition => ({chapter, bullet});

  it('moves inside a chapter and rolls into the next one', () => {
    expect(stepPosition(at(0, 0), 'next-bullet', chapters)).toEqual(at(0, 1));
    expect(stepPosition(at(0, 2), 'next-bullet', chapters)).toEqual(at(1, 0));
  });

  it('stops at the very end', () => {
    expect(stepPosition(at(3, 1), 'next-bullet', chapters)).toEqual(at(3, 1));
  });

  it('rolls back to the last bullet of the previous chapter', () => {
    expect(stepPosition(at(1, 0), 'previous-bullet', chapters)).toEqual(at(0, 2));
    expect(stepPosition(at(0, 0), 'previous-bullet', chapters)).toEqual(at(0, 0));
  });

  it('treats an empty chapter as one step', () => {
    expect(stepPosition(at(1, 0), 'next-bullet', chapters)).toEqual(at(2, 0));
    expect(stepPosition(at(2, 0), 'next-bullet', chapters)).toEqual(at(3, 0));
    expect(stepPosition(at(3, 0), 'previous-bullet', chapters)).toEqual(at(2, 0));
  });

  it('moves between chapters and clamps at both ends', () => {
    expect(stepPosition(at(0, 2), 'next-chapter', chapters)).toEqual(at(1, 0));
    expect(stepPosition(at(3, 1), 'next-chapter', chapters)).toEqual(at(3, 0));
    expect(stepPosition(at(2, 0), 'previous-chapter', chapters)).toEqual(at(1, 0));
    expect(stepPosition(at(0, 1), 'previous-chapter', chapters)).toEqual(at(0, 0));
  });

  it('goes home', () => {
    expect(stepPosition(at(3, 1), 'first', chapters)).toEqual(at(0, 0));
  });

  it('normalizes an invalid incoming position', () => {
    expect(stepPosition(at(9, 9), 'next-bullet', chapters)).toEqual(at(3, 1));
    expect(stepPosition(at(-2, -2), 'next-bullet', chapters)).toEqual(at(0, 1));
  });

  it('handles a lesson without chapters', () => {
    expect(stepPosition(at(0, 0), 'next-bullet', [])).toEqual(at(0, 0));
  });
});

describe('clampFontSize', () => {
  it('keeps the default for non-finite values', () => {
    expect(clampFontSize(Number.NaN)).toBe(DEFAULT_FONT_SIZE);
    expect(clampFontSize(Number.POSITIVE_INFINITY)).toBe(DEFAULT_FONT_SIZE);
  });

  it('clamps into the 24 to 96 range and rounds', () => {
    expect(clampFontSize(12)).toBe(MIN_FONT_SIZE);
    expect(clampFontSize(120)).toBe(MAX_FONT_SIZE);
    expect(clampFontSize(40.6)).toBe(41);
    expect(clampFontSize(40)).toBe(40);
  });
});
