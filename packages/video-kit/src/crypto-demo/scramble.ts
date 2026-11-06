import {seededRandom} from '../animation/seeded-random';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Options for {@link scrambleFrame}. */
export interface ScrambleFrameOptions {
  /**
   * What unresolved positions show. `noise` (the default) draws a glyph from
   * the fixed set; `from` keeps the old character where one still exists.
   */
  fallback?: 'noise' | 'from';
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

function noiseAt(index: number, seed: number): string {
  const random = seededRandom(seed + index);
  return GLYPHS[Math.floor(random() * GLYPHS.length)];
}

/**
 * The string a text morph shows at `progress`: characters resolve left to
 * right into `to`, unresolved positions show a deterministic glyph, and the
 * length moves linearly from `from.length` to `to.length`.
 *
 * Pure and deterministic: the same inputs always produce the same frame, so
 * two renders of the same scene look identical.
 *
 * @example
 * scrambleFrame('pay 500', 'cGF5IDUwMA==', 0, 7); // a 7-character noise string
 * scrambleFrame('pay 500', 'cGF5IDUwMA==', 1, 7); // 'cGF5IDUwMA=='
 */
export function scrambleFrame(
  from: string,
  to: string,
  progress: number,
  seed: number,
  options: ScrambleFrameOptions = {},
): string {
  const p = clamp(progress);
  if (p >= 1) return to;

  const fallback = options.fallback ?? 'noise';
  const length = Math.round(from.length + (to.length - from.length) * p);
  const resolved = Math.floor(p * to.length);
  let out = '';

  for (let index = 0; index < length; index++) {
    if (index < resolved) {
      out += to[index];
    } else if (fallback === 'from' && index < from.length) {
      out += from[index];
    } else {
      out += noiseAt(index, seed);
    }
  }

  return out;
}
