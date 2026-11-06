/**
 * Pause points and voice modes for the studio recording pipeline.
 *
 * The values resolve with the same precedence as the look: the studio CLI flag
 * (or its `VIDEO_*` environment variable) wins over the Motion Canvas player
 * variable, which wins over the built-in default. Invalid values are skipped
 * with a warning instead of throwing, so a typo never breaks a lesson.
 */

/** Where the presenter stops: every caption beat, once per chapter, or never. */
export type PauseMode = 'beat' | 'chapter' | 'off';

/** Whether the scene records clips, plays them back, or ignores the voice track. */
export type VoiceMode = 'off' | 'record' | 'play';

export const PAUSE_MODES: readonly PauseMode[] = ['beat', 'chapter', 'off'];
export const VOICE_MODES: readonly VoiceMode[] = ['off', 'record', 'play'];

/** The two sources that can name a pause mode, plus an optional fallback. */
export interface PauseSelectionInput {
  /** The `--pause` flag (or `VIDEO_PAUSE`), already baked into the bundle. */
  cli?: string;
  /** The `pause` Motion Canvas player variable. */
  variable?: string;
  /** The default when no source is valid. Defaults to `beat`. */
  fallback?: PauseMode;
}

/** The two sources that can name a voice mode, plus what to do when clips exist. */
export interface VoiceSelectionInput {
  /** The `--voice` flag (or `VIDEO_VOICE`), already baked into the bundle. */
  cli?: string;
  /** The `voice` Motion Canvas player variable. */
  variable?: string;
  /** Whether a manifest with at least one clip exists for this lesson. */
  hasClips?: boolean;
  /** The default when no source is valid. Overrides the `hasClips` rule. */
  fallback?: VoiceMode;
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[], label: string): T | undefined {
  if (value === undefined || value === '') return undefined;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  console.warn(`[video-kit] Unknown ${label} "${value}"; using the next valid source.`);
  return undefined;
}

/**
 * Resolve the pause mode: CLI flag, then player variable, then `fallback`, then `beat`.
 *
 * @example
 * resolvePauseMode({cli: 'chapter'}); // 'chapter'
 * resolvePauseMode({cli: 'sometimes', variable: 'off'}); // 'off' (warns)
 */
export function resolvePauseMode(input: PauseSelectionInput = {}): PauseMode {
  return (
    pick(input.cli, PAUSE_MODES, 'pause mode') ??
    pick(input.variable, PAUSE_MODES, 'pause mode') ??
    input.fallback ??
    'beat'
  );
}

/**
 * Resolve the voice mode: CLI flag, then player variable, then `play` when the
 * lesson has recorded clips, otherwise `off`.
 *
 * @example
 * resolveVoiceMode({hasClips: true}); // 'play'
 * resolveVoiceMode({cli: 'record'}); // 'record'
 */
export function resolveVoiceMode(input: VoiceSelectionInput = {}): VoiceMode {
  return (
    pick(input.cli, VOICE_MODES, 'voice mode') ??
    pick(input.variable, VOICE_MODES, 'voice mode') ??
    input.fallback ??
    (input.hasClips ? 'play' : 'off')
  );
}

/**
 * Recording needs every beat to be addressable, so `record` forces `beat`.
 *
 * @example
 * effectivePauseMode('chapter', 'record'); // 'beat'
 * effectivePauseMode('chapter', 'play'); // 'chapter'
 */
export function effectivePauseMode(pause: PauseMode, voice: VoiceMode): PauseMode {
  if (voice !== 'record') return pause;
  if (pause !== 'beat') {
    console.warn(`[video-kit] voice mode "record" forces pause "beat"; ignoring pause "${pause}".`);
  }
  return 'beat';
}
