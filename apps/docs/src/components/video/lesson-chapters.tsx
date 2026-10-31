import type {CSSProperties} from 'react';
import {chapterColorVar, getLesson} from './use-lessons';

export interface LessonChaptersProps {
  slug: string;
}

/** Static chapter overview for the MDX body: no player and no interaction. */
export function LessonChapters({slug}: LessonChaptersProps) {
  const lesson = getLesson(slug);

  if (!lesson) {
    return (
      <p className="nb-video-missing nb-video-missing-lesson" role="alert">
        No lesson data for <code>{slug}</code>. Run <code>pnpm sync:generated</code> in the repo root.
      </p>
    );
  }

  return (
    <ol className="nb-chapter-cards">
      {lesson.chapters.map((chapter, index) => (
        <li
          key={`${index}-${chapter.name}`}
          className="nb-chapter-card"
          style={{'--chapter-color': chapterColorVar(chapter.color)} as CSSProperties}
        >
          <span className="nb-chapter-index">{String(index + 1).padStart(2, '0')}</span>
          <span className="nb-chapter-body">
            <span className="nb-chapter-name">
              <span className="nb-chapter-dot" aria-hidden="true" />
              {chapter.name}
            </span>
            {chapter.summary ? <span className="nb-chapter-summary">{chapter.summary}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
