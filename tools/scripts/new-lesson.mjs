#!/usr/bin/env node
/**
 * Scaffold a new lesson: studio project, scene, placeholder sections and a docs page.
 *
 *   pnpm new:lesson mvcc-and-isolation "MVCC and Isolation Levels" --course databases
 *
 * MOTION_STUDIO_ROOT overrides the repository root; the tests use it to run the
 * generator against a temporary tree. Nothing is written when a target exists.
 */
import {spawnSync} from 'node:child_process';
import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {themeIds} from '../../packages/video-kit/src/themes/registry.ts';

const ROOT = process.env.MOTION_STUDIO_ROOT
  ? path.resolve(process.env.MOTION_STUDIO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TSX = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
const COLORS = ['lime', 'cyan', 'pink', 'yellow', 'violet', 'orange', 'red'];
const MODES = ['dark', 'light'];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const USAGE = `Usage:
  pnpm new:lesson <slug> "<Title>" --course <course-slug> [--chapters 4] [--theme <id>] [--mode dark|light]

Example:
  pnpm new:lesson mvcc-and-isolation "MVCC and Isolation Levels" --course databases`;

function fail(message) {
  console.error(`new-lesson: ${message}`);
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

function parseArgs(argv) {
  const positional = [];
  let course;
  let chapters = 4;
  let theme;
  let mode;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--course') {
      course = argv[++i];
    } else if (arg.startsWith('--course=')) {
      course = arg.slice('--course='.length);
    } else if (arg === '--chapters') {
      chapters = Number(argv[++i]);
    } else if (arg.startsWith('--chapters=')) {
      chapters = Number(arg.slice('--chapters='.length));
    } else if (arg === '--theme') {
      theme = argv[++i];
    } else if (arg.startsWith('--theme=')) {
      theme = arg.slice('--theme='.length);
    } else if (arg === '--mode') {
      mode = argv[++i];
    } else if (arg.startsWith('--mode=')) {
      mode = arg.slice('--mode='.length);
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else if (arg.startsWith('-')) {
      fail(`unknown option ${arg}\n\n${USAGE}`);
    } else {
      positional.push(arg);
    }
  }

  return {positional, course, chapters, theme, mode};
}

function chapterLabel(index) {
  return index === 0 ? 'INTRO' : `CHAPTER ${index + 1}`;
}

function tsString(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

function yamlString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function introSectionSource({title}) {
  return `import {Node, type View2D} from '@motion-canvas/2d';
import {createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {leave, say, titleBlock} from '@motion-studio/video-kit';

// ================================================================ INTRO
export function* introSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const title = titleBlock({text: ${tsString(title.toUpperCase())}, fontSize: 120, y: -100});
  title.opacity(0);
  view.add(<Node ref={root}>{title}</Node>);

  yield* title.opacity(1, 0.5);
  yield* say('TODO: introduce the topic in one sentence.');
  yield* waitFor(3);
  yield* leave(root());
}
`;
}

function chapterSectionSource({label, color, exportName, index}) {
  return `import {Node, type View2D} from '@motion-canvas/2d';
import {createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, leave, say} from '@motion-studio/video-kit';

// ================================================================ ${label}
export function* ${exportName}(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tag = chip(${tsString(label)}, colors.${color});
  view.add(<Node ref={root}>{tag}</Node>);

  yield* say(${tsString(`TODO: narrate chapter ${index + 1}.`)});
  yield* waitFor(3);
  yield* leave(root());
}
`;
}

function sceneSource(slug, sections) {
  const imports = sections
    .map(section => `import {${section.exportName}} from './sections/${section.fileBase}';`)
    .join('\n');
  const names = sections.map(section => `    ${section.exportName},`).join('\n');

  return `import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
${imports}

loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [
${names}
  ],
});
`;
}

function projectSource(slug) {
  return `import {makeProject} from '@motion-canvas/core';
import {resolveProjectName, type ChaptersFile} from '@motion-studio/video-kit';

import chapters from '../scenes/${slug}/chapters.json';
import scene from '../scenes/${slug}/scene?scene';

const lesson = chapters as ChaptersFile;

export default makeProject({name: resolveProjectName(lesson.slug, lesson), scenes: [scene]});
`;
}

function lessonPageSource({slug, title, chapters}) {
  const notes = chapters
    .map(
      (chapter, index) => `### ${String(index + 1).padStart(2, '0')} · ${chapter.name}

<VoiceoverNotes>

- TODO: first thing to say about this chapter
- TODO: second point

</VoiceoverNotes>`,
    )
    .join('\n\n');

  return `---
title: ${yamlString(title)}
description: 'TODO: one sentence about this lesson.'
video: ${slug}
status: outline
duration: TBD
---

<LessonVideo slug="${slug}" />

## Summary points

<SummaryPoints slug="${slug}" />

## Chapters and voiceover notes

${notes}

## YouTube description

<YoutubeDescription slug="${slug}" />
`;
}

const {positional, course, chapters: chapterCount, theme, mode} = parseArgs(process.argv.slice(2));
const [slug, title] = positional;

if (!slug) fail(`missing <slug>\n\n${USAGE}`);
if (!title) fail(`missing "<Title>"\n\n${USAGE}`);
if (!KEBAB.test(slug)) fail(`slug "${slug}" must be kebab-case, e.g. mvcc-and-isolation`);
if (title.trim().length === 0) fail('title must not be empty');
if (!course) fail(`--course <course-slug> is required\n\n${USAGE}`);
if (!KEBAB.test(course)) fail(`course "${course}" must be kebab-case`);
if (!Number.isInteger(chapterCount) || chapterCount < 1) {
  fail('--chapters must be a positive whole number');
}
if (theme !== undefined && !themeIds.includes(theme)) {
  fail(`unknown theme "${theme}". Available: ${themeIds.join(', ')}`);
}
if (mode !== undefined && !MODES.includes(mode)) {
  fail(`unknown mode "${mode}". Available: ${MODES.join(', ')}`);
}

const courseDir = path.join(ROOT, 'apps/docs/content/docs', course);
const metaFile = path.join(courseDir, 'meta.json');
if (!(await exists(courseDir))) {
  fail(`course folder apps/docs/content/docs/${course} does not exist`);
}
if (!(await exists(metaFile))) {
  fail(`course meta file apps/docs/content/docs/${course}/meta.json does not exist`);
}

const meta = JSON.parse(await readFile(metaFile, 'utf8'));
const pages = Array.isArray(meta.pages) ? meta.pages : [];
if (pages.includes(slug)) {
  fail(`"${slug}" is already listed in apps/docs/content/docs/${course}/meta.json`);
}

const sceneDir = path.join(ROOT, 'apps/studio/src/scenes', slug);
const sectionsDir = path.join(sceneDir, 'sections');
const projectFile = path.join(ROOT, 'apps/studio/src/projects', `${slug}.ts`);
const chaptersFile = path.join(sceneDir, 'chapters.json');
const sceneFile = path.join(sceneDir, 'scene.tsx');
const pageFile = path.join(courseDir, `${slug}.mdx`);

const chapters = Array.from({length: chapterCount}, (_, index) => ({
  name: chapterLabel(index),
  color: COLORS[index % COLORS.length],
  summary: index === 0 ? 'TODO: what this video introduces.' : `TODO: one sentence about chapter ${index + 1}.`,
}));

const sections = chapters.map((chapter, index) => ({
  ...chapter,
  index,
  fileBase: `${String(index + 1).padStart(2, '0')}-${index === 0 ? 'intro' : `chapter-${index + 1}`}`,
  exportName: index === 0 ? 'introSection' : `chapter${index + 1}Section`,
}));

const targets = [
  projectFile,
  chaptersFile,
  sceneFile,
  ...sections.map(section => path.join(sectionsDir, `${section.fileBase}.tsx`)),
  pageFile,
];
const existing = [];
for (const target of targets) {
  if (await exists(target)) existing.push(path.relative(ROOT, target));
}
if (existing.length > 0) {
  fail(`refusing to overwrite existing file(s):\n  ${existing.join('\n  ')}`);
}
if (await exists(sceneDir)) {
  fail(`refusing to overwrite existing folder apps/studio/src/scenes/${slug}`);
}

const chaptersData = {
  slug,
  title: title.toUpperCase(),
  ...(theme !== undefined ? {theme} : {}),
  ...(mode !== undefined ? {mode} : {}),
  summaryPoints: ['TODO'],
  chapters,
};
const generated = [
  [projectFile, projectSource(slug)],
  [chaptersFile, `${JSON.stringify(chaptersData, null, 2)}\n`],
  [sceneFile, sceneSource(slug, sections)],
  ...sections.map((section, index) => [
    path.join(sectionsDir, `${section.fileBase}.tsx`),
    index === 0
      ? introSectionSource({title})
      : chapterSectionSource({label: section.name, color: section.color, exportName: section.exportName, index}),
  ]),
];

for (const [file, content] of generated) {
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, content, 'utf8');
}

await writeFile(pageFile, lessonPageSource({slug, title, chapters}), 'utf8');

meta.pages = [...pages, slug];
await writeFile(metaFile, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');

const sync = spawnSync(process.execPath, ['--import', TSX, path.join(ROOT, 'tools/scripts/sync-lessons.mjs')], {
  cwd: ROOT,
  stdio: 'inherit',
  env: process.env,
});
if (sync.status !== 0) fail(`sync-lessons.mjs failed (exit ${sync.status})`);

const created = [
  projectFile,
  chaptersFile,
  sceneFile,
  ...sections.map(section => path.join(sectionsDir, `${section.fileBase}.tsx`)),
  pageFile,
];

console.log('');
console.log(`Created lesson "${slug}" with ${chapterCount} chapter(s).`);
console.log('');
console.log('Files:');
for (const file of created) console.log(`  ${path.relative(ROOT, file)}`);
console.log('');
console.log('Next steps:');
console.log(`  1. Preview in the editor: http://localhost:9000/src/projects/${slug}`);
console.log(`     Start at a section with #s=N: http://localhost:9000/src/projects/${slug}#s=2`);
console.log('  2. Replace the TODO captions, chapter names and voiceover notes with real content.');
console.log('  3. Fill `summaryPoints` in chapters.json, then set `status` as the video moves through the pipeline.');
console.log('  4. Set `status: published` and add `youtube:` when the video is live.');
console.log(`  5. The look comes from chapters.json and video.config.json; override it with: pnpm studio --theme <id>`);
