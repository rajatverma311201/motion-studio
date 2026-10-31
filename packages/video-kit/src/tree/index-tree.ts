import type {Snap, Step, TNode} from './tree-types';

interface N {
  id: string;
  keys: number[];
  kids: N[];
  leaf: boolean;
}

/**
 * Pure B-tree / B+tree with `M` keys per node. Every insert records the
 * descent, the leaf insert and each split as a snapshot.
 *
 * @example
 * const tree = new IndexTree(3, false);
 * const steps = tree.insert(15);
 * const finalSnap = tree.snap();
 */
export class IndexTree {
  root: N;
  private seq = 0;
  /** plus = B+tree (data only in leaves, copy-up leaf splits) */
  constructor(
    public M = 3,
    public plus = false,
  ) {
    this.root = this.mk(true);
  }
  private mk(leaf: boolean): N {
    return {id: `n${++this.seq}`, keys: [], kids: [], leaf};
  }

  /** copy the current tree into a renderable snapshot */
  snap(): Snap {
    const nodes: Record<string, TNode> = {};
    const walk = (n: N) => {
      nodes[n.id] = {id: n.id, keys: [...n.keys], kids: n.kids.map(k => k.id), leaf: n.leaf};
      n.kids.forEach(walk);
    };
    walk(this.root);
    return {root: this.root.id, nodes};
  }

  /** child index to follow for a key inside an internal node */
  private childIdx(n: N, key: number): number {
    let i = 0;
    while (i < n.keys.length && key >= n.keys[i]) i++;
    return i;
  }

  insert(key: number): Step[] {
    const steps: Step[] = [];
    const push = (kind: Step['kind'], cap: string, focus: string[]) =>
      steps.push({snap: this.snap(), cap, kind, focus});
    const path: {n: N; i: number}[] = [];
    let n = this.root;
    while (!n.leaf) {
      const i = this.childIdx(n, key);
      const ks = `[${n.keys.join(', ')}]`;
      const why =
        i === 0
          ? `${key} < ${n.keys[0]}: go left`
          : i === n.keys.length
            ? `${key} ≥ ${n.keys[n.keys.length - 1]}: go right`
            : `${n.keys[i - 1]} ≤ ${key} < ${n.keys[i]}: go to child ${i + 1}`;
      push('visit', `Look in ${ks}: ${why}.`, [n.id]);
      path.push({n, i});
      n = n.kids[i];
    }
    push('visit', `Reached the leaf [${n.keys.join(', ')}].`, [n.id]);

    // insert into the leaf, keeping it sorted
    let p = 0;
    while (p < n.keys.length && n.keys[p] < key) p++;
    n.keys.splice(p, 0, key);
    push('insert', `Insert ${key} into the leaf, keys stay sorted.`, [n.id]);

    let cur = n;
    while (cur.keys.length > this.M) {
      push('overflow', `${cur.keys.length} keys but the maximum is ${this.M}: overflow! Time to split.`, [cur.id]);
      const mid = Math.floor(cur.keys.length / 2);
      const right = this.mk(cur.leaf);
      let up: number;
      if (this.plus && cur.leaf) {
        // B+tree leaf: right leaf keeps the separator; it is COPIED up
        right.keys = cur.keys.slice(mid);
        cur.keys = cur.keys.slice(0, mid);
        up = right.keys[0];
      } else {
        // B-tree node, or B+tree internal node: the middle key MOVES up
        up = cur.keys[mid];
        right.keys = cur.keys.slice(mid + 1);
        cur.keys = cur.keys.slice(0, mid);
        if (!cur.leaf) {
          right.kids = cur.kids.slice(mid + 1);
          cur.kids = cur.kids.slice(0, mid + 1);
        }
      }
      const parent = path.pop();
      const copy = this.plus && cur.leaf;
      if (!parent) {
        const nr = this.mk(false);
        nr.keys = [up];
        nr.kids = [cur, right];
        this.root = nr;
        push(
          'newroot',
          `The root split, so a new root is created: the tree grows one level UP. ${up} ${copy ? 'is copied' : 'moves'} into it.`,
          [nr.id, cur.id, right.id],
        );
        break;
      }
      parent.n.keys.splice(parent.i, 0, up);
      parent.n.kids.splice(parent.i + 1, 0, right);
      const cap = copy
        ? `Split into two leaves. ${up} is COPIED up: it stays in the right leaf.`
        : this.plus
          ? `Internal split: ${up} MOVES up to the parent and is not kept below.`
          : `Split in the middle: the median ${up} MOVES up to the parent.`;
      push('split', cap, [parent.n.id, cur.id, right.id]);
      cur = parent.n;
    }
    return steps;
  }
}
