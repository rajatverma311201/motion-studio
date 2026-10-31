import type {ReactNode} from 'react';

export interface VoiceoverNotesProps {
  children: ReactNode;
}

/** Arm's-length instructions for what to say while this chapter plays. */
export function VoiceoverNotes({children}: VoiceoverNotesProps) {
  return (
    <aside className="my-4 rounded-lg border border-fd-border bg-fd-card px-4 py-3" aria-label="Voiceover notes">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <svg
          aria-hidden="true"
          className="size-4 text-fd-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <path d="M12 19v3" />
        </svg>
        Say this
      </p>
      <div className="text-[1.05rem] leading-7 text-fd-card-foreground [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_li]:pl-1">
        {children}
      </div>
    </aside>
  );
}
