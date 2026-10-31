import {Rect, Txt} from '@motion-canvas/2d';
import {boxStyle, radius} from '../theme/box-style';
import {createRef} from '@motion-canvas/core';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

export interface StatCard {
  node: Rect;
  val: Txt;
}

/**
 * A big-number stat card with a mono title and a neubrutalist shadow.
 *
 * @example
 * const card = statCard(-400, -250, 340, 150, 'ROWS SCANNED', colors.red);
 * yield* countTo(card.val, 0, 1_000_000);
 */
export function statCard(
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  color: string,
  start = '0',
): StatCard {
  const val = createRef<Txt>();
  const node = (
    <Rect x={x} y={y} width={w} height={h} radius={radius(20)} fill={colors.surf} {...boxStyle(color, 8, 4)}>
      <Txt
        y={-h / 2 + 30}
        text={title}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={19}
        letterSpacing={3}
        fill={colors.mute}
      />
      <Txt ref={val} y={14} text={start} fontFamily={fonts.mono} fontWeight={700} fontSize={54} fill={colors.ink} />
    </Rect>
  ) as Rect;
  return {node, val: val()};
}
