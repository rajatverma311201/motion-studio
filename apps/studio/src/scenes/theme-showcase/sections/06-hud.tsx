import {Node, type View2D} from '@motion-canvas/2d';
import type {ThreadGenerator} from '@motion-canvas/core';
import {all, createRef, waitFor} from '@motion-canvas/core';
import {chip, colors, hudState, label, leave, say} from '@motion-studio/video-kit';

export function* hudSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const heading = label('CAPTION BAR · PILLS · SECTION CHIP', 0, -110, {
    fs: 38,
    mono: false,
    fill: colors.ink,
  });
  const note = chip('THE HUD READS THE SAME THEME', colors.cyan, {fs: 26, mono: false, y: 10});

  view.add(
    <Node ref={root} opacity={0}>
      {heading}
      {note}
    </Node>,
  );

  yield* root().opacity(1, 0.25);
  yield* say('The caption bar narrates every video.', 1.4);
  yield* say('Its bar, label and type follow the active theme.', 1.4);
  yield* all(
    ...hudState.pills.map((pill, i) =>
      all(pill.fill(hudState.defs[i].color, 0.2), pill.width(hudState.pillActiveWidth, 0.2)),
    ),
  );
  yield* say('The pills mark progress through the chapters.', 1.6);
  yield* waitFor(1.6);
  yield* leave(root());
}
