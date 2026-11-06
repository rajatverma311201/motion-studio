import type {PauseMode} from './voice-settings';

/**
 * How long the current beat must wait so the previous beat lasts at least as
 * long as its recorded clip. Returns 0 when there is no clip, the clip is
 * already covered, or either value is not finite.
 *
 * @example
 * stretchWait(6.4, 3); // 3.4
 * stretchWait(6.4, 8); // 0
 * stretchWait(undefined, 3); // 0
 */
export function stretchWait(prevClipSeconds: number | undefined, elapsed: number): number {
  if (prevClipSeconds === undefined || !Number.isFinite(prevClipSeconds)) return 0;
  if (!Number.isFinite(elapsed)) return 0;
  return Math.max(0, prevClipSeconds - Math.max(0, elapsed));
}

/**
 * Whether `say` should register and wait at a presenter slide for this beat.
 * A chapter pause lands on the first beat of each chapter; `beat` lands on all.
 *
 * @example
 * shouldPause('beat', 4); // true
 * shouldPause('chapter', 4); // false
 * shouldPause('off', 0); // false
 */
export function shouldPause(mode: PauseMode, beatIndex: number): boolean {
  if (mode === 'off') return false;
  if (mode === 'chapter') return beatIndex === 0;
  return true;
}
