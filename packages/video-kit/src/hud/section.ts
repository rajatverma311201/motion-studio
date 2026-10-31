import {ThreadGenerator, all, easeOutCubic} from '@motion-canvas/core';
import {colors} from '../theme/colors';
import {withAlpha} from '../themes/color-utils';
import {hudState} from './hud';

/**
 * Highlight section number `i` in the HUD: chip colour, pills and widths.
 *
 * @example
 * yield* setSection(3);
 */
export function* setSection(i: number): ThreadGenerator {
  const s = hudState.defs[i];
  hudState.secTxt().text(`${String(i).padStart(2, '0')} · ${s.name}`);
  yield* all(
    hudState.secChip().fill(s.color, 0.25),
    ...hudState.pills.map((p, j) =>
      all(
        p.fill(j < i ? withAlpha(colors.ink, 0.55) : j === i ? s.color : colors.dim, 0.3),
        p.width(j === i ? hudState.pillActiveWidth : hudState.pillWidth, 0.3, easeOutCubic),
      ),
    ),
  );
}
