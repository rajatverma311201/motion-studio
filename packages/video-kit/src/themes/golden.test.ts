import {describe, expect, it} from 'vitest';
import {boxStyle, radius} from '../theme/box-style';
import {withAlpha} from './color-utils';
import golden from './golden/neubrutal-dark.json';
import {neubrutalTheme} from './neubrutal';
import {setActiveTheme} from './active-theme';
import {DEFAULT_THEME_ID} from './registry';
import type {ThemeColors} from './theme-types';

describe('golden neubrutal dark', () => {
  it('keeps every pre-existing colour', () => {
    setActiveTheme(DEFAULT_THEME_ID);
    const colors = neubrutalTheme.variants.dark.colors as unknown as Record<string, string>;
    for (const [key, value] of Object.entries(golden.colors)) {
      if (key === 'dark') expect(colors.onAccent).toBe(value);
      else if (key === 'clear') expect(withAlpha(colors.ink, 0)).toBe(value);
      else expect(colors[key], key).toBe(value);
    }
  });

  it('adds the four new colour keys', () => {
    const colors: ThemeColors = neubrutalTheme.variants.dark.colors;
    expect(colors.onAccent).toBe(golden.newColors.onAccent);
    expect(colors.border).toBe(golden.newColors.border);
    expect(colors.brand).toBe(golden.newColors.brand);
    expect(colors.onBrand).toBe(golden.newColors.onBrand);
  });

  it('keeps the font stacks and stylesheet', () => {
    expect(neubrutalTheme.fonts.sans).toBe(golden.fonts.sans);
    expect(neubrutalTheme.fonts.mono).toBe(golden.fonts.mono);
    expect(neubrutalTheme.fonts.stylesheet).toBe(golden.fonts.stylesheet);
    expect(neubrutalTheme.fonts.display).toBe(golden.fonts.sans);
  });

  it('keeps the HUD numbers', () => {
    expect(neubrutalTheme.variants.dark.hud).toEqual(golden.hud);
  });

  it('keeps the shape numbers', () => {
    expect(neubrutalTheme.variants.dark.shape).toEqual({
      radiusScale: golden.shape.radiusScale,
      borderWidthScale: golden.shape.borderWidthScale,
      elevation: golden.shape.elevation,
      elevationScale: golden.shape.elevationScale,
    });
  });

  it('keeps the helper defaults', () => {
    setActiveTheme(DEFAULT_THEME_ID);
    const props = boxStyle('#FFFFFF');
    expect(props.lineWidth).toBe(golden.shape.defaultBorderWidth);
    expect(props.shadowOffset).toEqual([golden.shape.defaultShadowOffset, golden.shape.defaultShadowOffset]);
    expect(radius(20)).toBe(20);
    expect(radius(999)).toBe(999);
  });
});
