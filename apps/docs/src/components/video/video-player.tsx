import {useEffect, useRef, useState} from 'react';
import {getLesson} from './use-lessons';
import {usePlayerReady} from './use-player-ready';
import {videoSrc} from './video-source';

export interface VideoPlayerProps {
  slug: string;
  startSection: number;
  autoPlay?: boolean;
}

/**
 * The player exposes read-only getters, so React 19 cannot assign `src`,
 * `width` and friends as properties. Attributes are set imperatively instead.
 * The src is absolute because Vite 8 appends `?import` to relative dynamic
 * imports, which public files reject.
 */
function absoluteVideoSrc(slug: string): string {
  return new URL(videoSrc(slug), window.location.href).href;
}

export function VideoPlayer({slug, startSection, autoPlay = false}: VideoPlayerProps) {
  const status = usePlayerReady();
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const playerRef = useRef<HTMLElement | null>(null);
  const title = getLesson(slug)?.title ?? slug;

  useEffect(() => {
    let active = true;

    fetch(videoSrc(slug), {method: 'HEAD'})
      .then(response => {
        if (active && !response.ok) setMissing(true);
      })
      .catch(() => {
        if (active) setMissing(true);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    const element = playerRef.current;
    if (!element || status !== 'ready' || missing) return;

    element.setAttribute('variables', JSON.stringify({startSection}));
    if (autoPlay) element.setAttribute('auto', 'true');
    element.setAttribute('src', absoluteVideoSrc(slug));

    let cancelled = false;
    let frame = 0;
    const applySize = () => {
      if (cancelled) return;
      if ((element as HTMLElement & {state?: string}).state === 'ready') {
        element.setAttribute('width', '1920');
        element.setAttribute('height', '1080');
        return;
      }
      frame = requestAnimationFrame(applySize);
    };
    frame = requestAnimationFrame(applySize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [slug, startSection, autoPlay, status, missing]);

  async function copyBuildCommand() {
    try {
      await navigator.clipboard.writeText('pnpm videos:build');
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the command stays visible in the message.
    }
  }

  const ready = status === 'ready' && !missing;

  return (
    <div className="nb-video-frame" role="region" aria-label={`Video: ${title}`}>
      {missing ? (
        <div className="nb-video-missing" role="alert">
          <p>
            Video bundle not found. Run <code>pnpm videos:build</code> in the repo root.
          </p>
          <button type="button" className="nb-video-copy" onClick={copyBuildCommand}>
            {copied ? 'COPIED' : 'COPY COMMAND'}
          </button>
        </div>
      ) : status === 'error' ? (
        <p className="nb-video-error" role="alert">
          Failed to load the Motion Canvas player module.
        </p>
      ) : status === 'loading' ? (
        <div className="nb-video-skeleton">
          <span>LOADING PLAYER...</span>
        </div>
      ) : null}
      {ready ? (
        <motion-canvas-player
          key={`${slug}-${startSection}`}
          ref={playerRef}
          style={{display: 'block', width: '100%', height: '100%'}}
        />
      ) : null}
    </div>
  );
}
