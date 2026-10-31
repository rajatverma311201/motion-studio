import type * as PageTree from 'fumadocs-core/page-tree';
import type {LessonStatus} from '@/lib/status';
import {getStudioLesson, type StudioLesson, type StudioLook} from '@/lib/studio-data';
import {source} from '@/lib/source';

export type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Lesson {
  slug: string;
  url: string;
  title: string;
  description: string;
  course: string;
  courseSlug: string;
  video: string;
  status: LessonStatus;
  duration: string;
  youtube?: string;
  recorded?: string;
  level: LessonLevel;
  tags: string[];
  studio?: StudioLesson;
  chapters: number;
  look?: StudioLook;
  order: number;
}

export function courseName(slug: string | undefined): string {
  if (!slug) return 'Lessons';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export function lookLabel(look: StudioLook | undefined): string {
  if (!look) return '';
  return `${look.themeName} · ${look.mode === 'dark' ? 'Dark' : 'Light'}`;
}

export function statusCounts(lessons: readonly {status: LessonStatus}[]): Record<LessonStatus, number> {
  const counts: Record<LessonStatus, number> = {
    outline: 0,
    animated: 0,
    rendered: 0,
    voiced: 0,
    published: 0,
  };
  for (const lesson of lessons) counts[lesson.status] += 1;
  return counts;
}

/** Page order as defined by each folder's meta.json, via the generated page tree. */
function pageOrder(tree: PageTree.Root): Map<string, number> {
  const order = new Map<string, number>();
  let next = 0;

  const visit = (nodes: PageTree.Node[]): void => {
    for (const node of nodes) {
      if (node.type === 'page') {
        order.set(node.url, next++);
      } else if (node.type === 'folder') {
        if (node.index) order.set(node.index.url, next++);
        visit(node.children);
      }
    }
  };

  visit(tree.children);
  return order;
}

export function getLessons(): Lesson[] {
  const order = pageOrder(source.getPageTree());

  const lessons = source.getPages().flatMap(page => {
    const video = page.data.video;
    if (!video) return [];

    const studio = getStudioLesson(video);

    return [
      {
        slug: page.slugs.at(-1) ?? '',
        url: page.url,
        title: page.data.title,
        description: page.data.description ?? '',
        course: courseName(page.slugs[0]),
        courseSlug: page.slugs[0] ?? '',
        video,
        status: page.data.status,
        duration: page.data.duration,
        youtube: page.data.youtube,
        recorded: page.data.recorded,
        level: page.data.level,
        tags: page.data.tags,
        studio,
        chapters: studio?.chapters.length ?? 0,
        look: studio?.look,
        order: order.get(page.url) ?? Number.MAX_SAFE_INTEGER,
      } satisfies Lesson,
    ];
  });

  return lessons.sort(
    (a, b) => a.course.localeCompare(b.course, 'en') || a.order - b.order || a.title.localeCompare(b.title, 'en'),
  );
}
