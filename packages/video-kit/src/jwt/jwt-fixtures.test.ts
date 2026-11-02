import {createHmac} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {decodeBase64UrlText, encodeBase64Url} from './base64url';
import {
  JWT_HEADER,
  JWT_HEADER_JSON,
  JWT_PART_COLOR,
  JWT_PAYLOAD,
  JWT_PAYLOAD_JSON,
  JWT_SECRET,
  JWT_SIGNATURE,
  JWT_SIGNING_INPUT,
  JWT_TAMPERED_PAYLOAD,
  JWT_TAMPERED_PAYLOAD_JSON,
  JWT_TAMPERED_SIGNATURE,
  JWT_TAMPERED_SIGNING_INPUT,
  JWT_TAMPERED_TOKEN,
  JWT_TOKEN,
} from './jwt-fixtures';
import {describeToken, splitToken} from './jwt-parse';

function hmac(input: string): string {
  return createHmac('sha256', JWT_SECRET).update(input).digest('base64url');
}

describe('JWT fixtures', () => {
  it('encodes the JSON constants exactly', () => {
    expect(encodeBase64Url(JWT_HEADER_JSON)).toBe(JWT_HEADER);
    expect(encodeBase64Url(JWT_PAYLOAD_JSON)).toBe(JWT_PAYLOAD);
    expect(encodeBase64Url(JWT_TAMPERED_PAYLOAD_JSON)).toBe(JWT_TAMPERED_PAYLOAD);
  });

  it('decodes back to the JSON constants', () => {
    expect(JSON.parse(decodeBase64UrlText(JWT_HEADER))).toEqual(JSON.parse(JWT_HEADER_JSON));
    expect(JSON.parse(decodeBase64UrlText(JWT_PAYLOAD))).toEqual(JSON.parse(JWT_PAYLOAD_JSON));
    expect(JSON.parse(decodeBase64UrlText(JWT_TAMPERED_PAYLOAD))).toEqual(JSON.parse(JWT_TAMPERED_PAYLOAD_JSON));
  });

  it('verifies the signature with Node crypto', () => {
    expect(hmac(JWT_SIGNING_INPUT)).toBe(JWT_SIGNATURE);
    expect(hmac(JWT_TAMPERED_SIGNING_INPUT)).toBe(JWT_TAMPERED_SIGNATURE);
    expect(JWT_TAMPERED_SIGNATURE).not.toBe(JWT_SIGNATURE);
  });

  it('builds the token from the three parts', () => {
    expect(JWT_SIGNING_INPUT).toBe(`${JWT_HEADER}.${JWT_PAYLOAD}`);
    expect(JWT_TAMPERED_SIGNING_INPUT).toBe(`${JWT_HEADER}.${JWT_TAMPERED_PAYLOAD}`);
    expect(JWT_TOKEN).toBe(`${JWT_SIGNING_INPUT}.${JWT_SIGNATURE}`);
    expect(JWT_TAMPERED_TOKEN).toBe(`${JWT_TAMPERED_SIGNING_INPUT}.${JWT_SIGNATURE}`);
  });

  it('keeps the token lengths the Short relies on', () => {
    expect(JWT_TOKEN).toHaveLength(187);
    expect(JWT_TAMPERED_TOKEN).toHaveLength(188);
    expect(splitToken(JWT_TOKEN).signature).toBe(JWT_SIGNATURE);
  });

  it('describes the user token and the tampered token', () => {
    expect(describeToken(JWT_TOKEN).payload.role).toBe('user');
    expect(describeToken(JWT_TAMPERED_TOKEN).payload.role).toBe('admin');
    expect(describeToken(JWT_TAMPERED_TOKEN).signature).toBe(JWT_SIGNATURE);
  });

  it('maps the three parts to the series colours', () => {
    expect(JWT_PART_COLOR).toEqual({header: 'pink', payload: 'cyan', signature: 'lime'});
  });
});
