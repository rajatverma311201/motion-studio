/**
 * Shared types for the animated B-tree / B+tree engine.
 * The engine itself is pure: it only produces snapshots, never drawing code.
 */

export type Key = number | string;

export interface TNode {
  id: string;
  keys: Key[];
  kids: string[];
  leaf: boolean;
}
export interface Snap {
  root: string;
  nodes: Record<string, TNode>;
}
export interface Step {
  snap: Snap;
  cap: string;
  kind: 'visit' | 'insert' | 'overflow' | 'split' | 'newroot';
  focus: string[];
}

export interface SearchStep {
  id: string;
  /** how many keys of the node are compared (cells 0..cmp-1 are visited) */
  cmp: number;
  /** index of the key that matched, if any */
  hit?: number;
  /** child index followed, if any */
  child?: number;
  /** compact explanation of the last comparison */
  note: string;
}
