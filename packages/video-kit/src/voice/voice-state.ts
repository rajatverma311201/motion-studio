/**
 * Runtime state shared by `say`, `setSection` and `finishVoice`.
 *
 * The scene is one lesson in one Motion Canvas project, so this module-level
 * state is reset by `configureVoice` at the start of every scene run. The
 * recorder panel attaches hooks for beat starts and the end of the lesson.
 */
import {
  beginSlide,
  PlaybackState,
  usePlayback,
  useScene,
  useThread,
  waitFor,
  type ThreadGenerator,
} from '@motion-canvas/core';
import {beatId, slideName} from './beat-ids';
import {stretchWait} from './stretch';
import {readManifest, TimingTable, type BeatTiming, type TimingJson, type VoiceManifest} from './timing';
import type {PauseMode, VoiceMode} from './voice-settings';

/** Everything `configureVoice` needs for one lesson run. */
export interface VoiceSetup {
  slug: string;
  voice: VoiceMode;
  pause: PauseMode;
  manifest: VoiceManifest | null;
}

/** Callbacks the recorder panel registers while the lesson plays. */
export interface VoiceHooks {
  /** A beat has started: stop the previous clip and start this one. */
  onBeatStart?: (beat: BeatTiming) => void;
  /** The lesson ended: stop the running clip. */
  onLessonEnd?: () => void;
}

/** One caption beat as `say` sees it. `index` is 0-based inside the chapter. */
export interface VoiceBeat {
  id: string;
  name: string;
  chapter: number;
  beat: number;
  index: number;
}

const runtime = {
  slug: '',
  voice: 'off' as VoiceMode,
  pause: 'beat' as PauseMode,
  manifest: null as VoiceManifest | null,
  timing: new TimingTable(),
  chapter: 0,
  beat: 0,
  previous: null as BeatTiming | null,
  hooks: {} as VoiceHooks,
};

/**
 * Start a lesson run: reset the counters, timing table and previous beat.
 *
 * @example
 * configureVoice({slug: 'demo', voice: 'play', pause: 'beat', manifest});
 */
export function configureVoice(setup: VoiceSetup): void {
  runtime.slug = setup.slug;
  runtime.voice = setup.voice;
  runtime.pause = setup.pause;
  runtime.manifest = setup.manifest;
  runtime.timing = new TimingTable();
  runtime.chapter = 0;
  runtime.beat = 0;
  runtime.previous = null;
}

/**
 * The active voice mode.
 *
 * @example
 * getVoiceMode(); // 'record'
 */
export function getVoiceMode(): VoiceMode {
  return runtime.voice;
}

/**
 * The active pause mode, already forced to `beat` in record mode.
 *
 * @example
 * getPauseMode(); // 'beat'
 */
export function getPauseMode(): PauseMode {
  return runtime.pause;
}

/**
 * The loaded manifest, or `null` when the voice server had no clips.
 *
 * @example
 * getVoiceManifest()?.clips['03-02']?.seconds; // 6.42
 */
export function getVoiceManifest(): VoiceManifest | null {
  return runtime.manifest;
}

/**
 * The current chapter number (1-based), or 0 before the first section.
 *
 * @example
 * getVoiceChapter(); // 3
 */
export function getVoiceChapter(): number {
  return runtime.chapter;
}

/**
 * How many distinct beats this lesson run has marked so far.
 *
 * @example
 * getBeatCount(); // 7
 */
export function getBeatCount(): number {
  return runtime.timing.size;
}

/**
 * Attach the recorder hooks. The panel calls this when it mounts.
 *
 * @example
 * setVoiceHooks({onBeatStart: beat => recorder.start(beat.id, beat.name)});
 */
export function setVoiceHooks(hooks: VoiceHooks): void {
  runtime.hooks = hooks;
}

/**
 * Remove the recorder hooks when the panel unmounts.
 *
 * @example
 * clearVoiceHooks();
 */
export function clearVoiceHooks(): void {
  runtime.hooks = {};
}

/**
 * Reset the beat counter for a chapter. The chapter number is 1-based, matching
 * the ids (`01-01`, ...).
 *
 * @example
 * beginVoiceChapter(2); // the third chapter
 */
export function beginVoiceChapter(chapterIndex: number): void {
  runtime.chapter = chapterIndex + 1;
  runtime.beat = 0;
}

/**
 * Advance to the next caption beat of the current chapter.
 *
 * @example
 * nextVoiceBeat('Every commit is all or nothing.'); // {id: '01-01', ...}
 */
export function nextVoiceBeat(caption: string): VoiceBeat {
  runtime.beat += 1;
  const chapter = runtime.chapter;
  const beat = runtime.beat;
  return {
    id: beatId(chapter, beat),
    name: slideName(chapter, beat, caption),
    chapter,
    beat,
    index: beat - 1,
  };
}

/**
 * The beat that started before the current one, across chapter boundaries.
 *
 * @example
 * previousVoiceBeat()?.id; // '03-02'
 */
export function previousVoiceBeat(): BeatTiming | null {
  return runtime.previous;
}

/**
 * The decoded length of a beat's clip, if one was recorded.
 *
 * @example
 * clipSeconds('03-02'); // 6.42
 */
export function clipSeconds(id: string | undefined): number | undefined {
  if (!id) return undefined;
  return runtime.manifest?.clips[id]?.seconds;
}

/**
 * Record the beat start, remember it for the next stretch and tell the
 * recorder. The timing table ignores replays of the same id.
 *
 * @example
 * markVoiceBeat({id: '01-01', name: '01-01 · Intro', start: 0});
 */
export function markVoiceBeat(beat: BeatTiming): void {
  runtime.timing.add(beat);
  runtime.previous = {...beat};
  runtime.hooks.onBeatStart?.({...beat});
}

/**
 * Register a presenter slide without making normal playback wait.
 *
 * Motion Canvas's `beginSlide` yields one frame before checking
 * `Slides.shouldWait`. Outside presentation mode that frame would be added to
 * the MP4 render, and the leftover wait would make the editor's Player pause
 * once at every slide (`Player.run` pauses when `slides.isWaiting()` is true).
 * Here the slide is registered and the wait is resolved synchronously when the
 * playback state is not `Presenting`; the presenter itself still runs the stock
 * `beginSlide`. A slide seek during presentation sets `Slides.targetId`, so the
 * synchronous check can be true and is then awaited exactly like `beginSlide`.
 *
 * @example
 * yield* presenterSlide('03-02 · A transaction is all or nothing');
 */
export function* presenterSlide(name: string): ThreadGenerator {
  const playback = usePlayback();
  if (playback.state === PlaybackState.Presenting) {
    yield* beginSlide(name);
    return;
  }

  const {slides} = useScene();
  slides.register(name, useThread().fixed);
  if (!slides.shouldWait(name)) return;
  while (slides.shouldWait(name)) {
    yield;
  }
}

async function postTiming(url: string, timing: TimingJson): Promise<void> {
  if (typeof fetch !== 'function') return;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(timing),
    });
    if (!response.ok) {
      console.warn(`[video-kit] voice server answered ${response.status} for ${url}.`);
    }
  } catch (error) {
    console.warn(`[video-kit] could not reach the voice server: ${(error as Error).message}`);
  }
}

/**
 * Finish the lesson: stretch the last beat to its clip and, in play mode,
 * write `timing.json`. Recording mode stops the running clip instead.
 *
 * @example
 * yield* finishVoice();
 */
export function* finishVoice(): ThreadGenerator {
  if (runtime.voice === 'play') {
    const previous = runtime.previous;
    const remaining = stretchWait(clipSeconds(previous?.id), previous ? useThread().fixed - previous.start : 0);
    if (remaining > 0) yield* waitFor(remaining);

    const timing = runtime.timing.toJson(runtime.slug, usePlayback().fps, useThread().fixed);
    yield postTiming(`/__voice/timing?slug=${encodeURIComponent(runtime.slug)}`, timing);
  } else if (runtime.voice === 'record') {
    runtime.hooks.onLessonEnd?.();
  }
}

/**
 * Whether the lesson should ask the voice server for a manifest. An explicit
 * `off` skips the request; everything else (including a typo) asks and then
 * falls back.
 *
 * @example
 * wantsVoiceManifest({cli: 'off'}); // false
 * wantsVoiceManifest({variable: 'record'}); // true
 */
export function wantsVoiceManifest(input: {cli?: string; variable?: string}): boolean {
  const first = [input.cli, input.variable].find(value => value !== undefined && value !== '');
  return first !== 'off';
}

/**
 * Load `manifest.json` from the dev-only voice server. A missing server, a
 * missing file or a malformed body all mean "no clips".
 *
 * @example
 * const manifest = yield loadVoiceManifest('db-transactions');
 */
export async function loadVoiceManifest(slug: string): Promise<VoiceManifest | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const response = await fetch(`/__voice/manifest?slug=${encodeURIComponent(slug)}`, {cache: 'no-store'});
    if (!response.ok) return null;
    return readManifest(await response.json());
  } catch {
    return null;
  }
}
