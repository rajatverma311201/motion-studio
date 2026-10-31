import type {SearchStep, Snap} from './tree-types';

/**
 * Plan a lookup: one entry per visited node, with how many cells to compare
 * and whether the key was found. B+tree lookups always reach a leaf because
 * separator keys are copies.
 *
 * @example
 * const plan = searchPlan(tree.snap(), 25, false);
 * yield* playSearch(view, plan, 25);
 */
export function searchPlan(s: Snap, key: number, plus: boolean): SearchStep[] {
  const out: SearchStep[] = [];
  let n = s.nodes[s.root];
  for (;;) {
    const ks = n.keys as number[];
    if (n.leaf) {
      const idx = ks.indexOf(key);
      out.push({
        id: n.id,
        cmp: idx >= 0 ? idx + 1 : ks.length,
        hit: idx >= 0 ? idx : undefined,
        note: idx >= 0 ? `Found ${key} in the leaf.` : `${key} is not in the leaf: it does not exist.`,
      });
      return out;
    }
    let i = 0;
    for (; i < ks.length; i++) {
      if (!plus && key === ks[i]) {
        out.push({id: n.id, cmp: i + 1, hit: i, note: `${key} = ${ks[i]}: found it right here, in an internal node.`});
        return out;
      }
      if (key < ks[i]) break;
    }
    const cmp = Math.min(i + 1, ks.length);
    const note =
      i < ks.length
        ? `${key} < ${ks[i]}: follow the child on the left of ${ks[i]}.`
        : `${key} ≥ ${ks[ks.length - 1]}: follow the right-most child.`;
    out.push({id: n.id, cmp, child: i, note});
    n = s.nodes[n.kids[i]];
  }
}
