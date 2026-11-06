import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, DEMO_MESSAGE, leave, pop, readSeconds, say, textMorphCard} from '@motion-studio/video-kit';
import {HOOK} from '../layout';

// HOOK — planned 7 s: card pops in (0.35), three chips fall in, captions hold 3.4 + 2.8 s.
export function* hookSection(view: View2D): ThreadGenerator {
  const caption1 = 'Encoding, signing, encryption. They sound alike.';
  const caption2 = 'They solve three different problems.';
  const root = createRef<Node>();
  const card = textMorphCard({
    x: HOOK.card.x,
    y: HOOK.card.y,
    w: HOOK.card.w,
    text: DEMO_MESSAGE,
    color: colors.lime,
    fontSize: 64,
  });
  const encoding = chip('ENCODING ?', colors.cyan, {
    x: HOOK.encoding.x,
    y: HOOK.encoding.y,
    fs: 36,
    sh: 8,
  }) as Node;
  const signing = chip('SIGNING ?', colors.yellow, {
    x: HOOK.signing.x,
    y: HOOK.signing.y,
    fs: 36,
    sh: 8,
  }) as Node;
  const encryption = chip('ENCRYPTION ?', colors.pink, {
    x: HOOK.encryption.x,
    y: HOOK.encryption.y,
    fs: 36,
    sh: 8,
  }) as Node;
  card.node.opacity(0);
  encoding.opacity(0);
  signing.opacity(0);
  encryption.opacity(0);

  view.add(
    <Node ref={root}>
      {card.node}
      {encoding}
      {signing}
      {encryption}
    </Node>,
  );

  yield* all(say(caption1, readSeconds(caption1)), pop(card.node, 0.35));
  yield* all(
    say(caption2, readSeconds(caption2)),
    pop(encoding, 0.3),
    delay(0.18, pop(signing, 0.3)),
    delay(0.36, pop(encryption, 0.3)),
  );
  yield* waitFor(0.4);
  yield* leave(root());
}
