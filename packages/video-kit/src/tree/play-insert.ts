import type {ThreadGenerator} from '@motion-canvas/core';
import {waitFor} from '@motion-canvas/core';
import {say} from '../hud';
import {colors} from '../theme/colors';
import type {TreeView} from './tree-view';
import type {Step} from './tree-types';

/**
 * Animate an insertion: descent, insert, overflow, splits.
 *
 * @example
 * for (const key of [10, 20, 5]) yield* playInsert(tv, tree.insert(key));
 */
export function* playInsert(tv: TreeView, steps: Step[], o: {narrate?: boolean; speed?: number} = {}): ThreadGenerator {
  const sp = o.speed ?? 1;
  const nar = o.narrate ?? true;
  for (const s of steps) {
    if (nar) yield* say(s.cap);
    if (s.kind === 'visit') {
      yield* tv.mark(s.focus, colors.yellow, 0.12 * sp);
      yield* waitFor((nar ? 1.0 : 0.22) * sp);
      yield* tv.unmark(0.1 * sp);
    } else if (s.kind === 'insert') {
      yield* tv.show(s.snap, 0.45 * sp);
      yield* tv.mark(s.focus, colors.lime, 0.12 * sp);
      yield* waitFor((nar ? 1.1 : 0.25) * sp);
      yield* tv.unmark(0.1 * sp);
    } else if (s.kind === 'overflow') {
      yield* tv.mark(s.focus, colors.red, 0.15);
      yield* waitFor(1.5);
    } else {
      // split / newroot
      yield* tv.unmark(0.05);
      yield* tv.show(s.snap, 0.95);
      yield* tv.mark(s.focus, colors.lime, 0.15);
      yield* waitFor(1.5);
      yield* tv.unmark(0.15);
    }
  }
}
