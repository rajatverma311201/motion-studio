import {createFileRoute, Link} from '@tanstack/react-router';
import {HomeLayout} from 'fumadocs-ui/layouts/home';
import type {CSSProperties} from 'react';
import {baseOptions} from '@/lib/layout.shared';
import {getLessons} from '@/lib/lessons';
import {pageTitle, siteDescription} from '@/lib/seo';

const cardShadows = [
  'var(--nb-lime)',
  'var(--nb-pink)',
  'var(--nb-cyan)',
  'var(--nb-yellow)',
  'var(--nb-violet)',
  'var(--nb-orange)',
];

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
      <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8">
        <section>
          <p className="eyebrow">Motion Studio</p>
          <h1 className="nb-hero-title">
            <span className="nb-hero-slab">LEARN HOW SOFTWARE WORKS</span>
          </h1>
          <p className="nb-hero-sub">
            Animated explainers for the database ideas that show up in real systems. Watch the video, jump to a chapter,
            then read the notes and run the examples.
          </p>
          <div className="nb-hero-actions">
            <Link to="/docs/$" params={{_splat: ''}} className="nb-btn nb-btn-lime">
              Browse lessons
            </Link>
            <Link to="/docs/$" params={{_splat: 'databases'}} className="nb-btn nb-btn-outline">
              Databases course
            </Link>
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Library</p>
              <h2 className="nb-section-title">Latest lessons</h2>
            </div>
            <Link to="/docs/$" params={{_splat: ''}} className="nb-text-link">
              All lessons
            </Link>
          </div>

          {lessons.length === 0 ? (
            <p className="text-[var(--nb-muted)]">No lessons are published yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson, index) => {
                const shadow = cardShadows[index % cardShadows.length];
                const splat = lesson.url.replace(/^\/docs\/?/, '');

                return (
                  <Link
                    key={lesson.url}
                    to="/docs/$"
                    params={{_splat: splat}}
                    className="nb-lesson-card"
                    style={{'--nb-card-shadow': shadow} as CSSProperties}
                  >
                    <p className="eyebrow">{lesson.course}</p>
                    <h3 className="nb-lesson-title">{lesson.title}</h3>
                    <p className="nb-lesson-desc">{lesson.description}</p>
                    <div className="nb-chip-row">
                      {lesson.duration ? <span className="nb-chip">{lesson.duration}</span> : null}
                      <span className="nb-chip">{lesson.level}</span>
                      {lesson.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="nb-chip">
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
          <p className="eyebrow">How it works</p>
          <h2 className="nb-section-title">Three ways into every lesson</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="nb-step">
                <span className="nb-step-number">0{index + 1}</span>
                <h3 className="nb-step-title">{step.title}</h3>
                <p className="nb-step-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </HomeLayout>
  );
}
