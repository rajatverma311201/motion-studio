import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, JWT_TOKEN, leave, pop, readSeconds, say, tokenStrip} from '@motion-studio/video-kit';
import {PARTS} from '../layout';

// PARTS — planned 8 s: type-in (0.6), dot flash (0.6), three chips, three focus beats.
export function* partsSection(view: View2D): ThreadGenerator {
  const caption = 'Three parts, separated by two dots.';
  const root = createRef<Node>();
  const strip = tokenStrip({
    x: PARTS.strip.x,
    y: PARTS.strip.y,
    width: PARTS.strip.w,
    fontSize: 34,
    token: JWT_TOKEN,
  });
  const header = chip('HEADER', colors.pink, {x: PARTS.header.x, y: PARTS.header.y, fs: 34, sh: 7}) as Node;
  const payload = chip('PAYLOAD', colors.cyan, {x: PARTS.payload.x, y: PARTS.payload.y, fs: 34, sh: 7}) as Node;
  const signature = chip('SIGNATURE', colors.lime, {
    x: PARTS.signature.x,
    y: PARTS.signature.y,
    fs: 34,
    sh: 7,
  }) as Node;
  header.opacity(0);
  payload.opacity(0);
  signature.opacity(0);

  view.add(
    <Node ref={root}>
      {strip.node}
      {header}
      {payload}
      {signature}
    </Node>,
  );

  yield* all(say(caption, readSeconds(caption)), strip.typeIn(0.6));
  yield* strip.flashDots();
  yield* all(pop(header, 0.3), delay(0.12, pop(payload, 0.3)), delay(0.24, pop(signature, 0.3)));
  yield* strip.focus('header');
  yield* waitFor(0.5);
  yield* strip.focus('payload');
  yield* waitFor(0.5);
  yield* strip.focus('signature');
  yield* waitFor(0.6);
  yield* strip.focus(null);
  yield* waitFor(0.8);
  yield* leave(root());
}
