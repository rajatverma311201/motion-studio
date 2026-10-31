export type PlayerMode = 'dark' | 'light';

export interface PlayerVariablesInput {
  startSection: number;
  theme?: string;
  mode?: PlayerMode;
}

/**
 * JSON for the `variables` attribute of `<motion-canvas-player>`.
 * Look fields are left out when not given, so existing callers keep the same attribute.
 *
 * @example
 * buildPlayerVariables({startSection: 2, theme: 'tokyo-night', mode: 'light'});
 * // '{"startSection":2,"theme":"tokyo-night","mode":"light"}'
 */
export function buildPlayerVariables({startSection, theme, mode}: PlayerVariablesInput): string {
  return JSON.stringify({
    startSection,
    ...(theme ? {theme} : {}),
    ...(mode ? {mode} : {}),
  });
}
