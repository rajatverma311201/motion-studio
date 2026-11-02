import {Node, type View2D} from '@motion-canvas/2d';
import {createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, leave, say} from '@motion-studio/video-kit';

// ================================================================ CHAPTER 5
export function* chapter5Section(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tag = chip('CHAPTER 5', colors.violet);
  view.add(<Node ref={root}>{tag}</Node>);

  yield* say('TODO: narrate chapter 5.');
  yield* waitFor(3);
  yield* leave(root());
}
