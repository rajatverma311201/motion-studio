export interface LessonChaptersProps {
  slug: string;
}

export function LessonChapters({slug}: LessonChaptersProps) {
  return <p className="nb-chapters">CHAPTERS: {slug}</p>;
}
