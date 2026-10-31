#!/usr/bin/env node
/**
 * Pixel-compare captured frames against the baseline.
 *
 *   node compare.mjs [slug ...]
 *
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

const requested = process.argv.slice(2).filter(arg => arg !== '--');
const slugs = requested.length > 0 ? requested : baselineSlugs;

if (slugs.length === 0) {
  console.error('no baseline frames found in .snapshots/baseline');
  process.exit(1);
}

let total = 0;
let passed = 0;
let failed = 0;
let missing = 0;

for (const slug of slugs) {
  const baselineSlugDir = path.join(BASELINE_DIR, slug);
  if (!existsSync(baselineSlugDir)) {
    console.log(`${slug}  NO BASELINE`);
    failed += 1;
    continue;
  }

  const names = (await readdir(baselineSlugDir)).filter(name => name.toLowerCase().endsWith('.png')).sort();

  if (names.length === 0) {
    console.log(`${slug}  NO BASELINE`);
    failed += 1;
    continue;
  }

  for (const name of names) {
    total += 1;
    const label = `${slug}/${name}`;
    const currentFile = path.join(CURRENT_DIR, slug, name);
    if (!existsSync(currentFile)) {
      missing += 1;
      failed += 1;
      console.log(`${label.padEnd(48)} ${'--'.padStart(9)}  MISSING`);
      continue;
    }

    const baseline = PNG.sync.read(await readFile(path.join(baselineSlugDir, name)));
    const current = PNG.sync.read(await readFile(currentFile));

    if (baseline.width !== current.width || baseline.height !== current.height) {
      failed += 1;
      console.log(
        `${label.padEnd(48)} ${'--'.padStart(9)}  SIZE ` +
          `(baseline ${baseline.width}x${baseline.height}, current ${current.width}x${current.height})`,
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
    console.log(`${label.padEnd(48)} ${percent.padStart(9)}  ${ok ? 'PASS' : 'FAIL'}`);
  }
}

console.log('');
console.log(
  `frames ${total}  passed ${passed}  failed ${failed}  missing ${missing}  ` +
    `threshold ${(PASS_RATIO * 100).toFixed(1)}%`,
);
if (failed > 0 || total === 0) {
  process.exitCode = 1;
}
