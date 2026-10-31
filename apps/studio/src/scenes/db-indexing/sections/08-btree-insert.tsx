import {Node, Rect, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, createRef, waitFor} from '@motion-canvas/core';
import {chip, chipText, colors, indexLegend, leave, say} from '@motion-studio/video-kit';
import {IndexTree, TreeView, playInsert} from '@motion-studio/video-kit';
import {SEQ} from '../shared';

// ================================================================ B-TREE INSERT
export function* btreeInsertSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const t = new IndexTree(3, false);
  const tv = new TreeView({x: 0, y: -250, scale: 1.4});
  const insChip = chip('INSERT ▸ —', colors.yellow, {x: -620, y: -400, fs: 26, sh: 6}) as Rect;
  const lg = indexLegend(250, 340, false);
  const maxChip = chip('MAX 3 KEYS PER NODE', colors.surf2, {x: -620, y: 340, fs: 18, sh: 0, color: colors.ink}) as Rect;
  view.add(
    <Node ref={root} opacity={0}>
      {insChip}
      {tv.root}
      {lg}
      {maxChip}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Insert: find the right leaf, drop the key in, and split the node if it gets too full.');
  yield* tv.show(t.snap(), 0.6);
  yield* waitFor(1.2);

  for (let i = 0; i < SEQ.length; i++) {
    const key = SEQ[i];
    chipText(insChip).text(`INSERT ▸ ${key}`);
    const steps = t.insert(key);
    if (i === 0) {
      yield* say('Insert 10, 20 and 5: the empty root leaf just fills up, kept sorted.');
      yield* playInsert(tv, steps, {narrate: false, speed: 0.9});
    } else if (i < 3) {
      yield* playInsert(tv, steps, {narrate: false, speed: 0.9});
      yield* waitFor(0.5);
    } else {
      const plain = steps.every(s => s.kind !== 'overflow');
      yield* playInsert(tv, steps, {narrate: true, speed: plain ? 0.75 : 1});
    }
    if (key === 15) {
      yield* say('First split done: the tree now has two levels. Only the median moved up.', 3);
    }
    if (key === 7) {
      yield* say('The root overflowed too and split. Now every leaf is one level deeper, all together.', 3.4);
    }
  }
  chipText(insChip).text('11 KEYS · 3 LEVELS');
  yield* tv.mark(tv.idsOfLeaves(), colors.lime, 0.3);
  yield* say('The tree only grows at the root, so all leaves stay at the same depth. It is always balanced.', 4);
  yield* tv.unmark();
  yield* say('Page splits are why inserts into a full index page cost extra writes.', 3.2);
  yield* leave(root());
}
