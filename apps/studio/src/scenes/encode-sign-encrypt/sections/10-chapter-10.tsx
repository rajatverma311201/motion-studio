import {Node, type View2D} from '@motion-canvas/2d';
import {createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, leave, say} from '@motion-studio/video-kit';

// ================================================================ 09 RECAP
export function* chapter10Section(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tag = chip('RECAP', colors.yellow);
  view.add(<Node ref={root}>{tag}</Node>);

  yield* say('TODO: narrate the recap chapter.');
  yield* waitFor(3);
  yield* leave(root());
}
