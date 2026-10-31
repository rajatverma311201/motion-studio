#!/usr/bin/env node
/**
 * Capture theme-showcase in every theme x mode and write a contact sheet.
 *
 *   node --import tsx themes-run.mjs [--only <theme-id>]
 *
 * Runs the captures sequentially because the editor allows one page at a time.
 * The sheet is written to `.snapshots/themes.html`; thumbnails live in
 * `.snapshots/themes/<slug>--<theme>--<mode>/`.
 */
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {themeIds, themes} from '../../packages/video-kit/src/themes/registry.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SNAPSHOT_DIR = path.join(ROOT, '.snapshots');
const SHEET = path.join(SNAPSHOT_DIR, 'themes.html');
const CAPTURE = path.join(HERE, 'capture.mjs');
const SLUG = 'theme-showcase';
const MODES = ['dark', 'light'];

const frames = JSON.parse(await readFile(path.join(HERE, 'frames.json'), 'utf8'))[SLUG].captures;
const chapters = JSON.parse(
  await readFile(path.join(ROOT, 'apps/studio/src/scenes', SLUG, 'chapters.json'), 'utf8'),
).chapters;

const rawArgs = process.argv.slice(2).filter(arg => arg !== '--');
const onlyIndex = rawArgs.indexOf('--only');
const only = onlyIndex === -1 ? undefined : rawArgs[onlyIndex + 1];

if (onlyIndex !== -1 && only === undefined) {
  console.error('usage: node --import tsx themes-run.mjs [--only <theme-id>]');
  process.exit(2);
}
if (only !== undefined && !themeIds.includes(only)) {
  console.error(`unknown theme "${only}"; known ids: ${themeIds.join(', ')}`);
  process.exit(2);
}

const selected = only === undefined ? themeIds : [only];
const failures = [];

for (const id of selected) {
  for (const mode of MODES) {
    console.log(`[themes] capturing ${themes[id].name} / ${mode}`);
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', CAPTURE, 'themes', SLUG, '--theme', id, '--mode', mode],
      {cwd: HERE, stdio: 'inherit'},
    );
    if (result.status !== 0) failures.push(`${id}/${mode}`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function figure(themeId, mode, capture, index) {
  const name = `s${capture.section}_t${capture.times[0]}.png`;
  const relative = `themes/${SLUG}--${themeId}--${mode}/${name}`;
  const absolute = path.join(SNAPSHOT_DIR, relative);
  const missing = existsSync(absolute) ? '' : ' missing';
  const title = existsSync(absolute) ? '' : ' title="missing capture"';
  return `<figure><img class="${missing.trim()}" src="${escapeHtml(relative)}"${title} alt="${escapeHtml(
    `${themes[themeId].name} ${mode} ${chapters[index]?.name ?? `section ${capture.section}`}`,
  )}"><figcaption>${escapeHtml(chapters[index]?.name ?? `SECTION ${capture.section}`)}</figcaption></figure>`;
}

function row(themeId, mode, label) {
  return `<div class="row"><div class="row-label">${label}</div>${frames
    .map((capture, index) => figure(themeId, mode, capture, index))
    .join('')}</div>`;
}

const blocks = selected
  .map(themeId => {
    const theme = themes[themeId];
    return `<section class="theme">
  <h2>${escapeHtml(theme.name)}</h2>
  <p class="family">${escapeHtml(theme.family)} · ${escapeHtml(theme.id)}</p>
  ${row(themeId, 'dark', 'Dark')}
  ${row(themeId, 'light', 'Light')}
</section>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Theme contact sheet</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 28px;
    background: #101014;
    color: #f4f1ea;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  h1 { margin: 0 0 22px; font-size: 18px; letter-spacing: .12em; text-transform: uppercase; }
  .theme {
    margin: 0 0 32px;
    padding: 18px;
    border: 1px solid #2c2c38;
    border-radius: 10px;
    background: #16161d;
  }
  .theme h2 { margin: 0; font-size: 18px; }
  .family { margin: 3px 0 12px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #9a99a8; }
  .row { display: grid; grid-template-columns: 64px repeat(6, minmax(0, 1fr)); gap: 10px; align-items: start; margin-top: 10px; }
  .row-label { padding-top: 5px; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #9a99a8; }
  figure { margin: 0; }
  img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border: 1px solid #2c2c38; border-radius: 6px; background: #0b0b10; }
  img.missing { opacity: .25; }
  figcaption { margin-top: 5px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #c9c5ba; }
</style>
</head>
<body>
<h1>Theme contact sheet · ${selected.length} theme${selected.length === 1 ? '' : 's'}</h1>
${blocks}
</body>
</html>
`;

await writeFile(SHEET, html, 'utf8');
console.log(
  `[themes] wrote ${path.relative(ROOT, SHEET)} (${selected.length} theme(s) x 2 modes x ${frames.length} chapters)`,
);

if (failures.length > 0) {
  console.error(`[themes] ${failures.length} look(s) failed: ${failures.join(', ')}`);
  process.exitCode = 1;
}
