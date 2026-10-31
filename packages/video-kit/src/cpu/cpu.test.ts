import {describe, expect, it} from 'vitest';
import {emptyState, loadedState, memoryImage, runProgram, stateAfterStep, stepInstruction, totalTicks} from './cpu';
import type {CpuState, ToyProgram} from './cpu-types';
import {ADD_PROGRAM, COUNTDOWN_PROGRAM} from './programs';

describe('memory image', () => {
  it('places code at the base and data in its cells', () => {
    expect(memoryImage(ADD_PROGRAM)).toEqual([0, 0, 0, 0, 0x1c, 0x2d, 0x4e, 0x00, 0, 0, 0, 0, 5, 3, 0, 0]);
    expect(memoryImage(COUNTDOWN_PROGRAM)[13]).toBe(3);
    expect(loadedState(ADD_PROGRAM).pc).toBe(4);
  });
});

describe('one instruction', () => {
  it('walks LOAD 12 through the exact micro-steps', () => {
    const trace = stepInstruction(loadedState(ADD_PROGRAM));
    expect(trace.steps.map(step => step.id)).toEqual(['F1', 'F2', 'F3', 'F4', 'D1', 'E1', 'E2', 'E3']);
    expect(trace.steps.map(step => step.text)).toEqual([
      'MAR ← PC',
      'MDR ← M[MAR]',
      'IR ← MDR',
      'PC ← PC + 1',
      'DECODE IR',
      'MAR ← IR.addr',
      'MDR ← M[MAR]',
      'ACC ← MDR',
    ]);
    expect(trace.steps.map(step => step.kind)).toEqual([
      'copy',
      'read',
      'copy',
      'increment',
      'decode',
      'copy',
      'read',
      'copy',
    ]);
    expect(trace.steps[0].after.mar).toBe(4);
    expect(trace.after).toMatchObject({acc: 5, pc: 5, ir: 0x1c, mar: 12, mdr: 5, z: false});
    expect(stateAfterStep(trace, 'D1')).toMatchObject({acc: 0, pc: 5});
  });
});

describe('running programs', () => {
  it('runs the ADD program to completion', () => {
    const {traces, final, completed} = runProgram(loadedState(ADD_PROGRAM));
    expect(traces).toHaveLength(4);
    expect(totalTicks(traces)).toBe(30);
    expect(final.mem[14]).toBe(8);
    expect(final).toMatchObject({acc: 8, pc: 8, z: false, halted: true});
    expect(completed).toBe(true);
  });

  it('runs the countdown loop, taken and not taken JZ included', () => {
    const {traces, final} = runProgram(loadedState(COUNTDOWN_PROGRAM));
    expect(traces).toHaveLength(18);
    expect(totalTicks(traces)).toBe(129);
    expect(final.mem[13]).toBe(0);
    expect(final).toMatchObject({acc: 0, z: true, pc: 10});

    const firstJz = traces[1];
    expect(firstJz.steps).toHaveLength(6);
    const firstLast = firstJz.steps[firstJz.steps.length - 1];
    expect(firstLast.kind).toBe('check-flag');
    if (firstLast.kind === 'check-flag') expect(firstLast.taken).toBe(false);

    const finalJz = traces[16];
    expect(finalJz.steps).toHaveLength(7);
    const finalCheck = finalJz.steps.find(step => step.kind === 'check-flag');
    if (finalCheck?.kind === 'check-flag') {
      expect(finalCheck.taken).toBe(true);
      expect(finalCheck.target).toBe(9);
    } else {
      throw new Error('expected the final JZ to contain a check-flag step');
    }
  });

  it('wraps at eight bits', () => {
    const wrap: ToyProgram = {
      name: 'wrap',
      base: 4,
      entry: 4,
      code: ['LOAD 12', 'SUB 13', 'HALT'],
      data: {12: 3, 13: 5},
    };
    expect(runProgram(loadedState(wrap)).final.acc).toBe(254);

    const carry: ToyProgram = {
      name: 'carry',
      base: 4,
      entry: 4,
      code: ['LOAD 12', 'ADD 13', 'HALT'],
      data: {12: 255, 13: 1},
    };
    expect(runProgram(loadedState(carry)).final).toMatchObject({acc: 0, z: true});
  });
});

describe('purity and guards', () => {
  it('never mutates a frozen input state', () => {
    const state = loadedState(ADD_PROGRAM);
    const frozen = {...state, mem: Object.freeze([...state.mem])};
    Object.freeze(frozen);
    const trace = stepInstruction(frozen);
    expect(frozen.mem[4]).toBe(0x1c);
    expect(frozen.mem).toEqual(state.mem);
    expect(trace.after.mem).not.toBe(frozen.mem);
    expect(trace.after.mem).toEqual(state.mem);
  });

  it('stops an infinite loop at the instruction limit', () => {
    const loop: ToyProgram = {name: 'loop', base: 4, entry: 4, code: ['JUMP 4'], data: {}};
    const result = runProgram(loadedState(loop), 10);
    expect(result.traces).toHaveLength(10);
    expect(result.completed).toBe(false);
  });

  it('refuses to step a halted CPU', () => {
    const halted: CpuState = {...emptyState(), halted: true};
    expect(() => stepInstruction(halted)).toThrow(/halted/i);
  });

  it('reports an illegal opcode and halts', () => {
    const state = loadedState(ADD_PROGRAM);
    const mem = [...state.mem];
    mem[4] = 0xf3;
    const withIllegal = {...state, mem};
    const trace = stepInstruction(withIllegal);
    expect(trace.illegal).toBe(true);
    expect(trace.text).toBe('???');
    expect(trace.steps).toHaveLength(5);
    const last = trace.steps[trace.steps.length - 1];
    expect(last.kind).toBe('decode');
    if (last.kind === 'decode') expect(last.mnemonic).toBeNull();
    expect(trace.after.halted).toBe(true);

    const result = runProgram(withIllegal);
    expect(result.traces).toHaveLength(1);
    expect(result.completed).toBe(true);
  });
});
