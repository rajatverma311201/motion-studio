import {View2D} from '@motion-canvas/2d';
import {ThreadGenerator, waitFor} from '@motion-canvas/core';
import {ADD_PROGRAM, colors, leave, loadedState, say, stepInstruction} from '@motion-studio/video-kit';
import {buildMachine} from '../machine';

// ================================================================ 04 FETCH
export function* fetchSection(view: View2D): ThreadGenerator {
  const machine = buildMachine(view, {program: ADD_PROGRAM});
  machine.sync(loadedState(ADD_PROGRAM));

  const trace = stepInstruction(loadedState(ADD_PROGRAM));
  const steps = trace.steps.slice(0, 4);

  yield* say('Phase one: FETCH. Go and get the next instruction.');
  yield* machine.tracker.set('fetch');
  yield* waitFor(10);

  yield* say('Step 1: copy the PC into MAR. That address goes out on the address bus.');
  yield* machine.play(steps[0], 'slow');
  yield* waitFor(10);

  yield* say('Step 2: the control unit sends READ. Memory answers on the data bus.');
  yield* machine.play(steps[1], 'slow');
  yield* say('The byte lands in MDR. It is a copy; memory still holds it.');
  yield* waitFor(10);

  yield* say('Step 3: move it into IR. Now the CPU is holding the instruction.');
  yield* machine.play(steps[2], 'slow');
  yield* waitFor(10);

  yield* say('Step 4: add 1 to the PC, so it points at the next instruction.');
  yield* machine.play(steps[3], 'slow');
  yield* waitFor(10);

  yield* waitFor(5);
  yield* say('Fetch is done. IR holds 00011100, but what does it mean?');
  yield* machine.banner.set('FETCH', colors.violet, 'FETCH IS THE SAME FOR EVERY INSTRUCTION · 4 TICKS');
  yield* waitFor(18);
  yield* leave(machine.root);
}
