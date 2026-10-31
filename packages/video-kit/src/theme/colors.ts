import {getTheme} from '../themes/active-theme';
import {withAlpha} from '../themes/color-utils';
import type {ThemeColors} from '../themes/theme-types';

/**
 * The active theme's palette. A Proxy so every `colors.x` read happens at call
 * time; a plain object would freeze the first theme forever.
 */
export const colors: ThemeColors & {clear: string} = new Proxy({} as ThemeColors & {clear: string}, {
  get: (_target, key) => {
    if (typeof key !== 'string') return undefined;
    const theme = getTheme();
    return key === 'clear' ? withAlpha(theme.colors.ink, 0) : theme.colors[key as keyof ThemeColors];
  },
});

/** Every colour key the kit and scenes may reference. */
export type ColorName = keyof (ThemeColors & {clear: string});
