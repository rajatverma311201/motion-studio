import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, easeInOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {C, FONT, MONO, NB, chip, chipText, codePanel, countTo, focusLine, label, leave, num, pop, revealLines, say, shake} from './kit';
import {stat} from './s_intro';

// ================================================================ small helpers
interface Mini {
  node: Node;
  root: Rect;
  leaves: Rect[];
  rows: Rect[][];
  pos: (i: number) => {x: number; y: number};
}

/** a 2-level tree drawn with plain boxes: root + 3 leaves with highlightable rows */
function miniTree(cx: number, rootText: string, rows: string[][], rootCol: string, leafCol: string, rowFs: number): Mini {
  const LW = 262;
  const LH = 130;
  const G = 14;
  const rootY = -215;
  const leafY = 0;
  const node = (<Node opacity={0} />) as Node;
  const leaves: Rect[] = [];
  const rowRects: Rect[][] = [];
  const xs = rows.map((_, i) => cx + (i - 1) * (LW + G));
  xs.forEach(lx => node.add(<Line points={[[cx, rootY + 33], [lx, leafY - LH / 2]]} stroke={C.ink} lineWidth={3.5} />));
  const root = (
    <Rect x={cx} y={rootY} width={300} height={66} radius={14} fill={C.surf} {...NB(rootCol, 6, 3.5)}>
      <Txt text={rootText} fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.ink} />
    </Rect>
  ) as Rect;
  rows.forEach((rs, i) => {
    const hls: Rect[] = [];
    const leaf = (
      <Rect x={xs[i]} y={leafY} width={LW} height={LH} radius={14} fill={C.surf} {...NB(leafCol, 6, 3.5)}>
        {rs.map((t, j) => {
          const h = (
            <Rect y={-30 + j * 58} width={LW - 20} height={46} radius={8} fill={C.clear}>
              <Txt text={t} fontFamily={MONO} fontWeight={700} fontSize={rowFs} fill={C.ink} />
            </Rect>
          ) as Rect;
          hls.push(h);
          return h;
        })}
      </Rect>
    ) as Rect;
    leaves.push(leaf);
    rowRects.push(hls);
    node.add(leaf);
  });
  node.add(root);
  return {node, root, leaves, rows: rowRects, pos: i => ({x: xs[i], y: leafY})};
}

const lit = (r: Rect, color: string, dur = 0.2) => all(r.stroke(color, dur), r.lineWidth(6.5, dur));
const unlit = (r: Rect, dur = 0.2) => all(r.stroke(C.ink, dur), r.lineWidth(3.5, dur));

// ================================================================ CLUSTERED vs SECONDARY
export function* clustered(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const sec = miniTree(
    -470,
    'kabir@ │ tara@',
    [
      ['asha@x.in → 7', 'dev@x.in → 12'],
      ['kabir@x.in → 19', 'ria@x.in → 42'],
      ['tara@x.in → 90', 'zoya@x.in → 58'],
    ],
    C.violet,
    C.cyan,
    19,
  );
  const clu = miniTree(
    470,
    '19 │ 58',
    [
      ['7  Asha  asha@x.in', '12 Dev   dev@x.in'],
      ['19 Kabir kabir@x.in', '42 Ria   ria@x.in'],
      ['58 Zoya  zoya@x.in', '90 Tara  tara@x.in'],
    ],
    C.violet,
    C.lime,
    18,
  );
  const tSec = chip('SECONDARY INDEX · email', C.cyan, {x: -470, y: -330, fs: 24, sh: 6}) as Rect;
  const tClu = chip('CLUSTERED INDEX · primary key', C.lime, {x: 470, y: -330, fs: 24, sh: 6}) as Rect;
  const subSec = label('leaves store: key + primary key', -470, 105, {fs: 19, fill: C.mute});
  const subClu = label('leaves store: the full rows', 470, 105, {fs: 19, fill: C.mute});
  [tSec, tClu, subSec, subClu].forEach(n => n.opacity(0));
  const sqlTxt = createRef<Txt>();
  const sql = (
    <Rect x={0} y={-400} layout alignItems="center" padding={[8, 20]} radius={12} fill={C.code} {...NB(C.pink, 6, 3.5)} opacity={0}>
      <Txt ref={sqlTxt} text="SELECT * FROM users WHERE email = 'ria@x.in';" fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.ink} />
    </Rect>
  ) as Rect;
  const walks = stat(0, 300, 330, 120, 'TREE WALKS', C.orange);
  walks.node.opacity(0);
  const pk = chip('PK = 42', C.yellow, {x: -470, y: 0, fs: 24, sh: 5}) as Rect;
  pk.opacity(0);
  const pg = chip('POSTGRESQL: HEAP + ROW ADDRESS (TID)', C.surf2, {x: 0, y: 190, fs: 18, sh: 0, color: C.ink}) as Rect;
  pg.opacity(0);
  const cover = chip('COVERING INDEX · ONE WALK', C.lime, {x: -470, y: 190, fs: 22, sh: 6}) as Rect;
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
  yield* lit(sec.root, C.yellow);
  yield* waitFor(0.9);
  yield* all(lit(sec.leaves[1], C.yellow), unlit(sec.root));
  yield* sec.rows[1][1].fill('rgba(198,255,61,0.35)', 0.25);
  yield* say('We find ria@x.in, but the leaf only gives us the primary key: 42. Not the row yet.', 3);

  yield* say('Second walk: take that primary key and search the clustered index to reach the row.');
  pk.position([sec.pos(1).x, sec.pos(1).y]);
  yield* pop(pk, 0.3);
  yield* pk.position([-470, -130], 0.5, easeInOutCubic);
  yield* pk.position([470, -130], 0.9, easeInOutCubic);
  yield* all(pk.position([470, -215 - 50], 0.4, easeInOutCubic), unlit(sec.leaves[1]));
  walks.val.text('2');
  yield* lit(clu.root, C.yellow);
  yield* waitFor(0.9);
  yield* all(pk.position([470, 95], 0.0001), pk.opacity(0, 0.2), unlit(clu.root));
  yield* lit(clu.leaves[1], C.yellow);
  yield* clu.rows[1][1].fill('rgba(198,255,61,0.35)', 0.25);
  yield* shake(clu.leaves[1], 4, 3);
  yield* say('Two tree walks for one row. That is the price of looking something up through a secondary index.', 3.6);
  yield* pop(pg, 0.3);
  yield* say('PostgreSQL stores a row address into a separate heap instead, so every index is a secondary index.', 4);

  // covering index
  yield* all(unlit(clu.leaves[1]), clu.rows[1][1].fill(C.clear, 0.2), sec.rows[1][1].fill(C.clear, 0.2), pg.opacity(0, 0.3));
  chipText(sql).text('SELECT id, email FROM users WHERE email = \'ria@x.in\';');
  walks.val.text('1');
  yield* say('Trick: if the query only needs columns that are in the index, the second walk disappears.');
  yield* all(lit(sec.leaves[1], C.lime), pop(cover, 0.35));
  yield* sec.rows[1][1].fill('rgba(198,255,61,0.35)', 0.25);
  yield* waitFor(2.8);
  yield* say('Databases call this a covering index, or an index-only scan. Add INCLUDE columns when it pays off.', 3.6);
  yield* leave(root());
}

// ================================================================ COMPOSITE INDEX
export function* composite(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const data: [string, string][] = [
    ['Das', 'Asha'],
    ['Das', 'Ravi'],
    ['Rao', 'Dev'],
    ['Rao', 'Meera'],
    ['Shah', 'Anil'],
    ['Shah', 'Dev'],
    ['Shah', 'Zoya'],
    ['Singh', 'Kabir'],
    ['Singh', 'Neha'],
    ['Verma', 'Asha'],
    ['Verma', 'Ria'],
    ['Verma', 'Tara'],
  ];
  const rowRects = data.map(
    ([l, f], i) =>
      (
        <Rect x={-480} y={-300 + i * 42} width={560} height={38} radius={9} fill={C.surf} stroke={C.dim} lineWidth={2.5}>
          <Txt x={-250} offsetX={-1} text={l} fontFamily={MONO} fontWeight={700} fontSize={22} fill={C.ink} />
          <Txt x={0} offsetX={-1} text={f} fontFamily={MONO} fontSize={22} fill={C.mute} />
          <Txt x={236} offsetX={1} text={`#${i + 1}`} fontFamily={MONO} fontSize={16} fill={C.dim} />
        </Rect>
      ) as Rect,
  );
  const idxTitle = chip('INDEX ON (last_name, first_name)', C.violet, {x: -480, y: -380, fs: 22, sh: 6}) as Rect;
  const colA = label('LAST_NAME', -730, -340, {fs: 15, fill: C.mute});
  const colB = label('FIRST_NAME', -480, -340, {fs: 15, fill: C.mute});
  void colA;
  void colB;
  const q = createRef<Txt>();
  const qBox = (
    <Rect x={320} y={-240} layout alignItems="center" padding={[10, 20]} radius={14} fill={C.code} {...NB(C.pink, 7, 4)} opacity={0}>
      <Txt ref={q} text="" fontFamily={MONO} fontWeight={700} fontSize={26} fill={C.ink} />
    </Rect>
  ) as Rect;
  const verdict = chip('✓ USES THE INDEX', C.lime, {x: 320, y: -90, fs: 34, sh: 8, mono: false}) as Rect;
  verdict.opacity(0);
  const why1 = label('', 320, 20, {fs: 24, fill: C.ink, mono: false});
  const why2 = label('', 320, 66, {fs: 24, fill: C.mute, mono: false});
  const rule = chip('LEFTMOST PREFIX RULE', C.yellow, {x: 320, y: 220, fs: 26, sh: 6}) as Rect;
  rule.opacity(0);
  idxTitle.opacity(0);
  rowRects.forEach(r => r.opacity(0));
  view.add(
    <Node ref={root} opacity={0}>
      {idxTitle}
      {rowRects}
      {qBox}
      {verdict}
      {why1}
      {why2}
      {rule}
    </Node>,
  );
  yield* root().opacity(1, 0.3);

  const paint = (idx: number[], color: string, dur = 0.25) =>
    all(
      ...rowRects.map((r, i) => {
        const on = idx.includes(i);
        return all(r.fill(on ? color : C.surf, dur), r.stroke(on ? C.ink : C.dim, dur));
      }),
    );
  const ask = function* (sql: string, ok: boolean, title: string, a: string, b: string): ThreadGenerator {
    q().text(sql);
    yield* qBox.opacity(1, 0.3);
    chipText(verdict).text(title);
    verdict.fill(ok ? C.lime : C.red);
    why1.text(a);
    why2.text(b);
  };

  yield* say('A composite index sorts by the first column, then by the second inside each group, like a phone book.');
  yield* all(pop(idxTitle, 0.3), sequence(0.05, ...rowRects.map(r => r.opacity(1, 0.25))));
  yield* waitFor(3.2);

  yield* say('Query 1: only last_name. All the Shahs sit next to each other: one slice, easy to find.');
  yield* ask("WHERE last_name = 'Shah'", true, '✓ USES THE INDEX', 'Matches are contiguous in the sort order,', 'so the tree jumps straight to them.');
  yield* paint([4, 5, 6], 'rgba(198,255,61,0.55)');
  yield* pop(verdict, 0.3);
  yield* waitFor(3.2);

  yield* say('Query 2: both columns. Even better: one exact entry.');
  yield* all(verdict.opacity(0, 0.2), paint([], C.surf, 0.2));
  yield* ask("WHERE last_name = 'Shah'\n AND first_name = 'Dev'", true, '✓ BEST CASE', 'The first column narrows to the Shahs,', 'the second picks Dev inside that group.');
  yield* paint([5], 'rgba(198,255,61,0.7)');
  yield* pop(verdict, 0.3);
  yield* waitFor(3);

  yield* say('Query 3: only first_name. The Devs are scattered across the whole index. Sorting does not help.');
  yield* all(verdict.opacity(0, 0.2), paint([], C.surf, 0.2));
  yield* ask("WHERE first_name = 'Dev'", false, '✗ CANNOT USE IT WELL', 'Matches are spread everywhere,', 'so the database scans the entire index.');
  yield* paint([2, 5], 'rgba(255,77,77,0.55)');
  yield* pop(verdict, 0.3);
  yield* shake(verdict, 6, 4);
  yield* waitFor(3.4);

  yield* say('So an index on (a, b) helps queries on a, and on a + b, but not on b alone. Order of columns matters.', 4);
  yield* pop(rule, 0.35);
  yield* say('Rule of thumb: equality columns first, then the range or sort column last.', 3.6);
  yield* leave(root());
}

// ================================================================ COSTS
export function* costs(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const stage1 = (<Node />) as Node;
  const stage2 = (<Node opacity={0} />) as Node;
  view.add(
    <Node ref={root} opacity={0}>
      {stage1}
      {stage2}
    </Node>,
  );
  yield* root().opacity(1, 0.3);

  // ---- part 1: write tax
  const rowChip = chip('INSERT ▸ 1 NEW ROW', C.yellow, {x: -560, y: -60, fs: 26, sh: 7}) as Rect;
  const names = ['TABLE (HEAP / CLUSTERED)', 'idx_email', 'idx_city', 'idx_created_at', 'idx_status'];
  const cols = [C.cyan, C.violet, C.pink, C.orange, C.lime];
  const targets = names.map(
    (n, i) =>
      (
        <Rect x={110} y={-250 + i * 100} width={540} height={70} radius={14} fill={C.surf} {...NB(cols[i], 6, 3.5)} opacity={0}>
          <Txt text={n} fontFamily={MONO} fontWeight={700} fontSize={i === 0 ? 22 : 26} fill={C.ink} />
        </Rect>
      ) as Rect,
  );
  const arrows = names.map(
    (_, i) =>
      (<Line points={[[-390, -60], [-190, -250 + i * 100]]} stroke={cols[i]} lineWidth={5} endArrow arrowSize={14} end={0} />) as Line,
  );
  const writes = stat(640, -60, 300, 130, 'PAGES WRITTEN', C.red, '0');
  writes.node.opacity(0);
  stage1.add(rowChip);
  stage1.add(arrows);
  stage1.add(targets);
  stage1.add(writes.node);
  rowChip.opacity(0);

  yield* say('Indexes are not free. Every index is its own B+tree that must be kept in sync on every write.');
  yield* all(pop(rowChip, 0.3), writes.node.opacity(1, 0.3));
  yield* all(targets[0].opacity(1, 0.3), arrows[0].end(1, 0.5));
  writes.val.text('1');
  yield* waitFor(1.6);
  yield* say('Each extra index means one more tree to search, update and possibly split, for a single INSERT.');
  for (let i = 1; i < names.length; i++) {
    yield* all(targets[i].opacity(1, 0.3), arrows[i].end(1, 0.45));
    writes.val.text(String(i + 1));
    yield* waitFor(0.7);
  }
  yield* all(shake(writes.node, 6, 4));
  yield* say('Five times the write work. Updates to an indexed column and deletes pay the same tax.', 3.8);
  yield* say('So: index what your queries really filter, join and sort on. Nothing more.', 3.4);
  yield* stage1.opacity(0, 0.4);

  // ---- part 2: sequential vs random keys
  yield* stage2.opacity(1, 0.01);
  const mkRow = (y: number, title: string, fills: number[], col: string, note: string, noteCol: string) => {
    const t = label(title, 0, y - 110, {fs: 22, fill: C.ink});
    const blocks: {fill: Rect}[] = [];
    const g = (<Node />) as Node;
    fills.forEach((f, i) => {
      const fillRect = (<Rect x={0} y={61} width={80} height={0} offsetY={1} radius={6} fill={col} />) as Rect;
      const b = (
        <Rect x={(i - (fills.length - 1) / 2) * 116} y={y} width={96} height={130} radius={12} fill={C.surf} {...NB(C.ink, 0, 3.5)}>
          {fillRect}
        </Rect>
      ) as Rect;
      blocks.push({fill: fillRect});
      g.add(b);
    });
    const n = chip(note, noteCol, {y: y + 105, fs: 22, sh: 6}) as Rect;
    n.opacity(0);
    t.opacity(0);
    g.opacity(0);
    stage2.add(t);
    stage2.add(g);
    stage2.add(n);
    return {t, g, n, blocks, fills};
  };
  const seq = mkRow(-190, 'AUTO-INCREMENT ID: ALWAYS APPENDS TO THE RIGHT EDGE', [1, 1, 1, 1, 1, 1, 1, 1, 0.35], C.lime, 'PAGES ≈ 100% FULL', C.lime);
  const rnd = mkRow(95, 'RANDOM UUID: LANDS IN A RANDOM LEAF, FORCING SPLITS', [0.66, 0.74, 0.6, 0.8, 0.69, 0.63, 0.77, 0.58, 0.72], C.pink, 'PAGES ≈ 70% FULL', C.pink);
  yield* say('Key choice matters too. Auto-increment ids always insert at the right edge, so leaves fill up completely.');
  yield* all(seq.t.opacity(1, 0.3), seq.g.opacity(1, 0.3));
  yield* all(...seq.blocks.map((b, i) => delay(i * 0.08, b.fill.height(seq.fills[i] * 122, 0.5))));
  yield* pop(seq.n, 0.3);
  yield* waitFor(2.2);
  yield* say('Random keys, like UUIDv4, hit random leaves. Pages split at random spots and end up about 70% full.');
  yield* all(rnd.t.opacity(1, 0.3), rnd.g.opacity(1, 0.3));
  yield* all(...rnd.blocks.map((b, i) => delay(i * 0.08, b.fill.height(rnd.fills[i] * 122, 0.5))));
  yield* pop(rnd.n, 0.3);
  yield* waitFor(2.4);
  yield* say('More pages means more I/O and a colder cache. Time-ordered ids (UUIDv7, ULID, snowflake) avoid that.', 4.2);
  yield* leave(root());
}

// ================================================================ EXPLAIN + GOTCHAS
export function* explain(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const stageA = (<Node />) as Node;
  const stageB = (<Node opacity={0} />) as Node;
  view.add(
    <Node ref={root} opacity={0}>
      {stageA}
      {stageB}
    </Node>,
  );
  const sql = (
    <Rect y={-400} layout alignItems="center" padding={[8, 20]} radius={12} fill={C.code} {...NB(C.cyan, 6, 3.5)}>
      <Txt text="EXPLAIN SELECT * FROM users WHERE email = 'ria@x.in';" fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.ink} />
    </Rect>
  ) as Rect;
  const before = codePanel({
    x: -470,
    y: -150,
    w: 880,
    title: 'plan: no index',
    lang: 'plan',
    accent: C.red,
    fs: 22,
    code: ['Seq Scan on users', '  (cost=0.00..208334.00 rows=1)', "  Filter: (email = 'ria@x.in')"],
  });
  const after = codePanel({
    x: 470,
    y: -150,
    w: 880,
    title: 'plan: with index',
    lang: 'plan',
    accent: C.lime,
    fs: 22,
    code: ['Index Scan using idx_users_email', '  on users  (cost=0.43..8.45 rows=1)', "  Index Cond: (email = 'ria@x.in')"],
  });
  const bChip = chip('BEFORE · READS ALL 100,000 PAGES', C.red, {x: -470, y: 60, fs: 22, sh: 6, color: C.ink}) as Rect;
  const aChip = chip('AFTER · READS ~4 PAGES', C.lime, {x: 470, y: 60, fs: 22, sh: 6}) as Rect;
  const illus = label('(illustrative PostgreSQL-style output)', 0, 150, {fs: 18, fill: C.mute});
  [sql, bChip, aChip, illus].forEach(n => n.opacity(0));
  stageA.add(sql);
  stageA.add(before.node);
  stageA.add(after.node);
  stageA.add(bChip);
  stageA.add(aChip);
  stageA.add(illus);
  yield* root().opacity(1, 0.3);

  yield* say('How do you know an index is actually used? Ask the database: EXPLAIN shows the query plan.');
  yield* sql.opacity(1, 0.3);
  yield* all(before.node.opacity(1, 0.01), after.node.opacity(1, 0.01));
  yield* all(revealLines(before), illus.opacity(1, 0.4));
  yield* focusLine(before, 0, C.red);
  yield* pop(bChip, 0.35);
  yield* say('Seq Scan means it reads the whole table, row after row. Slow on large tables.', 3.2);
  yield* revealLines(after);
  yield* focusLine(after, 0, C.lime);
  yield* pop(aChip, 0.35);
  yield* say('Index Scan means it walks the B+tree. The cost estimate drops from hundreds of thousands to single digits.', 4);
  yield* say('Run EXPLAIN ANALYZE to see real timings. Never guess about performance.', 3.2);
  yield* stageA.opacity(0, 0.4);

  // ---- gotchas
  const data: [string, string, string, string][] = [
    ['1 · FUNCTION ON THE COLUMN', "WHERE LOWER(email) = 'ria@x.in'", "WHERE email = 'ria@x.in'", 'The index is sorted by raw email, not LOWER(email). Hide the column inside a function and the sort order is useless. Or create an index on the expression.'],
    ['2 · LEADING WILDCARD', "WHERE name LIKE '%ria'", "WHERE name LIKE 'ria%'", 'A prefix is one contiguous range in the sorted index. A suffix could match anywhere, so the whole index is scanned.'],
    ['3 · TYPE MISMATCH', 'WHERE phone = 9876543210   -- text column', "WHERE phone = '9876543210'", 'Comparing text to a number can force a cast on the column side. The cast turns the column into an expression and the index is skipped.'],
    ['4 · LOW SELECTIVITY', 'WHERE is_active = true   -- 95% of rows', "WHERE status = 'FAILED'   -- 0.1% of rows", 'If a filter matches most rows, bouncing through an index is slower than one straight scan. The planner will rightly ignore it.'],
    ['5 · TOO MANY INDEXES', '12 indexes "just in case"', 'Index only what queries use', 'Every write maintains every index. Check usage statistics, then drop the ones nobody reads.'],
  ];
  const tt = createRef<Txt>();
  const bt = createRef<Txt>();
  const gt = createRef<Txt>();
  const wt = createRef<Txt>();
  const gotcha = (
    <Rect y={-20} width={1620} height={620} radius={26} fill={C.surf} {...NB(C.orange, 10, 4)} opacity={0}>
      <Txt ref={tt} y={-250} text="" fontFamily={MONO} fontWeight={700} fontSize={30} letterSpacing={3} fill={C.orange} />
      <Rect y={-120} width={1500} height={96} radius={16} fill="rgba(255,77,77,0.14)" stroke={C.red} lineWidth={4}>
        <Txt x={-690} offsetX={-1} text="✗" fontFamily={FONT} fontWeight={700} fontSize={44} fill={C.red} />
        <Txt ref={bt} x={-620} offsetX={-1} text="" fontFamily={MONO} fontWeight={700} fontSize={30} fill={C.ink} />
      </Rect>
      <Rect y={10} width={1500} height={96} radius={16} fill="rgba(198,255,61,0.12)" stroke={C.lime} lineWidth={4}>
        <Txt x={-690} offsetX={-1} text="✓" fontFamily={FONT} fontWeight={700} fontSize={44} fill={C.lime} />
        <Txt ref={gt} x={-620} offsetX={-1} text="" fontFamily={MONO} fontWeight={700} fontSize={30} fill={C.ink} />
      </Rect>
      <Txt ref={wt} y={170} width={1400} textWrap textAlign="center" text="" fontFamily={FONT} fontWeight={500} fontSize={30} fill={C.ink} />
    </Rect>
  ) as Rect;
  stageB.add(gotcha);
  yield* stageB.opacity(1, 0.01);
  yield* say('Now the classic reasons an index exists but the query still ignores it.', 2.4);
  for (let i = 0; i < data.length; i++) {
    const [t, bad, good, why] = data[i];
    if (i > 0) yield* gotcha.opacity(0, 0.25);
    const shortCaps = ['The column is wrapped in a function.', 'The pattern starts with a wildcard.', 'The types do not match.', 'The filter matches almost every row.', 'There are far too many indexes.'];
    yield* say(`Gotcha ${i + 1}: ${shortCaps[i]}`);
    tt().text(t);
    bt().text(bad);
    gt().text(good);
    wt().text(why);
    yield* gotcha.opacity(1, 0.35);
    if (i === 0) yield* shake(gotcha, 5, 3);
    yield* waitFor(i === 4 ? 6.4 : 6.6);
  }
  yield* leave(root());
}

// ================================================================ RECAP
export function* recap(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const items: [string, string, string][] = [
    ['INDEX', 'A sorted copy of a column, with pointers to the rows.', C.lime],
    ['B-TREE', 'Wide, shallow, balanced. Millions of rows in 3 or 4 page reads.', C.cyan],
    ['B+TREE', 'All entries in linked leaves. Great for ranges and ORDER BY.', C.pink],
    ['SECONDARY', 'Index → primary key → row. Cover the query to skip the second walk.', C.yellow],
    ['COMPOSITE', 'Leftmost prefix rule. Equality columns first, range last.', C.violet],
    ['COST', 'Every index slows writes. Check EXPLAIN before you trust an index.', C.orange],
  ];
  const cards = items.map(
    ([h, t, col], i) =>
      (
        <Rect x={-590 + (i % 3) * 590} y={-150 + Math.floor(i / 3) * 250} width={560} height={215} radius={22} fill={C.surf} {...NB(col, 9, 4)} opacity={0}>
          <Txt y={-62} text={h} fontFamily={MONO} fontWeight={700} fontSize={30} letterSpacing={4} fill={col} />
          <Txt y={25} width={490} textWrap textAlign="center" text={t} fontFamily={FONT} fontWeight={600} fontSize={26} fill={C.ink} />
        </Rect>
      ) as Rect,
  );
  const title = chip('RECAP', C.lime, {y: -370, fs: 40, sh: 8, rot: -2}) as Rect;
  const thanks = chip('INDEX THE QUERIES YOU RUN. MEASURE WITH EXPLAIN.', C.yellow, {y: 350, fs: 28, sh: 8, rot: 1, mono: false}) as Rect;
  title.opacity(0);
  thanks.opacity(0);
  view.add(
    <Node ref={root} opacity={0}>
      {title}
      {cards}
      {thanks}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Let us put it all together.');
  yield* pop(title, 0.35);
  const caps = [
    'An index is a sorted structure that turns an O(n) scan into an O(log n) lookup.',
    'B-trees pack hundreds of keys per page, so the tree stays tiny in height.',
    'B+trees keep data in linked leaves, which makes range scans and sorting cheap.',
    'Secondary indexes need an extra hop to the row, unless the index covers the query.',
    'Composite indexes follow the leftmost prefix rule, so column order matters.',
    'Indexes cost write time and space. Use EXPLAIN to prove they help.',
  ];
  for (let i = 0; i < cards.length; i++) {
    yield* say(caps[i]);
    yield* pop(cards[i], 0.4);
    yield* waitFor(2.6);
  }
  yield* all(pop(thanks, 0.4), say('That is how a database finds one row among millions. Thanks for watching.', 0));
  yield* waitFor(4.5);
  yield* leave(root());
}

void num;
void countTo;
