import {Circle, Line, Node, Rect} from '@motion-canvas/2d';
import {ThreadGenerator, easeInOutCubic} from '@motion-canvas/core';
import {borderWidth, colors, radius, tintedSurface} from '../../theme';

/** Options for {@link keyIcon}. */
export interface KeyIconOptions {
  x: number;
  y: number;
  /** Overall width in pixels; the icon scales all its parts from this. */
  size: number;
  color: string;
}

/** A hand-drawn key: ring, shaft and two teeth, built from shapes only. */
export interface LockIcon {
  node: Node;
  /** Lift and tilt the shackle. */
  unlock(): ThreadGenerator;
  /** Put the shackle back. */
  lock(): ThreadGenerator;
}

/** Options for {@link lockIcon}. */
export interface LockIconOptions {
  x: number;
  y: number;
  size: number;
  color: string;
  /** Start with the shackle lifted. */
  open?: boolean;
}

/**
 * A key icon made from a ring, a shaft and two teeth. Theme colours only.
 *
 * @example
 * view.add(keyIcon({x: -420, y: 40, size: 90, color: colors.yellow}));
 */
export function keyIcon(options: KeyIconOptions): Node {
  const {x, y, size, color} = options;
  const ring = size * 0.36;
  const shaftH = Math.max(3, size * 0.1);

  return (
    <Node x={x} y={y}>
      <Circle x={-size * 0.3} size={ring} stroke={color} lineWidth={borderWidth(size * 0.1)} fill={colors.clear} />
      <Rect x={size * 0.05} width={size * 0.62} height={shaftH} radius={radius(shaftH / 2)} fill={color} />
      <Rect x={size * 0.18} y={size * 0.12} width={size * 0.08} height={size * 0.2} radius={radius(2)} fill={color} />
      <Rect x={size * 0.36} y={size * 0.1} width={size * 0.08} height={size * 0.16} radius={radius(2)} fill={color} />
    </Node>
  ) as Node;
}

/**
 * A padlock made from shapes only, with animated `unlock()` and `lock()`.
 *
 * @example
 * const lock = lockIcon({x: 0, y: 0, size: 120, color: colors.red});
 * view.add(lock.node);
 * yield* lock.unlock();
 */
export function lockIcon(options: LockIconOptions): LockIcon {
  const {x, y, size, color, open = false} = options;
  const bodyW = size * 0.62;
  const bodyH = size * 0.46;
  const shackle = (
    <Line
      points={[
        [-bodyW * 0.28, -bodyH * 0.38],
        [-bodyW * 0.28, -bodyH * 0.72],
        [0, -bodyH * 0.9],
        [bodyW * 0.28, -bodyH * 0.72],
        [bodyW * 0.28, -bodyH * 0.38],
      ]}
      stroke={color}
      lineWidth={borderWidth(size * 0.09)}
      lineCap="round"
      lineJoin="round"
      y={open ? -size * 0.1 : 0}
      rotation={open ? 8 : 0}
    />
  ) as Line;

  const node = (
    <Node x={x} y={y}>
      {shackle}
      <Rect
        y={bodyH * 0.12}
        width={bodyW}
        height={bodyH}
        radius={radius(size * 0.08)}
        fill={tintedSurface(color)}
        stroke={color}
        lineWidth={borderWidth(size * 0.06)}
      />
      <Circle y={bodyH * 0.05} size={size * 0.1} fill={colors.bg} />
      <Rect y={bodyH * 0.24} width={size * 0.05} height={size * 0.12} radius={radius(2)} fill={colors.bg} />
    </Node>
  ) as Node;

  function* unlock(): ThreadGenerator {
    yield* shackle.position([0, -size * 0.1], 0.3, easeInOutCubic);
    yield* shackle.rotation(8, 0.3, easeInOutCubic);
  }

  function* lock(): ThreadGenerator {
    yield* shackle.rotation(0, 0.3, easeInOutCubic);
    yield* shackle.position([0, 0], 0.3, easeInOutCubic);
  }

  return {node, unlock, lock};
}
