import {Line, Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  borderWidth,
  chip,
  colors,
  DEMO_BASE64,
  DEMO_MESSAGE,
  fonts,
  keyIcon,
  leave,
  pop,
  radius,
  readSeconds,
  say,
  slam,
  stamp,
  textMorphCard,
} from '@motion-studio/video-kit';
import {ENCODING} from '../layout';

// ENCODING — planned 11 s: morph to Base64 (1.1), hold, morph back with the key slot and the stamp.
export function* encodingSection(view: View2D): ThreadGenerator {
  const caption1 = 'Encoding changes the format, not the secrecy.';
  const caption2 = 'There is no key. Anyone can undo it.';
  const root = createRef<Node>();
  const card = textMorphCard({
    x: ENCODING.card.x,
    y: ENCODING.card.y,
    w: ENCODING.card.w,
    text: DEMO_MESSAGE,
    color: colors.cyan,
    fontSize: 64,
  });
  const keySlot = (
    <Rect
      x={ENCODING.keySlot.x}
      y={ENCODING.keySlot.y}
      width={ENCODING.keySlot.w}
      height={ENCODING.keySlot.h}
      radius={radius(24)}
      fill={colors.surf2}
      stroke={colors.dim}
      lineWidth={borderWidth(3)}
      lineDash={[12, 10]}
    >
      <Txt
        x={90}
        text="KEY"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={40}
        letterSpacing={4}
        fill={colors.mute}
      />
      {keyIcon({x: -120, y: 0, size: 88, color: colors.red})}
      <Line
        points={[
          [-160, -54],
          [-80, 54],
        ]}
        stroke={colors.red}
        lineWidth={borderWidth(7)}
        lineCap="round"
      />
    </Rect>
  ) as Rect;
  const noKey = chip('NO KEY', colors.red, {x: ENCODING.noKey.x, y: ENCODING.noKey.y, fs: 40, sh: 8}) as Node;
  const undo = stamp('ANYONE CAN UNDO THIS', colors.red, {rot: -5, fs: 46});
  undo.x(ENCODING.stamp.x);
  undo.y(ENCODING.stamp.y);
  keySlot.opacity(0);
  noKey.opacity(0);
  undo.opacity(0);

  view.add(
    <Node ref={root}>
      {card.node}
      {keySlot}
      {noKey}
      {undo}
    </Node>,
  );

  yield* all(say(caption1, readSeconds(caption1)), card.morphTo(DEMO_BASE64, 1.1, 23));
  yield* waitFor(1.4);
  yield* all(
    say(caption2, readSeconds(caption2)),
    keySlot.opacity(1, 0.3),
    pop(noKey, 0.3),
    delay(0.4, card.morphTo(DEMO_MESSAGE, 0.9, 41)),
    delay(1.3, slam(undo, 0.4)),
  );
  yield* waitFor(2.8);
  yield* leave(root());
}
