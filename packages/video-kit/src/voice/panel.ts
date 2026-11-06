/**
 * Plain-DOM recorder panel for the studio voice workflow.
 *
 * Mounted from `defineLesson` only in voice mode `record`. It lives in the
 * Motion Canvas page and the PRESENT window; it never draws inside the video
 * frame and never loads in the docs bundle.
 */
import type {VoiceManifest} from './timing';
import {getBeatCount, getVoiceChapter, setVoiceHooks} from './voice-state';
import {VoiceRecorder, type RecordedClip, type RecorderStatus} from './recorder';

export interface VoicePanelOptions {
  slug: string;
  manifest: VoiceManifest | null;
}

const STYLE_ID = 'voice-panel-style';

let active: VoicePanel | null = null;

/**
 * Mount the recorder overlay, or reuse it when the scene recalculates.
 *
 * @example
 * mountVoicePanel({slug: 'db-transactions', manifest});
 */
export function mountVoicePanel(options: VoicePanelOptions): void {
  if (typeof document === 'undefined' || typeof document.body === 'undefined') return;
  if (active && active.slug === options.slug) {
    active.updateManifest(options.manifest);
    return;
  }

  active?.destroy();
  active = new VoicePanel(options);
  active.mount();
}

class VoicePanel {
  public readonly slug: string;
  private readonly recorder: VoiceRecorder;
  private readonly root = document.createElement('div');
  private readonly toggle = document.createElement('button');
  private readonly stateLabel = document.createElement('span');
  private readonly countLabel = document.createElement('span');
  private readonly body = document.createElement('div');
  private readonly message = document.createElement('p');
  private readonly levelBar = document.createElement('div');
  private readonly armButton = document.createElement('button');
  private readonly overwriteButton = document.createElement('button');
  private readonly clipList = document.createElement('ul');
  private readonly clips = new Map<string, RecordedClip>();
  private status: RecorderStatus = 'idle';
  private overwrite = false;
  private expanded = false;
  private error = '';
  private currentBeat = '';
  private frame = 0;
  private destroyed = false;
  private player: HTMLAudioElement | null = null;
  private readonly baseTitle: string;

  public constructor(options: VoicePanelOptions) {
    this.slug = options.slug;
    this.baseTitle = document.title.replace(/^● REC · /, '');
    this.recorder = new VoiceRecorder({
      slug: options.slug,
      onStatusChange: status => {
        this.status = status;
        this.refresh();
      },
      onClip: clip => {
        this.clips.set(clip.id, clip);
        this.error = '';
        this.refresh();
      },
      onError: message => this.showError(message),
    });
    this.addManifest(options.manifest);
    this.build();
    setVoiceHooks({
      onBeatStart: beat => this.onBeat(beat.id, beat.name),
      onLessonEnd: () => this.recorder.stop(),
    });
  }

  public mount(): void {
    ensureStyles();
    document.body.append(this.root);
    this.refresh();
    this.frame = requestAnimationFrame(this.pump);
  }

  public updateManifest(manifest: VoiceManifest | null): void {
    this.addManifest(manifest);
    this.refresh();
  }

  public destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.player?.pause();
    this.player = null;
    this.recorder.dispose();
    this.root.remove();
    document.title = this.baseTitle;
  }

  private addManifest(manifest: VoiceManifest | null): void {
    if (!manifest) return;
    for (const [id, clip] of Object.entries(manifest.clips)) {
      this.clips.set(id, {id, name: clip.slideName, ...clip});
    }
  }

  private build(): void {
    this.root.className = 'voice-panel';
    this.root.dataset.state = 'idle';

    this.toggle.type = 'button';
    this.toggle.className = 'voice-panel__toggle';
    this.toggle.setAttribute('aria-expanded', 'false');

    const dot = document.createElement('span');
    dot.className = 'voice-panel__dot';
    this.stateLabel.className = 'voice-panel__state';
    this.countLabel.className = 'voice-panel__count';
    this.toggle.append(dot, this.stateLabel, this.countLabel);

    this.body.className = 'voice-panel__body';
    this.body.hidden = true;

    this.message.className = 'voice-panel__message';
    this.message.setAttribute('role', 'alert');
    this.message.hidden = true;

    const meter = document.createElement('div');
    meter.className = 'voice-panel__meter';
    this.levelBar.className = 'voice-panel__level';
    meter.append(this.levelBar);

    const actions = document.createElement('div');
    actions.className = 'voice-panel__actions';
    this.armButton.type = 'button';
    this.armButton.dataset.action = 'arm';
    this.overwriteButton.type = 'button';
    this.overwriteButton.dataset.action = 'overwrite';
    this.overwriteButton.setAttribute('aria-pressed', 'false');
    actions.append(this.armButton, this.overwriteButton);

    this.clipList.className = 'voice-panel__clips';
    const hint = document.createElement('p');
    hint.className = 'voice-panel__hint';
    hint.textContent =
      'Use PRESENT, then Space for each beat. Clips under 0.8 s are ignored; Overwrite re-records a beat that already has one.';

    this.body.append(this.message, meter, actions, this.clipList, hint);
    this.root.append(this.toggle, this.body);

    this.toggle.addEventListener('click', () => {
      this.expanded = !this.expanded;
      this.toggle.blur();
      this.refresh();
    });
    this.armButton.addEventListener('click', () => {
      void this.toggleArm();
      this.armButton.blur();
    });
    this.overwriteButton.addEventListener('click', () => {
      this.overwrite = !this.overwrite;
      this.overwriteButton.blur();
      this.refresh();
    });
    this.clipList.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest('button');
      if (!button) return;
      const id = button.dataset.id;
      if (!id) return;
      button.blur();
      if (button.dataset.clipAction === 'preview') this.preview(id);
      if (button.dataset.clipAction === 'remove') void this.remove(id);
    });
  }

  private refresh(): void {
    if (this.destroyed) return;
    const recording = this.status === 'recording';
    this.root.dataset.state = this.status;
    this.stateLabel.textContent = recording ? `● REC ${this.currentBeat}` : this.status === 'armed' ? 'ARMED' : 'IDLE';
    this.countLabel.textContent = `${this.clips.size} / ${getBeatCount()}`;
    this.body.hidden = !this.expanded;
    this.toggle.setAttribute('aria-expanded', String(this.expanded));
    this.armButton.textContent = this.status === 'idle' ? 'Arm' : 'Disarm';
    this.armButton.disabled = false;
    this.overwriteButton.textContent = this.overwrite ? 'Overwrite: on' : 'Overwrite: off';
    this.overwriteButton.setAttribute('aria-pressed', String(this.overwrite));
    this.message.hidden = this.error === '';
    this.message.textContent = this.error;
    this.renderClips();
    document.title = recording ? `● REC · ${this.baseTitle}` : this.baseTitle;
  }

  private renderClips(): void {
    const chapter = getVoiceChapter() || 1;
    const prefix = `${String(chapter).padStart(2, '0')}-`;
    const clips = [...this.clips.values()]
      .filter(clip => clip.id.startsWith(prefix))
      .sort((a, b) => a.id.localeCompare(b.id));

    this.clipList.replaceChildren(
      ...clips.map(clip => {
        const item = document.createElement('li');
        item.className = 'voice-panel__clip';
        const name = document.createElement('span');
        name.className = 'voice-panel__clip-name';
        name.textContent = clip.slideName || clip.name || clip.id;
        name.title = name.textContent;

        const preview = document.createElement('button');
        preview.type = 'button';
        preview.dataset.clipAction = 'preview';
        preview.dataset.id = clip.id;
        preview.title = `Play ${clip.id}`;
        preview.textContent = '▶';

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.clipAction = 'remove';
        remove.dataset.id = clip.id;
        remove.title = `Delete ${clip.id}`;
        remove.textContent = '✕';

        item.append(name, preview, remove);
        return item;
      }),
    );
  }

  private onBeat(id: string, name: string): void {
    this.currentBeat = id;
    if (!this.overwrite && this.clips.has(id)) {
      this.recorder.stop();
    } else {
      this.recorder.start(id, name);
    }
    this.refresh();
  }

  private async toggleArm(): Promise<void> {
    if (this.status === 'idle') {
      this.armButton.disabled = true;
      this.armButton.textContent = 'Arming…';
      const ok = await this.recorder.arm();
      if (!ok) this.expanded = true;
    } else {
      this.recorder.disarm();
    }
    this.refresh();
  }

  private preview(id: string): void {
    this.player?.pause();
    const query = new URLSearchParams({slug: this.slug, id});
    this.player = new Audio(`/__voice/clip?${query}`);
    void this.player.play().catch(() => this.showError(`Could not play clip ${id}.`));
  }

  private async remove(id: string): Promise<void> {
    try {
      const query = new URLSearchParams({slug: this.slug, id});
      const response = await fetch(`/__voice/clip?${query}`, {method: 'DELETE'});
      if (!response.ok) throw new Error(`the voice server answered ${response.status}`);
      this.clips.delete(id);
      this.error = '';
      this.refresh();
    } catch (error) {
      this.showError(`Could not delete clip ${id}: ${(error as Error).message}`);
    }
  }

  private showError(message: string): void {
    this.error = message;
    this.expanded = true;
    this.refresh();
  }

  private readonly pump = (): void => {
    if (this.destroyed) return;
    this.levelBar.style.transform = `scaleX(${this.recorder.level().toFixed(3)})`;
    this.frame = requestAnimationFrame(this.pump);
  };
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.voice-panel {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 2147483647;
  max-width: min(380px, calc(100vw - 32px));
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: CanvasText;
  background: Canvas;
  background: color-mix(in srgb, CanvasText 6%, Canvas);
  border: 1px solid CanvasText;
  border-color: color-mix(in srgb, CanvasText 24%, transparent);
  border-radius: 10px;
  box-shadow: 0 8px 28px color-mix(in srgb, CanvasText 22%, transparent);
  overflow: hidden;
}
.voice-panel__toggle {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.voice-panel__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: CanvasText;
  opacity: 0.35;
}
.voice-panel[data-state="armed"] .voice-panel__dot { opacity: 0.75; }
.voice-panel[data-state="recording"] .voice-panel__dot {
  opacity: 1;
  animation: voice-panel-pulse 1s steps(2, end) infinite;
}
.voice-panel__state { font-weight: 700; letter-spacing: 0.04em; }
.voice-panel__count { margin-left: auto; opacity: 0.65; }
.voice-panel__body { display: grid; gap: 10px; padding: 0 12px 12px; }
.voice-panel__body[hidden] { display: none; }
.voice-panel__meter {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, CanvasText 12%, transparent);
  overflow: hidden;
}
.voice-panel__level {
  width: 100%;
  height: 100%;
  transform: scaleX(0);
  transform-origin: left;
  background: CanvasText;
}
.voice-panel__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.voice-panel button[data-action],
.voice-panel__clip button {
  padding: 5px 10px;
  border: 1px solid color-mix(in srgb, CanvasText 25%, transparent);
  border-radius: 7px;
  background: color-mix(in srgb, CanvasText 8%, Canvas);
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.voice-panel button[data-action][aria-pressed="true"] {
  background: CanvasText;
  color: Canvas;
}
.voice-panel button[data-action]:disabled { opacity: 0.5; cursor: progress; }
.voice-panel__message {
  margin: 0;
  padding: 6px 8px;
  border-left: 3px solid CanvasText;
  background: color-mix(in srgb, CanvasText 10%, Canvas);
}
.voice-panel__clips {
  display: grid;
  gap: 4px;
  max-height: 140px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}
.voice-panel__clip { display: flex; gap: 6px; align-items: center; }
.voice-panel__clip-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.85; }
.voice-panel__clip button { padding: 2px 6px; }
.voice-panel__hint { margin: 0; font-size: 11px; opacity: 0.6; }
@keyframes voice-panel-pulse { 50% { opacity: 0.25; } }
@media (prefers-reduced-motion: reduce) {
  .voice-panel[data-state="recording"] .voice-panel__dot { animation: none; }
}
`;
  document.head.append(style);
}
