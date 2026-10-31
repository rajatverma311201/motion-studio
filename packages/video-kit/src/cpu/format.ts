/**
 * Zero-padded binary for a value, masked to the requested width.
 *
 * @example
 * formatBits(5, 8); // "00000101"
 * formatBits(12, 4); // "1100"
 */
export function formatBits(value: number, bits: number): string {
  const width = Math.max(1, Math.floor(bits));
  const mask = 2 ** width - 1;
  return (Math.floor(value) & mask).toString(2).padStart(width, '0');
}

/**
 * Two upper-case hex digits for one byte.
 *
 * @example
 * toHex(0x1c); // "1C"
 */
export function toHex(byte: number): string {
  return (byte & 0xff).toString(16).toUpperCase().padStart(2, '0');
}
