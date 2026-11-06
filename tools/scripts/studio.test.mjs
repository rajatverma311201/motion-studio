import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const STUDIO = path.join(SCRIPT_DIR, 'studio.mjs');
const TSX = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;

function run(args) {
  return spawnSync(process.execPath, ['--import', TSX, STUDIO, ...args], {
    cwd: SCRIPT_DIR,
    encoding: 'utf8',
  });
}

test('prints the flags and the vite command', () => {
  const result = run(['--theme', 'tokyo-night', '--mode', 'light', '--print']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /VIDEO_THEME=tokyo-night VIDEO_MODE=light/);
  assert.match(result.stdout, /COMMAND=pnpm --filter @motion-studio\/studio exec vite --port 9000/);
});

test('prints empty values when no flags are given', () => {
  const result = run(['--print']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /VIDEO_THEME= VIDEO_MODE=/);
});

test('accepts a port and one flag, and ignores a leading double dash', () => {
  const result = run(['--', '--mode=dark', '--port', '9100', '--print']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /VIDEO_THEME= VIDEO_MODE=dark/);
  assert.match(result.stdout, /vite --port 9100/);
});

test('accepts --theme=<id>', () => {
  const result = run(['--theme=shadcn', '--print']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /VIDEO_THEME=shadcn VIDEO_MODE=/);
});

test('rejects an unknown theme', () => {
  const result = run(['--theme', 'nope', '--print']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown theme "nope"\. Available: neubrutal, shadcn, notebook/);
});

test('rejects an unknown mode', () => {
  const result = run(['--mode', 'sepia', '--print']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown mode "sepia"\. Available: dark, light/);
});

test('rejects an unknown option', () => {
  const result = run(['--fast', '--print']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown option --fast/);
});

test('prints the pause and voice flags', () => {
  const result = run(['--pause', 'chapter', '--voice', 'record', '--print']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /VIDEO_PAUSE=chapter VIDEO_VOICE=record/);
});

test('prints empty pause and voice values without flags', () => {
  const result = run(['--print']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /VIDEO_PAUSE= VIDEO_VOICE=/);
});

test('accepts --pause=<mode> and --voice=<mode>', () => {
  const result = run(['--pause=off', '--voice=play', '--print']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /VIDEO_PAUSE=off VIDEO_VOICE=play/);
});

test('rejects an unknown pause mode', () => {
  const result = run(['--pause', 'sometimes', '--print']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown pause mode "sometimes"\. Available: beat, chapter, off/);
});

test('rejects an unknown voice mode', () => {
  const result = run(['--voice', 'loud', '--print']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown voice mode "loud"\. Available: off, record, play/);
});

test('rejects a pause flag without a value', () => {
  const result = run(['--pause']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--pause needs a value/);
});

test('rejects a voice flag without a value', () => {
  const result = run(['--voice']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--voice needs a value/);
});
