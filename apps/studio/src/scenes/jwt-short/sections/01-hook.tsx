import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, JWT_TOKEN, leave, pop, readSeconds, say, tokenStrip} from '@motion-studio/video-kit';
import {HOOK} from '../layout';

// HOOK — planned 7 s: token types in (1.1), two captions (2.8 + 2.8), chips and hold.
export function* hookSection(view: View2D): ThreadGenerator {
  const caption1 = 'Every login ends in a string like this.';
  const caption2 = 'It is called a JWT.';
  const root = createRef<Node>();
  const strip = tokenStrip({
    x: HOOK.strip.x,
    y: HOOK.strip.y,
    width: HOOK.strip.w,
    fontSize: 34,
    token: JWT_TOKEN,
  });
  const jwt = chip('JWT', colors.lime, {x: HOOK.jwtChip.x, y: HOOK.jwtChip.y, fs: 60, sh: 10}) as Node;
  const fullName = chip('JSON WEB TOKEN', colors.surf2, {
    x: HOOK.fullNameChip.x,
    y: HOOK.fullNameChip.y,
    fs: 30,
    color: colors.mute,
    shadow: colors.dim,
    sh: 5,
    mono: false,
  }) as Node;
  jwt.opacity(0);
  fullName.opacity(0);

  view.add(
    <Node ref={root}>
      {strip.node}
      {jwt}
      {fullName}
    </Node>,
  );

  yield* all(say(caption1, readSeconds(caption1)), strip.typeIn(1.1));
  yield* all(say(caption2, readSeconds(caption2)), pop(jwt, 0.3), delay(0.15, pop(fullName, 0.3)));
  yield* waitFor(0.7);
  yield* leave(root());
}
