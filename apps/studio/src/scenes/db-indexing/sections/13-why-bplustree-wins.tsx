import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, waitFor} from '@motion-canvas/core';
import {chip, colors, fonts, leave, pop, say, boxStyle, radius} from '@motion-studio/video-kit';

// ================================================================ WHY B+TREE
export function* whyBplustreeWinsSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const rowsData: [string, string, string, string][] = [
    ['KEYS PER INTERNAL PAGE', 'fewer (carry row pointers)', 'more (keys only)', 'wider, shallower tree'],
    ['POINT LOOKUP', 'may stop early', 'always reaches a leaf', 'same cost every time'],
    ['RANGE / ORDER BY', 'climb up and down', 'walk the leaf chain', 'sequential reads'],
    ['FULL INDEX SCAN', 'visit every node', 'only the leaf level', 'less I/O'],
  ];
  const head = (
    <Node y={-300}>
      <Txt
        x={-170}
        text="B-TREE"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={26}
        letterSpacing={3}
        fill={colors.violet}
      />
      <Txt
        x={250}
        text="B+TREE"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={26}
        letterSpacing={3}
        fill={colors.lime}
      />
    </Node>
  ) as Node;
  const table: Rect[] = [];
  rowsData.forEach(([name, a, b, why], i) => {
    const y = -210 + i * 112;
    const r = (
      <Rect
        y={y}
        width={1700}
        height={92}
        radius={radius(18)}
        fill={colors.surf}
        {...boxStyle(colors.lime, 7, 4)}
        opacity={0}
      >
        <Txt
          x={-810}
          offsetX={-1}
          text={name}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={20}
          letterSpacing={2}
          fill={colors.mute}
        />
        <Txt x={-170} text={a} fontFamily={fonts.sans} fontWeight={600} fontSize={25} fill={colors.ink} />
        <Txt x={250} text={b} fontFamily={fonts.sans} fontWeight={700} fontSize={25} fill={colors.lime} />
        <Txt x={640} text={why} fontFamily={fonts.sans} fontWeight={600} fontSize={22} fill={colors.yellow} />
      </Rect>
    ) as Rect;
    table.push(r);
  });
  const verdict = chip('MOST DATABASES: B+TREE', colors.pink, {
    y: 285,
    fs: 46,
    sh: 10,
    rot: -1.5,
    color: colors.onAccent,
  }) as Rect;
  verdict.opacity(0);
  const names = chip('MYSQL INNODB · POSTGRESQL · ORACLE · SQL SERVER · SQLITE', colors.surf2, {
    y: 365,
    fs: 20,
    sh: 0,
    color: colors.ink,
  }) as Rect;
  names.opacity(0);
  view.add(
    <Node ref={root} opacity={0}>
      {head}
      {table}
      {verdict}
      {names}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('So why does almost every database pick the B+tree? Compare the trade-offs.');
  yield* waitFor(1.2);
  const caps = [
    'Internal nodes hold only keys, so more fit in a page. Higher fanout means fewer levels.',
    'Point lookups always cost the same: root to leaf. Predictable latency.',
    'Range scans and ORDER BY walk the linked leaves instead of re-traversing the tree.',
    'A full index scan reads only the dense leaf level. No hopping between levels.',
  ];
  for (let i = 0; i < table.length; i++) {
    yield* say(caps[i]);
    yield* table[i].opacity(1, 0.35);
    yield* waitFor(3);
  }
  yield* say('The trade: lookups never stop early. That small cost buys much better scans and shape.', 3.4);
  yield* all(pop(verdict, 0.4), delay(0.4, names.opacity(1, 0.4)));
  yield* waitFor(3.6);
  yield* leave(root());
}
