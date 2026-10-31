import {Node, Rect, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, createRef, waitFor} from '@motion-canvas/core';
import {
  IndexTree,
  TreeView,
  chip,
  chipText,
  colors,
  indexLegend,
  leave,
  playInsert,
  say,
} from '@motion-studio/video-kit';
import {SEQ} from '../shared';

// ================================================================ B+TREE INSERT
export function* bplustreeInsertSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const t = new IndexTree(3, true);
  const tv = new TreeView({x: 0, y: -235, scale: 1.6, plus: true});
  const insChip = chip('INSERT ▸ —', colors.yellow, {x: -620, y: -400, fs: 26, sh: 6}) as Rect;
  const lg = indexLegend(250, 340, true);
  const maxChip = chip('MAX 3 KEYS PER NODE', colors.surf2, {
    x: -620,
    y: 340,
    fs: 18,
    sh: 0,
    color: colors.ink,
  }) as Rect;
  view.add(
    <Node ref={root} opacity={0}>
      {insChip}
      {tv.root}
      {lg}
      {maxChip}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Same inserts as before, now into a B+tree. Watch how the leaf split is different.');
  yield* tv.show(t.snap(), 0.6);
  yield* waitFor(1.2);

  let sawSplit = false;
  for (let i = 0; i < SEQ.length; i++) {
    const key = SEQ[i];
    chipText(insChip).text(`INSERT ▸ ${key}`);
    const steps = t.insert(key);
    if (i < 3) {
      if (i === 0) yield* say('Insert 10, 20 and 5: the root is a leaf and just fills up.');
      yield* playInsert(tv, steps, {narrate: false, speed: 0.9});
      yield* waitFor(0.4);
    } else {
      const plain = steps.every(s => s.kind !== 'overflow');
      yield* playInsert(tv, steps, {narrate: true, speed: plain ? 0.75 : 1});
    }
    if (!sawSplit && steps.some(s => s.kind === 'newroot' || s.kind === 'split')) {
      sawSplit = true;
      yield* say('Look: 15 sits in the parent AND still in the right leaf. B+tree leaf splits COPY the key up.', 4.2);
    }
    if (key === 7)
      yield* say('Internal nodes split like a B-tree (the median moves up), but leaves always keep every key.', 3.8);
  }
  chipText(insChip).text('11 KEYS · 3 LEVELS');
  yield* tv.mark(tv.idsOfLeaves(), colors.lime, 0.3);
  yield* say('Every key is in a leaf, and the leaves are chained. That chain is the secret weapon.', 3.8);
  yield* tv.unmark();
  yield* leave(root());
}
