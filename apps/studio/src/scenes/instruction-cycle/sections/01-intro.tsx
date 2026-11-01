import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeOutBack, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {boxStyle, chip, colors, fonts, leave, pop, radius, say, titleBlock} from '@motion-studio/video-kit';

// ================================================================ 00 INTRO
export function* introSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const title = titleBlock({text: 'INSTRUCTION CYCLE', fontSize: 130, y: -190});
  const eyebrow = chip('COMPUTER ORGANIZATION & ARCHITECTURE', colors.cyan, {fs: 20, y: -335}) as Rect;
  const sub = chip('HOW A CPU RUNS YOUR PROGRAM', colors.yellow, {
    fs: 34,
    rot: -2,
    y: -50,
    sh: 8,
    mono: false,
  }) as Rect;
  const tileDefs = [
    {label: 'FETCH', color: colors.violet, x: -320},
    {label: 'DECODE', color: colors.orange, x: 0},
    {label: 'EXECUTE', color: colors.red, x: 320},
  ];
  const tiles = tileDefs.map(
    def =>
      (
        <Rect
          x={def.x}
          y={290}
          width={250}
          height={92}
          radius={radius(18)}
          fill={def.color}
          {...boxStyle(colors.ink, 7, 4)}
        >
          <Txt
            text={def.label}
            fontFamily={fonts.mono}
            fontWeight={700}
            fontSize={30}
            letterSpacing={2}
            fill={colors.onAccent}
          />
        </Rect>
      ) as Rect,
  );
  const arrows = [-160, 160].map(
    x =>
      (<Txt x={x} y={290} text="→" fontFamily={fonts.mono} fontWeight={700} fontSize={40} fill={colors.mute} />) as Txt,
  );
  const loop = (
    <Line
      points={[
        [420, 340],
        [470, 380],
        [470, 405],
        [-470, 405],
        [-470, 380],
        [-420, 340],
      ]}
      stroke={colors.violet}
      lineWidth={4}
      endArrow
      arrowSize={14}
      end={0}
    />
  ) as Line;
  const repeat = chip('REPEAT', colors.yellow, {fs: 16, y: 405, sh: 4}) as Rect;

  title.x(-1500);
  title.opacity(0);
  eyebrow.opacity(0);
  sub.opacity(0);
  tiles.forEach(tile => tile.opacity(0));
  arrows.forEach(arrow => arrow.opacity(0));
  repeat.opacity(0);
  view.add(
    <Node ref={root}>
      {title}
      {eyebrow}
      {sub}
      {tiles}
      {arrows}
      {loop}
      {repeat}
    </Node>,
  );

  yield* say('Every program you have ever run is a list of tiny steps.');
  yield* all(title.x(0, 1, easeOutCubic), title.opacity(1, 0.4), pop(eyebrow, 0.35));
  yield* waitFor(3.6);

  yield* say('The CPU follows that list with one simple loop.');
  yield* pop(sub, 0.35);
  yield* waitFor(4.2);

  yield* say('Fetch it. Decode it. Execute it. Repeat.');
  yield* sequence(0.2, ...tiles.map(tile => pop(tile, 0.35)));
  yield* all(loop.end(1, 0.8), ...arrows.map(arrow => arrow.opacity(1, 0.3)), pop(repeat, 0.3));
  yield* waitFor(3.8);

  yield* say('By the end, you can follow it one register at a time.');
  for (const tile of tiles) {
    yield* tile.scale(1.08, 0.14, easeOutBack);
    yield* tile.scale(1, 0.16, easeOutBack);
  }
  yield* waitFor(5.2);
  yield* leave(root());
}
