import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  chip,
  colors,
  compareTable,
  JWT_TOKEN,
  leave,
  pop,
  readSeconds,
  say,
  tokenStrip,
} from '@motion-studio/video-kit';
import {ENCODE} from '../layout';

// 04 ENCODE SIGN ENCRYPT — planned 65 s: three-column table, then the labelled strip.
export function* encodeSignEncryptSection(view: View2D): ThreadGenerator {
  const captions = [
    'Three ideas that get mixed up. Let us pull them apart, briefly.',
    'Encoding changes the format. No key, so anyone can undo it.',
    'Signing adds a seal: it proves who made it and that nothing changed.',
    'Encryption hides the content. Only a key holder can read it.',
    'A normal JWT is encoded and signed. It is not encrypted.',
    'An encrypted kind exists, called JWE. Most tokens are the signed kind, JWS.',
  ];
  const root = createRef<Node>();
  const table = compareTable({
    x: ENCODE.table.x,
    y: ENCODE.table.y,
    w: ENCODE.table.w,
    columns: [
      {title: 'ENCODING', color: colors.cyan},
      {title: 'SIGNING', color: colors.yellow},
      {title: 'ENCRYPTION', color: colors.pink},
    ],
    rows: [
      {label: 'Goal', cells: ['carry data', 'prove it is unchanged and who made it', 'hide the content']},
      {label: 'Needs a key?', cells: ['no', 'yes', 'yes']},
      {label: 'Others can read it?', cells: ['yes', 'yes', 'no']},
      {label: 'Others can change it unnoticed?', cells: ['yes', 'no', 'depends']},
      {label: 'Used in a JWT as', cells: ['header and payload text', 'the signature', 'only in the rare JWE']},
    ],
    rowHeight: 88,
    fontSize: 20,
  });
  table.node.opacity(0);

  const strip = tokenStrip({
    x: ENCODE.strip.x,
    y: ENCODE.strip.y,
    width: 1600,
    fontSize: 24,
    token: JWT_TOKEN,
  });
  strip.node.opacity(0);
  const encodedHeader = chip('ENCODED', colors.surf2, {
    x: ENCODE.encodedHeader.x,
    y: ENCODE.encodedHeader.y,
    fs: 20,
    color: colors.pink,
    shadow: colors.dim,
    sh: 3,
  }) as Node;
  const encodedPayload = chip('ENCODED', colors.surf2, {
    x: ENCODE.encodedPayload.x,
    y: ENCODE.encodedPayload.y,
    fs: 20,
    color: colors.cyan,
    shadow: colors.dim,
    sh: 3,
  }) as Node;
  const signed = chip('SIGNED', colors.surf2, {
    x: ENCODE.signed.x,
    y: ENCODE.signed.y,
    fs: 20,
    color: colors.lime,
    shadow: colors.dim,
    sh: 3,
  }) as Node;
  encodedHeader.opacity(0);
  encodedPayload.opacity(0);
  signed.opacity(0);

  view.add(
    <Node ref={root}>
      {table.node}
      {strip.node}
      {encodedHeader}
      {encodedPayload}
      {signed}
    </Node>,
  );

  yield* all(say(captions[0], readSeconds(captions[0])), table.node.opacity(1, 0.3));
  yield* waitFor(3.0);

  yield* all(say(captions[1], readSeconds(captions[1])), table.revealRow(0));
  yield* waitFor(5.0);

  yield* all(say(captions[2], readSeconds(captions[2])), table.revealRow(1));
  yield* waitFor(5.0);

  yield* all(say(captions[3], readSeconds(captions[3])), table.revealRow(2));
  yield* waitFor(5.0);

  yield* all(say(captions[4], readSeconds(captions[4])), table.revealRow(3));
  yield* waitFor(5.0);

  yield* all(say(captions[5], readSeconds(captions[5])), table.revealRow(4));
  yield* waitFor(3.0);

  yield* all(
    strip.node.opacity(1, 0.25),
    strip.typeIn(0.8),
    delay(0.9, pop(encodedHeader, 0.3)),
    delay(1.05, pop(encodedPayload, 0.3)),
    delay(1.2, pop(signed, 0.3)),
  );
  yield* waitFor(6.0);
  yield* leave(root());
}
