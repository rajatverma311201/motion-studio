import {Circle, Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, easeInOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {C, FONT, MONO, NB, chip, chipText, leave, pop, say, shake} from './kit';
import {SEQ, finalSnap, legend} from './s_btree';
import {stat} from './s_intro';
import {TreeView, playInsert, playSearch} from './tree';
import {IndexTree, searchPlan, snapOf} from './treeLogic';

const bullet = (x: number, y: number, t: string, col: string, w = 820) =>
  (
    <Rect x={x} y={y} width={w} height={62} radius={14} fill={C.surf} {...NB(col, 6, 3.5)} opacity={0}>
      <Txt x={-w / 2 + 30} offsetX={-1} text={t} fontFamily={FONT} fontWeight={700} fontSize={25} fill={C.ink} />
    </Rect>
  ) as Rect;

// ================================================================ B-TREE vs B+TREE
export function* bplusCompare(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const t1 = new TreeView({x: -470, y: -250, scale: 0.8});
  const t2 = new TreeView({x: 470, y: -250, scale: 0.8, plus: true});
  const h1 = chip('B-TREE', C.violet, {x: -470, y: -385, fs: 28, sh: 6}) as Rect;
  const h2 = chip('B+TREE', C.lime, {x: 470, y: -385, fs: 28, sh: 6}) as Rect;
  const left = [
    bullet(-470, 95, 'Row pointers live in every node', C.violet),
    bullet(-470, 175, 'Each key appears exactly once', C.violet),
    bullet(-470, 255, 'Leaves are not connected', C.violet),
  ];
  const right = [
    bullet(470, 95, 'Row pointers only in the leaves', C.lime),
    bullet(470, 175, 'Parent keys are copies: signposts', C.lime),
    bullet(470, 255, 'Leaves are linked left to right', C.lime),
  ];
  const vs = chip('VS', C.pink, {x: 0, y: -90, fs: 34, sh: 6, rot: -6}) as Rect;
  [h1, h2, vs].forEach(n => n.opacity(0));
  view.add(
    <Node ref={root} opacity={0}>
      {t1.root}
      {t2.root}
      {h1}
      {h2}
      {vs}
      {left}
      {right}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Databases rarely use the plain B-tree. Almost all of them use its close cousin, the B+tree.');
  yield* all(pop(h1, 0.3), t1.show(finalSnap(false), 0.9));
  yield* all(pop(h2, 0.3), t2.show(finalSnap(true), 0.9), delay(0.4, pop(vs, 0.3)));
  yield* waitFor(2.4);

  yield* say('In a B-tree every node carries keys with row pointers. Each key lives in exactly one place.');
  yield* sequence(0.25, ...left.map(b => b.opacity(1, 0.3)));
  yield* waitFor(2.2);
  yield* say('In a B+tree, internal nodes are only signposts. All real entries sit in the leaves.');
  yield* sequence(0.25, ...right.map(b => b.opacity(1, 0.3)));
  yield* t2.mark(t2.idsOfLeaves(), C.lime, 0.3);
  yield* waitFor(3);
  yield* t2.unmark();
  yield* say('That small change gives us two big wins: wider internal nodes, and cheap range scans.', 3.6);
  yield* leave(root());
}

// ================================================================ B+TREE INSERT
export function* bplusInsert(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const t = new IndexTree(3, true);
  const tv = new TreeView({x: 0, y: -235, scale: 1.6, plus: true});
  const insChip = chip('INSERT ▸ —', C.yellow, {x: -620, y: -400, fs: 26, sh: 6}) as Rect;
  const lg = legend(250, 340, true);
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
  yield* say('Same inserts as before, now into a B+tree. Watch how the leaf split is different.');
  yield* tv.show(t.snap(), 0.6);
  yield* waitFor(1.2);

  let sawSplit = false;
  for (let i = 0; i < SEQ.length; i++) {
    const key = SEQ[i];
    chipText(insChip).text(`INSERT ▸ ${key}`);
    const steps = t.insert(key);
    if (i < 3) {
      if (i === 0) yield* say('Insert 10, 20 and 5: the root is a leaf and just fills up.');
      yield* playInsert(tv, steps, {narrate: false, speed: 0.9});
      yield* waitFor(0.4);
    } else {
      const plain = steps.every(s => s.kind !== 'overflow');
      yield* playInsert(tv, steps, {narrate: true, speed: plain ? 0.75 : 1});
    }
    if (!sawSplit && steps.some(s => s.kind === 'newroot' || s.kind === 'split')) {
      sawSplit = true;
      yield* say('Look: 15 sits in the parent AND still in the right leaf. B+tree leaf splits COPY the key up.', 4.2);
    }
    if (key === 7) yield* say('Internal nodes split like a B-tree (the median moves up), but leaves always keep every key.', 3.8);
  }
  chipText(insChip).text('11 KEYS · 3 LEVELS');
  yield* tv.mark(tv.idsOfLeaves(), C.lime, 0.3);
  yield* say('Every key is in a leaf, and the leaves are chained. That chain is the secret weapon.', 3.8);
  yield* tv.unmark();
  yield* leave(root());
}

// ================================================================ B+TREE LOOKUP + RANGE SCAN
export function* bplusRange(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const snap = finalSnap(true);
  const tv = new TreeView({x: 0, y: -245, scale: 1.55, plus: true});
  const q = createRef<Txt>();
  const sqlChip = (
    <Rect x={-440} y={-400} layout alignItems="center" padding={[8, 18]} radius={12} fill={C.code} {...NB(C.cyan, 5, 3.5)}>
      <Txt ref={q} text="SELECT * FROM t WHERE id = 25;" fontFamily={MONO} fontWeight={700} fontSize={22} fill={C.ink} />
    </Rect>
  ) as Rect;
  const reads = stat(-600, 318, 330, 110, 'PAGE READS', C.orange);
  const rows = stat(-240, 318, 330, 110, 'ROWS FOUND', C.lime);
  rows.node.opacity(0);
  const lg = legend(380, 350, true);
  view.add(
    <Node ref={root} opacity={0}>
      {sqlChip}
      {tv.root}
      {reads.node}
      {rows.node}
      {lg}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Point lookup works like before, except we always travel all the way down to a leaf.');
  yield* tv.show(snap, 0.8);
  yield* waitFor(1.6);

  reads.val.text('0');
  yield* playSearch(tv, searchPlan(snap, 25, true), 25, {narrate: false, onVisit: n => reads.val.text(String(n))});
  yield* say('Every lookup costs exactly the height of the tree. Same depth, predictable latency.', 3.2);
  yield* tv.unmark();

  // ---- range scan
  q().text('SELECT * FROM t WHERE id BETWEEN 8 AND 25;');
  reads.val.text('0');
  yield* all(pop(rows.node, 0.3), say('Now a range query. First find the left edge of the range: key 8.'));
  rows.val.text('0');
  const plan = searchPlan(snap, 8, true);
  yield* playSearch(tv, plan, 8, {narrate: false, onVisit: n => reads.val.text(String(n))});
  yield* tv.unmark();
  yield* say('Then do not climb back up. Just follow the leaf links to the right until we pass 25.', 3);

  const leaves = tv.idsOfLeaves();
  const start = leaves.indexOf(plan[plan.length - 1].id);
  let visited = plan.length;
  let found = 0;
  let done = false;
  for (let li = start; li < leaves.length && !done; li++) {
    if (li > start) {
      visited++;
      reads.val.text(String(visited));
    }
    yield* tv.mark([leaves[li]], C.yellow, 0.15);
    const ks = tv.keysOf(leaves[li]) as number[];
    for (let i = 0; i < ks.length; i++) {
      if (ks[i] < 8) continue;
      if (ks[i] > 25) {
        done = true;
        break;
      }
      yield* tv.markCell(leaves[li], i, C.lime, 0.12);
      found++;
      rows.val.text(String(found));
      yield* waitFor(0.4);
    }
    if (!done && li < leaves.length - 1) yield* waitFor(0.5);
  }
  yield* say('Six rows found, touching only the leaves. A B-tree would bounce up and down through parents.', 3.8);
  yield* tv.unmark();
  yield* say('That is why ORDER BY, BETWEEN and sorted scans are cheap on a B+tree index.', 3.4);
  yield* leave(root());
}

// ================================================================ B+TREE DELETE
export function* bplusDelete(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tv = new TreeView({x: 0, y: -215, scale: 1.7, plus: true});
  const delChip = chip('DELETE ▸ —', C.red, {x: -620, y: -400, fs: 26, sh: 6, color: C.ink}) as Rect;
  const rule = chip('DEMO RULE: A LEAF NEEDS AT LEAST 2 KEYS (MAX 3)', C.surf2, {x: -480, y: 340, fs: 18, sh: 0, color: C.ink}) as Rect;
  const lg = legend(380, 340, true);
  view.add(
    <Node ref={root} opacity={0}>
      {delChip}
      {tv.root}
      {rule}
      {lg}
    </Node>,
  );
  const s0 = snapOf('r', [
    ['r', [20, 40], ['a', 'b', 'c']],
    ['a', [5, 10]],
    ['b', [20, 25, 30]],
    ['c', [40, 50, 55]],
  ]);
  yield* root().opacity(1, 0.3);
  yield* say('Delete is insert in reverse. Remove the key, then fix any node that became too empty.');
  yield* tv.show(s0, 0.8);
  yield* waitFor(2.2);

  // 1. simple delete
  chipText(delChip).text('DELETE ▸ 55');
  yield* say('Delete 55: find its leaf and remove it. The leaf still has 2 keys, so nothing else to do.');
  yield* tv.mark(['c'], C.yellow);
  yield* tv.markCell('c', 2, C.red, 0.2);
  yield* waitFor(1.2);
  yield* tv.unmark();
  const s1 = snapOf('r', [
    ['r', [20, 40], ['a', 'b', 'c']],
    ['a', [5, 10]],
    ['b', [20, 25, 30]],
    ['c', [40, 50]],
  ]);
  yield* tv.show(s1, 0.6);
  yield* waitFor(1.8);

  // 2. underflow + borrow
  chipText(delChip).text('DELETE ▸ 5');
  yield* say('Delete 5: the leaf drops to a single key. That is below the minimum: underflow.');
  yield* tv.mark(['a'], C.yellow);
  yield* tv.markCell('a', 0, C.red, 0.2);
  yield* waitFor(1.2);
  yield* tv.unmark();
  const s2 = snapOf('r', [
    ['r', [20, 40], ['a', 'b', 'c']],
    ['a', [10]],
    ['b', [20, 25, 30]],
    ['c', [40, 50]],
  ]);
  yield* tv.show(s2, 0.5);
  yield* tv.mark(['a'], C.red, 0.2);
  yield* waitFor(2);
  yield* tv.unmark();
  yield* say('Fix 1, borrow: the right sibling has a spare key. Move 20 over and update the parent signpost.');
  yield* tv.mark(['b'], C.cyan);
  yield* waitFor(1.6);
  const s3 = snapOf('r', [
    ['r', [25, 40], ['a', 'b', 'c']],
    ['a', [10, 20]],
    ['b', [25, 30]],
    ['c', [40, 50]],
  ]);
  yield* tv.unmark();
  yield* tv.show(s3, 1);
  yield* tv.mark(['r', 'a', 'b'], C.lime, 0.2);
  yield* waitFor(2.2);
  yield* tv.unmark();

  // 3. merge
  chipText(delChip).text('DELETE ▸ 50');
  yield* say('Delete 50: the last leaf underflows again. Its neighbour [25, 30] has nothing to spare.');
  yield* tv.mark(['c'], C.yellow);
  yield* tv.markCell('c', 1, C.red, 0.2);
  yield* waitFor(1.2);
  yield* tv.unmark();
  const s4 = snapOf('r', [
    ['r', [25, 40], ['a', 'b', 'c']],
    ['a', [10, 20]],
    ['b', [25, 30]],
    ['c', [40]],
  ]);
  yield* tv.show(s4, 0.5);
  yield* tv.mark(['c'], C.red, 0.2);
  yield* waitFor(1.6);
  yield* tv.unmark();
  yield* say('Fix 2, merge: combine the two thin leaves into one, and delete the separator 40 from the parent.');
  yield* tv.mark(['b', 'c'], C.pink);
  yield* waitFor(1.6);
  const s5 = snapOf('r', [
    ['r', [25], ['a', 'b']],
    ['a', [10, 20]],
    ['b', [25, 30, 40]],
  ]);
  yield* tv.unmark();
  yield* tv.show(s5, 1.1);
  yield* tv.mark(['b'], C.lime, 0.2);
  yield* waitFor(2.4);
  yield* tv.unmark();
  yield* say('If merges ripple up and the root is left with one child, the tree shrinks a level. It stays balanced.', 4);
  yield* say('That is the rhythm: splits on insert, borrows and merges on delete. Every page stays reasonably full.', 3.6);
  yield* leave(root());
}

// ================================================================ WHY B+TREE
export function* bplusWhy(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const rowsData: [string, string, string, string][] = [
    ['KEYS PER INTERNAL PAGE', 'fewer (carry row pointers)', 'more (keys only)', 'wider, shallower tree'],
    ['POINT LOOKUP', 'may stop early', 'always reaches a leaf', 'same cost every time'],
    ['RANGE / ORDER BY', 'climb up and down', 'walk the leaf chain', 'sequential reads'],
    ['FULL INDEX SCAN', 'visit every node', 'only the leaf level', 'less I/O'],
  ];
  const head = (
    <Node y={-300}>
      <Txt x={-170} text="B-TREE" fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={3} fill={C.violet} />
      <Txt x={250} text="B+TREE" fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={3} fill={C.lime} />
    </Node>
  ) as Node;
  const table: Rect[] = [];
  const checks: Node[] = [];
  rowsData.forEach(([name, a, b, why], i) => {
    const y = -210 + i * 112;
    const r = (
      <Rect y={y} width={1700} height={92} radius={18} fill={C.surf} {...NB(C.lime, 7, 4)} opacity={0}>
        <Txt x={-810} offsetX={-1} text={name} fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={2} fill={C.mute} />
        <Txt x={-170} text={a} fontFamily={FONT} fontWeight={600} fontSize={25} fill={C.ink} />
        <Txt x={250} text={b} fontFamily={FONT} fontWeight={700} fontSize={25} fill={C.lime} />
        <Txt x={640} text={why} fontFamily={FONT} fontWeight={600} fontSize={22} fill={C.yellow} />
      </Rect>
    ) as Rect;
    table.push(r);
  });
  void checks;
  const verdict = chip('MOST DATABASES: B+TREE', C.pink, {y: 285, fs: 46, sh: 10, rot: -1.5, color: C.dark}) as Rect;
  verdict.opacity(0);
  const names = chip('MYSQL INNODB · POSTGRESQL · ORACLE · SQL SERVER · SQLITE', C.surf2, {y: 365, fs: 20, sh: 0, color: C.ink}) as Rect;
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
