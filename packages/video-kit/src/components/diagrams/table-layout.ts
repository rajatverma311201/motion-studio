/** One column of a comparison table. */
export interface CompareColumn {
  title: string;
  color: string;
}

/** One row: a label plus one cell per column. */
export interface CompareRow {
  label: string;
  cells: string[];
}

/** Options for the pure table geometry. */
export interface TableLayoutOptions {
  w: number;
  columns: CompareColumn[];
  rows: CompareRow[];
  rowHeight?: number;
  fontSize?: number;
}

/** Sizes and coordinates for {@link CompareTable}. */
export interface TableLayout {
  width: number;
  height: number;
  headerHeight: number;
  rowHeight: number;
  fontSize: number;
  labelWidth: number;
  cellWidth: number;
  labelX: number;
  columnX: number[];
  headerY: number;
  rowY: number[];
  charsPerCell: number;
}

const HEADER_HEIGHT = 64;
const HORIZONTAL_PADDING = 24;

/**
 * Convert words to lines that never exceed `maxChars`. Long words are split.
 *
 * @example
 * wrapGrid('carry data safely', 10); // ['carry data', 'safely']
 */
export function wrapGrid(text: string, maxChars: number): string[] {
  const limit = Math.max(1, Math.floor(maxChars));
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    if (word.length > limit) {
      if (line) {
        lines.push(line);
        line = '';
      }
      for (let i = 0; i < word.length; i += limit) lines.push(word.slice(i, i + limit));
      continue;
    }

    const next = line ? `${line} ${word}` : word;
    if (next.length > limit) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
}

/**
 * Compute the table's columns, rows and wrap width. The label column takes 30 %
 * and the cells share the rest, so the column widths add up to `w`.
 *
 * @example
 * const layout = tableLayout({w: 1400, columns, rows});
 * layout.columnX; // one centre x per column
 */
export function tableLayout(options: TableLayoutOptions): TableLayout {
  const {w, columns, rows} = options;
  const rowHeight = options.rowHeight ?? 88;
  const fontSize = options.fontSize ?? 20;
  const labelWidth = Math.round(w * 0.3);
  const cellWidth = (w - labelWidth) / columns.length;
  const charsPerCell = Math.max(4, Math.floor((cellWidth - HORIZONTAL_PADDING) / (fontSize * 0.6)));
  const height = HEADER_HEIGHT + rowHeight * rows.length;

  return {
    width: w,
    height,
    headerHeight: HEADER_HEIGHT,
    rowHeight,
    fontSize,
    labelWidth,
    cellWidth,
    labelX: -w / 2 + labelWidth / 2,
    columnX: columns.map((_, index) => -w / 2 + labelWidth + cellWidth * (index + 0.5)),
    headerY: -height / 2 + HEADER_HEIGHT / 2,
    rowY: rows.map((_, index) => -height / 2 + HEADER_HEIGHT + rowHeight * index + rowHeight / 2),
    charsPerCell,
  };
}
