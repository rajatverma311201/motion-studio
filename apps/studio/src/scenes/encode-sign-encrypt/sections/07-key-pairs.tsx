import {Line, Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  CAPTIONS,
  DEMO_MESSAGE,
  boxStyle,
  chip,
  colors,
  compareTable,
  fonts,
  keyIcon,
  keyPairCard,
  leave,
  lockIcon,
  pop,
  radius,
  readSeconds,
  say,
  seededRandom,
  sequenceDiagram,
  textMorphCard,
} from '@motion-studio/video-kit';
import {KEY_PAIRS, MESSAGE} from '../layout';

function illustrativeHex(seed: number, length: number): string {
  const random = seededRandom(seed);
  const digits = '0123456789abcdef';
  let out = '';
  for (let index = 0; index < length; index++) out += digits[Math.floor(random() * digits.length)];
  return out;
}

function recipient(label: string, x: number, y: number, color: string): Node {
  return (
    <Node x={x} y={y}>
      <Rect width={260} height={90} radius={radius(20)} fill={colors.surf} {...boxStyle(color, 6, 3)}>
        <Txt text={label} fontFamily={fonts.mono} fontWeight={700} fontSize={26} letterSpacing={2} fill={color} />
      </Rect>
    </Node>
  ) as Node;
}

interface RoleCardOptions {
  x: number;
  y: number;
  owner: string;
  role: string;
  hint: string;
  color: string;
  locked: boolean;
}

function roleCard(options: RoleCardOptions): Rect {
  const {x, y, owner, role, hint, color, locked} = options;
  return (
    <Rect x={x} y={y} width={480} height={240} radius={radius(24)} fill={colors.surf} {...boxStyle(color, 8, 4)}>
      <Txt y={-84} text={owner} fontFamily={fonts.mono} fontWeight={700} fontSize={22} letterSpacing={2} fill={color} />
      {keyIcon({x: -130, y: 0, size: 68, color})}
      {locked ? lockIcon({x: -42, y: 0, size: 56, color: colors.red, open: false}).node : null}
      <Txt
        x={locked ? 20 : -60}
        y={-10}
        offsetX={-1}
        text={role}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={28}
        letterSpacing={1}
        fill={color}
      />
      <Txt
        x={locked ? 20 : -60}
        y={28}
        offsetX={-1}
        text={hint}
        fontFamily={fonts.mono}
        fontSize={15}
        fill={colors.mute}
      />
    </Rect>
  ) as Rect;
}

// 06 KEY PAIRS — planned 80 s: the bank's pair, the hand-out, flipped roles and hybrid encryption.
export function* keyPairsSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS['key-pairs'];
  const root = createRef<Node>();
  const messageCard = textMorphCard({
    x: MESSAGE.x,
    y: MESSAGE.y,
    w: MESSAGE.w,
    text: DEMO_MESSAGE,
    color: colors.violet,
    fontSize: 48,
  });
  const bank = keyPairCard({
    x: KEY_PAIRS.keyPair.x,
    y: KEY_PAIRS.keyPair.y,
    owner: 'BANK',
    color: colors.violet,
  });
  const alice = recipient('ALICE', KEY_PAIRS.alice.x, KEY_PAIRS.alice.y, colors.lime);
  const eve = recipient('EVE', KEY_PAIRS.eve.x, KEY_PAIRS.eve.y, colors.red);
  const aliceArrow = (
    <Line
      points={[
        [-300, 20],
        [-560, 120],
      ]}
      stroke={colors.violet}
      lineWidth={3}
      lineDash={[10, 8]}
      endArrow
      arrowSize={14}
      end={0}
    />
  ) as Line;
  const eveArrow = (
    <Line
      points={[
        [300, 20],
        [560, 120],
      ]}
      stroke={colors.violet}
      lineWidth={3}
      lineDash={[10, 8]}
      endArrow
      arrowSize={14}
      end={0}
    />
  ) as Line;
  const aliceCard = roleCard({
    x: KEY_PAIRS.aliceCard.x,
    y: KEY_PAIRS.aliceCard.y,
    owner: 'ALICE',
    role: 'ENCRYPTS',
    hint: 'with the public key',
    color: colors.lime,
    locked: false,
  });
  const bankCard = roleCard({
    x: KEY_PAIRS.bankCard.x,
    y: KEY_PAIRS.bankCard.y,
    owner: 'BANK',
    role: 'DECRYPTS',
    hint: 'with the private key',
    color: colors.violet,
    locked: true,
  });
  const illustrative = illustrativeHex(91, 28);
  const cipher = textMorphCard({
    x: KEY_PAIRS.cipherChip.x,
    y: KEY_PAIRS.cipherChip.y,
    w: KEY_PAIRS.cipherChip.w,
    text: DEMO_MESSAGE,
    color: colors.violet,
    fontSize: 26,
  });
  const illustrativeChip = chip('ILLUSTRATIVE BYTES', colors.surf2, {
    x: KEY_PAIRS.illustrative.x,
    y: KEY_PAIRS.illustrative.y,
    fs: 18,
    color: colors.violet,
    shadow: colors.dim,
    sh: 4,
  }) as Node;
  const roles = compareTable({
    x: KEY_PAIRS.rolesTable.x,
    y: KEY_PAIRS.rolesTable.y,
    w: KEY_PAIRS.rolesTable.w,
    columns: [
      {title: 'ENCRYPTION', color: colors.violet},
      {title: 'SIGNING', color: colors.yellow},
    ],
    rows: [
      {label: 'PUBLIC KEY', cells: ['encrypts', 'verifies']},
      {label: 'PRIVATE KEY', cells: ['decrypts', 'signs']},
    ],
    rowHeight: 96,
    fontSize: 24,
  });
  const hybrid = sequenceDiagram({
    x: KEY_PAIRS.hybrid.x,
    y: KEY_PAIRS.hybrid.y,
    w: KEY_PAIRS.hybrid.w,
    h: KEY_PAIRS.hybrid.h,
    actors: [
      {id: 'alice', label: 'ALICE', color: colors.lime},
      {id: 'bank', label: 'BANK', color: colors.violet},
    ],
  });

  alice.opacity(0);
  eve.opacity(0);
  aliceArrow.opacity(0);
  eveArrow.opacity(0);
  aliceCard.opacity(0);
  bankCard.opacity(0);
  cipher.node.opacity(0);
  illustrativeChip.opacity(0);
  roles.node.opacity(0);
  hybrid.node.opacity(0);

  view.add(
    <Node ref={root}>
      {messageCard.node}
      {bank.node}
      {alice}
      {eve}
      {aliceArrow}
      {eveArrow}
      {aliceCard}
      {bankCard}
      {cipher.node}
      {illustrativeChip}
      {roles.node}
      {hybrid.node}
    </Node>,
  );

  yield* all(
    say(captions[0], readSeconds(captions[0])),
    pop(messageCard.node, 0.35),
    pop(bank.node, 0.35),
    pop(alice, 0.3),
    pop(eve, 0.3),
    delay(0.2, bank.showPublic()),
  );
  yield* waitFor(5.0);

  yield* all(
    say(captions[1], readSeconds(captions[1])),
    bank.lockPrivate(),
    aliceArrow.opacity(1, 0.2),
    eveArrow.opacity(1, 0.2),
    aliceArrow.end(1, 0.5),
    eveArrow.end(1, 0.5),
  );
  yield* all(bank.handOut(KEY_PAIRS.alice.x, KEY_PAIRS.alice.y), bank.handOut(KEY_PAIRS.eve.x, KEY_PAIRS.eve.y));
  yield* waitFor(6.0);

  yield* all(
    say(captions[2], readSeconds(captions[2])),
    messageCard.node.opacity(0, 0.3),
    bank.node.opacity(0, 0.3),
    alice.opacity(0, 0.25),
    eve.opacity(0, 0.25),
    aliceArrow.opacity(0, 0.2),
    eveArrow.opacity(0, 0.2),
    pop(aliceCard, 0.35),
    pop(bankCard, 0.35),
    pop(cipher.node, 0.35),
  );
  yield* all(cipher.morphTo(illustrative, 1.0, 77), pop(illustrativeChip, 0.3));
  yield* waitFor(3.0);
  yield* all(cipher.morphTo(DEMO_MESSAGE, 0.9, 91), illustrativeChip.opacity(0, 0.25));
  yield* waitFor(4.0);

  yield* all(
    say(captions[3], readSeconds(captions[3])),
    aliceCard.opacity(0, 0.3),
    bankCard.opacity(0, 0.3),
    cipher.node.opacity(0, 0.3),
    illustrativeChip.opacity(0, 0.2),
    roles.node.opacity(1, 0.25),
  );
  yield* roles.revealAll();
  yield* waitFor(7.0);

  yield* all(say(captions[4], readSeconds(captions[4])), roles.node.opacity(0, 0.3), hybrid.node.opacity(1, 0.25));
  yield* all(
    hybrid.message('alice', 'bank', 'I need your public key'),
    delay(0.4, hybrid.message('bank', 'alice', 'public key', {color: colors.violet})),
  );
  yield* waitFor(7.0);

  yield* all(
    say(captions[5], readSeconds(captions[5])),
    hybrid.message('alice', 'bank', 'session key, encrypted', {chip: 'asymmetric step'}),
    delay(0.6, hybrid.message('alice', 'bank', 'AES-GCM data', {color: colors.lime, chip: 'fast symmetric'})),
  );
  yield* waitFor(15.0);
  yield* leave(root());
}
