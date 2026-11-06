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
const DOCS_DIR = path.join(ROOT, 'apps/docs/content/docs');
const OUT_FILE = path.join(ROOT, 'apps/docs/src/generated/lessons.json');
const CONFIG_FILE = path.join(ROOT, 'video.config.json');
const PALETTE = ['lime', 'pink', 'cyan', 'yellow', 'violet', 'orange', 'red'];
const MODES = ['dark', 'light'];
const FORMATS = ['landscape', 'short'];
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

async function mdxFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, {withFileTypes: true});
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await mdxFiles(full)));
    else if (entry.name.endsWith('.mdx')) files.push(full);
  }
  return files;
}

/**
 * Read the `<VoiceoverNotes>` bullets of every chapter heading.
 *
 * A chapter heading is `### NN · NAME`; notes live in the following
 * `<VoiceoverNotes>` block until the next heading. The result is keyed by the
 * 1-based chapter number and keeps the bullet text verbatim (inline code stays
 * in backticks).
 */
export function parseVoiceoverNotes(source) {
  const notes = new Map();
  const lines = source.split(/\r?\n/);
  let current = null;
  let inBlock = false;

  for (const line of lines) {
    const heading = /^###\s+(\d{2})\s+·/.exec(line);
    if (heading) {
      current = Number(heading[1]);
      inBlock = false;
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      current = null;
      inBlock = false;
      continue;
    }
    if (current === null) continue;

    if (/^<VoiceoverNotes>\s*$/.test(line)) {
      inBlock = true;
      notes.set(current, []);
      continue;
    }
    if (/^<\/VoiceoverNotes>\s*$/.test(line)) {
      inBlock = false;
      continue;
    }
    if (!inBlock) continue;

    const bullet = /^\s*[-*]\s+(.*\S)\s*$/.exec(line);
    if (bullet) notes.get(current).push(bullet[1]);
  }

  return notes;
}

async function readVoiceovers() {
  const bySlug = new Map();
  for (const file of await mdxFiles(DOCS_DIR)) {
    const source = await readFile(file, 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1];
    if (!frontmatter) continue;
    const video = /^video:\s*['"]?([a-z0-9-]+)['"]?\s*$/m.exec(frontmatter)?.[1];
    if (!video || bySlug.has(video)) continue;
    bySlug.set(video, parseVoiceoverNotes(source));
  }
  return bySlug;
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
  if (data.format !== undefined && !FORMATS.includes(data.format)) {
    fail(file, `format must be "landscape" or "short" when present (got ${JSON.stringify(data.format)})`);
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
const voiceovers = await readVoiceovers();
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

  const notesByChapter = voiceovers.get(data.slug);
  if (!notesByChapter) {
    console.warn(`[sync-lessons] ${data.slug}: no MDX page with "video: ${data.slug}"; the notes will be empty.`);
  }

  const chapters = data.chapters.map((chapter, index) => {
    const notes = notesByChapter?.get(index + 1);
    if (notesByChapter && !notes) {
      console.warn(
        `[sync-lessons] ${data.slug}: chapter ${String(index + 1).padStart(2, '0')} ` +
          `(${chapter.name}) has no <VoiceoverNotes> block; using an empty list.`,
      );
    }
    return {...chapter, notes: notes ?? []};
  });

  lessons.set(data.slug, {...data, chapters, format: data.format ?? 'landscape', look});
}

const sorted = Object.fromEntries([...lessons.entries()].sort(([a], [b]) => a.localeCompare(b)));
await mkdir(path.dirname(OUT_FILE), {recursive: true});
await writeFile(OUT_FILE, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');

console.log(`synced ${lessons.size} lessons`);
