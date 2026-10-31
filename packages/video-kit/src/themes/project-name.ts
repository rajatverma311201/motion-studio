import {parseLookHash, resolveThemeSelection} from './active-theme';
import {readBuildLook, readLocationHash} from './build-look';
import {DEFAULT_MODE, DEFAULT_THEME_ID} from './registry';
import type {ThemeMode} from './theme-types';

/** The lesson-level halves of a look, as they appear in chapters.json. */
export interface LessonLook {
  theme?: string;
  mode?: ThemeMode;
}

/**
 * The project name the FFmpeg exporter turns into `<name>.mp4`. The default look
 * keeps the plain slug so existing render names do not change.
 *
 * @example
 * resolveProjectName('db-indexing', {theme: 'tokyo-night', mode: 'light'});
 * // 'db-indexing--tokyo-night--light'
 */
export function resolveProjectName(slug: string, lesson: LessonLook = {}): string {
  const build = readBuildLook();
  const hash = parseLookHash(readLocationHash());
  const {themeId, mode} = resolveThemeSelection({
    hashTheme: hash.theme,
    hashMode: hash.mode,
    cliTheme: build.cliTheme,
    cliMode: build.cliMode,
    lessonTheme: lesson.theme,
    lessonMode: lesson.mode,
    configTheme: build.configTheme,
    configMode: build.configMode,
  });

  if (themeId === DEFAULT_THEME_ID && mode === DEFAULT_MODE) return slug;
  return `${slug}--${themeId}--${mode}`;
}
