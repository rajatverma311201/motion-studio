import {Rect, Txt} from '@motion-canvas/2d';
import {ColorName, colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {neubrutal} from '../theme/neubrutal';

/** Options for the large intro title slab. */
export interface TitleSlabOptions {
  text: string;
  fontSize?: number;
  fill?: ColorName;
  shadow?: ColorName;
  y?: number;
}

/**
 * A solid coloured slab with dark text and a hard offset shadow. Use for the video title.
 *
 * @example
 * view.add(titleSlab({text: 'DB INDEXING', y: -210}));
 */
export function titleSlab(options: TitleSlabOptions): Rect {
  const {text, fontSize = 168, fill = 'lime', shadow = 'violet', y = 0} = options;
  return (
    <Rect
      layout
      alignItems="center"
      padding={[14, 64]}
      radius={30}
      fill={colors[fill]}
      y={y}
      {...neubrutal(colors[shadow], 18, 7)}
    >
      <Txt
        text={text}
        fontSize={fontSize}
        fontWeight={700}
        fontFamily={fonts.sans}
        fill={colors.dark}
        letterSpacing={-3}
      />
    </Rect>
  ) as Rect;
}

/** Options for the smaller intro title pill. */
export interface TitlePillOptions {
  text: string;
  fill?: ColorName;
  fontSize?: number;
}

/**
 * Smaller coloured pill with dark text for a secondary title line.
 *
 * @example
 * view.add(titlePill({text: 'B-TREE', fill: 'cyan'}));
 */
export function titlePill(options: TitlePillOptions): Rect {
  const {text, fill = 'lime', fontSize = 84} = options;
  return (
    <Rect
      layout
      alignItems="center"
      padding={[8, 36]}
      radius={22}
      fill={colors[fill]}
      {...neubrutal(colors.violet, 10, 5)}
    >
      <Txt
        text={text}
        fontSize={fontSize}
        fontWeight={700}
        fontFamily={fonts.sans}
        fill={colors.dark}
        letterSpacing={-1}
      />
    </Rect>
  ) as Rect;
}
