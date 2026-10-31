import {Circle, Node, Txt} from '@motion-canvas/2d';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {chip} from './chip';

/**
 * Colour legend for the tree scenes: internal node, leaf node, row pointer.
 *
 * @example
 * view.add(indexLegend(0, 380, false));
 */
export function indexLegend(x: number, y: number, plus: boolean): Node {
  return (
    <Node x={x} y={y}>
      {chip('INTERNAL NODE', colors.violet, {x: -330, fs: 17, sh: 4})}
      {chip('LEAF NODE', colors.lime, {x: -120, fs: 17, sh: 4})}
      <Circle x={40} size={14} fill={colors.orange} />
      <Txt
        x={62}
        offsetX={-1}
        text={plus ? '= row pointer (leaves only)' : '= row pointer (every key)'}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={17}
        fill={colors.mute}
      />
    </Node>
  ) as Node;
}
