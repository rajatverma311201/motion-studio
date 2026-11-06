import {Node, type View2D} from '@motion-canvas/2d';
import {createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, leave, say} from '@motion-studio/video-kit';

// ================================================================ CHAPTER 10
export function* chapter10Section(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tag = chip('CHAPTER 10', colors.pink);
  view.add(<Node ref={root}>{tag}</Node>);

  yield* say('TODO: narrate chapter 10.');
  yield* waitFor(3);
  yield* leave(root());
}
