import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {
  TreeView,
  chip,
  colors,
  fonts,
  indexLegend,
  leave,
  pop,
  say,
  snapOf,
  boxStyle,
  radius,
} from '@motion-studio/video-kit';

// ================================================================ B-TREE RULES
export function* btreeRulesSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tv = new TreeView({x: -340, y: -200, scale: 1.35});
  const snap = snapOf('r', [
    ['r', [20, 40], ['a', 'b', 'c']],
    ['a', [5, 10, 15]],
    ['b', [25, 30, 35]],
    ['c', [45, 50]],
  ]);
  const rules: [string, string, string][] = [
    ['1', 'Keys inside a node are sorted', colors.lime],
    ['2', 'A node with k keys has k + 1 children', colors.cyan],
    ['3', 'Child i holds keys between key i−1 and key i', colors.pink],
    ['4', 'Every leaf sits at the same depth', colors.yellow],
    ['5', 'Every node except the root is at least half full', colors.violet],
  ];
  const cards = rules.map(
    ([n, t, col], i) =>
      (
        <Rect
          x={560}
          y={-250 + i * 100}
          width={700}
          height={82}
          radius={radius(18)}
          fill={colors.surf}
          {...boxStyle(col, 7, 4)}
          opacity={0}
        >
          <Rect x={-310} width={44} height={44} radius={radius(12)} fill={col}>
            <Txt text={n} fontFamily={fonts.mono} fontWeight={700} fontSize={26} fill={colors.onAccent} />
          </Rect>
          <Txt
            x={-270}
            offsetX={-1}
            text={t}
            fontFamily={fonts.sans}
            fontWeight={700}
            fontSize={24}
            fill={colors.ink}
          />
        </Rect>
      ) as Rect,
  );
  const lg = indexLegend(-330, 235, false);
  lg.opacity(0);
  const maxChip = chip('DEMO: MAX 3 KEYS PER NODE (4 CHILDREN)', colors.surf2, {
    x: -330,
    y: 165,
    fs: 18,
    sh: 0,
    color: colors.ink,
  }) as Rect;
  maxChip.opacity(0);
  view.add(
    <Node ref={root} opacity={0}>
      {tv.root}
      {cards}
      {lg}
      {maxChip}
    </Node>,
  );
  yield* root().opacity(1, 0.3);

  yield* say('A B-tree node is a sorted list of keys, with one more child than keys.');
  yield* tv.show(snap, 0.8);
  yield* all(lg.opacity(1, 0.4), maxChip.opacity(1, 0.4));
  yield* waitFor(2.5);

  // rule 1
  yield* say('Rule 1: the keys inside every node are kept sorted.');
  yield* all(cards[0].opacity(1, 0.3), tv.mark(['r', 'a', 'b', 'c'], colors.lime));
  yield* waitFor(2.8);
  yield* tv.unmark();

  // rule 2
  yield* say('Rule 2: a node with k keys has k + 1 children. The root has 2 keys and 3 children.');
  yield* all(cards[1].opacity(1, 0.3), tv.mark(['r'], colors.cyan));
  const kc = chip('2 KEYS → 3 CHILDREN', colors.cyan, {x: tv.at('r').x, y: tv.at('r').y - 84, fs: 20, sh: 4}) as Rect;
  root().add(kc);
  yield* pop(kc, 0.3);
  yield* waitFor(3);
  yield* all(kc.opacity(0, 0.3), tv.unmark());
  kc.remove();

  // rule 3
  yield* say('Rule 3: each child covers a key range. Left of 20, between 20 and 40, right of 40.');
  yield* cards[2].opacity(1, 0.3);
  const rc = ['< 20', '20 – 39', '≥ 40'].map((t, i) => {
    const kid = tv.at(['a', 'b', 'c'][i]);
    const r = tv.at('r');
    return chip(t, colors.pink, {
      x: (kid.x * 2 + r.x) / 3 + (i - 1) * 6,
      y: (kid.y + r.y) / 2 + 2,
      fs: 18,
      sh: 3,
    }) as Rect;
  });
  root().add(rc);
  yield* sequence(0.25, ...rc.map(c => pop(c, 0.3)));
  yield* waitFor(3.4);
  yield* all(...rc.map(c => c.opacity(0, 0.3)));
  rc.forEach(c => c.remove());

  // rule 4
  yield* say('Rule 4: all leaves are on the same level, so every lookup costs the same number of steps.');
  yield* all(cards[3].opacity(1, 0.3), tv.mark(['a', 'b', 'c'], colors.yellow));
  yield* waitFor(3.6);
  yield* tv.unmark();

  // rule 5
  yield* say('Rule 5: nodes stay at least half full (here: at least 1 key). No wasted, nearly empty pages.');
  yield* all(cards[4].opacity(1, 0.3), tv.mark(['r', 'a', 'b', 'c'], colors.violet));
  yield* waitFor(3.8);
  yield* tv.unmark();
  yield* say('These rules are kept true by splitting full nodes on insert, and merging thin ones on delete.', 3.4);
  yield* leave(root());
}
