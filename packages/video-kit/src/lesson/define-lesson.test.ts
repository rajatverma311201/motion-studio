import {describe, expect, it, vi} from 'vitest';

// define-lesson.ts imports makeScene2D for its runtime factory; the pure helper
// under test must not pull the browser-only 2D package into Node.
vi.mock('@motion-canvas/2d', () => ({makeScene2D: vi.fn()}));

import {colors} from '../theme';
import {resolveChapters} from './chapters';
import {defineLesson, parseStartSection} from './define-lesson';
import type {ChaptersFile} from './lesson-types';

describe('defineLesson', () => {
  it('throws at definition time when chapters and sections differ', () => {
    const chapters: ChaptersFile = {
      slug: 'demo',
      title: 'DEMO',
      chapters: [
        {name: 'ONE', color: 'lime'},
        {name: 'TWO', color: 'pink'},
      ],
    };

    expect(() => defineLesson({chapters, sections: []})).toThrow(/demo.*2 chapters.*0 section/);
  });
});

describe('parseStartSection', () => {
  it('prefers the player variable over the hash', () => {
    expect(parseStartSection('#s=5', 2, 18)).toBe(2);
  });

  it('reads the section from the dev hash', () => {
    expect(parseStartSection('#s=5', -1, 18)).toBe(5);
  });

  it('clamps a hash past the last chapter', () => {
    expect(parseStartSection('#s=99', -1, 18)).toBe(17);
  });

  it('falls back to zero without a variable or hash', () => {
    expect(parseStartSection(undefined, -1, 18)).toBe(0);
  });

  it('ignores a negative variable', () => {
    expect(parseStartSection('#s=3', -3, 18)).toBe(3);
  });

  it('ignores a non-integer variable', () => {
    expect(parseStartSection('#s=4', 2.5, 18)).toBe(4);
  });

  it('ignores a hash that is not a number', () => {
    expect(parseStartSection('#s=abc', -1, 18)).toBe(0);
  });
});

describe('resolveChapters', () => {
  it('maps palette names to hex colours', () => {
    const file: ChaptersFile = {
      slug: 'demo',
      title: 'DEMO',
      chapters: [{name: 'X', color: 'lime'}],
    };

    expect(resolveChapters(file)).toEqual([{name: 'X', color: colors.lime}]);
  });

  it('keeps the optional summary', () => {
    const file: ChaptersFile = {
      slug: 'demo',
      title: 'DEMO',
      chapters: [{name: 'X', color: 'pink', summary: 'One sentence.'}],
    };

    expect(resolveChapters(file)).toEqual([{name: 'X', color: colors.pink, summary: 'One sentence.'}]);
  });

  it('throws on an unknown colour name', () => {
    const file = {
      slug: 'demo',
      title: 'DEMO',
      chapters: [{name: 'X', color: 'chartreuse'}],
    } as unknown as ChaptersFile;

    expect(() => resolveChapters(file)).toThrow(/chartreuse/);
  });
});
