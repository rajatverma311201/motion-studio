import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  chip,
  colors,
  DEMO_HMAC,
  DEMO_HMAC_KEY,
  DEMO_HMAC_TAMPERED,
  DEMO_MESSAGE,
  DEMO_TAMPERED_MESSAGE,
  hmacMachine,
  leave,
  pop,
  readSeconds,
  say,
  shake,
  shortHex,
  slam,
  stamp,
  textMorphCard,
} from '@motion-studio/video-kit';
import {SIGNING} from '../layout';

// SIGNING — planned 14 s: two machine runs (about 2 s each), the message swap and the TAMPERED stamp.
export function* signingSection(view: View2D): ThreadGenerator {
  const caption1 = 'Signing adds a tag only a key holder can make.';
  const caption2 = 'Change one digit and the tag no longer matches.';
  const caption3 = 'The message is still readable. Signing is about trust.';
  const root = createRef<Node>();
  const card = textMorphCard({
    x: SIGNING.card.x,
    y: SIGNING.card.y,
    w: SIGNING.card.w,
    text: DEMO_MESSAGE,
    color: colors.yellow,
    fontSize: 56,
  });
  const machine = hmacMachine({
    x: SIGNING.machine.x,
    y: SIGNING.machine.y,
    w: SIGNING.machine.w,
    h: SIGNING.machine.h,
  });
  const oldTag = chip(`OLD ${shortHex(DEMO_HMAC, 8)}`, colors.surf2, {
    x: SIGNING.oldChip.x,
    y: SIGNING.oldChip.y,
    fs: 36,
    color: colors.mute,
    shadow: colors.dim,
    sh: 6,
  }) as Node;
  const newTag = chip(`NEW ${shortHex(DEMO_HMAC_TAMPERED, 8)}`, colors.red, {
    x: SIGNING.newChip.x,
    y: SIGNING.newChip.y,
    fs: 36,
    sh: 6,
  }) as Node;
  const tampered = stamp('TAMPERED', colors.red, {rot: -6, fs: 56});
  tampered.x(SIGNING.stamp.x);
  tampered.y(SIGNING.stamp.y);
  oldTag.opacity(0);
  newTag.opacity(0);
  tampered.opacity(0);

  view.add(
    <Node ref={root}>
      {card.node}
      {machine.node}
      {oldTag}
      {newTag}
      {tampered}
    </Node>,
  );

  yield* all(
    say(caption1, readSeconds(caption1)),
    machine.run({message: DEMO_MESSAGE, key: DEMO_HMAC_KEY, tag: shortHex(DEMO_HMAC, 8)}),
  );
  yield* pop(oldTag, 0.3);
  yield* card.swap(DEMO_TAMPERED_MESSAGE);
  yield* all(
    say(caption2, readSeconds(caption2)),
    machine.run({message: DEMO_TAMPERED_MESSAGE, key: DEMO_HMAC_KEY, tag: shortHex(DEMO_HMAC_TAMPERED, 8)}),
  );
  yield* all(
    say(caption3, readSeconds(caption3)),
    pop(newTag, 0.3),
    delay(0.5, all(shake(oldTag, 8, 3), shake(newTag, 8, 3))),
  );
  yield* slam(tampered, 0.4);
  yield* waitFor(1.2);
  yield* leave(root());
}
