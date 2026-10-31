import {describe, expect, it} from 'vitest';
import {chaptersSnippet, configSnippet, listLooks, parseLookSearch, renderCommand, stepLook, type Look} from './looks';
import type {ThemeEntry, ThemesJson} from './themes';

function theme(id: string, defaultMode: 'dark' | 'light'): ThemeEntry {
  const variant = {
    colors: {bg: '#000000', surf: '#111111', ink: '#FFFFFF', brand: '#C6FF3D', lime: '#C6FF3D'},
    shape: {radiusScale: 1, borderWidthScale: 1, elevation: 'hard' as const},
    hud: {captionStyle: 'bar' as const, titleStyle: 'slab' as const, gridVisible: true},
  };

  return {
    id,
    name: id,
    family: 'test',
    description: `${id} theme`,
    defaultMode,
    fonts: {sans: 'Sans', mono: 'Mono', display: 'Display'},
    variants: {dark: variant, light: variant},
  };
}

const data: ThemesJson = {
  defaultThemeId: 'neubrutal',
  themes: [theme('neubrutal', 'dark'), theme('paper-editorial', 'light')],
};

const looks = listLooks(data);

describe('listLooks', () => {
  it('lists dark then light per theme in file order', () => {
    expect(looks).toEqual([
      {themeId: 'neubrutal', mode: 'dark'},
      {themeId: 'neubrutal', mode: 'light'},
      {themeId: 'paper-editorial', mode: 'dark'},
      {themeId: 'paper-editorial', mode: 'light'},
    ]);
  });

  it('returns two looks per theme', () => {
    expect(looks).toHaveLength(data.themes.length * 2);
  });
});

describe('parseLookSearch', () => {
  it('uses the default theme and its default mode when search is empty', () => {
    expect(parseLookSearch({}, data)).toEqual({themeId: 'neubrutal', mode: 'dark', section: 0});
  });

  it('falls back to the default theme for an unknown id', () => {
    expect(parseLookSearch({theme: 'nope'}, data)).toEqual({themeId: 'neubrutal', mode: 'dark', section: 0});
    expect(parseLookSearch({theme: 'nope', mode: 'light'}, data)).toEqual({
      themeId: 'neubrutal',
      mode: 'light',
      section: 0,
    });
  });

  it('uses the theme default mode for a missing or invalid mode', () => {
    expect(parseLookSearch({theme: 'paper-editorial'}, data)).toEqual({
      themeId: 'paper-editorial',
      mode: 'light',
      section: 0,
    });
    expect(parseLookSearch({theme: 'paper-editorial', mode: 'sepia'}, data)).toEqual({
      themeId: 'paper-editorial',
      mode: 'light',
      section: 0,
    });
  });

  it('keeps a valid theme and mode', () => {
    expect(parseLookSearch({theme: 'paper-editorial', mode: 'dark'}, data)).toEqual({
      themeId: 'paper-editorial',
      mode: 'dark',
      section: 0,
    });
  });

  it('parses the section and clamps it to 0..5', () => {
    expect(parseLookSearch({s: '2'}, data).section).toBe(2);
    expect(parseLookSearch({s: 5}, data).section).toBe(5);
    expect(parseLookSearch({s: 9}, data).section).toBe(5);
    expect(parseLookSearch({s: -2}, data).section).toBe(0);
  });

  it('defaults an invalid section to 0', () => {
    expect(parseLookSearch({s: 'nope'}, data).section).toBe(0);
    expect(parseLookSearch({s: '2.5'}, data).section).toBe(0);
    expect(parseLookSearch({s: ''}, data).section).toBe(0);
    expect(parseLookSearch({}, data).section).toBe(0);
  });
});

describe('stepLook', () => {
  it('moves forward and backward', () => {
    expect(stepLook(looks, looks[1], 1)).toEqual(looks[2]);
    expect(stepLook(looks, looks[2], -1)).toEqual(looks[1]);
  });

  it('wraps around at both ends', () => {
    expect(stepLook(looks, looks.at(-1) as Look, 1)).toEqual(looks[0]);
    expect(stepLook(looks, looks[0], -1)).toEqual(looks.at(-1));
  });

  it('does not change an empty list', () => {
    expect(stepLook([], looks[0], 1)).toEqual(looks[0]);
  });
});

describe('snippets', () => {
  const look: Look = {themeId: 'tokyo-night', mode: 'light'};

  it('renders the studio command', () => {
    expect(renderCommand(look)).toBe('pnpm studio --theme tokyo-night --mode light');
  });

  it('renders the chapters.json lines', () => {
    expect(chaptersSnippet(look)).toBe('"theme": "tokyo-night",\n"mode": "light"');
  });

  it('renders a full video.config.json body', () => {
    expect(configSnippet(look)).toBe(
      ['{', '  "$schema": "./video.config.schema.json",', '  "theme": "tokyo-night",', '  "mode": "light"', '}'].join(
        '\n',
      ),
    );
  });
});
