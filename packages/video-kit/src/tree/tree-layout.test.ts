import {describe, expect, it} from 'vitest';
import {IndexTree} from './index-tree';
import {layoutTree, nodeWidth} from './tree-layout';
import type {Snap} from './tree-types';

const SEQ = [10, 20, 5, 15, 30, 25, 40, 12, 8, 6, 7];
const CW = 60;
const HGAP = 26;
const VGAP = 124;

function finalBTree(): Snap {
  const tree = new IndexTree(3, false);
  for (const key of SEQ) tree.insert(key);
  return tree.snap();
}

const snap = finalBTree();
const pos = layoutTree(snap, CW, HGAP, VGAP);

describe('layoutTree', () => {
  it('returns a position for every node', () => {
    const ids = Object.keys(snap.nodes);
    expect(pos.size).toBe(ids.length);
    for (const id of ids) expect(pos.has(id)).toBe(true);
  });

  it('centres the root over its first and last child', () => {
    const root = snap.nodes[snap.root];
    const first = pos.get(root.kids[0])!;
    const last = pos.get(root.kids[root.kids.length - 1])!;
    expect(pos.get(snap.root)!.x).toBeCloseTo((first.x + last.x) / 2, 5);
  });

  it('never overlaps two nodes on the same level', () => {
    const levels = new Map<number, string[]>();
    const walk = (id: string, depth: number) => {
      const bucket = levels.get(depth) ?? [];
      bucket.push(id);
      levels.set(depth, bucket);
      snap.nodes[id].kids.forEach(kid => walk(kid, depth + 1));
    };
    walk(snap.root, 0);

    for (const ids of levels.values()) {
      const boxes = ids
        .map(id => ({x: pos.get(id)!.x, w: nodeWidth(snap.nodes[id].keys.length, CW)}))
        .sort((a, b) => a.x - b.x);
      for (let i = 1; i < boxes.length; i++) {
        const gap = boxes[i].x - boxes[i - 1].x;
        expect(gap).toBeGreaterThanOrEqual((boxes[i].w + boxes[i - 1].w) / 2 + HGAP);
      }
    }
  });

  it('centres the bounding box around zero', () => {
    let minX = Infinity;
    let maxX = -Infinity;
    for (const [id, p] of pos) {
      const half = nodeWidth(snap.nodes[id].keys.length, CW) / 2;
      minX = Math.min(minX, p.x - half);
      maxX = Math.max(maxX, p.x + half);
    }
    expect(Math.abs(minX + maxX)).toBeLessThanOrEqual(1);
  });
});
