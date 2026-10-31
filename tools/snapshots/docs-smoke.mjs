#!/usr/bin/env node
/**
 * Smoke test for the recording companion.
 *
 *   DOCS_URL=http://127.0.0.1:3000 node docs-smoke.mjs
 *
 * Checks the tracker, the light/dark toggle (including persistence), the lesson
 * player, chapter-to-notes scrolling and the YouTube description clipboard.
 * Writes screenshots to .snapshots/docs/ in both themes.
 */
import {chromium} from 'playwright';
import {mkdir, readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const DOCS_URL = process.env.DOCS_URL ?? 'http://127.0.0.1:3000';
const LESSON_PATH = '/docs/databases/indexing';
const LESSON_SLUG = 'db-indexing';
const CHAPTER_INDEX = 2;
const PLAYER_TIMEOUT = 20000;
const SCREENSHOT_DIR = path.join(ROOT, '.snapshots/docs');
const STATUSES = ['outline', 'animated', 'rendered', 'voiced', 'published'];

const lessons = JSON.parse(await readFile(path.join(ROOT, 'apps/docs/src/generated/lessons.json'), 'utf8'));
const lesson = lessons[LESSON_SLUG];
const firstChapter = lesson?.chapters?.[0]?.name;

if (!firstChapter) {
  console.log(`FAIL: no generated chapter data for ${LESSON_SLUG}; run pnpm sync`);
  process.exit(1);
}

const lessonPages = [];

async function collectPages(dir) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectPages(full);
    } else if (entry.name.endsWith('.mdx')) {
      const source = await readFile(full, 'utf8');
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '';
      if (/^video:\s*\S+/m.test(frontmatter)) lessonPages.push(full);
    }
  }
}

await collectPages(path.join(ROOT, 'apps/docs/content/docs'));

if (lessonPages.length === 0) {
  console.log('FAIL: no lesson pages with a video slug; run pnpm sync');
  process.exit(1);
}

let failure = null;
const browser = await chromium.launch({headless: true});

function watch(page) {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource|fonts|net::|Connection timeout|favicon/.test(text)) return;
    consoleErrors.push(text);
  });

  return {pageErrors, consoleErrors};
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForTheme(page, theme) {
  await page.waitForFunction(expected => document.documentElement.classList.contains(expected), theme, {
    timeout: 10000,
  });
}

async function noPageOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));
  assert(
    overflow.document <= overflow.viewport + 1 && overflow.body <= overflow.viewport + 1,
    `${label}: page overflows horizontally (document ${overflow.document}, body ${overflow.body}, viewport ${overflow.viewport})`,
  );
}

try {
  await mkdir(SCREENSHOT_DIR, {recursive: true});

  const context = await browser.newContext({
    viewport: {width: 1440, height: 1200},
    colorScheme: 'light',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const errors = watch(page);

  await page.goto(`${DOCS_URL}/`, {waitUntil: 'networkidle'});
  await waitForTheme(page, 'light');
  await page.waitForSelector('table');

  const rows = page.locator('[data-lesson-row]');
  const rowCount = await rows.count();
  assert(rowCount === lessonPages.length, `tracker shows ${rowCount} rows for ${lessonPages.length} lesson pages`);

  const statusWords = await rows.locator('[data-status]').allTextContents();
  assert(statusWords.length === rowCount, `tracker rows show ${statusWords.length} status words for ${rowCount} rows`);
  for (const word of statusWords) {
    assert(STATUSES.includes(word.trim().toLowerCase()), `tracker shows unknown status "${word}"`);
  }

  let filterTarget = null;
  for (const status of STATUSES) {
    const button = page.locator(`[data-status-filter="${status}"]`);
    const count = Number(await button.getAttribute('data-status-count'));
    if (count < rowCount) {
      filterTarget = {status, count};
      break;
    }
  }
  assert(filterTarget, 'no status counter would reduce the table');

  await page.locator(`[data-status-filter="${filterTarget.status}"]`).click();
  await page.waitForFunction(
    ({count}) => document.querySelectorAll('[data-lesson-row]').length === count,
    {count: filterTarget.count},
    {timeout: 5000},
  );
  assert(filterTarget.count < rowCount, `status filter did not reduce ${rowCount} rows`);
  await page.locator(`[data-status-filter="${filterTarget.status}"]`).click();
  await page.waitForFunction(expected => document.querySelectorAll('[data-lesson-row]').length === expected, rowCount, {
    timeout: 5000,
  });

  await page.screenshot({path: path.join(SCREENSHOT_DIR, 'tracker-light.png')});

  await page.locator('[data-theme-toggle]').first().click();
  await waitForTheme(page, 'dark');
  await page.waitForTimeout(400);
  await page.screenshot({path: path.join(SCREENSHOT_DIR, 'tracker-dark.png')});

  await page.reload({waitUntil: 'networkidle'});
  await waitForTheme(page, 'dark');
  await noPageOverflow(page, 'tracker desktop dark');

  await page.setViewportSize({width: 390, height: 844});
  await noPageOverflow(page, 'tracker 390 dark');
  await page.screenshot({path: path.join(SCREENSHOT_DIR, 'tracker-dark-390.png')});

  await page.evaluate(() => window.localStorage.setItem('theme', 'light'));
  await page.reload({waitUntil: 'networkidle'});
  await waitForTheme(page, 'light');
  await noPageOverflow(page, 'tracker 390 light');
  await page.screenshot({path: path.join(SCREENSHOT_DIR, 'tracker-light-390.png')});

  assert(errors.pageErrors.length === 0, `tracker pageerror: ${errors.pageErrors[0]}`);
  assert(errors.consoleErrors.length === 0, `tracker console error: ${errors.consoleErrors[0]}`);
  await context.close();

  const lessonContext = await browser.newContext({
    viewport: {width: 1440, height: 1400},
    colorScheme: 'light',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const lessonPage = await lessonContext.newPage();
  const lessonErrors = watch(lessonPage);

  await lessonPage.goto(`${DOCS_URL}${LESSON_PATH}`, {waitUntil: 'networkidle'});
  await waitForTheme(lessonPage, 'light');

  try {
    await lessonPage.waitForSelector('motion-canvas-player', {state: 'attached', timeout: PLAYER_TIMEOUT});
  } catch {
    throw new Error(`motion-canvas-player did not appear within ${PLAYER_TIMEOUT / 1000}s`);
  }

  const body = await lessonPage.locator('body').innerText();
  assert(body.includes(firstChapter), `page does not contain chapter 1 name "${firstChapter}"`);
  assert(body.includes('Renders in:'), 'lesson page does not show the render look line');
  assert(body.includes('Say this'), 'lesson page does not show the voiceover notes');

  await lessonPage.screenshot({path: path.join(SCREENSHOT_DIR, 'lesson-light-top.png')});

  const scrolledBefore = await lessonPage.evaluate(() => window.scrollY);
  const tagged = await lessonPage.evaluate(() => {
    const element = document.querySelector('motion-canvas-player');
    if (!element) return false;
    element.setAttribute('data-smoke-id', 'before');
    return element.getAttribute('data-smoke-id') === 'before';
  });
  assert(tagged, 'could not tag the player element before chapter navigation');

  const button = lessonPage.locator(`[data-chapter-index="${CHAPTER_INDEX}"]`);
  assert((await button.count()) === 1, `chapter button for index ${CHAPTER_INDEX} not found`);
  await button.click();

  try {
    await lessonPage.waitForFunction(
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
    await lessonPage.waitForSelector('motion-canvas-player canvas.state-ready', {timeout: 15000});
  } catch {
    const state = await lessonPage.evaluate(
      () => document.querySelector('motion-canvas-player')?.shadowRoot?.querySelector('canvas')?.className ?? 'missing',
    );
    throw new Error(`player did not become ready after chapter navigation (canvas class: ${state})`);
  }

  await lessonPage.waitForFunction(
    () => {
      const heading = [...document.querySelectorAll('#nd-page h3')].find(element =>
        element.textContent?.trim().startsWith('03 ·'),
      );
      if (!heading) return false;
      const rect = heading.getBoundingClientRect();
      const sticky = document.querySelector('[data-lesson-player-sticky]');
      const stickyBottom = sticky ? sticky.getBoundingClientRect().bottom : 0;
      return rect.top >= stickyBottom - 2 && rect.top < window.innerHeight - 40;
    },
    null,
    {timeout: 15000},
  );
  await lessonPage.waitForTimeout(700);
  const headingVisible = await lessonPage.evaluate(() => {
    const heading = [...document.querySelectorAll('#nd-page h3')].find(element =>
      element.textContent?.trim().startsWith('03 ·'),
    );
    if (!heading) return 'missing';
    const rect = heading.getBoundingClientRect();
    const sticky = document.querySelector('[data-lesson-player-sticky]');
    const stickyBottom = sticky ? sticky.getBoundingClientRect().bottom : 0;
    return rect.top >= stickyBottom - 2 && rect.top < window.innerHeight - 40;
  });
  assert(headingVisible === true, 'chapter 3 heading is not below the sticky player after the scroll settles');
  const scrolledAfter = await lessonPage.evaluate(() => window.scrollY);
  assert(scrolledAfter > scrolledBefore, 'chapter click did not scroll the page');

  const currentChapter = await button.getAttribute('aria-current');
  assert(currentChapter === 'true', `chapter ${CHAPTER_INDEX} is not marked aria-current after selection`);

  await lessonPage.screenshot({path: path.join(SCREENSHOT_DIR, 'lesson-light.png')});

  await lessonPage.locator('[data-theme-toggle]').first().click();
  await waitForTheme(lessonPage, 'dark');
  await lessonPage.waitForTimeout(400);
  await lessonPage.screenshot({path: path.join(SCREENSHOT_DIR, 'lesson-dark.png')});

  const copyButton = lessonPage.locator('[data-copy-description]');
  assert((await copyButton.count()) === 1, 'YouTube description Copy button not found');
  await copyButton.click();
  await lessonPage.waitForFunction(
    () => document.querySelector('[data-copy-description]')?.textContent === 'Copied',
    null,
    {
      timeout: 5000,
    },
  );
  const clipboard = await lessonPage.evaluate(() => window.navigator.clipboard.readText());
  assert(clipboard.includes('Chapters:'), 'copied YouTube description has no Chapters: block');
  assert(clipboard.includes('In this video:'), 'copied YouTube description has no summary block');

  assert(lessonErrors.pageErrors.length === 0, `lesson pageerror: ${lessonErrors.pageErrors[0]}`);
  assert(lessonErrors.consoleErrors.length === 0, `lesson console error: ${lessonErrors.consoleErrors[0]}`);
  await lessonContext.close();
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
