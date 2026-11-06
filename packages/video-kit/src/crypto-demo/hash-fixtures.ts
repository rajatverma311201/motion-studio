/**
 * Hash fixtures for the hashing chapter. Every value is a demo and is
 * recomputed in `hash-fixtures.test.ts` with Node's `crypto`.
 */

/** SHA-256 of the demo message, hex. */
export const DEMO_SHA256 = '528c8ed21cac490748fe6f0df5c173d7b57a402586f2d10810611c2427539d97';

/** SHA-256 of the tampered demo message, hex. */
export const DEMO_SHA256_TAMPERED = '5d823a8c1def49f4c1aa1b8b6a1d85b09554d44c602f654374a19d1d7a254664';

/** Bits that differ between {@link DEMO_SHA256} and {@link DEMO_SHA256_TAMPERED}. */
export const DEMO_BITS_DIFFERENT = 125;

/** The classic HTTP Basic auth example. Demo only, never a real credential. */
export const BASIC_AUTH_EXAMPLE = {
  plain: 'Aladdin:open sesame',
  base64: 'QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
} as const;

/** `encodeURIComponent('pay 500 to Bob')`, the URL encoding demo. */
export const DEMO_URL_ENCODED = 'pay%20500%20to%20Bob';
