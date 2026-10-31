import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeInOutCubic, waitFor} from '@motion-canvas/core';
import {
  chip,
  chipText,
  clearStroke,
  colors,
  fonts,
  highlightStroke,
  label,
  leave,
  miniTree,
  neubrutal,
  pop,
  say,
  shake,
  statCard,
} from '@motion-studio/video-kit';

// ================================================================ CLUSTERED vs SECONDARY
export function* clusteredVsSecondarySection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const sec = miniTree({
    cx: -470,
    rootText: 'kabir@ │ tara@',
    rows: [
      ['asha@x.in → 7', 'dev@x.in → 12'],
      ['kabir@x.in → 19', 'ria@x.in → 42'],
      ['tara@x.in → 90', 'zoya@x.in → 58'],
    ],
    rootColor: colors.violet,
    leafColor: colors.cyan,
    rowFontSize: 19,
  });
  const clu = miniTree({
    cx: 470,
    rootText: '19 │ 58',
    rows: [
      ['7  Asha  asha@x.in', '12 Dev   dev@x.in'],
      ['19 Kabir kabir@x.in', '42 Ria   ria@x.in'],
      ['58 Zoya  zoya@x.in', '90 Tara  tara@x.in'],
    ],
    rootColor: colors.violet,
    leafColor: colors.lime,
    rowFontSize: 18,
  });
  const tSec = chip('SECONDARY INDEX · email', colors.cyan, {x: -470, y: -330, fs: 24, sh: 6}) as Rect;
  const tClu = chip('CLUSTERED INDEX · primary key', colors.lime, {x: 470, y: -330, fs: 24, sh: 6}) as Rect;
  const subSec = label('leaves store: key + primary key', -470, 105, {fs: 19, fill: colors.mute});
  const subClu = label('leaves store: the full rows', 470, 105, {fs: 19, fill: colors.mute});
  [tSec, tClu, subSec, subClu].forEach(n => n.opacity(0));
  const sqlTxt = createRef<Txt>();
  const sql = (
    <Rect
      x={0}
      y={-400}
      layout
      alignItems="center"
      padding={[8, 20]}
      radius={12}
      fill={colors.code}
      {...neubrutal(colors.pink, 6, 3.5)}
      opacity={0}
    >
      <Txt
        ref={sqlTxt}
        text="SELECT * FROM users WHERE email = 'ria@x.in';"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={24}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;
  const walks = statCard(0, 300, 330, 120, 'TREE WALKS', colors.orange);
  walks.node.opacity(0);
  const pk = chip('PK = 42', colors.yellow, {x: -470, y: 0, fs: 24, sh: 5}) as Rect;
  pk.opacity(0);
  const pg = chip('POSTGRESQL: HEAP + ROW ADDRESS (TID)', colors.surf2, {
    x: 0,
    y: 190,
    fs: 18,
    sh: 0,
    color: colors.ink,
  }) as Rect;
  pg.opacity(0);
  const cover = chip('COVERING INDEX · ONE WALK', colors.lime, {x: -470, y: 190, fs: 22, sh: 6}) as Rect;
  cover.opacity(0);
  view.add(
    <Node ref={root} opacity={0}>
      {sec.node}
      {clu.node}
      {tSec}
      {tClu}
      {subSec}
      {subClu}
      {sql}
      {walks.node}
      {pg}
      {cover}
      {pk}
    </Node>,
  );
  yield* root().opacity(1, 0.3);

  yield* say('In MySQL InnoDB the table itself is a B+tree, sorted by primary key. Its leaves hold the full rows.');
  yield* all(clu.node.opacity(1, 0.5), pop(tClu, 0.35), subClu.opacity(1, 0.4));
  yield* waitFor(2.8);
  yield* say('A secondary index is a separate B+tree. Its leaves hold the indexed key plus the primary key value.');
  yield* all(sec.node.opacity(1, 0.5), pop(tSec, 0.35), subSec.opacity(1, 0.4));
  yield* waitFor(3);

  yield* say('Now look up a user by email. First walk the secondary index.');
  yield* all(sql.opacity(1, 0.3), walks.node.opacity(1, 0.3));
  walks.val.text('1');
  yield* highlightStroke(sec.root, colors.yellow);
  yield* waitFor(0.9);
  yield* all(highlightStroke(sec.leaves[1], colors.yellow), clearStroke(sec.root));
  yield* sec.rows[1][1].fill('rgba(198,255,61,0.35)', 0.25);
  yield* say('We find ria@x.in, but the leaf only gives us the primary key: 42. Not the row yet.', 3);

  yield* say('Second walk: take that primary key and search the clustered index to reach the row.');
  pk.position([sec.pos(1).x, sec.pos(1).y]);
  yield* pop(pk, 0.3);
  yield* pk.position([-470, -130], 0.5, easeInOutCubic);
  yield* pk.position([470, -130], 0.9, easeInOutCubic);
  yield* all(pk.position([470, -215 - 50], 0.4, easeInOutCubic), clearStroke(sec.leaves[1]));
  walks.val.text('2');
  yield* highlightStroke(clu.root, colors.yellow);
  yield* waitFor(0.9);
  yield* all(pk.position([470, 95], 0.0001), pk.opacity(0, 0.2), clearStroke(clu.root));
  yield* highlightStroke(clu.leaves[1], colors.yellow);
  yield* clu.rows[1][1].fill('rgba(198,255,61,0.35)', 0.25);
  yield* shake(clu.leaves[1], 4, 3);
  yield* say('Two tree walks for one row. That is the price of looking something up through a secondary index.', 3.6);
  yield* pop(pg, 0.3);
  yield* say('PostgreSQL stores a row address into a separate heap instead, so every index is a secondary index.', 4);

  // covering index
  yield* all(
    clearStroke(clu.leaves[1]),
    clu.rows[1][1].fill(colors.clear, 0.2),
    sec.rows[1][1].fill(colors.clear, 0.2),
    pg.opacity(0, 0.3),
  );
  chipText(sql).text("SELECT id, email FROM users WHERE email = 'ria@x.in';");
  walks.val.text('1');
  yield* say('Trick: if the query only needs columns that are in the index, the second walk disappears.');
  yield* all(highlightStroke(sec.leaves[1], colors.lime), pop(cover, 0.35));
  yield* sec.rows[1][1].fill('rgba(198,255,61,0.35)', 0.25);
  yield* waitFor(2.8);
  yield* say('Databases call this a covering index, or an index-only scan. Add INCLUDE columns when it pays off.', 3.6);
  yield* leave(root());
}
