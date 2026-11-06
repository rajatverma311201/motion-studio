/** The demo message every beat of the Short transforms. */
export const DEMO_MESSAGE = 'pay 500 to Bob';

/** The same message with one digit changed, for the signing beat. */
export const DEMO_TAMPERED_MESSAGE = 'pay 900 to Bob';

/** Standard Base64 of {@link DEMO_MESSAGE}. */
export const DEMO_BASE64 = 'cGF5IDUwMCB0byBCb2I=';

/** Hex of {@link DEMO_MESSAGE}. */
export const DEMO_HEX = '7061792035303020746f20426f62';

/** Demo HMAC key. Never use this value for anything real. */
export const DEMO_HMAC_KEY = 'demo-secret-do-not-use';

/** HMAC-SHA256(DEMO_HMAC_KEY, DEMO_MESSAGE), hex. */
export const DEMO_HMAC = '806ec60a250deeaa0c1b8d80cc77510ac5461c905ce2696706d219a659c625c0';

/** HMAC-SHA256(DEMO_HMAC_KEY, DEMO_TAMPERED_MESSAGE), hex. */
export const DEMO_HMAC_TAMPERED = '14c6ef471d7555430c0550c5a7611c28f9b7bc93dadec1cd20c5cb83301f193e';

/** The AES key is SHA-256 of this demo string, so the fixture is reproducible. */
export const DEMO_AES_KEY_TEXT = 'demo-aes-key-do-not-use';

/** A deliberately wrong key source for the failed decryption beat. */
export const DEMO_WRONG_KEY_TEXT = 'wrong-key';

/** SHA-256(DEMO_AES_KEY_TEXT), hex. Never use this value for anything real. */
export const DEMO_AES_KEY_HEX = 'bd8585be67b1731ea513f050e76edb9cf3cb76dc46b3122337f3d7498eed0212';

/** Fixed 12-byte IV for the demo. A real key must never reuse an IV. */
export const DEMO_AES_IV_HEX = '000102030405060708090a0b';

/** AES-256-GCM ciphertext of DEMO_MESSAGE, hex. One byte per message byte. */
export const DEMO_CIPHERTEXT_HEX = '1e86c756966fd4fb24897b29496b';

/** AES-256-GCM authentication tag of {@link DEMO_CIPHERTEXT_HEX}, hex. */
export const DEMO_AUTH_TAG_HEX = 'b79e662dac101127d0a224bf05f5ced8';

/**
 * Shorten a hex digest for a chip. Long values keep their first `n` characters
 * and an ellipsis; values that already fit are returned unchanged.
 *
 * @example
 * shortHex(DEMO_HMAC, 8); // '806ec60a…'
 */
export function shortHex(hex: string, n: number): string {
  return hex.length <= n ? hex : `${hex.slice(0, n)}…`;
}
