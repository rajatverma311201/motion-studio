export interface LessonVideoProps {
  slug: string;
}

export function LessonVideo({slug}: LessonVideoProps) {
  return (
    <div className="nb-video" role="img" aria-label={`Video preview for ${slug}`}>
      <span className="nb-video-label">VIDEO PREVIEW: {slug}</span>
      <span className="nb-video-note">The player is wired up in step 11.</span>
    </div>
  );
}
