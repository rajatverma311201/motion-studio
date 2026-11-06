import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, leave, pop, readSeconds, say, verdictRow} from '@motion-studio/video-kit';
import {VERDICT} from '../layout';

// VERDICT — planned 11 s: three rows reveal, then the AEAD and Base64 chips, one caption each.
export function* verdictSection(view: View2D): ThreadGenerator {
  const caption1 = 'Encoding is format. Signing is trust. Encryption is secrecy.';
  const caption2 = 'Base64 is not encryption.';
  const caption3 = 'Pick the tool for the problem you have.';
  const root = createRef<Node>();
  const encoding = verdictRow({
    x: VERDICT.encoding.x,
    y: VERDICT.encoding.y,
    w: VERDICT.encoding.w,
    label: 'ENCODING',
    value: 'FORMAT',
    color: colors.cyan,
  });
  const signing = verdictRow({
    x: VERDICT.signing.x,
    y: VERDICT.signing.y,
    w: VERDICT.signing.w,
    label: 'SIGNING',
    value: 'TRUST',
    color: colors.yellow,
  });
  const encryption = verdictRow({
    x: VERDICT.encryption.x,
    y: VERDICT.encryption.y,
    w: VERDICT.encryption.w,
    label: 'ENCRYPTION',
    value: 'SECRECY',
    color: colors.pink,
  });
  const aes = chip('AES-GCM DOES SIGN + ENCRYPT', colors.surf2, {
    x: VERDICT.aes.x,
    y: VERDICT.aes.y,
    fs: 36,
    color: colors.mute,
    shadow: colors.dim,
    sh: 6,
  }) as Node;
  const base64 = chip('BASE64 IS NOT ENCRYPTION', colors.violet, {
    x: VERDICT.base64.x,
    y: VERDICT.base64.y,
    fs: 36,
    sh: 9,
  }) as Node;
  encoding.opacity(0);
  signing.opacity(0);
  encryption.opacity(0);
  aes.opacity(0);
  base64.opacity(0);

  view.add(
    <Node ref={root}>
      {encoding}
      {signing}
      {encryption}
      {aes}
      {base64}
    </Node>,
  );

  yield* all(
    say(caption1, readSeconds(caption1)),
    pop(encoding, 0.3),
    delay(0.2, pop(signing, 0.3)),
    delay(0.4, pop(encryption, 0.3)),
  );
  yield* all(say(caption2, readSeconds(caption2)), pop(aes, 0.3));
  yield* all(say(caption3, readSeconds(caption3)), pop(base64, 0.3));
  yield* waitFor(0.8);
  yield* leave(root());
}
