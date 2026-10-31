#!/usr/bin/env node
/**
 * Pixel-compare captured frames against the baseline.
 *
 *   node compare.mjs [--quick] [slug ...]
 *
 * `--quick` compares only frames marked `"quick": true` in frames.json.
 * A frame passes at a diff ratio of at most 0.4 %, which leaves room for
 * anti-aliasing noise but not for a real visual change.
 */
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {existsSync} from 'node:fs';
import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = path.resolve(HERE, '../../.snapshots');
const BASELINE_DIR = path.join(SNAPSHOT_DIR, 'baseline');
const CURRENT_DIR = path.join(SNAPSHOT_DIR, 'current');
const DIFF_DIR = path.join(SNAPSHOT_DIR, 'diff');
const PASS_RATIO = 0.004;

const baselineSlugs = existsSync(BASELINE_DIR)
  ? (await readdir(BASELINE_DIR, {withFileTypes: true}))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
  : [];

const rawArgs = process.argv.slice(2);
const quick = rawArgs.includes('--quick');
const requested = rawArgs.filter(arg => arg !== '--' && arg !== '--quick');
const slugs = requested.length > 0 ? requested : baselineSlugs;

const frames = JSON.parse(await readFile(path.join(HERE, 'frames.json'), 'utf8'));
const quickNames = new Set();
if (quick) {
  for (const [slug, project] of Object.entries(frames)) {
    for (const capture of project.captures) {
      if (capture.quick !== true) continue;
      const sectionName = project.sectionAware ? `s${capture.section}` : 'all';
      for (const time of capture.times) quickNames.add(`${slug}/${sectionName}_t${time}.png`);
    }
  }
}

if (slugs.length === 0) {
  console.error('no baseline frames found in .snapshots/baseline');
  process.exit(1);
}

let total = 0;
let passed = 0;
let failed = 0;
let missing = 0;
const runStarted = Date.now();

for (const slug of slugs) {
  const baselineSlugDir = path.join(BASELINE_DIR, slug);
  if (!existsSync(baselineSlugDir)) {
    console.log(`${slug}  NO BASELINE`);
    failed += 1;
    continue;
  }

  const allNames = (await readdir(baselineSlugDir)).filter(name => name.toLowerCase().endsWith('.png')).sort();
  const names = quick ? allNames.filter(name => quickNames.has(`${slug}/${name}`)) : allNames;

  if (names.length === 0) {
    if (quick) {
      console.log(`${slug}  NO QUICK FRAMES`);
      continue;
    }
    console.log(`${slug}  NO BASELINE`);
    failed += 1;
    continue;
  }

  for (const name of names) {
    total += 1;
    const frameStarted = Date.now();
    const label = `${slug}/${name}`;
    const currentFile = path.join(CURRENT_DIR, slug, name);
    if (!existsSync(currentFile)) {
      missing += 1;
      failed += 1;
      const elapsed = ((Date.now() - frameStarted) / 1000).toFixed(1);
      console.log(`${label.padEnd(48)} ${'--'.padStart(9)}  MISSING  ${elapsed}s`);
      continue;
    }

    const baseline = PNG.sync.read(await readFile(path.join(baselineSlugDir, name)));
    const current = PNG.sync.read(await readFile(currentFile));

    if (baseline.width !== current.width || baseline.height !== current.height) {
      failed += 1;
      const elapsed = ((Date.now() - frameStarted) / 1000).toFixed(1);
      console.log(
        `${label.padEnd(48)} ${'--'.padStart(9)}  SIZE ` +
          `(baseline ${baseline.width}x${baseline.height}, current ${current.width}x${current.height})  ${elapsed}s`,
      );
      continue;
    }

    const {width, height} = baseline;
    const diff = new PNG({width, height});
    const diffPixels = pixelmatch(baseline.data, current.data, diff.data, width, height, {
      threshold: 0.12,
    });
    const ratio = diffPixels / (width * height);
    const ok = ratio <= PASS_RATIO;

    if (ratio > 0) {
      const diffFile = path.join(DIFF_DIR, slug, name);
      await mkdir(path.dirname(diffFile), {recursive: true});
      await writeFile(diffFile, PNG.sync.write(diff));
    }

    if (ok) passed += 1;
    else failed += 1;

    const percent = `${(ratio * 100).toFixed(3)}%`;
    const elapsed = ((Date.now() - frameStarted) / 1000).toFixed(1);
    console.log(`${label.padEnd(48)} ${percent.padStart(9)}  ${ok ? 'PASS' : 'FAIL'}  ${elapsed}s`);
  }
}

const totalSeconds = ((Date.now() - runStarted) / 1000).toFixed(1);
console.log('');
console.log(
  `frames ${total}  passed ${passed}  failed ${failed}  missing ${missing}  ` +
    `threshold ${(PASS_RATIO * 100).toFixed(1)}%  total ${totalSeconds}s${quick ? ' (quick subset)' : ''}`,
);
if (failed > 0 || total === 0) {
  process.exitCode = 1;
}
