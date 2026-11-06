/** The result of comparing two equal-length bit strings. */
export interface BitDiff {
  /** How many positions differ. */
  count: number;
  /** Zero-based indices that differ, left to right. */
  positions: number[];
}

/**
 * Expand a hex string into bits, four characters per input digit.
 *
 * @example
 * hexToBits('0f'); // '00001111'
 */
export function hexToBits(hex: string): string {
  let bits = '';
  for (const digit of hex.toLowerCase()) {
    const value = Number.parseInt(digit, 16);
    if (Number.isNaN(value)) throw new Error(`hexToBits: "${digit}" is not a hex digit`);
    bits += value.toString(2).padStart(4, '0');
  }
  return bits;
}

/**
 * Compare two equal-length bit strings and report the positions that differ.
 *
 * @example
 * bitDiff('1010', '0011'); // {count: 2, positions: [0, 3]}
 */
export function bitDiff(a: string, b: string): BitDiff {
  if (a.length !== b.length) throw new Error(`bitDiff: lengths differ (${a.length} and ${b.length})`);

  const positions: number[] = [];
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) positions.push(index);
  }
  return {count: positions.length, positions};
}

/**
 * Split a hex string into fixed-size chunks, for example four rows of sixteen
 * characters. The last chunk may be shorter.
 *
 * @example
 * chunkHex('abcdef', 4); // ['abcd', 'ef']
 */
export function chunkHex(hex: string, size: number): string[] {
  if (!Number.isInteger(size) || size < 1) throw new Error(`chunkHex: size must be a positive integer (got ${size})`);

  const chunks: string[] = [];
  for (let index = 0; index < hex.length; index += size) chunks.push(hex.slice(index, index + size));
  return chunks;
}
