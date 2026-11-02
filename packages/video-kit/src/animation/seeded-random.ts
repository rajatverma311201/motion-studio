/**
 * Mulberry32: a small deterministic PRNG. Scenes must not use `Math.random`,
 * because two renders of the same frame have to look identical.
 *
 * @example
 * const random = seededRandom(42);
 * random(); // a value in [0, 1), the same on every render
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
