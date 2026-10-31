import type {Snap} from './tree-types';

/** Width of a node box for `n` key cells, with 16 px of horizontal padding. */
export function nodeWidth(n: number, cw: number): number {
  return Math.max(n, 1) * cw + 16;
}

/**
 * Pure layout: place every node of a snapshot on a fixed monospace grid.
 * Children sit below their parent, the parent is centred over its first and
 * last child, and the whole bounding box is centred around x = 0.
 *
 * @example
 * const pos = layoutTree(tree.snap(), 60, 26, 124);
 * const root = pos.get(tree.snap().root); // {x: 0, y: 0}
 */
export function layoutTree(s: Snap, cw: number, hgap: number, vgap: number): Map<string, {x: number; y: number}> {
  const pos = new Map<string, {x: number; y: number}>();
  const w = new Map<string, number>();
  const calc = (id: string): number => {
    const n = s.nodes[id];
    const own = nodeWidth(n.keys.length, cw);
    let width = own;
    if (!n.leaf) {
      let sum = hgap * (n.kids.length - 1);
      for (const k of n.kids) sum += calc(k);
      width = Math.max(own, sum);
    }
    w.set(id, width);
    return width;
  };
  calc(s.root);
  const place = (id: string, left: number, depth: number) => {
    const n = s.nodes[id];
    const width = w.get(id)!;
    if (n.leaf) {
      pos.set(id, {x: left + width / 2, y: depth * vgap});
      return;
    }
    let sum = hgap * (n.kids.length - 1);
    for (const k of n.kids) sum += w.get(k)!;
    let cur = left + (width - sum) / 2;
    for (const k of n.kids) {
      place(k, cur, depth + 1);
      cur += w.get(k)! + hgap;
    }
    pos.set(id, {x: (pos.get(n.kids[0])!.x + pos.get(n.kids[n.kids.length - 1])!.x) / 2, y: depth * vgap});
  };
  place(s.root, 0, 0);
  // centre the bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  for (const [id, p] of pos) {
    const half = nodeWidth(s.nodes[id].keys.length, cw) / 2;
    minX = Math.min(minX, p.x - half);
    maxX = Math.max(maxX, p.x + half);
  }
  const shift = (minX + maxX) / 2;
  for (const p of pos.values()) p.x -= shift;
  return pos;
}
