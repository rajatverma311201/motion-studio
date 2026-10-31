import {afterEach, beforeAll, describe, expect, it} from 'vitest';
import {getTheme, resolveThemeSelection, setActiveTheme} from './active-theme';
import {neubrutalTheme} from './neubrutal';
import {DEFAULT_THEME_ID, registerTheme} from './registry';

const ALT = 'alt-theme';
const LIGHT = 'light-default-theme';

beforeAll(() => {
  registerTheme({...neubrutalTheme, id: ALT, name: 'Alt'});
  registerTheme({...neubrutalTheme, id: LIGHT, name: 'Light default', defaultMode: 'light'});
});

afterEach(() => setActiveTheme(DEFAULT_THEME_ID));

describe('setActiveTheme', () => {
  it('defaults to the theme defaultMode', () => {
    setActiveTheme('neubrutal');
    expect(getTheme().mode).toBe('dark');
  });

  it('switches the variant when a mode is passed', () => {
    setActiveTheme('neubrutal', 'light');
    expect(getTheme().mode).toBe('light');
    expect(getTheme().colors.bg).not.toBe(neubrutalTheme.variants.dark.colors.bg);
  });

  it('falls back to the default theme for an unknown id', () => {
    setActiveTheme('does-not-exist');
    expect(getTheme().id).toBe(DEFAULT_THEME_ID);
  });
});

describe('resolveThemeSelection', () => {
  it('prefers the player variable over the hash and chapters.json', () => {
    const selection = resolveThemeSelection({
      themeVariable: ALT,
      modeVariable: 'light',
      hash: '#theme=neubrutal&mode=dark',
      lessonTheme: 'neubrutal',
      lessonMode: 'dark',
    });
    expect(selection).toEqual({themeId: ALT, mode: 'light'});
  });

  it('reads the theme and mode from a hash with a section number', () => {
    const selection = resolveThemeSelection({hash: '#s=3&theme=alt-theme&mode=light'});
    expect(selection).toEqual({themeId: ALT, mode: 'light'});
  });

  it('skips an unknown variable and uses the hash', () => {
    const selection = resolveThemeSelection({themeVariable: 'unknown', hash: '#theme=alt-theme'});
    expect(selection.themeId).toBe(ALT);
  });

  it('skips unknown hash ids without throwing', () => {
    const selection = resolveThemeSelection({hash: '#theme=nope&mode=sepia'});
    expect(selection).toEqual({themeId: DEFAULT_THEME_ID, mode: 'dark'});
  });

  it('uses chapters.json when the variable and hash are absent', () => {
    const selection = resolveThemeSelection({lessonTheme: ALT, lessonMode: 'light'});
    expect(selection).toEqual({themeId: ALT, mode: 'light'});
  });

  it("defaults the mode to the chosen theme's defaultMode", () => {
    expect(resolveThemeSelection({lessonTheme: LIGHT})).toEqual({themeId: LIGHT, mode: 'light'});
  });

  it('falls back to the default theme and its mode', () => {
    expect(resolveThemeSelection({})).toEqual({themeId: DEFAULT_THEME_ID, mode: 'dark'});
  });
});
