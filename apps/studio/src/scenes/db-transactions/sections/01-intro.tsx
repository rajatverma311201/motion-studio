import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {chip, colors, fonts, leave, pop, say, stackedTitle, boxStyle, radius} from '@motion-studio/video-kit';

// ================================================================ 00 INTRO
export function* introSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const l1 = stackedTitle({text: 'DB', fontSize: 240, y: -200});
  const l2 = stackedTitle({text: 'TRANSACTIONS', fontSize: 168, y: 10});
  const sub = chip('ALL OR NOTHING.', colors.yellow, {
    fs: 40,
    rot: -2,
    y: 175,
    sh: 8,
    mono: false,
  }) as Rect;
  const cols = [colors.lime, colors.cyan, colors.pink, colors.yellow];
  const tiles = 'ACID'.split('').map(
    (ch, i) =>
      (
        <Rect
          x={(i - 1.5) * 150}
          y={330}
          width={118}
          height={118}
          radius={radius(22)}
          fill={cols[i]}
          {...boxStyle(colors.ink, 7, 4)}
        >
          <Txt text={ch} fontFamily={fonts.sans} fontWeight={700} fontSize={84} fill={colors.onAccent} />
        </Rect>
      ) as Rect,
  );
  l1.x(-1400);
  l2.x(1400);
  sub.opacity(0);
  tiles.forEach(t => t.opacity(0));
  view.add(
    <Node ref={root} opacity={0}>
      {l1}
      {l2}
      {sub}
      {tiles}
    </Node>,
  );
  yield* root().opacity(1, 0.2);
  yield* say('A transaction groups many steps into one unit. All of them happen, or none do.');
  yield* all(l1.x(0, 0.8, easeOutCubic), delay(0.25, l2.x(0, 0.8, easeOutCubic)));
  yield* pop(sub, 0.35);
  yield* sequence(0.18, ...tiles.map(t => pop(t, 0.3)));
  yield* waitFor(2.6);
  yield* leave(root());
}
