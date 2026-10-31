import {Node} from '@motion-canvas/2d';
import {ThreadGenerator} from '@motion-canvas/core';

/**
 * Fade a section root out and remove it from the scene.
 *
 * @example
 * yield* leave(root());
 */
export function* leave(root: Node): ThreadGenerator {
  yield* root.opacity(0, 0.4);
  root.remove();
}
