import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {cp, copyFile, mkdir, mkdtemp, readFile, rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REAL_ROOT = path.resolve(SCRIPT_DIR, '../..');
const SYNC = path.join(SCRIPT_DIR, 'sync-themes.mjs');
const TSX = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;

const MODES = ['dark', 'light'];
const COLOR_KEYS = [
  'bg',
  'grid',
  'surf',
  'surf2',
  'code',
  'ink',
  'onAccent',
  'border',
  'mute',
  'dim',
  'brand',
  'onBrand',
  'lime',
  'pink',
  'cyan',
  'yellow',
  'violet',
  'orange',
  'red',
  'redBg',
  'limeBg',
];

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-studio-themes-'));
  await mkdir(path.join(root, 'packages/video-kit/src'), {recursive: true});
  await mkdir(path.join(root, 'apps/docs/src/generated'), {recursive: true});
  await mkdir(path.join(root, 'tools/scripts'), {recursive: true});
  await cp(path.join(REAL_ROOT, 'packages/video-kit/src/themes'), path.join(root, 'packages/video-kit/src/themes'), {
    recursive: true,
  });
  await copyFile(SYNC, path.join(root, 'tools/scripts/sync-themes.mjs'));
  return root;
}

test('writes fonts, shape and hud for every theme variant', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = spawnSync(process.execPath, ['--import', TSX, SYNC], {
    cwd: root,
    encoding: 'utf8',
    env: {...process.env, MOTION_STUDIO_ROOT: root},
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /synced 7 themes/);

  const file = path.join(root, 'apps/docs/src/generated/themes.json');
  const raw = await readFile(file, 'utf8');
  assert.ok(raw.endsWith('\n'), 'the file ends with a newline');
  assert.equal(raw, `${JSON.stringify(JSON.parse(raw), null, 2)}\n`, 'the file is 2-space JSON');

  const data = JSON.parse(raw);
  assert.equal(data.defaultThemeId, 'neubrutal');
  assert.equal(data.themes.length, 7);

  for (const theme of data.themes) {
    assert.deepEqual(Object.keys(theme), ['id', 'name', 'family', 'description', 'defaultMode', 'fonts', 'variants']);
    for (const key of ['id', 'name', 'family', 'description', 'defaultMode']) {
      assert.equal(typeof theme[key], 'string', `${theme.id} ${key} is a string`);
      assert.ok(theme[key].length > 0, `${theme.id} ${key} is not empty`);
    }
    assert.ok(MODES.includes(theme.defaultMode), `${theme.id} defaultMode is dark or light`);

    assert.deepEqual(Object.keys(theme.fonts), ['sans', 'mono', 'display']);
    for (const [key, value] of Object.entries(theme.fonts)) {
      assert.equal(typeof value, 'string', `${theme.id} fonts.${key} is a string`);
      assert.ok(value.length > 0, `${theme.id} fonts.${key} is not empty`);
      assert.ok(!/["',]/.test(value), `${theme.id} fonts.${key} is one family without quotes: ${value}`);
    }

    for (const mode of MODES) {
      const variant = theme.variants[mode];
      assert.ok(variant, `${theme.id} has a ${mode} variant`);
      assert.deepEqual(Object.keys(variant), ['colors', 'shape', 'hud']);

      assert.deepEqual(Object.keys(variant.colors), COLOR_KEYS, `${theme.id}/${mode} has all colour keys`);
      for (const [key, value] of Object.entries(variant.colors)) {
        assert.equal(typeof value, 'string', `${theme.id}/${mode} colors.${key} is a string`);
        assert.ok(value.length > 0, `${theme.id}/${mode} colors.${key} is not empty`);
      }

      assert.deepEqual(Object.keys(variant.shape), ['radiusScale', 'borderWidthScale', 'elevation']);
      assert.equal(typeof variant.shape.radiusScale, 'number', `${theme.id}/${mode} radiusScale is a number`);
      assert.equal(typeof variant.shape.borderWidthScale, 'number', `${theme.id}/${mode} borderWidthScale is a number`);
      assert.ok(variant.shape.elevation.length > 0, `${theme.id}/${mode} elevation is not empty`);

      assert.deepEqual(Object.keys(variant.hud), ['captionStyle', 'titleStyle', 'gridVisible']);
      assert.ok(variant.hud.captionStyle.length > 0, `${theme.id}/${mode} captionStyle is not empty`);
      assert.ok(variant.hud.titleStyle.length > 0, `${theme.id}/${mode} titleStyle is not empty`);
      assert.equal(typeof variant.hud.gridVisible, 'boolean', `${theme.id}/${mode} gridVisible is a boolean`);
    }
  }

  const byId = Object.fromEntries(data.themes.map(theme => [theme.id, theme]));
  assert.deepEqual(byId.neubrutal.fonts, {
    sans: 'Space Grotesk',
    mono: 'JetBrains Mono',
    display: 'Space Grotesk',
  });
  assert.equal(byId['paper-editorial'].fonts.display, 'Fraunces');
  assert.equal(byId['terminal-green'].fonts.sans, 'JetBrains Mono');
  assert.equal(byId['terminal-green'].variants.dark.shape.elevation, 'glow');
});
