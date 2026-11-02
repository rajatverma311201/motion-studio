import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, JWT_TOKEN, leave, pop, readSeconds, say, titleBlock, tokenStrip} from '@motion-studio/video-kit';
import {INTRO} from '../layout';

// 00 INTRO — planned 25 s: title, two chips, token type-in, four captions.
export function* introSection(view: View2D): ThreadGenerator {
  const captions = [
    'You log in once. Then you make hundreds of requests.',
    'How does the server know it is still you?',
    'Meet the JSON Web Token.',
    'We will build one, sign it, break it, and secure it.',
  ];
  const root = createRef<Node>();
  const title = titleBlock({text: 'JWT', fontSize: 240, y: INTRO.title.y});
  const fullName = chip('JSON WEB TOKENS, EXPLAINED PROPERLY', colors.yellow, {
    x: INTRO.fullName.x,
    y: INTRO.fullName.y,
    fs: 30,
    sh: 8,
  }) as Node;
  const security = chip('SECURITY BASICS', colors.cyan, {
    x: INTRO.security.x,
    y: INTRO.security.y,
    fs: 26,
    sh: 6,
  }) as Node;
  const strip = tokenStrip({
    x: INTRO.strip.x,
    y: INTRO.strip.y,
    width: 1500,
    fontSize: 30,
    token: JWT_TOKEN,
  });
  title.opacity(0);
  fullName.opacity(0);
  security.opacity(0);

  view.add(
    <Node ref={root}>
      {title}
      {fullName}
      {security}
      {strip.node}
    </Node>,
  );

  yield* all(say(captions[0], readSeconds(captions[0])), pop(title, 0.5));
  yield* waitFor(1.5);
  yield* all(say(captions[1], readSeconds(captions[1])), pop(fullName, 0.3));
  yield* waitFor(1.0);
  yield* all(say(captions[2], readSeconds(captions[2])), pop(security, 0.3));
  yield* waitFor(0.8);
  yield* all(say(captions[3], readSeconds(captions[3])), strip.typeIn(1.2));
  yield* delay(1.0, strip.flashDots());
  yield* waitFor(5.0);
  yield* leave(root());
}
