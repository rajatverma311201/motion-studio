import {createFileRoute} from '@tanstack/react-router';
import {HomeLayout} from 'fumadocs-ui/layouts/home';
import {useState} from 'react';
import {StatusBadge} from '@/components/notes/status-badge';
import {baseOptions} from '@/lib/layout.shared';
import {getLessons, lookLabel, statusCounts, type Lesson} from '@/lib/lessons';
import {LESSON_STATUSES, type LessonStatus} from '@/lib/status';
import {pageTitle, siteDescription} from '@/lib/seo';

export const Route = createFileRoute('/')({
  component: TrackerPage,
  head: () => ({
    meta: [{title: pageTitle('Video tracker')}, {name: 'description', content: siteDescription}],
  }),
});

const NEXT_ACTIONS: Record<Exclude<LessonStatus, 'published'>, (title: string) => string> = {
  outline: title => `Write the voiceover notes for ${title}.`,
  animated: title => `Render ${title} to MP4.`,
  rendered: title => `Record the voiceover for ${title}.`,
  voiced: title => `Publish ${title} and add the YouTube link.`,
};

function nextAction(lesson: Lesson): string | null {
  if (lesson.status === 'published') return null;
  return NEXT_ACTIONS[lesson.status](lesson.title);
}

function YouTubeIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
    </svg>
  );
}

function TrackerPage() {
  const lessons = getLessons();
  const counts = statusCounts(lessons);
  const [statusFilter, setStatusFilter] = useState<LessonStatus | null>(null);
  const [query, setQuery] = useState('');

  const filtered = lessons.filter(lesson => {
    const matchesStatus = statusFilter === null || lesson.status === statusFilter;
    const matchesQuery = lesson.title.toLowerCase().includes(query.trim().toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const actions = lessons.flatMap(lesson => {
    const text = nextAction(lesson);
    return text ? [{lesson, text}] : [];
  });

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6">
        <header>
          <p className="text-sm font-medium text-fd-muted-foreground">Motion Studio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Video tracker</h1>
          <p className="mt-3 max-w-3xl text-fd-muted-foreground">
            Every video from first outline to published, with its chapters, duration, render look and YouTube link.
            These docs are the recording companion; the videos themselves use their own theme.
          </p>
        </header>

        <section className="mt-8" aria-label="Lessons by status">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {LESSON_STATUSES.map(status => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  data-status-filter={status}
                  data-status-count={counts[status]}
                  aria-pressed={active}
                  onClick={() => setStatusFilter(current => (current === status ? null : status))}
                  className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-fd-accent ${
                    active ? 'border-fd-primary bg-fd-accent' : 'border-fd-border bg-fd-card'
                  }`}
                >
                  <span className="text-2xl font-semibold tabular-nums">{counts[status]}</span>
                  <StatusBadge status={status} />
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8" aria-label="Lesson table">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Filter by title
              <input
                type="search"
                value={query}
                data-title-filter=""
                onChange={event => setQuery(event.target.value)}
                placeholder="Type a lesson title"
                className="w-64 max-w-full rounded-md border border-fd-border bg-fd-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
              />
            </label>
            {statusFilter ? (
              <button
                type="button"
                className="rounded-md border border-fd-border bg-fd-secondary px-3 py-1.5 text-sm font-medium hover:bg-fd-accent"
                onClick={() => setStatusFilter(null)}
              >
                Clear status filter: {statusFilter}
              </button>
            ) : null}
          </div>

          <div className="mt-3 w-full overflow-x-auto rounded-lg border border-fd-border">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead className="bg-fd-muted text-xs text-fd-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Course</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Chapters</th>
                  <th className="px-3 py-2 font-medium">Duration</th>
                  <th className="px-3 py-2 font-medium">Look</th>
                  <th className="px-3 py-2 font-medium">YouTube</th>
                  <th className="px-3 py-2 font-medium">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fd-border">
                {filtered.map(lesson => (
                  <tr key={lesson.url} data-lesson-row={lesson.video} className="align-top">
                    <td className="px-3 py-3 tabular-nums text-fd-muted-foreground">
                      {String(lessons.indexOf(lesson) + 1).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <a href={lesson.url} className="font-medium text-fd-primary hover:underline">
                        {lesson.title}
                      </a>
                      {lesson.studio ? null : (
                        <span className="mt-0.5 block text-xs text-fd-muted-foreground">no studio project</span>
                      )}
                    </td>
                    <td className="px-3 py-3">{lesson.course}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={lesson.status} />
                    </td>
                    <td className="px-3 py-3 tabular-nums">{lesson.studio ? lesson.chapters : '—'}</td>
                    <td
                      className={`px-3 py-3 tabular-nums ${lesson.duration === 'TBD' ? 'text-fd-muted-foreground' : ''}`}
                    >
                      {lesson.duration}
                    </td>
                    <td className="px-3 py-3">{lookLabel(lesson.look) || '—'}</td>
                    <td className="px-3 py-3">
                      {lesson.youtube ? (
                        <a
                          href={lesson.youtube}
                          className="inline-flex items-center gap-1.5 font-medium text-fd-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <YouTubeIcon />
                          Watch
                        </a>
                      ) : (
                        <span className="text-fd-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`px-3 py-3 tabular-nums ${lesson.recorded ? '' : 'text-fd-muted-foreground'}`}>
                      {lesson.recorded ?? '—'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-fd-muted-foreground">
                      No lessons match.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10" aria-label="Next actions">
          <h2 className="text-lg font-semibold tracking-tight">Next actions</h2>
          {actions.length === 0 ? (
            <p className="mt-2 text-sm text-fd-muted-foreground">Nothing pending. Every lesson is published.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {actions.map(({lesson, text}) => (
                <li key={lesson.url} className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status={lesson.status} />
                  <a href={lesson.url} className="text-fd-primary hover:underline">
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </HomeLayout>
  );
}
