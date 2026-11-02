/** The four claims the server always checks after the signature. */
export type ClaimCheckName = 'exp' | 'nbf' | 'iss' | 'aud';

/** One line of the server's claim checklist. */
export interface ClaimCheck {
  name: ClaimCheckName;
  ok: boolean;
  /** Short human-readable explanation for the screen. */
  detail: string;
}

/** What the caller expects the token to say. */
export interface ValidateClaimsOptions {
  /** Expected `iss`. When omitted, the issuer is not checked. */
  issuer?: string;
  /** Expected `aud`. A payload audience array passes when it contains this value. */
  audience?: string;
  /** Tolerance in seconds for clock differences between machines. Defaults to 0. */
  skewSeconds?: number;
}

/** The full result of {@link validateClaims}. */
export interface ValidateClaimsResult {
  ok: boolean;
  checks: ClaimCheck[];
}

function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Check `exp`, `nbf`, `iss` and `aud` against a fixed time.
 *
 * Pure and deterministic: the caller supplies `now`, so a scene can show the
 * same result on every render. A missing `exp`, `iss` or `aud` only passes when
 * the caller did not ask for it; a missing `nbf` is simply unconstrained.
 *
 * @example
 * validateClaims({exp: 1767229200, iss: 'auth.example.com'}, 1767225600, {
 *   issuer: 'auth.example.com',
 *   skewSeconds: 5,
 * });
 */
export function validateClaims(
  payload: Record<string, unknown>,
  now: number,
  options: ValidateClaimsOptions = {},
): ValidateClaimsResult {
  const skew = Math.max(0, options.skewSeconds ?? 0);
  const checks: ClaimCheck[] = [];

  const exp = numeric(payload.exp);
  if (exp === null) {
    checks.push({name: 'exp', ok: true, detail: 'no exp claim'});
  } else if (now <= exp + skew) {
    checks.push({name: 'exp', ok: true, detail: `expires in ${Math.max(0, Math.round(exp - now))} s`});
  } else {
    checks.push({name: 'exp', ok: false, detail: `expired ${Math.round(now - exp)} s ago`});
  }

  const nbf = numeric(payload.nbf);
  if (nbf === null) {
    checks.push({name: 'nbf', ok: true, detail: 'no nbf claim'});
  } else if (now + skew >= nbf) {
    checks.push({name: 'nbf', ok: true, detail: `valid since ${Math.round(nbf)}`});
  } else {
    checks.push({name: 'nbf', ok: false, detail: `not valid for another ${Math.round(nbf - now)} s`});
  }

  if (options.issuer === undefined) {
    checks.push({name: 'iss', ok: true, detail: 'issuer not required'});
  } else if (payload.iss === options.issuer) {
    checks.push({name: 'iss', ok: true, detail: `issuer is ${options.issuer}`});
  } else {
    checks.push({name: 'iss', ok: false, detail: `issuer is ${JSON.stringify(payload.iss ?? null)}`});
  }

  if (options.audience === undefined) {
    checks.push({name: 'aud', ok: true, detail: 'audience not required'});
  } else {
    const aud = payload.aud;
    const values = Array.isArray(aud) ? aud : [aud];
    const matches = values.some(value => value === options.audience);
    checks.push({
      name: 'aud',
      ok: matches,
      detail: matches ? `audience includes ${options.audience}` : `audience is ${JSON.stringify(aud ?? null)}`,
    });
  }

  return {ok: checks.every(check => check.ok), checks};
}
