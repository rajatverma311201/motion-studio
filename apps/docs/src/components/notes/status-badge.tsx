import {isLessonStatus, type LessonStatus} from '@/lib/status';

export interface StatusBadgeProps {
  status: LessonStatus;
}

const STYLES: Record<LessonStatus, string> = {
  outline: 'border-fd-border bg-fd-muted text-fd-muted-foreground',
  animated: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  rendered: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  voiced: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  published: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
};

/** A small pill that always shows the status word, not only a colour. */
export function StatusBadge({status}: StatusBadgeProps) {
  const safeStatus: LessonStatus = isLessonStatus(status) ? status : 'outline';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[safeStatus]}`}
      data-status={safeStatus}
    >
      {safeStatus[0].toUpperCase() + safeStatus.slice(1)}
    </span>
  );
}
