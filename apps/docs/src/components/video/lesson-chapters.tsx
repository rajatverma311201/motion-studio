import {getLesson} from './use-lessons';

export interface LessonChaptersProps {
  slug: string;
}

/** Static chapter overview for the MDX body: no player and no interaction. */
export function LessonChapters({slug}: LessonChaptersProps) {
  const lesson = getLesson(slug);

  if (!lesson) {
    return (
      <p
        className="my-6 rounded-lg border border-fd-border bg-fd-card p-4 text-sm text-fd-muted-foreground"
        role="alert"
      >
        No lesson data for <code>{slug}</code>. Run <code>pnpm sync</code> in the repo root.
      </p>
    );
  }

  return (
    <ol className="my-6 grid gap-2 sm:grid-cols-2">
      {lesson.chapters.map((chapter, index) => (
        <li
          key={`${index}-${chapter.name}`}
          className="flex items-start gap-3 rounded-lg border border-fd-border bg-fd-card px-3 py-2 text-sm"
        >
          <span className="font-mono text-xs text-fd-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{chapter.name}</span>
            {chapter.summary ? (
              <span className="mt-0.5 block text-xs leading-5 text-fd-muted-foreground">{chapter.summary}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
