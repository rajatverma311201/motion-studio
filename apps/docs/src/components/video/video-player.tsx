import type {Player} from '@motion-canvas/core';
import {useEffect, useRef, useState} from 'react';
import type {StudioFormat} from '@/lib/studio-data';
import {buildPlayerVariables, type PlayerMode} from './player-variables';
import {formatPlayerTime} from './player-time';
import {getLesson} from './use-lessons';
import {usePlayerReady} from './use-player-ready';
import {videoSrc} from './video-source';

export interface VideoPlayerProps {
  slug: string;
  startSection: number;
  /** Portrait Shorts play at 9:16; everything else keeps the 16:9 frame. */
  format?: StudioFormat;
  autoPlay?: boolean;
  /** Theme id passed to the lesson as the `theme` variable; omitted keeps the lesson's look. */
  theme?: string;
  /** Mode passed to the lesson as the `mode` variable; omitted keeps the lesson's look. */
  mode?: PlayerMode;
}

/** The parts of the core Player the docs timeline drives. */
type PlayerApi = Pick<
  Player,
  'status' | 'onFrameChanged' | 'onDurationChanged' | 'onStateChanged' | 'requestSeek' | 'togglePlayback'
>;

/** The custom element owns a Player instance but does not type it publicly. */
interface MotionCanvasPlayerElement extends HTMLElement {
  state?: 'initial' | 'loading' | 'ready' | 'error';
  player?: PlayerApi;
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

export function VideoPlayer({
  slug,
  startSection,
  format = 'landscape',
  autoPlay = false,
  theme,
  mode,
}: VideoPlayerProps) {
  const isShort = format === 'short';
  const status = usePlayerReady();
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [frame, setFrame] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [fps, setFps] = useState(60);
  const [timelineReady, setTimelineReady] = useState(false);
  const playerRef = useRef<HTMLElement | null>(null);
  const playerApi = useRef<PlayerApi | null>(null);
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
    const element = playerRef.current as MotionCanvasPlayerElement | null;
    if (!element || status !== 'ready' || missing) return;

    setFrame(0);
    setDuration(0);
    setPaused(true);
    setTimelineReady(false);
    playerApi.current = null;

    element.setAttribute('variables', buildPlayerVariables({startSection, theme, mode}));
    if (autoPlay) element.setAttribute('auto', 'true');
    else element.removeAttribute('auto');
    element.setAttribute('src', absoluteVideoSrc(slug));

    let cancelled = false;
    let frameRequest = 0;
    let unsubscribers: (() => void)[] = [];

    const attach = () => {
      if (cancelled) return;
      if (element.state === 'error') return;
      if (element.state !== 'ready') {
        frameRequest = requestAnimationFrame(attach);
        return;
      }

      element.setAttribute('width', isShort ? '1080' : '1920');
      element.setAttribute('height', isShort ? '1920' : '1080');

      const player = element.player;
      if (!player) {
        frameRequest = requestAnimationFrame(attach);
        return;
      }

      playerApi.current = player;
      setFps(player.status.fps || 60);
      unsubscribers = [
        player.onFrameChanged.subscribe(value => setFrame(value)),
        player.onDurationChanged.subscribe(value => setDuration(value)),
        player.onStateChanged.subscribe(state => setPaused(state.paused)),
      ];
      setTimelineReady(true);
    };

    frameRequest = requestAnimationFrame(attach);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRequest);
      unsubscribers.forEach(unsubscribe => unsubscribe());
      playerApi.current = null;
    };
  }, [slug, startSection, isShort, autoPlay, theme, mode, status, missing]);

  async function copyBuildCommand() {
    try {
      await navigator.clipboard.writeText('pnpm videos:build');
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the command stays visible in the message.
    }
  }

  function seekTo(nextFrame: number) {
    const target = Math.max(0, Math.min(Math.round(nextFrame), duration));
    setFrame(target);
    playerApi.current?.requestSeek(target);
  }

  function togglePlayback() {
    playerApi.current?.togglePlayback();
  }

  const ready = status === 'ready' && !missing;
  const currentTime = formatPlayerTime(frame, fps);
  const totalTime = formatPlayerTime(duration, fps);
  const progress = duration > 0 ? Math.min(100, Math.max(0, (frame / duration) * 100)) : 0;

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-lg border border-fd-border bg-black ${
          isShort ? 'mx-auto' : 'aspect-video w-full'
        }`}
        style={
          isShort
            ? {aspectRatio: '9 / 16', height: '80vh', maxHeight: '80vh', width: 'auto', maxWidth: '100%'}
            : undefined
        }
        role="region"
        aria-label={`Video: ${title}`}
        data-video-format={format}
      >
        {missing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-fd-card p-4 text-center text-sm">
            <p>
              Video bundle not found. Run <code>pnpm videos:build</code> in the repo root.
            </p>
            <button
              type="button"
              className="rounded-md border border-fd-border bg-fd-secondary px-3 py-1.5 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent"
              onClick={copyBuildCommand}
            >
              {copied ? 'Copied' : 'Copy command'}
            </button>
          </div>
        ) : status === 'error' ? (
          <p
            className="absolute inset-0 flex items-center justify-center bg-fd-card p-4 text-center text-sm text-fd-error"
            role="alert"
          >
            Failed to load the Motion Canvas player module.
          </p>
        ) : status === 'loading' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-fd-card text-sm text-fd-muted-foreground">
            <span>Loading player…</span>
          </div>
        ) : null}
        {ready ? (
          <motion-canvas-player
            key={`${slug}-${startSection}-${format}-${theme ?? ''}-${mode ?? ''}`}
            ref={playerRef}
            style={{display: 'block', width: '100%', height: '100%'}}
          />
        ) : null}
      </div>
      {ready ? (
        <div
          className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-3 py-2"
          data-player-controls=""
        >
          <button
            type="button"
            className="inline-flex min-w-16 items-center justify-center rounded-md bg-fd-primary px-3 py-1.5 text-xs font-medium text-fd-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={paused ? 'Play video' : 'Pause video'}
            data-player-play=""
            data-playing={paused ? 'false' : 'true'}
            disabled={!timelineReady}
            onClick={togglePlayback}
          >
            {paused ? 'Play' : 'Pause'}
          </button>
          <button
            type="button"
            className="rounded-md border border-fd-border bg-fd-secondary px-3 py-1.5 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Restart from the selected chapter"
            data-player-restart=""
            disabled={!timelineReady}
            onClick={() => seekTo(0)}
          >
            Restart
          </button>
          <div className="relative h-5 min-w-0 flex-1 rounded-full focus-within:ring-2 focus-within:ring-fd-primary">
            <div className="pointer-events-none absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-fd-border" />
            <div
              className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fd-primary"
              style={{width: `${progress}%`}}
            />
            <div
              className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fd-primary ring-2 ring-fd-card"
              style={{left: `${progress}%`}}
            />
            <input
              type="range"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              min={0}
              max={Math.max(duration, 1)}
              step={1}
              value={Math.min(Math.round(frame), Math.max(duration, 1))}
              aria-label="Seek video"
              data-player-seek=""
              disabled={!timelineReady}
              onChange={event => seekTo(Number(event.currentTarget.value))}
            />
          </div>
          <span className="shrink-0 font-mono text-xs tabular-nums text-fd-muted-foreground" data-player-time="">
            {currentTime} / {totalTime}
          </span>
        </div>
      ) : null}
    </div>
  );
}
