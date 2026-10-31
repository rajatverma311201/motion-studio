import {Node, type View2D} from '@motion-canvas/2d';
import type {ThreadGenerator} from '@motion-canvas/core';
import {createRef, waitFor} from '@motion-canvas/core';
import {IndexTree, TreeView, colors, label, leave, miniTree, playInsert, say} from '@motion-studio/video-kit';

export function* treeSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tree = new IndexTree(3, false);
  const tv = new TreeView({x: 0, y: -210, scale: 1});
  const treeLabel = label('B-TREE · PLAYINSERT', 0, -390, {fs: 20});
  const mini = miniTree({
    cx: 0,
    rootText: 'ROOT',
    rows: [['10', '20'], ['30'], ['40']],
    rootColor: colors.violet,
    leafColor: colors.lime,
    rowFontSize: 24,
  });
  const miniLabel = label('MINI TREE', 0, 300, {fs: 18});
  mini.node.y(120);
  mini.node.opacity(0);
  miniLabel.opacity(0);

  view.add(
    <Node ref={root} opacity={0}>
      {treeLabel}
      {tv.root}
      {mini.node}
      {miniLabel}
    </Node>,
  );

  yield* root().opacity(1, 0.25);
  yield* say('A small B-tree, built one insert at a time with the kit tree engine.');
  yield* tv.show(tree.snap(), 0.4);
  for (const key of [10, 20, 5]) {
    yield* playInsert(tv, tree.insert(key), {narrate: false, speed: 0.8});
  }
  yield* waitFor(0.4);
  yield* say('The mini tree is the compact diagram for a recap: less detail, more space.');
  yield* tv.hide(0.4);
  yield* mini.node.opacity(1, 0.3);
  yield* miniLabel.opacity(1, 0.2);
  yield* waitFor(1.6);
  yield* leave(root());
}
