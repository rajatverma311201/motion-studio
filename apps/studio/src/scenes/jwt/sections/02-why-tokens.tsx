import {Line, Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, sequence, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  borderWidth,
  colors,
  compareTable,
  fonts,
  leave,
  pop,
  radius,
  readSeconds,
  say,
  sequenceDiagram,
  titledPanel,
  withAlpha,
} from '@motion-studio/video-kit';
import {WHY} from '../layout';

// 01 WHY TOKENS — planned 55 s: forgetting server, session store, token, table.
export function* whyTokensSection(view: View2D): ThreadGenerator {
  const captions = [
    'HTTP forgets you after every request. Each call arrives alone.',
    'Option one: a session. The server remembers you, the client holds an ID.',
    'Every request, the server looks that ID up in a store it must keep.',
    'Option two: a token. The client carries who it is, and the server checks it.',
    'No lookup and no shared store. Any server with the key can verify.',
    'The price: a token is hard to take back. More on that later.',
  ];
  const root = createRef<Node>();
  const sequenceView = sequenceDiagram({
    x: WHY.sequence.x,
    y: WHY.sequence.y,
    w: WHY.sequence.w,
    h: WHY.sequence.h,
    actors: [
      {id: 'client', label: 'CLIENT', color: colors.cyan},
      {id: 'server', label: 'SERVER', color: colors.lime},
    ],
  });

  const cloud = (
    <Rect
      x={WHY.cloud.x}
      y={WHY.cloud.y}
      width={WHY.cloud.w}
      height={WHY.cloud.h}
      radius={radius(60)}
      fill={withAlpha(colors.red, 0.14)}
      stroke={colors.red}
      lineWidth={borderWidth(3)}
      lineDash={[10, 8]}
      opacity={0}
    >
      <Txt text="NO MEMORY" fontFamily={fonts.mono} fontWeight={700} fontSize={24} fill={colors.red} />
    </Rect>
  ) as Rect;

  const store = titledPanel({
    x: WHY.store.x,
    y: WHY.store.y,
    width: WHY.store.w,
    height: WHY.store.h,
    title: 'SESSION STORE',
    color: colors.cyan,
  });
  store.opacity(0);
  store.add(
    <Node>
      <Txt
        x={-WHY.store.w / 2 + 24}
        y={-76}
        offsetX={-1}
        text="SESSION ID"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={18}
        fill={colors.cyan}
      />
      <Txt
        x={WHY.store.w / 2 - 24}
        y={-76}
        offsetX={1}
        text="USER"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={18}
        fill={colors.cyan}
      />
      <Line
        y={-48}
        points={[
          [-WHY.store.w / 2 + 20, 0],
          [WHY.store.w / 2 - 20, 0],
        ]}
        stroke={colors.dim}
        lineWidth={2}
      />
      <Txt
        x={-WHY.store.w / 2 + 24}
        y={-8}
        offsetX={-1}
        text="abc123"
        fontFamily={fonts.mono}
        fontSize={24}
        fill={colors.ink}
      />
      <Txt
        x={WHY.store.w / 2 - 24}
        y={-8}
        offsetX={1}
        text="user_42"
        fontFamily={fonts.mono}
        fontSize={24}
        fill={colors.lime}
      />
      <Txt
        x={-WHY.store.w / 2 + 24}
        y={56}
        offsetX={-1}
        text="def456"
        fontFamily={fonts.mono}
        fontSize={24}
        fill={colors.ink}
      />
      <Txt
        x={WHY.store.w / 2 - 24}
        y={56}
        offsetX={1}
        text="user_7"
        fontFamily={fonts.mono}
        fontSize={24}
        fill={colors.lime}
      />
      <Txt
        y={112}
        text="ONE ROW PER LOGIN"
        fontFamily={fonts.mono}
        fontSize={16}
        letterSpacing={1}
        fill={colors.mute}
      />
    </Node>,
  );

  const lookup = (
    <Node opacity={0}>
      <Line
        points={[
          [-15, 80],
          [WHY.store.x - WHY.store.w / 2, 80],
        ]}
        stroke={colors.cyan}
        lineWidth={3}
        lineDash={[8, 8]}
        endArrow
        arrowSize={12}
      />
      <Txt x={150} y={54} text="lookup abc123" fontFamily={fonts.mono} fontSize={18} fill={colors.cyan} />
    </Node>
  ) as Node;

  const table = compareTable({
    x: WHY.table.x,
    y: WHY.table.y,
    w: WHY.table.w,
    columns: [
      {title: 'SESSION ID', color: colors.cyan},
      {title: 'JWT', color: colors.lime},
    ],
    rows: [
      {label: 'Where state lives', cells: ['server store', 'inside the token']},
      {label: 'Each request', cells: ['lookup', 'verify signature']},
      {label: 'Many servers', cells: ['shared store or sticky sessions', 'any server with the key']},
      {label: 'Log out', cells: ['delete the session', 'wait for expiry']},
    ],
    rowHeight: 82,
  });
  table.node.opacity(0);

  view.add(
    <Node ref={root}>
      {sequenceView.node}
      {cloud}
      {store}
      {lookup}
      {table.node}
    </Node>,
  );

  yield* all(
    say(captions[0], readSeconds(captions[0])),
    sequence(
      0.1,
      sequenceView.message('client', 'server', 'GET /orders'),
      sequenceView.message('server', 'client', '401 who are you?', {dashed: true, color: colors.red}),
      sequenceView.message('client', 'server', 'GET /orders'),
      sequenceView.message('server', 'client', '401 who are you?', {dashed: true, color: colors.red}),
    ),
    delay(2.4, pop(cloud, 0.35)),
  );
  yield* waitFor(1.0);

  yield* all(say(captions[1], readSeconds(captions[1])), pop(store, 0.45), delay(0.6, lookup.opacity(1, 0.25)));
  yield* waitFor(3.0);

  yield* all(
    say(captions[2], readSeconds(captions[2])),
    sequenceView.message('client', 'server', 'GET /orders', {chip: 'Cookie: abc123'}),
    sequenceView.message('server', 'client', '200 orders', {color: colors.lime}),
  );
  yield* waitFor(3.0);

  yield* all(store.opacity(0, 0.3), lookup.opacity(0, 0.2), cloud.opacity(0, 0.2));
  yield* sequenceView.clear();
  yield* all(
    say(captions[3], readSeconds(captions[3])),
    sequenceView.message('client', 'server', 'GET /orders', {chip: 'Authorization: Bearer eyJ…'}),
    delay(0.5, sequenceView.note('server', 'verify signature', {color: colors.lime})),
    delay(1.1, sequenceView.message('server', 'client', '200 orders', {color: colors.lime})),
  );
  yield* waitFor(2.5);

  yield* all(
    say(captions[4], readSeconds(captions[4])),
    sequenceView.message('client', 'server', 'GET /admin', {chip: 'same token'}),
    delay(0.5, sequenceView.note('server', 'no store lookup', {color: colors.cyan})),
    delay(1.1, sequenceView.message('server', 'client', '200 admin', {color: colors.lime})),
  );
  yield* waitFor(4.0);

  yield* all(
    sequenceView.node.opacity(0, 0.35),
    delay(0.2, table.node.opacity(1, 0.25)),
    say(captions[5], readSeconds(captions[5])),
    delay(0.3, table.revealAll()),
  );
  yield* waitFor(6.0);
  yield* leave(root());
}
