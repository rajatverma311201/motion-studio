import {createPublicKey, verify} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {decodeBase64UrlText, encodeBase64Url} from './base64url';
import {ES256_HEADER_JSON, ES256_JWK, ES256_TOKEN} from './jwt-es256-fixture';
import {JWT_PAYLOAD_JSON} from './jwt-fixtures';
import {decodeJson, splitToken} from './jwt-parse';

describe('ES256 fixture', () => {
  const {header, payload, signature, signingInput} = splitToken(ES256_TOKEN);
  const publicKey = createPublicKey({key: {...ES256_JWK}, format: 'jwk'});
  const signatureBytes = Buffer.from(signature, 'base64url');

  it('verifies with the published public JWK', () => {
    const valid = verify(
      'sha256',
      Buffer.from(signingInput),
      {key: publicKey, dsaEncoding: 'ieee-p1363'},
      signatureBytes,
    );

    expect(valid).toBe(true);
  });

  it('fails when one character of the payload changes', () => {
    const tamperedPayload = encodeBase64Url(JWT_PAYLOAD_JSON.replace('"user"', '"admin"'));
    const tamperedInput = `${header}.${tamperedPayload}`;

    const valid = verify(
      'sha256',
      Buffer.from(tamperedInput),
      {key: publicKey, dsaEncoding: 'ieee-p1363'},
      signatureBytes,
    );

    expect(valid).toBe(false);
  });

  it('uses the same payload and header as the HS256 fixture', () => {
    expect(decodeBase64UrlText(payload)).toBe(JWT_PAYLOAD_JSON);
    expect(decodeBase64UrlText(header)).toBe(ES256_HEADER_JSON);
    expect(decodeJson(header)).toMatchObject({alg: 'ES256', typ: 'JWT', kid: 'key-1'});
    expect(ES256_JWK.kid).toBe('key-1');
  });
});
