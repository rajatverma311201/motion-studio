import type {ThreadGenerator} from '@motion-canvas/core';
import type {View2D} from '@motion-canvas/2d';
import type {ColorName} from '../theme';

/** One chapter as stored in chapters.json: plain data, readable by the docs app. */
export interface LessonChapter {
  /** Short upper-case label shown in the HUD pill, e.g. "FULL TABLE SCAN". */
  name: string;
  /** Palette key, e.g. "lime". Resolved to hex inside the scene. */
  color: ColorName;
  /** One sentence for the docs page (not shown in the video). */
  summary?: string;
}

export interface ChaptersFile {
  slug: string; // must equal the project file name, e.g. "db-indexing"
  title: string; // "DB INDEXING"  (HUD title)
  chapters: LessonChapter[];
}

/** A chapter plus the generator that animates it. */
export interface LessonSection extends LessonChapter {
  run: (view: View2D) => ThreadGenerator;
}

export interface LessonConfig {
  chapters: ChaptersFile;
  /** One generator per chapter, same order and same length as chapters.chapters. */
  sections: ((view: View2D) => ThreadGenerator)[];
}
