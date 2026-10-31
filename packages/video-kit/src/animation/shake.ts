import {Node} from '@motion-canvas/2d';
import {ThreadGenerator} from '@motion-canvas/core';

/**
 * Shake a node horizontally and vertically with a decaying amplitude.
 *
 * @example
 * yield* shake(myStamp, 14, 6);
 */
export function* shake(n: Node, amp = 14, count = 6): ThreadGenerator {
  const x0 = n.x();
  const y0 = n.y();
  let a = amp;
  for (let i = 0; i < count; i++) {
    yield* n.position([x0 + (i % 2 ? a : -a), y0 + (i % 3 ? -a / 2 : a / 2)], 0.04);
    a *= 0.8;
  }
  yield* n.position([x0, y0], 0.04);
}
