import {describe, expect, it} from 'vitest';
import {readManifest, readTimingJson, TimingTable} from './timing';

describe('TimingTable', () => {
  it('keeps the first entry for a replayed beat', () => {
    const table = new TimingTable();
    table.add({id: '01-01', name: 'first', start: 1});
    table.add({id: '01-01', name: 'replay', start: 9});

    expect(table.size).toBe(1);
    expect(table.toJson('demo', 60, 20).beats).toEqual([{id: '01-01', name: 'first', start: 1}]);
  });

  it('serializes beats ordered by start time', () => {
    const table = new TimingTable();
    table.add({id: '01-02', name: 'second', start: 8});
    table.add({id: '01-01', name: 'first', start: 2});

    expect(table.toJson('demo', 60, 12)).toEqual({
      slug: 'demo',
      fps: 60,
      totalSeconds: 12,
      beats: [
        {id: '01-01', name: 'first', start: 2},
        {id: '01-02', name: 'second', start: 8},
      ],
    });
  });

  it('returns copies so a caller cannot mutate the table', () => {
    const table = new TimingTable();
    const beat = {id: '01-01', name: 'first', start: 1};
    table.add(beat);
    beat.name = 'changed';

    expect(table.toJson('demo', 60, 5).beats[0].name).toBe('first');
  });
});

describe('readManifest', () => {
  const clip = {file: '01-01.webm', seconds: 4.2, slideName: '01-01 · Intro', recordedAt: '2026-01-01T00:00:00Z'};

  it('accepts the manifest shape', () => {
    expect(readManifest({slug: 'demo', version: 1, clips: {'01-01': clip}})).toEqual({
      slug: 'demo',
      version: 1,
      clips: {'01-01': clip},
    });
  });

  it('accepts an empty clip list', () => {
    expect(readManifest({slug: 'demo', version: 1, clips: {}})).toEqual({slug: 'demo', version: 1, clips: {}});
  });

  it('rejects a wrong version, a missing slug and a broken clip', () => {
    expect(readManifest({slug: 'demo', version: 2, clips: {}})).toBeNull();
    expect(readManifest({version: 1, clips: {}})).toBeNull();
    expect(readManifest({slug: 'demo', version: 1, clips: {'01-01': {...clip, seconds: 'long'}}})).toBeNull();
    expect(readManifest({slug: 'demo', version: 1, clips: {'01-01': {...clip, file: undefined}}})).toBeNull();
    expect(readManifest(null)).toBeNull();
  });
});

describe('readTimingJson', () => {
  it('accepts a timing table', () => {
    const timing = {
      slug: 'demo',
      fps: 60,
      totalSeconds: 12,
      beats: [{id: '01-01', name: '01-01 · Intro', start: 0}],
    };
    expect(readTimingJson(timing)).toEqual(timing);
  });

  it('rejects a beat id that is not CC-BB', () => {
    expect(
      readTimingJson({slug: 'demo', fps: 60, totalSeconds: 12, beats: [{id: '1-1', name: 'x', start: 0}]}),
    ).toBeNull();
  });

  it('rejects negative and non-finite numbers', () => {
    expect(readTimingJson({slug: 'demo', fps: 0, totalSeconds: 12, beats: []})).toBeNull();
    expect(readTimingJson({slug: 'demo', fps: 60, totalSeconds: -1, beats: []})).toBeNull();
    expect(
      readTimingJson({slug: 'demo', fps: 60, totalSeconds: 12, beats: [{id: '01-01', name: 'x', start: -2}]}),
    ).toBeNull();
  });

  it('rejects anything that is not an object', () => {
    expect(readTimingJson('nope')).toBeNull();
    expect(readTimingJson([])).toBeNull();
  });
});
