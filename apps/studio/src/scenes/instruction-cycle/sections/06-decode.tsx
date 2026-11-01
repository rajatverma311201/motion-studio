import {View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, waitFor} from '@motion-canvas/core';
import {
  ADD_PROGRAM,
  colors,
  encode,
  lampOn,
  leave,
  loadedState,
  say,
  stateAfterStep,
  stepInstruction,
  type CpuState,
  type InstructionTrace,
} from '@motion-studio/video-kit';
import {buildMachine} from '../machine';

/** A state that has just fetched `byte` from cell 4. */
function fetchedState(byte: number): {state: CpuState; trace: InstructionTrace} {
  const base = loadedState(ADD_PROGRAM);
  const mem = [...base.mem];
  mem[4] = byte;
  const trace = stepInstruction({...base, mem});
  return {state: stateAfterStep(trace, 'F4'), trace};
}

// ================================================================ 05 DECODE
export function* decodeSection(view: View2D): ThreadGenerator {
  const machine = buildMachine(view, {program: ADD_PROGRAM});
  const load = fetchedState(0x1c);
  machine.sync(load.state);

  yield* say('Phase two: DECODE. Work out what the instruction means.');
  yield* machine.tracker.set('decode');
  yield* machine.play(load.trace.steps[4], 'slow');
  yield* waitFor(4.4);

  yield* say('The top four bits are the opcode. They say what to do.');
  yield* all(machine.parts.opcodeBracket.lineWidth(9, 0.2), machine.parts.opcodeLabel.scale(1.2, 0.2));
  yield* all(machine.parts.opcodeBracket.lineWidth(5, 0.2), machine.parts.opcodeLabel.scale(1, 0.2));
  yield* waitFor(4.8);

  yield* say('The bottom four bits are the operand. Here, an address: 12.');
  yield* all(machine.parts.operandBracket.lineWidth(9, 0.2), machine.parts.operandLabel.scale(1.2, 0.2));
  yield* all(machine.parts.operandBracket.lineWidth(5, 0.2), machine.parts.operandLabel.scale(1, 0.2));
  yield* waitFor(5.2);

  yield* say('The control unit looks up the opcode. 0001 means LOAD.');
  yield* machine.banner.set('DECODE', colors.orange, 'D1 · 0001 → LOAD');
  yield* all(machine.parts.control.scale(1.02, 0.2), machine.parts.decodeHint.scale(1.1, 0.2));
  yield* all(machine.parts.control.scale(1, 0.2), machine.parts.decodeHint.scale(1, 0.2));
  yield* waitFor(5.2);

  yield* say('That switches on the signals the next phase needs.');
  yield* all(machine.parts.signals.READ.set(true), lampOn(machine.mem.header.read, true));
  yield* waitFor(5);
  machine.parts.signals.READ.setNow(false);
  yield* lampOn(machine.mem.header.read, false);

  // ---- the montage --------------------------------------------------------
  yield* say('A different opcode lights a different line. 0010 is ADD.');
  const add = fetchedState(encode('ADD', 13));
  machine.sync(add.state, {keepTicks: true});
  yield* machine.play(add.trace.steps[4], 'normal');
  yield* waitFor(4.2);

  yield* say('0100 is STORE. 0000 is HALT.');
  const store = fetchedState(encode('STORE', 14));
  machine.sync(store.state, {keepTicks: true});
  yield* machine.play(store.trace.steps[4], 'normal');
  yield* waitFor(2.2);
  const halt = fetchedState(0x00);
  machine.sync(halt.state, {keepTicks: true});
  yield* machine.play(halt.trace.steps[4], 'normal');
  yield* waitFor(2.6);

  yield* say('An opcode nobody defined? The CPU stops with an error.');
  const illegal = fetchedState(0xf3);
  machine.sync(illegal.state, {keepTicks: true});
  yield* machine.play(illegal.trace.steps[4], 'normal');
  yield* waitFor(5.4);

  // ---- back to LOAD 12, ready for execute ---------------------------------
  machine.sync(load.state, {keepTicks: true});
  yield* machine.play(load.trace.steps[4], 'fast');
  yield* machine.banner.set('DECODE', colors.orange, 'D1 · 0001 → LOAD 12');
  yield* waitFor(3);
  yield* leave(machine.root);
}
