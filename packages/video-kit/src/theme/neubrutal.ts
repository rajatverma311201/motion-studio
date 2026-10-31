import {colors} from './colors';

/** Props for a light border with a hard, blur-free coloured offset shadow. */
export interface NeubrutalProps {
  stroke: string;
  lineWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: [number, number];
}

/**
 * Light border plus a hard coloured offset shadow.
 *
 * @example
 * <Rect {...neubrutal(colors.pink, 8, 4)} />
 */
export function neubrutal(shadow: string, sh = 8, bw = 4): NeubrutalProps {
  return {
    stroke: colors.ink,
    lineWidth: bw,
    shadowColor: shadow,
    shadowBlur: 0,
    shadowOffset: [sh, sh],
  };
}

/**
 * Round a number and format it with English thousands separators.
 *
 * @example
 * formatNumber(1234567); // '1,234,567'
 */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
