import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, easeInOutCubic, waitFor} from '@motion-canvas/core';
import {chip, colors, fonts, leave, pop, say} from '@motion-studio/video-kit';

function bigText(text: string, fs: number, y: number, ls = -2, off = 9): Node {
  const t = (fill: string, d: number) =>
    (
      <Txt
        text={text}
        fontSize={fs}
        fontWeight={700}
        fontFamily={fonts.sans}
        fill={fill}
        x={d}
        y={d}
        letterSpacing={ls}
      />
    ) as Txt;
  return (
    <Node y={y}>
      {t(colors.pink, off * 2)}
      {t(colors.cyan, off)}
      {t(colors.ink, 0)}
    </Node>
  ) as Node;
}

// ================================================================ INTRO
export function* introSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const l1 = bigText('DB INDEXING', 190, -210);
  const l2 = bigText('B-TREE & B+TREE', 118, -40, -1, 7);
  const sub = chip('HOW DATABASES FIND ROWS FAST', colors.yellow, {
    fs: 36,
    rot: -2,
    y: 110,
    sh: 8,
    mono: false,
  }) as Rect;
  const slow = chip('O(n)', colors.red, {fs: 54, x: -250, y: 285, color: colors.ink, sh: 8}) as Rect;
  const fast = chip('O(log n)', colors.lime, {fs: 54, x: 250, y: 285, sh: 8}) as Rect;
  const arrow = (
    <Line
      points={[
        [-130, 285],
        [90, 285],
      ]}
      stroke={colors.ink}
      lineWidth={7}
      endArrow
      arrowSize={20}
      end={0}
    />
  ) as Line;
  l1.x(-1500);
  l2.x(1500);
  [sub, slow, fast].forEach(n => n.opacity(0));
  view.add(
    <Node ref={root} opacity={0}>
      {l1}
      {l2}
      {sub}
      {slow}
      {arrow}
      {fast}
    </Node>,
  );
  yield* root().opacity(1, 0.2);
  yield* say('Why is a lookup instant with an index, and painfully slow without one?');
  yield* all(l1.x(0, 0.8, easeInOutCubic), delay(0.25, l2.x(0, 0.8, easeInOutCubic)));
  yield* pop(sub, 0.35);
  yield* pop(slow, 0.3);
  yield* arrow.end(1, 0.6);
  yield* pop(fast, 0.3);
  yield* waitFor(3.2);
  yield* leave(root());
}
