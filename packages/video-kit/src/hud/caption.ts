import {ThreadGenerator, useThread, waitFor} from '@motion-canvas/core';
import {shouldPause, stretchWait} from '../voice/stretch';
import {
  clipSeconds,
  getPauseMode,
  getVoiceMode,
  markVoiceBeat,
  nextVoiceBeat,
  presenterSlide,
  previousVoiceBeat,
} from '../voice/voice-state';
import {hudState} from './hud';

/**
 * Fade the caption bar text in, optionally holding it for `hold` seconds.
 *
 * In voice mode `play` the previous beat is stretched to its recorded clip; a
 * presenter slide is registered before the caption according to the pause
 * mode, and the beat start goes into the timing table.
 *
 * @example
 * yield* say('A B-tree keeps keys sorted.', 2);
 */
export function* say(text: string, hold = 0): ThreadGenerator {
  const now = useThread().fixed;
  const previous = previousVoiceBeat();
  if (getVoiceMode() === 'play' && previous) {
    const wait = stretchWait(clipSeconds(previous.id), now - previous.start);
    if (wait > 0) yield* waitFor(wait);
  }

  const beat = nextVoiceBeat(text);
  if (shouldPause(getPauseMode(), beat.index)) {
    yield* presenterSlide(beat.name);
  }

  markVoiceBeat({id: beat.id, name: beat.name, start: useThread().fixed});

  yield* hudState.cap().opacity(0, 0.12);
  hudState.cap().text(text);
  yield* hudState.cap().opacity(1, 0.22);
  if (hold > 0) yield* waitFor(hold);
}
