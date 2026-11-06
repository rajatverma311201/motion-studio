import {createCipheriv, createDecipheriv, createHash, createHmac} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {
  DEMO_AES_IV_HEX,
  DEMO_AES_KEY_HEX,
  DEMO_AES_KEY_TEXT,
  DEMO_AUTH_TAG_HEX,
  DEMO_BASE64,
  DEMO_CIPHERTEXT_HEX,
  DEMO_HEX,
  DEMO_HMAC,
  DEMO_HMAC_KEY,
  DEMO_HMAC_TAMPERED,
  DEMO_MESSAGE,
  DEMO_TAMPERED_MESSAGE,
  DEMO_WRONG_KEY_TEXT,
  shortHex,
} from './crypto-fixtures';

const derivedKey = (text: string): Buffer => createHash('sha256').update(text).digest();

function encrypt(message: string, key: Buffer): {ciphertext: Buffer; tag: Buffer} {
  const cipher = createCipheriv('aes-256-gcm', key, Buffer.from(DEMO_AES_IV_HEX, 'hex'));
  const ciphertext = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
  return {ciphertext, tag: cipher.getAuthTag()};
}

function decrypt(ciphertext: Buffer, tag: Buffer, key: Buffer): string {
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(DEMO_AES_IV_HEX, 'hex'));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

describe('crypto demo fixtures', () => {
  it('encodes the demo message to Base64 and hex', () => {
    expect(Buffer.from(DEMO_MESSAGE, 'utf8').toString('base64')).toBe(DEMO_BASE64);
    expect(Buffer.from(DEMO_MESSAGE, 'utf8').toString('hex')).toBe(DEMO_HEX);
  });

  it('computes both HMAC tags with Node crypto', () => {
    expect(createHmac('sha256', DEMO_HMAC_KEY).update(DEMO_MESSAGE).digest('hex')).toBe(DEMO_HMAC);
    expect(createHmac('sha256', DEMO_HMAC_KEY).update(DEMO_TAMPERED_MESSAGE).digest('hex')).toBe(DEMO_HMAC_TAMPERED);
    expect(DEMO_HMAC_TAMPERED).not.toBe(DEMO_HMAC);
  });

  it('derives the AES key as SHA-256 of the demo string', () => {
    expect(derivedKey(DEMO_AES_KEY_TEXT).toString('hex')).toBe(DEMO_AES_KEY_HEX);
  });

  it('encrypts the message with AES-256-GCM', () => {
    const {ciphertext, tag} = encrypt(DEMO_MESSAGE, Buffer.from(DEMO_AES_KEY_HEX, 'hex'));
    expect(ciphertext.toString('hex')).toBe(DEMO_CIPHERTEXT_HEX);
    expect(tag.toString('hex')).toBe(DEMO_AUTH_TAG_HEX);
    expect(ciphertext).toHaveLength(Buffer.from(DEMO_MESSAGE, 'utf8').length);
  });

  it('decrypts back to the message with the right key', () => {
    const {ciphertext, tag} = encrypt(DEMO_MESSAGE, derivedKey(DEMO_AES_KEY_TEXT));
    expect(decrypt(ciphertext, tag, derivedKey(DEMO_AES_KEY_TEXT))).toBe(DEMO_MESSAGE);
  });

  it('fails authentication with a wrong key', () => {
    const {ciphertext, tag} = encrypt(DEMO_MESSAGE, derivedKey(DEMO_AES_KEY_TEXT));
    expect(() => decrypt(ciphertext, tag, derivedKey(DEMO_WRONG_KEY_TEXT))).toThrow(/authenticate/i);
  });

  it('shortens a digest for a chip', () => {
    expect(shortHex(DEMO_HMAC, 8)).toBe('806ec60a…');
    expect(shortHex(DEMO_HMAC_TAMPERED, 8)).toBe('14c6ef47…');
    expect(shortHex('abcd', 8)).toBe('abcd');
  });
});
