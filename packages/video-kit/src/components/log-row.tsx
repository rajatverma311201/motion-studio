import {Rect, Txt} from '@motion-canvas/2d';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

/** Options for {@link logRow}. */
export interface LogRowOptions {
  text: string;
  x: number;
  y: number;
  width: number;
  color: string;
}

/**
 * Fixed-height mono row with a coloured outline, used for WAL and data-file entries.
 *
 * @example
 * view.add(logRow({text: 'tx4821  COMMIT', x: 0, y: 24, width: 470, color: colors.lime}));
 */
export function logRow(options: LogRowOptions): Rect {
  const {text, x, y, width, color} = options;
  return (
    <Rect x={x} y={y} width={width} height={44} radius={10} fill={colors.surf2} stroke={color} lineWidth={3}>
      <Txt text={text} fontFamily={fonts.mono} fontWeight={700} fontSize={19} fill={colors.ink} />
    </Rect>
  ) as Rect;
}
