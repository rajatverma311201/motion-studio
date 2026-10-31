import type {CSSProperties} from 'react';
import {chapterColorVar, getLesson} from './use-lessons';

export interface ChapterListProps {
  slug: string;
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function ChapterList({slug, activeIndex, onSelect}: ChapterListProps) {
  const lesson = getLesson(slug);
  if (!lesson) return null;

  return (
    <div className="nb-chapter-nav">
      <div className="nb-chapter-nav-head">
        <span className="eyebrow">Jump to a chapter</span>
        <button type="button" className="nb-chapter-play" onClick={() => onSelect(0)}>
          Play from the start
        </button>
      </div>
      <ol className="nb-chapter-grid">
        {lesson.chapters.map((chapter, index) => {
          const active = index === activeIndex;
          const color = chapterColorVar(chapter.color);

          return (
            <li key={`${index}-${chapter.name}`}>
              <button
                type="button"
                className={active ? 'nb-chapter is-active' : 'nb-chapter'}
                style={{'--chapter-color': color} as CSSProperties}
                aria-current={active ? 'true' : undefined}
                data-chapter-index={index}
                onClick={() => onSelect(index)}
              >
                <span className="nb-chapter-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="nb-chapter-body">
                  <span className="nb-chapter-name">
                    <span className="nb-chapter-dot" aria-hidden="true" />
                    {chapter.name}
                  </span>
                  {chapter.summary ? <span className="nb-chapter-summary">{chapter.summary}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
