import {describe, expect, it} from 'vitest';
import {buildYoutubeDescription, titleCaseChapter} from './youtube-description';

describe('titleCaseChapter', () => {
  it('converts HUD names to title case', () => {
    expect(titleCaseChapter('FULL TABLE SCAN')).toBe('Full Table Scan');
    expect(titleCaseChapter('EXPLAIN AND GOTCHAS')).toBe('Explain and Gotchas');
    expect(titleCaseChapter('B+TREE VS B+TREE')).toBe('B+tree vs B+tree');
    expect(titleCaseChapter('BEGIN · COMMIT · ROLLBACK')).toBe('Begin · Commit · Rollback');
  });
});

describe('buildYoutubeDescription', () => {
  it('builds points, chapters and the trailing link line', () => {
    const text = buildYoutubeDescription({
      description: 'How databases find one row.',
      summaryPoints: ['Why a scan is slow.', 'How a B+tree finds a row.'],
      chapters: [
        {name: 'INTRO', at: '0:00'},
        {name: 'FULL TABLE SCAN', at: '1:12'},
      ],
    });

    expect(text).toBe(
      [
        'How databases find one row.',
        '',
        'In this video:',
        '- Why a scan is slow.',
        '- How a B+tree finds a row.',
        '',
        'Chapters:',
        '0:00 Intro',
        '1:12 Full Table Scan',
        '',
        '',
      ].join('\n'),
    );
  });

  it('uses --:-- for a missing timestamp', () => {
    const text = buildYoutubeDescription({
      description: 'Description.',
      summaryPoints: ['One.', 'Two.', 'Three.'],
      chapters: [{name: 'INTRO'}],
    });

    expect(text).toContain('Chapters:\n--:-- Intro');
  });

  it('leaves a visible TODO when summary points are missing', () => {
    expect(buildYoutubeDescription({description: 'Description.', chapters: []})).toContain(
      'In this video:\n- TODO: add summary points',
    );
  });
});
