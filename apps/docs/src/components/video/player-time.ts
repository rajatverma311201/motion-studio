/**
 * Format a frame count as `m:ss` at the given frame rate.
 *
 * @example
 * formatPlayerTime(90, 30); // "0:03"
 */
export function formatPlayerTime(frame: number, fps: number): string {
  const rate = Number.isFinite(fps) && fps > 0 ? fps : 60;
  const seconds = Math.max(0, Math.floor(frame / rate));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
