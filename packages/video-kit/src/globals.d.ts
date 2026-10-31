/**
 * Build-time look constants. `apps/studio/vite.config.ts` replaces them through
 * Vite `define`; in Vitest and plain Node they are undeclared, so readers must
 * guard with `typeof`.
 */

export {};

declare global {
  const __VIDEO_CLI_THEME__: string;
  const __VIDEO_CLI_MODE__: string;
  const __VIDEO_CONFIG_THEME__: string;
  const __VIDEO_CONFIG_MODE__: string;
}
