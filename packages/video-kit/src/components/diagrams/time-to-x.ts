/**
 * Map a timestamp onto a bar of width `w`, clamped to the bar. The result is an
 * offset from the left edge; callers subtract `w / 2` to centre the bar.
 *
 * @example
 * timeToX(1767227400, 1767225600, 1767229200, 1000); // 500
 */
export function timeToX(t: number, from: number, to: number, w: number): number {
  if (to === from) return 0;
  const fraction = (t - from) / (to - from);
  return Math.max(0, Math.min(1, fraction)) * w;
}
