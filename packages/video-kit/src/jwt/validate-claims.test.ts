import {describe, expect, it} from 'vitest';
import {validateClaims} from './validate-claims';

const NOW = 1767225600;

const payload = {
  iss: 'auth.example.com',
  aud: 'orders-api',
  exp: NOW + 3600,
  nbf: NOW - 60,
};

const options = {issuer: 'auth.example.com', audience: 'orders-api'};

describe('validateClaims', () => {
  it('accepts a token that is valid right now', () => {
    const result = validateClaims(payload, NOW, options);

    expect(result.ok).toBe(true);
    expect(result.checks.map(check => check.name)).toEqual(['exp', 'nbf', 'iss', 'aud']);
    expect(result.checks.every(check => check.ok)).toBe(true);
  });

  it('accepts an expiry one second ago inside the skew window', () => {
    const result = validateClaims({...payload, exp: NOW - 1}, NOW, {...options, skewSeconds: 5});

    expect(result.ok).toBe(true);
    expect(result.checks.find(check => check.name === 'exp')?.ok).toBe(true);
  });

  it('rejects an expiry beyond the skew window', () => {
    const result = validateClaims({...payload, exp: NOW - 10}, NOW, {...options, skewSeconds: 5});

    expect(result.ok).toBe(false);
    expect(result.checks.find(check => check.name === 'exp')?.ok).toBe(false);
  });

  it('rejects a not-before time in the future', () => {
    const result = validateClaims({...payload, nbf: NOW + 30}, NOW, options);

    expect(result.ok).toBe(false);
    expect(result.checks.find(check => check.name === 'nbf')?.ok).toBe(false);
  });

  it('rejects a different issuer', () => {
    const result = validateClaims({...payload, iss: 'evil.example'}, NOW, options);

    expect(result.ok).toBe(false);
    expect(result.checks.find(check => check.name === 'iss')?.ok).toBe(false);
  });

  it('rejects a different audience', () => {
    const result = validateClaims({...payload, aud: 'payments-api'}, NOW, options);

    expect(result.ok).toBe(false);
    expect(result.checks.find(check => check.name === 'aud')?.ok).toBe(false);
  });

  it('accepts an audience array that contains the service', () => {
    const result = validateClaims({...payload, aud: ['payments-api', 'orders-api']}, NOW, options);

    expect(result.ok).toBe(true);
    expect(result.checks.find(check => check.name === 'aud')?.ok).toBe(true);
  });

  it('skips the issuer and audience when the caller does not ask for them', () => {
    const result = validateClaims({}, NOW);
    expect(result.ok).toBe(true);
  });
});
