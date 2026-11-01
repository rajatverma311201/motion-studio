import {memoryRowY} from '@motion-studio/video-kit';

/** Absolute scene geometry for the instruction-cycle machine. */
export const CPU_PANEL = {x: -380, y: -5, w: 1040, h: 790};
/** Memory sits on the right for the whole lesson. */
export const MEMORY_PANEL = {x: 610, y: -5, w: 560, rows: 16};
/** Register centres. */
export const REG_POS = {
  PC: {x: -380, y: -255},
  IR: {x: -380, y: -95},
  ACC: {x: -380, y: 75},
  MAR: {x: -20, y: -255},
  MDR: {x: -20, y: -95},
} as const;
export const REG_W = 260;
export const REG_H = 120;
export const Z_POS = {x: -380, y: 210, w: 260, h: 70};
export const ALU_POS = {x: -20, y: 75, w: 260, h: 150};
export const CU_POS = {x: -740, y: -85, w: 260, h: 460};
export const BANNER = {x: -380, y: 295, w: 960, h: 70};
export const TRACKER = {x: -380, y: -360};
export const TICK_POS = {x: 78, y: -360, w: 112, h: 34};
export const RAILS = {addressX: 250, dataX: 190, addressTop: -255, dataTop: -95, bottom: 360};

/** The scene y of memory row `i`. */
export function rowY(i: number): number {
  return memoryRowY(MEMORY_PANEL.y, MEMORY_PANEL.rows, i);
}

/** Fixed anchors where a value leaves a register. */
export const OUT_ANCHOR: Record<'PC' | 'MAR' | 'MDR' | 'IR' | 'ACC' | 'IR.operand', readonly [number, number]> = {
  PC: [-250, -255],
  MAR: [110, -255],
  MDR: [-150, -95],
  IR: [-250, -95],
  ACC: [-250, 75],
  'IR.operand': [-260, -60],
};

/** Fixed anchors where a value enters a register. */
export const IN_ANCHOR: Record<'PC' | 'MAR' | 'MDR' | 'IR' | 'ACC', readonly [number, number]> = {
  PC: [-250, -255],
  MAR: [-150, -255],
  MDR: [-150, -95],
  IR: [-250, -95],
  ACC: [-250, 75],
};

/** ALU input and output anchors, plus the Z flag's output. */
export const ALU_IN_LEFT = [-150, 75] as const;
export const ALU_IN_TOP = [-20, 0] as const;
export const ALU_OUT = [-150, 75] as const;
export const Z_OUT = [-250, 210] as const;
