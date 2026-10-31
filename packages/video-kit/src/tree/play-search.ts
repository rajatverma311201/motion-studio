import {Rect} from '@motion-canvas/2d';
import type {ThreadGenerator} from '@motion-canvas/core';
import {easeInOutCubic, waitFor} from '@motion-canvas/core';
import {chip} from '../components/chip';
import {say} from '../hud';
import {colors} from '../theme/colors';
import type {TreeView} from './tree-view';
import type {SearchStep} from './tree-types';

/**
 * Animate a lookup with a "needle" chip travelling down the tree.
 *
 * @example
 * const plan = searchPlan(tree.snap(), 25, false);
 * yield* playSearch(tv, plan, 25);
 */
export function* playSearch(
  tv: TreeView,
  plan: SearchStep[],
  key: number,
  o: {narrate?: boolean; cellTime?: number; onVisit?: (visited: number) => void} = {},
): ThreadGenerator {
  const nar = o.narrate ?? true;
  const ct = o.cellTime ?? 0.45;
  const needle = chip(`find ${key}`, colors.yellow, {fs: 22, sh: 4}) as Rect;
  const first = tv.at(plan[0].id);
  needle.position([first.x, first.y - tv.nodeHeight / 2 - 46]);
  needle.opacity(0);
  tv.root.parent()!.add(needle);
  yield* needle.opacity(1, 0.25);
  for (let s = 0; s < plan.length; s++) {
    const st = plan[s];
    const a = tv.at(st.id);
    yield* needle.position([a.x, a.y - tv.nodeHeight / 2 - 46], 0.5, easeInOutCubic);
    o.onVisit?.(s + 1);
    yield* tv.mark([st.id], colors.yellow, 0.12);
    for (let j = 0; j < st.cmp; j++) {
      const last = j === st.cmp - 1;
      yield* tv.markCell(st.id, j, last && st.hit !== undefined ? colors.lime : colors.yellow, 0.1);
      yield* waitFor(ct);
      if (!last) yield* tv.markCell(st.id, j, colors.surf2, 0.08);
    }
    if (nar) yield* say(st.note);
    yield* waitFor(1.1);
    if (st.hit !== undefined || st.child === undefined) {
      yield* tv.mark([st.id], st.hit !== undefined ? colors.lime : colors.red, 0.15);
      yield* waitFor(1.0);
      break;
    }
    yield* tv.unmark(0.12);
  }
  yield* needle.opacity(0, 0.25);
  needle.remove();
}
