/**
 * Pure planning for `pnpm voice:mux`.
 *
 * `planAudio` turns the recorded manifest and the rendered timing table into
 * the list of clips to place on the video. `buildFfmpegArgs` turns that plan
 * into one ffmpeg command: every clip is delayed to its beat start, mixed,
 * optionally loudness-normalised, padded or cut to the video duration, and
 * attached to a copied video stream.
 */
import type {TimingJson, VoiceManifest} from './timing';

/** One clip to place on the final timeline. */
export interface AudioItem {
  id: string;
  /** File name from the manifest, or a path when the caller resolved it. */
  file: string;
  startSeconds: number;
  seconds: number;
}

/** The result of planning the voice track. */
export interface AudioPlan {
  items: AudioItem[];
  warnings: string[];
}

/** Arguments for the final ffmpeg invocation. */
export interface FfmpegArgsOptions {
  video: string;
  out: string;
  /** Duration of the rendered video in seconds. */
  durationSeconds: number;
  plan: AudioPlan;
  normalize?: boolean;
}

const OVERLAP_TOLERANCE = 0.05;

/**
 * Pair every recorded clip with its beat start. Beats without a clip are
 * skipped silently; orphan clips, invalid durations and clips that run into
 * the next beat produce a warning (the script treats warnings as fatal).
 *
 * @example
 * planAudio(manifest, timing); // {items: [{id: '01-01', file: '01-01.webm', startSeconds: 0, seconds: 4.2}], warnings: []}
 */
export function planAudio(manifest: VoiceManifest, timing: TimingJson): AudioPlan {
  const warnings: string[] = [];
  const beats = [...timing.beats].sort((a, b) => a.start - b.start);
  const timingIds = new Set(beats.map(beat => beat.id));
  const items: AudioItem[] = [];

  for (const beat of beats) {
    const clip = manifest.clips[beat.id];
    if (!clip) continue;
    if (!Number.isFinite(clip.seconds) || clip.seconds <= 0) {
      warnings.push(`Clip ${beat.id} has an invalid duration (${String(clip.seconds)} s); skipping it.`);
      continue;
    }

    const next = beats.find(candidate => candidate.start > beat.start);
    if (next && beat.start + clip.seconds > next.start + OVERLAP_TOLERANCE) {
      warnings.push(
        `Clip ${beat.id} lasts ${clip.seconds.toFixed(2)} s and runs into beat ${next.id} at ` +
          `${next.start.toFixed(2)} s; render in voice mode "play" so the beat is stretched.`,
      );
    }

    items.push({id: beat.id, file: clip.file, startSeconds: beat.start, seconds: clip.seconds});
  }

  for (const id of Object.keys(manifest.clips).sort()) {
    if (!timingIds.has(id)) {
      warnings.push(`Clip ${id} has no timing entry; render again in voice mode "play" so timing.json is current.`);
    }
  }

  return {items, warnings};
}

/**
 * Build the ffmpeg argument list for the muxed video.
 *
 * @example
 * buildFfmpegArgs({
 *   video: 'demo.mp4',
 *   out: 'demo.voiced.mp4',
 *   durationSeconds: 30,
 *   plan: {items: [{id: '01-01', file: '01-01.webm', startSeconds: 2, seconds: 4}], warnings: []},
 * });
 */
export function buildFfmpegArgs(options: FfmpegArgsOptions): string[] {
  const {video, out, plan, durationSeconds} = options;
  if (plan.items.length === 0) throw new Error('There are no recorded clips to mix.');
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error(`Invalid video duration: ${String(durationSeconds)}.`);
  }

  const inputs = plan.items.flatMap(item => ['-i', item.file]);
  const delays = plan.items.map((item, index) => {
    const milliseconds = Math.max(0, Math.round(item.startSeconds * 1000));
    return `[${index + 1}:a]adelay=${milliseconds}|${milliseconds}[a${index}]`;
  });
  const mixInputs = plan.items.map((_, index) => `[a${index}]`).join('');
  const loudness = options.normalize === false ? '' : ',loudnorm=I=-16:TP=-1.5:LRA=11';
  const mix = `${mixInputs}amix=inputs=${plan.items.length}:normalize=0${loudness}`;
  const cut = `apad,atrim=0:${durationSeconds.toFixed(3)},asetpts=N/SR/TB[aout]`;

  return [
    '-y',
    '-i',
    video,
    ...inputs,
    '-filter_complex',
    [...delays, `${mix},${cut}`].join(';'),
    '-map',
    '0:v:0',
    '-map',
    '[aout]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    out,
  ];
}
