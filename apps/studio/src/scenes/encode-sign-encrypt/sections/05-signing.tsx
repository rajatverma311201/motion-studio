import {Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  CAPTIONS,
  DEMO_HMAC,
  DEMO_HMAC_KEY,
  DEMO_HMAC_TAMPERED,
  DEMO_MESSAGE,
  DEMO_SIGNATURE_HEX,
  DEMO_TAMPERED_MESSAGE,
  boxStyle,
  chip,
  colors,
  fonts,
  keyIcon,
  leave,
  lockIcon,
  pop,
  processMachine,
  radius,
  readSeconds,
  say,
  shortHex,
  slam,
  stamp,
  textMorphCard,
} from '@motion-studio/video-kit';
import {MESSAGE, SIGNING} from '../layout';

interface KeySideOptions {
  x: number;
  y: number;
  owner: string;
  role: string;
  hint: string;
  color: string;
  locked: boolean;
}

function keySide(options: KeySideOptions): Rect {
  const {x, y, owner, role, hint, color, locked} = options;
  return (
    <Rect x={x} y={y} width={560} height={300} radius={radius(24)} fill={colors.surf} {...boxStyle(color, 8, 4)}>
      <Txt
        y={-110}
        text={`${owner} KEY`}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={22}
        letterSpacing={2}
        fill={color}
      />
      {keyIcon({x: -190, y: 0, size: 76, color})}
      {locked ? lockIcon({x: -90, y: 0, size: 62, color: colors.red, open: false}).node : null}
      <Txt
        x={locked ? -20 : -100}
        y={-16}
        offsetX={-1}
        text={role}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={30}
        letterSpacing={1}
        fill={color}
      />
      <Txt
        x={locked ? -20 : -100}
        y={26}
        offsetX={-1}
        text={hint}
        fontFamily={fonts.mono}
        fontSize={16}
        fill={colors.mute}
      />
    </Rect>
  ) as Rect;
}

function signatureCard(): Rect {
  return (
    <Rect
      x={SIGNING.signature.x}
      y={SIGNING.signature.y}
      width={SIGNING.signature.w}
      height={SIGNING.signature.h}
      radius={radius(18)}
      fill={colors.surf2}
      {...boxStyle(colors.yellow, 6, 3)}
    >
      <Txt
        x={-520}
        y={-22}
        offsetX={-1}
        text="SIGNATURE · 128 HEX"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={14}
        letterSpacing={2}
        fill={colors.mute}
      />
      <Txt
        x={-520}
        y={8}
        offsetX={-1}
        text={DEMO_SIGNATURE_HEX.slice(0, 64)}
        fontFamily={fonts.mono}
        fontSize={15}
        fill={colors.yellow}
      />
      <Txt
        x={-520}
        y={28}
        offsetX={-1}
        text={DEMO_SIGNATURE_HEX.slice(64)}
        fontFamily={fonts.mono}
        fontSize={15}
        fill={colors.yellow}
      />
    </Rect>
  ) as Rect;
}

// 04 SIGNING — planned 85 s: HMAC with a shared key, the tamper, then a digital signature.
export function* signingSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS.signing;
  const root = createRef<Node>();
  const card = textMorphCard({
    x: MESSAGE.x,
    y: MESSAGE.y,
    w: MESSAGE.w,
    text: DEMO_MESSAGE,
    color: colors.yellow,
    fontSize: 48,
  });
  const keyRow = (
    <Node x={SIGNING.keyRow.x} y={SIGNING.keyRow.y}>
      {keyIcon({x: -300, y: 0, size: 56, color: colors.yellow})}
      <Txt
        x={-250}
        y={0}
        offsetX={-1}
        text="SHARED KEY"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={22}
        letterSpacing={1}
        fill={colors.yellow}
      />
      {chip('ALICE', colors.surf2, {x: 120, y: 0, fs: 18, color: colors.lime, shadow: colors.dim, sh: 4})}
      {chip('BANK', colors.surf2, {x: 290, y: 0, fs: 18, color: colors.cyan, shadow: colors.dim, sh: 4})}
    </Node>
  ) as Node;
  const machine = processMachine({
    x: SIGNING.machine.x,
    y: SIGNING.machine.y,
    w: SIGNING.machine.w,
    h: SIGNING.machine.h,
    label: 'HMAC-SHA256',
    color: colors.yellow,
    inputs: [
      {id: 'message', label: 'MESSAGE'},
      {id: 'key', label: 'KEY'},
    ],
    outputs: [{id: 'tag', label: 'TAG'}],
  });
  const tagOriginal = chip(`TAG  ${shortHex(DEMO_HMAC, 8)}`, colors.lime, {
    x: -260,
    y: SIGNING.tagRow.y,
    fs: 18,
    sh: 4,
  }) as Node;
  const tagRecomputed = chip(`RECOMPUTED  ${shortHex(DEMO_HMAC, 8)}`, colors.surf2, {
    x: 260,
    y: SIGNING.tagRow.y,
    fs: 18,
    color: colors.lime,
    shadow: colors.dim,
    sh: 4,
  }) as Node;
  const tagTampered = chip(`NEW TAG  ${shortHex(DEMO_HMAC_TAMPERED, 8)}`, colors.red, {
    x: 260,
    y: SIGNING.tagRow.y,
    fs: 18,
    sh: 4,
  }) as Node;
  const match = stamp('MATCH', colors.lime, {rot: -4, fs: 26});
  match.x(0);
  match.y(SIGNING.tagRow.y);
  const tamper = chip('EVE EDITS: pay 500 → 900', colors.red, {
    x: SIGNING.tamper.x,
    y: SIGNING.tamper.y,
    fs: 26,
    sh: 6,
  }) as Node;
  const invalid = stamp('INVALID', colors.red, {rot: -6, fs: 40});
  invalid.x(SIGNING.invalid.x);
  invalid.y(SIGNING.invalid.y);
  const signature = signatureCard();
  const privateCard = keySide({
    x: SIGNING.privateCard.x,
    y: SIGNING.privateCard.y,
    owner: 'ALICE',
    role: 'SIGNS',
    hint: 'only the owner has this key',
    color: colors.yellow,
    locked: true,
  });
  const publicCard = keySide({
    x: SIGNING.publicCard.x,
    y: SIGNING.publicCard.y,
    owner: 'WORLD',
    role: 'VERIFIES',
    hint: 'anyone can hold this key',
    color: colors.cyan,
    locked: false,
  });
  const valid = chip('VALID', colors.lime, {
    x: SIGNING.valid.x,
    y: SIGNING.valid.y,
    fs: 32,
    sh: 6,
  }) as Node;
  const invalidSignature = chip('INVALID', colors.red, {
    x: SIGNING.invalidSignature.x,
    y: SIGNING.invalidSignature.y,
    fs: 32,
    sh: 6,
  }) as Node;
  const uses = [
    {x: -570, text: 'JWT RS256', color: colors.yellow},
    {x: -190, text: 'CERTIFICATES', color: colors.cyan},
    {x: 190, text: 'SOFTWARE UPDATES', color: colors.lime},
    {x: 570, text: 'GIT COMMITS', color: colors.violet},
  ].map(item =>
    chip(item.text, colors.surf2, {
      x: item.x,
      y: SIGNING.uses.y,
      fs: 22,
      color: item.color,
      shadow: colors.dim,
      sh: 4,
    }),
  );

  keyRow.opacity(0);
  machine.node.opacity(0);
  tagOriginal.opacity(0);
  tagRecomputed.opacity(0);
  tagTampered.opacity(0);
  match.opacity(0);
  tamper.opacity(0);
  invalid.opacity(0);
  signature.opacity(0);
  privateCard.opacity(0);
  publicCard.opacity(0);
  valid.opacity(0);
  invalidSignature.opacity(0);
  for (const item of uses) item.opacity(0);

  view.add(
    <Node ref={root}>
      {card.node}
      {keyRow}
      {machine.node}
      {tagOriginal}
      {tagRecomputed}
      {tagTampered}
      {match}
      {tamper}
      {invalid}
      {signature}
      {privateCard}
      {publicCard}
      {valid}
      {invalidSignature}
      {uses}
    </Node>,
  );

  yield* all(
    say(captions[0], readSeconds(captions[0])),
    pop(card.node, 0.35),
    pop(keyRow, 0.3),
    delay(0.2, pop(machine.node, 0.35)),
  );
  yield* waitFor(4.0);

  yield* all(
    say(captions[1], readSeconds(captions[1])),
    machine.run({message: DEMO_MESSAGE, key: DEMO_HMAC_KEY, tag: shortHex(DEMO_HMAC, 8)}),
  );
  yield* pop(tagOriginal, 0.3);
  yield* waitFor(4.0);

  yield* all(
    say(captions[2], readSeconds(captions[2])),
    machine.run({message: DEMO_MESSAGE, key: DEMO_HMAC_KEY, tag: shortHex(DEMO_HMAC, 8)}),
  );
  yield* all(pop(tagRecomputed, 0.3), delay(0.2, slam(match, 0.35)));
  yield* waitFor(5.0);

  yield* all(say(captions[3], readSeconds(captions[3])), keyRow.opacity(0, 0.25), pop(tamper, 0.3));
  yield* card.swap(DEMO_TAMPERED_MESSAGE);
  yield* all(
    machine.run({message: DEMO_TAMPERED_MESSAGE, key: DEMO_HMAC_KEY, tag: shortHex(DEMO_HMAC_TAMPERED, 8)}),
    match.opacity(0, 0.2),
    tagRecomputed.opacity(0, 0.2),
  );
  yield* all(pop(tagTampered, 0.3), delay(0.2, slam(invalid, 0.4)));
  yield* waitFor(5.0);

  yield* say(captions[4], readSeconds(captions[4]));
  yield* waitFor(5.0);

  yield* all(
    say(captions[5], readSeconds(captions[5])),
    machine.node.opacity(0, 0.3),
    tamper.opacity(0, 0.25),
    tagOriginal.opacity(0, 0.2),
    tagTampered.opacity(0, 0.2),
    invalid.opacity(0, 0.25),
    card.swap(DEMO_MESSAGE),
    pop(signature, 0.35),
    delay(0.15, pop(privateCard, 0.35)),
    delay(0.3, pop(publicCard, 0.35)),
    delay(0.45, pop(valid, 0.3)),
  );
  yield* waitFor(6.0);

  yield* all(
    say(captions[6], readSeconds(captions[6])),
    card.swap(DEMO_TAMPERED_MESSAGE),
    pop(invalidSignature, 0.3),
    pop(uses[0], 0.3),
    delay(0.12, pop(uses[1], 0.3)),
    delay(0.24, pop(uses[2], 0.3)),
    delay(0.36, pop(uses[3], 0.3)),
  );
  yield* waitFor(10.0);
  yield* leave(root());
}
