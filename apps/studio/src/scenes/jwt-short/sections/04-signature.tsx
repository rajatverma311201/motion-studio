import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {hmacMachine, JWT_SIGNATURE, leave, readSeconds, say} from '@motion-studio/video-kit';
import {SIGNATURE} from '../layout';

// SIGNATURE — planned 10 s: machine runs with the first caption, the key stays secret with the second.
export function* signatureSection(view: View2D): ThreadGenerator {
  const caption1 = 'The signature is a seal made with a secret key.';
  const caption2 = 'Only the server knows the key.';
  const root = createRef<Node>();
  const machine = hmacMachine({
    x: SIGNATURE.machine.x,
    y: SIGNATURE.machine.y,
    w: SIGNATURE.machine.w,
    h: SIGNATURE.machine.h,
  });
  view.add(<Node ref={root}>{machine.node}</Node>);

  yield* all(
    say(caption1, readSeconds(caption1)),
    machine.run({message: 'header.payload', key: 'SECRET', tag: JWT_SIGNATURE}),
  );
  yield* say(caption2, readSeconds(caption2));
  yield* waitFor(2.5);
  yield* waitFor(1.0);
  yield* leave(root());
}
