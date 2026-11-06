import {Line, Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  CAPTIONS,
  DEMO_BITS_DIFFERENT,
  DEMO_MESSAGE,
  DEMO_SHA256,
  DEMO_SHA256_TAMPERED,
  DEMO_TAMPERED_MESSAGE,
  avalancheGrid,
  boxStyle,
  chip,
  chunkHex,
  colors,
  fonts,
  hexToBits,
  leave,
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
import {HASHING, MESSAGE} from '../layout';

function usedRow(y: number, text: string): Node {
  return (
    <Node y={y}>
      <Txt x={-400} offsetX={-1} text="✓" fontFamily={fonts.mono} fontWeight={700} fontSize={26} fill={colors.lime} />
      <Txt x={-350} offsetX={-1} text={text} fontFamily={fonts.mono} fontSize={22} fill={colors.ink} />
    </Node>
  ) as Node;
}

// 03 HASHING — planned 80 s: SHA-256, the same answer twice, the avalanche, one-way and the recompute.
export function* hashingSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS.hashing;
  const root = createRef<Node>();
  const card = textMorphCard({
    x: MESSAGE.x,
    y: MESSAGE.y,
    w: MESSAGE.w,
    text: DEMO_MESSAGE,
    color: colors.orange,
    fontSize: 48,
  });
  const machine = processMachine({
    x: HASHING.machine.x,
    y: HASHING.machine.y,
    w: HASHING.machine.w,
    h: HASHING.machine.h,
    label: 'SHA-256',
    color: colors.orange,
    inputs: [{id: 'message', label: 'MESSAGE'}],
    outputs: [{id: 'digest', label: 'DIGEST'}],
  });
  const fingerprint = (
    <Rect
      x={HASHING.fingerprint.x}
      y={HASHING.fingerprint.y}
      width={HASHING.fingerprint.w}
      height={HASHING.fingerprint.h}
      radius={radius(22)}
      fill={colors.surf}
      {...boxStyle(colors.orange, 8, 4)}
    >
      <Txt
        x={-460}
        y={-64}
        offsetX={-1}
        text="SHA-256 FINGERPRINT"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={18}
        letterSpacing={2}
        fill={colors.mute}
      />
      {chunkHex(DEMO_SHA256, 16).map((row, index) => (
        <Txt
          y={-28 + index * 30}
          text={row}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={28}
          letterSpacing={1}
          fill={colors.orange}
        />
      ))}
    </Rect>
  ) as Rect;
  const sameChip = chip('SAME INPUT → SAME DIGEST', colors.lime, {
    x: HASHING.fingerprint.x + 330,
    y: HASHING.fingerprint.y - 64,
    fs: 15,
    sh: 4,
  }) as Node;
  const oneWay = (
    <Node x={HASHING.oneWay.x} y={HASHING.oneWay.y}>
      <Line
        y={-12}
        points={[
          [-400, 0],
          [280, 0],
        ]}
        stroke={colors.orange}
        lineWidth={5}
        endArrow
        arrowSize={20}
      />
      <Line
        y={18}
        points={[
          [320, 0],
          [-280, 0],
        ]}
        stroke={colors.red}
        lineWidth={4}
        lineDash={[10, 8]}
        endArrow
        arrowSize={16}
        opacity={0.7}
      />
      <Line
        y={18}
        points={[
          [-38, -22],
          [38, 22],
        ]}
        stroke={colors.red}
        lineWidth={5}
        lineCap="round"
      />
      <Line
        y={18}
        points={[
          [38, -22],
          [-38, 22],
        ]}
        stroke={colors.red}
        lineWidth={5}
        lineCap="round"
      />
    </Node>
  ) as Node;
  const usedFor = (
    <Rect
      x={HASHING.usedFor.x}
      y={HASHING.usedFor.y}
      width={HASHING.usedFor.w}
      height={HASHING.usedFor.h}
      radius={radius(22)}
      fill={colors.surf}
      {...boxStyle(colors.orange, 8, 4)}
    >
      <Txt
        y={-118}
        text="USED FOR"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={20}
        letterSpacing={2}
        fill={colors.mute}
      />
      {usedRow(-40, 'checksum of a download')}
      {usedRow(50, 'passwords (slow, salted)')}
    </Rect>
  ) as Rect;
  const grid = avalancheGrid({
    x: HASHING.avalanche.x,
    y: HASHING.avalanche.y,
    size: 320,
    bitsA: hexToBits(DEMO_SHA256),
    bitsB: hexToBits(DEMO_SHA256_TAMPERED),
  });
  const avalancheLabel = (
    <Txt
      x={HASHING.avalanche.x}
      y={HASHING.avalanche.y - 184}
      text={`AVALANCHE · ${DEMO_BITS_DIFFERENT} OF 256 BITS`}
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={18}
      letterSpacing={1}
      fill={colors.red}
    />
  ) as Txt;
  const tamperEdit = chip('EVE EDITS: pay 500 → 900', colors.red, {
    x: HASHING.tamperEdit.x,
    y: HASHING.tamperEdit.y,
    fs: 26,
    sh: 6,
  }) as Node;
  const originalChip = chip(`ORIGINAL  ${shortHex(DEMO_SHA256, 10)}`, colors.surf2, {
    x: HASHING.hashOriginal.x,
    y: HASHING.hashOriginal.y,
    fs: 22,
    color: colors.mute,
    shadow: colors.dim,
    sh: 5,
  }) as Node;
  const recomputedChip = chip(`RECOMPUTED  ${shortHex(DEMO_SHA256_TAMPERED, 10)}`, colors.surf2, {
    x: HASHING.hashRecomputed.x,
    y: HASHING.hashRecomputed.y,
    fs: 22,
    color: colors.red,
    shadow: colors.red,
    sh: 5,
  }) as Node;
  const matchChip = chip('BOTH MATCH', colors.lime, {
    x: HASHING.match.x,
    y: HASHING.match.y,
    fs: 22,
    sh: 5,
  }) as Node;
  const noOrigin = stamp('NO PROOF OF ORIGIN', colors.red, {rot: -5, fs: 36});
  noOrigin.x(HASHING.noOrigin.x);
  noOrigin.y(HASHING.noOrigin.y);

  machine.node.opacity(0);
  fingerprint.opacity(0);
  sameChip.opacity(0);
  oneWay.opacity(0);
  usedFor.opacity(0);
  grid.node.opacity(0);
  avalancheLabel.opacity(0);
  tamperEdit.opacity(0);
  originalChip.opacity(0);
  recomputedChip.opacity(0);
  matchChip.opacity(0);
  noOrigin.opacity(0);

  view.add(
    <Node ref={root}>
      {card.node}
      {machine.node}
      {fingerprint}
      {sameChip}
      {oneWay}
      {usedFor}
      {grid.node}
      {avalancheLabel}
      {tamperEdit}
      {originalChip}
      {recomputedChip}
      {matchChip}
      {noOrigin}
    </Node>,
  );

  yield* all(
    say(captions[0], readSeconds(captions[0])),
    pop(card.node, 0.35),
    pop(machine.node, 0.35),
    machine.run({message: DEMO_MESSAGE, digest: shortHex(DEMO_SHA256, 10)}),
  );
  yield* waitFor(4.0);

  yield* all(
    say(captions[1], readSeconds(captions[1])),
    machine.run({message: DEMO_MESSAGE, digest: shortHex(DEMO_SHA256, 10)}),
    fingerprint.opacity(1, 0.2),
  );
  yield* pop(sameChip, 0.3);
  yield* waitFor(5.0);

  yield* all(
    say(captions[2], readSeconds(captions[2])),
    card.swap(DEMO_TAMPERED_MESSAGE),
    machine.node.opacity(0, 0.3),
    fingerprint.opacity(0, 0.3),
    sameChip.opacity(0, 0.2),
    grid.node.opacity(1, 0.2),
    avalancheLabel.opacity(1, 0.2),
    grid.showA(),
  );
  yield* grid.morphToB();
  yield* waitFor(5.0);

  yield* all(say(captions[3], readSeconds(captions[3])), oneWay.opacity(1, 0.3));
  yield* waitFor(6.0);

  yield* all(say(captions[4], readSeconds(captions[4])), usedFor.opacity(1, 0.3));
  yield* waitFor(7.0);

  yield* all(
    say(captions[5], readSeconds(captions[5])),
    grid.node.opacity(0, 0.3),
    avalancheLabel.opacity(0, 0.3),
    usedFor.opacity(0, 0.3),
    oneWay.opacity(0, 0.3),
    pop(tamperEdit, 0.3),
    pop(originalChip, 0.3),
    delay(0.2, pop(recomputedChip, 0.3)),
    delay(0.4, pop(matchChip, 0.3)),
  );
  yield* waitFor(8.0);

  yield* all(say(captions[6], readSeconds(captions[6])), slam(noOrigin, 0.4));
  yield* waitFor(10.0);
  yield* leave(root());
}
