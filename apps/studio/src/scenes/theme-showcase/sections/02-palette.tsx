import {Node, type View2D} from '@motion-canvas/2d';
import type {ThreadGenerator} from '@motion-canvas/core';
import {createRef, sequence, waitFor} from '@motion-canvas/core';
import {card, colors, label, leave, pop, say, type AccentSlot} from '@motion-studio/video-kit';

const ACCENTS: AccentSlot[] = ['lime', 'pink', 'cyan', 'yellow', 'violet', 'orange', 'red'];
const SURFACES = ['bg', 'surf', 'surf2', 'code'] as const;

export function* paletteSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const swatches = ACCENTS.map((accent, i) => {
    const x = -780 + i * 260;
    const swatch = card(x, -240, 210, 120, colors.violet, colors[accent]);
    const name = label(accent.toUpperCase(), x, -155, {fs: 20});
    const hex = label(colors[accent].toUpperCase(), x, -122, {fs: 15});
    swatch.opacity(0);
    name.opacity(0);
    hex.opacity(0);
    return {swatch, name, hex};
  });
  const surfaces = SURFACES.map((name, i) => {
    const x = -600 + i * 400;
    const sample = card(x, 40, 340, 140, colors.violet, colors[name]);
    const tag = label(`${name.toUpperCase()}  ${colors[name].toUpperCase()}`, x, 40, {fs: 18, fill: colors.ink});
    sample.opacity(0);
    tag.opacity(0);
    return {sample, tag};
  });
  const ink = label('INK · THE QUICK BROWN FOX', -700, 230, {
    fs: 30,
    mono: false,
    fill: colors.ink,
    align: 'left',
  });
  const mute = label('MUTE · SECONDARY TEXT', 120, 230, {
    fs: 30,
    mono: false,
    fill: colors.mute,
    align: 'left',
  });
  ink.opacity(0);
  mute.opacity(0);

  view.add(
    <Node ref={root} opacity={0}>
      {swatches.map(({swatch}) => swatch)}
      {swatches.map(({name}) => name)}
      {swatches.map(({hex}) => hex)}
      {surfaces.map(({sample}) => sample)}
      {surfaces.map(({tag}) => tag)}
      {ink}
      {mute}
    </Node>,
  );

  yield* root().opacity(1, 0.25);
  yield* say('Seven semantic accent slots, then the four surfaces and the two text tones.');
  yield* sequence(
    0.08,
    ...swatches.flatMap(({swatch, name, hex}) => [pop(swatch, 0.22), name.opacity(1, 0.2), hex.opacity(1, 0.2)]),
  );
  yield* sequence(0.1, ...surfaces.flatMap(({sample, tag}) => [pop(sample, 0.22), tag.opacity(1, 0.2)]));
  yield* sequence(0.15, ink.opacity(1, 0.3), mute.opacity(1, 0.3));
  yield* waitFor(2.2);
  yield* leave(root());
}
