import {describe, expect, it} from 'vitest';
import {IndexTree} from './index-tree';
import {searchPlan} from './search-plan';
import type {Snap, Step} from './tree-types';

const SEQ = [10, 20, 5, 15, 30, 25, 40, 12, 8, 6, 7];

function build(plus: boolean): Snap {
  const tree = new IndexTree(3, plus);
  for (const key of SEQ) tree.insert(key);
  return tree.snap();
}

const finalB = build(false);
const finalBPlus = build(true);

/** leaf = `k1,k2`, internal = `keys(child | child | ...)` */
function renderNode(snap: Snap, id: string): string {
  const node = snap.nodes[id];
  if (node.leaf) return node.keys.join(',');
  return `${node.keys.join(',')}(${node.kids.map(kid => renderNode(snap, kid)).join(' | ')})`;
}

function splitCaptions(steps: Step[]): string {
  return steps
    .filter(step => step.kind === 'split' || step.kind === 'newroot')
    .map(step => step.cap.toUpperCase())
    .join('\n');
}

function assertInvariants(tree: IndexTree): void {
  const snap = tree.snap();
  const leafDepths = new Set<number>();
  const visit = (id: string, depth: number) => {
    const node = snap.nodes[id];
    expect(node.keys.length).toBeLessThanOrEqual(3);
    expect(node.keys).toEqual([...node.keys].sort((a, b) => Number(a) - Number(b)));
    if (node.leaf) {
      leafDepths.add(depth);
      return;
    }
    expect(node.kids.length).toBe(node.keys.length + 1);
    node.kids.forEach(kid => visit(kid, depth + 1));
  };
  visit(snap.root, 0);
  expect(leafDepths.size).toBe(1);
}

describe('IndexTree', () => {
  it('builds the verified B-tree shape', () => {
    expect(renderNode(finalB, finalB.root)).toBe('15(7,10(5,6 | 8 | 12) | 30(20,25 | 40))');
  });

  it('builds the verified B+tree shape', () => {
    expect(renderNode(finalBPlus, finalBPlus.root)).toBe('15(7,10(5,6 | 7,8 | 10,12) | 25(15,20 | 25,30,40))');
  });

  it('keeps the B-tree invariants after every insert', () => {
    const tree = new IndexTree(3, false);
    for (const key of SEQ) {
      tree.insert(key);
      assertInvariants(tree);
    }
  });

  it('keeps the B+tree invariants after every insert', () => {
    const tree = new IndexTree(3, true);
    for (const key of SEQ) {
      tree.insert(key);
      assertInvariants(tree);
    }
  });

  it('copies the separator up in a B+tree and moves the median in a B-tree', () => {
    // Captions of `newroot` steps are sentence-cased ("is copied" / "moves"),
    // so compare uppercased text; the logic itself is untouched.
    const bplus = new IndexTree(3, true);
    const bplusSteps = [10, 20, 5, 15].flatMap(key => bplus.insert(key));
    expect(splitCaptions(bplusSteps)).toContain('COPIED');

    const btree = new IndexTree(3, false);
    const btreeSteps = [10, 20, 5, 15].flatMap(key => btree.insert(key));
    expect(splitCaptions(btreeSteps)).toContain('MOVES');
  });

  it('finds 25 in a B-tree leaf', () => {
    const plan = searchPlan(finalB, 25, false);
    const last = plan[plan.length - 1];
    expect(finalB.nodes[last.id].leaf).toBe(true);
    expect(last.hit).toBeDefined();
  });

  it('stops at the root when a B-tree key lives in an internal node', () => {
    const plan = searchPlan(finalB, 15, false);
    expect(plan).toHaveLength(1);
    expect(plan[0].hit).toBe(0);
  });

  it('reports a miss when the key is absent', () => {
    const plan = searchPlan(finalB, 11, false);
    expect(plan[plan.length - 1].hit).toBeUndefined();
  });

  it('always reaches a leaf in a B+tree', () => {
    const plan = searchPlan(finalBPlus, 15, true);
    expect(plan.length).toBeGreaterThan(1);
    expect(finalBPlus.nodes[plan[0].id].leaf).toBe(false);
    expect(finalBPlus.nodes[plan[plan.length - 1].id].leaf).toBe(true);
    expect(plan[plan.length - 1].hit).toBe(0);
  });
});
