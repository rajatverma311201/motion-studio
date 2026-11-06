import {describe, expect, it} from 'vitest';
import {ACTORS, CAPTIONS, MYTHS, PROBLEM_CARDS, RECAP_COLUMNS, RECAP_ROWS, SYSTEM_COLUMNS, SYSTEM_ROWS} from './story';

const CAPTION_LIMIT = 85;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('story fixtures', () => {
  it('has three actors', () => {
    expect(ACTORS.map(actor => actor.label)).toEqual(['ALICE', 'EVE', 'BANK']);
  });

  it('has the four problem cards', () => {
    expect(PROBLEM_CARDS).toHaveLength(4);
    expect(PROBLEM_CARDS.map(card => card.title)).toEqual(['FORMAT', 'SECRECY', 'INTEGRITY', 'AUTHENTICITY']);
  });

  it('has five myths', () => {
    expect(MYTHS).toHaveLength(5);
  });

  it('has a 4 by 4 recap matrix', () => {
    expect(RECAP_COLUMNS).toHaveLength(4);
    expect(RECAP_ROWS).toHaveLength(4);
    for (const row of RECAP_ROWS) expect(row.cells).toHaveLength(4);
  });

  it('has five real-system rows and an AES-GCM highlight row', () => {
    expect(SYSTEM_COLUMNS).toHaveLength(4);
    expect(SYSTEM_ROWS).toHaveLength(6);
    expect(SYSTEM_ROWS.slice(0, 5).map(row => row.label)).toEqual([
      'HTTPS',
      'JWT',
      'Passwords',
      'Software updates',
      'Disk encryption',
    ]);
    expect(SYSTEM_ROWS[SYSTEM_ROWS.length - 1].label).toBe('AES-GCM');
    for (const row of SYSTEM_ROWS) expect(row.cells).toHaveLength(4);
  });

  it('has one caption list per chapter, in order', () => {
    expect(Object.keys(CAPTIONS)).toEqual([
      'intro',
      'problem',
      'encoding',
      'hashing',
      'signing',
      'encryption',
      'key-pairs',
      'combining',
      'mix-ups',
      'recap',
    ]);
  });

  it('keeps every caption inside the landscape limit', () => {
    for (const caption of Object.values(CAPTIONS).flatMap(list => [...list])) {
      expect(caption.length).toBeGreaterThan(0);
      expect(caption.length).toBeLessThanOrEqual(CAPTION_LIMIT);
    }
  });

  it('has no empty strings in the story data', () => {
    for (const value of strings([
      ACTORS,
      PROBLEM_CARDS,
      MYTHS,
      RECAP_COLUMNS,
      RECAP_ROWS,
      SYSTEM_COLUMNS,
      SYSTEM_ROWS,
      CAPTIONS,
    ])) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});
