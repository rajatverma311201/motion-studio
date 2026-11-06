#!/usr/bin/env node
/**
 * Start the Motion Canvas editor in a chosen look and recording mode.
 *
 *   pnpm studio --theme tokyo-night --mode light
 *   pnpm studio --voice record
 *   pnpm studio -- --pause chapter
 *   pnpm studio --print
 *
 * The values are passed to Vite as VIDEO_THEME / VIDEO_MODE / VIDEO_PAUSE /
 * VIDEO_VOICE; apps/studio/vite.config.ts turns them into build-time constants.
 * "Render" in the editor then writes the MP4.
 */
import {spawn} from 'node:child_process';
import {themeIds} from '../../packages/video-kit/src/themes/registry.ts';

const MODES = ['dark', 'light'];
const PAUSE_MODES = ['beat', 'chapter', 'off'];
const VOICE_MODES = ['off', 'record', 'play'];
const USAGE = `Usage:
  pnpm studio [--theme <id>] [--mode dark|light] [--pause beat|chapter|off]
              [--voice off|record|play] [--port <n>] [--print]

Examples:
  pnpm studio --theme tokyo-night --mode light
  pnpm studio --voice record
  pnpm studio:dev`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = [...argv];
  if (args[0] === '--') args.shift();

  const parsed = {
    theme: undefined,
    mode: undefined,
    pause: undefined,
    voice: undefined,
    port: 9000,
    print: false,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--print') {
      parsed.print = true;
    } else if (arg === '--theme') {
      parsed.theme = args[++i];
      if (parsed.theme === undefined) fail('--theme needs a value');
    } else if (arg.startsWith('--theme=')) {
      parsed.theme = arg.slice('--theme='.length);
    } else if (arg === '--mode') {
      parsed.mode = args[++i];
      if (parsed.mode === undefined) fail('--mode needs a value');
    } else if (arg.startsWith('--mode=')) {
      parsed.mode = arg.slice('--mode='.length);
    } else if (arg === '--pause') {
      parsed.pause = args[++i];
      if (parsed.pause === undefined) fail('--pause needs a value');
    } else if (arg.startsWith('--pause=')) {
      parsed.pause = arg.slice('--pause='.length);
    } else if (arg === '--voice') {
      parsed.voice = args[++i];
      if (parsed.voice === undefined) fail('--voice needs a value');
    } else if (arg.startsWith('--voice=')) {
      parsed.voice = arg.slice('--voice='.length);
    } else if (arg === '--port') {
      parsed.port = Number(args[++i]);
    } else if (arg.startsWith('--port=')) {
      parsed.port = Number(arg.slice('--port='.length));
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      fail(`unknown option ${arg}\n\n${USAGE}`);
    }
  }

  return parsed;
}

const {theme, mode, pause, voice, port, print} = parseArgs(process.argv.slice(2));

if (theme !== undefined && !themeIds.includes(theme)) {
  fail(`unknown theme "${theme}". Available: ${themeIds.join(', ')}`);
}
if (mode !== undefined && !MODES.includes(mode)) {
  fail(`unknown mode "${mode}". Available: ${MODES.join(', ')}`);
}
if (pause !== undefined && !PAUSE_MODES.includes(pause)) {
  fail(`unknown pause mode "${pause}". Available: ${PAUSE_MODES.join(', ')}`);
}
if (voice !== undefined && !VOICE_MODES.includes(voice)) {
  fail(`unknown voice mode "${voice}". Available: ${VOICE_MODES.join(', ')}`);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  fail(`unknown port "${port}". Use a whole number between 1 and 65535.`);
}

const env = {...process.env};
delete env.VIDEO_THEME;
delete env.VIDEO_MODE;
delete env.VIDEO_PAUSE;
delete env.VIDEO_VOICE;
if (theme !== undefined) env.VIDEO_THEME = theme;
if (mode !== undefined) env.VIDEO_MODE = mode;
if (pause !== undefined) env.VIDEO_PAUSE = pause;
if (voice !== undefined) env.VIDEO_VOICE = voice;

const command = ['--filter', '@motion-studio/studio', 'exec', 'vite', '--port', String(port)];

if (print) {
  console.log(
    `VIDEO_THEME=${theme ?? ''} VIDEO_MODE=${mode ?? ''} ` + `VIDEO_PAUSE=${pause ?? ''} VIDEO_VOICE=${voice ?? ''}`,
  );
  console.log(`COMMAND=pnpm ${command.join(' ')}`);
  process.exit(0);
}

console.log(`Motion Canvas editor  http://localhost:${port}`);
console.log(
  `Look from flags: ${theme ?? '(not set)'} / ${mode ?? '(not set)'}   ` +
    '(lesson and config settings still apply to anything not given)',
);
console.log(
  `Voice from flags: pause ${pause ?? '(not set)'} / voice ${voice ?? '(not set)'}   ` +
    '(a manifest with clips makes play the default)',
);
console.log('Remember: the URL hash (#theme=...&mode=...) overrides these flags.');

const child = spawn('pnpm', command, {stdio: 'inherit', env});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('error', error => {
  console.error(`failed to start the editor: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
