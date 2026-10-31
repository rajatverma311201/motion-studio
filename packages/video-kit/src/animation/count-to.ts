import {Txt} from '@motion-canvas/2d';
import {ThreadGenerator, easeInOutCubic, map, tween} from '@motion-canvas/core';
import {formatNumber} from '../theme/neubrutal';

/**
 * Animate a text node from one number to another through a formatter.
 *
 * @example
 * yield* countTo(value, 0, 10_000_000, 5);
 */
export function* countTo(
  t: Txt,
  from: number,
  to: number,
  dur: number,
  f: (n: number) => string = formatNumber,
): ThreadGenerator {
  yield* tween(dur, v => t.text(f(map(from, to, easeInOutCubic(v)))));
}
