/** The centre of one grid cell, relative to the grid's centre. */
export interface GridCell {
  x: number;
  y: number;
}

/** Geometry for a square-ish grid of equal rounded cells. */
export interface GridLayout {
  size: number;
  columns: number;
  rows: number;
  cell: number;
  gap: number;
  step: number;
  positions: GridCell[];
}

/**
 * Lay `count` equal cells out in `columns` columns inside a `size` by `size`
 * box. The grid is centred vertically when the last row is partial.
 *
 * @example
 * const grid = gridLayout(320, 16, 256);
 * grid.positions[0]; // the top-left cell centre
 */
export function gridLayout(size: number, columns: number, count: number): GridLayout {
  if (!(size > 0)) throw new Error(`gridLayout: size must be positive (got ${size})`);
  if (!Number.isInteger(columns) || columns < 1) {
    throw new Error(`gridLayout: columns must be a positive integer (got ${columns})`);
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`gridLayout: count must be a positive integer (got ${count})`);
  }

  const gap = Math.max(1, size * 0.012);
  const cell = (size - gap * (columns - 1)) / columns;
  if (!(cell > 0)) throw new Error(`gridLayout: cell size is not positive (${cell})`);

  const rows = Math.ceil(count / columns);
  const step = cell + gap;
  const gridHeight = rows * cell + (rows - 1) * gap;
  const left = -size / 2 + cell / 2;
  const top = -gridHeight / 2 + cell / 2;
  const positions: GridCell[] = [];

  for (let index = 0; index < count; index++) {
    positions.push({
      x: left + (index % columns) * step,
      y: top + Math.floor(index / columns) * step,
    });
  }

  return {size, columns, rows, cell, gap, step, positions};
}
