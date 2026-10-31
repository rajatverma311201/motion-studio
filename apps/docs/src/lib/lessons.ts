import {source} from '@/lib/source';

export type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Lesson {
  slug: string;
  url: string;
  title: string;
  description: string;
  course: string;
  video: string;
  duration: string;
  level: LessonLevel;
  tags: string[];
}

interface PageDataLike {
  status?: 'draft' | 'published';
  video?: string;
}

interface TitledPageLike {
  data: {
    title: string;
  };
}

export function filterPublished<T extends {data: PageDataLike}>(pages: readonly T[]): T[] {
  return pages.filter(page => (page.data.status ?? 'published') === 'published' && Boolean(page.data.video));
}

export function sortLessons<T extends TitledPageLike>(pages: readonly T[]): T[] {
  return [...pages].sort((a, b) => a.data.title.localeCompare(b.data.title, 'en'));
}

function courseName(slug: string | undefined): string {
  if (!slug) return 'Lessons';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export function getLessons(): Lesson[] {
  return sortLessons(filterPublished(source.getPages())).map(page => ({
    slug: page.slugs.at(-1) ?? '',
    url: page.url,
    title: page.data.title,
    description: page.data.description ?? '',
    course: courseName(page.slugs[0]),
    video: page.data.video ?? '',
    duration: page.data.duration ?? '',
    level: page.data.level ?? 'beginner',
    tags: page.data.tags ?? [],
  }));
}
