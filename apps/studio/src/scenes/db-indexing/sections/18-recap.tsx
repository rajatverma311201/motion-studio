import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, waitFor} from '@motion-canvas/core';
import {chip, colors, fonts, leave, neubrutal, pop, say} from '@motion-studio/video-kit';

// ================================================================ RECAP
export function* recapSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const items: [string, string, string][] = [
    ['INDEX', 'A sorted copy of a column, with pointers to the rows.', colors.lime],
    ['B-TREE', 'Wide, shallow, balanced. Millions of rows in 3 or 4 page reads.', colors.cyan],
    ['B+TREE', 'All entries in linked leaves. Great for ranges and ORDER BY.', colors.pink],
    ['SECONDARY', 'Index → primary key → row. Cover the query to skip the second walk.', colors.yellow],
    ['COMPOSITE', 'Leftmost prefix rule. Equality columns first, range last.', colors.violet],
    ['COST', 'Every index slows writes. Check EXPLAIN before you trust an index.', colors.orange],
  ];
  const cards = items.map(
    ([h, t, col], i) =>
      (
        <Rect
          x={-590 + (i % 3) * 590}
          y={-150 + Math.floor(i / 3) * 250}
          width={560}
          height={215}
          radius={22}
          fill={colors.surf}
          {...neubrutal(col, 9, 4)}
          opacity={0}
        >
          <Txt y={-62} text={h} fontFamily={fonts.mono} fontWeight={700} fontSize={30} letterSpacing={4} fill={col} />
          <Txt
            y={25}
            width={490}
            textWrap
            textAlign="center"
            text={t}
            fontFamily={fonts.sans}
            fontWeight={600}
            fontSize={26}
            fill={colors.ink}
          />
        </Rect>
      ) as Rect,
  );
  const title = chip('RECAP', colors.lime, {y: -370, fs: 40, sh: 8, rot: -2}) as Rect;
  const thanks = chip('INDEX THE QUERIES YOU RUN. MEASURE WITH EXPLAIN.', colors.yellow, {
    y: 350,
    fs: 28,
    sh: 8,
    rot: 1,
    mono: false,
  }) as Rect;
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
