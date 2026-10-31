import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, easeInOutCubic, waitFor} from '@motion-canvas/core';
import {chip, colors, countTo, fonts, formatNumber, label, leave, neubrutal, pop, say} from '@motion-studio/video-kit';

// ================================================================ PAGES + FANOUT
export function* pagesAndFanoutSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const stage = (<Node />) as Node;
  view.add(
    <Node ref={root} opacity={0}>
      {stage}
    </Node>,
  );
  yield* root().opacity(1, 0.3);

  // ---- A: a page holds many keys
  yield* say('Disks and SSDs read whole pages, typically 8 KB. Reading 1 byte or the whole page costs one I/O.');
  const mkPage = (x: number, keys: number, color: string, title: string, sub: string) => {
    const page = (
      <Rect x={x} y={-40} width={480} height={300} radius={22} fill={colors.surf} {...neubrutal(color, 9, 4)} />
    ) as Rect;
    const cols = 12;
    for (let i = 0; i < keys; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      page.add(<Rect x={-209 + c * 38} y={-85 + r * 38} width={30} height={30} radius={7} fill={colors.lime} />);
    }
    page.add(
      <Txt
        y={-135}
        text={title}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={20}
        letterSpacing={2}
        fill={color}
      />,
    );
    stage.add(page);
    const s = label(sub, x, 200, {fs: 20, fill: colors.ink});
    stage.add(s);
    return {page, s};
  };
  const a = mkPage(-290, 1, colors.pink, 'BST NODE = 1 PAGE', 'one key, 99% of the page wasted');
  yield* pop(a.page, 0.35);
  yield* a.s.opacity(1, 0.3);
  yield* waitFor(2.2);
  yield* say('So pack the whole page with keys. One node = one page, holding hundreds of keys.');
  const b = mkPage(290, 60, colors.lime, 'B-TREE NODE = 1 PAGE', '~500 keys in the same single read');
  yield* pop(b.page, 0.35);
  yield* b.s.opacity(1, 0.3);
  yield* waitFor(3);
  const fan = chip('FANOUT ≈ 500', colors.yellow, {x: 0, y: 290, fs: 36, sh: 8, rot: -2, mono: false}) as Rect;
  stage.add(fan);
  yield* say('The number of children per node is the fanout. With 8-byte keys and pointers it is around 500.');
  yield* pop(fan, 0.35);
  yield* waitFor(3.2);

  // ---- B: the pyramid
  yield* all(stage.opacity(0, 0.4));
  stage.removeChildren();
  stage.opacity(1);
  yield* say(
    'Each level multiplies capacity by 500. The root reaches 500 keys, level 2 reaches 250,000, and the leaves reach 125 million.',
  );
  const lvY = [-250, -100, 60];
  const names = ['ROOT PAGE · 1', 'LEVEL 2 · 500 PAGES', 'LEAF LEVEL · 250,000 PAGES'];
  const rowsN: Node[] = [];
  const capTx: Txt[] = [];
  const blocksPer = [1, 5, 11];
  for (let l = 0; l < 3; l++) {
    const n = blocksPer[l];
    const row = (<Node y={lvY[l]} x={-250} opacity={0} />) as Node;
    const w = l === 0 ? 150 : l === 1 ? 110 : 56;
    const gap = l === 0 ? 0 : l === 1 ? 24 : 14;
    for (let i = 0; i < n; i++) {
      row.add(
        <Rect
          x={(i - (n - 1) / 2) * (w + gap)}
          width={w}
          height={70}
          radius={12}
          fill={colors.surf2}
          {...neubrutal(l === 2 ? colors.lime : colors.violet, 5, 3.5)}
        />,
      );
    }
    stage.add(row);
    rowsN.push(row);
    stage.add(
      <Txt
        x={200}
        y={lvY[l]}
        offsetX={-1}
        text={names[l]}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={17}
        letterSpacing={1.5}
        fill={colors.mute}
      />,
    );
    const t = (
      <Txt
        x={570}
        y={lvY[l]}
        offsetX={-1}
        text="0"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={38}
        fill={colors.lime}
        opacity={0}
      />
    ) as Txt;
    stage.add(t);
    capTx.push(t);
  }
  // fan lines
  const lines: Line[] = [];
  for (let l = 0; l < 2; l++) {
    const nA = blocksPer[l];
    const nB = blocksPer[l + 1];
    const wA = l === 0 ? 150 : 110;
    const gA = l === 0 ? 0 : 24;
    const wB = l === 0 ? 110 : 56;
    const gB = l === 0 ? 24 : 14;
    for (let j = 0; j < nB; j++) {
      const xa = -250 + (Math.floor((j * nA) / nB) - (nA - 1) / 2) * (wA + gA);
      const xb = -250 + (j - (nB - 1) / 2) * (wB + gB);
      const ln = (
        <Line
          points={[
            [xa, lvY[l] + 35],
            [xb, lvY[l + 1] - 35],
          ]}
          stroke={colors.dim}
          lineWidth={3}
          opacity={0}
        />
      ) as Line;
      stage.add(ln);
      lines.push(ln);
    }
  }
  for (let l = 0; l < 3; l++) {
    yield* all(
      rowsN[l].opacity(1, 0.4),
      capTx[l].opacity(1, 0.3),
      ...(l > 0 ? lines.slice(l === 1 ? 0 : 5).map(x => x.opacity(1, 0.4)) : []),
    );
    yield* countTo(capTx[l], 0, [500, 250_000, 125_000_000][l], 1.2, n => `${formatNumber(n)} keys`);
    yield* waitFor(0.8);
  }
  const verdict = chip('10,000,000 ROWS FIT IN 3 LEVELS', colors.yellow, {
    y: 270,
    fs: 32,
    sh: 8,
    rot: -1,
    mono: false,
  }) as Rect;
  stage.add(verdict);
  yield* say('125 million keys in just three levels. Ten million rows need only three page reads.');
  yield* pop(verdict, 0.4);
  yield* waitFor(3.4);
  yield* say(
    'And the root and upper levels are hot, so they stay cached in RAM. Often only 1 or 2 reads hit the disk.',
    4,
  );

  // ---- C: compare bars
  yield* all(stage.opacity(0, 0.4));
  stage.removeChildren();
  stage.opacity(1);
  yield* say('Compare the number of disk reads for one lookup in a table of 10 million rows.');
  const bar = (y: number, w: number, color: string, title: string, val: string) => {
    const g = (
      <Node y={y}>
        <Txt
          x={-760}
          offsetX={-1}
          y={-52}
          text={title}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={22}
          letterSpacing={1}
          fill={colors.mute}
        />
        <Rect x={-760} offsetX={-1} width={0} height={64} radius={14} fill={color} {...neubrutal(colors.ink, 0, 3.5)} />
        <Txt
          x={-760 + w + 26}
          offsetX={-1}
          text={val}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={40}
          fill={colors.ink}
          opacity={0}
        />
      </Node>
    ) as Node;
    stage.add(g);
    return g;
  };
  const rowsBar = bar(-200, 1500, colors.red, 'FULL SCAN (PAGES)', '100,000');
  const bstBar = bar(-50, 24 * 30, colors.pink, 'BALANCED BST (LEVELS)', '24');
  const bBar = bar(100, 3 * 30, colors.lime, 'B+TREE, FANOUT 500 (LEVELS)', '3');
  for (const [g, w] of [
    [rowsBar, 1500],
    [bstBar, 24 * 30],
    [bBar, 3 * 30],
  ] as [Node, number][]) {
    yield* all(
      (g.children()[1] as Rect).width(w, 0.9, easeInOutCubic),
      delay(0.7, (g.children()[2] as Txt).opacity(1, 0.3)),
    );
    yield* waitFor(0.7);
  }
  yield* say('This is why databases use wide, shallow trees: B-trees and their cousin the B+tree.', 3.4);
  yield* leave(root());
}
