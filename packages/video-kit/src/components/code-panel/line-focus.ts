import {Rect} from '@motion-canvas/2d';
import {ThreadGenerator, easeInOutCubic, sequence} from '@motion-canvas/core';
import type {CodePanel} from './code-panel';

/**
 * Fade in the highlight bar on one line, optionally recolouring its side bar.
 *
 * @example
 * yield* focusLine(panel, 2, colors.lime);
 */
export function* focusLine(panel: CodePanel, index: number, color?: string): ThreadGenerator {
  const bar = panel.hl.children()[0] as Rect;
  if (color) yield* bar.fill(color, 0.12);
  if (panel.hl.opacity() < 0.5) {
    panel.hl.y(panel.lineY(index));
    yield* panel.hl.opacity(1, 0.15);
  } else {
    yield* panel.hl.y(panel.lineY(index), 0.25, easeInOutCubic);
  }
}

/**
 * Reveal lines one after another in a staggered sequence.
 *
 * @example
 * yield* revealLines(panel); // all lines
 * yield* revealLines(panel, 2, 4); // only lines 2 to 4
 */
export const revealLines = (panel: CodePanel, from = 0, to = panel.lines.length - 1): ThreadGenerator =>
  sequence(0.12, ...panel.lines.slice(from, to + 1).map(l => l.opacity(1, 0.25)));
