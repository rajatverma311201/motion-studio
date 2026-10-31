import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, sequence, waitFor} from '@motion-canvas/core';
import {chip, colors, fonts, leave, pop, say, stackedTitle, boxStyle, radius} from '@motion-studio/video-kit';

// ================================================================ 08 RECAP
export function* recapSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const items = [
    ['A', 'ATOMICITY', 'all steps happen, or none do', colors.lime],
    ['C', 'CONSISTENCY', 'the rules always hold', colors.cyan],
    ['I', 'ISOLATION', 'concurrent work stays apart', colors.pink],
    ['D', 'DURABILITY', 'committed means safe on disk (WAL)', colors.yellow],
  ];
  const rows = items.map(([l, n, d, col], i) => {
    const r = (
      <Rect
        x={0}
        y={-240 + i * 118}
        width={1200}
        height={96}
        radius={radius(20)}
        fill={colors.surf}
        {...boxStyle(col, 8, 4)}
      >
        <Rect x={-540} width={72} height={72} radius={radius(16)} fill={col}>
          <Txt text={l} fontFamily={fonts.sans} fontWeight={700} fontSize={50} fill={colors.onAccent} />
        </Rect>
        <Txt
          x={-480}
          offsetX={-1}
          text={n}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={36}
          letterSpacing={2}
          fill={colors.ink}
        />
        <Txt x={60} offsetX={-1} text={d} fontFamily={fonts.mono} fontSize={22} fill={colors.mute} />
      </Rect>
    ) as Rect;
    r.opacity(0);
    return r;
  });
  const tag = stackedTitle({text: 'COMMIT or ROLLBACK.', fontSize: 84, y: 250, letterSpacing: 1, offset: 5});
  const tag2 = chip('NEVER HALF.', colors.yellow, {
    fs: 44,
    rot: -2,
    y: 350,
    sh: 9,
    mono: false,
  }) as Rect;
  tag.opacity(0);
  tag2.opacity(0);
  view.add(
    <Node ref={root}>
      {rows}
      {tag}
      {tag2}
    </Node>,
  );
  yield* say('Four guarantees, one idea: group the steps, and treat them as a single unit.');
  yield* sequence(0.35, ...rows.map(r => pop(r, 0.4)));
  yield* waitFor(3);
  yield* say('When it matters, a transaction either fully happens or never happened at all.');
  yield* all(tag.opacity(1, 0.5), delay(0.5, pop(tag2, 0.4)));
  yield* waitFor(5);
  yield* leave(root());
}
