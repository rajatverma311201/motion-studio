import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {
  chip,
  colors,
  countTo,
  fonts,
  label,
  leave,
  pop,
  say,
  shake,
  statCard,
  boxStyle,
  radius,
  withAlpha,
} from '@motion-studio/video-kit';

// ================================================================ FULL TABLE SCAN
export function* scanSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const data: [number, string, string][] = [
    [1, 'Asha', 'Delhi'],
    [2, 'Ria', 'Pune'],
    [3, 'Kabir', 'Noida'],
    [4, 'Meera', 'Jaipur'],
    [5, 'Ria', 'Mumbai'],
    [6, 'Dev', 'Lucknow'],
    [7, 'Zoya', 'Indore'],
    [8, 'Arjun', 'Surat'],
    [9, 'Nisha', 'Kochi'],
  ];
  const sql = (
    <Rect
      x={-300}
      y={-395}
      layout
      alignItems="center"
      padding={[8, 20]}
      radius={radius(12)}
      fill={colors.code}
      {...boxStyle(colors.pink, 6, 3.5)}
    >
      <Txt
        text="SELECT * FROM users WHERE name = 'Ria';"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={24}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;
  const rowRects: Rect[] = [];
  const tbl = (
    <Rect
      x={-470}
      y={-5}
      width={700}
      height={595}
      radius={radius(22)}
      fill={colors.surf}
      {...boxStyle(colors.cyan, 9, 4)}
    >
      <Txt
        x={-300}
        y={-240}
        offsetX={-1}
        text="ID"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={19}
        letterSpacing={3}
        fill={colors.mute}
      />
      <Txt
        x={-170}
        y={-240}
        offsetX={-1}
        text="NAME"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={19}
        letterSpacing={3}
        fill={colors.mute}
      />
      <Txt
        x={60}
        y={-240}
        offsetX={-1}
        text="CITY"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={19}
        letterSpacing={3}
        fill={colors.mute}
      />
      <Line
        points={[
          [-330, -212],
          [330, -212],
        ]}
        stroke={colors.dim}
        lineWidth={3}
      />
      {data.map(([id, name, city], i) => {
        const r = (
          <Rect y={-172 + i * 54} width={668} height={46} radius={radius(10)} fill={colors.clear} opacity={0}>
            <Txt
              x={-300}
              offsetX={-1}
              text={String(id)}
              fontFamily={fonts.mono}
              fontWeight={700}
              fontSize={24}
              fill={colors.ink}
            />
            <Txt
              x={-170}
              offsetX={-1}
              text={name}
              fontFamily={fonts.mono}
              fontWeight={700}
              fontSize={24}
              fill={colors.ink}
            />
            <Txt x={60} offsetX={-1} text={city} fontFamily={fonts.mono} fontSize={24} fill={colors.mute} />
          </Rect>
        ) as Rect;
        rowRects.push(r);
        return r;
      })}
    </Rect>
  ) as Rect;
  const rowsStat = statCard(310, -190, 380, 140, 'ROWS CHECKED', colors.pink);
  const pagesStat = statCard(720, -190, 380, 140, 'PAGES READ (8 KB)', colors.orange);
  const gridTitle = label('THE TABLE FILE ON DISK: 100,000 PAGES', 515, -75, {fs: 18});
  const blocks: Rect[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 8; c++) {
      blocks.push(
        (
          <Rect
            x={515 + (c - 3.5) * 52}
            y={-20 + r * 52}
            width={42}
            height={42}
            radius={radius(9)}
            fill={colors.surf2}
            stroke={colors.dim}
            lineWidth={3}
          />
        ) as Rect,
      );
    }
  }
  const stamp = chip('O(n)', colors.red, {fs: 64, rot: -4, x: 515, y: 270, color: colors.ink, sh: 10}) as Rect;
  stamp.opacity(0);
  gridTitle.opacity(0);
  blocks.forEach(b => b.opacity(0));
  [sql, tbl, rowsStat.node, pagesStat.node].forEach(n => n.opacity(0));
  view.add(
    <Node ref={root}>
      {sql}
      {tbl}
      {rowsStat.node}
      {pagesStat.node}
      {gridTitle}
      {blocks}
      {stamp}
    </Node>,
  );

  yield* say('Say we run this query against a table with 10 million rows.');
  yield* all(sql.opacity(1, 0.4), tbl.opacity(1, 0.4));
  yield* sequence(0.08, ...rowRects.map(r => r.opacity(1, 0.2)));
  yield* waitFor(1.6);

  yield* say('With no index, the database has no choice: it must read every row, one after another.');
  yield* all(
    rowsStat.node.opacity(1, 0.4),
    pagesStat.node.opacity(1, 0.4),
    gridTitle.opacity(1, 0.4),
    ...blocks.map(b => b.opacity(1, 0.4)),
  );
  pagesStat.val.text('1');
  for (let i = 0; i < data.length; i++) {
    const hit = data[i][1] === 'Ria';
    yield* rowRects[i].fill(hit ? withAlpha(colors.lime, 0.35) : withAlpha(colors.yellow, 0.28), 0.12);
    rowsStat.val.text(String(i + 1));
    yield* waitFor(0.28);
    if (!hit) yield* rowRects[i].fill(colors.clear, 0.15);
  }
  yield* say('It found two matches, but names are not unique, so it still has to keep going.');
  yield* waitFor(1.8);

  yield* say('Rows live on 8 KB pages. A full scan reads every page of the table from disk.');
  yield* all(
    countTo(rowsStat.val, 9, 10_000_000, 5),
    countTo(pagesStat.val, 1, 100_000, 5),
    sequence(0.12, ...blocks.map(b => all(b.fill(colors.pink, 0.18), b.stroke(colors.ink, 0.18)))),
  );
  yield* all(pop(stamp, 0.35), shake(stamp, 5, 4));
  yield* say('Cost grows with the table. Double the rows, double the work: that is O(n).', 3.4);
  yield* say('An index lets the database jump straight to the right place instead.', 3);
  yield* leave(root());
}
