import {Rect, Txt} from '@motion-canvas/2d';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {neubrutal} from '../theme/neubrutal';

/** Options for {@link titledPanel}. */
export interface TitledPanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  color: string;
}

/**
 * Neubrutalist panel with a mono title in its top bar.
 *
 * @example
 * view.add(titledPanel({x: 200, y: -170, width: 520, height: 220, title: 'WAL', color: colors.lime}));
 */
export function titledPanel(options: TitledPanelOptions): Rect {
  const {x, y, width, height, title, color} = options;
  return (
    <Rect x={x} y={y} width={width} height={height} radius={22} fill={colors.surf} {...neubrutal(color, 8, 4)}>
      <Txt
        y={-height / 2 + 30}
        text={title}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={19}
        letterSpacing={2}
        fill={color}
      />
    </Rect>
  ) as Rect;
}
