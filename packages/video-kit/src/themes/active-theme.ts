import {DEFAULT_MODE, DEFAULT_THEME_ID, getThemeById} from './registry';
import type {ResolvedTheme, Theme, ThemeMode} from './theme-types';

/** The layer that supplied a resolved value. */
export type ThemeSource = 'hash' | 'cli' | 'variable' | 'lesson' | 'config' | 'default';

/** Every layer that can pick a theme or a mode. Each field is resolved independently. */
export interface ThemeSelectionInput {
  hashTheme?: string;
  hashMode?: string;
  cliTheme?: string;
  cliMode?: string;
  variableTheme?: string;
  variableMode?: string;
  lessonTheme?: string;
  lessonMode?: string;
  configTheme?: string;
  configMode?: string;
}

/** The pair that `setActiveTheme` needs, plus where each half came from. */
export interface ThemeSelection {
  themeId: string;
  mode: ThemeMode;
  source: {theme: ThemeSource; mode: ThemeSource};
}

const THEME_HASH = /(?:^|[#&])theme=([a-z0-9-]+)/;
const MODE_HASH = /(?:^|[#&])mode=(dark|light)/;

let activeId = DEFAULT_THEME_ID;
let activeMode: ThemeMode = DEFAULT_MODE;
let cached: ResolvedTheme | null = null;

function isMode(value: string | undefined): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

function flatten(theme: Theme, mode: ThemeMode): ResolvedTheme {
  return {
    ...theme.variants[mode],
    id: theme.id,
    name: theme.name,
    mode,
    fonts: theme.fonts,
  };
}

function resolveTheme(id: string): Theme {
  return getThemeById(id) ?? getThemeById(DEFAULT_THEME_ID)!;
}

/**
 * Pull the look parameters out of a URL hash such as `#s=3&theme=tokyo-night&mode=light`.
 * Absent or malformed values are left undefined.
 *
 * @example
 * parseLookHash('#s=3&theme=tokyo-night&mode=light'); // {theme: 'tokyo-night', mode: 'light'}
 */
export function parseLookHash(hash: string | undefined): {theme?: string; mode?: string} {
  if (!hash) return {};
  return {
    theme: THEME_HASH.exec(hash)?.[1],
    mode: MODE_HASH.exec(hash)?.[1],
  };
}

/**
 * Select the theme id and mode from every layer. Precedence, highest first:
 * URL hash, CLI flag, player variable, chapters.json, video.config.json, built-in.
 * Each field resolves on its own; invalid values are skipped, never thrown.
 *
 * @example
 * resolveThemeSelection({cliTheme: 'tokyo-night', lessonMode: 'light'}); // tokyo-night / light, theme from cli
 */
export function resolveThemeSelection(input: ThemeSelectionInput): ThemeSelection {
  const themeCandidates: [string | undefined, ThemeSource][] = [
    [input.hashTheme, 'hash'],
    [input.cliTheme, 'cli'],
    [input.variableTheme, 'variable'],
    [input.lessonTheme, 'lesson'],
    [input.configTheme, 'config'],
  ];

  let themeId = DEFAULT_THEME_ID;
  let themeSource: ThemeSource = 'default';
  for (const [candidate, source] of themeCandidates) {
    if (candidate !== undefined && getThemeById(candidate) !== undefined) {
      themeId = candidate;
      themeSource = source;
      break;
    }
  }

  const modeCandidates: [string | undefined, ThemeSource][] = [
    [input.hashMode, 'hash'],
    [input.cliMode, 'cli'],
    [input.variableMode, 'variable'],
    [input.lessonMode, 'lesson'],
    [input.configMode, 'config'],
  ];

  let mode = resolveTheme(themeId).defaultMode;
  let modeSource: ThemeSource = 'default';
  for (const [candidate, source] of modeCandidates) {
    if (isMode(candidate)) {
      mode = candidate;
      modeSource = source;
      break;
    }
  }

  return {themeId, mode, source: {theme: themeSource, mode: modeSource}};
}

/**
 * Activate a theme and mode. Unknown ids fall back to the default theme; an
 * omitted mode uses that theme's `defaultMode`.
 *
 * @example
 * setActiveTheme('neubrutal', 'light');
 */
export function setActiveTheme(id: string, mode?: ThemeMode): void {
  const theme = resolveTheme(id);
  activeId = theme.id;
  activeMode = isMode(mode) ? mode : theme.defaultMode;
  cached = null;
}

/**
 * The flattened look every kit helper reads at call time.
 *
 * @example
 * getTheme().colors.lime;
 */
export function getTheme(): ResolvedTheme {
  if (!cached) cached = flatten(resolveTheme(activeId), activeMode);
  return cached;
}
