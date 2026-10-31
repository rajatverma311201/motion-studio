import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {boxStyle, radius} from '../theme/box-style';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

/** Options for {@link timelineLane}. */
export interface TimelineLaneOptions {
  y: number;
  label: string;
  color: string;
  /** Left edge of the dashed lane line. Defaults to -730. */
  startX?: number;
  /** Right edge of the dashed lane line. Defaults to 880. */
  endX?: number;
  /** X centre of the lane label. Defaults to -800. */
  labelX?: number;
}

/**
 * Dashed timeline lane with a coloured label tile on the left.
 *
 * @example
 * view.add(timelineLane({y: -200, label: 'T1', color: colors.pink}));
 */
export function timelineLane(options: TimelineLaneOptions): Node {
  const {y, label, color, startX = -730, endX = 880, labelX = -800} = options;
  return (
    <Node>
      <Line
        points={[
          [startX, y],
          [endX, y],
        ]}
        stroke={colors.dim}
        lineWidth={4}
        lineDash={[10, 10]}
      />
      <Rect x={labelX} y={y} width={100} height={64} radius={radius(14)} fill={color} {...boxStyle(colors.ink, 5, 3.5)}>
        <Txt text={label} fontFamily={fonts.sans} fontWeight={700} fontSize={38} fill={colors.onAccent} />
      </Rect>
    </Node>
  ) as Node;
}
