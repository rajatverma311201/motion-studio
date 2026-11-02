import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, leave, pop, readSeconds, say} from '@motion-studio/video-kit';
import {TAKEAWAY} from '../layout';

// TAKEAWAY — planned 8 s: three chips pop with one caption each.
export function* takeawaySection(view: View2D): ThreadGenerator {
  const caption1 = 'Signed does not mean secret.';
  const caption2 = 'Never put passwords in a JWT.';
  const caption3 = 'Full deep dive on the channel.';
  const root = createRef<Node>();
  const signed = chip('SIGNED ≠ SECRET', colors.yellow, {
    x: TAKEAWAY.signed.x,
    y: TAKEAWAY.signed.y,
    fs: 54,
    sh: 10,
  }) as Node;
  const noPasswords = chip('NO PASSWORDS IN A JWT', colors.red, {
    x: TAKEAWAY.noPasswords.x,
    y: TAKEAWAY.noPasswords.y,
    fs: 54,
    sh: 10,
  }) as Node;
  const channel = chip('FULL JWT DEEP DIVE ON THE CHANNEL', colors.surf2, {
    x: TAKEAWAY.channel.x,
    y: TAKEAWAY.channel.y,
    fs: 30,
    color: colors.mute,
    shadow: colors.dim,
    sh: 5,
  }) as Node;
  signed.opacity(0);
  noPasswords.opacity(0);
  channel.opacity(0);

  view.add(
    <Node ref={root}>
      {signed}
      {noPasswords}
      {channel}
    </Node>,
  );

  yield* all(say(caption1, readSeconds(caption1)), pop(signed, 0.3));
  yield* all(say(caption2, readSeconds(caption2)), pop(noPasswords, 0.3));
  yield* all(say(caption3, readSeconds(caption3)), delay(0.1, pop(channel, 0.3)));
  yield* waitFor(0.2);
  yield* leave(root());
}
