import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, waitFor} from '@motion-canvas/core';
import {chip, codePanel, colors, fonts, focusLine, label, leave, neubrutal, pop, revealLines, say, shake} from '@motion-studio/video-kit';

// ================================================================ EXPLAIN + GOTCHAS
export function* explainAndGotchasSection(view: View2D): ThreadGenerator {
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
    <Rect
      y={-400}
      layout
      alignItems="center"
      padding={[8, 20]}
      radius={12}
      fill={colors.code}
      {...neubrutal(colors.cyan, 6, 3.5)}
    >
      <Txt
        text="EXPLAIN SELECT * FROM users WHERE email = 'ria@x.in';"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={24}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;
  const before = codePanel({
    x: -470,
    y: -150,
    w: 880,
    title: 'plan: no index',
    lang: 'plan',
    accent: colors.red,
    fs: 22,
    code: ['Seq Scan on users', '  (cost=0.00..208334.00 rows=1)', "  Filter: (email = 'ria@x.in')"],
  });
  const after = codePanel({
    x: 470,
    y: -150,
    w: 880,
    title: 'plan: with index',
    lang: 'plan',
    accent: colors.lime,
    fs: 22,
    code: ['Index Scan using idx_users_email', '  on users  (cost=0.43..8.45 rows=1)', "  Index Cond: (email = 'ria@x.in')"],
  });
  const bChip = chip('BEFORE · READS ALL 100,000 PAGES', colors.red, {x: -470, y: 60, fs: 22, sh: 6, color: colors.ink}) as Rect;
  const aChip = chip('AFTER · READS ~4 PAGES', colors.lime, {x: 470, y: 60, fs: 22, sh: 6}) as Rect;
  const illus = label('(illustrative PostgreSQL-style output)', 0, 150, {fs: 18, fill: colors.mute});
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
  yield* focusLine(before, 0, colors.red);
  yield* pop(bChip, 0.35);
  yield* say('Seq Scan means it reads the whole table, row after row. Slow on large tables.', 3.2);
  yield* revealLines(after);
  yield* focusLine(after, 0, colors.lime);
  yield* pop(aChip, 0.35);
  yield* say('Index Scan means it walks the B+tree. The cost estimate drops from hundreds of thousands to single digits.', 4);
  yield* say('Run EXPLAIN ANALYZE to see real timings. Never guess about performance.', 3.2);
  yield* stageA.opacity(0, 0.4);

  // ---- gotchas
  const data: [string, string, string, string][] = [
    [
      '1 · FUNCTION ON THE COLUMN',
      "WHERE LOWER(email) = 'ria@x.in'",
      "WHERE email = 'ria@x.in'",
      'The index is sorted by raw email, not LOWER(email). Hide the column inside a function and the sort order is useless. Or create an index on the expression.',
    ],
    [
      '2 · LEADING WILDCARD',
      "WHERE name LIKE '%ria'",
      "WHERE name LIKE 'ria%'",
      'A prefix is one contiguous range in the sorted index. A suffix could match anywhere, so the whole index is scanned.',
    ],
    [
      '3 · TYPE MISMATCH',
      'WHERE phone = 9876543210   -- text column',
      "WHERE phone = '9876543210'",
      'Comparing text to a number can force a cast on the column side. The cast turns the column into an expression and the index is skipped.',
    ],
    [
      '4 · LOW SELECTIVITY',
      'WHERE is_active = true   -- 95% of rows',
      "WHERE status = 'FAILED'   -- 0.1% of rows",
      'If a filter matches most rows, bouncing through an index is slower than one straight scan. The planner will rightly ignore it.',
    ],
    [
      '5 · TOO MANY INDEXES',
      '12 indexes "just in case"',
      'Index only what queries use',
      'Every write maintains every index. Check usage statistics, then drop the ones nobody reads.',
    ],
  ];
  const tt = createRef<Txt>();
  const bt = createRef<Txt>();
  const gt = createRef<Txt>();
  const wt = createRef<Txt>();
  const gotcha = (
    <Rect y={-20} width={1620} height={620} radius={26} fill={colors.surf} {...neubrutal(colors.orange, 10, 4)} opacity={0}>
      <Txt ref={tt} y={-250} text="" fontFamily={fonts.mono} fontWeight={700} fontSize={30} letterSpacing={3} fill={colors.orange} />
      <Rect y={-120} width={1500} height={96} radius={16} fill="rgba(255,77,77,0.14)" stroke={colors.red} lineWidth={4}>
        <Txt x={-690} offsetX={-1} text="✗" fontFamily={fonts.sans} fontWeight={700} fontSize={44} fill={colors.red} />
        <Txt ref={bt} x={-620} offsetX={-1} text="" fontFamily={fonts.mono} fontWeight={700} fontSize={30} fill={colors.ink} />
      </Rect>
      <Rect y={10} width={1500} height={96} radius={16} fill="rgba(198,255,61,0.12)" stroke={colors.lime} lineWidth={4}>
        <Txt x={-690} offsetX={-1} text="✓" fontFamily={fonts.sans} fontWeight={700} fontSize={44} fill={colors.lime} />
        <Txt ref={gt} x={-620} offsetX={-1} text="" fontFamily={fonts.mono} fontWeight={700} fontSize={30} fill={colors.ink} />
      </Rect>
      <Txt
        ref={wt}
        y={170}
        width={1400}
        textWrap
        textAlign="center"
        text=""
        fontFamily={fonts.sans}
        fontWeight={500}
        fontSize={30}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;
  stageB.add(gotcha);
  yield* stageB.opacity(1, 0.01);
  yield* say('Now the classic reasons an index exists but the query still ignores it.', 2.4);
  for (let i = 0; i < data.length; i++) {
    const [t, bad, good, why] = data[i];
    if (i > 0) yield* gotcha.opacity(0, 0.25);
    const shortCaps = [
      'The column is wrapped in a function.',
      'The pattern starts with a wildcard.',
      'The types do not match.',
      'The filter matches almost every row.',
      'There are far too many indexes.',
    ];
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
