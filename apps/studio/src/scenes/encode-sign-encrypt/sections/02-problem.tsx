import {Circle, Line, Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  CAPTIONS,
  PROBLEM_CARDS,
  boxStyle,
  borderWidth,
  colors,
  fonts,
  leave,
  lockIcon,
  pop,
  radius,
  readSeconds,
  say,
  sequenceDiagram,
} from '@motion-studio/video-kit';
import {PROBLEM} from '../layout';

function problemIcon(kind: string, x: number, y: number): Node {
  if (kind === 'secrecy') {
    return lockIcon({x, y, size: 44, color: colors.cyan}).node;
  }
  if (kind === 'integrity') {
    return (
      <Node x={x} y={y}>
        <Circle size={24} stroke={colors.cyan} lineWidth={borderWidth(3)} fill={colors.clear} />
        <Line
          points={[
            [-10, 0],
            [-2, 9],
            [12, -9],
          ]}
          stroke={colors.lime}
          lineWidth={borderWidth(3)}
          lineCap="round"
        />
      </Node>
    ) as Node;
  }
  if (kind === 'authenticity') {
    return (
      <Node x={x} y={y}>
        <Circle y={-10} size={11} fill={colors.cyan} />
        <Line
          points={[
            [-20, 20],
            [-20, 12],
            [-8, 3],
            [8, 3],
            [20, 12],
            [20, 20],
          ]}
          stroke={colors.cyan}
          lineWidth={borderWidth(3)}
          lineCap="round"
          lineJoin="round"
        />
      </Node>
    ) as Node;
  }
  return (
    <Node x={x} y={y}>
      <Rect
        width={38}
        height={48}
        radius={radius(6)}
        stroke={colors.cyan}
        lineWidth={borderWidth(3)}
        fill={colors.clear}
      />
      <Line
        points={[
          [-11, -10],
          [11, -10],
        ]}
        stroke={colors.cyan}
        lineWidth={borderWidth(2.5)}
        lineCap="round"
      />
      <Line
        points={[
          [-11, 0],
          [5, 0],
        ]}
        stroke={colors.cyan}
        lineWidth={borderWidth(2.5)}
        lineCap="round"
      />
      <Line
        points={[
          [-11, 10],
          [11, 10],
        ]}
        stroke={colors.cyan}
        lineWidth={borderWidth(2.5)}
        lineCap="round"
      />
    </Node>
  ) as Node;
}

interface ProblemCardOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  question: string;
  icon: Node;
}

function problemCard(options: ProblemCardOptions): Rect {
  const {x, y, w, h, title, question, icon} = options;
  return (
    <Rect x={x} y={y} width={w} height={h} radius={radius(20)} fill={colors.surf} {...boxStyle(colors.cyan, 6, 3)}>
      {icon}
      <Txt
        x={-w / 2 + 100}
        y={-18}
        offsetX={-1}
        text={title}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={24}
        letterSpacing={1}
        fill={colors.ink}
      />
      <Txt
        x={-w / 2 + 100}
        y={20}
        offsetX={-1}
        text={question}
        fontFamily={fonts.mono}
        fontSize={19}
        fill={colors.mute}
      />
    </Rect>
  ) as Rect;
}

// 01 THE PROBLEM — planned 50 s: Alice, Eve and the bank, then four separate needs.
export function* problemSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS.problem;
  const root = createRef<Node>();
  const sequence = sequenceDiagram({
    x: PROBLEM.sequence.x,
    y: PROBLEM.sequence.y,
    w: PROBLEM.sequence.w,
    h: PROBLEM.sequence.h,
    actors: [
      {id: 'alice', label: 'ALICE', color: colors.lime},
      {id: 'eve', label: 'EVE', color: colors.red},
      {id: 'bank', label: 'BANK', color: colors.cyan},
    ],
  });
  const network = (
    <Rect
      x={PROBLEM.network.x}
      y={PROBLEM.network.y}
      width={PROBLEM.network.w}
      height={PROBLEM.network.h}
      radius={radius(20)}
      fill={colors.clear}
      stroke={colors.cyan}
      lineWidth={borderWidth(2.5)}
      lineDash={[12, 10]}
      opacity={0}
    />
  ) as Rect;
  const networkLabel = (
    <Txt
      x={PROBLEM.network.x}
      y={PROBLEM.sequence.y + PROBLEM.sequence.h / 2 + 24}
      text="NETWORK"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={18}
      letterSpacing={3}
      fill={colors.cyan}
      opacity={0}
    />
  ) as Txt;
  const cards = PROBLEM_CARDS.map(card => {
    const position = PROBLEM[card.id];
    return problemCard({
      x: position.x,
      y: position.y,
      w: position.w,
      h: position.h,
      title: card.title,
      question: card.question,
      icon: problemIcon(card.id, -position.w / 2 + 52, 0),
    });
  });
  sequence.node.opacity(0);
  for (const card of cards) card.opacity(0);

  view.add(
    <Node ref={root}>
      {network}
      {networkLabel}
      {sequence.node}
      {cards}
    </Node>,
  );

  yield* all(
    say(captions[0], readSeconds(captions[0])),
    sequence.node.opacity(1, 0.3),
    network.opacity(0.7, 0.3),
    networkLabel.opacity(1, 0.3),
    sequence.message('alice', 'bank', 'pay 500 to Bob'),
  );
  yield* waitFor(3.0);

  yield* all(
    say(captions[1], readSeconds(captions[1])),
    sequence.note('eve', 'reads it', {color: colors.red}),
    delay(0.6, sequence.note('eve', 'changes it', {color: colors.red})),
    delay(1.2, sequence.note('eve', 'pretends to be Alice', {color: colors.red})),
  );
  yield* waitFor(5.0);

  yield* all(
    say(captions[2], readSeconds(captions[2])),
    pop(cards[0], 0.3),
    delay(0.2, pop(cards[1], 0.3)),
    delay(0.4, pop(cards[2], 0.3)),
    delay(0.6, pop(cards[3], 0.3)),
  );
  yield* waitFor(6.0);

  yield* say(captions[3], readSeconds(captions[3]));
  yield* waitFor(12.0);
  yield* leave(root());
}
