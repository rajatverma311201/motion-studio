import {Node} from '@motion-canvas/2d';
import {ThreadGenerator, all, easeOutCubic} from '@motion-canvas/core';
import {shake} from './shake';

/**
 * Slam a node into place: scale from 1.8 to 1 with a short opacity ramp, then
 * a small shake. Use it for stamps.
 *
 * @example
 * yield* slam(myStamp, 0.4);
 */
export function* slam(node: Node, dur = 0.4): ThreadGenerator {
  node.scale(1.8);
  node.opacity(0);
  yield* all(node.scale(1, dur, easeOutCubic), node.opacity(1, dur * 0.35));
  yield* shake(node, 10, 4);
}
