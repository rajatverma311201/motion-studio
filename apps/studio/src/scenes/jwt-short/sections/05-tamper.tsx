import {Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  chip,
  codePanel,
  colors,
  fonts,
  hmacMachine,
  JWT_PAYLOAD_JSON,
  JWT_TAMPERED_PAYLOAD,
  JWT_TAMPERED_PAYLOAD_JSON,
  JWT_TAMPERED_SIGNATURE,
  JWT_TOKEN,
  leave,
  pop,
  radius,
  readSeconds,
  revealLines,
  say,
  slam,
  stamp,
  tokenize,
  tokenStrip,
  withAlpha,
} from '@motion-studio/video-kit';
import {TAMPER} from '../layout';

function jsonLines(source: string): string[] {
  return JSON.stringify(JSON.parse(source), null, 2).split('\n');
}

/** Rebuild one JSON code line on the same glyph grid the code panel uses. */
function jsonLine(line: string, width: number, fs: number): Node {
  const cw = fs * 0.6;
  const tokens: Txt[] = [];
  let column = 0;

  for (const [text, color] of tokenize(line, 'json')) {
    if (text.trim().length > 0) {
      tokens.push(
        (
          <Txt
            x={column * cw}
            offsetX={-1}
            text={text}
            fontFamily={fonts.mono}
            fontSize={fs}
            fontWeight={400}
            fill={color}
          />
        ) as Txt,
      );
    }
    column += text.length;
  }

  return (<Node x={-width / 2 + 32}>{tokens}</Node>) as Node;
}

// TAMPER — planned 10 s: swap role, replace the payload base64, recompute, INVALID stamp.
export function* tamperSection(view: View2D): ThreadGenerator {
  const caption1 = 'Change one letter in the payload…';
  const caption2 = '…and the seal no longer matches.';
  const root = createRef<Node>();
  const strip = tokenStrip({
    x: TAMPER.strip.x,
    y: TAMPER.strip.y,
    width: TAMPER.strip.w,
    fontSize: 24,
    token: JWT_TOKEN,
  });
  const payloadPanel = codePanel({
    x: TAMPER.payloadCard.x,
    y: TAMPER.payloadCard.y,
    w: TAMPER.payloadCard.w,
    title: 'PAYLOAD',
    code: jsonLines(JWT_PAYLOAD_JSON),
    lang: 'json',
    accent: colors.red,
    fs: 20,
  });
  const machine = hmacMachine({
    x: TAMPER.machine.x,
    y: TAMPER.machine.y,
    w: TAMPER.machine.w,
    h: TAMPER.machine.h,
  });
  const originalChip = chip('TOKEN SEAL  XpQ15Es-…', colors.surf2, {
    x: TAMPER.originalChip.x,
    y: TAMPER.originalChip.y,
    fs: 22,
    color: colors.mute,
    shadow: colors.dim,
    sh: 4,
  }) as Node;
  const newChip = chip('NOW  _dyqMnm3…', colors.red, {
    x: TAMPER.newChip.x,
    y: TAMPER.newChip.y,
    fs: 22,
    sh: 4,
  }) as Node;
  const invalid = stamp('INVALID', colors.red, {rot: -8, fs: 64});
  invalid.x(TAMPER.stamp.x);
  invalid.y(TAMPER.stamp.y);
  invalid.opacity(0);
  originalChip.opacity(0);
  newChip.opacity(0);
  payloadPanel.node.opacity(0);

  view.add(
    <Node ref={root}>
      {strip.node}
      {payloadPanel.node}
      {machine.node}
      {originalChip}
      {newChip}
      {invalid}
    </Node>,
  );

  yield* all(
    say(caption1, readSeconds(caption1)),
    strip.typeIn(0.5),
    payloadPanel.node.opacity(1, 0.3),
    delay(0.1, revealLines(payloadPanel)),
    delay(0.2, pop(originalChip, 0.3)),
  );
  yield* waitFor(1.0);

  const oldLine = payloadPanel.lines[3];
  yield* oldLine.opacity(0, 0.12);
  oldLine.remove();

  const flash = (
    <Rect
      y={payloadPanel.lineY(3)}
      width={TAMPER.payloadCard.w - 24}
      height={38}
      radius={radius(8)}
      fill={withAlpha(colors.yellow, 0.4)}
      opacity={0}
    />
  ) as Rect;
  payloadPanel.node.add(flash);

  const newLine = jsonLine(jsonLines(JWT_TAMPERED_PAYLOAD_JSON)[3], TAMPER.payloadCard.w, 20);
  newLine.x(-TAMPER.payloadCard.w / 2 + 32);
  newLine.y(payloadPanel.lineY(3));
  newLine.opacity(0);
  payloadPanel.node.add(newLine);

  flash.opacity(0.9);
  yield* all(newLine.opacity(1, 0.12), flash.opacity(0, 0.35));
  yield* all(...newLine.children().map(child => (child as Txt).scale(1.08, 0.1)));
  yield* all(...newLine.children().map(child => (child as Txt).scale(1, 0.15)));

  yield* strip.replacePart('payload', JWT_TAMPERED_PAYLOAD);
  yield* waitFor(1.0);

  yield* all(
    say(caption2, readSeconds(caption2)),
    machine.run({message: 'header.payload', key: 'SECRET', tag: JWT_TAMPERED_SIGNATURE}),
    delay(0.4, pop(newChip, 0.3)),
    delay(2.1, slam(invalid, 0.4)),
  );
  yield* waitFor(1.5);
  yield* leave(root());
}
