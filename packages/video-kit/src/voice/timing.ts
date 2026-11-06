/**
 * The two files the voice pipeline exchanges with the studio: the clip
 * manifest written by the recorder and the timing table written by a render in
 * voice mode `play`.
 */

/** One caption beat on the final timeline, in seconds. */
export interface BeatTiming {
  id: string;
  name: string;
  start: number;
}

/** `timing.json`: every recorded beat's start on the rendered timeline. */
export interface TimingJson {
  slug: string;
  fps: number;
  totalSeconds: number;
  beats: BeatTiming[];
}

/** One recorded clip in the manifest. */
export interface VoiceClip {
  /** File name inside `apps/studio/voice/<slug>/`, e.g. `03-02.webm`. */
  file: string;
  /** Exact decoded duration in seconds. */
  seconds: number;
  /** The presenter slide name this clip belongs to. */
  slideName: string;
  /** ISO timestamp of the recording. */
  recordedAt: string;
}

/** `manifest.json`: the clips recorded for one lesson. */
export interface VoiceManifest {
  slug: string;
  version: 1;
  clips: Record<string, VoiceClip>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate a manifest read from the voice server. Returns `null` when any
 * clip is malformed, so a half-written file never feeds a render.
 *
 * @example
 * readManifest({slug: 'demo', version: 1, clips: {}}); // {slug: 'demo', version: 1, clips: {}}
 */
export function readManifest(value: unknown): VoiceManifest | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.slug !== 'string' || !isRecord(value.clips)) {
    return null;
  }

  const clips: Record<string, VoiceClip> = {};
  for (const [id, raw] of Object.entries(value.clips)) {
    if (
      !isRecord(raw) ||
      typeof raw.file !== 'string' ||
      typeof raw.seconds !== 'number' ||
      !Number.isFinite(raw.seconds) ||
      typeof raw.slideName !== 'string' ||
      typeof raw.recordedAt !== 'string'
    ) {
      return null;
    }
    clips[id] = {
      file: raw.file,
      seconds: raw.seconds,
      slideName: raw.slideName,
      recordedAt: raw.recordedAt,
    };
  }

  return {slug: value.slug, version: 1, clips};
}

/**
 * Validate a `timing.json` body before the voice server stores it.
 *
 * @example
 * readTimingJson({slug: 'demo', fps: 60, totalSeconds: 12, beats: []}); // valid
 */
export function readTimingJson(value: unknown): TimingJson | null {
  if (
    !isRecord(value) ||
    typeof value.slug !== 'string' ||
    typeof value.fps !== 'number' ||
    !Number.isFinite(value.fps) ||
    value.fps <= 0 ||
    typeof value.totalSeconds !== 'number' ||
    !Number.isFinite(value.totalSeconds) ||
    value.totalSeconds < 0 ||
    !Array.isArray(value.beats)
  ) {
    return null;
  }

  const beats: BeatTiming[] = [];
  for (const raw of value.beats) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== 'string' ||
      !/^\d{2}-\d{2}$/.test(raw.id) ||
      typeof raw.name !== 'string' ||
      typeof raw.start !== 'number' ||
      !Number.isFinite(raw.start) ||
      raw.start < 0
    ) {
      return null;
    }
    beats.push({id: raw.id, name: raw.name, start: raw.start});
  }

  return {slug: value.slug, fps: value.fps, totalSeconds: value.totalSeconds, beats};
}

/**
 * Collect beat timings in play order. Replaying a beat while seeking is
 * idempotent: the first timing wins and the table never duplicates an id.
 *
 * @example
 * const table = new TimingTable();
 * table.add({id: '01-01', name: '01-01 · Intro', start: 0});
 * table.toJson('demo', 60, 12);
 */
export class TimingTable {
  private readonly entries = new Map<string, BeatTiming>();

  /** Add one beat; an id that was already seen is left untouched. */
  public add(beat: BeatTiming): void {
    if (!this.entries.has(beat.id)) this.entries.set(beat.id, {...beat});
  }

  /** How many distinct beats the table holds. */
  public get size(): number {
    return this.entries.size;
  }

  /** Serialize to the `timing.json` shape, ordered by start time. */
  public toJson(slug: string, fps: number, totalSeconds: number): TimingJson {
    return {
      slug,
      fps,
      totalSeconds,
      beats: [...this.entries.values()].sort((a, b) => a.start - b.start).map(beat => ({...beat})),
    };
  }
}
