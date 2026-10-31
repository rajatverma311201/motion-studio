import {Rect} from '@motion-canvas/2d';
import {colors} from '../theme/colors';
import {neubrutal} from '../theme/neubrutal';

/**
 * Dark card with a coloured hard shadow.
 *
 * @example
 * view.add(card(310, -190, 380, 140, colors.pink));
 */
export function card(x: number, y: number, w: number, h: number, shadow: string, fill: string = colors.surf): Rect {
  return (<Rect x={x} y={y} width={w} height={h} radius={20} fill={fill} {...neubrutal(shadow, 8, 4)} />) as Rect;
}
