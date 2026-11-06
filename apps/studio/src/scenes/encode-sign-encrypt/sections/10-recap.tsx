import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  CAPTIONS,
  RECAP_COLUMNS,
  RECAP_ROWS,
  chip,
  colors,
  compareTable,
  leave,
  pop,
  readSeconds,
  say,
} from '@motion-studio/video-kit';
import {RECAP} from '../layout';

// 09 RECAP — planned 30 s: the four tools in one matrix, then the closing tag.
export function* recapSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS.recap;
  const root = createRef<Node>();
  const table = compareTable({
    x: RECAP.table.x,
    y: RECAP.table.y,
    w: RECAP.table.w,
    columns: [
      {title: RECAP_COLUMNS[0], color: colors.violet},
      {title: RECAP_COLUMNS[1], color: colors.cyan},
      {title: RECAP_COLUMNS[2], color: colors.pink},
      {title: RECAP_COLUMNS[3], color: colors.orange},
    ],
    rows: RECAP_ROWS.map(row => ({label: row.label, cells: [...row.cells]})),
    rowHeight: 88,
    fontSize: 20,
  });
  const tag = chip('PICK THE TOOL FOR THE PROBLEM YOU HAVE', colors.yellow, {
    x: RECAP.tag.x,
    y: RECAP.tag.y,
    fs: 28,
    sh: 8,
  }) as Node;
  table.node.opacity(0);
  tag.opacity(0);

  view.add(
    <Node ref={root}>
      {table.node}
      {tag}
    </Node>,
  );

  yield* all(say(captions[0], readSeconds(captions[0])), table.node.opacity(1, 0.3), table.revealAll());
  yield* waitFor(4.0);

  yield* all(
    say(captions[1], readSeconds(captions[1])),
    table.highlightCell(2, 3, colors.yellow),
    table.highlightCell(3, 2, colors.pink),
  );
  yield* waitFor(4.0);

  yield* all(say(captions[2], readSeconds(captions[2])), pop(tag, 0.35));
  yield* waitFor(10.0);
  yield* leave(root());
}
