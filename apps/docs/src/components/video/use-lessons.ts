import {getStudioLesson, type StudioLesson} from '@/lib/studio-data';

export type Lesson = StudioLesson;

export function getLesson(slug: string): Lesson | undefined {
  return getStudioLesson(slug);
}
