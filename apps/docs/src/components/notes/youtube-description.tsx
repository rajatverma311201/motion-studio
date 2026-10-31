import {useState} from 'react';
import {source} from '@/lib/source';
import {getStudioLesson} from '@/lib/studio-data';
import {buildYoutubeDescription} from '@/lib/youtube-description';

export interface YoutubeDescriptionProps {
  slug: string;
}

function pageDescription(slug: string): string {
  return source.getPages().find(page => page.data.video === slug)?.data.description ?? '';
}

/** Copy-ready YouTube description built from the page description, points and chapters. */
export function YoutubeDescription({slug}: YoutubeDescriptionProps) {
  const [copied, setCopied] = useState(false);
  const lesson = getStudioLesson(slug);
  const text = buildYoutubeDescription({
    description: pageDescription(slug),
    summaryPoints: lesson?.summaryPoints,
    chapters: lesson?.chapters ?? [],
  });
  const missingTimestamps = (lesson?.chapters ?? []).some(chapter => !chapter.at);

  async function copyDescription() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the text stays visible and selectable.
    }
  }

  return (
    <div className="my-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">YouTube description</p>
        <button
          type="button"
          data-copy-description=""
          className="rounded-md border border-fd-border bg-fd-secondary px-3 py-1.5 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          onClick={copyDescription}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {missingTimestamps ? <p className="mb-2 text-xs text-fd-muted-foreground">timestamps missing</p> : null}
      <pre
        data-youtube-description=""
        className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-fd-border bg-fd-muted p-4 font-mono text-xs leading-6"
      >
        {text}
      </pre>
    </div>
  );
}
