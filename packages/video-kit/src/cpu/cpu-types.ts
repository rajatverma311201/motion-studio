/** Shared types for the pure TinyCPU model. No drawing code lives here. */

/** The five addressable registers inside the CPU. */
export type RegName = 'PC' | 'MAR' | 'MDR' | 'IR' | 'ACC';

/** The three phases one instruction goes through. */
export type Phase = 'fetch' | 'decode' | 'execute';

/** Every mnemonic the toy instruction set defines. */
export type Mnemonic = 'HALT' | 'LOAD' | 'ADD' | 'SUB' | 'STORE' | 'JUMP' | 'JZ';

/**
 * The complete visible state of TinyCPU at one instant.
 *
 * @example
 * const state: CpuState = loadedState(ADD_PROGRAM);
 */
export interface CpuState {
  readonly pc: number;
  readonly mar: number;
  readonly mdr: number;
  readonly ir: number;
  readonly acc: number;
  readonly z: boolean;
  readonly halted: boolean;
  /** Exactly 16 bytes, addresses 0 to 15. */
  readonly mem: readonly number[];
}

/** The common fields every micro-step carries, plus its phase-specific payload. */
export type MicroStep = {id: string; phase: Phase; text: string; setsZ?: boolean; after: CpuState} & (
  | {kind: 'copy'; from: RegName | 'IR.operand'; to: RegName; value: number}
  | {kind: 'read'; addr: number; value: number}
  | {kind: 'write'; addr: number; value: number}
  | {kind: 'increment'; from: number; to: number}
  | {kind: 'decode'; opcode: number; operand: number; mnemonic: Mnemonic | null}
  | {kind: 'alu'; op: 'ADD' | 'SUB'; left: number; right: number; result: number}
  | {kind: 'check-flag'; z: boolean; taken: boolean; target: number}
  | {kind: 'halt'}
);

/**
 * One instruction, from fetch to the end of execute.
 *
 * @example
 * const trace = stepInstruction(loadedState(ADD_PROGRAM));
 * trace.text; // "LOAD 12"
 */
export interface InstructionTrace {
  readonly address: number;
  readonly byte: number;
  /** Mnemonic plus operand, e.g. "LOAD 12", or "???" for an illegal byte. */
  readonly text: string;
  readonly illegal: boolean;
  readonly steps: readonly MicroStep[];
  readonly before: CpuState;
  readonly after: CpuState;
}

/**
 * A program as it sits on disk, before the loader copies it into memory.
 *
 * @example
 * const program: ToyProgram = {name: 'add', base: 4, entry: 4, code: ['LOAD 12'], data: {12: 5}};
 */
export interface ToyProgram {
  readonly name: string;
  readonly base: number;
  readonly code: readonly string[];
  readonly data: Readonly<Record<number, number>>;
  readonly entry: number;
}
