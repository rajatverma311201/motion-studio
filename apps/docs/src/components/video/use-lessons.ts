import lessonsData from '@/generated/lessons.json';

export interface LessonChapter {
  name: string;
  color: string;
  summary?: string;
  at?: string;
}

export interface LessonLook {
  theme: string;
  themeName: string;
  mode: 'dark' | 'light';
}

export interface Lesson {
  slug: string;
  title: string;
  chapters: LessonChapter[];
  summaryPoints?: string[];
  look?: LessonLook;
}

const lessons = lessonsData as Record<string, Lesson>;

export function getLesson(slug: string): Lesson | undefined {
  return lessons[slug];
}
