import {Txt} from '@motion-canvas/2d';
import {ThreadGenerator, tween} from '@motion-canvas/core';
import {scrambleFrame} from '../crypto-demo/scramble';

/**
 * Scramble a text node from its current string to `to`, resolving characters
 * left to right. Deterministic: no `Math.random` and no clock.
 *
 * @example
 * yield* scrambleText(card, 'cGF5IDUwMCB0byBCb2I=', 1.2, 7);
 */
export function* scrambleText(txt: Txt, to: string, dur: number, seed = 7): ThreadGenerator {
  const from = txt.text();
  yield* tween(dur, progress => txt.text(scrambleFrame(from, to, progress, seed)));
  txt.text(to);
}
