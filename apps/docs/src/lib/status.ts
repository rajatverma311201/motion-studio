export const LESSON_STATUSES = ['outline', 'animated', 'rendered', 'voiced', 'published'] as const;

export type LessonStatus = (typeof LESSON_STATUSES)[number];

export function isLessonStatus(value: unknown): value is LessonStatus {
  return typeof value === 'string' && (LESSON_STATUSES as readonly string[]).includes(value);
}

/** Statuses that still need work, in pipeline order. Published is not a next action. */
export const ACTIVE_STATUSES = ['outline', 'animated', 'rendered', 'voiced'] as const;
