import {studioEditorUrl} from './video-source';

export interface StudioPanelProps {
  slug: string;
}

export function StudioPanel({slug}: StudioPanelProps) {
  return (
    <div className="my-6 flex flex-col gap-4 rounded-lg border border-fd-border bg-fd-card p-4">
      {import.meta.env.DEV ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            className="rounded-md bg-fd-primary px-3 py-1.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
            href={studioEditorUrl(slug)}
            target="_blank"
            rel="noreferrer"
          >
            Open in Motion Canvas editor
          </a>
          <p className="text-xs text-fd-muted-foreground">
            Run <code>pnpm studio:dev</code> first.
          </p>
        </div>
      ) : null}
      <details>
        <summary className="cursor-pointer text-sm font-medium text-fd-primary">
          How to render this video as an MP4
        </summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-fd-muted-foreground">
          <li>
            Run <code>pnpm studio:dev</code>.
          </li>
          <li>Open the editor link.</li>
          <li>Open the "Video settings" tab (right panel).</li>
          <li>Under Rendering choose exporter "Video (FFmpeg)" and the frame rate (30 or 60 FPS).</li>
          <li>Click RENDER.</li>
          <li>
            The file appears in <code>apps/studio/output/</code>.
          </li>
        </ol>
      </details>
    </div>
  );
}
