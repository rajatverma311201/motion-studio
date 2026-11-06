import {Rect, Txt} from '@motion-canvas/2d';
import {boxStyle, colors, fonts, radius} from '../theme';

/** Options for {@link verdictRow}. */
export interface VerdictRowOptions {
  x: number;
  y: number;
  w: number;
  label: string;
  value: string;
  /** Accent for the label tile and the hard shadow. */
  color: string;
}

/** Fixed row height, useful to the lesson layout. */
export const VERDICT_ROW_HEIGHT = 132;

/**
 * A wide verdict row: a coloured label tile on the left and the value on the
 * right. A generalisation of the ACID recap rows for closing statements.
 *
 * @example
 * view.add(verdictRow({x: 0, y: -450, w: 920, label: 'ENCODING', value: 'FORMAT', color: colors.cyan}));
 */
export function verdictRow(options: VerdictRowOptions): Rect {
  const {x, y, w, label, value, color} = options;
  const tileW = Math.round(w * 0.52);

  return (
    <Rect
      x={x}
      y={y}
      width={w}
      height={VERDICT_ROW_HEIGHT}
      radius={radius(22)}
      fill={colors.surf}
      {...boxStyle(color, 8, 4)}
    >
      <Rect x={-w / 2 + tileW / 2} width={tileW} height={VERDICT_ROW_HEIGHT - 20} radius={radius(14)} fill={color}>
        <Txt
          text={label}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={44}
          letterSpacing={3}
          fill={colors.onAccent}
        />
      </Rect>
      <Txt
        x={-w / 2 + tileW + (w - tileW) / 2}
        text={value}
        fontFamily={fonts.sans}
        fontWeight={700}
        fontSize={44}
        letterSpacing={2}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;
}
