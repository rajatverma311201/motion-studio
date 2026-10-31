import {describe, expect, it} from 'vitest';
import {buildPlayerVariables} from './player-variables';

describe('buildPlayerVariables', () => {
  it('keeps the old attribute when no look is given', () => {
    expect(buildPlayerVariables({startSection: 0})).toBe('{"startSection":0}');
  });

  it('adds the theme and mode after startSection', () => {
    expect(buildPlayerVariables({startSection: 2, theme: 'tokyo-night', mode: 'light'})).toBe(
      '{"startSection":2,"theme":"tokyo-night","mode":"light"}',
    );
  });

  it('adds only the fields that are present', () => {
    expect(buildPlayerVariables({startSection: 5, theme: 'blueprint'})).toBe('{"startSection":5,"theme":"blueprint"}');
    expect(buildPlayerVariables({startSection: 1, mode: 'dark'})).toBe('{"startSection":1,"mode":"dark"}');
  });

  it('produces valid JSON', () => {
    expect(JSON.parse(buildPlayerVariables({startSection: 3, theme: 'shadcn', mode: 'dark'}))).toEqual({
      startSection: 3,
      theme: 'shadcn',
      mode: 'dark',
    });
  });
});
