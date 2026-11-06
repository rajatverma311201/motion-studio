import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  CAPTIONS,
  SYSTEM_COLUMNS,
  SYSTEM_ROWS,
  chip,
  colors,
  compareTable,
  leave,
  pop,
  readSeconds,
  say,
} from '@motion-studio/video-kit';
import {COMBINING} from '../layout';

// 07 COMBINING — planned 70 s: the real-system table, then one highlight per row that matters.
export function* combiningSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS.combining;
  const root = createRef<Node>();
  const table = compareTable({
    x: COMBINING.table.x,
    y: COMBINING.table.y,
    w: COMBINING.table.w,
    columns: [
      {title: SYSTEM_COLUMNS[0], color: colors.cyan},
      {title: SYSTEM_COLUMNS[1], color: colors.orange},
      {title: SYSTEM_COLUMNS[2], color: colors.yellow},
      {title: SYSTEM_COLUMNS[3], color: colors.pink},
    ],
    rows: SYSTEM_ROWS.map(row => ({label: row.label, cells: [...row.cells]})),
    rowHeight: 88,
    fontSize: 20,
  });
  const aes = chip('AES-GCM: TAG + CIPHERTEXT', colors.surf2, {
    x: COMBINING.aes.x,
    y: COMBINING.aes.y,
    fs: 24,
    color: colors.pink,
    shadow: colors.pink,
    sh: 6,
  }) as Node;
  table.node.opacity(0);
  aes.opacity(0);

  view.add(
    <Node ref={root}>
      {table.node}
      {aes}
    </Node>,
  );

  yield* all(say(captions[0], readSeconds(captions[0])), table.node.opacity(1, 0.3), table.revealAll());
  yield* waitFor(7.0);

  yield* all(
    say(captions[1], readSeconds(captions[1])),
    table.highlightCell(5, 2, colors.pink),
    table.highlightCell(5, 3, colors.pink),
    pop(aes, 0.3),
  );
  yield* waitFor(7.0);

  yield* all(
    say(captions[2], readSeconds(captions[2])),
    table.highlightCell(0, 2, colors.cyan),
    table.highlightCell(0, 3, colors.cyan),
  );
  yield* waitFor(7.0);

  yield* all(
    say(captions[3], readSeconds(captions[3])),
    table.highlightCell(1, 0, colors.cyan),
    table.highlightCell(1, 2, colors.yellow),
  );
  yield* waitFor(7.0);

  yield* all(say(captions[4], readSeconds(captions[4])), table.highlightCell(2, 1, colors.orange));
  yield* waitFor(15.0);
  yield* leave(root());
}
