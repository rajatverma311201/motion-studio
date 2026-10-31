import {describe, expect, it, vi} from 'vitest';

vi.mock('@/lib/source', () => ({
  source: {getPages: () => [], getPageTree: () => ({children: []})},
}));

import {courseName, lookLabel, statusCounts} from './lessons';

describe('courseName', () => {
  it('turns a course slug into a display name', () => {
    expect(courseName('databases')).toBe('Databases');
    expect(courseName('distributed-systems')).toBe('Distributed Systems');
  });

  it('falls back when the page has no course folder', () => {
    expect(courseName(undefined)).toBe('Lessons');
  });
});

describe('lookLabel', () => {
  it('joins the theme name and mode', () => {
    expect(lookLabel({theme: 'tokyo-night', themeName: 'Tokyo Night', mode: 'light'})).toBe('Tokyo Night · Light');
    expect(lookLabel({theme: 'neubrutal', themeName: 'Neubrutal', mode: 'dark'})).toBe('Neubrutal · Dark');
  });

  it('returns an empty label without studio data', () => {
    expect(lookLabel(undefined)).toBe('');
  });
});

describe('statusCounts', () => {
  it('counts every status and defaults missing ones to zero', () => {
    expect(
      statusCounts([{status: 'published'}, {status: 'published'}, {status: 'outline'}, {status: 'voiced'}]),
    ).toEqual({outline: 1, animated: 0, rendered: 0, voiced: 1, published: 2});
  });

  it('handles an empty list', () => {
    expect(statusCounts([])).toEqual({outline: 0, animated: 0, rendered: 0, voiced: 0, published: 0});
  });
});
