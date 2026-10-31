import {useState} from 'react';
import {ChapterList} from './chapter-list';
import {StudioPanel} from './studio-panel';
import {getLesson} from './use-lessons';
import {VideoPlayer} from './video-player';

export interface LessonVideoProps {
  slug: string;
}

export function LessonVideo({slug}: LessonVideoProps) {
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

  return (
    <div className="lesson-video my-6">
      {startSection > 0 && chapter ? (
        <p className="mb-2 text-sm text-fd-muted-foreground">
          Starting at chapter {String(startSection + 1).padStart(2, '0')}: {chapter.name}
        </p>
      ) : null}
      <VideoPlayer slug={slug} startSection={startSection} autoPlay={startSection > 0} />
      <ChapterList slug={slug} activeIndex={startSection} onSelect={setStartSection} />
      <StudioPanel slug={slug} />
    </div>
  );
}
