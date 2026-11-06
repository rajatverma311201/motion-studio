import {describe, expect, it} from 'vitest';
import {beatId, parseBeatId, slideName} from './beat-ids';

describe('beatId', () => {
  it('is 1-based and zero-padded', () => {
    expect(beatId(1, 1)).toBe('01-01');
    expect(beatId(3, 2)).toBe('03-02');
    expect(beatId(10, 12)).toBe('10-12');
  });

  it('keeps numbers above 99 at full width', () => {
    expect(beatId(100, 3)).toBe('100-03');
  });
});

describe('parseBeatId', () => {
  it('reads the chapter and beat back', () => {
    expect(parseBeatId('01-01')).toEqual({chapter: 1, beat: 1});
    expect(parseBeatId('12-34')).toEqual({chapter: 12, beat: 34});
  });

  it('rejects anything else', () => {
    expect(parseBeatId('1-2')).toBeNull();
    expect(parseBeatId('../clip')).toBeNull();
    expect(parseBeatId('01-01.webm')).toBeNull();
  });
});

describe('slideName', () => {
  it('prefixes the padded beat id and the middle dot', () => {
    expect(slideName(3, 2, 'A transaction is all or nothing')).toBe('03-02 · A transaction is all or nothing');
  });

  it('trims the caption to 48 characters', () => {
    const name = slideName(1, 1, 'x'.repeat(60));
    expect(name).toBe(`01-01 · ${'x'.repeat(48)}`);
  });

  it('drops trailing punctuation left by the trim', () => {
    expect(slideName(1, 1, `${'x'.repeat(47)}. more text`)).toBe(`01-01 · ${'x'.repeat(47)}`);
    expect(slideName(1, 1, 'Wait for it...')).toBe('01-01 · Wait for it');
  });

  it('keeps punctuation inside the caption', () => {
    expect(slideName(1, 1, 'ACID: atomic, consistent, isolated, durable.')).toBe(
      '01-01 · ACID: atomic, consistent, isolated, durable',
    );
  });

  it('collapses whitespace and control characters', () => {
    expect(slideName(1, 1, '  one\n two\tthree  ')).toBe('01-01 · one two three');
  });

  it('gives identical captions different names in different beats', () => {
    expect(slideName(1, 1, 'Same caption')).not.toBe(slideName(1, 2, 'Same caption'));
    expect(slideName(1, 1, 'Same caption')).not.toBe(slideName(2, 1, 'Same caption'));
  });
});
