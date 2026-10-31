import {studioEditorUrl} from './video-source';

export interface StudioPanelProps {
  slug: string;
}

export function StudioPanel({slug}: StudioPanelProps) {
  return (
    <div className="nb-studio-panel">
      {import.meta.env.DEV ? (
        <div className="nb-studio-editor">
          <a className="nb-btn nb-btn-lime" href={studioEditorUrl(slug)} target="_blank" rel="noreferrer">
            Open in Motion Canvas editor
          </a>
          <p className="nb-studio-hint">
            Run <code>pnpm studio:dev</code> first.
          </p>
        </div>
      ) : null}
      <details className="nb-studio-details">
        <summary>How to render this video as an MP4</summary>
        <ol>
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
