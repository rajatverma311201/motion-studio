import lessonsData from '@/generated/lessons.json';

export interface StudioChapter {
  name: string;
  color: string;
  summary?: string;
  at?: string;
}

export interface StudioLook {
  theme: string;
  themeName: string;
  mode: 'dark' | 'light';
}

export interface StudioLesson {
  slug: string;
  title: string;
  chapters: StudioChapter[];
  summaryPoints?: string[];
  look?: StudioLook;
}

const lessons = lessonsData as Record<string, StudioLesson>;

/** One lesson from apps/docs/src/generated/lessons.json, if the studio project exists. */
export function getStudioLesson(slug: string): StudioLesson | undefined {
  return lessons[slug];
}
