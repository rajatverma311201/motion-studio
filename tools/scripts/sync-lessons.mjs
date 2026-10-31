#!/usr/bin/env node
/**
 * Collect every lesson's chapters.json and resolve its look into the docs app's
 * generated data.
 *
 *   node --import tsx tools/scripts/sync-lessons.mjs
 *
 * The docs app must not import studio or kit TypeScript, so this data reaches it
 * through apps/docs/src/generated/lessons.json.
 */
import {mkdir, readdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = process.env.MOTION_STUDIO_ROOT
  ? path.resolve(process.env.MOTION_STUDIO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCENES_DIR = path.join(ROOT, 'apps/studio/src/scenes');
const PROJECTS_DIR = path.join(ROOT, 'apps/studio/src/projects');
const OUT_FILE = path.join(ROOT, 'apps/docs/src/generated/lessons.json');
const CONFIG_FILE = path.join(ROOT, 'video.config.json');
const PALETTE = ['lime', 'pink', 'cyan', 'yellow', 'violet', 'orange', 'red'];
const MODES = ['dark', 'light'];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AT = /^(?:[0-9]{1,2}:[0-5][0-9]|[0-9]+:[0-5][0-9]:[0-5][0-9])$/;

const {themes, themeIds} = await import(
  pathToFileURL(path.join(ROOT, 'packages/video-kit/src/themes/registry.ts')).href
);
const {resolveThemeSelection} = await import(
  pathToFileURL(path.join(ROOT, 'packages/video-kit/src/themes/active-theme.ts')).href
);

function fail(file, message) {
  const relative = path.relative(ROOT, file);
  console.error(`${relative}: ${message}`);
  process.exit(1);
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function chapterFiles() {
  const entries = await readdir(SCENES_DIR, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = path.join(SCENES_DIR, entry.name, 'chapters.json');
    if (await exists(file)) files.push(file);
  }
  return files.sort();
}

async function readVideoConfig() {
  if (!(await exists(CONFIG_FILE))) return {};
  let data;
  try {
    data = JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
  } catch (error) {
    fail(CONFIG_FILE, `invalid JSON: ${error.message}`);
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    fail(CONFIG_FILE, 'top level must be an object');
  }
  if (data.theme !== undefined && (typeof data.theme !== 'string' || !themeIds.includes(data.theme))) {
    fail(CONFIG_FILE, `unknown theme "${data.theme}"`);
  }
  if (data.mode !== undefined && !MODES.includes(data.mode)) {
    fail(CONFIG_FILE, 'mode must be "dark" or "light"');
  }
  return data;
}

function validate(file, data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    fail(file, 'top level must be an object');
  }
  if (typeof data.slug !== 'string' || !KEBAB.test(data.slug)) {
    fail(file, `slug must be kebab-case (got ${JSON.stringify(data.slug)})`);
  }
  if (typeof data.title !== 'string') {
    fail(file, 'title must be a string');
  }
  if (data.theme !== undefined && (typeof data.theme !== 'string' || !themeIds.includes(data.theme))) {
    fail(file, `unknown theme "${data.theme}"`);
  }
  if (data.mode !== undefined && !MODES.includes(data.mode)) {
    fail(file, 'mode must be "dark" or "light"');
  }
  if (data.summaryPoints !== undefined) {
    if (!Array.isArray(data.summaryPoints)) {
      fail(file, 'summaryPoints must be an array when present');
    }
    const todoPlaceholder = data.summaryPoints.length === 1 && data.summaryPoints[0] === 'TODO';
    if (!todoPlaceholder && (data.summaryPoints.length < 3 || data.summaryPoints.length > 8)) {
      fail(file, 'summaryPoints must have 3 to 8 entries (or exactly ["TODO"])');
    }
    data.summaryPoints.forEach((point, index) => {
      if (typeof point !== 'string' || point.length === 0) {
        fail(file, `summaryPoints[${index}] must be a non-empty string`);
      }
    });
  }
  if (!Array.isArray(data.chapters) || data.chapters.length === 0) {
    fail(file, 'chapters must be a non-empty array');
  }
  data.chapters.forEach((chapter, index) => {
    if (typeof chapter !== 'object' || chapter === null || Array.isArray(chapter)) {
      fail(file, `chapters[${index}] must be an object`);
    }
    if (typeof chapter.name !== 'string') {
      fail(file, `chapters[${index}].name must be a string`);
    }
    if (!PALETTE.includes(chapter.color)) {
      fail(
        file,
        `chapters[${index}].color must be one of ${PALETTE.join(', ')} (got ${JSON.stringify(chapter.color)})`,
      );
    }
    if (chapter.summary !== undefined && typeof chapter.summary !== 'string') {
      fail(file, `chapters[${index}].summary must be a string when present`);
    }
    if (chapter.at !== undefined && (typeof chapter.at !== 'string' || !AT.test(chapter.at))) {
      fail(file, `chapters[${index}].at must be m:ss or h:mm:ss when present (got ${JSON.stringify(chapter.at)})`);
    }
  });
}

const config = await readVideoConfig();
const files = await chapterFiles();
const lessons = new Map();

for (const file of files) {
  let data;
  try {
    data = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    fail(file, `invalid JSON: ${error.message}`);
  }
  validate(file, data);

  if (lessons.has(data.slug)) {
    fail(file, `duplicate slug "${data.slug}"`);
  }
  const project = path.join(PROJECTS_DIR, `${data.slug}.ts`);
  if (!(await exists(project))) {
    fail(file, `project file apps/studio/src/projects/${data.slug}.ts not found`);
  }

  const selection = resolveThemeSelection({
    lessonTheme: data.theme,
    lessonMode: data.mode,
    configTheme: config.theme,
    configMode: config.mode,
  });
  const look = {
    theme: selection.themeId,
    themeName: themes[selection.themeId].name,
    mode: selection.mode,
  };

  lessons.set(data.slug, {...data, look});
}

const sorted = Object.fromEntries([...lessons.entries()].sort(([a], [b]) => a.localeCompare(b)));
await mkdir(path.dirname(OUT_FILE), {recursive: true});
await writeFile(OUT_FILE, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');

console.log(`synced ${lessons.size} lessons`);
