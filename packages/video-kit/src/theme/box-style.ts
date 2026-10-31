import type {ShapeProps} from '@motion-canvas/2d';
import {getTheme} from '../themes/active-theme';
import {withAlpha} from '../themes/color-utils';
import {SOFT_SHADOW_DARK, SOFT_SHADOW_LIGHT} from '../themes/shadows';

/**
 * Border + elevation for a box, according to the active theme. accent = shadow/glow colour.
 *
 * @example
 * <Rect {...boxStyle(colors.pink, 8, 4)} />
 */
export function boxStyle(accent: string, offset = 8, borderWidth = 4): ShapeProps {
  const theme = getTheme();
  const {shape, mode} = theme;
  const scale = shape.elevationScale;
  const width = shape.borderWidthScale === 0 ? 0 : Math.max(1.5, borderWidth * shape.borderWidthScale);
  const props: ShapeProps = {lineWidth: width};
  if (width > 0) props.stroke = theme.colors.border;

  switch (shape.elevation) {
    case 'hard':
      props.shadowColor = accent;
      props.shadowBlur = 0;
      props.shadowOffset = [offset * scale, offset * scale];
      break;
    case 'soft':
      props.shadowColor = mode === 'dark' ? withAlpha(SOFT_SHADOW_DARK, 0.28) : withAlpha(SOFT_SHADOW_LIGHT, 0.16);
      props.shadowBlur = offset * 3 * scale;
      props.shadowOffset = [0, offset * 0.8 * scale];
      break;
    case 'glow':
      props.shadowColor = accent;
      props.shadowBlur = offset * 2.5 * scale;
      props.shadowOffset = [0, 0];
      break;
    case 'none':
      break;
  }

  return props;
}

/**
 * Scales a radius by the active theme; pills (>= 100) pass through.
 *
 * @example
 * <Rect radius={radius(20)} />
 */
export function radius(n: number): number;
/**
 * Scales each corner of a 4-tuple by the active theme; pills (>= 100) pass through.
 *
 * @example
 * <Rect radius={radius([20, 20, 0, 0])} />
 */
export function radius(n: [number, number, number, number]): [number, number, number, number];
export function radius(n: number[]): number[];
export function radius(n: number | number[]): number | number[] {
  const scale = getTheme().shape.radiusScale;
  const scaleOne = (value: number): number => (value >= 100 ? value : value * scale);
  return Array.isArray(n) ? n.map(scaleOne) : scaleOne(n);
}
