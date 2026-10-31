import {Node, type View2D} from '@motion-canvas/2d';
import type {ThreadGenerator} from '@motion-canvas/core';
import {all, createRef, delay, waitFor} from '@motion-canvas/core';
import {chip, colors, getTheme, leave, pop, say, titleBlock, titlePill} from '@motion-studio/video-kit';

export function* titleSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const theme = getTheme();
  const mode = theme.mode === 'dark' ? 'Dark' : 'Light';
  const title = titleBlock({text: 'THEME SHOWCASE', y: -230});
  const pillA = titlePill({text: '7 THEMES', fill: 'lime', fontSize: 64});
  const pillB = titlePill({text: '14 LOOKS', fill: 'cyan', fontSize: 64});
  const subtitle = chip(`${theme.name} / ${mode}`, colors.yellow, {fs: 30, mono: false, y: 190});
  pillA.position([-210, 20]);
  pillB.position([210, 20]);
  [pillA, pillB, subtitle].forEach(node => node.opacity(0));

  view.add(
    <Node ref={root} opacity={0}>
      {title}
      {pillA}
      {pillB}
      {subtitle}
    </Node>,
  );

  yield* root().opacity(1, 0.25);
  yield* say('One lesson, seven design languages, each with a dark and a light variant.');
  yield* all(pop(pillA, 0.3), delay(0.15, pop(pillB, 0.3)), delay(0.3, pop(subtitle, 0.3)));
  yield* waitFor(4.5);
  yield* leave(root());
}
