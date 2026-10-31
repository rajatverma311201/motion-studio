import {Circle, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {C, FONT, MONO, NB, chip, chipText, label, leave, pop, say} from './kit';
import {TreeView, playInsert, playSearch} from './tree';
import {IndexTree, Snap, searchPlan, snapOf} from './treeLogic';

/** the insert sequence used for both the B-tree and the B+tree demos */
export const SEQ = [10, 20, 5, 15, 30, 25, 40, 12, 8, 6, 7];

export function finalSnap(plus: boolean): Snap {
  const t = new IndexTree(3, plus);
  SEQ.forEach(k => t.insert(k));
  return t.snap();
}

/** legend: what the colours and the orange dot mean */
export function legend(x: number, y: number, plus: boolean): Node {
  return (
    <Node x={x} y={y}>
      {chip('INTERNAL NODE', C.violet, {x: -330, fs: 17, sh: 4})}
      {chip('LEAF NODE', C.lime, {x: -120, fs: 17, sh: 4})}
      <Circle x={40} size={14} fill={C.orange} />
      <Txt x={62} offsetX={-1} text={plus ? '= row pointer (leaves only)' : '= row pointer (every key)'} fontFamily={MONO} fontWeight={700} fontSize={17} fill={C.mute} />
    </Node>
  ) as Node;
}

// ================================================================ B-TREE RULES
export function* btreeRules(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tv = new TreeView({x: -340, y: -200, scale: 1.35});
  const snap = snapOf('r', [
    ['r', [20, 40], ['a', 'b', 'c']],
    ['a', [5, 10, 15]],
    ['b', [25, 30, 35]],
    ['c', [45, 50]],
  ]);
  const rules: [string, string, string][] = [
    ['1', 'Keys inside a node are sorted', C.lime],
    ['2', 'A node with k keys has k + 1 children', C.cyan],
    ['3', 'Child i holds keys between key i−1 and key i', C.pink],
    ['4', 'Every leaf sits at the same depth', C.yellow],
    ['5', 'Every node except the root is at least half full', C.violet],
  ];
  const cards = rules.map(
    ([n, t, col], i) =>
      (
        <Rect x={560} y={-250 + i * 100} width={700} height={82} radius={18} fill={C.surf} {...NB(col, 7, 4)} opacity={0}>
          <Rect x={-310} width={44} height={44} radius={12} fill={col}>
            <Txt text={n} fontFamily={MONO} fontWeight={700} fontSize={26} fill={C.dark} />
          </Rect>
          <Txt x={-270} offsetX={-1} text={t} fontFamily={FONT} fontWeight={700} fontSize={24} fill={C.ink} />
        </Rect>
      ) as Rect,
  );
  const lg = legend(-330, 235, false);
  lg.opacity(0);
  const maxChip = chip('DEMO: MAX 3 KEYS PER NODE (4 CHILDREN)', C.surf2, {x: -330, y: 165, fs: 18, sh: 0, color: C.ink}) as Rect;
  maxChip.opacity(0);
  view.add(
    <Node ref={root} opacity={0}>
      {tv.root}
      {cards}
      {lg}
      {maxChip}
    </Node>,
  );
  yield* root().opacity(1, 0.3);

  yield* say('A B-tree node is a sorted list of keys, with one more child than keys.');
  yield* tv.show(snap, 0.8);
  yield* all(lg.opacity(1, 0.4), maxChip.opacity(1, 0.4));
  yield* waitFor(2.5);

  // rule 1
  yield* say('Rule 1: the keys inside every node are kept sorted.');
  yield* all(cards[0].opacity(1, 0.3), tv.mark(['r', 'a', 'b', 'c'], C.lime));
  yield* waitFor(2.8);
  yield* tv.unmark();

  // rule 2
  yield* say('Rule 2: a node with k keys has k + 1 children. The root has 2 keys and 3 children.');
  yield* all(cards[1].opacity(1, 0.3), tv.mark(['r'], C.cyan));
  const kc = chip('2 KEYS → 3 CHILDREN', C.cyan, {x: tv.at('r').x, y: tv.at('r').y - 84, fs: 20, sh: 4}) as Rect;
  root().add(kc);
  yield* pop(kc, 0.3);
  yield* waitFor(3);
  yield* all(kc.opacity(0, 0.3), tv.unmark());
  kc.remove();

  // rule 3
  yield* say('Rule 3: each child covers a key range. Left of 20, between 20 and 40, right of 40.');
  yield* cards[2].opacity(1, 0.3);
  const rc = ['< 20', '20 – 39', '≥ 40'].map((t, i) => {
    const kid = tv.at(['a', 'b', 'c'][i]);
    const r = tv.at('r');
    return chip(t, C.pink, {x: (kid.x * 2 + r.x) / 3 + (i - 1) * 6, y: (kid.y + r.y) / 2 + 2, fs: 18, sh: 3}) as Rect;
  });
  root().add(rc);
  yield* sequence(0.25, ...rc.map(c => pop(c, 0.3)));
  yield* waitFor(3.4);
  yield* all(...rc.map(c => c.opacity(0, 0.3)));
  rc.forEach(c => c.remove());

  // rule 4
  yield* say('Rule 4: all leaves are on the same level, so every lookup costs the same number of steps.');
  yield* all(cards[3].opacity(1, 0.3), tv.mark(['a', 'b', 'c'], C.yellow));
  yield* waitFor(3.6);
  yield* tv.unmark();

  // rule 5
  yield* say('Rule 5: nodes stay at least half full (here: at least 1 key). No wasted, nearly empty pages.');
  yield* all(cards[4].opacity(1, 0.3), tv.mark(['r', 'a', 'b', 'c'], C.violet));
  yield* waitFor(3.8);
  yield* tv.unmark();
  yield* say('These rules are kept true by splitting full nodes on insert, and merging thin ones on delete.', 3.4);
  yield* leave(root());
}

// ================================================================ B-TREE SEARCH
export function* btreeSearch(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const snap = finalSnap(false);
  const tv = new TreeView({x: 0, y: -235, scale: 1.35});
  const q = createRef<Txt>();
  const reads = createRef<Txt>();
  const sqlChip = (
    <Rect x={-560} y={-400} layout alignItems="center" padding={[8, 18]} radius={12} fill={C.code} {...NB(C.cyan, 5, 3.5)}>
      <Txt ref={q} text="SELECT * FROM t WHERE id = 25;" fontFamily={MONO} fontWeight={700} fontSize={22} fill={C.ink} />
    </Rect>
  ) as Rect;
  const readBox = (
    <Rect x={-560} y={290} width={380} height={110} radius={20} fill={C.surf} {...NB(C.orange, 8, 4)}>
      <Txt y={-28} text="PAGE READS" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={3} fill={C.mute} />
      <Txt ref={reads} y={16} text="0" fontFamily={MONO} fontWeight={700} fontSize={56} fill={C.ink} />
    </Rect>
  ) as Rect;
  const lg = legend(250, 330, false);
  view.add(
    <Node ref={root} opacity={0}>
      {sqlChip}
      {tv.root}
      {readBox}
      {lg}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Searching: start at the root and compare the key against the keys in each node.');
  yield* tv.show(snap, 0.8);
  yield* waitFor(2.4);

  const runs: [number, string][] = [
    [25, 'A hit on the way down. Each node visited is one page read, so cost = height of the tree.'],
    [15, 'Lucky: in a B-tree a key can live in an internal node, so this search stops at the root.'],
    [11, 'Not found: still only one node per level is touched before we know for sure.'],
  ];
  for (const [key, after] of runs) {
    q().text(`SELECT * FROM t WHERE id = ${key};`);
    reads().text('0');
    yield* playSearch(tv, searchPlan(snap, key, false), key, {onVisit: n => reads().text(String(n))});
    yield* say(after, 2.6);
    yield* tv.unmark();
  }
  yield* say('Even with millions of keys, the tree stays this shallow because every node is wide.', 3.2);
  yield* leave(root());
}

// ================================================================ B-TREE INSERT
export function* btreeInsert(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const t = new IndexTree(3, false);
  const tv = new TreeView({x: 0, y: -250, scale: 1.4});
  const insChip = chip('INSERT ▸ —', C.yellow, {x: -620, y: -400, fs: 26, sh: 6}) as Rect;
  const lg = legend(250, 340, false);
  const maxChip = chip('MAX 3 KEYS PER NODE', C.surf2, {x: -620, y: 340, fs: 18, sh: 0, color: C.ink}) as Rect;
  view.add(
    <Node ref={root} opacity={0}>
      {insChip}
      {tv.root}
      {lg}
      {maxChip}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Insert: find the right leaf, drop the key in, and split the node if it gets too full.');
  yield* tv.show(t.snap(), 0.6);
  yield* waitFor(1.2);

  for (let i = 0; i < SEQ.length; i++) {
    const key = SEQ[i];
    chipText(insChip).text(`INSERT ▸ ${key}`);
    const steps = t.insert(key);
    if (i === 0) {
      yield* say('Insert 10, 20 and 5: the empty root leaf just fills up, kept sorted.');
      yield* playInsert(tv, steps, {narrate: false, speed: 0.9});
    } else if (i < 3) {
      yield* playInsert(tv, steps, {narrate: false, speed: 0.9});
      yield* waitFor(0.5);
    } else {
      const plain = steps.every(s => s.kind !== 'overflow');
      yield* playInsert(tv, steps, {narrate: true, speed: plain ? 0.75 : 1});
    }
    if (key === 15) {
      yield* say('First split done: the tree now has two levels. Only the median moved up.', 3);
    }
    if (key === 7) {
      yield* say('The root overflowed too and split. Now every leaf is one level deeper, all together.', 3.4);
    }
  }
  chipText(insChip).text('11 KEYS · 3 LEVELS');
  yield* tv.mark(tv.idsOfLeaves(), C.lime, 0.3);
  yield* say('The tree only grows at the root, so all leaves stay at the same depth. It is always balanced.', 4);
  yield* tv.unmark();
  yield* say('Page splits are why inserts into a full index page cost extra writes.', 3.2);
  yield* leave(root());
}
