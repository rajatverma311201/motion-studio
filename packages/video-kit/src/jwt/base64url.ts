const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VALUES = new Map<string, number>(Array.from(ALPHABET, (char, index) => [char, index]));

/**
 * Encode text or bytes as Base64URL without padding.
 *
 * Pure and platform-independent: `TextEncoder` plus the alphabet, so it works
 * the same in the browser and in Node tests. No `Buffer`, no `btoa`.
 *
 * @example
 * encodeBase64Url('Man'); // 'TWFu'
 * encodeBase64Url(new Uint8Array([1, 2, 3]));
 */
export function encodeBase64Url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let out = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    out += ALPHABET[b0 >> 2];
    out += ALPHABET[((b0 & 0b11) << 4) | (b1 >> 4)];
    if (i + 1 < bytes.length) out += ALPHABET[((b1 & 0b1111) << 2) | (b2 >> 6)];
    if (i + 2 < bytes.length) out += ALPHABET[b2 & 0b111111];
  }

  return out;
}

/**
 * Decode Base64URL text into bytes. Trailing `=` padding is accepted but never
 * produced by {@link encodeBase64Url}.
 *
 * @example
 * decodeBase64Url('TWFu'); // Uint8Array [77, 97, 110]
 */
export function decodeBase64Url(text: string): Uint8Array {
  let data = text;
  if (data.includes('=')) {
    const first = data.indexOf('=');
    for (let i = first; i < data.length; i++) {
      if (data[i] !== '=') {
        throw new Error(`Invalid Base64URL padding "=" at index ${first}`);
      }
    }
    if (data.length - first > 2) {
      throw new Error(`Invalid Base64URL padding: more than two "=" at index ${first}`);
    }
    data = data.slice(0, first);
  }

  if (data.length % 4 === 1) {
    throw new Error(`Invalid Base64URL length: ${data.length} characters can never be a whole number of bytes`);
  }

  const values = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const value = VALUES.get(data[i]);
    if (value === undefined) {
      throw new Error(`Invalid Base64URL character "${data[i]}" at index ${i}`);
    }
    values[i] = value;
  }

  const out = new Uint8Array(Math.floor((data.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let offset = 0;

  for (const value of values) {
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[offset++] = (buffer >> bits) & 0xff;
    }
  }

  return out;
}

/**
 * Decode Base64URL text as a UTF-8 string.
 *
 * @example
 * decodeBase64UrlText('eyJhbGci'); // '{"alg'
 */
export function decodeBase64UrlText(text: string): string {
  return new TextDecoder().decode(decodeBase64Url(text));
}
