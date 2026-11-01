import {describe, expect, it} from 'vitest';
import {formatPlayerTime} from './player-time';

describe('formatPlayerTime', () => {
  it('formats frames as minutes and seconds', () => {
    expect(formatPlayerTime(0, 60)).toBe('0:00');
    expect(formatPlayerTime(59, 60)).toBe('0:00');
    expect(formatPlayerTime(60, 60)).toBe('0:01');
    expect(formatPlayerTime(65 * 60, 60)).toBe('1:05');
    expect(formatPlayerTime(90, 30)).toBe('0:03');
  });

  it('falls back to 60 fps for a missing rate', () => {
    expect(formatPlayerTime(60, 0)).toBe('0:01');
    expect(formatPlayerTime(-20, 60)).toBe('0:00');
  });
});
