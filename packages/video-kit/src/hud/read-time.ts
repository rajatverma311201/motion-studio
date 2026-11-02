/**
 * The time a caption must stay on screen: `max(2.5, characters / 14)` seconds.
 * Pure, so lesson tests can check pacing without running a scene.
 *
 * @example
 * readSeconds('Every login ends in a string like this.'); // 2.786
 */
export function readSeconds(text: string): number {
  return Math.max(2.5, text.length / 14);
}
