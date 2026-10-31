import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, createRef, waitFor} from '@motion-canvas/core';
import {
  TreeView,
  colors,
  fonts,
  indexLegend,
  leave,
  neubrutal,
  playSearch,
  say,
  searchPlan,
} from '@motion-studio/video-kit';
import {finalSnap} from '../shared';

// ================================================================ B-TREE SEARCH
export function* btreeSearchSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const snap = finalSnap(false);
  const tv = new TreeView({x: 0, y: -235, scale: 1.35});
  const q = createRef<Txt>();
  const reads = createRef<Txt>();
  const sqlChip = (
    <Rect
      x={-560}
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
  const readBox = (
    <Rect x={-560} y={290} width={380} height={110} radius={20} fill={colors.surf} {...neubrutal(colors.orange, 8, 4)}>
      <Txt
        y={-28}
        text="PAGE READS"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={20}
        letterSpacing={3}
        fill={colors.mute}
      />
      <Txt ref={reads} y={16} text="0" fontFamily={fonts.mono} fontWeight={700} fontSize={56} fill={colors.ink} />
    </Rect>
  ) as Rect;
  const lg = indexLegend(250, 330, false);
  view.add(
    <Node ref={root} opacity={0}>
      {sqlChip}
      {tv.root}
      {readBox}
      {lg}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Searching: start at the root and compare the key against the keys in each node.');
  yield* tv.show(snap, 0.8);
  yield* waitFor(2.4);

  const runs: [number, string][] = [
    [25, 'A hit on the way down. Each node visited is one page read, so cost = height of the tree.'],
    [15, 'Lucky: in a B-tree a key can live in an internal node, so this search stops at the root.'],
    [11, 'Not found: still only one node per level is touched before we know for sure.'],
  ];
  for (const [key, after] of runs) {
    q().text(`SELECT * FROM t WHERE id = ${key};`);
    reads().text('0');
    yield* playSearch(tv, searchPlan(snap, key, false), key, {onVisit: n => reads().text(String(n))});
    yield* say(after, 2.6);
    yield* tv.unmark();
  }
  yield* say('Even with millions of keys, the tree stays this shallow because every node is wide.', 3.2);
  yield* leave(root());
}
