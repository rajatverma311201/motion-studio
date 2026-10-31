import type {} from '../globals';

/** The look values baked into the bundle by `apps/studio/vite.config.ts`. */
export interface BuildLook {
  cliTheme: string;
  cliMode: string;
  configTheme: string;
  configMode: string;
}

/**
 * Read the build-time look constants. Vitest and plain Node have none, so every
 * value is an empty string there.
 *
 * @example
 * const {cliTheme, cliMode} = readBuildLook();
 */
export function readBuildLook(): BuildLook {
  return {
    cliTheme: typeof __VIDEO_CLI_THEME__ === 'undefined' ? '' : __VIDEO_CLI_THEME__,
    cliMode: typeof __VIDEO_CLI_MODE__ === 'undefined' ? '' : __VIDEO_CLI_MODE__,
    configTheme: typeof __VIDEO_CONFIG_THEME__ === 'undefined' ? '' : __VIDEO_CONFIG_THEME__,
    configMode: typeof __VIDEO_CONFIG_MODE__ === 'undefined' ? '' : __VIDEO_CONFIG_MODE__,
  };
}

/** Read the browser URL hash without assuming a browser. */
export function readLocationHash(): string | undefined {
  try {
    return typeof location === 'undefined' ? undefined : location.hash;
  } catch {
    return undefined;
  }
}
