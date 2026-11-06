/**
 * Stable identifiers for caption beats.
 *
 * A beat id is `CC-BB`: the chapter and beat numbers are 1-based and padded to
 * two digits, so `03-02` is the second caption of the third chapter. The id is
 * used as the clip filename, the manifest key and the timing entry.
 */

/** A parsed beat id: both numbers are 1-based. */
export interface BeatId {
  chapter: number;
  beat: number;
}

const BEAT_ID = /^(\d{2})-(\d{2})$/;

/**
 * Build the zero-padded, 1-based beat id.
 *
 * @example
 * beatId(3, 2); // '03-02'
 */
export function beatId(chapter: number, beat: number): string {
  return `${String(chapter).padStart(2, '0')}-${String(beat).padStart(2, '0')}`;
}

/**
 * Parse a beat id, or return `null` when it is not `CC-BB`.
 *
 * @example
 * parseBeatId('03-02'); // {chapter: 3, beat: 2}
 * parseBeatId('../etc'); // null
 */
export function parseBeatId(id: string): BeatId | null {
  const match = BEAT_ID.exec(id);
  if (!match) return null;
  return {chapter: Number(match[1]), beat: Number(match[2])};
}

/**
 * The presenter's slide name: the beat id plus the caption, trimmed to 48
 * characters. Control characters become spaces and trailing punctuation is
 * dropped, because slide names are also used as labels in the editor's list.
 *
 * @example
 * slideName(1, 1, 'A transaction groups many steps into one unit.'); // '01-01 · A transaction groups many steps into one unit'
 */
export function slideName(chapter: number, beat: number, caption: string): string {
  const cleaned = caption
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const trimmed = cleaned
    .slice(0, 48)
    .replace(/[\s.,;:!?…]+$/u, '')
    .trim();
  return `${beatId(chapter, beat)} · ${trimmed}`;
}
