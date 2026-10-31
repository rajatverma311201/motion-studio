import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {SimpleSignal, ThreadGenerator, all, createSignal, easeInOutCubic, easeOutBack, waitFor} from '@motion-canvas/core';
import {C, FONT, MONO, NB, chip, chipText, say} from './kit';
import {Key, SearchStep, Snap, Step, TNode, leavesOf} from './treeLogic';

/**
 * Animated tree renderer. Feed it snapshots (Snap) and it moves, creates and
 * removes node boxes so that splits, merges and new roots animate smoothly.
 * Edges and leaf links are reactive: they follow the node boxes while they move.
 */

const H = 72;
const PAD = 16;
export const nodeW = (n: number, cw: number) => Math.max(n, 1) * cw + PAD;

interface Vis {
  id: string;
  node: Node;
  bg: Rect;
  cellLayer: Node;
  cells: Rect[];
  texts: Txt[];
  nKeys: SimpleSignal<number>;
  keys: Key[];
  leaf: boolean;
}
interface Edge {
  line: Line;
  idx: SimpleSignal<number>;
}

export interface TreeOpts {
  x: number;
  y: number;
  scale?: number;
  /** width of one key cell */
  cw?: number;
  /** B+tree: draw links between leaves */
  plus?: boolean;
  /** which nodes show a small "row pointer" dot under each key */
  dots?: 'all' | 'leaf' | 'none';
  hgap?: number;
  vgap?: number;
  keyFs?: number;
}

function layout(s: Snap, cw: number, hgap: number, vgap: number) {
  const pos = new Map<string, {x: number; y: number}>();
  const w = new Map<string, number>();
  const calc = (id: string): number => {
    const n = s.nodes[id];
    const own = nodeW(n.keys.length, cw);
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
    const half = nodeW(s.nodes[id].keys.length, cw) / 2;
    minX = Math.min(minX, p.x - half);
    maxX = Math.max(maxX, p.x + half);
  }
  const shift = (minX + maxX) / 2;
  for (const p of pos.values()) p.x -= shift;
  return pos;
}

export class TreeView {
  readonly root: Node;
  private edgeLayer = (<Node />) as Node;
  private linkLayer = (<Node />) as Node;
  private nodeLayer = (<Node />) as Node;
  private vis = new Map<string, Vis>();
  private edges = new Map<string, Edge>();
  private links = new Map<string, Line>();
  private pos = new Map<string, {x: number; y: number}>();
  private snap: Snap | null = null;
  readonly cw: number;
  readonly scale: number;
  private o: Required<Omit<TreeOpts, 'x' | 'y' | 'scale' | 'cw'>>;

  constructor(opts: TreeOpts) {
    this.cw = opts.cw ?? 60;
    this.scale = opts.scale ?? 1;
    this.o = {
      plus: opts.plus ?? false,
      dots: opts.dots ?? (opts.plus ? 'leaf' : 'all'),
      hgap: opts.hgap ?? (opts.plus ? 52 : 26),
      vgap: opts.vgap ?? 124,
      keyFs: opts.keyFs ?? 26,
    };
    this.root = (
      <Node x={opts.x} y={opts.y} scale={this.scale}>
        {this.edgeLayer}
        {this.linkLayer}
        {this.nodeLayer}
      </Node>
    ) as Node;
  }

  // ------------------------------------------------------------ geometry for overlays
  /** absolute stage position of a node's centre */
  at(id: string): {x: number; y: number} {
    const p = this.pos.get(id)!;
    return {x: this.root.x() + p.x * this.scale, y: this.root.y() + p.y * this.scale};
  }
  /** absolute stage position of one key cell */
  cellAt(id: string, i: number): {x: number; y: number} {
    const a = this.at(id);
    const k = this.vis.get(id)!.keys.length;
    return {x: a.x + (i - (k - 1) / 2) * this.cw * this.scale, y: a.y};
  }
  get nodeHeight() {
    return H * this.scale;
  }

  // ------------------------------------------------------------ building blocks
  private colorOf(leaf: boolean) {
    return leaf ? C.lime : C.violet;
  }
  private showDot(leaf: boolean) {
    return this.o.dots === 'all' || (this.o.dots === 'leaf' && leaf);
  }

  private fill(v: Vis, n: TNode) {
    v.cellLayer.removeChildren();
    v.cells = [];
    v.texts = [];
    const k = n.keys.length;
    const dot = this.showDot(n.leaf);
    n.keys.forEach((key, i) => {
      const t = (
        <Txt y={dot ? -8 : 0} text={String(key)} fontFamily={MONO} fontWeight={700} fontSize={this.o.keyFs} fill={C.ink} />
      ) as Txt;
      const cell = (
        <Rect x={(i - (k - 1) / 2) * this.cw} width={this.cw - 8} height={H - 16} radius={8} fill={C.surf2}>
          {t}
          {dot ? <Circle y={18} size={9} fill={C.orange} /> : null}
        </Rect>
      ) as Rect;
      v.cellLayer.add(cell);
      v.cells.push(cell);
      v.texts.push(t);
    });
    v.keys = [...n.keys];
    v.leaf = n.leaf;
    v.nKeys(k);
  }

  private make(n: TNode, p: {x: number; y: number}): Vis {
    const nKeys = createSignal(n.keys.length);
    const bg = (
      <Rect width={() => nodeW(nKeys(), this.cw)} height={H} radius={14} fill={C.surf} {...NB(this.colorOf(n.leaf), 6, 3.5)} />
    ) as Rect;
    const cellLayer = (<Node />) as Node;
    const node = (
      <Node x={p.x} y={p.y}>
        {bg}
        {cellLayer}
      </Node>
    ) as Node;
    const v: Vis = {id: n.id, node, bg, cellLayer, cells: [], texts: [], nKeys, keys: [], leaf: n.leaf};
    this.fill(v, n);
    this.nodeLayer.add(node);
    return v;
  }

  // ------------------------------------------------------------ show a snapshot
  *show(snap: Snap, dur = 0.7): ThreadGenerator {
    const pos = layout(snap, this.cw, this.o.hgap, this.o.vgap);
    const anims: ThreadGenerator[] = [];
    this.pos = pos;

    // removed nodes
    for (const [id, v] of [...this.vis]) {
      if (snap.nodes[id]) continue;
      this.vis.delete(id);
      anims.push(
        (function* () {
          yield* v.node.opacity(0, dur * 0.5);
          v.node.remove();
        })(),
      );
    }
    // created / updated nodes
    for (const id of Object.keys(snap.nodes)) {
      const n = snap.nodes[id];
      const p = pos.get(id)!;
      let v = this.vis.get(id);
      if (!v) {
        v = this.make(n, p);
        this.vis.set(id, v);
        v.node.opacity(0);
        v.node.scale(0.6);
        anims.push(all(v.node.opacity(1, dur * 0.6), v.node.scale(1, dur * 0.6, easeOutBack)));
      } else {
        if (v.keys.join(',') !== n.keys.join(',') || v.leaf !== n.leaf) {
          const leafChanged = v.leaf !== n.leaf;
          this.fill(v, n);
          if (leafChanged) anims.push(v.bg.shadowColor(this.colorOf(n.leaf), dur * 0.5));
        }
        anims.push(v.node.position([p.x, p.y], dur, easeInOutCubic));
      }
    }

    // edges (parent -> child), anchored between the keys
    const wanted = new Set<string>();
    for (const id of Object.keys(snap.nodes)) {
      const n = snap.nodes[id];
      n.kids.forEach((c, i) => {
        const key = `${id}>${c}`;
        wanted.add(key);
        const ex = this.edges.get(key);
        if (ex) {
          ex.idx(i);
          return;
        }
        const pv = this.vis.get(id)!;
        const cv = this.vis.get(c)!;
        const idx = createSignal(i);
        const line = (
          <Line
            stroke={C.ink}
            lineWidth={3.5}
            opacity={0}
            points={() => {
              const px = pv.node.x() + (idx() - pv.nKeys() / 2) * this.cw;
              return [
                [px, pv.node.y() + H / 2],
                [cv.node.x(), cv.node.y() - H / 2],
              ];
            }}
          />
        ) as Line;
        this.edgeLayer.add(line);
        this.edges.set(key, {line, idx});
        anims.push(line.opacity(1, dur));
      });
    }
    for (const [key, e] of [...this.edges]) {
      if (wanted.has(key)) continue;
      this.edges.delete(key);
      anims.push(
        (function* () {
          yield* e.line.opacity(0, dur * 0.5);
          e.line.remove();
        })(),
      );
    }

    // leaf links (B+tree)
    if (this.o.plus) {
      const order = leavesOf(snap);
      const wantLinks = new Set<string>();
      for (let i = 0; i + 1 < order.length; i++) {
        const a = order[i];
        const b = order[i + 1];
        const key = `${a}>>${b}`;
        wantLinks.add(key);
        if (this.links.has(key)) continue;
        const va = this.vis.get(a)!;
        const vb = this.vis.get(b)!;
        const line = (
          <Line
            stroke={C.lime}
            lineWidth={4}
            endArrow
            arrowSize={11}
            opacity={0}
            points={() => [
              [va.node.x() + nodeW(va.nKeys(), this.cw) / 2 + 6, va.node.y()],
              [vb.node.x() - nodeW(vb.nKeys(), this.cw) / 2 - 10, vb.node.y()],
            ]}
          />
        ) as Line;
        this.linkLayer.add(line);
        this.links.set(key, line);
        anims.push(line.opacity(1, dur));
      }
      for (const [key, l] of [...this.links]) {
        if (wantLinks.has(key)) continue;
        this.links.delete(key);
        anims.push(
          (function* () {
            yield* l.opacity(0, dur * 0.5);
            l.remove();
          })(),
        );
      }
    }

    this.snap = snap;
    yield* all(...anims);
  }

  // ------------------------------------------------------------ highlighting
  *mark(ids: string[], color: string, dur = 0.15): ThreadGenerator {
    yield* all(...ids.filter(id => this.vis.has(id)).map(id => all(this.vis.get(id)!.bg.stroke(color, dur), this.vis.get(id)!.bg.lineWidth(6.5, dur))));
  }
  *unmark(dur = 0.15): ThreadGenerator {
    const a: ThreadGenerator[] = [];
    for (const v of this.vis.values()) {
      a.push(v.bg.stroke(C.ink, dur), v.bg.lineWidth(3.5, dur));
      v.cells.forEach((c, i) => {
        a.push(c.fill(C.surf2, dur), v.texts[i].fill(C.ink, dur));
      });
    }
    yield* all(...a);
  }
  *markCell(id: string, i: number, color: string, dur = 0.12): ThreadGenerator {
    const v = this.vis.get(id)!;
    if (!v.cells[i]) return;
    yield* all(v.cells[i].fill(color, dur), v.texts[i].fill(C.dark, dur));
  }
  /** colour a node's whole fill (e.g. to show it as merged / dirty) */
  *tint(ids: string[], color: string, dur = 0.2): ThreadGenerator {
    yield* all(...ids.filter(id => this.vis.has(id)).map(id => this.vis.get(id)!.bg.fill(color, dur)));
  }
  *untint(dur = 0.2): ThreadGenerator {
    yield* all(...[...this.vis.values()].map(v => v.bg.fill(C.surf, dur)));
  }
  *hide(dur = 0.4): ThreadGenerator {
    yield* this.root.opacity(0, dur);
  }
  idsOfLeaves(): string[] {
    return this.snap ? leavesOf(this.snap) : [];
  }
  keysOf(id: string): Key[] {
    return this.vis.get(id)?.keys ?? [];
  }
}

// ---------------------------------------------------------------------- players
/** animate an insertion: descent, insert, overflow, splits */
export function* playInsert(tv: TreeView, steps: Step[], o: {narrate?: boolean; speed?: number} = {}): ThreadGenerator {
  const sp = o.speed ?? 1;
  const nar = o.narrate ?? true;
  for (const s of steps) {
    if (nar) yield* say(s.cap);
    if (s.kind === 'visit') {
      yield* tv.mark(s.focus, C.yellow, 0.12 * sp);
      yield* waitFor((nar ? 1.0 : 0.22) * sp);
      yield* tv.unmark(0.1 * sp);
    } else if (s.kind === 'insert') {
      yield* tv.show(s.snap, 0.45 * sp);
      yield* tv.mark(s.focus, C.lime, 0.12 * sp);
      yield* waitFor((nar ? 1.1 : 0.25) * sp);
      yield* tv.unmark(0.1 * sp);
    } else if (s.kind === 'overflow') {
      yield* tv.mark(s.focus, C.red, 0.15);
      yield* waitFor(1.5);
    } else {
      // split / newroot
      yield* tv.unmark(0.05);
      yield* tv.show(s.snap, 0.95);
      yield* tv.mark(s.focus, C.lime, 0.15);
      yield* waitFor(1.5);
      yield* tv.unmark(0.15);
    }
  }
}

/** animate a lookup with a "needle" chip travelling down the tree */
export function* playSearch(
  tv: TreeView,
  plan: SearchStep[],
  key: number,
  o: {narrate?: boolean; cellTime?: number; onVisit?: (visited: number) => void} = {},
): ThreadGenerator {
  const nar = o.narrate ?? true;
  const ct = o.cellTime ?? 0.45;
  const needle = chip(`find ${key}`, C.yellow, {fs: 22, sh: 4}) as Rect;
  const first = tv.at(plan[0].id);
  needle.position([first.x, first.y - tv.nodeHeight / 2 - 46]);
  needle.opacity(0);
  tv.root.parent()!.add(needle);
  yield* needle.opacity(1, 0.25);
  for (let s = 0; s < plan.length; s++) {
    const st = plan[s];
    const a = tv.at(st.id);
    yield* needle.position([a.x, a.y - tv.nodeHeight / 2 - 46], 0.5, easeInOutCubic);
    o.onVisit?.(s + 1);
    yield* tv.mark([st.id], C.yellow, 0.12);
    for (let j = 0; j < st.cmp; j++) {
      const last = j === st.cmp - 1;
      yield* tv.markCell(st.id, j, last && st.hit !== undefined ? C.lime : C.yellow, 0.1);
      yield* waitFor(ct);
      if (!last) yield* tv.markCell(st.id, j, C.surf2, 0.08);
    }
    if (nar) yield* say(st.note);
    yield* waitFor(1.1);
    if (st.hit !== undefined || st.child === undefined) {
      yield* tv.mark([st.id], st.hit !== undefined ? C.lime : C.red, 0.15);
      yield* waitFor(1.0);
      break;
    }
    yield* tv.unmark(0.12);
  }
  yield* needle.opacity(0, 0.25);
  needle.remove();
}

export {chipText, FONT};
