import {colors} from '../theme';
import type {ChaptersFile, LessonChapter} from './lesson-types';

/** A chapter from chapters.json with its palette key already resolved to a hex colour. */
export type ResolvedChapter = Omit<LessonChapter, 'color'> & {color: string};

/**
 * Resolve every chapter colour name to its palette hex value.
 *
 * @example
 * const hudDefs = resolveChapters(chapters); // [{name: 'INTRO', color: '#C6FF3D'}]
 */
export function resolveChapters(file: ChaptersFile): ResolvedChapter[] {
  return file.chapters.map(chapter => {
    const color = colors[chapter.color];
    if (typeof color !== 'string') {
      throw new Error(
        `Unknown chapter colour "${chapter.color}" in chapters.json for "${file.slug}". ` +
          'Use one of: lime, pink, cyan, yellow, violet, orange, red.',
      );
    }
    return {...chapter, color};
  });
}
