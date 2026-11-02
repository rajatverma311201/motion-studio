import {Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {boxStyle, chip, colors, fonts, leave, pop, radius, readSeconds, say} from '@motion-studio/video-kit';
import {RECAP} from '../layout';

const ITEMS = [
  ['01', 'STRUCTURE', 'header . payload . signature', colors.pink],
  ['02', 'ENCODED', 'not encrypted, anyone can read', colors.yellow],
  ['03', 'SIGNED', 'proves it was not changed', colors.orange],
  ['04', 'VERIFY', 'signature, then exp nbf iss aud', colors.lime],
  ['05', 'KEYS', 'shared secret or key pair, pin the algorithm', colors.red],
] as const;

// 10 RECAP — planned 35 s: five rules, then the two closing tags.
export function* recapSection(view: View2D): ThreadGenerator {
  const captions = [
    'A JWT is header, payload and signature, joined by dots.',
    'Base64URL is encoding. Anyone can read it. Never store secrets in it.',
    'The signature proves it was not changed. Verify it, then verify the claims.',
    'Shared secret or key pair. Pin the algorithm. Keep tokens short-lived.',
    'Signed is not secret. That is the whole lesson.',
  ];
  const root = createRef<Node>();
  const positions = [RECAP.row1, RECAP.row2, RECAP.row3, RECAP.row4, RECAP.row5];
  const rows = ITEMS.map(([number, title, detail, color], index) => {
    const position = positions[index];
    const row = (
      <Rect
        y={position.y}
        width={position.w}
        height={position.h}
        radius={radius(20)}
        fill={colors.surf}
        {...boxStyle(color, 7, 4)}
        opacity={0}
      >
        <Rect x={-680} width={64} height={64} radius={radius(14)} fill={color}>
          <Txt text={number} fontFamily={fonts.mono} fontWeight={700} fontSize={22} fill={colors.onAccent} />
        </Rect>
        <Txt
          x={-620}
          offsetX={-1}
          text={title}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={32}
          letterSpacing={1}
          fill={colors.ink}
        />
        <Txt x={-260} offsetX={-1} text={detail} fontFamily={fonts.mono} fontSize={22} fill={colors.mute} />
      </Rect>
    ) as Rect;
    return row;
  });

  const signed = chip('SIGNED ≠ SECRET', colors.yellow, {
    x: RECAP.tag1.x,
    y: RECAP.tag1.y,
    fs: 30,
    sh: 9,
    mono: false,
  }) as Node;
  const short = chip('KEEP IT SHORT', colors.lime, {
    x: RECAP.tag2.x,
    y: RECAP.tag2.y,
    fs: 30,
    sh: 9,
    mono: false,
  }) as Node;
  signed.opacity(0);
  short.opacity(0);

  view.add(
    <Node ref={root}>
      {rows}
      {signed}
      {short}
    </Node>,
  );

  yield* all(say(captions[0], readSeconds(captions[0])), pop(rows[0], 0.3));
  yield* waitFor(1.0);

  yield* all(say(captions[1], readSeconds(captions[1])), pop(rows[1], 0.3));
  yield* waitFor(1.0);

  yield* all(say(captions[2], readSeconds(captions[2])), pop(rows[2], 0.3));
  yield* waitFor(1.0);

  yield* all(say(captions[3], readSeconds(captions[3])), pop(rows[3], 0.3), delay(0.2, pop(rows[4], 0.3)));
  yield* waitFor(1.5);

  yield* all(say(captions[4], readSeconds(captions[4])), pop(signed, 0.35), delay(0.2, pop(short, 0.35)));
  yield* waitFor(3.0);
  yield* leave(root());
}
