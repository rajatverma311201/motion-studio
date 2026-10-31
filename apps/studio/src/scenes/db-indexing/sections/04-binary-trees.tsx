import {Circle, Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {chip, chipText, colors, fonts, leave, neubrutal, pop, say} from '@motion-studio/video-kit';

// ================================================================ BINARY SEARCH TREE
export function* binaryTreesSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const nodes = new Map<number, Circle>();
  const layer = (<Node />) as Node;
  const edgeLayer = (<Node />) as Node;
  const mk = (key: number, x: number, y: number, parent?: number) => {
    const n = (
      <Circle x={x} y={y} size={84} fill={colors.surf} {...neubrutal(colors.violet, 6, 3.5)}>
        <Txt text={String(key)} fontFamily={fonts.mono} fontWeight={700} fontSize={30} fill={colors.ink} />
      </Circle>
    ) as Circle;
    n.opacity(0);
    nodes.set(key, n);
    layer.add(n);
    if (parent !== undefined) {
      const p = nodes.get(parent)!;
      const e = (
        <Line
          points={[
            [p.x(), p.y() + 30],
            [x, y - 36],
          ]}
          stroke={colors.ink}
          lineWidth={3.5}
          opacity={0}
        />
      ) as Line;
      edgeLayer.add(e);
      return {n, e};
    }
    return {n, e: null as Line | null};
  };
  const clear = function* (): ThreadGenerator {
    yield* all(layer.opacity(0, 0.35), edgeLayer.opacity(0, 0.35));
    layer.removeChildren();
    edgeLayer.removeChildren();
    nodes.clear();
    layer.opacity(1);
    edgeLayer.opacity(1);
  };
  const tag = chip('BINARY SEARCH TREE', colors.violet, {x: -600, y: -400, fs: 22, sh: 5}) as Rect;
  const note = chip('', colors.surf2, {x: 520, y: -400, fs: 22, sh: 0, color: colors.ink}) as Rect;
  note.opacity(0);
  view.add(
    <Node ref={root}>
      {tag}
      {note}
      {edgeLayer}
      {layer}
    </Node>,
  );

  yield* say('A binary search tree: smaller keys go left, bigger keys go right. No shifting needed.');
  const spec: [number, number, number, number?][] = [
    [40, 0, -280],
    [20, -330, -150, 40],
    [60, 330, -150, 40],
    [10, -500, -20, 20],
    [30, -170, -20, 20],
    [50, 170, -20, 60],
    [70, 500, -20, 60],
  ];
  const edges: Line[] = [];
  const pops: ThreadGenerator[] = [];
  for (const [k, x, y, p] of spec) {
    const {n, e} = mk(k, x, y, p);
    if (e) edges.push(e);
    pops.push(pop(n, 0.3));
  }
  yield* sequence(0.2, ...pops);
  yield* all(...edges.map(e => e.opacity(1, 0.4)));
  yield* waitFor(1.2);

  yield* say('Lookup for 50: compare with 40 (go right), then 60 (go left), then 50. Three steps for 7 keys.');
  for (const k of [40, 60, 50]) {
    yield* all(nodes.get(k)!.fill(colors.yellow, 0.2), (nodes.get(k)!.children()[0] as Txt).fill(colors.dark, 0.2));
    yield* waitFor(1.1);
  }
  yield* all(nodes.get(50)!.fill(colors.lime, 0.2));
  yield* waitFor(2.2);

  yield* say('But what if keys arrive in sorted order, like auto-increment ids 1, 2, 3, 4…?');
  yield* clear();
  const chain: [number, number, number, number?][] = [];
  for (let i = 0; i < 7; i++) chain.push([i + 1, -520 + i * 160, -300 + i * 78, i === 0 ? undefined : i]);
  for (const [k, x, y, p] of chain) {
    const {n, e} = mk(k, x, y, p);
    yield* all(pop(n, 0.3), e ? e.opacity(1, 0.3) : waitFor(0.01));
    yield* waitFor(0.25);
  }
  yield* say('The tree degenerates into a linked list. Every lookup is O(n) again.');
  chipText(note).text('HEIGHT = 7 FOR 7 KEYS');
  yield* pop(note, 0.3);
  yield* waitFor(3);

  yield* say('Self-balancing trees (AVL, red-black) fix the shape. But there is a second problem: disks.');
  yield* waitFor(3.2);
  yield* say(
    'Even perfectly balanced, 10 million keys need about 24 levels, and each level can be a separate disk read.',
    4,
  );
  yield* leave(root());
}
