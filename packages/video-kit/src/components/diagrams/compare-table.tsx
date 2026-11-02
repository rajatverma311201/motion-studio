import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeInOutCubic, easeOutCubic, sequence} from '@motion-canvas/core';
import {borderWidth, boxStyle, colors, fonts, radius, withAlpha} from '../../theme';
import {tableLayout, wrapGrid, type CompareColumn, type CompareRow} from './table-layout';

/** Options for {@link compareTable}. */
export interface CompareTableOptions {
  x: number;
  y: number;
  w: number;
  columns: CompareColumn[];
  rows: CompareRow[];
  rowHeight?: number;
  fontSize?: number;
}

/** Handles returned by {@link compareTable}. */
export interface CompareTable {
  node: Node;
  revealRow(index: number): ThreadGenerator;
  revealAll(): ThreadGenerator;
  highlightCell(row: number, column: number, color?: string): ThreadGenerator;
  dimRow(index: number): ThreadGenerator;
}

/**
 * A comparison table with coloured column titles, a label column and one cell
 * per row and column. Cells wrap on the fixed monospace grid and reveal in the
 * order the lesson calls them.
 *
 * @example
 * const table = compareTable({
 *   x: 0, y: -40, w: 1500,
 *   columns: [{title: 'ENCODING', color: colors.cyan}, {title: 'SIGNING', color: colors.yellow}],
 *   rows: [{label: 'Goal', cells: ['carry data', 'prove integrity']}],
 * });
 * view.add(table.node);
 * yield* table.revealAll();
 */
export function compareTable(options: CompareTableOptions): CompareTable {
  const {x, y, columns, rows} = options;
  const layout = tableLayout(options);
  const rowNodes: Node[] = [];
  const cellRects: Rect[][] = [];
  const body = createRef<Node>();

  const node = (
    <Node x={x} y={y}>
      <Rect
        width={layout.width}
        height={layout.height}
        radius={radius(22)}
        fill={colors.surf}
        {...boxStyle(colors.dim, 8, 4)}
      />
      <Rect
        y={layout.headerY}
        width={layout.width - 16}
        height={layout.headerHeight - 8}
        radius={radius(14)}
        fill={colors.surf2}
      />
      {columns.map((column, index) => (
        <Txt
          x={layout.columnX[index]}
          y={layout.headerY}
          text={column.title}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={20}
          letterSpacing={1.5}
          fill={column.color}
        />
      ))}
      <Node ref={body}>
        {rows.map((row, rowIndex) => {
          const cells: Rect[] = [];
          const rowNode = (
            <Node y={layout.rowY[rowIndex]} opacity={0}>
              <Rect
                width={layout.width - 16}
                height={layout.rowHeight - 8}
                radius={radius(12)}
                fill={rowIndex % 2 === 0 ? colors.clear : colors.surf2}
                opacity={rowIndex % 2 === 0 ? 1 : 0.45}
              />
              <Txt
                x={-layout.width / 2 + 22}
                y={0}
                offsetX={-1}
                text={row.label}
                fontFamily={fonts.mono}
                fontWeight={700}
                fontSize={22}
                fill={colors.ink}
              />
              {row.cells.map((cell, columnIndex) => {
                const lines = wrapGrid(cell, layout.charsPerCell);
                const lineHeight = layout.fontSize * 1.35;
                const cellRect = (
                  <Rect
                    x={layout.columnX[columnIndex]}
                    y={0}
                    width={layout.cellWidth - 14}
                    height={layout.rowHeight - 14}
                    radius={radius(10)}
                    fill={colors.clear}
                    stroke={colors.clear}
                    lineWidth={borderWidth(2)}
                  />
                ) as Rect;
                cells.push(cellRect);
                return [
                  cellRect,
                  ...lines.map(
                    (line, lineIndex) =>
                      (
                        <Txt
                          x={layout.columnX[columnIndex]}
                          y={(lineIndex - (lines.length - 1) / 2) * lineHeight}
                          text={line}
                          fontFamily={fonts.mono}
                          fontSize={layout.fontSize}
                          fill={colors.ink}
                        />
                      ) as Txt,
                  ),
                ];
              })}
              {rowIndex > 0 ? (
                <Line
                  y={-layout.rowHeight / 2}
                  points={[
                    [-layout.width / 2 + 12, 0],
                    [layout.width / 2 - 12, 0],
                  ]}
                  stroke={colors.dim}
                  lineWidth={2}
                  opacity={0.5}
                />
              ) : null}
            </Node>
          ) as Node;
          rowNodes.push(rowNode);
          cellRects.push(cells);
          return rowNode;
        })}
      </Node>
    </Node>
  ) as Node;

  function* revealRow(index: number): ThreadGenerator {
    const row = rowNodes[index];
    if (!row) throw new Error(`compareTable: no row ${index}`);
    row.scale(0.94);
    yield* all(row.opacity(1, 0.22), row.scale(1, 0.3, easeOutCubic));
  }

  function* revealAll(): ThreadGenerator {
    yield* sequence(0.14, ...rowNodes.map((_, index) => revealRow(index)));
  }

  function* highlightCell(row: number, column: number, color: string = colors.yellow): ThreadGenerator {
    const cell = cellRects[row]?.[column];
    if (!cell) throw new Error(`compareTable: no cell ${row}/${column}`);
    yield* all(cell.fill(withAlpha(color, 0.2), 0.2), cell.stroke(color, 0.2));
    cell.scale(1.04);
    yield* cell.scale(1, 0.2, easeInOutCubic);
  }

  function* dimRow(index: number): ThreadGenerator {
    const row = rowNodes[index];
    if (!row) throw new Error(`compareTable: no row ${index}`);
    yield* row.opacity(0.38, 0.25);
  }

  return {node, revealRow, revealAll, highlightCell, dimRow};
}
