import {Node, Rect, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, waitFor} from '@motion-canvas/core';
import {ADD_PROGRAM, chip, colors, leave, loadedState, pop, runProgram, say, writeCell} from '@motion-studio/video-kit';
import {buildMachine} from '../machine';

// ================================================================ 07 FULL RUN
export function* fullRunSection(view: View2D): ThreadGenerator {
  const machine = buildMachine(view, {program: ADD_PROGRAM});
  const overlay = createRef<Node>();
  view.add(<Node ref={overlay} />);

  const {traces} = runProgram(loadedState(ADD_PROGRAM));

  yield* say('Now let us run the whole program from the start.');
  yield* waitFor(4);

  yield* say('Fetch, decode, execute. Fetch, decode, execute.');
  yield* machine.runAll(traces, index => (index === 0 ? 'normal' : 'fast'));
  yield* waitFor(7.4);

  yield* say('Watch the PC: 4, 5, 6, 7. One step at a time.');
  yield* machine.parts.pcMarker.scale(1.3, 0.2);
  yield* machine.parts.pcMarker.scale(1, 0.2);
  yield* waitFor(6);

  const accPath = chip('ACC  0 → 5 → 8', colors.violet, {fs: 22, x: -380, y: -10, sh: 5}) as Rect;
  accPath.opacity(0);
  overlay().add(accPath);
  yield* say('LOAD put 5 in ACC. ADD brought 3 and made 8.');
  yield* pop(accPath, 0.35);
  yield* waitFor(5.6);

  const check = chip('5 + 3 = 8 ✓', colors.lime, {fs: 22, x: 200, y: 220, sh: 5}) as Rect;
  check.opacity(0);
  overlay().add(check);
  yield* say('STORE wrote the 8 into box 14.');
  yield* writeCell(machine.mem, 14, 8, '8');
  yield* pop(check, 0.35);
  yield* waitFor(5.6);

  yield* say('HALT stops the clock. The program is finished.');
  yield* all(machine.parts.tick.scale(1.12, 0.2), machine.parts.banner.scale(1.02, 0.2));
  yield* all(machine.parts.tick.scale(1, 0.2), machine.parts.banner.scale(1, 0.2));
  yield* waitFor(6.2);

  yield* say('30 clock ticks to add two numbers. A real CPU makes billions per second.');
  yield* machine.parts.tick.scale(1.16, 0.2);
  yield* machine.parts.tick.scale(1, 0.2);
  yield* waitFor(7.2);

  yield* leave(overlay());
  yield* leave(machine.root);
}
