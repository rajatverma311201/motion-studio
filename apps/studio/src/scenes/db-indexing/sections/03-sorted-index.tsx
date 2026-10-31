import {Circle, Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeInOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {
  chip,
  chipText,
  colors,
  countTo,
  fonts,
  label,
  leave,
  neubrutal,
  pop,
  say,
  shake,
  statCard,
} from '@motion-studio/video-kit';

// ================================================================ SORTED INDEX + BINARY SEARCH
export function* sortedIndexSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const KEYS = [3, 12, 25, 31, 44, 58, 67, 72, 80, 91, 103, 118];
  const CW = 110;
  const X0 = -605;
  const Y = -150;
  const xAt = (i: number) => X0 + i * CW;
  const mkCell = (k: number, i: number) =>
    (
      <Rect x={xAt(i)} y={Y} width={100} height={84} radius={14} fill={colors.surf2} {...neubrutal(colors.lime, 5, 3.5)}>
        <Txt y={-8} text={String(k)} fontFamily={fonts.mono} fontWeight={700} fontSize={34} fill={colors.ink} />
        <Circle y={26} size={11} fill={colors.orange} />
      </Rect>
    ) as Rect;
  const cells = KEYS.map(mkCell);
  const cellTxt = (c: Rect) => c.children()[0] as Txt;

  const title = chip('SORTED INDEX: KEY + POINTER TO THE ROW', colors.lime, {x: -330, y: -345, fs: 20, sh: 5}) as Rect;
  const cmp = chip('LOOKING FOR 91', colors.yellow, {x: 330, y: -345, fs: 22, sh: 5}) as Rect;
  cmp.opacity(0);
  const heapLabel = label('THE TABLE (HEAP): ROWS IN NO PARTICULAR ORDER', 0, 20, {fs: 18});
  const pagesData: number[][] = [
    [58, 7, 120],
    [3, 40, 77],
    [25, 66, 12],
    [31, 8, 103],
    [44, 91, 72],
    [80, 19, 67],
  ];
  const pages = pagesData.map(
    (rows, i) =>
      (
        <Rect
          x={-550 + i * 220}
          y={150}
          width={200}
          height={170}
          radius={16}
          fill={colors.surf}
          stroke={colors.dim}
          lineWidth={3.5}
        >
          <Txt
            y={-60}
            text={`PAGE ${i + 1}`}
            fontFamily={fonts.mono}
            fontWeight={700}
            fontSize={16}
            letterSpacing={2}
            fill={colors.mute}
          />
          {rows.map((r, j) => (
            <Txt y={-18 + j * 36} text={`id ${r}`} fontFamily={fonts.mono} fontWeight={700} fontSize={24} fill={colors.ink} />
          ))}
        </Rect>
      ) as Rect,
  );
  const ptr = (
    <Line
      points={[
        [xAt(9), Y + 46],
        [xAt(9), Y + 70],
        [-550 + 4 * 220 + 60, 110],
        [-550 + 4 * 220 + 60, 118],
      ]}
      stroke={colors.orange}
      lineWidth={5}
      endArrow
      arrowSize={14}
      radius={18}
      end={0}
    />
  ) as Line;
  heapLabel.opacity(0);
  pages.forEach(p => p.opacity(0));
  cells.forEach(c => c.opacity(0));
  title.opacity(0);
  view.add(
    <Node ref={root}>
      {title}
      {cmp}
      {cells}
      {heapLabel}
      {pages}
      {ptr}
    </Node>,
  );

  yield* say('Idea: keep a second structure, sorted by key, where each key points to its row.');
  yield* all(title.opacity(1, 0.4), sequence(0.06, ...cells.map(c => c.opacity(1, 0.25))));
  yield* all(heapLabel.opacity(1, 0.4), sequence(0.08, ...pages.map(p => p.opacity(1, 0.3))));
  yield* waitFor(2);

  yield* say('Because the keys are sorted we can use binary search: always check the middle first.');
  yield* cmp.opacity(1, 0.3);
  let lo = 0;
  let hi = KEYS.length - 1;
  const target = 91;
  let steps = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps++;
    yield* all(
      ...cells.map((c, i) => c.opacity(i >= lo && i <= hi ? 1 : 0.22, 0.25)),
      cells[mid].fill(colors.yellow, 0.2),
      cellTxt(cells[mid]).fill(colors.dark, 0.2),
    );
    if (KEYS[mid] === target) {
      yield* all(cells[mid].fill(colors.lime, 0.2), shake(cells[mid], 4, 3));
      chipText(cmp).text(`FOUND 91 IN ${steps} STEPS`);
      break;
    }
    if (KEYS[mid] < target) {
      chipText(cmp).text(`${target} > ${KEYS[mid]}: GO RIGHT`);
      lo = mid + 1;
    } else {
      chipText(cmp).text(`${target} < ${KEYS[mid]}: GO LEFT`);
      hi = mid - 1;
    }
    yield* waitFor(1.5);
    yield* all(cells[mid].fill(colors.surf2, 0.2), cellTxt(cells[mid]).fill(colors.ink, 0.2));
  }
  yield* say('Four steps for 12 keys. Each step halves the search space: O(log n).', 2.6);

  yield* say('The entry points straight at the row: one more read and we have it.');
  yield* all(ptr.end(1, 0.7), pages[4].stroke(colors.orange, 0.3), pages[4].lineWidth(6, 0.3));
  yield* waitFor(2.6);
  yield* say('For 10 million keys that is only about 24 steps, instead of 10 million rows.', 3.2);

  // insertion cost
  yield* all(
    ptr.opacity(0, 0.3),
    pages[4].stroke(colors.dim, 0.3),
    pages[4].lineWidth(3.5, 0.3),
    ...cells.map(c => all(c.opacity(1, 0.3), c.fill(colors.surf2, 0.3), cellTxt(c).fill(colors.ink, 0.3))),
  );
  chipText(cmp).text('NEW ROW: INSERT KEY 50');
  yield* say('But the list must stay sorted. Inserting 50 means shifting everything after it.');
  yield* waitFor(1.2);
  const fresh = mkCell(50, 5);
  fresh.y(Y - 95);
  fresh.opacity(0);
  fresh.fill(colors.yellow);
  cellTxt(fresh).fill(colors.dark);
  root().add(fresh);
  yield* fresh.opacity(1, 0.3);
  const moved = statCard(330, 335, 360, 110, 'ENTRIES SHIFTED', colors.pink);
  root().add(moved.node);
  yield* pop(moved.node, 0.3);
  yield* all(
    sequence(0.1, ...cells.slice(5).map(c => c.x(c.x() + CW, 0.3))),
    countTo(moved.val, 0, 7, 0.8, n => String(Math.round(n))),
  );
  yield* fresh.position([xAt(5), Y], 0.5, easeInOutCubic);
  yield* all(fresh.fill(colors.surf2, 0.3), cellTxt(fresh).fill(colors.ink, 0.3));
  yield* say('On disk that means rewriting many pages for one insert. Fast reads, slow writes.', 3.4);
  yield* say('We need a structure that stays sorted without shifting everything. A tree does that.', 3.2);
  yield* leave(root());
}
