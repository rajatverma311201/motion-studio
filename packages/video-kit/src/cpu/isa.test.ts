import {describe, expect, it} from 'vitest';
import {ADD_PROGRAM, COUNTDOWN_PROGRAM} from './programs';
import {OPCODES, assemble, decodeByte, disassemble, encode} from './isa';
import type {Mnemonic} from './cpu-types';

const MNEMONICS = Object.keys(OPCODES) as Mnemonic[];

describe('isa', () => {
  it('round trips every mnemonic and operand', () => {
    for (const mnemonic of MNEMONICS) {
      for (let operand = 0; operand <= 15; operand++) {
        const decoded = decodeByte(encode(mnemonic, operand));
        expect(decoded.mnemonic).toBe(mnemonic);
        expect(decoded.operand).toBe(operand);
      }
    }
  });

  it('treats opcodes 7 to 15 as illegal', () => {
    for (let opcode = 7; opcode <= 15; opcode++) {
      expect(decodeByte(opcode << 4).mnemonic).toBeNull();
    }
  });

  it('assembles both programs from the lesson', () => {
    expect(assemble(ADD_PROGRAM.code)).toEqual([0x1c, 0x2d, 0x4e, 0x00]);
    expect(assemble(COUNTDOWN_PROGRAM.code)).toEqual([0x1d, 0x69, 0x3e, 0x4d, 0x54, 0x00]);
  });

  it('is case-insensitive and skips blank lines', () => {
    expect(assemble([' load 12 ', '', 'ADD 13', 'halt'])).toEqual([0x1c, 0x2d, 0x00]);
  });

  it('names the bad line in every error', () => {
    expect(() => assemble(['LOAD 12', 'NOPE 1'])).toThrow(/Line 2.*NOPE 1/);
    expect(() => assemble(['LOAD 16'])).toThrow(/Line 1.*LOAD 16/);
    expect(() => assemble(['HALT 3'])).toThrow(/Line 1.*HALT 3/);
    expect(() => assemble(['ADD'])).toThrow(/Line 1.*ADD/);
    expect(() => assemble(['ADD x'])).toThrow(/Line 1.*ADD x/);
  });

  it('disassembles mnemonics, halts and unknown bytes', () => {
    expect(disassemble(0x1c)).toBe('LOAD 12');
    expect(disassemble(0x69)).toBe('JZ 9');
    expect(disassemble(0x00)).toBe('HALT');
    expect(disassemble(0xf3)).toBe('???');
  });
});
