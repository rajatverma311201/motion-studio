import {Node, type View2D} from '@motion-canvas/2d';
import {createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, leave, say} from '@motion-studio/video-kit';

// ================================================================ 08 MIX-UPS
export function* chapter9Section(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tag = chip('MIX-UPS', colors.pink);
  view.add(<Node ref={root}>{tag}</Node>);

  yield* say('TODO: narrate the mix-ups chapter.');
  yield* waitFor(3);
  yield* leave(root());
}
