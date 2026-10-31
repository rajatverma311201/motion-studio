import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {chip, chipText, colors, fonts, label, leave, neubrutal, pop, say, shake} from '@motion-studio/video-kit';

// ================================================================ COMPOSITE INDEX
export function* compositeIndexesSection(view: View2D): ThreadGenerator {
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
        <Rect
          x={-480}
          y={-300 + i * 42}
          width={560}
          height={38}
          radius={9}
          fill={colors.surf}
          stroke={colors.dim}
          lineWidth={2.5}
        >
          <Txt
            x={-250}
            offsetX={-1}
            text={l}
            fontFamily={fonts.mono}
            fontWeight={700}
            fontSize={22}
            fill={colors.ink}
          />
          <Txt x={0} offsetX={-1} text={f} fontFamily={fonts.mono} fontSize={22} fill={colors.mute} />
          <Txt x={236} offsetX={1} text={`#${i + 1}`} fontFamily={fonts.mono} fontSize={16} fill={colors.dim} />
        </Rect>
      ) as Rect,
  );
  const idxTitle = chip('INDEX ON (last_name, first_name)', colors.violet, {x: -480, y: -380, fs: 22, sh: 6}) as Rect;
  const q = createRef<Txt>();
  const qBox = (
    <Rect
      x={320}
      y={-240}
      layout
      alignItems="center"
      padding={[10, 20]}
      radius={14}
      fill={colors.code}
      {...neubrutal(colors.pink, 7, 4)}
      opacity={0}
    >
      <Txt ref={q} text="" fontFamily={fonts.mono} fontWeight={700} fontSize={26} fill={colors.ink} />
    </Rect>
  ) as Rect;
  const verdict = chip('✓ USES THE INDEX', colors.lime, {x: 320, y: -90, fs: 34, sh: 8, mono: false}) as Rect;
  verdict.opacity(0);
  const why1 = label('', 320, 20, {fs: 24, fill: colors.ink, mono: false});
  const why2 = label('', 320, 66, {fs: 24, fill: colors.mute, mono: false});
  const rule = chip('LEFTMOST PREFIX RULE', colors.yellow, {x: 320, y: 220, fs: 26, sh: 6}) as Rect;
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
        return all(r.fill(on ? color : colors.surf, dur), r.stroke(on ? colors.ink : colors.dim, dur));
      }),
    );
  const ask = function* (sql: string, ok: boolean, title: string, a: string, b: string): ThreadGenerator {
    q().text(sql);
    yield* qBox.opacity(1, 0.3);
    chipText(verdict).text(title);
    verdict.fill(ok ? colors.lime : colors.red);
    why1.text(a);
    why2.text(b);
  };

  yield* say('A composite index sorts by the first column, then by the second inside each group, like a phone book.');
  yield* all(pop(idxTitle, 0.3), sequence(0.05, ...rowRects.map(r => r.opacity(1, 0.25))));
  yield* waitFor(3.2);

  yield* say('Query 1: only last_name. All the Shahs sit next to each other: one slice, easy to find.');
  yield* ask(
    "WHERE last_name = 'Shah'",
    true,
    '✓ USES THE INDEX',
    'Matches are contiguous in the sort order,',
    'so the tree jumps straight to them.',
  );
  yield* paint([4, 5, 6], 'rgba(198,255,61,0.55)');
  yield* pop(verdict, 0.3);
  yield* waitFor(3.2);

  yield* say('Query 2: both columns. Even better: one exact entry.');
  yield* all(verdict.opacity(0, 0.2), paint([], colors.surf, 0.2));
  yield* ask(
    "WHERE last_name = 'Shah'\n AND first_name = 'Dev'",
    true,
    '✓ BEST CASE',
    'The first column narrows to the Shahs,',
    'the second picks Dev inside that group.',
  );
  yield* paint([5], 'rgba(198,255,61,0.7)');
  yield* pop(verdict, 0.3);
  yield* waitFor(3);

  yield* say('Query 3: only first_name. The Devs are scattered across the whole index. Sorting does not help.');
  yield* all(verdict.opacity(0, 0.2), paint([], colors.surf, 0.2));
  yield* ask(
    "WHERE first_name = 'Dev'",
    false,
    '✗ CANNOT USE IT WELL',
    'Matches are spread everywhere,',
    'so the database scans the entire index.',
  );
  yield* paint([2, 5], 'rgba(255,77,77,0.55)');
  yield* pop(verdict, 0.3);
  yield* shake(verdict, 6, 4);
  yield* waitFor(3.4);

  yield* say(
    'So an index on (a, b) helps queries on a, and on a + b, but not on b alone. Order of columns matters.',
    4,
  );
  yield* pop(rule, 0.35);
  yield* say('Rule of thumb: equality columns first, then the range or sort column last.', 3.6);
  yield* leave(root());
}
