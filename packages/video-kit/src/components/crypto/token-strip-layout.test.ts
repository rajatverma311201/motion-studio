import {describe, expect, it} from 'vitest';
import {JWT_HEADER, JWT_PAYLOAD, JWT_SIGNATURE, JWT_TOKEN} from '../../jwt';
import {layoutToken} from './token-strip-layout';

describe('layoutToken', () => {
  it('wraps the 187-character token into five lines of at most 38', () => {
    const lines = layoutToken(JWT_TOKEN, 38);
    expect(lines).toHaveLength(5);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(38);
      expect(line.runs.reduce((sum, run) => sum + run.text.length, 0)).toBe(line.length);
    }
    expect(lines.reduce((sum, line) => sum + line.length, 0)).toBe(187);
  });

  it('covers every character once, in order', () => {
    const lines = layoutToken(JWT_TOKEN, 38);
    const rebuilt = lines.map(line => line.runs.map(run => run.text).join('')).join('');
    expect(rebuilt).toBe(JWT_TOKEN);
  });

  it('follows the part boundaries and keeps each dot separate', () => {
    const lines = layoutToken(JWT_TOKEN, 38);
    const runs = lines.flatMap(line => line.runs);

    expect(runs[0]).toEqual({text: JWT_HEADER, part: 'header', column: 0});
    expect(runs[1]).toEqual({text: '.', part: 'dot', column: JWT_HEADER.length});
    expect(
      runs
        .filter(run => run.part === 'payload')
        .map(run => run.text)
        .join(''),
    ).toBe(JWT_PAYLOAD);
    expect(
      runs
        .filter(run => run.part === 'signature')
        .map(run => run.text)
        .join(''),
    ).toBe(JWT_SIGNATURE);
    expect(runs.filter(run => run.part === 'dot')).toHaveLength(2);
  });

  it('starts a new line at the wrap width', () => {
    const lines = layoutToken(JWT_TOKEN, 38);
    expect(lines[0].length).toBe(38);
    expect(lines[4].length).toBe(187 - 4 * 38);
  });

  it('returns no lines for an empty token', () => {
    expect(layoutToken('', 38)).toEqual([]);
  });

  it('rejects a bad wrap width', () => {
    expect(() => layoutToken(JWT_TOKEN, 0)).toThrow(/positive whole charsPerLine/);
    expect(() => layoutToken(JWT_TOKEN, 1.5)).toThrow(/positive whole charsPerLine/);
  });
});
