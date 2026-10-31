import {Node, type View2D} from '@motion-canvas/2d';
import type {ThreadGenerator} from '@motion-canvas/core';
import {createRef, sequence, waitFor} from '@motion-canvas/core';
import {
  bulletRow,
  card,
  chip,
  colors,
  countTo,
  indexLegend,
  label,
  leave,
  pop,
  say,
  statCard,
  type AccentSlot,
} from '@motion-studio/video-kit';

const ACCENTS: AccentSlot[] = ['lime', 'pink', 'cyan', 'yellow', 'violet', 'orange', 'red'];

export function* componentsSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const chips = ACCENTS.map((accent, i) => {
    const node = chip(accent.toUpperCase(), colors[accent], {x: -720 + i * 240, y: -330, fs: 22});
    node.opacity(0);
    return node;
  });
  const sampleCard = card(-430, -120, 520, 180, colors.pink);
  const sampleLabel = label('CARD', -430, -120, {fs: 42, mono: false, fill: colors.ink});
  const stat = statCard(430, -120, 520, 180, 'ROWS SCANNED', colors.lime);
  const bullets = [
    bulletRow(-430, 70, 'Hard offset shadows', colors.pink, 900),
    bulletRow(-430, 140, 'Hairline borders when the theme asks', colors.cyan, 900),
    bulletRow(-430, 210, 'Tonal surfaces and calm type', colors.yellow, 900),
  ];
  const legend = indexLegend(-60, 330, false);
  sampleCard.opacity(0);
  sampleLabel.opacity(0);
  stat.node.opacity(0);
  legend.opacity(0);

  view.add(
    <Node ref={root} opacity={0}>
      {chips}
      {sampleCard}
      {sampleLabel}
      {stat.node}
      {bullets}
      {legend}
    </Node>,
  );

  yield* root().opacity(1, 0.25);
  yield* say('Every component reads the same tokens: chips in all seven accents, cards, stats and rows.');
  yield* sequence(0.08, ...chips.map(node => pop(node, 0.2)));
  yield* pop(sampleCard, 0.25);
  yield* sampleLabel.opacity(1, 0.15);
  yield* pop(stat.node, 0.25);
  yield* countTo(stat.val, 0, 1280, 1.1);
  yield* sequence(0.12, ...bullets.map(row => row.opacity(1, 0.25)));
  yield* pop(legend, 0.25);
  yield* waitFor(2.2);
  yield* leave(root());
}
