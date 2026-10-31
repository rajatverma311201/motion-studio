import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, waitFor} from '@motion-canvas/core';
import {
  TreeView,
  colors,
  fonts,
  indexLegend,
  leave,
  neubrutal,
  playSearch,
  pop,
  say,
  searchPlan,
  statCard,
} from '@motion-studio/video-kit';
import {finalSnap} from '../shared';

// ================================================================ B+TREE LOOKUP + RANGE SCAN
export function* lookupAndRangeScanSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const snap = finalSnap(true);
  const tv = new TreeView({x: 0, y: -245, scale: 1.55, plus: true});
  const q = createRef<Txt>();
  const sqlChip = (
    <Rect
      x={-440}
      y={-400}
      layout
      alignItems="center"
      padding={[8, 18]}
      radius={12}
      fill={colors.code}
      {...neubrutal(colors.cyan, 5, 3.5)}
    >
      <Txt
        ref={q}
        text="SELECT * FROM t WHERE id = 25;"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={22}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;
  const reads = statCard(-600, 318, 330, 110, 'PAGE READS', colors.orange);
  const rows = statCard(-240, 318, 330, 110, 'ROWS FOUND', colors.lime);
  rows.node.opacity(0);
  const lg = indexLegend(380, 350, true);
  view.add(
    <Node ref={root} opacity={0}>
      {sqlChip}
      {tv.root}
      {reads.node}
      {rows.node}
      {lg}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Point lookup works like before, except we always travel all the way down to a leaf.');
  yield* tv.show(snap, 0.8);
  yield* waitFor(1.6);

  reads.val.text('0');
  yield* playSearch(tv, searchPlan(snap, 25, true), 25, {narrate: false, onVisit: n => reads.val.text(String(n))});
  yield* say('Every lookup costs exactly the height of the tree. Same depth, predictable latency.', 3.2);
  yield* tv.unmark();

  // ---- range scan
  q().text('SELECT * FROM t WHERE id BETWEEN 8 AND 25;');
  reads.val.text('0');
  yield* all(pop(rows.node, 0.3), say('Now a range query. First find the left edge of the range: key 8.'));
  rows.val.text('0');
  const plan = searchPlan(snap, 8, true);
  yield* playSearch(tv, plan, 8, {narrate: false, onVisit: n => reads.val.text(String(n))});
  yield* tv.unmark();
  yield* say('Then do not climb back up. Just follow the leaf links to the right until we pass 25.', 3);

  const leaves = tv.idsOfLeaves();
  const start = leaves.indexOf(plan[plan.length - 1].id);
  let visited = plan.length;
  let found = 0;
  let done = false;
  for (let li = start; li < leaves.length && !done; li++) {
    if (li > start) {
      visited++;
      reads.val.text(String(visited));
    }
    yield* tv.mark([leaves[li]], colors.yellow, 0.15);
    const ks = tv.keysOf(leaves[li]) as number[];
    for (let i = 0; i < ks.length; i++) {
      if (ks[i] < 8) continue;
      if (ks[i] > 25) {
        done = true;
        break;
      }
      yield* tv.markCell(leaves[li], i, colors.lime, 0.12);
      found++;
      rows.val.text(String(found));
      yield* waitFor(0.4);
    }
    if (!done && li < leaves.length - 1) yield* waitFor(0.5);
  }
  yield* say('Six rows found, touching only the leaves. A B-tree would bounce up and down through parents.', 3.8);
  yield* tv.unmark();
  yield* say('That is why ORDER BY, BETWEEN and sorted scans are cheap on a B+tree index.', 3.4);
  yield* leave(root());
}
