import {Node, type View2D} from '@motion-canvas/2d';
import {createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, leave, say} from '@motion-studio/video-kit';

// ================================================================ CHAPTER 9
export function* chapter9Section(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tag = chip('CHAPTER 9', colors.cyan);
  view.add(<Node ref={root}>{tag}</Node>);

  yield* say('TODO: narrate chapter 9.');
  yield* waitFor(3);
  yield* leave(root());
}
