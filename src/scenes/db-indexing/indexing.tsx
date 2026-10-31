import {View2D, makeScene2D} from '@motion-canvas/2d';
import {ThreadGenerator, waitFor} from '@motion-canvas/core';
import {C, buildHud, setSection} from './kit';
import {btreeInsert, btreeRules, btreeSearch} from './s_btree';
import {bplusCompare, bplusDelete, bplusInsert, bplusRange, bplusWhy} from './s_bplus';
import {clustered, composite, costs, explain, recap} from './s_real';
import {bst, fanout, intro, scan, sortedIndex} from './s_intro';

const SECTIONS: {name: string; color: string; run: (v: View2D) => ThreadGenerator}[] = [
  {name: 'INTRO', color: C.lime, run: intro},
  {name: 'FULL TABLE SCAN', color: C.red, run: scan},
  {name: 'SORTED INDEX', color: C.cyan, run: sortedIndex},
  {name: 'BINARY TREES', color: C.violet, run: bst},
  {name: 'PAGES AND FANOUT', color: C.yellow, run: fanout},
  {name: 'B-TREE RULES', color: C.violet, run: btreeRules},
  {name: 'B-TREE SEARCH', color: C.cyan, run: btreeSearch},
  {name: 'B-TREE INSERT', color: C.lime, run: btreeInsert},
  {name: 'B-TREE VS B+TREE', color: C.pink, run: bplusCompare},
  {name: 'B+TREE INSERT', color: C.lime, run: bplusInsert},
  {name: 'LOOKUP AND RANGE SCAN', color: C.cyan, run: bplusRange},
  {name: 'B+TREE DELETE', color: C.red, run: bplusDelete},
  {name: 'WHY B+TREE WINS', color: C.yellow, run: bplusWhy},
  {name: 'CLUSTERED VS SECONDARY', color: C.cyan, run: clustered},
  {name: 'COMPOSITE INDEXES', color: C.violet, run: composite},
  {name: 'THE COST OF INDEXES', color: C.orange, run: costs},
  {name: 'EXPLAIN AND GOTCHAS', color: C.red, run: explain},
  {name: 'RECAP', color: C.lime, run: recap},
];

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  let START = 0;
  try {
    const m = /s=(\d+)/.exec(location.hash);
    if (m) START = Math.max(0, Math.min(Number(m[1]), SECTIONS.length - 1));
  } catch {
    START = 0;
  }
  buildHud(view, 'DB INDEXING', SECTIONS);
  for (let i = START; i < SECTIONS.length; i++) {
    yield* setSection(i);
    yield* SECTIONS[i].run(view);
  }
  yield* waitFor(0.5);
});
