import {Node} from '@motion-canvas/2d';
import {ThreadGenerator, all, easeOutBack} from '@motion-canvas/core';

/**
 * Pop a node in from 30 % scale with a quick opacity fade.
 *
 * @example
 * yield* pop(myCard, 0.3);
 */
export function* pop(n: Node, dur = 0.3): ThreadGenerator {
  n.scale(0.3);
  n.opacity(0);
  yield* all(n.scale(1, dur, easeOutBack), n.opacity(1, dur * 0.5));
}
