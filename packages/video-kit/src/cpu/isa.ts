import type {Mnemonic} from './cpu-types';

/**
 * The four-bit opcode for every mnemonic.
 *
 * @example
 * OPCODES.LOAD; // 0b0001
 */
export const OPCODES: Readonly<Record<Mnemonic, number>> = {
  HALT: 0b0000,
  LOAD: 0b0001,
  ADD: 0b0010,
  SUB: 0b0011,
  STORE: 0b0100,
  JUMP: 0b0101,
  JZ: 0b0110,
};

const BY_OPCODE: readonly (Mnemonic | null)[] = ['HALT', 'LOAD', 'ADD', 'SUB', 'STORE', 'JUMP', 'JZ'];

/**
 * Encode a mnemonic and an operand into one byte.
 *
 * @example
 * encode('LOAD', 12); // 0x1c
 */
export function encode(mnemonic: Mnemonic, operand = 0): number {
  return ((OPCODES[mnemonic] << 4) | (operand & 0x0f)) & 0xff;
}

/**
 * Split one byte into its opcode, operand and mnemonic. Unknown opcodes get `mnemonic: null`.
 *
 * @example
 * decodeByte(0x1c); // {opcode: 1, operand: 12, mnemonic: 'LOAD'}
 */
export function decodeByte(byte: number): {opcode: number; operand: number; mnemonic: Mnemonic | null} {
  const value = byte & 0xff;
  const opcode = value >> 4;
  return {opcode, operand: value & 0x0f, mnemonic: BY_OPCODE[opcode] ?? null};
}

/**
 * Render a byte as an instruction, or `???` when the opcode is not defined.
 *
 * @example
 * disassemble(0x1c); // "LOAD 12"
 * disassemble(0xf3); // "???"
 */
export function disassemble(byte: number): string {
  const {mnemonic, operand} = decodeByte(byte);
  if (mnemonic === null) return '???';
  return mnemonic === 'HALT' ? 'HALT' : `${mnemonic} ${operand}`;
}

/**
 * Turn assembly lines into instruction bytes. Case-insensitive; blank lines are skipped.
 * A bad line throws an error that names the line so the model can never disagree silently.
 *
 * @example
 * assemble(['LOAD 12', 'ADD 13', 'STORE 14', 'HALT']); // [0x1c, 0x2d, 0x4e, 0x00]
 */
export function assemble(lines: readonly string[]): number[] {
  const bytes: number[] = [];
  lines.forEach((line, index) => {
    const text = line.trim();
    if (text.length === 0) return;
    const [rawMnemonic, rawOperand, ...extra] = text.split(/\s+/);
    const mnemonic = rawMnemonic.toUpperCase() as Mnemonic;
    if (!(mnemonic in OPCODES)) {
      throw new Error(`Line ${index + 1}: unknown mnemonic "${rawMnemonic}" in "${text}"`);
    }
    if (extra.length > 0) {
      throw new Error(`Line ${index + 1}: too many parts in "${text}"`);
    }
    if (mnemonic === 'HALT') {
      if (rawOperand !== undefined) {
        throw new Error(`Line ${index + 1}: HALT takes no operand in "${text}"`);
      }
      bytes.push(encode('HALT'));
      return;
    }
    if (rawOperand === undefined) {
      throw new Error(`Line ${index + 1}: ${mnemonic} needs an operand in "${text}"`);
    }
    if (!/^\d+$/.test(rawOperand)) {
      throw new Error(`Line ${index + 1}: operand "${rawOperand}" must be a whole number in "${text}"`);
    }
    const operand = Number(rawOperand);
    if (operand < 0 || operand > 15) {
      throw new Error(`Line ${index + 1}: operand ${operand} is outside 0-15 in "${text}"`);
    }
    bytes.push(encode(mnemonic, operand));
  });
  return bytes;
}
