import type {CpuState, InstructionTrace, MicroStep, ToyProgram} from './cpu-types';
import {assemble, decodeByte, disassemble} from './isa';

const CELLS = 16;

/** Copy a state so the caller can never mutate one we hand back. */
function snapshot(state: CpuState): CpuState {
  return {
    pc: state.pc,
    mar: state.mar,
    mdr: state.mdr,
    ir: state.ir,
    acc: state.acc,
    z: state.z,
    halted: state.halted,
    mem: [...state.mem],
  };
}

/** Build the next state from a previous one, always with a fresh memory array. */
function nextState(previous: CpuState, patch: Partial<CpuState>): CpuState {
  return {
    pc: patch.pc ?? previous.pc,
    mar: patch.mar ?? previous.mar,
    mdr: patch.mdr ?? previous.mdr,
    ir: patch.ir ?? previous.ir,
    acc: patch.acc ?? previous.acc,
    z: patch.z ?? previous.z,
    halted: patch.halted ?? previous.halted,
    mem: patch.mem ? [...patch.mem] : [...previous.mem],
  };
}

/**
 * A CPU that has just been switched on: every register zero, every cell zero.
 *
 * @example
 * emptyState().mem.length; // 16
 */
export function emptyState(): CpuState {
  return {
    pc: 0,
    mar: 0,
    mdr: 0,
    ir: 0,
    acc: 0,
    z: false,
    halted: false,
    mem: Array.from({length: CELLS}, () => 0),
  };
}

/**
 * The 16-byte memory picture after the loader has placed a program.
 *
 * @example
 * memoryImage(ADD_PROGRAM)[4]; // 0x1c
 */
export function memoryImage(program: ToyProgram): number[] {
  const mem = Array.from({length: CELLS}, () => 0);
  const code = assemble(program.code);
  code.forEach((byte, index) => {
    const address = program.base + index;
    if (address >= CELLS) throw new Error(`Program "${program.name}" overflows memory at cell ${address}`);
    mem[address] = byte & 0xff;
  });
  for (const [key, value] of Object.entries(program.data)) {
    const address = Number(key);
    if (!Number.isInteger(address) || address < 0 || address >= CELLS) {
      throw new Error(`Program "${program.name}" has data at invalid cell ${key}`);
    }
    mem[address] = value & 0xff;
  }
  return mem;
}

/**
 * The state right after loading: memory holds the program, all registers are zero, PC points at the entry.
 *
 * @example
 * loadedState(ADD_PROGRAM).pc; // 4
 */
export function loadedState(program: ToyProgram): CpuState {
  return {...emptyState(), pc: program.entry & 0x0f, mem: memoryImage(program)};
}

/**
 * Execute exactly one instruction as the fixed micro-step sequence. Pure: the input is never mutated.
 *
 * @example
 * const trace = stepInstruction(loadedState(ADD_PROGRAM));
 * trace.steps.map(step => step.id); // ['F1','F2','F3','F4','D1','E1','E2','E3']
 */
export function stepInstruction(state: CpuState): InstructionTrace {
  if (state.halted) throw new Error('Cannot step a halted CPU: the clock has stopped.');

  const before = snapshot(state);
  const address = state.pc;
  const byte = state.mem[address] ?? 0;
  const steps: MicroStep[] = [];
  let current = snapshot(state);

  // ---- FETCH -------------------------------------------------------------
  const f1Value = current.pc;
  current = nextState(current, {mar: f1Value});
  steps.push({
    id: 'F1',
    phase: 'fetch',
    text: 'MAR ← PC',
    kind: 'copy',
    from: 'PC',
    to: 'MAR',
    value: f1Value,
    after: snapshot(current),
  });

  const readAddress = current.mar;
  const readValue = current.mem[readAddress];
  current = nextState(current, {mdr: readValue});
  steps.push({
    id: 'F2',
    phase: 'fetch',
    text: 'MDR ← M[MAR]',
    kind: 'read',
    addr: readAddress,
    value: readValue,
    after: snapshot(current),
  });

  const instructionByte = current.mdr;
  current = nextState(current, {ir: instructionByte});
  steps.push({
    id: 'F3',
    phase: 'fetch',
    text: 'IR ← MDR',
    kind: 'copy',
    from: 'MDR',
    to: 'IR',
    value: instructionByte,
    after: snapshot(current),
  });

  const oldPc = current.pc;
  const nextPc = (current.pc + 1) % CELLS;
  current = nextState(current, {pc: nextPc});
  steps.push({
    id: 'F4',
    phase: 'fetch',
    text: 'PC ← PC + 1',
    kind: 'increment',
    from: oldPc,
    to: nextPc,
    after: snapshot(current),
  });

  // ---- DECODE ------------------------------------------------------------
  const decoded = decodeByte(instructionByte);
  const illegal = decoded.mnemonic === null;
  if (illegal) current = nextState(current, {halted: true});
  steps.push({
    id: 'D1',
    phase: 'decode',
    text: 'DECODE IR',
    kind: 'decode',
    opcode: decoded.opcode,
    operand: decoded.operand,
    mnemonic: decoded.mnemonic,
    after: snapshot(current),
  });

  const operand = decoded.operand;

  // ---- EXECUTE -----------------------------------------------------------
  if (decoded.mnemonic === 'HALT') {
    current = nextState(current, {halted: true});
    steps.push({
      id: 'E1',
      phase: 'execute',
      text: 'HALT: stop the clock',
      kind: 'halt',
      after: snapshot(current),
    });
  } else if (decoded.mnemonic === 'LOAD' || decoded.mnemonic === 'ADD' || decoded.mnemonic === 'SUB') {
    current = nextState(current, {mar: operand});
    steps.push({
      id: 'E1',
      phase: 'execute',
      text: 'MAR ← IR.addr',
      kind: 'copy',
      from: 'IR.operand',
      to: 'MAR',
      value: operand,
      after: snapshot(current),
    });

    const loadAddress = current.mar;
    const loadValue = current.mem[loadAddress];
    current = nextState(current, {mdr: loadValue});
    steps.push({
      id: 'E2',
      phase: 'execute',
      text: 'MDR ← M[MAR]',
      kind: 'read',
      addr: loadAddress,
      value: loadValue,
      after: snapshot(current),
    });

    if (decoded.mnemonic === 'LOAD') {
      const value = current.mdr;
      current = nextState(current, {acc: value, z: value === 0});
      steps.push({
        id: 'E3',
        phase: 'execute',
        text: 'ACC ← MDR',
        kind: 'copy',
        from: 'MDR',
        to: 'ACC',
        value,
        setsZ: true,
        after: snapshot(current),
      });
    } else {
      const op = decoded.mnemonic;
      const left = current.acc;
      const right = current.mdr;
      const result = op === 'ADD' ? (left + right) & 0xff : (left - right) & 0xff;
      current = nextState(current, {acc: result, z: result === 0});
      steps.push({
        id: 'E3',
        phase: 'execute',
        text: `ACC ← ACC ${op === 'ADD' ? '+' : '−'} MDR`,
        kind: 'alu',
        op,
        left,
        right,
        result,
        setsZ: true,
        after: snapshot(current),
      });
    }
  } else if (decoded.mnemonic === 'STORE') {
    current = nextState(current, {mar: operand});
    steps.push({
      id: 'E1',
      phase: 'execute',
      text: 'MAR ← IR.addr',
      kind: 'copy',
      from: 'IR.operand',
      to: 'MAR',
      value: operand,
      after: snapshot(current),
    });

    const storeValue = current.acc;
    current = nextState(current, {mdr: storeValue});
    steps.push({
      id: 'E2',
      phase: 'execute',
      text: 'MDR ← ACC',
      kind: 'copy',
      from: 'ACC',
      to: 'MDR',
      value: storeValue,
      after: snapshot(current),
    });

    const mem = [...current.mem];
    mem[operand] = storeValue;
    current = nextState(current, {mem});
    steps.push({
      id: 'E3',
      phase: 'execute',
      text: 'M[MAR] ← MDR',
      kind: 'write',
      addr: operand,
      value: storeValue,
      after: snapshot(current),
    });
  } else if (decoded.mnemonic === 'JUMP') {
    current = nextState(current, {pc: operand});
    steps.push({
      id: 'E1',
      phase: 'execute',
      text: 'PC ← IR.addr',
      kind: 'copy',
      from: 'IR.operand',
      to: 'PC',
      value: operand,
      after: snapshot(current),
    });
  } else if (decoded.mnemonic === 'JZ') {
    const taken = current.z;
    steps.push({
      id: 'E1',
      phase: 'execute',
      text: 'Z = 1 ?',
      kind: 'check-flag',
      z: current.z,
      taken,
      target: operand,
      after: snapshot(current),
    });
    if (taken) {
      current = nextState(current, {pc: operand});
      steps.push({
        id: 'E2',
        phase: 'execute',
        text: 'PC ← IR.addr',
        kind: 'copy',
        from: 'IR.operand',
        to: 'PC',
        value: operand,
        after: snapshot(current),
      });
    }
  }

  return {
    address,
    byte: byte & 0xff,
    text: illegal ? '???' : disassemble(byte),
    illegal,
    steps,
    before,
    after: snapshot(current),
  };
}

/**
 * Run until HALT, an illegal instruction, or the instruction limit.
 *
 * @example
 * const {traces, completed} = runProgram(loadedState(ADD_PROGRAM));
 * completed; // true
 */
export function runProgram(
  state: CpuState,
  maxInstructions = 200,
): {traces: InstructionTrace[]; final: CpuState; completed: boolean} {
  const traces: InstructionTrace[] = [];
  let current = snapshot(state);
  while (!current.halted && traces.length < maxInstructions) {
    const trace = stepInstruction(current);
    traces.push(trace);
    current = trace.after;
    if (trace.illegal) break;
  }
  return {traces, final: current, completed: current.halted};
}

/**
 * How many clock ticks a list of instructions took.
 *
 * @example
 * totalTicks(runProgram(loadedState(ADD_PROGRAM)).traces); // 30
 */
export function totalTicks(traces: readonly InstructionTrace[]): number {
  return traces.reduce((sum, trace) => sum + trace.steps.length, 0);
}

/**
 * The state after the micro-step with a given id, used to jump into the middle of an instruction.
 *
 * @example
 * stateAfterStep(trace, 'D1').acc; // 0, before LOAD executes
 */
export function stateAfterStep(trace: InstructionTrace, id: string): CpuState {
  const step = trace.steps.find(candidate => candidate.id === id);
  if (!step) throw new Error(`Instruction at ${trace.address} has no step "${id}"`);
  return step.after;
}
