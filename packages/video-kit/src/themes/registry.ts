import {neubrutalTheme} from './neubrutal';
import type {Theme, ThemeMode} from './theme-types';

export const DEFAULT_THEME_ID = 'neubrutal';
export const DEFAULT_MODE: ThemeMode = 'dark';

/** Every known theme, keyed by id. Generators and tests may add more. */
export const themes: Record<string, Theme> = {
  [neubrutalTheme.id]: neubrutalTheme,
};

/** Ids in registration order. Keeping this in step with `themes` keeps tests parameterised. */
export const themeIds: string[] = [neubrutalTheme.id];

/**
 * Look up a theme. Unknown ids return `undefined` so callers can apply their own fallback.
 *
 * @example
 * getThemeById('neubrutal')?.name; // 'Neubrutal'
 */
export function getThemeById(id: string): Theme | undefined {
  return themes[id];
}

/**
 * Register a theme at runtime. Tests and the theme generator use this; lesson code should not.
 *
 * @example
 * registerTheme({...neubrutalTheme, id: 'test-theme'});
 */
export function registerTheme(theme: Theme): void {
  themes[theme.id] = theme;
  if (!themeIds.includes(theme.id)) themeIds.push(theme.id);
}
