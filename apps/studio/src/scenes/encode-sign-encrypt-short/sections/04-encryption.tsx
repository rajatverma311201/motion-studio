import {Line, Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  chip,
  chipText,
  colors,
  DEMO_CIPHERTEXT_HEX,
  DEMO_MESSAGE,
  keyIcon,
  leave,
  lockIcon,
  pop,
  readSeconds,
  say,
  slam,
  stamp,
  textMorphCard,
} from '@motion-studio/video-kit';
import {ENCRYPTION} from '../layout';

// ENCRYPTION — planned 13 s: scramble under a closing lock, the eavesdropper chip, both keys and AUTH FAILED.
export function* encryptionSection(view: View2D): ThreadGenerator {
  const caption1 = 'Encryption hides the message. Only the key holder reads it.';
  const caption2 = 'The wrong key gets noise, or an error.';
  const root = createRef<Node>();
  const lock = lockIcon({
    x: ENCRYPTION.lock.x,
    y: ENCRYPTION.lock.y,
    size: 140,
    color: colors.pink,
    open: true,
  });
  const card = textMorphCard({
    x: ENCRYPTION.card.x,
    y: ENCRYPTION.card.y,
    w: ENCRYPTION.card.w,
    text: DEMO_MESSAGE,
    color: colors.pink,
    fontSize: 56,
  });
  const eavesdrop = chip('AN EAVESDROPPER SEES ONLY THIS', colors.pink, {
    x: ENCRYPTION.eavesdrop.x,
    y: ENCRYPTION.eavesdrop.y,
    fs: 36,
    sh: 7,
  }) as Node;
  const arrow = (
    <Line
      points={[
        [0, -185],
        [0, -340],
      ]}
      stroke={colors.pink}
      lineWidth={6}
      endArrow
      arrowSize={22}
      end={0}
      opacity={0}
    />
  ) as Line;
  const rightKey = keyIcon({x: ENCRYPTION.keyIcon.x, y: ENCRYPTION.keyIcon.y, size: 100, color: colors.lime});
  const wrongKey = keyIcon({x: ENCRYPTION.keyIcon.x, y: ENCRYPTION.keyIcon.y, size: 100, color: colors.mute});
  const keyChip = chip('RIGHT KEY', colors.lime, {
    x: ENCRYPTION.keyChip.x,
    y: ENCRYPTION.keyChip.y,
    fs: 40,
    sh: 8,
  });
  const authFailed = stamp('AUTH FAILED', colors.red, {rot: -6, fs: 52});
  authFailed.x(ENCRYPTION.stamp.x);
  authFailed.y(ENCRYPTION.stamp.y);
  eavesdrop.opacity(0);
  rightKey.opacity(0);
  wrongKey.opacity(0);
  keyChip.opacity(0);
  authFailed.opacity(0);

  view.add(
    <Node ref={root}>
      {lock.node}
      {card.node}
      {arrow}
      {eavesdrop}
      {rightKey}
      {wrongKey}
      {keyChip}
      {authFailed}
    </Node>,
  );

  yield* all(
    say(caption1, readSeconds(caption1)),
    card.morphTo(DEMO_CIPHERTEXT_HEX, 1.3, 11),
    lock.lock(),
    delay(0.5, pop(eavesdrop, 0.3)),
    delay(0.5, arrow.opacity(1, 0.2)),
    delay(0.5, arrow.end(1, 0.3)),
  );
  yield* waitFor(1.0);
  yield* all(
    pop(rightKey, 0.3),
    pop(keyChip, 0.3),
    card.morphTo(DEMO_MESSAGE, 1.0, 29),
    eavesdrop.opacity(0, 0.3),
    arrow.opacity(0, 0.3),
  );
  yield* waitFor(0.8);
  chipText(keyChip).text('WRONG KEY');
  yield* all(
    say(caption2, readSeconds(caption2)),
    rightKey.opacity(0, 0.2),
    pop(wrongKey, 0.3),
    keyChip.fill(colors.surf2, 0.2),
    card.morphTo(DEMO_CIPHERTEXT_HEX, 0.9, 53),
    delay(1.1, slam(authFailed, 0.4)),
  );
  yield* waitFor(2.2);
  yield* leave(root());
}
