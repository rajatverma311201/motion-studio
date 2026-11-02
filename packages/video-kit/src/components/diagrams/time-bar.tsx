import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, easeInOutCubic} from '@motion-canvas/core';
import {borderWidth, colors, fonts, radius, withAlpha} from '../../theme';
import {label} from '../label';
import {timeToX} from './time-to-x';

/** One labelled tick on a time bar. */
export interface TimeMarker {
  t: number;
  label: string;
  color: string;
}

/** A coloured span between two timestamps. */
export interface TimeZone {
  from: number;
  to: number;
  color: string;
}

/** Options for {@link timeBar}. */
export interface TimeBarOptions {
  x: number;
  y: number;
  w: number;
  from: number;
  to: number;
  markers: TimeMarker[];
  zones?: TimeZone[];
}

/** Handles returned by {@link timeBar}. */
export interface TimeBar {
  node: Node;
  /** Move the NOW cursor to `t` over `duration` seconds. */
  moveNow(t: number, duration: number): ThreadGenerator;
  /** Repaint a highlight span under the axis. */
  setZone(from: number, to: number, color: string): ThreadGenerator;
}

/**
 * A time axis with coloured zones, labelled markers and a movable NOW cursor.
 * Pure geometry lives in `timeToX`, so the scene can plan positions in tests.
 *
 * @example
 * const bar = timeBar({
 *   x: 0, y: 0, w: 1200,
 *   from: 1767225600, to: 1767229200,
 *   markers: [{t: 1767225600, label: 'iat', color: colors.lime}],
 * });
 * view.add(bar.node);
 * yield* bar.moveNow(1767227400, 1.2);
 */
export function timeBar(options: TimeBarOptions): TimeBar {
  const {x, y, w, from, to, markers} = options;
  const zones = options.zones ?? [];
  const at = (t: number): number => -w / 2 + timeToX(t, from, to, w);

  const zoneNodes = zones.map(zone => {
    const left = at(zone.from);
    const right = at(zone.to);
    return (
      <Rect
        x={(left + right) / 2}
        y={0}
        width={Math.max(2, right - left)}
        height={30}
        radius={radius(8)}
        fill={withAlpha(zone.color, 0.22)}
      />
    ) as Rect;
  });

  const highlight = (<Rect y={0} width={0} height={38} radius={radius(8)} fill={colors.clear} opacity={0} />) as Rect;

  const markerNodes = markers.map(marker => {
    const markerX = at(marker.t);
    return (
      <Node>
        <Line
          x={markerX}
          points={[
            [0, -16],
            [0, 16],
          ]}
          stroke={marker.color}
          lineWidth={borderWidth(3)}
        />
        <Txt
          x={markerX}
          y={-36}
          text={marker.label}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={20}
          fill={marker.color}
        />
        <Txt x={markerX} y={40} text={String(marker.t)} fontFamily={fonts.mono} fontSize={15} fill={colors.mute} />
      </Node>
    ) as Node;
  });

  const cursor = (
    <Node x={at(from)}>
      <Line
        points={[
          [0, -58],
          [0, 62],
        ]}
        stroke={colors.ink}
        lineWidth={3}
      />
      <Rect y={-66} width={64} height={26} radius={radius(6)} fill={colors.yellow}>
        <Txt text="NOW" fontFamily={fonts.mono} fontWeight={700} fontSize={16} fill={colors.onAccent} />
      </Rect>
    </Node>
  ) as Node;

  const node = (
    <Node x={x} y={y}>
      {zoneNodes}
      {highlight}
      <Line
        points={[
          [-w / 2, 0],
          [w / 2, 0],
        ]}
        stroke={colors.dim}
        lineWidth={4}
      />
      {markerNodes}
      {cursor}
      {label('TIME', -w / 2, -92, {fs: 18, align: 'left'})}
    </Node>
  ) as Node;

  function* moveNow(t: number, duration: number): ThreadGenerator {
    yield* cursor.x(at(t), duration, easeInOutCubic);
  }

  function* setZone(zoneFrom: number, zoneTo: number, color: string): ThreadGenerator {
    const left = at(zoneFrom);
    const right = at(zoneTo);
    if (highlight.opacity() === 0) {
      highlight.x((left + right) / 2);
      highlight.width(Math.max(2, right - left));
      highlight.fill(withAlpha(color, 0.4));
      yield* highlight.opacity(1, 0.2);
      return;
    }
    yield* all(
      highlight.x((left + right) / 2, 0.3, easeInOutCubic),
      highlight.width(Math.max(2, right - left), 0.3, easeInOutCubic),
      highlight.fill(withAlpha(color, 0.4), 0.3),
    );
  }

  return {node, moveNow, setZone};
}
