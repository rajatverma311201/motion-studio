import {Node, Rect, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, sequence, waitFor} from '@motion-canvas/core';
import {TreeView, bulletRow, chip, colors, leave, pop, say} from '@motion-studio/video-kit';
import {finalSnap} from '../shared';

// ================================================================ B-TREE vs B+TREE
export function* btreeVsBplustreeSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const t1 = new TreeView({x: -470, y: -250, scale: 0.8});
  const t2 = new TreeView({x: 470, y: -250, scale: 0.8, plus: true});
  const h1 = chip('B-TREE', colors.violet, {x: -470, y: -385, fs: 28, sh: 6}) as Rect;
  const h2 = chip('B+TREE', colors.lime, {x: 470, y: -385, fs: 28, sh: 6}) as Rect;
  const left = [
    bulletRow(-470, 95, 'Row pointers live in every node', colors.violet),
    bulletRow(-470, 175, 'Each key appears exactly once', colors.violet),
    bulletRow(-470, 255, 'Leaves are not connected', colors.violet),
  ];
  const right = [
    bulletRow(470, 95, 'Row pointers only in the leaves', colors.lime),
    bulletRow(470, 175, 'Parent keys are copies: signposts', colors.lime),
    bulletRow(470, 255, 'Leaves are linked left to right', colors.lime),
  ];
  const vs = chip('VS', colors.pink, {x: 0, y: -90, fs: 34, sh: 6, rot: -6}) as Rect;
  [h1, h2, vs].forEach(n => n.opacity(0));
  view.add(
    <Node ref={root} opacity={0}>
      {t1.root}
      {t2.root}
      {h1}
      {h2}
      {vs}
      {left}
      {right}
    </Node>,
  );
  yield* root().opacity(1, 0.3);
  yield* say('Databases rarely use the plain B-tree. Almost all of them use its close cousin, the B+tree.');
  yield* all(pop(h1, 0.3), t1.show(finalSnap(false), 0.9));
  yield* all(pop(h2, 0.3), t2.show(finalSnap(true), 0.9), delay(0.4, pop(vs, 0.3)));
  yield* waitFor(2.4);

  yield* say('In a B-tree every node carries keys with row pointers. Each key lives in exactly one place.');
  yield* sequence(0.25, ...left.map(b => b.opacity(1, 0.3)));
  yield* waitFor(2.2);
  yield* say('In a B+tree, internal nodes are only signposts. All real entries sit in the leaves.');
  yield* sequence(0.25, ...right.map(b => b.opacity(1, 0.3)));
  yield* t2.mark(t2.idsOfLeaves(), colors.lime, 0.3);
  yield* waitFor(3);
  yield* t2.unmark();
  yield* say('That small change gives us two big wins: wider internal nodes, and cheap range scans.', 3.6);
  yield* leave(root());
}
