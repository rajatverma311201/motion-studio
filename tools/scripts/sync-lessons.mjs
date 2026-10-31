#!/usr/bin/env node
/**
 * Collect every lesson's chapters.json into the docs app's generated data.
 *
 *   node tools/scripts/sync-lessons.mjs
 *
 * The docs app must not import studio or kit TypeScript, so chapters reach it
 * through apps/docs/src/generated/lessons.json.
 */
import {readdir, readFile, stat, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCENES_DIR = path.join(ROOT, 'apps/studio/src/scenes');
const PROJECTS_DIR = path.join(ROOT, 'apps/studio/src/projects');
const OUT_FILE = path.join(ROOT, 'apps/docs/src/generated/lessons.json');
const PALETTE = ['lime', 'pink', 'cyan', 'yellow', 'violet', 'orange', 'red'];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  });
}

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
  lessons.set(data.slug, data);
}

const sorted = Object.fromEntries([...lessons.entries()].sort(([a], [b]) => a.localeCompare(b)));
await mkdir(path.dirname(OUT_FILE), {recursive: true});
await writeFile(OUT_FILE, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');

console.log(`synced ${lessons.size} lessons`);
