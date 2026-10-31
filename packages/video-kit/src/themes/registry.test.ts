import {describe, expect, it} from 'vitest';
import {contrastRatio} from './color-utils';
import {themeIds, themes} from './registry';
import type {AccentSlot, ThemeMode} from './theme-types';

const ACCENTS: AccentSlot[] = ['lime', 'pink', 'cyan', 'yellow', 'violet', 'orange', 'red'];
const MODES: ThemeMode[] = ['dark', 'light'];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('theme registry', () => {
  for (const id of themeIds) {
    const theme = themes[id];
    for (const mode of MODES) {
      it(`${theme.id} / ${mode} passes the look contract`, () => {
        expect(theme.id).toBe(id);
        expect(theme.id).toMatch(KEBAB);

        expect(theme.variants.dark).toBeDefined();
        expect(theme.variants.light).toBeDefined();
        expect(['dark', 'light']).toContain(theme.defaultMode);
        expect(theme.variants[theme.defaultMode]).toBeDefined();

        const {colors} = theme.variants[mode];
        for (const [key, value] of Object.entries(colors)) {
          expect(typeof value, key).toBe('string');
          expect(value.length, key).toBeGreaterThan(0);
        }

        expect(contrastRatio(colors.ink, colors.bg)).toBeGreaterThanOrEqual(7);
        expect(contrastRatio(colors.mute, colors.bg)).toBeGreaterThanOrEqual(3.5);

        for (const accent of ACCENTS) {
          expect(contrastRatio(colors.onAccent, colors[accent]), `${accent} onAccent`).toBeGreaterThanOrEqual(3);
          expect(contrastRatio(colors[accent], colors.bg), `${accent} on bg`).toBeGreaterThanOrEqual(3);
        }

        expect(theme.fonts.mono).toMatch(/monospace/i);
        expect(theme.fonts.stylesheet.startsWith('https://fonts.googleapis.com/')).toBe(true);
      });
    }
  }
});
