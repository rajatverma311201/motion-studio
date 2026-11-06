import {createPublicKey, verify} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {DEMO_MESSAGE, DEMO_TAMPERED_MESSAGE} from './crypto-fixtures';
import {DEMO_PUBLIC_JWK, DEMO_SIGNATURE_HEX} from './signature-fixture';

const publicKey = createPublicKey({key: DEMO_PUBLIC_JWK, format: 'jwk'});
const signature = Buffer.from(DEMO_SIGNATURE_HEX, 'hex');

const verifyMessage = (message: string): boolean =>
  verify('sha256', Buffer.from(message, 'utf8'), {key: publicKey, dsaEncoding: 'ieee-p1363'}, signature);

describe('signature fixture', () => {
  it('is a 64-byte P1363 signature in 128 hex characters', () => {
    expect(DEMO_SIGNATURE_HEX).toMatch(/^[0-9a-f]{128}$/);
    expect(signature).toHaveLength(64);
  });

  it('verifies the demo message with the public JWK', () => {
    expect(verifyMessage(DEMO_MESSAGE)).toBe(true);
  });

  it('fails for the tampered message', () => {
    expect(verifyMessage(DEMO_TAMPERED_MESSAGE)).toBe(false);
  });
});
