import {Node, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {base64Visual, chip, colors, fonts, leave, pop, readSeconds, say, slam, stamp} from '@motion-studio/video-kit';
import {BASE64} from '../layout';

// 03 BASE64URL — planned 50 s: Man through the algorithm, the header decode, the stamp.
export function* base64UrlSection(view: View2D): ThreadGenerator {
  const captions = [
    'Why do the parts look like gibberish? They are Base64URL text.',
    'Take three bytes: M, a, n. That is 24 bits.',
    'Cut the bits into four groups of six.',
    'Each group of six picks one letter from a 64-letter alphabet.',
    'Man becomes TWFu. Same data, now safe to put in a URL or a header.',
    'URL-safe Base64 swaps + and / for - and _, and drops the = padding.',
    'Anyone can reverse this. It is encoding, not encryption.',
  ];
  const root = createRef<Node>();
  const visual = base64Visual({x: 0, y: 0, w: 1500, input: 'Man'});
  visual.node.opacity(0);

  const encoded = chip('eyJhbGci', colors.surf2, {
    x: BASE64.decodeLeft.x,
    y: BASE64.decodeLeft.y,
    fs: 24,
    color: colors.mute,
    shadow: colors.dim,
    sh: 4,
  }) as Node;
  const decoded = chip('{"alg', colors.pink, {
    x: BASE64.decodeRight.x,
    y: BASE64.decodeRight.y,
    fs: 24,
    sh: 5,
  }) as Node;
  const arrow = (
    <Txt
      x={0}
      y={BASE64.decodeArrow.y}
      text="→"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={34}
      fill={colors.yellow}
    />
  ) as Txt;
  encoded.opacity(0);
  decoded.opacity(0);
  arrow.opacity(0);

  const mark = stamp('ENCODING NOT ENCRYPTION', colors.red, {rot: -4, fs: 32});
  mark.x(BASE64.stamp.x);
  mark.y(BASE64.stamp.y);
  mark.opacity(0);

  view.add(
    <Node ref={root}>
      {visual.node}
      {encoded}
      {arrow}
      {decoded}
      {mark}
    </Node>,
  );

  yield* all(say(captions[0], readSeconds(captions[0])), visual.node.opacity(1, 0.3));
  yield* waitFor(1.0);

  yield* all(say(captions[1], readSeconds(captions[1])), visual.showBytes());
  yield* visual.showBits();
  yield* waitFor(1.0);

  yield* all(say(captions[2], readSeconds(captions[2])), visual.regroup());
  yield* waitFor(2.0);

  yield* all(say(captions[3], readSeconds(captions[3])), visual.lookup());
  yield* waitFor(2.0);

  yield* all(say(captions[4], readSeconds(captions[4])), visual.showResult());
  yield* waitFor(2.0);

  yield* all(say(captions[5], readSeconds(captions[5])), visual.showUrlSafe());
  yield* waitFor(2.0);

  yield* all(
    say(captions[6], readSeconds(captions[6])),
    delay(0.7, pop(encoded, 0.3)),
    delay(0.9, pop(arrow, 0.25)),
    delay(1.1, pop(decoded, 0.3)),
  );
  yield* slam(mark, 0.5);
  yield* waitFor(5.0);
  yield* leave(root());
}
