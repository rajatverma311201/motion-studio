import {Line, Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, easeInOutCubic, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  CAPTIONS,
  DEMO_AES_IV_HEX,
  DEMO_AES_KEY_HEX,
  DEMO_AUTH_TAG_HEX,
  DEMO_CIPHERTEXT_HEX,
  DEMO_MESSAGE,
  chip,
  chipText,
  colors,
  fonts,
  keyIcon,
  leave,
  lockIcon,
  pop,
  processMachine,
  readSeconds,
  say,
  shortHex,
  slam,
  stamp,
  textMorphCard,
} from '@motion-studio/video-kit';
import {ENCRYPTION, MESSAGE} from '../layout';

// 05 ENCRYPTION — planned 80 s: AES-GCM in, the eavesdropper, decryption, the wrong key and the key-sharing question.
export function* encryptionSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS.encryption;
  const root = createRef<Node>();
  const questionKeyRef = createRef<Node>();
  const card = textMorphCard({
    x: MESSAGE.x,
    y: MESSAGE.y,
    w: MESSAGE.w,
    text: DEMO_MESSAGE,
    color: colors.pink,
    fontSize: 48,
  });
  const lock = lockIcon({
    x: ENCRYPTION.lock.x,
    y: ENCRYPTION.lock.y,
    size: 96,
    color: colors.pink,
    open: true,
  });
  const nonceChip = chip('NEVER REUSE A NONCE WITH THE SAME KEY', colors.surf2, {
    x: ENCRYPTION.nonce.x,
    y: ENCRYPTION.nonce.y,
    fs: 16,
    color: colors.pink,
    shadow: colors.dim,
    sh: 4,
  }) as Node;
  const machine = processMachine({
    x: ENCRYPTION.machine.x,
    y: ENCRYPTION.machine.y,
    w: ENCRYPTION.machine.w,
    h: ENCRYPTION.machine.h,
    label: 'AES-256-GCM',
    color: colors.pink,
    inputs: [
      {id: 'plaintext', label: 'PLAINTEXT'},
      {id: 'key', label: 'KEY'},
      {id: 'nonce', label: 'NONCE'},
    ],
    outputs: [
      {id: 'ciphertext', label: 'CIPHERTEXT'},
      {id: 'tag', label: 'TAG'},
    ],
  });
  const eavesdrop = chip(`EVE SEES ONLY ${shortHex(DEMO_CIPHERTEXT_HEX, 8)}`, colors.pink, {
    x: ENCRYPTION.eavesdrop.x,
    y: ENCRYPTION.eavesdrop.y,
    fs: 24,
    sh: 5,
  }) as Node;
  const keyChip = chip('SAME KEY', colors.lime, {x: 120, y: 0, fs: 24, sh: 5}) as Rect;
  const keyRow = (
    <Node x={ENCRYPTION.keyRow.x} y={ENCRYPTION.keyRow.y}>
      {keyIcon({x: -300, y: 0, size: 54, color: colors.pink})}
      {keyChip}
    </Node>
  ) as Node;
  const authFailed = stamp('AUTH FAILED', colors.red, {rot: -6, fs: 34});
  authFailed.x(ENCRYPTION.authFailed.x);
  authFailed.y(ENCRYPTION.authFailed.y);
  const question = (
    <Node x={ENCRYPTION.question.x} y={ENCRYPTION.question.y}>
      <Txt
        y={-90}
        text="HOW DO ALICE AND THE BANK SHARE THE KEY?"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={34}
        letterSpacing={1}
        fill={colors.red}
      />
      {chip('ALICE', colors.lime, {x: -450, y: 60, fs: 24, sh: 6})}
      {chip('BANK', colors.cyan, {x: 450, y: 60, fs: 24, sh: 6})}
      <Line
        y={120}
        points={[
          [-450, 0],
          [450, 0],
        ]}
        stroke={colors.red}
        lineWidth={3}
        lineDash={[10, 8]}
      />
      <Node ref={questionKeyRef} x={-450} y={120} opacity={0}>
        {keyIcon({x: 0, y: 0, size: 64, color: colors.red})}
        <Txt x={-19} y={-2} text="?" fontFamily={fonts.mono} fontWeight={700} fontSize={34} fill={colors.red} />
      </Node>
    </Node>
  ) as Node;

  nonceChip.opacity(0);
  machine.node.opacity(0);
  eavesdrop.opacity(0);
  keyRow.opacity(0);
  authFailed.opacity(0);
  question.opacity(0);

  view.add(
    <Node ref={root}>
      {card.node}
      {lock.node}
      {nonceChip}
      {machine.node}
      {eavesdrop}
      {keyRow}
      {authFailed}
      {question}
    </Node>,
  );

  yield* all(say(captions[0], readSeconds(captions[0])), pop(card.node, 0.35), pop(machine.node, 0.35));
  yield* waitFor(4.0);

  yield* all(
    say(captions[1], readSeconds(captions[1])),
    machine.run({
      plaintext: DEMO_MESSAGE,
      key: shortHex(DEMO_AES_KEY_HEX, 8),
      nonce: shortHex(DEMO_AES_IV_HEX, 8),
      ciphertext: shortHex(DEMO_CIPHERTEXT_HEX, 8),
      tag: shortHex(DEMO_AUTH_TAG_HEX, 8),
    }),
    card.morphTo(DEMO_CIPHERTEXT_HEX, 1.2, 11),
    lock.lock(),
  );
  yield* waitFor(4.0);

  yield* all(say(captions[2], readSeconds(captions[2])), pop(eavesdrop, 0.3));
  yield* waitFor(4.0);

  yield* all(
    say(captions[3], readSeconds(captions[3])),
    card.morphTo(DEMO_MESSAGE, 1.0, 29),
    keyRow.opacity(1, 0.3),
    eavesdrop.opacity(0, 0.25),
  );
  yield* waitFor(5.0);

  chipText(keyChip).text('WRONG KEY');
  yield* all(
    say(captions[4], readSeconds(captions[4])),
    keyChip.fill(colors.red, 0.2),
    card.morphTo(DEMO_CIPHERTEXT_HEX, 0.9, 53),
    delay(1.1, slam(authFailed, 0.4)),
  );
  yield* waitFor(5.0);

  yield* all(say(captions[5], readSeconds(captions[5])), pop(nonceChip, 0.3));
  yield* waitFor(5.0);

  yield* all(
    say(captions[6], readSeconds(captions[6])),
    card.node.opacity(0, 0.3),
    lock.node.opacity(0, 0.3),
    machine.node.opacity(0, 0.3),
    keyRow.opacity(0, 0.25),
    authFailed.opacity(0, 0.25),
    nonceChip.opacity(0, 0.25),
    question.opacity(1, 0.25),
  );
  yield* pop(questionKeyRef(), 0.3);
  yield* questionKeyRef().x(450, 1.6, easeInOutCubic);
  yield* waitFor(10.0);
  yield* leave(root());
}
