#!/usr/bin/env node
/**
 * Smoke test for the docs video player.
 *
 *   DOCS_URL=http://127.0.0.1:3000 node docs-smoke.mjs
 *
 * Asserts the player mounts, chapter navigation remounts it at the selected
 * chapter, and writes a screenshot of the composed lesson video block.
 */
import {chromium} from 'playwright';
import {mkdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const DOCS_URL = process.env.DOCS_URL ?? 'http://127.0.0.1:3000';
const PAGE_PATH = '/docs/databases/indexing';
const SLUG = 'db-indexing';
const CHAPTER_INDEX = 5;
const PLAYER_TIMEOUT = 20000;
const SCREENSHOT = path.join(ROOT, '.snapshots/docs-indexing.png');

const lessons = JSON.parse(await readFile(path.join(ROOT, 'apps/docs/src/generated/lessons.json'), 'utf8'));
const lesson = lessons[SLUG];
const firstChapter = lesson?.chapters?.[0]?.name;
const targetChapter = lesson?.chapters?.[CHAPTER_INDEX]?.name;

if (!firstChapter || !targetChapter) {
  console.log(`FAIL: no generated chapter data for ${SLUG}; run pnpm sync:lessons`);
  process.exit(1);
}

let failure = null;
const browser = await chromium.launch({headless: true});

try {
  await mkdir(path.dirname(SCREENSHOT), {recursive: true});

  const page = await browser.newPage({viewport: {width: 1440, height: 1200}});
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource|fonts|net::|Connection timeout/.test(text)) return;
    consoleErrors.push(text);
  });

  await page.goto(`${DOCS_URL}${PAGE_PATH}`, {waitUntil: 'load'});

  try {
    await page.waitForSelector('motion-canvas-player', {state: 'attached', timeout: PLAYER_TIMEOUT});
  } catch {
    throw new Error(`motion-canvas-player did not appear within ${PLAYER_TIMEOUT / 1000}s`);
  }

  const body = await page.locator('body').innerText();
  if (!body.includes(firstChapter)) {
    throw new Error(`page does not contain chapter 1 name "${firstChapter}"`);
  }

  const tagged = await page.evaluate(() => {
    const element = document.querySelector('motion-canvas-player');
    if (!element) return false;
    element.setAttribute('data-smoke-id', 'before');
    return element.getAttribute('data-smoke-id') === 'before';
  });
  if (!tagged) throw new Error('could not tag the player element before chapter navigation');

  const button = page.locator(`[data-chapter-index="${CHAPTER_INDEX}"]`);
  if ((await button.count()) !== 1) {
    throw new Error(`chapter button for index ${CHAPTER_INDEX} not found`);
  }
  await button.click();

  try {
    await page.waitForFunction(
      () => {
        const element = document.querySelector('motion-canvas-player');
        return element !== null && element.getAttribute('data-smoke-id') !== 'before';
      },
      null,
      {timeout: 10000},
    );
  } catch {
    throw new Error(`player element was not re-created after selecting chapter ${CHAPTER_INDEX}`);
  }

  try {
    await page.waitForSelector('motion-canvas-player canvas.state-ready', {timeout: 15000});
  } catch {
    const state = await page.evaluate(
      () => document.querySelector('motion-canvas-player')?.shadowRoot?.querySelector('canvas')?.className ?? 'missing',
    );
    throw new Error(`player did not become ready after chapter navigation (canvas class: ${state})`);
  }

  const currentChapter = await page.locator(`[data-chapter-index="${CHAPTER_INDEX}"]`).getAttribute('aria-current');
  if (currentChapter !== 'true') {
    throw new Error(`chapter ${CHAPTER_INDEX} is not marked aria-current after selection`);
  }

  await page.locator('.nb-lesson-video').screenshot({path: SCREENSHOT});

  if (pageErrors.length > 0) throw new Error(`pageerror: ${pageErrors[0]}`);
  if (consoleErrors.length > 0) throw new Error(`console error: ${consoleErrors[0]}`);
} catch (error) {
  failure = String(error.message).split('\n')[0];
} finally {
  await browser.close();
}

if (failure) {
  console.log(`FAIL: ${failure}`);
  process.exit(1);
}

console.log('PASS');
