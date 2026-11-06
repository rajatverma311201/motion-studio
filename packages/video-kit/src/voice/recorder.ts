/**
 * Browser-side per-beat recorder for the studio voice workflow.
 *
 * The recorder keeps one microphone stream while armed and creates a fresh
 * `MediaRecorder` per beat. The clip duration comes from decoding the blob with
 * `AudioContext.decodeAudioData`, never from the wall clock. Clips shorter than
 * 0.8 seconds are discarded on purpose: seeking to a slide replays earlier
 * `say` calls within milliseconds, and those micro-clips must not overwrite a
 * real take.
 */
import type {VoiceClip} from './timing';

export type RecorderStatus = 'idle' | 'armed' | 'recording';

export interface RecordedClip extends VoiceClip {
  id: string;
  name: string;
}

export interface VoiceRecorderOptions {
  slug: string;
  onStatusChange?: (status: RecorderStatus) => void;
  onClip?: (clip: RecordedClip) => void;
  onDiscard?: (id: string, seconds: number) => void;
  onError?: (message: string) => void;
}

const MIN_CLIP_SECONDS = 0.8;
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'];

type Extension = 'webm' | 'mp4' | 'ogg';

function hasMicrophone(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  return MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type));
}

function extensionFor(mimeType: string): Extension {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

/** One armed microphone plus one recorder per caption beat. */
export class VoiceRecorder {
  private readonly slug: string;
  private readonly hooks: VoiceRecorderOptions;
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private levelData: Uint8Array<ArrayBuffer> | null = null;
  private recorder: MediaRecorder | null = null;
  private queue: Promise<void> = Promise.resolve();
  private generation = 0;
  private armed = false;
  private status: RecorderStatus = 'idle';
  private disposed = false;

  public constructor(options: VoiceRecorderOptions) {
    this.slug = options.slug;
    this.hooks = options;
  }

  /** The current recorder state; the panel renders it. */
  public get currentStatus(): RecorderStatus {
    return this.status;
  }

  /** Request and keep the microphone. Safe to call twice. */
  public async arm(): Promise<boolean> {
    if (this.armed) return true;
    if (!hasMicrophone() || typeof MediaRecorder === 'undefined') {
      this.error(
        'The microphone is only available on localhost (a secure context). Open the studio at http://localhost:9000.',
      );
      return false;
    }
    if (typeof AudioContext === 'undefined') {
      this.error('This browser cannot decode audio clips; use a current Chrome, Edge or Safari.');
      return false;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
      await this.startMeter();
      this.armed = true;
      this.setStatus('armed');
      return true;
    } catch (error) {
      this.releaseStream();
      this.error(`Could not open the microphone: ${(error as Error).message}`);
      return false;
    }
  }

  /** Stop the running clip and release the microphone. */
  public disarm(): void {
    this.armed = false;
    this.stop();
    this.queue = this.queue.then(() => {
      this.releaseStream();
      this.setStatus('idle');
    });
  }

  /**
   * Start recording a beat. Any running clip is stopped first; the newest call
   * wins, so a burst of `say` replays while seeking starts only the last beat.
   */
  public start(id: string, name: string): void {
    if (!this.armed || this.disposed) return;
    const generation = ++this.generation;
    this.queue = this.queue
      .then(() => this.begin(id, name, generation))
      .catch(error => this.error(`Could not start the recorder: ${(error as Error).message}`));
  }

  /** Stop the running clip and keep the microphone armed. */
  public stop(): void {
    this.generation += 1;
    this.queue = this.queue
      .then(() => this.stopCurrent())
      .catch(error => this.error(`Could not stop the recorder: ${(error as Error).message}`));
  }

  /** Normalized 0..1 input level for the panel meter. */
  public level(): number {
    if (!this.analyser || !this.levelData || !this.armed) return 0;
    this.analyser.getByteTimeDomainData(this.levelData);
    let sum = 0;
    for (const value of this.levelData) {
      const centered = (value - 128) / 128;
      sum += centered * centered;
    }
    return Math.min(1, Math.sqrt(sum / this.levelData.length) * 3);
  }

  /** Release everything; the panel calls this when it unmounts. */
  public dispose(): void {
    this.disposed = true;
    this.disarm();
  }

  private async begin(id: string, name: string, generation: number): Promise<void> {
    await this.stopCurrent();
    if (this.disposed || !this.armed || generation !== this.generation || !this.stream) return;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(this.stream, mimeType ? {mimeType} : undefined);
    const chunks: Blob[] = [];

    recorder.addEventListener('dataavailable', event => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener('stop', () => {
      void this.finish(id, name, chunks, recorder.mimeType);
    });
    recorder.start();

    this.recorder = recorder;
    this.setStatus('recording');
  }

  private stopCurrent(): Promise<void> {
    const recorder = this.recorder;
    this.recorder = null;
    if (!recorder || recorder.state === 'inactive') {
      this.setStatus(this.armed ? 'armed' : 'idle');
      return Promise.resolve();
    }

    return new Promise(resolve => {
      recorder.addEventListener(
        'stop',
        () => {
          this.setStatus(this.armed ? 'armed' : 'idle');
          resolve();
        },
        {once: true},
      );
      try {
        recorder.stop();
      } catch {
        this.setStatus(this.armed ? 'armed' : 'idle');
        resolve();
      }
    });
  }

  private async finish(id: string, name: string, chunks: Blob[], mimeType: string): Promise<void> {
    if (chunks.length === 0) return;
    const blob = new Blob(chunks, {type: mimeType || chunks[0].type});
    const seconds = await this.measure(blob, id);
    if (seconds === null) return;

    if (seconds < MIN_CLIP_SECONDS) {
      this.hooks.onDiscard?.(id, seconds);
      return;
    }

    const ext = extensionFor(mimeType || blob.type);
    const query = new URLSearchParams({
      slug: this.slug,
      id,
      seconds: seconds.toFixed(3),
      ext,
      name,
    });

    try {
      const response = await fetch(`/__voice/clip?${query}`, {method: 'POST', body: blob});
      if (!response.ok) throw new Error(`the voice server answered ${response.status}`);
      const entry = (await response.json()) as VoiceClip;
      this.hooks.onClip?.({id, name, ...entry});
    } catch (error) {
      this.error(`Could not upload clip ${id}: ${(error as Error).message}`);
    }
  }

  private async measure(blob: Blob, id: string): Promise<number | null> {
    if (!this.context) {
      this.error('The audio context is not ready.');
      return null;
    }
    try {
      const data = await blob.arrayBuffer();
      const buffer = await this.context.decodeAudioData(data);
      return buffer.duration;
    } catch {
      this.error(`Could not measure clip ${id}; it was discarded.`);
      return null;
    }
  }

  private async startMeter(): Promise<void> {
    if (!this.stream) return;

    this.context = new AudioContext();
    await this.context.resume();
    this.source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.source.connect(this.analyser);
    this.levelData = new Uint8Array(this.analyser.fftSize);
  }

  private releaseStream(): void {
    this.recorder = null;
    this.source?.disconnect();
    this.source = null;
    this.analyser = null;
    this.levelData = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    const context = this.context;
    this.context = null;
    if (context) void context.close().catch((): void => undefined);
  }

  private setStatus(status: RecorderStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.hooks.onStatusChange?.(status);
  }

  private error(message: string): void {
    this.hooks.onError?.(message);
  }
}
