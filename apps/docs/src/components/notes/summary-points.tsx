import {getStudioLesson} from '@/lib/studio-data';

export interface SummaryPointsProps {
  slug: string;
}

/** The viewer-facing points, read from chapters.json through lessons.json. */
export function SummaryPoints({slug}: SummaryPointsProps) {
  const points = getStudioLesson(slug)?.summaryPoints;

  if (!points || points.length === 0 || (points.length === 1 && points[0] === 'TODO')) {
    return (
      <p className="my-4 flex flex-wrap items-center gap-2 rounded-lg border border-fd-border bg-fd-muted px-3 py-2 text-sm text-fd-muted-foreground">
        <span className="rounded-full border border-fd-warning/40 bg-fd-warning/15 px-2 py-0.5 text-xs font-semibold text-fd-warning">
          TODO
        </span>
        Fill <code>summaryPoints</code> in <code>chapters.json</code>, then run <code>pnpm sync</code>.
      </p>
    );
  }

  return (
    <ul className="my-4 list-disc space-y-1 pl-5">
      {points.map(point => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}
