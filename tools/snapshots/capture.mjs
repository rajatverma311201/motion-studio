#!/usr/bin/env node
/**
 * Capture stage frames from the Motion Canvas editor.
 *
 *   node capture.mjs <baseline|current> [slug ...]
 *
 * Playback is real time, so the script plays the scene with Space and polls the
 * editor timecode until the wanted second is reached before screenshotting the
 * stage. Pages are opened one at a time on purpose: the editor rewrites .meta
 * files, which hot-restarts any other open page.
 */
import {chromium} from 'playwright';
import {mkdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STAGE_CLIP = {x: 454, y: 22, width: 1536, height: 864};
const POLL_MS = 150;
const STARTUP_MS = 4000;
const STALL_MS = 20000;
const STUDIO_URL = process.env.STUDIO_URL ?? 'http://127.0.0.1:9000';
const SNAPSHOT_DIR = path.resolve(HERE, '../../.snapshots');

const args = process.argv.slice(2);
// The root scripts end in `--`; pnpm 12 forwards that separator literally.
if (args[0] === '--') args.shift();

const label = args[0];
if (label !== 'baseline' && label !== 'current') {
  console.error('usage: node capture.mjs <baseline|current> [slug ...]');
  process.exit(2);
}

const frames = JSON.parse(await readFile(path.join(HERE, 'frames.json'), 'utf8'));
const requested = args.slice(1);
const unknown = requested.filter(slug => !(slug in frames));
if (unknown.length > 0) {
  console.error(`unknown project slug(s): ${unknown.join(', ')}`);
  process.exit(2);
}
const slugs = requested.length > 0 ? requested : Object.keys(frames);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Read the editor timecode (HH:MM:SS:FF at 30 fps). Returns -1 when absent. */
async function sceneTime(page) {
  const txt = await page.locator('body').innerText();
  const m = /(\d\d):(\d\d):(\d\d):(\d\d)\s*\[/.exec(txt);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 30 : -1;
}

/**
 * Poll until the timecode reaches `target`. Two guards keep a finished section
 * from hanging the run: the absolute deadline from the spec and a 20 s stall
 * detector for a timecode that stopped advancing altogether.
 */
async function waitForTime(page, target) {
  const started = Date.now();
  const deadline = Math.max(240000, target * 3000);
  let lastTime = -1;
  let lastAdvance = started;
  let reached = false;

  while (!reached) {
    const now = await sceneTime(page);
    if (now >= target) {
      reached = true;
    } else {
      const at = Date.now();
      if (now > lastTime) {
        lastTime = now;
        lastAdvance = at;
      } else if (at - lastAdvance > STALL_MS) {
        return {ok: false, reason: 'stalled'};
      }
      if (at - started > deadline) {
        return {ok: false, reason: 'deadline'};
      }
      await sleep(POLL_MS);
    }
  }
  return {ok: true};
}

const failures = [];
const realErrors = [];

const browser = await chromium.launch({headless: true});

for (const slug of slugs) {
  const project = frames[slug];

  for (const capture of project.captures) {
    const section = project.sectionAware ? capture.section : null;
    const sectionName = section == null ? 'all' : `s${section}`;
    const url = `${STUDIO_URL}/src/projects/${slug}` + (section == null ? '' : `#s=${section}`);
    const outDir = path.join(SNAPSHOT_DIR, label, slug);
    await mkdir(outDir, {recursive: true});

    const page = await browser.newPage({viewport: {width: 2000, height: 1150}});
    const errors = [];
    page.on('pageerror', error => {
      if (!error.message.includes('Failed to fetch')) {
        errors.push(`pageerror: ${error.message}`);
      }
    });
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (!/Failed to load resource|fonts|net::|Connection timeout/.test(text)) {
        errors.push(`console: ${text}`);
      }
    });

    try {
      await page.goto(url, {waitUntil: 'load'});
      await page.waitForTimeout(STARTUP_MS);
      await page.keyboard.press('Space');

      for (const time of capture.times) {
        const result = await waitForTime(page, time);
        if (!result.ok) {
          const reason = result.reason === 'stalled' ? 'timeout' : 'deadline';
          failures.push(`${slug} ${sectionName} ${reason} at ${time}`);
          console.log(`[${label}] ${slug} ${sectionName} ${reason} at ${time}`);
          continue;
        }

        const file = path.join(outDir, `${sectionName}_t${time}.png`);
        await page.screenshot({path: file, clip: STAGE_CLIP});
        console.log(`[${label}] ${slug} ${sectionName} t${time} ok`);
      }
    } catch (error) {
      failures.push(`${slug} ${sectionName} ${String(error.message).split('\n')[0]}`);
      console.log(`[${label}] ${slug} ${sectionName} FAILED ${error.message}`);
    } finally {
      await page.close();
    }

    for (const error of errors) {
      console.log(`[${label}] ${slug} ${sectionName} ${error}`);
    }
    if (errors.length > 0) realErrors.push(...errors.map(error => `${slug} ${sectionName} ${error}`));
  }
}

await browser.close();

console.log(`[${label}] captured ${slugs.length} project(s)`);
if (failures.length > 0) {
  console.log(`[${label}] ${failures.length} capture failure(s):`);
  for (const failure of failures) console.log(`  - ${failure}`);
}
if (realErrors.length > 0) {
  console.log(`[${label}] ${realErrors.length} real browser error(s):`);
  for (const error of realErrors) console.log(`  - ${error}`);
}
console.log('DONE');
process.exitCode = failures.length > 0 || realErrors.length > 0 ? 1 : 0;
