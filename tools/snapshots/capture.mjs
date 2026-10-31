#!/usr/bin/env node
/**
 * Capture stage frames from the Motion Canvas editor.
 *
 *   node capture.mjs <label> [--quick] [--theme <id>] [--mode dark|light] [slug ...]
 *
 * `--quick` captures only frames marked `"quick": true` in frames.json.
 * `--theme` appends `theme=<id>&mode=<mode>` to the section hash and stores the
 * frames in `<label>/<slug>--<theme>--<mode>/`. A missing `--mode` uses that
 * theme's `defaultMode`.
 * Playback is real time, so the script plays the scene with Space and polls the
 * editor timecode until the wanted second is reached before screenshotting the
 * stage. Pages are opened one at a time on purpose: the editor rewrites .meta
 * files, which hot-restarts any other open page.
 */
import {chromium} from 'playwright';
import {mkdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {themes} from '../../packages/video-kit/src/themes/registry.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STAGE_CLIP = {x: 454, y: 22, width: 1536, height: 864};
const POLL_MS = 150;
const STARTUP_MS = 4000;
const STALL_MS = 20000;
const STUDIO_URL = process.env.STUDIO_URL ?? 'http://127.0.0.1:9000';
const SNAPSHOT_DIR = path.resolve(HERE, '../../.snapshots');

const rawArgs = process.argv.slice(2);
// The root scripts end in `--`; pnpm 12 forwards that separator literally.
const quick = rawArgs.includes('--quick');
let theme;
let mode;
const args = [];
for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--' || arg === '--quick') continue;
  if (arg === '--theme') {
    theme = rawArgs[++i];
    continue;
  }
  if (arg === '--mode') {
    mode = rawArgs[++i];
    continue;
  }
  args.push(arg);
}

const label = args[0];
if (!label || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(label)) {
  console.error('usage: node capture.mjs <label> [--quick] [--theme <id>] [--mode dark|light] [slug ...]');
  process.exit(2);
}

if (theme !== undefined && themes[theme] === undefined) {
  console.error(`unknown theme "${theme}"; known ids: ${Object.keys(themes).join(', ')}`);
  process.exit(2);
}
if (mode !== undefined && mode !== 'dark' && mode !== 'light') {
  console.error(`unknown mode "${mode}"; use dark or light`);
  process.exit(2);
}
if (mode !== undefined && theme === undefined) {
  console.error('--mode requires --theme');
  process.exit(2);
}
const resolvedMode = theme === undefined ? undefined : (mode ?? themes[theme].defaultMode);

const frames = JSON.parse(await readFile(path.join(HERE, 'frames.json'), 'utf8'));
const requested = args.slice(1);
const unknown = requested.filter(slug => !(slug in frames));
if (unknown.length > 0) {
  console.error(`unknown project slug(s): ${unknown.join(', ')}`);
  process.exit(2);
}
const requestedSlugs = requested.length > 0 ? requested : Object.keys(frames);
const slugs = quick
  ? requestedSlugs.filter(slug => frames[slug].captures.some(capture => capture.quick === true))
  : requestedSlugs;

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
const runStarted = Date.now();
let capturedFrames = 0;

const browser = await chromium.launch({headless: true});

for (const slug of slugs) {
  const project = frames[slug];
  const captures = quick ? project.captures.filter(capture => capture.quick === true) : project.captures;

  for (const capture of captures) {
    const section = project.sectionAware ? capture.section : null;
    const sectionName = section == null ? 'all' : `s${section}`;
    const hash = [];
    if (section != null) hash.push(`s=${section}`);
    if (theme !== undefined) {
      hash.push(`theme=${theme}`);
      hash.push(`mode=${resolvedMode}`);
    }
    const url = `${STUDIO_URL}/src/projects/${slug}` + (hash.length > 0 ? `#${hash.join('&')}` : '');
    const folder = theme === undefined ? slug : `${slug}--${theme}--${resolvedMode}`;
    const outDir = path.join(SNAPSHOT_DIR, label, folder);
    const look = theme === undefined ? '' : ` ${theme}/${resolvedMode}`;
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
        const frameStarted = Date.now();
        const result = await waitForTime(page, time);
        const elapsed = ((Date.now() - frameStarted) / 1000).toFixed(1);
        if (!result.ok) {
          const reason = result.reason === 'stalled' ? 'timeout' : 'deadline';
          failures.push(`${slug}${look} ${sectionName} ${reason} at ${time}`);
          console.log(`[${label}]${look} ${slug} ${sectionName} ${reason} at ${time} (${elapsed}s)`);
          continue;
        }

        const file = path.join(outDir, `${sectionName}_t${time}.png`);
        await page.screenshot({path: file, clip: STAGE_CLIP});
        capturedFrames += 1;
        console.log(`[${label}]${look} ${slug} ${sectionName} t${time} ok (${elapsed}s)`);
      }
    } catch (error) {
      failures.push(`${slug}${look} ${sectionName} ${String(error.message).split('\n')[0]}`);
      console.log(`[${label}]${look} ${slug} ${sectionName} FAILED ${error.message}`);
    } finally {
      await page.close();
    }

    for (const error of errors) {
      console.log(`[${label}]${look} ${slug} ${sectionName} ${error}`);
    }
    if (errors.length > 0) realErrors.push(...errors.map(error => `${slug}${look} ${sectionName} ${error}`));
  }
}

await browser.close();

const totalSeconds = ((Date.now() - runStarted) / 1000).toFixed(1);
console.log(`[${label}] captured ${capturedFrames} frame(s) in ${totalSeconds}s${quick ? ' (quick subset)' : ''}`);
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
