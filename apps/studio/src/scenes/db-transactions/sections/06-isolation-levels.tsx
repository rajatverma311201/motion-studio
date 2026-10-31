import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, sequence, waitFor} from '@motion-canvas/core';
import {chip, colors, fonts, leave, pop, say, boxStyle, radius} from '@motion-studio/video-kit';

// ================================================================ 05 ISOLATION LEVELS
export function* isolationLevelsSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const cols = [
    {name: 'DIRTY READ', color: colors.pink, x: -50},
    {name: 'NON-REPEATABLE', color: colors.cyan, x: 250},
    {name: 'PHANTOM READ', color: colors.yellow, x: 550},
  ];
  const rows = [
    {
      name: 'READ UNCOMMITTED',
      color: colors.pink,
      y: -130,
      cells: [true, true, true],
      cap: 'Read Uncommitted: no protection. All three anomalies can happen.',
    },
    {
      name: 'READ COMMITTED',
      color: colors.orange,
      y: -10,
      cells: [false, true, true],
      cap: 'Read Committed: no dirty reads. You only ever see committed data.',
    },
    {
      name: 'REPEATABLE READ',
      color: colors.yellow,
      y: 110,
      cells: [false, false, true],
      cap: 'Repeatable Read: rows you have read stay the same for the whole transaction.',
    },
    {
      name: 'SERIALIZABLE',
      color: colors.lime,
      y: 230,
      cells: [false, false, false],
      cap: 'Serializable: it behaves as if transactions ran strictly one after another.',
    },
  ];
  const head = cols.map(c => {
    const h = chip(c.name, c.color, {
      x: c.x,
      y: -260,
      fs: 20,
      sh: 5,
    }) as Rect;
    h.opacity(0);
    return h;
  });
  const levelCells = rows.map(r => {
    const n = (
      <Rect
        x={-460}
        y={r.y}
        width={520}
        height={100}
        radius={radius(20)}
        fill={r.color}
        {...boxStyle(colors.ink, 7, 4)}
      >
        <Txt
          text={r.name}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={34}
          letterSpacing={1}
          fill={colors.onAccent}
        />
      </Rect>
    ) as Rect;
    n.opacity(0);
    return n;
  });
  const cells = rows.map(r =>
    r.cells.map((bad, i) => {
      const n = (
        <Rect
          x={cols[i].x}
          y={r.y}
          width={280}
          height={84}
          radius={radius(16)}
          fill={bad ? colors.redBg : colors.limeBg}
          stroke={bad ? colors.red : colors.lime}
          lineWidth={4}
        >
          <Txt
            text={bad ? '✗  POSSIBLE' : '✓  PREVENTED'}
            fontFamily={fonts.mono}
            fontWeight={700}
            fontSize={24}
            fill={bad ? colors.red : colors.lime}
          />
        </Rect>
      ) as Rect;
      n.opacity(0);
      return n;
    }),
  );
  const arrow = (
    <Line
      points={[
        [810, -150],
        [810, 250],
      ]}
      stroke={colors.ink}
      lineWidth={5}
      endArrow
      arrowSize={14}
      opacity={0}
    />
  ) as Line;
  const faster = (
    <Txt
      x={810}
      y={-185}
      text="FASTER"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={18}
      letterSpacing={2}
      fill={colors.mute}
      opacity={0}
    />
  ) as Txt;
  const safer = (
    <Txt
      x={810}
      y={285}
      text="SAFER"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={18}
      letterSpacing={2}
      fill={colors.mute}
      opacity={0}
    />
  ) as Txt;
  const pg = chip('PostgreSQL default: READ COMMITTED', colors.surf2, {
    x: -250,
    y: 345,
    fs: 20,
    sh: 5,
    color: colors.ink,
    shadow: colors.cyan,
  }) as Rect;
  const my = chip('MySQL InnoDB default: REPEATABLE READ', colors.surf2, {
    x: 330,
    y: 345,
    fs: 20,
    sh: 5,
    color: colors.ink,
    shadow: colors.pink,
  }) as Rect;
  const note = (
    <Txt
      y={400}
      text="SQL-standard view. Real engines differ: PostgreSQL's Repeatable Read also blocks phantoms."
      fontFamily={fonts.mono}
      fontSize={17}
      fill={colors.mute}
      opacity={0}
    />
  ) as Txt;
  pg.opacity(0);
  my.opacity(0);
  view.add(
    <Node ref={root}>
      {head}
      {levelCells}
      {cells.flat()}
      {arrow}
      {faster}
      {safer}
      {pg}
      {my}
      {note}
    </Node>,
  );

  yield* say('The SQL standard defines four isolation levels. Each blocks more anomalies.');
  yield* sequence(0.15, ...head.map(h => pop(h, 0.3)));
  yield* waitFor(0.8);
  for (let i = 0; i < rows.length; i++) {
    yield* say(rows[i].cap);
    yield* all(pop(levelCells[i], 0.35), delay(0.2, sequence(0.18, ...cells[i].map(c => pop(c, 0.3)))));
    yield* waitFor(2.6);
  }
  yield* say('More isolation means more safety, but less concurrency. Pick the weakest safe level.');
  yield* all(arrow.opacity(1, 0.4), faster.opacity(1, 0.4), safer.opacity(1, 0.4));
  yield* waitFor(2.2);
  yield* say('Defaults differ by database, so check what your engine really uses.');
  yield* all(pop(pg, 0.35), delay(0.25, pop(my, 0.35)), note.opacity(1, 0.5));
  yield* waitFor(4.6);
  yield* leave(root());
}
