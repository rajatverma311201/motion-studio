import {Txt} from '@motion-canvas/2d';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

/** Optional styling for {@link label}. */
export interface LabelOptions {
  fs?: number;
  fill?: string;
  mono?: boolean;
  w?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Plain monospace label, optionally aligned left or right.
 *
 * @example
 * view.add(label('ROWS CHECKED', 515, -75, {fs: 18}));
 */
export function label(text: string, x: number, y: number, o: LabelOptions = {}): Txt {
  const align = o.align ?? 'center';
  return (
    <Txt
      x={x}
      y={y}
      offsetX={align === 'left' ? -1 : align === 'right' ? 1 : 0}
      text={text}
      fontFamily={o.mono === false ? fonts.sans : fonts.mono}
      fontWeight={700}
      fontSize={o.fs ?? 20}
      fill={o.fill ?? colors.mute}
    />
  ) as Txt;
}
