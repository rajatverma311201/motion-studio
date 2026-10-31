import {Node, Rect, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, createRef, waitFor} from '@motion-canvas/core';
import {TreeView, chip, chipText, colors, indexLegend, leave, say, snapOf} from '@motion-studio/video-kit';

// ================================================================ B+TREE DELETE
export function* bplustreeDeleteSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tv = new TreeView({x: 0, y: -215, scale: 1.7, plus: true});
  const delChip = chip('DELETE ▸ —', colors.red, {x: -620, y: -400, fs: 26, sh: 6, color: colors.ink}) as Rect;
  const rule = chip('DEMO RULE: A LEAF NEEDS AT LEAST 2 KEYS (MAX 3)', colors.surf2, {
    x: -480,
    y: 340,
    fs: 18,
    sh: 0,
    color: colors.ink,
  }) as Rect;
  const lg = indexLegend(380, 340, true);
  view.add(
    <Node ref={root} opacity={0}>
      {delChip}
      {tv.root}
      {rule}
      {lg}
    </Node>,
  );
  const s0 = snapOf('r', [
    ['r', [20, 40], ['a', 'b', 'c']],
    ['a', [5, 10]],
    ['b', [20, 25, 30]],
    ['c', [40, 50, 55]],
  ]);
  yield* root().opacity(1, 0.3);
  yield* say('Delete is insert in reverse. Remove the key, then fix any node that became too empty.');
  yield* tv.show(s0, 0.8);
  yield* waitFor(2.2);

  // 1. simple delete
  chipText(delChip).text('DELETE ▸ 55');
  yield* say('Delete 55: find its leaf and remove it. The leaf still has 2 keys, so nothing else to do.');
  yield* tv.mark(['c'], colors.yellow);
  yield* tv.markCell('c', 2, colors.red, 0.2);
  yield* waitFor(1.2);
  yield* tv.unmark();
  const s1 = snapOf('r', [
    ['r', [20, 40], ['a', 'b', 'c']],
    ['a', [5, 10]],
    ['b', [20, 25, 30]],
    ['c', [40, 50]],
  ]);
  yield* tv.show(s1, 0.6);
  yield* waitFor(1.8);

  // 2. underflow + borrow
  chipText(delChip).text('DELETE ▸ 5');
  yield* say('Delete 5: the leaf drops to a single key. That is below the minimum: underflow.');
  yield* tv.mark(['a'], colors.yellow);
  yield* tv.markCell('a', 0, colors.red, 0.2);
  yield* waitFor(1.2);
  yield* tv.unmark();
  const s2 = snapOf('r', [
    ['r', [20, 40], ['a', 'b', 'c']],
    ['a', [10]],
    ['b', [20, 25, 30]],
    ['c', [40, 50]],
  ]);
  yield* tv.show(s2, 0.5);
  yield* tv.mark(['a'], colors.red, 0.2);
  yield* waitFor(2);
  yield* tv.unmark();
  yield* say('Fix 1, borrow: the right sibling has a spare key. Move 20 over and update the parent signpost.');
  yield* tv.mark(['b'], colors.cyan);
  yield* waitFor(1.6);
  const s3 = snapOf('r', [
    ['r', [25, 40], ['a', 'b', 'c']],
    ['a', [10, 20]],
    ['b', [25, 30]],
    ['c', [40, 50]],
  ]);
  yield* tv.unmark();
  yield* tv.show(s3, 1);
  yield* tv.mark(['r', 'a', 'b'], colors.lime, 0.2);
  yield* waitFor(2.2);
  yield* tv.unmark();

  // 3. merge
  chipText(delChip).text('DELETE ▸ 50');
  yield* say('Delete 50: the last leaf underflows again. Its neighbour [25, 30] has nothing to spare.');
  yield* tv.mark(['c'], colors.yellow);
  yield* tv.markCell('c', 1, colors.red, 0.2);
  yield* waitFor(1.2);
  yield* tv.unmark();
  const s4 = snapOf('r', [
    ['r', [25, 40], ['a', 'b', 'c']],
    ['a', [10, 20]],
    ['b', [25, 30]],
    ['c', [40]],
  ]);
  yield* tv.show(s4, 0.5);
  yield* tv.mark(['c'], colors.red, 0.2);
  yield* waitFor(1.6);
  yield* tv.unmark();
  yield* say('Fix 2, merge: combine the two thin leaves into one, and delete the separator 40 from the parent.');
  yield* tv.mark(['b', 'c'], colors.pink);
  yield* waitFor(1.6);
  const s5 = snapOf('r', [
    ['r', [25], ['a', 'b']],
    ['a', [10, 20]],
    ['b', [25, 30, 40]],
  ]);
  yield* tv.unmark();
  yield* tv.show(s5, 1.1);
  yield* tv.mark(['b'], colors.lime, 0.2);
  yield* waitFor(2.4);
  yield* tv.unmark();
  yield* say('If merges ripple up and the root is left with one child, the tree shrinks a level. It stays balanced.', 4);
  yield* say('That is the rhythm: splits on insert, borrows and merges on delete. Every page stays reasonably full.', 3.6);
  yield* leave(root());
}
