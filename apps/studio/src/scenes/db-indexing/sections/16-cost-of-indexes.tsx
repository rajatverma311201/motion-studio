import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, waitFor} from '@motion-canvas/core';
import {chip, colors, fonts, label, leave, neubrutal, pop, say, shake, statCard} from '@motion-studio/video-kit';

// ================================================================ COSTS
export function* costOfIndexesSection(view: View2D): ThreadGenerator {
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
  const rowChip = chip('INSERT ▸ 1 NEW ROW', colors.yellow, {x: -560, y: -60, fs: 26, sh: 7}) as Rect;
  const names = ['TABLE (HEAP / CLUSTERED)', 'idx_email', 'idx_city', 'idx_created_at', 'idx_status'];
  const cols = [colors.cyan, colors.violet, colors.pink, colors.orange, colors.lime];
  const targets = names.map(
    (n, i) =>
      (
        <Rect
          x={110}
          y={-250 + i * 100}
          width={540}
          height={70}
          radius={14}
          fill={colors.surf}
          {...neubrutal(cols[i], 6, 3.5)}
          opacity={0}
        >
          <Txt text={n} fontFamily={fonts.mono} fontWeight={700} fontSize={i === 0 ? 22 : 26} fill={colors.ink} />
        </Rect>
      ) as Rect,
  );
  const arrows = names.map(
    (_, i) =>
      (
        <Line
          points={[
            [-390, -60],
            [-190, -250 + i * 100],
          ]}
          stroke={cols[i]}
          lineWidth={5}
          endArrow
          arrowSize={14}
          end={0}
        />
      ) as Line,
  );
  const writes = statCard(640, -60, 300, 130, 'PAGES WRITTEN', colors.red, '0');
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
    const t = label(title, 0, y - 110, {fs: 22, fill: colors.ink});
    const blocks: {fill: Rect}[] = [];
    const g = (<Node />) as Node;
    fills.forEach((f, i) => {
      const fillRect = (<Rect x={0} y={61} width={80} height={0} offsetY={1} radius={6} fill={col} />) as Rect;
      const b = (
        <Rect
          x={(i - (fills.length - 1) / 2) * 116}
          y={y}
          width={96}
          height={130}
          radius={12}
          fill={colors.surf}
          {...neubrutal(colors.ink, 0, 3.5)}
        >
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
  const seq = mkRow(
    -190,
    'AUTO-INCREMENT ID: ALWAYS APPENDS TO THE RIGHT EDGE',
    [1, 1, 1, 1, 1, 1, 1, 1, 0.35],
    colors.lime,
    'PAGES ≈ 100% FULL',
    colors.lime,
  );
  const rnd = mkRow(
    95,
    'RANDOM UUID: LANDS IN A RANDOM LEAF, FORCING SPLITS',
    [0.66, 0.74, 0.6, 0.8, 0.69, 0.63, 0.77, 0.58, 0.72],
    colors.pink,
    'PAGES ≈ 70% FULL',
    colors.pink,
  );
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
