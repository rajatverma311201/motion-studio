import fs from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'vite';
import motionCanvas from '@motion-canvas/vite-plugin';
import ffmpeg from '@motion-canvas/ffmpeg';
import {voiceServerPlugin} from './voice-server/plugin.mjs';

const THEME_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MODES = ['dark', 'light'];

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** The repo-root default look. A missing or broken file means "no config values". */
function readConfigLook(): {theme: string; mode: string} {
  const file = path.resolve(__dirname, '../../video.config.json');
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return {theme: '', mode: ''};
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`video.config.json is not valid JSON: ${(error as Error).message}`, {cause: error});
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {theme: '', mode: ''};
  }
  const config = data as Record<string, unknown>;
  return {theme: text(config.theme), mode: text(config.mode)};
}

const cliTheme = process.env.VIDEO_THEME ?? '';
const cliMode = process.env.VIDEO_MODE ?? '';
const cliPause = process.env.VIDEO_PAUSE ?? '';
const cliVoice = process.env.VIDEO_VOICE ?? '';

if (cliTheme && !THEME_ID.test(cliTheme)) {
  throw new Error(
    `Unknown VIDEO_THEME "${cliTheme}": expected a kebab-case theme id such as "tokyo-night". ` +
      'Run the editor through `pnpm studio --theme <id>` to validate against the registry.',
  );
}
if (cliMode && !MODES.includes(cliMode)) {
  throw new Error(`Unknown VIDEO_MODE "${cliMode}". Available modes: ${MODES.join(', ')}.`);
}

const configLook = readConfigLook();

export default defineConfig(({command}) => ({
  define: {
    __VIDEO_CLI_THEME__: JSON.stringify(cliTheme),
    __VIDEO_CLI_MODE__: JSON.stringify(cliMode),
    __VIDEO_CONFIG_THEME__: JSON.stringify(configLook.theme),
    __VIDEO_CONFIG_MODE__: JSON.stringify(configLook.mode),
    __VIDEO_CLI_PAUSE__: JSON.stringify(cliPause),
    __VIDEO_CLI_VOICE__: JSON.stringify(cliVoice),
    __VIDEO_DEV__: JSON.stringify(command === 'serve'),
  },
  plugins: [motionCanvas({project: ['./src/projects/*.ts']}), ffmpeg(), voiceServerPlugin()],
  resolve: {dedupe: ['@motion-canvas/core', '@motion-canvas/2d']},
  server: {
    watch: {
      // Voice clips are written while the editor runs. Watching them would
      // reload the page in the middle of a recording.
      ignored: ['**/voice/**'],
    },
  },
  build: {
    outDir: '../docs/public/videos',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'projects/[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
}));
