/**
 * Pure helpers for the `/record/<slug>` teleprompter.
 *
 * The URL is the position: `?c=1&b=1` is the first bullet of the first
 * chapter (1-based for humans), and the helpers clamp every invalid value into
 * the current lesson. A chapter without notes is still one step, so `J` always
 * moves somewhere and the "no notes" state can be focused.
 */

export interface TeleprompterChapter {
  notes?: string[];
}

/** Zero-based chapter and bullet indexes. */
export interface TeleprompterPosition {
  chapter: number;
  bullet: number;
}

export type TeleprompterStep = 'next-bullet' | 'previous-bullet' | 'next-chapter' | 'previous-chapter' | 'first';

export const DEFAULT_FONT_SIZE = 40;
export const MIN_FONT_SIZE = 24;
export const MAX_FONT_SIZE = 96;

function integer(value: unknown): number | null {
  if (typeof value === 'number') return Number.isInteger(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  }
  return null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/** How many focus steps a chapter has; an empty chapter still has one. */
export function bulletCount(chapter: TeleprompterChapter | undefined): number {
  return Math.max(1, chapter?.notes?.length ?? 0);
}

/**
 * Validate and clamp the `?c` and `?b` search params. The URL is 1-based;
 * a missing, fractional or out-of-range value falls back to the nearest valid
 * position.
 *
 * @example
 * parseTeleprompterSearch({c: '2', b: '3'}, lesson.chapters); // {chapter: 1, bullet: 2}
 */
export function parseTeleprompterSearch(
  search: {c?: unknown; b?: unknown},
  chapters: readonly TeleprompterChapter[],
): TeleprompterPosition {
  if (chapters.length === 0) return {chapter: 0, bullet: 0};

  const requestedChapter = integer(search.c);
  const chapter = requestedChapter === null ? 0 : clamp(requestedChapter - 1, 0, chapters.length - 1);

  const requestedBullet = integer(search.b);
  const maximum = bulletCount(chapters[chapter]) - 1;
  const bullet = requestedBullet === null ? 0 : clamp(requestedBullet - 1, 0, maximum);

  return {chapter, bullet};
}

/**
 * Move one focus step. `next-bullet` rolls into the next chapter and
 * `previous-bullet` rolls back to the previous chapter's last bullet; both
 * stop at the ends of the lesson. Chapter steps always land on the first
 * bullet of the target chapter.
 *
 * @example
 * stepPosition({chapter: 0, bullet: 2}, 'next-bullet', chapters); // rolls into chapter 1
 */
export function stepPosition(
  position: TeleprompterPosition,
  step: TeleprompterStep,
  chapters: readonly TeleprompterChapter[],
): TeleprompterPosition {
  if (chapters.length === 0) return {chapter: 0, bullet: 0};

  const current = {
    chapter: clamp(position.chapter, 0, chapters.length - 1),
    bullet: clamp(position.bullet, 0, bulletCount(chapters[position.chapter]) - 1),
  };

  if (step === 'first') return {chapter: 0, bullet: 0};
  if (step === 'next-chapter') return {chapter: Math.min(chapters.length - 1, current.chapter + 1), bullet: 0};
  if (step === 'previous-chapter') return {chapter: Math.max(0, current.chapter - 1), bullet: 0};

  if (step === 'next-bullet') {
    if (current.bullet + 1 < bulletCount(chapters[current.chapter])) {
      return {chapter: current.chapter, bullet: current.bullet + 1};
    }
    if (current.chapter + 1 < chapters.length) {
      return {chapter: current.chapter + 1, bullet: 0};
    }
    return current;
  }

  if (current.bullet > 0) return {chapter: current.chapter, bullet: current.bullet - 1};
  if (current.chapter > 0) {
    const previous = current.chapter - 1;
    return {chapter: previous, bullet: bulletCount(chapters[previous]) - 1};
  }
  return current;
}

/**
 * Keep the teleprompter font readable: 24 to 96 px, default 40.
 *
 * @example
 * clampFontSize(12); // 24
 * clampFontSize(Number.NaN); // 40
 */
export function clampFontSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FONT_SIZE;
  return clamp(Math.round(value), MIN_FONT_SIZE, MAX_FONT_SIZE);
}
