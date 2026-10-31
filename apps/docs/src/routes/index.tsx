import {createFileRoute, Link} from '@tanstack/react-router';
import {HomeLayout} from 'fumadocs-ui/layouts/home';
import {baseOptions} from '@/lib/layout.shared';
import {getLessons} from '@/lib/lessons';
import {pageTitle, siteDescription} from '@/lib/seo';

const navLinks = [
  {type: 'main' as const, text: 'Docs', url: '/docs'},
  {type: 'main' as const, text: 'Databases', url: '/docs/databases'},
];

const steps = [
  {
    title: 'Watch',
    description: 'Each lesson is a short animated explainer. Captions carry the narration, so no sound is required.',
  },
  {
    title: 'Jump to a chapter',
    description: 'Every video is split into labelled sections, so you can go straight to the part you need.',
  },
  {
    title: 'Read the notes',
    description: 'The lesson page repeats the ideas in text, with a cheat sheet, common mistakes, and runnable SQL.',
  },
];

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => ({
    meta: [{title: pageTitle()}, {name: 'description', content: siteDescription}],
  }),
});

function HomePage() {
  const lessons = getLessons();

  return (
    <HomeLayout {...baseOptions()} links={navLinks}>
      <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-12 sm:px-8">
        <section>
          <p className="text-sm font-medium text-fd-muted-foreground">Motion Studio</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Learn how software works</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-fd-muted-foreground">
            Animated explainers for the database ideas that show up in real systems. Watch the video, jump to a chapter,
            then read the notes and run the examples.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/docs/$"
              params={{_splat: ''}}
              className="rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
            >
              Browse lessons
            </Link>
            <Link
              to="/docs/$"
              params={{_splat: 'databases'}}
              className="rounded-lg border border-fd-border bg-fd-card px-4 py-2 text-sm font-medium"
            >
              Databases course
            </Link>
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fd-muted-foreground">Library</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Latest lessons</h2>
            </div>
            <Link to="/docs/$" params={{_splat: ''}} className="text-sm font-medium text-fd-primary">
              All lessons
            </Link>
          </div>

          {lessons.length === 0 ? (
            <p className="text-fd-muted-foreground">No lessons are published yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map(lesson => {
                const splat = lesson.url.replace(/^\/docs\/?/, '');

                return (
                  <Link
                    key={lesson.url}
                    to="/docs/$"
                    params={{_splat: splat}}
                    className="flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
                  >
                    <p className="text-xs font-medium text-fd-muted-foreground">{lesson.course}</p>
                    <h3 className="text-lg font-semibold">{lesson.title}</h3>
                    <p className="flex-1 text-sm leading-6 text-fd-muted-foreground">{lesson.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {lesson.duration ? (
                        <span className="rounded-full border border-fd-border bg-fd-muted px-2 py-0.5 text-xs text-fd-muted-foreground">
                          {lesson.duration}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-fd-border bg-fd-muted px-2 py-0.5 text-xs text-fd-muted-foreground">
                        {lesson.level}
                      </span>
                      {lesson.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="rounded-full border border-fd-border bg-fd-muted px-2 py-0.5 text-xs text-fd-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-20">
          <p className="text-sm font-medium text-fd-muted-foreground">How it works</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Three ways into every lesson</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-xl border border-fd-border bg-fd-card p-5">
                <span className="text-xs font-medium text-fd-primary">0{index + 1}</span>
                <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </HomeLayout>
  );
}
