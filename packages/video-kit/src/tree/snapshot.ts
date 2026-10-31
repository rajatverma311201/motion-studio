import type {Key, Snap, TNode} from './tree-types';

/**
 * Hand-author a snapshot, mainly for scenes that need a fixed tree.
 *
 * @example
 * const snap = snapOf('r', [
 *   ['r', [20, 40], ['a', 'b', 'c']],
 *   ['a', [5, 10, 15]],
 *   ['b', [25, 30, 35]],
 *   ['c', [45, 50]],
 * ]);
 */
export function snapOf(root: string, nodes: [string, Key[], string[]?][]): Snap {
  const out: Record<string, TNode> = {};
  for (const [id, keys, kids] of nodes) out[id] = {id, keys, kids: kids ?? [], leaf: !kids || kids.length === 0};
  return {root, nodes: out};
}

/**
 * Leaf ids from left to right.
 *
 * @example
 * const leaves = leavesOf(snap); // ['a', 'b', 'c']
 */
export function leavesOf(s: Snap): string[] {
  const out: string[] = [];
  const walk = (id: string) => {
    const n = s.nodes[id];
    if (n.leaf) out.push(id);
    else n.kids.forEach(walk);
  };
  walk(s.root);
  return out;
}
