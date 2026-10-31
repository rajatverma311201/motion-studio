/** RGBA channels, each 0 to 255 except alpha (0 to 1). */
export interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX_SHORT = /^#([0-9a-f]{3})$/i;
const HEX_LONG = /^#([0-9a-f]{6})$/i;
const RGBA = /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/i;

/**
 * Parse `#rgb`, `#rrggbb`, `rgb()` and `rgba()` strings.
 *
 * @example
 * parseColor('#C6FF3D'); // {r: 198, g: 255, b: 61, a: 1}
 */
export function parseColor(color: string): ParsedColor {
  const value = color.trim();

  const short = HEX_SHORT.exec(value);
  if (short) {
    const [r, g, b] = short[1].split('').map(channel => parseInt(channel + channel, 16));
    return {r, g, b, a: 1};
  }

  const long = HEX_LONG.exec(value);
  if (long) {
    const hex = long[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }

  const rgba = RGBA.exec(value);
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] === undefined ? 1 : Number(rgba[4]),
    };
  }

  throw new Error(`Unsupported colour: ${color}`);
}

/**
 * Replace the alpha channel of any supported colour.
 *
 * @example
 * withAlpha('#C6FF3D', 0.35); // 'rgba(198,255,61,0.35)'
 */
export function withAlpha(color: string, alpha: number): string {
  const {r, g, b} = parseColor(color);
  return `rgba(${r},${g},${b},${String(alpha)})`;
}

/**
 * Mix two colours channel by channel. `t = 0` returns `a`, `t = 1` returns `b`.
 *
 * @example
 * mix('#000000', '#FFFFFF', 0.5); // 'rgba(128,128,128,1)'
 */
export function mix(a: string, b: string, t: number): string {
  const from = parseColor(a);
  const to = parseColor(b);
  const channel = (x: number, y: number): number => Math.round(x + (y - x) * t);
  const alpha = Number((from.a + (to.a - from.a) * t).toFixed(3));
  return `rgba(${channel(from.r, to.r)},${channel(from.g, to.g)},${channel(from.b, to.b)},${alpha})`;
}

function luminance(color: ParsedColor): number {
  const linear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
}

/**
 * WCAG contrast ratio between two colours. Black on white is 21, identical colours are 1.
 *
 * @example
 * contrastRatio('#000000', '#FFFFFF'); // 21
 */
export function contrastRatio(a: string, b: string): number {
  const first = luminance(parseColor(a));
  const second = luminance(parseColor(b));
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
