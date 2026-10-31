import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {copyFile, cp, mkdir, mkdtemp, readFile, rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REAL_ROOT = path.resolve(SCRIPT_DIR, '../..');
const GENERATOR = path.join(SCRIPT_DIR, 'new-theme.mjs');
const SYNC = path.join(SCRIPT_DIR, 'sync-themes.mjs');
const TSX = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-studio-theme-'));
  await mkdir(path.join(root, 'packages/video-kit/src'), {recursive: true});
  await mkdir(path.join(root, 'apps/docs/src/generated'), {recursive: true});
  await mkdir(path.join(root, 'tools/scripts'), {recursive: true});
  await cp(path.join(REAL_ROOT, 'packages/video-kit/src/themes'), path.join(root, 'packages/video-kit/src/themes'), {
    recursive: true,
  });
  await copyFile(SYNC, path.join(root, 'tools/scripts/sync-themes.mjs'));
  return root;
}

function run(root, args) {
  return spawnSync(process.execPath, ['--import', TSX, GENERATOR, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: {...process.env, MOTION_STUDIO_ROOT: root},
  });
}

function read(root, ...parts) {
  return readFile(path.join(root, ...parts), 'utf8');
}

test('copies both variants, rewrites the identity and registers the theme', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, ['midnight-purple', 'Midnight Purple', '--from', 'tokyo-night']);
  assert.equal(result.status, 0, result.stderr);

  const theme = await read(root, 'packages/video-kit/src/themes', 'midnight-purple.ts');
  assert.match(theme, /export const midnightPurpleTheme: Theme = \{/);
  assert.match(theme, /id: 'midnight-purple'/);
  assert.match(theme, /name: 'Midnight Purple'/);
  assert.match(theme, /description: 'TODO: describe this theme\.'/);
  assert.match(theme, /defaultMode: 'dark'/);
  assert.match(theme, /variants: \{/);
  assert.match(theme, /dark: \{/);
  assert.match(theme, /light: \{/);
  assert.match(theme, /bg: '#1A1B26'/, 'dark variant is copied');

  const registry = await read(root, 'packages/video-kit/src/themes', 'registry.ts');
  assert.match(registry, /import \{midnightPurpleTheme\} from '\.\/midnight-purple';/);
  assert.match(registry, /'midnight-purple': midnightPurpleTheme,/);
  const importBlock = registry.slice(
    registry.indexOf('// <generated:imports>'),
    registry.indexOf('// </generated:imports>'),
  );
  assert.match(importBlock, /midnightPurpleTheme/);
  const entryBlock = registry.slice(
    registry.indexOf('// <generated:entries>'),
    registry.indexOf('// </generated:entries>'),
  );
  assert.match(entryBlock, /'midnight-purple': midnightPurpleTheme,/);
  assert.match(registry, /export const DEFAULT_THEME_ID = 'neubrutal';/);

  const generated = JSON.parse(await read(root, 'apps/docs/src/generated/themes.json'));
  const added = generated.themes.find(item => item.id === 'midnight-purple');
  assert.ok(added);
  assert.equal(added.name, 'Midnight Purple');
  assert.equal(added.defaultMode, 'dark');
  assert.deepEqual(
    added.variants.dark.colors,
    generated.themes.find(item => item.id === 'tokyo-night').variants.dark.colors,
  );

  assert.match(result.stdout, /Created theme "midnight-purple" from "tokyo-night"/);
  assert.match(result.stdout, /pnpm snap:themes -- --only midnight-purple/);
  assert.match(result.stdout, /pnpm studio --theme midnight-purple/);
});

test('applies --default-mode', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, ['paper-dusk', 'Paper Dusk', '--from', 'paper-editorial', '--default-mode', 'dark']);
  assert.equal(result.status, 0, result.stderr);

  const theme = await read(root, 'packages/video-kit/src/themes', 'paper-dusk.ts');
  assert.match(theme, /export const paperDuskTheme: Theme = \{/);
  assert.match(theme, /defaultMode: 'dark'/);

  const generated = JSON.parse(await read(root, 'apps/docs/src/generated/themes.json'));
  assert.equal(generated.themes.find(item => item.id === 'paper-dusk').defaultMode, 'dark');
});

test('refuses to overwrite an existing theme file', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  assert.equal(run(root, ['midnight-purple', 'Midnight Purple', '--from', 'tokyo-night']).status, 0);
  const result = run(root, ['midnight-purple', 'Midnight Purple', '--from', 'tokyo-night']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /refusing to overwrite/);
});

test('rejects an unknown source theme', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, ['midnight-purple', 'Midnight Purple', '--from', 'nope']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown theme "nope"\. Available: neubrutal/);
});

test('rejects a non-kebab-case id', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, ['MidnightPurple', 'Midnight Purple', '--from', 'tokyo-night']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be kebab-case/);
});

test('rejects an unknown default mode', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, ['midnight-purple', 'Midnight Purple', '--from', 'tokyo-night', '--default-mode', 'sepia']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown default mode "sepia"\. Available: dark, light/);
});
