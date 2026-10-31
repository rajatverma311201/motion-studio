import {Circle, Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, easeInOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {C, FONT, MONO, NB, bigText, card, chip, chipText, countTo, label, leave, num, pop, say, shake} from './kit';

/** a big-number stat card */
export function stat(x: number, y: number, w: number, h: number, title: string, color: string, start = '0') {
  const val = createRef<Txt>();
  const node = (
    <Rect x={x} y={y} width={w} height={h} radius={20} fill={C.surf} {...NB(color, 8, 4)}>
      <Txt y={-h / 2 + 30} text={title} fontFamily={MONO} fontWeight={700} fontSize={19} letterSpacing={3} fill={C.mute} />
      <Txt ref={val} y={14} text={start} fontFamily={MONO} fontWeight={700} fontSize={54} fill={C.ink} />
    </Rect>
  ) as Rect;
  return {node, val: val()};
}

// ================================================================ INTRO
export function* intro(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const l1 = bigText('DB INDEXING', 190, -210);
  const l2 = bigText('B-TREE & B+TREE', 118, -40, -1, 7);
  const sub = chip('HOW DATABASES FIND ROWS FAST', C.yellow, {fs: 36, rot: -2, y: 110, sh: 8, mono: false}) as Rect;
  const slow = chip('O(n)', C.red, {fs: 54, x: -250, y: 285, color: C.ink, sh: 8}) as Rect;
  const fast = chip('O(log n)', C.lime, {fs: 54, x: 250, y: 285, sh: 8}) as Rect;
  const arrow = (<Line points={[[-130, 285], [90, 285]]} stroke={C.ink} lineWidth={7} endArrow arrowSize={20} end={0} />) as Line;
  l1.x(-1500);
  l2.x(1500);
  [sub, slow, fast].forEach(n => n.opacity(0));
  view.add(
    <Node ref={root} opacity={0}>
      {l1}
      {l2}
      {sub}
      {slow}
      {arrow}
      {fast}
    </Node>,
  );
  yield* root().opacity(1, 0.2);
  yield* say('Why is a lookup instant with an index, and painfully slow without one?');
  yield* all(l1.x(0, 0.8, easeInOutCubic), delay(0.25, l2.x(0, 0.8, easeInOutCubic)));
  yield* pop(sub, 0.35);
  yield* pop(slow, 0.3);
  yield* arrow.end(1, 0.6);
  yield* pop(fast, 0.3);
  yield* waitFor(3.2);
  yield* leave(root());
}

// ================================================================ FULL TABLE SCAN
export function* scan(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const data: [number, string, string][] = [
    [1, 'Asha', 'Delhi'],
    [2, 'Ria', 'Pune'],
    [3, 'Kabir', 'Noida'],
    [4, 'Meera', 'Jaipur'],
    [5, 'Ria', 'Mumbai'],
    [6, 'Dev', 'Lucknow'],
    [7, 'Zoya', 'Indore'],
    [8, 'Arjun', 'Surat'],
    [9, 'Nisha', 'Kochi'],
  ];
  const sql = (
    <Rect x={-300} y={-395} layout alignItems="center" padding={[8, 20]} radius={12} fill={C.code} {...NB(C.pink, 6, 3.5)}>
      <Txt text="SELECT * FROM users WHERE name = 'Ria';" fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.ink} />
    </Rect>
  ) as Rect;
  const rowRects: Rect[] = [];
  const tbl = (
    <Rect x={-470} y={-5} width={700} height={595} radius={22} fill={C.surf} {...NB(C.cyan, 9, 4)}>
      <Txt x={-300} y={-240} offsetX={-1} text="ID" fontFamily={MONO} fontWeight={700} fontSize={19} letterSpacing={3} fill={C.mute} />
      <Txt x={-170} y={-240} offsetX={-1} text="NAME" fontFamily={MONO} fontWeight={700} fontSize={19} letterSpacing={3} fill={C.mute} />
      <Txt x={60} y={-240} offsetX={-1} text="CITY" fontFamily={MONO} fontWeight={700} fontSize={19} letterSpacing={3} fill={C.mute} />
      <Line points={[[-330, -212], [330, -212]]} stroke={C.dim} lineWidth={3} />
      {data.map(([id, name, city], i) => {
        const r = (
          <Rect y={-172 + i * 54} width={668} height={46} radius={10} fill={C.clear} opacity={0}>
            <Txt x={-300} offsetX={-1} text={String(id)} fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.ink} />
            <Txt x={-170} offsetX={-1} text={name} fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.ink} />
            <Txt x={60} offsetX={-1} text={city} fontFamily={MONO} fontSize={24} fill={C.mute} />
          </Rect>
        ) as Rect;
        rowRects.push(r);
        return r;
      })}
    </Rect>
  ) as Rect;
  const rowsStat = stat(310, -190, 380, 140, 'ROWS CHECKED', C.pink);
  const pagesStat = stat(720, -190, 380, 140, 'PAGES READ (8 KB)', C.orange);
  const gridTitle = label('THE TABLE FILE ON DISK: 100,000 PAGES', 515, -75, {fs: 18});
  const blocks: Rect[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 8; c++) {
      blocks.push((<Rect x={515 + (c - 3.5) * 52} y={-20 + r * 52} width={42} height={42} radius={9} fill={C.surf2} stroke={C.dim} lineWidth={3} />) as Rect);
    }
  }
  const stamp = chip('O(n)', C.red, {fs: 64, rot: -4, x: 515, y: 270, color: C.ink, sh: 10}) as Rect;
  stamp.opacity(0);
  gridTitle.opacity(0);
  blocks.forEach(b => b.opacity(0));
  [sql, tbl, rowsStat.node, pagesStat.node].forEach(n => n.opacity(0));
  view.add(
    <Node ref={root}>
      {sql}
      {tbl}
      {rowsStat.node}
      {pagesStat.node}
      {gridTitle}
      {blocks}
      {stamp}
    </Node>,
  );

  yield* say('Say we run this query against a table with 10 million rows.');
  yield* all(sql.opacity(1, 0.4), tbl.opacity(1, 0.4));
  yield* sequence(0.08, ...rowRects.map(r => r.opacity(1, 0.2)));
  yield* waitFor(1.6);

  yield* say('With no index, the database has no choice: it must read every row, one after another.');
  yield* all(rowsStat.node.opacity(1, 0.4), pagesStat.node.opacity(1, 0.4), gridTitle.opacity(1, 0.4), ...blocks.map(b => b.opacity(1, 0.4)));
  pagesStat.val.text('1');
  for (let i = 0; i < data.length; i++) {
    const hit = data[i][1] === 'Ria';
    yield* rowRects[i].fill(hit ? 'rgba(198,255,61,0.35)' : 'rgba(255,210,61,0.28)', 0.12);
    rowsStat.val.text(String(i + 1));
    yield* waitFor(0.28);
    if (!hit) yield* rowRects[i].fill(C.clear, 0.15);
  }
  yield* say('It found two matches, but names are not unique, so it still has to keep going.');
  yield* waitFor(1.8);

  yield* say('Rows live on 8 KB pages. A full scan reads every page of the table from disk.');
  yield* all(
    countTo(rowsStat.val, 9, 10_000_000, 5),
    countTo(pagesStat.val, 1, 100_000, 5),
    sequence(0.12, ...blocks.map(b => all(b.fill(C.pink, 0.18), b.stroke(C.ink, 0.18)))),
  );
  yield* all(pop(stamp, 0.35), shake(stamp, 5, 4));
  yield* say('Cost grows with the table. Double the rows, double the work: that is O(n).', 3.4);
  yield* say('An index lets the database jump straight to the right place instead.', 3);
  yield* leave(root());
}

// ================================================================ SORTED INDEX + BINARY SEARCH
export function* sortedIndex(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const KEYS = [3, 12, 25, 31, 44, 58, 67, 72, 80, 91, 103, 118];
  const CW = 110;
  const X0 = -605;
  const Y = -150;
  const xAt = (i: number) => X0 + i * CW;
  const mkCell = (k: number, i: number) =>
    (
      <Rect x={xAt(i)} y={Y} width={100} height={84} radius={14} fill={C.surf2} {...NB(C.lime, 5, 3.5)}>
        <Txt y={-8} text={String(k)} fontFamily={MONO} fontWeight={700} fontSize={34} fill={C.ink} />
        <Circle y={26} size={11} fill={C.orange} />
      </Rect>
    ) as Rect;
  const cells = KEYS.map(mkCell);
  const cellTxt = (c: Rect) => c.children()[0] as Txt;

  const title = chip('SORTED INDEX: KEY + POINTER TO THE ROW', C.lime, {x: -330, y: -345, fs: 20, sh: 5}) as Rect;
  const cmp = chip('LOOKING FOR 91', C.yellow, {x: 330, y: -345, fs: 22, sh: 5}) as Rect;
  cmp.opacity(0);
  const heapLabel = label('THE TABLE (HEAP): ROWS IN NO PARTICULAR ORDER', 0, 20, {fs: 18});
  const pagesData: number[][] = [[58, 7, 120], [3, 40, 77], [25, 66, 12], [31, 8, 103], [44, 91, 72], [80, 19, 67]];
  const pages = pagesData.map(
    (rows, i) =>
      (
        <Rect x={-550 + i * 220} y={150} width={200} height={170} radius={16} fill={C.surf} stroke={C.dim} lineWidth={3.5}>
          <Txt y={-60} text={`PAGE ${i + 1}`} fontFamily={MONO} fontWeight={700} fontSize={16} letterSpacing={2} fill={C.mute} />
          {rows.map((r, j) => (
            <Txt y={-18 + j * 36} text={`id ${r}`} fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.ink} />
          ))}
        </Rect>
      ) as Rect,
  );
  const ptr = (
    <Line points={[[xAt(9), Y + 46], [xAt(9), Y + 70], [-550 + 4 * 220 + 60, 110], [-550 + 4 * 220 + 60, 118]]} stroke={C.orange} lineWidth={5} endArrow arrowSize={14} radius={18} end={0} />
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
      cells[mid].fill(C.yellow, 0.2),
      cellTxt(cells[mid]).fill(C.dark, 0.2),
    );
    if (KEYS[mid] === target) {
      yield* all(cells[mid].fill(C.lime, 0.2), shake(cells[mid], 4, 3));
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
    yield* all(cells[mid].fill(C.surf2, 0.2), cellTxt(cells[mid]).fill(C.ink, 0.2));
  }
  yield* say('Four steps for 12 keys. Each step halves the search space: O(log n).', 2.6);

  yield* say('The entry points straight at the row: one more read and we have it.');
  yield* all(ptr.end(1, 0.7), pages[4].stroke(C.orange, 0.3), pages[4].lineWidth(6, 0.3));
  yield* waitFor(2.6);
  yield* say('For 10 million keys that is only about 24 steps, instead of 10 million rows.', 3.2);

  // insertion cost
  yield* all(ptr.opacity(0, 0.3), pages[4].stroke(C.dim, 0.3), pages[4].lineWidth(3.5, 0.3), ...cells.map(c => all(c.opacity(1, 0.3), c.fill(C.surf2, 0.3), cellTxt(c).fill(C.ink, 0.3))));
  chipText(cmp).text('NEW ROW: INSERT KEY 50');
  yield* say('But the list must stay sorted. Inserting 50 means shifting everything after it.');
  yield* waitFor(1.2);
  const fresh = mkCell(50, 5);
  fresh.y(Y - 95);
  fresh.opacity(0);
  fresh.fill(C.yellow);
  cellTxt(fresh).fill(C.dark);
  root().add(fresh);
  yield* fresh.opacity(1, 0.3);
  const moved = stat(330, 335, 360, 110, 'ENTRIES SHIFTED', C.pink);
  root().add(moved.node);
  yield* pop(moved.node, 0.3);
  yield* all(
    sequence(0.1, ...cells.slice(5).map(c => c.x(c.x() + CW, 0.3))),
    countTo(moved.val, 0, 7, 0.8, n => String(Math.round(n))),
  );
  yield* fresh.position([xAt(5), Y], 0.5, easeInOutCubic);
  yield* all(fresh.fill(C.surf2, 0.3), cellTxt(fresh).fill(C.ink, 0.3));
  yield* say('On disk that means rewriting many pages for one insert. Fast reads, slow writes.', 3.4);
  yield* say('We need a structure that stays sorted without shifting everything. A tree does that.', 3.2);
  yield* leave(root());
}

// ================================================================ BINARY SEARCH TREE
export function* bst(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const nodes = new Map<number, Circle>();
  const layer = (<Node />) as Node;
  const edgeLayer = (<Node />) as Node;
  const mk = (key: number, x: number, y: number, parent?: number) => {
    const n = (
      <Circle x={x} y={y} size={84} fill={C.surf} {...NB(C.violet, 6, 3.5)}>
        <Txt text={String(key)} fontFamily={MONO} fontWeight={700} fontSize={30} fill={C.ink} />
      </Circle>
    ) as Circle;
    n.opacity(0);
    nodes.set(key, n);
    layer.add(n);
    if (parent !== undefined) {
      const p = nodes.get(parent)!;
      const e = (<Line points={[[p.x(), p.y() + 30], [x, y - 36]]} stroke={C.ink} lineWidth={3.5} opacity={0} />) as Line;
      edgeLayer.add(e);
      return {n, e};
    }
    return {n, e: null as Line | null};
  };
  const clear = function* (): ThreadGenerator {
    yield* all(layer.opacity(0, 0.35), edgeLayer.opacity(0, 0.35));
    layer.removeChildren();
    edgeLayer.removeChildren();
    nodes.clear();
    layer.opacity(1);
    edgeLayer.opacity(1);
  };
  const tag = chip('BINARY SEARCH TREE', C.violet, {x: -600, y: -400, fs: 22, sh: 5}) as Rect;
  const note = chip('', C.surf2, {x: 520, y: -400, fs: 22, sh: 0, color: C.ink}) as Rect;
  note.opacity(0);
  view.add(
    <Node ref={root}>
      {tag}
      {note}
      {edgeLayer}
      {layer}
    </Node>,
  );

  yield* say('A binary search tree: smaller keys go left, bigger keys go right. No shifting needed.');
  const spec: [number, number, number, number?][] = [
    [40, 0, -280],
    [20, -330, -150, 40],
    [60, 330, -150, 40],
    [10, -500, -20, 20],
    [30, -170, -20, 20],
    [50, 170, -20, 60],
    [70, 500, -20, 60],
  ];
  const edges: Line[] = [];
  const pops: ThreadGenerator[] = [];
  for (const [k, x, y, p] of spec) {
    const {n, e} = mk(k, x, y, p);
    if (e) edges.push(e);
    pops.push(pop(n, 0.3));
  }
  yield* sequence(0.2, ...pops);
  yield* all(...edges.map(e => e.opacity(1, 0.4)));
  yield* waitFor(1.2);

  yield* say('Lookup for 50: compare with 40 (go right), then 60 (go left), then 50. Three steps for 7 keys.');
  for (const k of [40, 60, 50]) {
    yield* all(nodes.get(k)!.fill(C.yellow, 0.2), (nodes.get(k)!.children()[0] as Txt).fill(C.dark, 0.2));
    yield* waitFor(1.1);
  }
  yield* all(nodes.get(50)!.fill(C.lime, 0.2));
  yield* waitFor(2.2);

  yield* say('But what if keys arrive in sorted order, like auto-increment ids 1, 2, 3, 4…?');
  yield* clear();
  const chain: [number, number, number, number?][] = [];
  for (let i = 0; i < 7; i++) chain.push([i + 1, -520 + i * 160, -300 + i * 78, i === 0 ? undefined : i]);
  for (const [k, x, y, p] of chain) {
    const {n, e} = mk(k, x, y, p);
    yield* all(pop(n, 0.3), e ? e.opacity(1, 0.3) : waitFor(0.01));
    yield* waitFor(0.25);
  }
  yield* say('The tree degenerates into a linked list. Every lookup is O(n) again.');
  chipText(note).text('HEIGHT = 7 FOR 7 KEYS');
  yield* pop(note, 0.3);
  yield* waitFor(3);

  yield* say('Self-balancing trees (AVL, red-black) fix the shape. But there is a second problem: disks.');
  yield* waitFor(3.2);
  yield* say('Even perfectly balanced, 10 million keys need about 24 levels, and each level can be a separate disk read.', 4);
  yield* leave(root());
}

// ================================================================ PAGES + FANOUT
export function* fanout(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const stage = (<Node />) as Node;
  view.add(<Node ref={root} opacity={0}>{stage}</Node>);
  yield* root().opacity(1, 0.3);

  // ---- A: a page holds many keys
  yield* say('Disks and SSDs read whole pages, typically 8 KB. Reading 1 byte or the whole page costs one I/O.');
  const mkPage = (x: number, keys: number, color: string, title: string, sub: string) => {
    const page = (<Rect x={x} y={-40} width={480} height={300} radius={22} fill={C.surf} {...NB(color, 9, 4)} />) as Rect;
    const cols = 12;
    for (let i = 0; i < keys; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      page.add(<Rect x={-209 + c * 38} y={-85 + r * 38} width={30} height={30} radius={7} fill={C.lime} />);
    }
    page.add(<Txt y={-135} text={title} fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={2} fill={color} />);
    stage.add(page);
    const s = label(sub, x, 200, {fs: 20, fill: C.ink});
    stage.add(s);
    return {page, s};
  };
  const a = mkPage(-290, 1, C.pink, 'BST NODE = 1 PAGE', 'one key, 99% of the page wasted');
  yield* pop(a.page, 0.35);
  yield* a.s.opacity(1, 0.3);
  yield* waitFor(2.2);
  yield* say('So pack the whole page with keys. One node = one page, holding hundreds of keys.');
  const b = mkPage(290, 60, C.lime, 'B-TREE NODE = 1 PAGE', '~500 keys in the same single read');
  yield* pop(b.page, 0.35);
  yield* b.s.opacity(1, 0.3);
  yield* waitFor(3);
  const fan = chip('FANOUT ≈ 500', C.yellow, {x: 0, y: 290, fs: 36, sh: 8, rot: -2, mono: false}) as Rect;
  stage.add(fan);
  yield* say('The number of children per node is the fanout. With 8-byte keys and pointers it is around 500.');
  yield* pop(fan, 0.35);
  yield* waitFor(3.2);

  // ---- B: the pyramid
  yield* all(stage.opacity(0, 0.4));
  stage.removeChildren();
  stage.opacity(1);
  yield* say('Each level multiplies capacity by 500. The root reaches 500 keys, level 2 reaches 250,000, and the leaves reach 125 million.');
  const lvY = [-250, -100, 60];
  const caps = ['500 keys', '250,000 keys', '125,000,000 keys'];
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
      row.add(<Rect x={(i - (n - 1) / 2) * (w + gap)} width={w} height={70} radius={12} fill={C.surf2} {...NB(l === 2 ? C.lime : C.violet, 5, 3.5)} />);
    }
    stage.add(row);
    rowsN.push(row);
    stage.add(<Txt x={200} y={lvY[l]} offsetX={-1} text={names[l]} fontFamily={MONO} fontWeight={700} fontSize={17} letterSpacing={1.5} fill={C.mute} />);
    const t = (<Txt x={570} y={lvY[l]} offsetX={-1} text="0" fontFamily={MONO} fontWeight={700} fontSize={38} fill={C.lime} opacity={0} />) as Txt;
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
      const xa = -250 + ((Math.floor((j * nA) / nB)) - (nA - 1) / 2) * (wA + gA);
      const xb = -250 + (j - (nB - 1) / 2) * (wB + gB);
      const ln = (<Line points={[[xa, lvY[l] + 35], [xb, lvY[l + 1] - 35]]} stroke={C.dim} lineWidth={3} opacity={0} />) as Line;
      stage.add(ln);
      lines.push(ln);
    }
  }
  for (let l = 0; l < 3; l++) {
    yield* all(rowsN[l].opacity(1, 0.4), capTx[l].opacity(1, 0.3), ...(l > 0 ? lines.slice(l === 1 ? 0 : 5).map(x => x.opacity(1, 0.4)) : []));
    yield* countTo(capTx[l], 0, [500, 250_000, 125_000_000][l], 1.2, n => `${num(n)} keys`);
    yield* waitFor(0.8);
  }
  void caps;
  const verdict = chip('10,000,000 ROWS FIT IN 3 LEVELS', C.yellow, {y: 270, fs: 32, sh: 8, rot: -1, mono: false}) as Rect;
  stage.add(verdict);
  yield* say('125 million keys in just three levels. Ten million rows need only three page reads.');
  yield* pop(verdict, 0.4);
  yield* waitFor(3.4);
  yield* say('And the root and upper levels are hot, so they stay cached in RAM. Often only 1 or 2 reads hit the disk.', 4);

  // ---- C: compare bars
  yield* all(stage.opacity(0, 0.4));
  stage.removeChildren();
  stage.opacity(1);
  yield* say('Compare the number of disk reads for one lookup in a table of 10 million rows.');
  const bar = (y: number, w: number, color: string, title: string, val: string) => {
    const g = (
      <Node y={y}>
        <Txt x={-760} offsetX={-1} y={-52} text={title} fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={1} fill={C.mute} />
        <Rect x={-760} offsetX={-1} width={0} height={64} radius={14} fill={color} {...NB(C.ink, 0, 3.5)} />
        <Txt x={-760 + w + 26} offsetX={-1} text={val} fontFamily={MONO} fontWeight={700} fontSize={40} fill={C.ink} opacity={0} />
      </Node>
    ) as Node;
    stage.add(g);
    return g;
  };
  const rowsBar = bar(-200, 1500, C.red, 'FULL SCAN (PAGES)', '100,000');
  const bstBar = bar(-50, 24 * 30, C.pink, 'BALANCED BST (LEVELS)', '24');
  const bBar = bar(100, 3 * 30, C.lime, 'B+TREE, FANOUT 500 (LEVELS)', '3');
  for (const [g, w] of [[rowsBar, 1500], [bstBar, 24 * 30], [bBar, 3 * 30]] as [Node, number][]) {
    yield* all((g.children()[1] as Rect).width(w, 0.9, easeInOutCubic), delay(0.7, (g.children()[2] as Txt).opacity(1, 0.3)));
    yield* waitFor(0.7);
  }
  yield* say('This is why databases use wide, shallow trees: B-trees and their cousin the B+tree.', 3.4);
  yield* leave(root());
}
