import {decodeBase64UrlText} from './base64url';

/** The three parts of a JWT plus the signing input the signature covers. */
export interface SplitToken {
  header: string;
  payload: string;
  signature: string;
  signingInput: string;
}

/** What {@link describeToken} reports about a token. */
export interface TokenDescription {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  lengths: {
    token: number;
    header: number;
    payload: number;
    signature: number;
    signingInput: number;
  };
}

/**
 * Split a JWT into its three parts. Throws unless the token has exactly three
 * non-empty parts joined by dots.
 *
 * @example
 * splitToken(token).signingInput; // 'header.payload'
 */
export function splitToken(token: string): SplitToken {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => part.length === 0)) {
    throw new Error(`Invalid JWT: expected exactly three non-empty parts joined by dots, got ${parts.length} part(s).`);
  }

  const [header, payload, signature] = parts;
  return {header, payload, signature, signingInput: `${header}.${payload}`};
}

/**
 * Decode one Base64URL part as JSON.
 *
 * @example
 * decodeJson('eyJhbGciOiJIUzI1NiJ9'); // {alg: 'HS256'}
 */
export function decodeJson(part: string): unknown {
  const text = decodeBase64UrlText(part);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Invalid JWT part: not JSON (${JSON.stringify(text.slice(0, 40))})`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Describe a JWT: parsed header and payload, the signature and every length.
 *
 * @example
 * describeToken(JWT_TOKEN).lengths.token; // 187
 */
export function describeToken(token: string): TokenDescription {
  const {header, payload, signature, signingInput} = splitToken(token);
  const headerJson = decodeJson(header);
  const payloadJson = decodeJson(payload);

  if (!isRecord(headerJson) || !isRecord(payloadJson)) {
    throw new Error('Invalid JWT: the header and payload must both be JSON objects.');
  }

  return {
    header: headerJson,
    payload: payloadJson,
    signature,
    lengths: {
      token: token.length,
      header: header.length,
      payload: payload.length,
      signature: signature.length,
      signingInput: signingInput.length,
    },
  };
}
