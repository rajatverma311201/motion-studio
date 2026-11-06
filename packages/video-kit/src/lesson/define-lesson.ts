import type {DescriptionOf} from '@motion-canvas/core';
import {useScene, waitFor} from '@motion-canvas/core';
import type {Scene2D} from '@motion-canvas/2d';
import {makeScene2D} from '@motion-canvas/2d';
import {buildHud, buildShortHud, setSection} from '../hud';
import {colors} from '../theme';
import {parseLookHash, resolveThemeSelection, setActiveTheme} from '../themes/active-theme';
import {readBuildLook, readLocationHash} from '../themes/build-look';
import {themeIds} from '../themes/registry';
import {hasClips, readBuildVoice} from '../voice/build-voice';
import {mountVoicePanel} from '../voice/panel';
import type {VoiceManifest} from '../voice/timing';
import {configureVoice, finishVoice, loadVoiceManifest, wantsVoiceManifest} from '../voice/voice-state';
import {effectivePauseMode, resolvePauseMode, resolveVoiceMode} from '../voice/voice-settings';
import {resolveChapters} from './chapters';
import type {LessonConfig} from './lesson-types';

/**
 * Pure start-section resolution. The player variable wins over the dev hash,
 * and the result is always clamped into the lesson's range.
 *
 * @example
 * parseStartSection('#s=5', -1, 18); // 5
 */
export function parseStartSection(hash: string | undefined, variable: number, total: number): number {
  const clamp = (value: number): number => Math.max(0, Math.min(value, total - 1));

  if (Number.isInteger(variable) && variable >= 0) return clamp(variable);

  const match = hash ? /s=(\d+)/.exec(hash) : null;
  if (match) return clamp(Number(match[1]));

  return clamp(0);
}

/**
 * Read the section the lesson should start at. Used by `defineLesson()` at
 * scene run time, so it needs an active Motion Canvas scene.
 *
 * Precedence: the `startSection` player variable, then the dev-only `#s=N`
 * hash, then 0. The result is clamped into `[0, total - 1]`.
 */
export function readStartSection(total: number): number {
  let variable = -1;
  try {
    variable = useScene().variables.get('startSection', -1)();
  } catch {
    // Outside a running scene there are no variables; the hash fallback still works.
  }

  return parseStartSection(readLocationHash(), variable, total);
}

/**
 * Build the default export of a lesson scene: theme, background, HUD, section loop.
 *
 * @example
 * export default defineLesson({
 *   chapters: chapters as ChaptersFile,
 *   sections: [intro, fullTableScan],
 * });
 */
export function defineLesson(config: LessonConfig): DescriptionOf<Scene2D> {
  const {chapters, sections} = config;
  const total = chapters.chapters.length;

  if (sections.length !== total) {
    throw new Error(
      `Lesson "${chapters.slug}" has ${total} chapters in chapters.json but ${sections.length} section generators.`,
    );
  }

  return makeScene2D(function* (view) {
    let themeVariable = '';
    let modeVariable = '';
    let pauseVariable = '';
    let voiceVariable = '';
    try {
      const variables = useScene().variables;
      themeVariable = variables.get('theme', '')();
      modeVariable = variables.get('mode', '')();
      pauseVariable = variables.get('pause', '')();
      voiceVariable = variables.get('voice', '')();
    } catch {
      // Outside a running scene there are no variables; hash and chapters still work.
    }

    if (themeVariable && !themeIds.includes(themeVariable)) {
      console.warn(`Unknown theme "${themeVariable}" from the player variable; using the next valid source.`);
    }
    if (chapters.theme && !themeIds.includes(chapters.theme)) {
      console.warn(
        `Unknown theme "${chapters.theme}" in chapters.json for "${chapters.slug}"; using the next valid source.`,
      );
    }

    const hash = parseLookHash(readLocationHash());
    const build = readBuildLook();
    if (build.configTheme && !themeIds.includes(build.configTheme)) {
      console.warn(`Unknown theme "${build.configTheme}" in video.config.json; using the next valid source.`);
    }

    const {themeId, mode, source} = resolveThemeSelection({
      hashTheme: hash.theme,
      hashMode: hash.mode,
      cliTheme: build.cliTheme,
      cliMode: build.cliMode,
      variableTheme: themeVariable,
      variableMode: modeVariable,
      lessonTheme: chapters.theme,
      lessonMode: chapters.mode,
      configTheme: build.configTheme,
      configMode: build.configMode,
    });
    setActiveTheme(themeId, mode);
    console.info(`[video-kit] look: ${themeId} / ${mode}  (theme from ${source.theme}, mode from ${source.mode})`);

    const buildVoice = readBuildVoice();
    const manifest =
      buildVoice.dev && wantsVoiceManifest({cli: buildVoice.cliVoice, variable: voiceVariable})
        ? ((yield loadVoiceManifest(chapters.slug)) as VoiceManifest | null)
        : null;
    const voice = buildVoice.dev
      ? resolveVoiceMode({cli: buildVoice.cliVoice, variable: voiceVariable, hasClips: hasClips(manifest)})
      : 'off';
    const pause = effectivePauseMode(resolvePauseMode({cli: buildVoice.cliPause, variable: pauseVariable}), voice);
    configureVoice({slug: chapters.slug, voice, pause, manifest});
    if (voice === 'record') mountVoicePanel({slug: chapters.slug, manifest});
    if (voice !== 'off') {
      const clips = Object.keys(manifest?.clips ?? {}).length;
      console.info(`[video-kit] voice: ${voice}, pause: ${pause} (${clips} clip${clips === 1 ? '' : 's'})`);
    }

    view.fill(colors.bg);
    const start = readStartSection(total);
    const hudDefs = resolveChapters(chapters).map(({name, color}) => ({name, color}));
    if (chapters.format === 'short') {
      buildShortHud(view, chapters.title, hudDefs);
    } else {
      buildHud(view, chapters.title, hudDefs, config.hud);
    }

    for (let i = start; i < total; i++) {
      yield* setSection(i);
      yield* sections[i](view);
    }

    yield* waitFor(0.5);
    yield* finishVoice();
  });
}
