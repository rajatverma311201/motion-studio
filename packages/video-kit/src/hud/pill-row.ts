/** Fixed geometry for one HUD pill row. */
export interface PillRowOptions {
  /** X centre of the first pill. */
  startX: number;
  /** Centre-to-centre distance between pills. */
  step: number;
  /** Width of an inactive pill. */
  width: number;
  /** Width of the active pill. */
  activeWidth: number;
}

/** One pill's x centre plus the two widths it animates between. */
export interface PillBox {
  x: number;
  width: number;
  activeWidth: number;
}

const DEFAULT_STEP = 38;
const DEFAULT_WIDTH = 28;
const DEFAULT_ACTIVE_WIDTH = 52;
const DEFAULT_RIGHT = 904;

/**
 * Lay out a row of chapter pills. With no options it reproduces the shared
 * right-aligned default exactly; with options it uses the fixed start and step.
 *
 * @example
 * pillRow(11, {startX: 290, step: 60, width: 30, activeWidth: 64}).at(-1)?.x; // 890
 */
export function pillRow(count: number, options?: PillRowOptions): PillBox[] {
  const layout =
    options ??
    ({
      startX: DEFAULT_RIGHT - (count - 0.5) * DEFAULT_STEP,
      step: DEFAULT_STEP,
      width: DEFAULT_WIDTH,
      activeWidth: DEFAULT_ACTIVE_WIDTH,
    } satisfies PillRowOptions);

  return Array.from({length: count}, (_, index) => ({
    x: layout.startX + index * layout.step,
    width: layout.width,
    activeWidth: layout.activeWidth,
  }));
}
