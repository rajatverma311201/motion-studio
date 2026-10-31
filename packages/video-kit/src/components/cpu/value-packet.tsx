import {Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, Vector2, easeInOutCubic, tween} from '@motion-canvas/core';
import {boxStyle, radius} from '../../theme/box-style';
import {colors} from '../../theme/colors';
import {fonts} from '../../theme/fonts';

/**
 * A small value chip that can fly between two parts.
 *
 * @example
 * const packet = valuePacket('00000101', colors.pink);
 * view.add(packet);
 */
export function valuePacket(text: string, color: string): Rect {
  return (
    <Rect
      layout
      alignItems="center"
      padding={[4, 12]}
      radius={radius(8)}
      fill={color}
      {...boxStyle(colors.ink, 4, 2.5)}
    >
      <Txt
        text={text}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={20}
        letterSpacing={1}
        fill={colors.onAccent}
      />
    </Rect>
  ) as Rect;
}

/**
 * Fly a packet along a polyline with one eased tween over the whole path.
 * Duration is split by segment length, so speed stays constant.
 *
 * @example
 * yield* flyAlong(packet, [[0, 0], [200, 0], [200, 120]], 0.6);
 */
export function* flyAlong(
  packet: Rect,
  points: readonly (Vector2 | readonly [number, number])[],
  dur: number,
  fade = true,
): ThreadGenerator {
  const path: Vector2[] = points.map(point => {
    if (Array.isArray(point)) return new Vector2(point[0], point[1]);
    const vector = point as Vector2;
    return new Vector2(vector.x, vector.y);
  });
  if (path.length === 0) return;
  packet.position(path[0]);
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const length = path[i].sub(path[i - 1]).magnitude;
    lengths.push(length);
    total += length;
  }

  const at = (distance: number): Vector2 => {
    if (path.length === 1 || total === 0) return new Vector2(path[0].x, path[0].y);
    let remaining = Math.max(0, Math.min(distance, total));
    for (let i = 1; i < path.length; i++) {
      const segment = lengths[i - 1];
      if (remaining <= segment || i === path.length - 1) {
        const t = segment === 0 ? 1 : remaining / segment;
        return new Vector2(
          path[i - 1].x + (path[i].x - path[i - 1].x) * t,
          path[i - 1].y + (path[i].y - path[i - 1].y) * t,
        );
      }
      remaining -= segment;
    }
    const last = path[path.length - 1];
    return new Vector2(last.x, last.y);
  };

  if (dur <= 0) {
    packet.position(path[path.length - 1]);
  } else {
    yield* tween(dur, value => packet.position(at(easeInOutCubic(value) * total)));
  }

  if (fade) {
    yield* packet.opacity(0, 0.12);
    packet.remove();
  }
}
