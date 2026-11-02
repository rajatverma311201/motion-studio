import {Node, type View2D} from '@motion-canvas/2d';
import {createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {leave, say, titleBlock} from '@motion-studio/video-kit';

// ================================================================ INTRO
export function* introSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const title = titleBlock({text: 'JWT IN 60 SECONDS', fontSize: 120, y: -100});
  title.opacity(0);
  view.add(<Node ref={root}>{title}</Node>);

  yield* title.opacity(1, 0.5);
  yield* say('TODO: introduce the topic in one sentence.');
  yield* waitFor(3);
  yield* leave(root());
}
