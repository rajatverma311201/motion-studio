import {Rect, Txt} from '@motion-canvas/2d';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {neubrutal} from '../theme/neubrutal';

/**
 * A rounded row card used for bullet points in the B+tree comparison scene.
 * Starts fully transparent so the scene can fade it in.
 *
 * @example
 * view.add(bulletRow(0, -180, 'Leaves are linked left to right', colors.cyan));
 */
export function bulletRow(x: number, y: number, text: string, colour: string, w = 820): Rect {
  return (
    <Rect x={x} y={y} width={w} height={62} radius={14} fill={colors.surf} {...neubrutal(colour, 6, 3.5)} opacity={0}>
      <Txt
        x={-w / 2 + 30}
        offsetX={-1}
        text={text}
        fontFamily={fonts.sans}
        fontWeight={700}
        fontSize={25}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;
}
