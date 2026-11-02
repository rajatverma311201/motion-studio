import {Line, Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, easeInOutCubic, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  chip,
  codePanel,
  colors,
  focusLine,
  JWT_HEADER_JSON,
  JWT_PAYLOAD_JSON,
  JWT_TOKEN,
  leave,
  pop,
  readSeconds,
  revealLines,
  say,
  slam,
  stamp,
  tokenStrip,
} from '@motion-studio/video-kit';
import {READABLE} from '../layout';

function jsonLines(source: string): string[] {
  return JSON.stringify(JSON.parse(source), null, 2).split('\n');
}

// READABLE — planned 13 s: strip slides up, arrow, two JSON cards, role highlight, stamp.
export function* readableSection(view: View2D): ThreadGenerator {
  const caption1 = 'Header and payload are just Base64.';
  const caption2 = 'Anyone can decode them. No key needed.';
  const root = createRef<Node>();
  const strip = tokenStrip({
    x: READABLE.strip.x,
    y: -300,
    width: READABLE.strip.w,
    fontSize: 34,
    token: JWT_TOKEN,
  });
  const headerPanel = codePanel({
    x: READABLE.headerCard.x,
    y: READABLE.headerCard.y,
    w: READABLE.headerCard.w,
    title: 'HEADER',
    code: jsonLines(JWT_HEADER_JSON),
    lang: 'json',
    accent: colors.pink,
    fs: 22,
  });
  const payloadPanel = codePanel({
    x: READABLE.payloadCard.x,
    y: READABLE.payloadCard.y,
    w: READABLE.payloadCard.w,
    title: 'PAYLOAD',
    code: jsonLines(JWT_PAYLOAD_JSON),
    lang: 'json',
    accent: colors.cyan,
    fs: 22,
  });
  const arrow = (
    <Line
      points={[
        [0, -505],
        [0, -405],
      ]}
      stroke={colors.cyan}
      lineWidth={6}
      endArrow
      arrowSize={20}
      end={0}
    />
  ) as Line;
  const base64 = chip('BASE64URL', colors.cyan, {
    x: READABLE.base64Label.x,
    y: READABLE.base64Label.y,
    fs: 24,
    sh: 4,
  }) as Node;
  const notEncrypted = stamp('NOT ENCRYPTED', colors.red, {rot: -5, fs: 46});
  notEncrypted.x(READABLE.stamp.x);
  notEncrypted.y(READABLE.stamp.y);
  notEncrypted.opacity(0);
  base64.opacity(0);
  headerPanel.node.opacity(0);
  payloadPanel.node.opacity(0);

  view.add(
    <Node ref={root}>
      {strip.node}
      {arrow}
      {base64}
      {headerPanel.node}
      {payloadPanel.node}
      {notEncrypted}
    </Node>,
  );

  yield* all(
    say(caption1, readSeconds(caption1)),
    strip.node.y(READABLE.strip.y, 0.7, easeInOutCubic),
    arrow.end(1, 0.5),
    delay(0.3, pop(base64, 0.3)),
  );
  yield* all(
    say(caption2, readSeconds(caption2)),
    headerPanel.node.opacity(1, 0.35),
    payloadPanel.node.opacity(1, 0.35),
    delay(0.2, revealLines(headerPanel)),
    delay(0.35, revealLines(payloadPanel)),
    delay(1.3, focusLine(payloadPanel, 3, colors.lime)),
    delay(1.9, slam(notEncrypted, 0.4)),
  );
  yield* waitFor(2.0);
  yield* waitFor(4.5);
  yield* leave(root());
}
