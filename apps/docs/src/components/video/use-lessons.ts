import lessonsData from '@/generated/lessons.json';

export type ChapterColor = 'lime' | 'pink' | 'cyan' | 'yellow' | 'violet' | 'orange' | 'red';

export interface LessonChapter {
  name: string;
  color: ChapterColor;
  summary?: string;
}

export interface Lesson {
  slug: string;
  title: string;
  chapters: LessonChapter[];
}

/** Palette mirror of the studio theme; keep the names and hex values in sync. */
const COLORS: Record<ChapterColor, string> = {
  lime: '#C6FF3D',
  pink: '#FF4D8D',
  cyan: '#3DE3FF',
  yellow: '#FFD23D',
  violet: '#9B7BFF',
  orange: '#FF8A3D',
  red: '#FF4D4D',
};

const lessons = lessonsData as Record<string, Lesson>;

export function getLesson(slug: string): Lesson | undefined {
  return lessons[slug];
}

export function chapterColorVar(name: string): string {
  return COLORS[name as ChapterColor] ?? '#9A99A8';
}
