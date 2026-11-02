import {describe, expect, it} from 'vitest';
import {REGISTERED_CLAIMS} from './claim-info';

describe('REGISTERED_CLAIMS', () => {
  it('lists the seven registered claims in teaching order', () => {
    expect(REGISTERED_CLAIMS.map(claim => claim.name)).toEqual(['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']);
  });

  it('gives every claim a non-empty meaning', () => {
    for (const claim of REGISTERED_CLAIMS) {
      expect(claim.meaning.length, claim.name).toBeGreaterThan(8);
    }
  });
});
