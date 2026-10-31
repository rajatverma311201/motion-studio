/**
 * The y coordinate of a memory row's centre, in scene space.
 * The panel is `70 + rows * 44` tall and rows are 44 px apart.
 *
 * @example
 * memoryRowY(-5, 16, 0); // -300
 * memoryRowY(-5, 16, 15); // 360
 */
export function memoryRowY(panelY: number, rows: number, i: number): number {
  const h = 70 + rows * 44;
  return panelY - h / 2 + 70 + 44 * i + 22;
}
