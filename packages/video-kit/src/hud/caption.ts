import {ThreadGenerator, waitFor} from '@motion-canvas/core';
import {hudState} from './hud';

/**
 * Fade the caption bar text in, optionally holding it for `hold` seconds.
 *
 * @example
 * yield* say('A B-tree keeps keys sorted.', 2);
 */
export function* say(text: string, hold = 0): ThreadGenerator {
  yield* hudState.cap().opacity(0, 0.12);
  hudState.cap().text(text);
  yield* hudState.cap().opacity(1, 0.22);
  if (hold > 0) yield* waitFor(hold);
}
