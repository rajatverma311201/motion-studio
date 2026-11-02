/** The standard Base64 alphabet, in index order. */
export const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Every intermediate result of the block-by-block Base64 algorithm. */
export interface Base64Steps {
  /** UTF-8 bytes of the input. */
  bytes: number[];
  /** One 8-bit string per byte. */
  bits: string[];
  /** One 6-bit string per Base64 character, padding excluded. */
  groups: string[];
  /** Numeric value of every six-bit group. */
  indices: number[];
  /** Encoded characters, including any trailing `=` padding. */
  chars: string[];
  /** Number of `=` characters at the end of {@link chars}. */
  padding: number;
}

/**
 * Walk the Base64 algorithm for one string so a scene can animate each step.
 *
 * Pure: no Motion Canvas imports, and the alphabet is standard Base64 rather
 * than the URL-safe variant, because the scene shows the swap afterwards.
 *
 * @example
 * base64Steps('Man');
 * // {bytes: [77, 97, 110], bits: ['01001101', ...], groups: ['010011', ...],
 * //  indices: [19, 22, 5, 46], chars: ['T', 'W', 'F', 'u'], padding: 0}
 */
export function base64Steps(input: string): Base64Steps {
  const bytes = Array.from(new TextEncoder().encode(input));
  const bits = bytes.map(byte => byte.toString(2).padStart(8, '0'));
  const groups: string[] = [];
  const indices: number[] = [];

  for (let i = 0; i < bytes.length; i += 3) {
    const block = [bytes[i], i + 1 < bytes.length ? bytes[i + 1] : 0, i + 2 < bytes.length ? bytes[i + 2] : 0];
    const blockBits = block.map(byte => byte.toString(2).padStart(8, '0')).join('');
    const groupCount = i + 2 < bytes.length ? 4 : i + 1 < bytes.length ? 3 : 2;

    for (let group = 0; group < groupCount; group++) {
      const sixBits = blockBits.slice(group * 6, group * 6 + 6);
      groups.push(sixBits);
      indices.push(parseInt(sixBits, 2));
    }
  }

  const padding = (3 - (bytes.length % 3)) % 3;
  const chars = indices.map(index => base64Alphabet[index]);
  chars.push(...'='.repeat(padding));

  return {bytes, bits, groups, indices, chars, padding};
}

/**
 * Turn standard Base64 into the URL-safe variant: `+` becomes `-`, `/` becomes
 * `_`, and the trailing padding is dropped.
 *
 * @example
 * toUrlSafe('a+b/c=='); // 'a-b_c'
 */
export function toUrlSafe(text: string): string {
  return text.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
