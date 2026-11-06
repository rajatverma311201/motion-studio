import {Link} from '@tanstack/react-router';
import {useState} from 'react';
import {lookLabel} from '@/lib/lessons';
import type {StudioFormat} from '@/lib/studio-data';
import {ChapterList} from './chapter-list';
import type {PlayerMode} from './player-variables';
import {StudioPanel} from './studio-panel';
import {getLesson} from './use-lessons';
import {VideoPlayer} from './video-player';

export interface LessonVideoProps {
  slug: string;
  /** Optional format override; the lesson's own format is used when omitted. */
  format?: StudioFormat;
  /** Optional look override; the lesson's own look is used when omitted. */
  theme?: string;
  mode?: PlayerMode;
}

/** Scroll the matching `### NN ·` voiceover heading below the sticky player. */
function scrollToChapterNotes(index: number) {
  if (typeof document === 'undefined') return;

  const label = String(index + 1).padStart(2, '0');
  const headings = Array.from(document.querySelectorAll<HTMLElement>('#nd-page h3'));
  const heading = headings.find(element => element.textContent?.trim().startsWith(`${label} ·`));
  if (!heading) return;

  const sticky = document.querySelector<HTMLElement>('[data-lesson-player-sticky]');
  const stickyHeight = sticky?.getBoundingClientRect().height ?? 0;
  const offset = window.innerWidth >= 1024 ? stickyHeight + 16 : 80;
  const top = heading.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({top: Math.max(0, top), behavior: 'smooth'});
}

export function LessonVideo({slug, format, theme, mode}: LessonVideoProps) {
  const [startSection, setStartSection] = useState(0);
  const lesson = getLesson(slug);

  if (!lesson) {
    return (
      <div
        className="my-6 rounded-lg border border-fd-border bg-fd-card p-4 text-sm text-fd-muted-foreground"
        role="alert"
      >
        <p>
          No lesson data for <code>{slug}</code>. Run <code>pnpm sync</code> in the repo root.
        </p>
      </div>
    );
  }

  const chapter = lesson.chapters[startSection];
  const look = lookLabel(lesson.look);
  const resolvedFormat = format ?? lesson.format ?? 'landscape';

  function selectChapter(index: number) {
    setStartSection(index);
    requestAnimationFrame(() => scrollToChapterNotes(index));
  }

  return (
    <div className="contents">
      <div className="z-10 mt-6 bg-fd-background pb-3 lg:sticky lg:top-0" data-lesson-player-sticky="">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fd-muted-foreground">
          {look ? (
            <p>
              Renders in: <span className="font-medium text-fd-foreground">{look}</span>
            </p>
          ) : null}
          <Link
            to="/record/$slug"
            params={{slug}}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-fd-primary hover:underline"
          >
            Open teleprompter
          </Link>
        </div>
        {startSection > 0 && chapter ? (
          <p className="mb-2 text-sm text-fd-muted-foreground">
            Starting at chapter {String(startSection + 1).padStart(2, '0')}: {chapter.name}
          </p>
        ) : null}
        <VideoPlayer
          slug={slug}
          startSection={startSection}
          format={resolvedFormat}
          autoPlay={startSection > 0}
          theme={theme}
          mode={mode}
        />
      </div>
      <ChapterList slug={slug} activeIndex={startSection} onSelect={selectChapter} />
      <StudioPanel slug={slug} />
    </div>
  );
}
