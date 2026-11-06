import {Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  CAPTIONS,
  boxStyle,
  chip,
  colors,
  fonts,
  leave,
  pop,
  radius,
  readSeconds,
  say,
  titleBlock,
} from '@motion-studio/video-kit';
import {INTRO} from '../layout';

interface ToolTileOptions {
  x: number;
  y: number;
  label: string;
  question: string;
  color: string;
}

function toolTile(options: ToolTileOptions): Rect {
  const {x, y, label, question, color} = options;
  return (
    <Rect x={x} y={y} width={400} height={190} radius={radius(22)} fill={colors.surf} {...boxStyle(color, 8, 4)}>
      <Txt y={-34} text={label} fontFamily={fonts.mono} fontWeight={700} fontSize={36} letterSpacing={1} fill={color} />
      <Txt y={36} text={question} fontFamily={fonts.mono} fontSize={22} fill={colors.mute} />
    </Rect>
  ) as Rect;
}

// 00 INTRO — planned 25 s: title, two chips and the four tool tiles.
export function* introSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS.intro;
  const root = createRef<Node>();
  const title = titleBlock({text: 'ENCODE · SIGN · ENCRYPT', fontSize: 120, y: INTRO.title.y});
  const difference = chip('WHAT IS THE DIFFERENCE?', colors.yellow, {
    x: INTRO.difference.x,
    y: INTRO.difference.y,
    fs: 30,
    sh: 8,
  }) as Node;
  const course = chip('SECURITY BASICS', colors.cyan, {
    x: INTRO.course.x,
    y: INTRO.course.y,
    fs: 26,
    sh: 6,
  }) as Node;
  const tiles = [
    toolTile({
      x: INTRO.encoding.x,
      y: INTRO.encoding.y,
      label: 'ENCODING',
      question: 'Can anyone undo it?',
      color: colors.cyan,
    }),
    toolTile({
      x: INTRO.hashing.x,
      y: INTRO.hashing.y,
      label: 'HASHING',
      question: 'Can anyone reverse it?',
      color: colors.orange,
    }),
    toolTile({
      x: INTRO.signing.x,
      y: INTRO.signing.y,
      label: 'SIGNING',
      question: 'Can anyone forge it?',
      color: colors.yellow,
    }),
    toolTile({
      x: INTRO.encryption.x,
      y: INTRO.encryption.y,
      label: 'ENCRYPTION',
      question: 'Can anyone read it?',
      color: colors.pink,
    }),
  ];

  title.opacity(0);
  difference.opacity(0);
  course.opacity(0);
  for (const tile of tiles) tile.opacity(0);

  view.add(
    <Node ref={root}>
      {title}
      {difference}
      {course}
      {tiles}
    </Node>,
  );

  yield* all(say(captions[0], readSeconds(captions[0])), pop(title, 0.5));
  yield* waitFor(2.0);
  yield* all(say(captions[1], readSeconds(captions[1])), pop(difference, 0.3), delay(0.15, pop(course, 0.3)));
  yield* waitFor(1.5);
  yield* all(
    say(captions[2], readSeconds(captions[2])),
    pop(tiles[0], 0.3),
    delay(0.15, pop(tiles[1], 0.3)),
    delay(0.3, pop(tiles[2], 0.3)),
    delay(0.45, pop(tiles[3], 0.3)),
  );
  yield* waitFor(8.0);
  yield* leave(root());
}
