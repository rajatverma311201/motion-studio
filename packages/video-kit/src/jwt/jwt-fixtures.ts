import type {ColorName} from '../theme';

/** The three parts of a JWT, without the dots. */
export type JwtPart = 'header' | 'payload' | 'signature';

/** Demo secret. Never use this value for anything real. */
export const JWT_SECRET = 'demo-secret-do-not-use';

/** Header JSON: HS256 and the JWT type. */
export const JWT_HEADER_JSON = '{"alg":"HS256","typ":"JWT"}';

/** Payload JSON: a normal user claim set, issued at 2026-01-01T00:00:00Z for one hour. */
export const JWT_PAYLOAD_JSON = '{"sub":"user_42","name":"Asha","role":"user","iat":1767225600,"exp":1767229200}';

/** The same payload with `role` changed from user to admin. */
export const JWT_TAMPERED_PAYLOAD_JSON =
  '{"sub":"user_42","name":"Asha","role":"admin","iat":1767225600,"exp":1767229200}';

/** Base64URL of {@link JWT_HEADER_JSON}. */
export const JWT_HEADER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

/** Base64URL of {@link JWT_PAYLOAD_JSON}. */
export const JWT_PAYLOAD =
  'eyJzdWIiOiJ1c2VyXzQyIiwibmFtZSI6IkFzaGEiLCJyb2xlIjoidXNlciIsImlhdCI6MTc2NzIyNTYwMCwiZXhwIjoxNzY3MjI5MjAwfQ';

/** Base64URL of {@link JWT_TAMPERED_PAYLOAD_JSON}. */
export const JWT_TAMPERED_PAYLOAD =
  'eyJzdWIiOiJ1c2VyXzQyIiwibmFtZSI6IkFzaGEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjcyMjU2MDAsImV4cCI6MTc2NzIyOTIwMH0';

/** HMAC-SHA256(secret, header + '.' + payload), Base64URL. */
export const JWT_SIGNATURE = 'XpQ15Es-zDMCww0SYkNdghfxin0vTSzIGtKylaGqnvI';

/** What the server computes for the tampered signing input. */
export const JWT_TAMPERED_SIGNATURE = '_dyqMnm3m5YdyaMJ9eMfaPALsAVi29-pXUOoWxv_SEk';

/** The signing input the original signature covers. */
export const JWT_SIGNING_INPUT = `${JWT_HEADER}.${JWT_PAYLOAD}`;

/** The signing input an attacker would need a new signature for. */
export const JWT_TAMPERED_SIGNING_INPUT = `${JWT_HEADER}.${JWT_TAMPERED_PAYLOAD}`;

/** A valid token: header.payload.signature, 187 characters. */
export const JWT_TOKEN = `${JWT_HEADER}.${JWT_PAYLOAD}.${JWT_SIGNATURE}`;

/** The tampered payload with the original, now invalid, signature. */
export const JWT_TAMPERED_TOKEN = `${JWT_HEADER}.${JWT_TAMPERED_PAYLOAD}.${JWT_SIGNATURE}`;

/** Series colours for the three parts. Dots use `colors.ink`. */
export const JWT_PART_COLOR: Record<JwtPart, ColorName> = {
  header: 'pink',
  payload: 'cyan',
  signature: 'lime',
};
