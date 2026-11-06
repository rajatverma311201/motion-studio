import {Line, Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  BASIC_AUTH_EXAMPLE,
  CAPTIONS,
  DEMO_BASE64,
  DEMO_HEX,
  DEMO_MESSAGE,
  DEMO_URL_ENCODED,
  boxStyle,
  borderWidth,
  chunkHex,
  codePanel,
  colors,
  fonts,
  keyIcon,
  leave,
  pop,
  radius,
  readSeconds,
  revealLines,
  say,
  slam,
  stamp,
  textMorphCard,
} from '@motion-studio/video-kit';
import {ENCODING, MESSAGE} from '../layout';

interface FormCardOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  value: string;
  fontSize?: number;
}

function formCard(options: FormCardOptions): Rect {
  const {x, y, w, h, title, value, fontSize = 22} = options;
  return (
    <Rect x={x} y={y} width={w} height={h} radius={radius(18)} fill={colors.surf} {...boxStyle(colors.cyan, 6, 3)}>
      <Txt
        y={-34}
        text={title}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={16}
        letterSpacing={2}
        fill={colors.mute}
      />
      <Txt y={18} text={value} fontFamily={fonts.mono} fontSize={fontSize} fill={colors.ink} />
    </Rect>
  ) as Rect;
}

// 02 ENCODING — planned 70 s: Base64 and back, the empty key slot, three forms, HTTP Basic and the stamp.
export function* encodingSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS.encoding;
  const root = createRef<Node>();
  const card = textMorphCard({
    x: MESSAGE.x,
    y: MESSAGE.y,
    w: MESSAGE.w,
    text: DEMO_MESSAGE,
    color: colors.cyan,
    fontSize: 48,
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
        x={80}
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
          [-164, -56],
          [-76, 56],
        ]}
        stroke={colors.red}
        lineWidth={borderWidth(7)}
        lineCap="round"
      />
    </Rect>
  ) as Rect;
  const hexCard = formCard({
    x: ENCODING.hex.x,
    y: ENCODING.hex.y,
    w: ENCODING.hex.w,
    h: ENCODING.hex.h,
    title: 'HEX',
    value: DEMO_HEX,
    fontSize: 22,
  });
  const urlCard = formCard({
    x: ENCODING.url.x,
    y: ENCODING.url.y,
    w: ENCODING.url.w,
    h: ENCODING.url.h,
    title: 'URL ENCODING',
    value: DEMO_URL_ENCODED,
    fontSize: 22,
  });
  const utf8Card = formCard({
    x: ENCODING.utf8.x,
    y: ENCODING.utf8.y,
    w: ENCODING.utf8.w,
    h: ENCODING.utf8.h,
    title: 'UTF-8 BYTES',
    value: chunkHex(DEMO_HEX, 2).join(' '),
    fontSize: 18,
  });
  const code = codePanel({
    x: ENCODING.code.x,
    y: ENCODING.code.y,
    w: ENCODING.code.w,
    title: 'request.http',
    code: [`Authorization: Basic ${BASIC_AUTH_EXAMPLE.base64}`],
    lang: 'http',
    accent: colors.cyan,
    fs: 20,
  });
  const arrow = (
    <Line
      x={ENCODING.arrow.x}
      y={ENCODING.arrow.y}
      points={[
        [-50, 0],
        [50, 0],
      ]}
      stroke={colors.cyan}
      lineWidth={4}
      endArrow
      arrowSize={16}
      opacity={0}
    />
  ) as Line;
  const decoded = (
    <Rect
      x={ENCODING.decoded.x}
      y={ENCODING.decoded.y}
      width={ENCODING.decoded.w}
      height={ENCODING.decoded.h}
      radius={radius(18)}
      fill={colors.surf}
      {...boxStyle(colors.lime, 6, 3)}
    >
      <Txt
        y={-20}
        text="DECODED"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={16}
        letterSpacing={2}
        fill={colors.mute}
      />
      <Txt y={18} text={BASIC_AUTH_EXAMPLE.plain} fontFamily={fonts.mono} fontSize={24} fill={colors.lime} />
    </Rect>
  ) as Rect;
  const formatStamp = stamp('FORMAT, NOT SECRECY', colors.red, {rot: -4, fs: 40});
  formatStamp.x(ENCODING.stamp.x);
  formatStamp.y(ENCODING.stamp.y);

  keySlot.opacity(0);
  hexCard.opacity(0);
  urlCard.opacity(0);
  utf8Card.opacity(0);
  code.node.opacity(0);
  decoded.opacity(0);
  formatStamp.opacity(0);

  view.add(
    <Node ref={root}>
      {card.node}
      {keySlot}
      {hexCard}
      {urlCard}
      {utf8Card}
      {code.node}
      {arrow}
      {decoded}
      {formatStamp}
    </Node>,
  );

  yield* all(say(captions[0], readSeconds(captions[0])), pop(card.node, 0.35));
  yield* waitFor(2.0);

  yield* all(say(captions[1], readSeconds(captions[1])), card.morphTo(DEMO_BASE64, 1.2, 23));
  yield* waitFor(3.0);

  yield* all(say(captions[2], readSeconds(captions[2])), card.morphTo(DEMO_MESSAGE, 0.9, 41), keySlot.opacity(1, 0.3));
  yield* waitFor(6.0);

  yield* all(
    say(captions[3], readSeconds(captions[3])),
    pop(hexCard, 0.3),
    delay(0.15, pop(urlCard, 0.3)),
    delay(0.3, pop(utf8Card, 0.3)),
  );
  yield* waitFor(5.0);

  yield* all(
    say(captions[4], readSeconds(captions[4])),
    code.node.opacity(1, 0.25),
    revealLines(code),
    arrow.opacity(1, 0.2),
    decoded.opacity(1, 0.25),
  );
  yield* waitFor(6.0);

  yield* all(say(captions[5], readSeconds(captions[5])), slam(formatStamp, 0.4));
  yield* waitFor(13.0);
  yield* leave(root());
}
