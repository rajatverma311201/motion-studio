import {getLesson} from './use-lessons';

export interface ChapterListProps {
  slug: string;
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function ChapterList({slug, activeIndex, onSelect}: ChapterListProps) {
  const lesson = getLesson(slug);
  if (!lesson) return null;

  return (
    <div className="my-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-fd-muted-foreground">Jump to a chapter</h2>
        <button
          type="button"
          className="rounded-md border border-fd-border bg-fd-secondary px-3 py-1.5 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          onClick={() => onSelect(0)}
        >
          Play from the start
        </button>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2">
        {lesson.chapters.map((chapter, index) => {
          const active = index === activeIndex;

          return (
            <li key={`${index}-${chapter.name}`}>
              <button
                type="button"
                className={`flex w-full items-start gap-3 rounded-lg border border-l-4 border-fd-border px-3 py-2 text-left text-sm transition-colors hover:bg-fd-accent ${
                  active ? 'border-l-fd-primary bg-fd-accent' : 'border-l-transparent bg-fd-card'
                }`}
                aria-current={active ? 'true' : undefined}
                data-chapter-index={index}
                onClick={() => onSelect(index)}
              >
                <span className="font-mono text-xs text-fd-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{chapter.name}</span>
                  {chapter.summary ? (
                    <span className="mt-0.5 block text-xs leading-5 text-fd-muted-foreground">{chapter.summary}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
