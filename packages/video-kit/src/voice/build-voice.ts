import type {} from '../globals';
import type {VoiceManifest} from './timing';

/** The voice values baked into the bundle by `apps/studio/vite.config.ts`. */
export interface BuildVoice {
  cliPause: string;
  cliVoice: string;
  /** True in the studio dev server; false for the docs player bundle. */
  dev: boolean;
}

/**
 * Read the build-time voice constants. Vitest and plain Node have none, so
 * `dev` is false and the two flags are empty strings there.
 *
 * @example
 * const {cliPause, dev} = readBuildVoice();
 */
export function readBuildVoice(): BuildVoice {
  return {
    cliPause: typeof __VIDEO_CLI_PAUSE__ === 'undefined' ? '' : __VIDEO_CLI_PAUSE__,
    cliVoice: typeof __VIDEO_CLI_VOICE__ === 'undefined' ? '' : __VIDEO_CLI_VOICE__,
    dev: typeof __VIDEO_DEV__ === 'undefined' ? false : __VIDEO_DEV__,
  };
}

/**
 * Whether a loaded manifest actually holds a clip.
 *
 * @example
 * hasClips({slug: 'demo', version: 1, clips: {}}); // false
 */
export function hasClips(manifest: VoiceManifest | null): boolean {
  return manifest !== null && Object.keys(manifest.clips).length > 0;
}
