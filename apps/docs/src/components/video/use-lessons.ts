import lessonsData from '@/generated/lessons.json';

export interface LessonChapter {
  name: string;
  color: string;
  summary?: string;
}

export interface Lesson {
  slug: string;
  title: string;
  chapters: LessonChapter[];
}

const lessons = lessonsData as Record<string, Lesson>;

export function getLesson(slug: string): Lesson | undefined {
  return lessons[slug];
}
