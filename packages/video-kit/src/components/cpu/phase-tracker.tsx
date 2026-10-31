import {Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, easeOutCubic} from '@motion-canvas/core';
import type {Phase} from '../../cpu/cpu-types';
import {boxStyle, radius} from '../../theme/box-style';
import {colors} from '../../theme/colors';
import {fonts} from '../../theme/fonts';

/** Options for {@link phaseTracker}. */
export interface PhaseTrackerOptions {
  x: number;
  y: number;
}

/** Handles returned by {@link phaseTracker}. */
export interface PhaseTracker {
  node: Node;
  set(phase: Phase | null): ThreadGenerator;
  widthOf: number;
}

const PHASE_LABELS: {phase: Phase; label: string; color: 'violet' | 'orange' | 'red'}[] = [
  {phase: 'fetch', label: 'FETCH', color: 'violet'},
  {phase: 'decode', label: 'DECODE', color: 'orange'},
  {phase: 'execute', label: 'EXECUTE', color: 'red'},
];

/**
 * Three phase chips with arrows; the active phase is bright and scaled up.
 *
 * @example
 * const tracker = phaseTracker({x: -380, y: -360});
 * view.add(tracker.node);
 * yield* tracker.set('fetch');
 */
export function phaseTracker(options: PhaseTrackerOptions): PhaseTracker {
  const {x, y} = options;
  const chipW = 210;
  const gap = 50;
  const total = PHASE_LABELS.length * chipW + (PHASE_LABELS.length - 1) * gap;
  const startX = -(total - chipW) / 2;
  let active: Phase | null | undefined;

  const chips = PHASE_LABELS.map((item, i) => ({
    ...item,
    node: (
      <Rect
        x={startX + i * (chipW + gap)}
        width={chipW}
        height={52}
        radius={radius(10)}
        fill={colors[item.color]}
        {...boxStyle(colors.ink, 4, 2.5)}
      >
        <Txt
          text={item.label}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={22}
          letterSpacing={2}
          fill={colors.onAccent}
        />
      </Rect>
    ) as Rect,
  }));

  const arrows = PHASE_LABELS.slice(0, -1).map((_, i) => (
    <Txt
      x={startX + i * (chipW + gap) + chipW + gap / 2}
      text="→"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={30}
      fill={colors.mute}
    />
  ));

  const node = (
    <Node x={x} y={y}>
      {chips.map(chip => chip.node)}
      {arrows}
    </Node>
  ) as Node;

  chips.forEach(chip => {
    chip.node.opacity(0.55);
    chip.node.scale(1);
  });

  const set = function* (phase: Phase | null): ThreadGenerator {
    if (active === phase) return;
    active = phase;
    yield* all(
      ...chips.map(chip =>
        all(
          chip.node.opacity(phase === null || chip.phase !== phase ? 0.55 : 1, 0.2, easeOutCubic),
          chip.node.scale(phase === chip.phase ? 1.08 : 1, 0.2, easeOutCubic),
        ),
      ),
    );
  };

  return {node, set, widthOf: total};
}
