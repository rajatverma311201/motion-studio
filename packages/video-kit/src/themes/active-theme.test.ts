import {afterEach, beforeAll, describe, expect, it} from 'vitest';
import {getTheme, parseLookHash, resolveThemeSelection, setActiveTheme} from './active-theme';
import {neubrutalTheme} from './neubrutal';
import {DEFAULT_THEME_ID, registerTheme} from './registry';

const ALT = 'alt-theme';
const LIGHT = 'light-default-theme';
const LOW = 'low-config-theme';

beforeAll(() => {
  registerTheme({...neubrutalTheme, id: ALT, name: 'Alt'});
  registerTheme({...neubrutalTheme, id: LIGHT, name: 'Light default', defaultMode: 'light'});
  registerTheme({...neubrutalTheme, id: LOW, name: 'Low config'});
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

describe('parseLookHash', () => {
  it('reads the theme and mode next to a section number', () => {
    expect(parseLookHash('#s=3&theme=tokyo-night&mode=light')).toEqual({theme: 'tokyo-night', mode: 'light'});
  });

  it('reads a hash that starts with the theme', () => {
    expect(parseLookHash('#theme=shadcn&mode=dark')).toEqual({theme: 'shadcn', mode: 'dark'});
  });

  it('leaves absent values undefined', () => {
    expect(parseLookHash('#s=3')).toEqual({theme: undefined, mode: undefined});
    expect(parseLookHash(undefined)).toEqual({});
  });
});

describe('resolveThemeSelection', () => {
  it('prefers the hash over every lower layer', () => {
    const selection = resolveThemeSelection({
      hashTheme: ALT,
      hashMode: 'light',
      cliTheme: 'neubrutal',
      cliMode: 'dark',
      variableTheme: 'neubrutal',
      variableMode: 'dark',
      lessonTheme: 'neubrutal',
      lessonMode: 'dark',
      configTheme: 'neubrutal',
      configMode: 'dark',
    });
    expect(selection).toEqual({themeId: ALT, mode: 'light', source: {theme: 'hash', mode: 'hash'}});
  });

  it('prefers the cli flag over the variable, lesson and config', () => {
    const selection = resolveThemeSelection({
      cliTheme: ALT,
      cliMode: 'light',
      variableTheme: 'neubrutal',
      variableMode: 'dark',
      lessonTheme: 'neubrutal',
      lessonMode: 'dark',
      configTheme: 'neubrutal',
      configMode: 'dark',
    });
    expect(selection).toEqual({themeId: ALT, mode: 'light', source: {theme: 'cli', mode: 'cli'}});
  });

  it('prefers the player variable over the lesson and config', () => {
    const selection = resolveThemeSelection({
      variableTheme: ALT,
      variableMode: 'light',
      lessonTheme: 'neubrutal',
      lessonMode: 'dark',
      configTheme: 'neubrutal',
      configMode: 'dark',
    });
    expect(selection).toEqual({themeId: ALT, mode: 'light', source: {theme: 'variable', mode: 'variable'}});
  });

  it('prefers chapters.json over the config file', () => {
    const selection = resolveThemeSelection({
      lessonTheme: ALT,
      lessonMode: 'light',
      configTheme: 'neubrutal',
      configMode: 'dark',
    });
    expect(selection).toEqual({themeId: ALT, mode: 'light', source: {theme: 'lesson', mode: 'lesson'}});
  });

  it('uses the config file when nothing above sets a value', () => {
    const selection = resolveThemeSelection({configTheme: LOW, configMode: 'light'});
    expect(selection).toEqual({themeId: LOW, mode: 'light', source: {theme: 'config', mode: 'config'}});
  });

  it('falls back to the default theme and its mode', () => {
    expect(resolveThemeSelection({})).toEqual({
      themeId: DEFAULT_THEME_ID,
      mode: 'dark',
      source: {theme: 'default', mode: 'default'},
    });
  });

  it('skips unknown ids and invalid modes without throwing', () => {
    const selection = resolveThemeSelection({
      hashTheme: 'nope',
      hashMode: 'sepia',
      cliTheme: 'also-nope',
      cliMode: 'sepia',
      variableTheme: 'unknown',
      variableMode: 'sepia',
      lessonTheme: 'still-nope',
      lessonMode: 'sepia',
      configTheme: 'nope',
      configMode: 'sepia',
    });
    expect(selection).toEqual({
      themeId: DEFAULT_THEME_ID,
      mode: 'dark',
      source: {theme: 'default', mode: 'default'},
    });
  });

  it('resolves a cli theme with no mode through lesson, then config, then defaultMode', () => {
    const fromLesson = resolveThemeSelection({
      cliTheme: ALT,
      lessonMode: 'light',
      configMode: 'dark',
    });
    expect(fromLesson).toEqual({themeId: ALT, mode: 'light', source: {theme: 'cli', mode: 'lesson'}});

    const fromConfig = resolveThemeSelection({cliTheme: ALT, configMode: 'light'});
    expect(fromConfig).toEqual({themeId: ALT, mode: 'light', source: {theme: 'cli', mode: 'config'}});

    const fromTheme = resolveThemeSelection({cliTheme: LIGHT});
    expect(fromTheme).toEqual({themeId: LIGHT, mode: 'light', source: {theme: 'cli', mode: 'default'}});
  });

  it('resolves theme and mode independently', () => {
    const selection = resolveThemeSelection({
      hashTheme: ALT,
      cliMode: 'light',
      lessonMode: 'dark',
    });
    expect(selection).toEqual({themeId: ALT, mode: 'light', source: {theme: 'hash', mode: 'cli'}});
  });

  it('ignores empty strings from the build constants', () => {
    const selection = resolveThemeSelection({cliTheme: '', cliMode: '', configTheme: '', configMode: ''});
    expect(selection.source).toEqual({theme: 'default', mode: 'default'});
  });
});
