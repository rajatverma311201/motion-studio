import {afterEach, describe, expect, it, vi} from 'vitest';
import {effectivePauseMode, resolvePauseMode, resolveVoiceMode} from './voice-settings';

afterEach(() => vi.restoreAllMocks());

describe('resolvePauseMode', () => {
  it('defaults to beat', () => {
    expect(resolvePauseMode()).toBe('beat');
  });

  it('prefers the cli flag over the variable and the fallback', () => {
    expect(resolvePauseMode({cli: 'chapter', variable: 'off', fallback: 'off'})).toBe('chapter');
  });

  it('prefers the variable over the fallback', () => {
    expect(resolvePauseMode({variable: 'off', fallback: 'chapter'})).toBe('off');
  });

  it('uses an explicit fallback when no source is set', () => {
    expect(resolvePauseMode({fallback: 'chapter'})).toBe('chapter');
  });

  it('ignores empty build constants', () => {
    expect(resolvePauseMode({cli: '', variable: ''})).toBe('beat');
  });

  it('warns about an unknown cli value and falls through to the variable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(resolvePauseMode({cli: 'sometimes', variable: 'chapter'})).toBe('chapter');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"sometimes"'));
  });

  it('warns about an unknown variable value and falls back to the default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(resolvePauseMode({variable: 'never'})).toBe('beat');
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('resolveVoiceMode', () => {
  it('plays when the lesson has clips and nothing else is set', () => {
    expect(resolveVoiceMode({hasClips: true})).toBe('play');
  });

  it('stays off without clips', () => {
    expect(resolveVoiceMode({hasClips: false})).toBe('off');
    expect(resolveVoiceMode()).toBe('off');
  });

  it('prefers the cli flag over the variable and the clip default', () => {
    expect(resolveVoiceMode({cli: 'record', variable: 'off', hasClips: true})).toBe('record');
  });

  it('prefers the variable over the clip default', () => {
    expect(resolveVoiceMode({variable: 'off', hasClips: true})).toBe('off');
  });

  it('honours an explicit fallback', () => {
    expect(resolveVoiceMode({fallback: 'record', hasClips: true})).toBe('record');
  });

  it('warns about an unknown value and falls back to the clip default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(resolveVoiceMode({cli: 'loud', hasClips: true})).toBe('play');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"loud"'));
  });
});

describe('effectivePauseMode', () => {
  it('keeps the pause mode outside record mode', () => {
    expect(effectivePauseMode('chapter', 'play')).toBe('chapter');
    expect(effectivePauseMode('off', 'off')).toBe('off');
  });

  it('forces beat in record mode without warning when it already is beat', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(effectivePauseMode('beat', 'record')).toBe('beat');
    expect(warn).not.toHaveBeenCalled();
  });

  it('forces beat in record mode and warns about another request', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(effectivePauseMode('chapter', 'record')).toBe('beat');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('forces pause "beat"'));
  });
});
