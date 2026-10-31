import {afterEach, describe, expect, it} from 'vitest';
import {boxStyle, radius} from './box-style';
import {setActiveTheme} from '../themes/active-theme';
import {withAlpha} from '../themes/color-utils';
import {neubrutalTheme} from '../themes/neubrutal';
import {DEFAULT_THEME_ID, registerTheme} from '../themes/registry';
import {SOFT_SHADOW_DARK, SOFT_SHADOW_LIGHT} from '../themes/shadows';
import type {ElevationStyle, Theme, ThemeMode, ThemeShape} from '../themes/theme-types';

function accent(): string {
  return neubrutalTheme.variants.dark.colors.pink;
}

function stubTheme(id: string, mode: ThemeMode, shape: Partial<ThemeShape>): void {
  const base = neubrutalTheme.variants[mode];
  const theme: Theme = {
    ...neubrutalTheme,
    id,
    defaultMode: mode,
    variants: {
      dark: {...base, shape: {...base.shape, ...shape}},
      light: {...base, shape: {...base.shape, ...shape}},
    },
  };
  registerTheme(theme);
  setActiveTheme(id, mode);
}

function useElevation(id: string, elevation: ElevationStyle, overrides: Partial<ThemeShape> = {}): void {
  stubTheme(id, 'dark', {elevation, ...overrides});
}

afterEach(() => setActiveTheme(DEFAULT_THEME_ID));

describe('boxStyle', () => {
  it('keeps the hard offset shadow and border', () => {
    useElevation('test-hard', 'hard');
    const props = boxStyle(accent());
    expect(props.shadowColor).toBe(accent());
    expect(props.shadowBlur).toBe(0);
    expect(props.shadowOffset).toEqual([8, 8]);
    expect(props.stroke).toBe(neubrutalTheme.variants.dark.colors.border);
    expect(props.lineWidth).toBe(4);
  });

  it('uses a soft shadow in dark and light modes', () => {
    stubTheme('test-soft-dark', 'dark', {elevation: 'soft'});
    expect(boxStyle(accent()).shadowColor).toBe(withAlpha(SOFT_SHADOW_DARK, 0.28));
    expect(boxStyle(accent()).shadowOffset).toEqual([0, 6.4]);

    stubTheme('test-soft-light', 'light', {elevation: 'soft'});
    expect(boxStyle(accent()).shadowColor).toBe(withAlpha(SOFT_SHADOW_LIGHT, 0.16));
  });

  it('uses an accent glow', () => {
    useElevation('test-glow', 'glow');
    const props = boxStyle(accent());
    expect(props.shadowColor).toBe(accent());
    expect(props.shadowBlur).toBe(20);
    expect(props.shadowOffset).toEqual([0, 0]);
  });

  it('has no shadow for the none elevation', () => {
    useElevation('test-none', 'none');
    const props = boxStyle(accent());
    expect('shadowColor' in props).toBe(false);
    expect('shadowBlur' in props).toBe(false);
    expect('shadowOffset' in props).toBe(false);
    expect(props.stroke).toBe(neubrutalTheme.variants.dark.colors.border);
  });

  it('has no stroke for a borderless theme', () => {
    useElevation('test-borderless', 'hard', {borderWidthScale: 0});
    const props = boxStyle(accent());
    expect('stroke' in props).toBe(false);
    expect(props.lineWidth).toBe(0);
  });

  it('scales radii but leaves pills alone', () => {
    useElevation('test-radius', 'hard', {radiusScale: 2});
    expect(radius(20)).toBe(40);
    expect(radius(999)).toBe(999);
    expect(radius([20, 10, 0, 100])).toEqual([40, 20, 0, 100]);
  });
});
