import {DEFAULT_MODE, DEFAULT_THEME_ID, getThemeById} from './registry';
import type {ResolvedTheme, Theme, ThemeMode} from './theme-types';

/** Inputs collected from every layer that can pick a theme. Later steps add more layers as new lists. */
export interface ThemeSelectionInput {
  themeVariable?: string;
  modeVariable?: string;
  hash?: string;
  lessonTheme?: string;
  lessonMode?: string;
}

/** The pair that `setActiveTheme` needs. */
export interface ThemeSelection {
  themeId: string;
  mode: ThemeMode;
}

const THEME_HASH = /[#&]theme=([a-z0-9-]+)/;
const MODE_HASH = /[#&]mode=(dark|light)/;

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
 * Select the theme id and mode from ordered candidate lists.
 *
 * Precedence (highest first) is: player variable, dev URL hash, chapters.json,
 * then the defaults. Unknown values are skipped, never thrown.
 *
 * @example
 * resolveThemeSelection({hash: '#s=3&theme=neubrutal&mode=light'}); // {themeId: 'neubrutal', mode: 'light'}
 */
export function resolveThemeSelection(input: ThemeSelectionInput): ThemeSelection {
  const hashTheme = input.hash ? THEME_HASH.exec(input.hash)?.[1] : undefined;
  const themeCandidates = [input.themeVariable, hashTheme, input.lessonTheme];
  const themeId = themeCandidates.find(candidate => candidate !== undefined && getThemeById(candidate) !== undefined);
  const resolvedId = themeId ?? DEFAULT_THEME_ID;

  const hashMode = input.hash ? MODE_HASH.exec(input.hash)?.[1] : undefined;
  const modeCandidates = [input.modeVariable, hashMode, input.lessonMode];
  const mode = modeCandidates.find(isMode) ?? resolveTheme(resolvedId).defaultMode;

  return {themeId: resolvedId, mode};
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
