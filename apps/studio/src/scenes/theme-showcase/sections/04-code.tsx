import {Node, type View2D} from '@motion-canvas/2d';
import type {ThreadGenerator} from '@motion-canvas/core';
import {createRef, waitFor} from '@motion-canvas/core';
import {codePanel, colors, focusLine, leave, revealLines, say} from '@motion-studio/video-kit';

const SQL = [
  'SELECT id, name',
  'FROM users',
  "WHERE plan = 'pro'",
  'ORDER BY name',
  'LIMIT 20;',
  '-- uses the index',
  'EXPLAIN ANALYZE;',
];

const PLAN = [
  'Index Scan using users_plan_idx',
  "  Index Cond: (plan = 'pro')",
  '  Filter: (active = true)',
  '  Rows Removed by Filter: 12',
  'Planning Time: 0.084 ms',
  'Execution Time: 0.21 ms',
];

export function* codeSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const sql = codePanel({
    x: -430,
    y: -20,
    w: 780,
    title: 'users.sql',
    code: SQL,
    lang: 'sql',
    accent: colors.cyan,
  });
  const plan = codePanel({
    x: 430,
    y: -20,
    w: 780,
    title: 'EXPLAIN',
    code: PLAN,
    lang: 'plan',
    accent: colors.violet,
  });

  view.add(
    <Node ref={root} opacity={0}>
      {sql.node}
      {plan.node}
    </Node>,
  );

  yield* root().opacity(1, 0.25);
  yield* say('The code panel keeps its monospace grid in every theme and both modes.');
  yield* revealLines(sql);
  yield* focusLine(sql, 2, colors.yellow);
  yield* say('Reveal the lines, then move the focus bar to the line that matters.');
  yield* revealLines(plan);
  yield* focusLine(plan, 0, colors.lime);
  yield* waitFor(2.5);
  yield* leave(root());
}
