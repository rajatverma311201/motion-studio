import type {ThemeMode, ThemesJson} from './themes';

export interface Look {
  themeId: string;
  mode: ThemeMode;
}

export interface LookSelection extends Look {
  section: number;
}

/** Every look in file order, dark then light: 7 themes become 14 looks. */
export function listLooks(data: ThemesJson): Look[] {
  return data.themes.flatMap(theme => [
    {themeId: theme.id, mode: 'dark' as const},
    {themeId: theme.id, mode: 'light' as const},
  ]);
}

function parseSection(value: unknown): number {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed)) return 0;
  return Math.min(5, Math.max(0, parsed));
}

/**
 * Normalise the `/themes` search params: unknown theme falls back to the generated default,
 * an unknown mode falls back to that theme's default, and `s` is clamped to 0..5.
 */
export function parseLookSearch(
  search: {theme?: unknown; mode?: unknown; s?: unknown},
  data: ThemesJson,
): LookSelection {
  const theme =
    data.themes.find(item => item.id === search.theme) ?? data.themes.find(item => item.id === data.defaultThemeId);
  if (!theme) return {themeId: data.defaultThemeId, mode: 'dark', section: parseSection(search.s)};

  const mode = search.mode === 'dark' || search.mode === 'light' ? search.mode : theme.defaultMode;
  return {themeId: theme.id, mode, section: parseSection(search.s)};
}

/** Move one look in the flat list and wrap around at either end. */
export function stepLook(looks: Look[], current: Look, direction: 1 | -1): Look {
  if (looks.length === 0) return current;

  const index = looks.findIndex(look => look.themeId === current.themeId && look.mode === current.mode);
  if (index === -1) return direction === 1 ? looks[0] : looks[looks.length - 1];

  return looks[(index + direction + looks.length) % looks.length];
}

/** CLI command that starts the studio in a look. */
export function renderCommand(look: Look): string {
  return `pnpm studio --theme ${look.themeId} --mode ${look.mode}`;
}

/** The two lines to add to a lesson's chapters.json. */
export function chaptersSnippet(look: Look): string {
  return `"theme": "${look.themeId}",\n"mode": "${look.mode}"`;
}

/** Full video.config.json body for a look. */
export function configSnippet(look: Look): string {
  return JSON.stringify(
    {
      $schema: './video.config.schema.json',
      theme: look.themeId,
      mode: look.mode,
    },
    null,
    2,
  );
}
