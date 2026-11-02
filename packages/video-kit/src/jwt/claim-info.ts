/** The seven registered JWT payload claims. */
export type RegisteredClaimName = 'iss' | 'sub' | 'aud' | 'exp' | 'nbf' | 'iat' | 'jti';

/** One registered claim and the one-line meaning shown next to it. */
export interface RegisteredClaim {
  name: RegisteredClaimName;
  meaning: string;
}

/** Registered claims in the order the anatomy chapter lists them. */
export const REGISTERED_CLAIMS: readonly RegisteredClaim[] = [
  {name: 'iss', meaning: 'who issued the token'},
  {name: 'sub', meaning: 'who the token is about'},
  {name: 'aud', meaning: 'which service it is for'},
  {name: 'exp', meaning: 'when it stops being valid'},
  {name: 'nbf', meaning: 'not valid before this time'},
  {name: 'iat', meaning: 'when it was issued'},
  {name: 'jti', meaning: 'a unique token id'},
];
