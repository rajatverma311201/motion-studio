import type {ThreadGenerator} from '@motion-canvas/core';
import type {View2D} from '@motion-canvas/2d';
import type {BuildHudOptions} from '../hud';
import type {ColorName} from '../theme';
import type {ThemeMode} from '../themes/theme-types';

/** One chapter as stored in chapters.json: plain data, readable by the docs app. */
export interface LessonChapter {
  /** Short upper-case label shown in the HUD pill, e.g. "FULL TABLE SCAN". */
  name: string;
  /** Palette key, e.g. "lime". Resolved to hex inside the scene. */
  color: ColorName;
  /** One sentence for the docs page (not shown in the video). */
  summary?: string;
  /** Timestamp in the final render, e.g. "4:12". Filled in after the render. */
  at?: string;
}

export interface ChaptersFile {
  slug: string; // must equal the project file name, e.g. "db-indexing"
  title: string; // "DB INDEXING"  (HUD title)
  /** Optional theme id. Unknown ids are skipped with a console.warn. */
  theme?: string;
  /** Optional theme mode; the theme's defaultMode wins when omitted. */
  mode?: ThemeMode;
  /** 3 to 8 short points for the docs page and the YouTube description. */
  summaryPoints?: string[];
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
  /** Optional HUD overrides, e.g. a fixed pill row for an older lesson. */
  hud?: BuildHudOptions;
}
