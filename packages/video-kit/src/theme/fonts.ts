import {getTheme} from '../themes/active-theme';
import type {ThemeFonts} from '../themes/theme-types';

/** The active theme's font stacks, read at call time. */
export const fonts: ThemeFonts = new Proxy({} as ThemeFonts, {
  get: (_target, key) => {
    if (typeof key !== 'string') return undefined;
    return getTheme().fonts[key as keyof ThemeFonts];
  },
});

/**
 * Inject the active theme's Google Fonts stylesheet once per theme id.
 * Safe to call in Node (no DOM).
 *
 * @example
 * loadFonts();
 */
export function loadFonts(): void {
  if (typeof document === 'undefined') return;
  const theme = getTheme();
  const id = `video-kit-fonts-${theme.id}`;
  if (document.getElementById(id)) return;
  try {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = theme.fonts.stylesheet;
    document.head.appendChild(link);
  } catch {
    /* offline or no DOM */
  }
}
