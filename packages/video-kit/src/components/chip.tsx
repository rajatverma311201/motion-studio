import {Rect, Txt} from '@motion-canvas/2d';
import {boxStyle, radius} from '../theme/box-style';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

/** Optional styling for {@link chip}. */
export interface ChipOptions {
  fs?: number;
  mono?: boolean;
  rot?: number;
  x?: number;
  y?: number;
  sh?: number;
  color?: string;
  shadow?: string;
}

/**
 * Small neubrutalist chip with centred text.
 *
 * @example
 * view.add(chip('HOW DATABASES FIND ROWS FAST', colors.yellow, {fs: 36, mono: false}));
 */
export function chip(text: string, fill: string, o: ChipOptions = {}): Rect {
  return (
    <Rect
      layout
      alignItems="center"
      padding={[6, 16]}
      radius={radius(10)}
      fill={fill}
      rotation={o.rot ?? 0}
      x={o.x ?? 0}
      y={o.y ?? 0}
      {...boxStyle(o.shadow ?? colors.ink, o.sh ?? 5, 3.5)}
    >
      <Txt
        text={text}
        fill={o.color ?? colors.onAccent}
        fontSize={o.fs ?? 22}
        fontWeight={700}
        fontFamily={o.mono === false ? fonts.sans : fonts.mono}
        letterSpacing={1}
      />
    </Rect>
  ) as Rect;
}

/**
 * Return the text node inside a chip so its text can be changed later.
 *
 * @example
 * chipText(myChip).text('DONE');
 */
export const chipText = (c: Rect): Txt => c.children()[0] as Txt;
