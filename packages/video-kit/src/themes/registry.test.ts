import {describe, expect, it} from 'vitest';
import {contrastRatio, parseColor} from './color-utils';
import {themeIds, themes} from './registry';
import type {AccentSlot, ThemeMode} from './theme-types';

const ACCENTS: AccentSlot[] = ['lime', 'pink', 'cyan', 'yellow', 'violet', 'orange', 'red'];
const MODES: ThemeMode[] = ['dark', 'light'];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** WCAG relative luminance, used to check that a variant is really dark or light. */
function relativeLuminance(color: string): number {
  const {r, g, b} = parseColor(color);
  const linear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

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

        expect(contrastRatio(colors.onBrand, colors.brand), 'onBrand on brand').toBeGreaterThanOrEqual(4.5);

        const red = parseColor(colors.red);
        expect(red.r, 'red has more red than green').toBeGreaterThan(red.g);
        expect(red.r, 'red has more red than blue').toBeGreaterThan(red.b);
        const lime = parseColor(colors.lime);
        expect(lime.g, 'lime has more green than red').toBeGreaterThan(lime.r);
        expect(lime.g, 'lime has more green than blue').toBeGreaterThan(lime.b);

        const bgLuminance = relativeLuminance(colors.bg);
        const inkLuminance = relativeLuminance(colors.ink);
        if (mode === 'dark') {
          expect(bgLuminance, 'dark bg is dark').toBeLessThan(0.2);
          expect(inkLuminance, 'dark ink is lighter than bg').toBeGreaterThan(bgLuminance);
        } else {
          expect(bgLuminance, 'light bg is light').toBeGreaterThan(0.5);
          expect(inkLuminance, 'light ink is darker than bg').toBeLessThan(bgLuminance);
        }

        expect(theme.fonts.mono).toMatch(/monospace/i);
        expect(theme.fonts.stylesheet.startsWith('https://fonts.googleapis.com/')).toBe(true);
      });
    }
  }
});
