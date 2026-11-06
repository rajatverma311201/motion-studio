import {createFileRoute, notFound} from '@tanstack/react-router';
import {useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent} from 'react';
import {source} from '@/lib/source';
import {getStudioLesson} from '@/lib/studio-data';
import {pageTitle} from '@/lib/seo';
import {
  bulletCount,
  clampFontSize,
  DEFAULT_FONT_SIZE,
  parseTeleprompterSearch,
  stepPosition,
  type TeleprompterPosition,
  type TeleprompterStep,
} from '@/lib/teleprompter';

const FONT_KEY = 'motion-studio.teleprompter.font-size';
const CHAPTER_BACKGROUND: Record<string, string> = {
  lime: 'bg-lime-400',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-400',
  yellow: 'bg-yellow-400',
  violet: 'bg-violet-400',
  orange: 'bg-orange-400',
  red: 'bg-red-500',
};

export const Route = createFileRoute('/record/$slug')({
  validateSearch: (search: Record<string, unknown>): {c?: number; b?: number} => {
    const result: {c?: number; b?: number} = {};
    const c = Number(search.c);
    if (Number.isInteger(c) && search.c !== '' && search.c !== undefined) result.c = c;
    const b = Number(search.b);
    if (Number.isInteger(b) && search.b !== '' && search.b !== undefined) result.b = b;
    return result;
  },
  loader: ({params}) => {
    const lesson = getStudioLesson(params.slug);
    if (!lesson) throw notFound();
    const page = source.getPages().find(candidate => candidate.data.video === params.slug);
    return {lesson, lessonUrl: page?.url ?? '/docs'};
  },
  head: ({loaderData}) => ({
    meta: [{title: pageTitle(loaderData ? `Teleprompter · ${loaderData.lesson.title}` : 'Teleprompter')}],
  }),
  component: RecordPage,
});

function chapterBackground(color: string): string {
  return CHAPTER_BACKGROUND[color] ?? 'bg-fd-primary';
}

/** Render the backticks in a note as inline code without a markdown parser. */
function renderNote(note: string): ReactNode {
  const parts = note.split('`');
  if (parts.length === 1) return note;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className="rounded bg-fd-secondary px-1.5 py-0.5 font-mono text-[0.8em]">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

function readStoredFontSize(): number {
  if (typeof window === 'undefined') return DEFAULT_FONT_SIZE;
  try {
    const stored = window.localStorage.getItem(FONT_KEY);
    return stored === null ? DEFAULT_FONT_SIZE : clampFontSize(Number(stored));
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}

function storeFontSize(value: number): void {
  try {
    window.localStorage.setItem(FONT_KEY, String(value));
  } catch {
    // Private mode or a blocked storage API: the size still works for this visit.
  }
}

function isFormControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName);
}

function toggleFullscreen(): void {
  if (typeof document === 'undefined') return;
  try {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (document.fullscreenEnabled) {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  } catch {
    // Fullscreen is optional; browsers can refuse it without user activation.
  }
}

function RecordPage() {
  const {lesson, lessonUrl} = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const chapters = lesson.chapters;
  const position = useMemo(() => parseTeleprompterSearch(search, chapters), [search, chapters]);
  const chapter = chapters[position.chapter];
  const notes = chapter?.notes ?? [];

  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [legend, setLegend] = useState(false);
  const bulletRefs = useRef<Array<HTMLLIElement | null>>([]);
  const emptyRef = useRef<HTMLParagraphElement | null>(null);
  const touchStart = useRef<{x: number; y: number} | null>(null);

  useEffect(() => setFontSize(readStoredFontSize()), []);

  function go(next: TeleprompterPosition): void {
    if (next.chapter === position.chapter && next.bullet === position.bullet) return;
    void navigate({
      search: {c: next.chapter + 1, b: next.bullet + 1},
      replace: true,
      resetScroll: false,
    });
  }

  function move(step: TeleprompterStep): void {
    go(stepPosition(position, step, chapters));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey || isFormControl(event.target)) return;

      if (event.key === 'j' || event.key === 'J' || event.key === 'ArrowDown') {
        event.preventDefault();
        move('next-bullet');
      } else if (event.key === 'k' || event.key === 'K' || event.key === 'ArrowUp') {
        event.preventDefault();
        move('previous-bullet');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        move('next-chapter');
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        move('previous-chapter');
      } else if (event.key === 'Home') {
        event.preventDefault();
        move('first');
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key === '?') {
        event.preventDefault();
        setLegend(current => !current);
      } else if (event.key === 'Escape') {
        setLegend(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    const target = notes.length === 0 ? emptyRef.current : bulletRefs.current[position.bullet];
    if (!target) return;
    const frame = requestAnimationFrame(() => target.scrollIntoView({block: 'center', behavior: 'smooth'}));
    return () => cancelAnimationFrame(frame);
  }, [position.chapter, position.bullet, notes.length, fontSize, legend]);

  useEffect(() => {
    function recenter(): void {
      const target = notes.length === 0 ? emptyRef.current : bulletRefs.current[position.bullet];
      target?.scrollIntoView({block: 'center'});
    }

    window.addEventListener('resize', recenter);
    return () => window.removeEventListener('resize', recenter);
  }, [position.chapter, position.bullet, notes.length]);

  function changeFontSize(delta: number): void {
    setFontSize(current => {
      const next = clampFontSize(current + delta);
      storeFontSize(next);
      return next;
    });
  }

  function onTouchStart(event: TouchEvent<HTMLElement>): void {
    const touch = event.touches[0];
    touchStart.current = touch ? {x: touch.clientX, y: touch.clientY} : null;
  }

  function onTouchEnd(event: TouchEvent<HTMLElement>): void {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    move(dx < 0 ? 'next-chapter' : 'previous-chapter');
  }

  return (
    <div className="flex min-h-screen flex-col bg-fd-background text-fd-foreground">
      <header className="border-b border-fd-border bg-fd-card/60 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">Teleprompter</p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{lesson.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1" aria-label="Font size">
              <button
                type="button"
                aria-label="Smaller text"
                className="min-h-10 rounded-md border border-fd-border bg-fd-secondary px-3 text-sm font-medium text-fd-secondary-foreground hover:bg-fd-accent"
                onClick={event => {
                  changeFontSize(-4);
                  event.currentTarget.blur();
                }}
              >
                A−
              </button>
              <span className="w-14 text-center font-mono text-xs text-fd-muted-foreground">{fontSize} px</span>
              <button
                type="button"
                aria-label="Larger text"
                className="min-h-10 rounded-md border border-fd-border bg-fd-secondary px-3 text-sm font-medium text-fd-secondary-foreground hover:bg-fd-accent"
                onClick={event => {
                  changeFontSize(4);
                  event.currentTarget.blur();
                }}
              >
                A+
              </button>
            </div>
            <button
              type="button"
              className="min-h-10 rounded-md border border-fd-border bg-fd-secondary px-3 text-sm font-medium text-fd-secondary-foreground hover:bg-fd-accent"
              onClick={event => {
                toggleFullscreen();
                event.currentTarget.blur();
              }}
            >
              Fullscreen
            </button>
            <button
              type="button"
              aria-expanded={legend}
              className="min-h-10 rounded-md border border-fd-border bg-fd-secondary px-3 text-sm font-medium text-fd-secondary-foreground hover:bg-fd-accent"
              onClick={event => {
                setLegend(current => !current);
                event.currentTarget.blur();
              }}
            >
              Keys
            </button>
            <a
              href={lessonUrl}
              className="inline-flex min-h-10 items-center rounded-md px-2 text-sm font-medium text-fd-primary hover:underline"
            >
              Lesson page
            </a>
          </div>
        </div>

        <div className="mx-auto mt-4 flex w-full max-w-4xl flex-wrap gap-2" role="tablist" aria-label="Chapters">
          {chapters.map((item, index) => {
            const active = index === position.chapter;
            const background = chapterBackground(item.color);
            return (
              <button
                key={`${index}-${item.name}`}
                type="button"
                role="tab"
                aria-selected={active}
                data-chapter-index={index}
                className={`inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border px-3 text-left text-sm transition-colors ${
                  active
                    ? `border-transparent ${background} text-zinc-950`
                    : 'border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground'
                }`}
                onClick={event => {
                  go({chapter: index, bullet: 0});
                  event.currentTarget.blur();
                }}
              >
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 rounded-full ${active ? 'bg-zinc-950' : background}`}
                />
                <span className="font-mono text-xs">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 break-words">{item.name}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main
        className="flex-1 px-4 pb-48 pt-6 sm:px-6"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        data-teleprompter-main=""
      >
        <div className="mx-auto w-full max-w-4xl">
          {legend ? (
            <aside className="mb-8 rounded-lg border border-fd-border bg-fd-card p-4 text-sm">
              <h2 className="mb-2 font-semibold">Keyboard</h2>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                <li>
                  <kbd className="rounded border border-fd-border bg-fd-secondary px-1.5 py-0.5 font-mono text-xs">
                    J
                  </kbd>{' '}
                  /{' '}
                  <kbd className="rounded border border-fd-border bg-fd-secondary px-1.5 py-0.5 font-mono text-xs">
                    ↓
                  </kbd>{' '}
                  next bullet
                </li>
                <li>
                  <kbd className="rounded border border-fd-border bg-fd-secondary px-1.5 py-0.5 font-mono text-xs">
                    K
                  </kbd>{' '}
                  /{' '}
                  <kbd className="rounded border border-fd-border bg-fd-secondary px-1.5 py-0.5 font-mono text-xs">
                    ↑
                  </kbd>{' '}
                  previous bullet
                </li>
                <li>
                  <kbd className="rounded border border-fd-border bg-fd-secondary px-1.5 py-0.5 font-mono text-xs">
                    →
                  </kbd>{' '}
                  /{' '}
                  <kbd className="rounded border border-fd-border bg-fd-secondary px-1.5 py-0.5 font-mono text-xs">
                    ←
                  </kbd>{' '}
                  next / previous chapter
                </li>
                <li>
                  <kbd className="rounded border border-fd-border bg-fd-secondary px-1.5 py-0.5 font-mono text-xs">
                    Home
                  </kbd>{' '}
                  first chapter
                </li>
                <li>
                  <kbd className="rounded border border-fd-border bg-fd-secondary px-1.5 py-0.5 font-mono text-xs">
                    F
                  </kbd>{' '}
                  fullscreen
                </li>
                <li>
                  <kbd className="rounded border border-fd-border bg-fd-secondary px-1.5 py-0.5 font-mono text-xs">
                    ?
                  </kbd>{' '}
                  this list
                </li>
              </ul>
            </aside>
          ) : null}

          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-mono text-sm text-fd-muted-foreground">
              {String(position.chapter + 1).padStart(2, '0')}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{chapter?.name ?? 'Chapter'}</h2>
          </div>
          {chapter?.summary ? (
            <p className="mb-8 max-w-3xl text-base leading-7 text-fd-muted-foreground sm:text-lg">{chapter.summary}</p>
          ) : null}

          {notes.length === 0 ? (
            <p
              ref={emptyRef}
              className="scroll-mt-32 scroll-mb-40 rounded-lg border border-dashed border-fd-border bg-fd-card p-6 text-lg text-fd-muted-foreground"
            >
              No voiceover notes for this chapter.
            </p>
          ) : (
            <ol className="space-y-4" style={{fontSize: `${fontSize}px`, lineHeight: 1.35}}>
              {notes.map((note, index) => {
                const active = index === position.bullet;
                return (
                  <li
                    key={`${position.chapter}-${index}`}
                    ref={node => {
                      bulletRefs.current[index] = node;
                    }}
                    aria-current={active ? 'true' : undefined}
                    className={`scroll-mt-32 scroll-mb-40 break-words border-l-4 pl-4 ${
                      active
                        ? 'border-fd-primary font-medium text-fd-foreground'
                        : 'border-transparent text-fd-muted-foreground'
                    }`}
                  >
                    {renderNote(note)}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-fd-border bg-fd-background/95 px-3 py-2 backdrop-blur">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ['previous-chapter', '← Chapter'],
              ['previous-bullet', '↑ Bullet'],
              ['next-bullet', '↓ Bullet'],
              ['next-chapter', 'Chapter →'],
            ] as const
          ).map(([step, label]) => (
            <button
              key={step}
              type="button"
              className="min-h-12 rounded-lg border border-fd-border bg-fd-secondary px-3 text-sm font-medium text-fd-secondary-foreground hover:bg-fd-accent"
              onClick={event => {
                move(step);
                event.currentTarget.blur();
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mx-auto mt-1 max-w-4xl text-center text-xs text-fd-muted-foreground">
          Bullet {position.bullet + 1} / {bulletCount(chapter)} · J / K · ← / → · ? for keys
        </p>
      </div>
    </div>
  );
}
