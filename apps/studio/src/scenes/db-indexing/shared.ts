import {IndexTree, type Snap} from '@motion-studio/video-kit';

/** the insert sequence used for both the B-tree and the B+tree demos */
export const SEQ = [10, 20, 5, 15, 30, 25, 40, 12, 8, 6, 7];

export function finalSnap(plus: boolean): Snap {
  const t = new IndexTree(3, plus);
  SEQ.forEach(k => t.insert(k));
  return t.snap();
}
