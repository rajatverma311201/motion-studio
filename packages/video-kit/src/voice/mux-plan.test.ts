import {describe, expect, it} from 'vitest';
import {buildFfmpegArgs, planAudio, type AudioPlan} from './mux-plan';
import type {TimingJson, VoiceManifest} from './timing';

function manifest(clips: VoiceManifest['clips']): VoiceManifest {
  return {slug: 'demo', version: 1, clips};
}

function timing(beats: TimingJson['beats']): TimingJson {
  return {slug: 'demo', fps: 60, totalSeconds: 20, beats};
}

function clip(file: string, seconds: number) {
  return {file, seconds, slideName: file, recordedAt: '2026-01-01T00:00:00Z'};
}

describe('planAudio', () => {
  it('places every clip at its beat start in start order', () => {
    const plan = planAudio(
      manifest({
        '02-01': clip('02-01.webm', 3),
        '01-01': clip('01-01.webm', 2),
      }),
      timing([
        {id: '02-01', name: 'second chapter', start: 8},
        {id: '01-01', name: 'first chapter', start: 0},
      ]),
    );

    expect(plan.warnings).toEqual([]);
    expect(plan.items).toEqual([
      {id: '01-01', file: '01-01.webm', startSeconds: 0, seconds: 2},
      {id: '02-01', file: '02-01.webm', startSeconds: 8, seconds: 3},
    ]);
  });

  it('skips beats without a clip without warning', () => {
    const plan = planAudio(
      manifest({'01-02': clip('01-02.webm', 2)}),
      timing([
        {id: '01-01', name: 'intro', start: 0},
        {id: '01-02', name: 'next', start: 5},
      ]),
    );

    expect(plan.items.map(item => item.id)).toEqual(['01-02']);
    expect(plan.warnings).toEqual([]);
  });

  it('detects a clip that runs into the next beat', () => {
    const plan = planAudio(
      manifest({'01-01': clip('01-01.webm', 6)}),
      timing([
        {id: '01-01', name: 'intro', start: 0},
        {id: '01-02', name: 'next', start: 4},
      ]),
    );

    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('01-01');
    expect(plan.warnings[0]).toContain('01-02');
    expect(plan.warnings[0]).toContain('voice mode "play"');
  });

  it('allows an overlap within 0.05 seconds', () => {
    const plan = planAudio(
      manifest({'01-01': clip('01-01.webm', 4.05)}),
      timing([
        {id: '01-01', name: 'intro', start: 0},
        {id: '01-02', name: 'next', start: 4},
      ]),
    );

    expect(plan.warnings).toEqual([]);
  });

  it('warns about a clip with no timing entry', () => {
    const plan = planAudio(
      manifest({'01-01': clip('01-01.webm', 2), '01-03': clip('01-03.webm', 2)}),
      timing([{id: '01-01', name: 'intro', start: 0}]),
    );

    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('01-03');
    expect(plan.warnings[0]).toContain('timing.json');
  });

  it('skips a clip with an invalid duration', () => {
    const plan = planAudio(
      manifest({'01-01': clip('01-01.webm', 0)}),
      timing([{id: '01-01', name: 'intro', start: 0}]),
    );

    expect(plan.items).toEqual([]);
    expect(plan.warnings[0]).toContain('invalid duration');
  });
});

describe('buildFfmpegArgs', () => {
  const plan: AudioPlan = {
    items: [
      {id: '01-01', file: '/clips/01-01.webm', startSeconds: 0, seconds: 2},
      {id: '02-01', file: '/clips/02-01.mp4', startSeconds: 4.25, seconds: 3},
    ],
    warnings: [],
  };

  it('adds one input per clip and delays each to its beat', () => {
    const args = buildFfmpegArgs({video: '/video.mp4', out: '/out.mp4', durationSeconds: 10.5, plan});

    expect(args).toContain('/video.mp4');
    expect(args).toContain('/clips/01-01.webm');
    expect(args).toContain('/clips/02-01.mp4');
    expect(args).toContain('0:v:0');
    expect(args).toContain('[aout]');
    expect(args).toContain('-c:v');
    expect(args).toContain('copy');
    expect(args).toContain('-c:a');
    expect(args).toContain('aac');
    expect(args).toContain('-b:a');
    expect(args).toContain('192k');

    const graph = args[args.indexOf('-filter_complex') + 1];
    expect(graph).toContain('[1:a]adelay=0|0[a0]');
    expect(graph).toContain('[2:a]adelay=4250|4250[a1]');
    expect(graph).toContain('[a0][a1]amix=inputs=2:normalize=0');
    expect(graph).toContain('loudnorm=I=-16:TP=-1.5:LRA=11');
    expect(graph).toContain('apad,atrim=0:10.500,asetpts=N/SR/TB[aout]');
  });

  it('can skip loudness normalisation', () => {
    const args = buildFfmpegArgs({
      video: '/video.mp4',
      out: '/out.mp4',
      durationSeconds: 10,
      plan,
      normalize: false,
    });
    expect(args[args.indexOf('-filter_complex') + 1]).not.toContain('loudnorm');
  });

  it('refuses an empty plan', () => {
    expect(() =>
      buildFfmpegArgs({video: '/video.mp4', out: '/out.mp4', durationSeconds: 10, plan: {items: [], warnings: []}}),
    ).toThrow(/no recorded clips/i);
  });

  it('refuses a missing video duration', () => {
    expect(() => buildFfmpegArgs({video: '/video.mp4', out: '/out.mp4', durationSeconds: 0, plan})).toThrow(
      /duration/i,
    );
  });
});
