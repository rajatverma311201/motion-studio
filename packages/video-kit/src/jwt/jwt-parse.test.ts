import {describe, expect, it} from 'vitest';
import {encodeBase64Url} from './base64url';
import {JWT_HEADER, JWT_PAYLOAD, JWT_SIGNATURE, JWT_TOKEN} from './jwt-fixtures';
import {decodeJson, describeToken, splitToken} from './jwt-parse';

describe('splitToken', () => {
  it('returns the three parts and the signing input', () => {
    expect(splitToken('a.b.c')).toEqual({header: 'a', payload: 'b', signature: 'c', signingInput: 'a.b'});
  });

  it('rejects anything that is not exactly three non-empty parts', () => {
    for (const token of ['', 'a', 'a.b', 'a.b.c.d', '..', 'a..c', '.b.c']) {
      expect(() => splitToken(token), JSON.stringify(token)).toThrow(/exactly three non-empty parts/);
    }
  });
});

describe('decodeJson', () => {
  it('decodes a JSON object', () => {
    expect(decodeJson(encodeBase64Url('{"a":1}'))).toEqual({a: 1});
  });

  it('rejects text that is not JSON', () => {
    expect(() => decodeJson(encodeBase64Url('not json'))).toThrow(/not JSON/);
  });
});

describe('describeToken', () => {
  it('parses the header, payload, signature and lengths', () => {
    const description = describeToken(JWT_TOKEN);

    expect(description.header).toEqual({alg: 'HS256', typ: 'JWT'});
    expect(description.payload).toMatchObject({sub: 'user_42', name: 'Asha', role: 'user'});
    expect(description.signature).toBe(JWT_SIGNATURE);
    expect(description.lengths).toEqual({
      token: 187,
      header: JWT_HEADER.length,
      payload: JWT_PAYLOAD.length,
      signature: JWT_SIGNATURE.length,
      signingInput: JWT_HEADER.length + 1 + JWT_PAYLOAD.length,
    });
  });

  it('rejects a part that decodes to a non-object', () => {
    const token = `${encodeBase64Url('[]')}.${encodeBase64Url('{}')}.${JWT_SIGNATURE}`;
    expect(() => describeToken(token)).toThrow(/must both be JSON objects/);
  });
});
