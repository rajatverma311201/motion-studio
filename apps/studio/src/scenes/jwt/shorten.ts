/**
 * Shorten a long value for display, keeping both ends so it can still be
 * recognised. Used for the JWK coordinates in the JWKS panel.
 *
 * @example
 * shortenMiddle('WRR3bHcwYTyipkGWeG6mEMux', 18); // 'WRR3bHcwY…GWeG6mEMux'
 */
export function shortenMiddle(value: string, max = 18): string {
  if (value.length <= max) return value;
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${value.slice(0, head)}…${value.slice(value.length - tail)}`;
}
