import {describe, expect, it, vi} from 'vitest';

vi.mock('@/lib/source', () => ({
  source: {getPages: () => []},
}));

import {filterPublished, sortLessons} from './lessons';

interface TestPage {
  data: {
    title: string;
    video?: string;
    status?: 'draft' | 'published';
  };
}

function page(title: string, video?: string, status?: 'draft' | 'published'): TestPage {
  return {data: {title, video, status}};
}

describe('filterPublished', () => {
  it('keeps published pages that have a video', () => {
    const pages = [
      page('Published', 'db-published', 'published'),
      page('Draft', 'db-draft', 'draft'),
      page('No video', undefined, 'published'),
      page('Draft without video', undefined, 'draft'),
    ];

    expect(filterPublished(pages).map(item => item.data.title)).toEqual(['Published']);
  });

  it('treats a missing status as published', () => {
    expect(filterPublished([page('Default', 'db-default')]).map(item => item.data.title)).toEqual(['Default']);
  });

  it('returns a new array and leaves the input untouched', () => {
    const pages = [page('Published', 'db-published', 'published')];
    const filtered = filterPublished(pages);

    expect(filtered).not.toBe(pages);
    expect(pages).toHaveLength(1);
  });
});

describe('sortLessons', () => {
  it('sorts by title without mutating the input', () => {
    const pages = [page('Zeta'), page('alpha'), page('Beta')];
    const sorted = sortLessons(pages);

    expect(sorted.map(item => item.data.title)).toEqual(['alpha', 'Beta', 'Zeta']);
    expect(pages.map(item => item.data.title)).toEqual(['Zeta', 'alpha', 'Beta']);
  });

  it('handles an empty list', () => {
    expect(sortLessons([])).toEqual([]);
  });
});
