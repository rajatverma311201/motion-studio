import {Node, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  chip,
  colors,
  fonts,
  hmacMachine,
  JWT_SIGNATURE,
  JWT_TAMPERED_PAYLOAD,
  JWT_TAMPERED_SIGNATURE,
  JWT_TOKEN,
  leave,
  pop,
  readSeconds,
  say,
  slam,
  stamp,
  tokenStrip,
} from '@motion-studio/video-kit';
import {SIGNING} from '../layout';

// 05 SIGNING — planned 75 s: build the input, sign, verify, tamper, reject.
export function* signingSection(view: View2D): ThreadGenerator {
  const captions = [
    'To sign, we glue the header and payload together with a dot.',
    'Then we run HMAC-SHA256 with a secret key that only the server knows.',
    'Out comes a fixed-size tag. Base64URL turns it into the signature.',
    'Now the token is complete: header, payload, signature.',
    'The server receives it and recomputes the signature itself.',
    'Same bytes, same key, same result. The signatures match: valid.',
    'Now an attacker edits the payload: role user becomes admin.',
    'The server recomputes. The result differs, so the token is rejected.',
    'The attacker cannot fix the signature without the secret key.',
  ];
  const root = createRef<Node>();
  const strip = tokenStrip({
    x: SIGNING.strip.x,
    y: SIGNING.strip.y,
    width: 1700,
    fontSize: 24,
    token: JWT_TOKEN,
  });
  strip.node.opacity(0);

  const headerChip = chip('header', colors.pink, {
    x: SIGNING.headerChip.x,
    y: SIGNING.headerChip.y,
    fs: 32,
    sh: 7,
  }) as Node;
  const dot = (
    <Txt
      x={SIGNING.dot.x}
      y={SIGNING.dot.y}
      text="."
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={58}
      fill={colors.ink}
    />
  ) as Txt;
  const payloadChip = chip('payload', colors.cyan, {
    x: SIGNING.payloadChip.x,
    y: SIGNING.payloadChip.y,
    fs: 32,
    sh: 7,
  }) as Node;
  const signingInput = chip('header.payload', colors.surf2, {
    x: SIGNING.signingInput.x,
    y: SIGNING.signingInput.y,
    fs: 30,
    color: colors.ink,
    shadow: colors.yellow,
    sh: 7,
  }) as Node;
  headerChip.opacity(0);
  dot.opacity(0);
  payloadChip.opacity(0);
  signingInput.opacity(0);

  const machine = hmacMachine({
    x: SIGNING.machine.x,
    y: SIGNING.machine.y,
    w: SIGNING.machine.w,
    h: SIGNING.machine.h,
  });

  const sigOriginal = chip(JWT_SIGNATURE, colors.surf2, {
    x: SIGNING.sigOriginal.x,
    y: SIGNING.sigOriginal.y,
    fs: 18,
    color: colors.lime,
    shadow: colors.lime,
    sh: 4,
  }) as Node;
  const sigRecomputed = chip(JWT_SIGNATURE, colors.surf2, {
    x: SIGNING.sigRecomputed.x,
    y: SIGNING.sigRecomputed.y,
    fs: 18,
    color: colors.lime,
    shadow: colors.lime,
    sh: 4,
  }) as Node;
  const match = stamp('MATCH', colors.lime, {rot: -4, fs: 36});
  match.x(SIGNING.match.x);
  match.y(SIGNING.match.y);
  const tamper = chip('role: "user"  →  "admin"', colors.surf2, {
    x: SIGNING.tamper.x,
    y: SIGNING.tamper.y,
    fs: 26,
    color: colors.red,
    shadow: colors.red,
    sh: 5,
  }) as Node;
  const tamperOriginal = chip(JWT_SIGNATURE, colors.surf2, {
    x: SIGNING.tamperOriginal.x,
    y: SIGNING.tamperOriginal.y,
    fs: 18,
    color: colors.lime,
    shadow: colors.lime,
    sh: 4,
  }) as Node;
  const tamperRecomputed = chip(JWT_TAMPERED_SIGNATURE, colors.surf2, {
    x: SIGNING.tamperRecomputed.x,
    y: SIGNING.tamperRecomputed.y,
    fs: 18,
    color: colors.red,
    shadow: colors.red,
    sh: 4,
  }) as Node;
  const invalid = stamp('INVALID', colors.red, {rot: -7, fs: 48});
  invalid.x(SIGNING.invalid.x);
  invalid.y(SIGNING.invalid.y);
  const note = chip('SERVER REJECTS · 401', colors.red, {
    x: SIGNING.note.x,
    y: SIGNING.note.y,
    fs: 30,
    sh: 7,
  }) as Node;

  sigOriginal.opacity(0);
  sigRecomputed.opacity(0);
  match.opacity(0);
  tamper.opacity(0);
  tamperOriginal.opacity(0);
  tamperRecomputed.opacity(0);
  invalid.opacity(0);
  note.opacity(0);

  view.add(
    <Node ref={root}>
      {strip.node}
      {headerChip}
      {dot}
      {payloadChip}
      {signingInput}
      {machine.node}
      {sigOriginal}
      {sigRecomputed}
      {match}
      {tamper}
      {tamperOriginal}
      {tamperRecomputed}
      {invalid}
      {note}
    </Node>,
  );

  yield* all(
    say(captions[0], readSeconds(captions[0])),
    pop(headerChip, 0.3),
    delay(0.12, pop(dot, 0.25)),
    delay(0.24, pop(payloadChip, 0.3)),
  );
  yield* waitFor(2.0);

  yield* all(say(captions[1], readSeconds(captions[1])), pop(signingInput, 0.35));
  yield* waitFor(2.0);

  yield* all(
    say(captions[2], readSeconds(captions[2])),
    machine.run({message: 'header.payload', key: 'SECRET', tag: JWT_SIGNATURE}),
  );
  yield* waitFor(3.0);

  yield* all(say(captions[3], readSeconds(captions[3])), strip.node.opacity(1, 0.2), strip.typeIn(1.0));
  yield* waitFor(3.0);

  yield* all(
    headerChip.opacity(0, 0.2),
    dot.opacity(0, 0.2),
    payloadChip.opacity(0, 0.2),
    signingInput.opacity(0, 0.2),
  );
  yield* all(
    say(captions[4], readSeconds(captions[4])),
    pop(sigOriginal, 0.3),
    delay(0.35, machine.run({message: 'header.payload', key: 'SECRET', tag: JWT_SIGNATURE})),
  );
  yield* waitFor(2.0);

  yield* all(say(captions[5], readSeconds(captions[5])), pop(sigRecomputed, 0.3), delay(0.25, slam(match, 0.4)));
  yield* waitFor(4.0);

  yield* all(sigOriginal.opacity(0, 0.2), sigRecomputed.opacity(0, 0.2), match.opacity(0, 0.2));
  yield* all(
    say(captions[6], readSeconds(captions[6])),
    strip.replacePart('payload', JWT_TAMPERED_PAYLOAD),
    pop(tamper, 0.3),
  );
  yield* all(pop(tamperOriginal, 0.3), machine.node.y(180, 0.35));
  yield* waitFor(1.0);
  yield* machine.run({message: 'header.adminPayload', key: 'SECRET', tag: JWT_TAMPERED_SIGNATURE});
  yield* waitFor(1.0);

  yield* all(say(captions[7], readSeconds(captions[7])), pop(tamperRecomputed, 0.3));
  yield* waitFor(3.0);

  yield* all(say(captions[8], readSeconds(captions[8])), slam(invalid, 0.45));
  yield* waitFor(1.0);
  yield* all(machine.node.opacity(0, 0.3), pop(note, 0.35));
  yield* waitFor(5.0);
  yield* leave(root());
}
