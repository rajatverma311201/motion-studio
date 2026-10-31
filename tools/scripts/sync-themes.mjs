#!/usr/bin/env node
/**
 * Copy the theme registry's data into the docs app.
 *
 *   node --import tsx tools/scripts/sync-themes.mjs
 *
 * The docs never import video-kit, so the colours (and nothing about shape or
 * HUD) reach it through apps/docs/src/generated/themes.json.
 */
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = process.env.MOTION_STUDIO_ROOT
  ? path.resolve(process.env.MOTION_STUDIO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_FILE = path.join(ROOT, 'apps/docs/src/generated/themes.json');

const {DEFAULT_THEME_ID, themes, themeIds} = await import(
  pathToFileURL(path.join(ROOT, 'packages/video-kit/src/themes/registry.ts')).href
);

const data = {
  defaultThemeId: DEFAULT_THEME_ID,
  themes: themeIds.map(id => {
    const theme = themes[id];
    return {
      id: theme.id,
      name: theme.name,
      family: theme.family,
      description: theme.description,
      defaultMode: theme.defaultMode,
      variants: {
        dark: {colors: theme.variants.dark.colors},
        light: {colors: theme.variants.light.colors},
      },
    };
  }),
};

await mkdir(path.dirname(OUT_FILE), {recursive: true});
await writeFile(OUT_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`synced ${data.themes.length} themes`);
