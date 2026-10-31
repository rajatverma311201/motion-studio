/**
 * Round a number and format it with English thousands separators.
 *
 * @example
 * formatNumber(1234567); // '1,234,567'
 */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
