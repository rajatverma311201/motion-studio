import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REAL_ROOT = path.resolve(SCRIPT_DIR, '../..');
const GENERATOR = path.join(SCRIPT_DIR, 'new-lesson.mjs');
const SYNC = path.join(SCRIPT_DIR, 'sync-lessons.mjs');
const TSX = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
const SLUG = 'mvcc-and-isolation';
const TITLE = 'MVCC and Isolation Levels';

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-studio-lesson-'));
  await mkdir(path.join(root, 'apps/studio/src/projects'), {recursive: true});
  await mkdir(path.join(root, 'apps/studio/src/scenes'), {recursive: true});
  await mkdir(path.join(root, 'apps/docs/src/generated'), {recursive: true});
  await mkdir(path.join(root, 'apps/docs/content/docs/databases'), {recursive: true});
  await mkdir(path.join(root, 'packages/video-kit/src'), {recursive: true});
  await mkdir(path.join(root, 'tools/scripts'), {recursive: true});

  const meta = {title: 'Databases', root: true, pages: ['index', 'transactions']};
  await writeFile(path.join(root, 'apps/docs/content/docs/databases/meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
  await cp(path.join(REAL_ROOT, 'packages/video-kit/src/themes'), path.join(root, 'packages/video-kit/src/themes'), {
    recursive: true,
  });
  await copyFile(SYNC, path.join(root, 'tools/scripts/sync-lessons.mjs'));
  return root;
}

function run(root, args) {
  return spawnSync(process.execPath, ['--import', TSX, GENERATOR, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: {...process.env, MOTION_STUDIO_ROOT: root},
  });
}

function read(root, ...parts) {
  return readFile(path.join(root, ...parts), 'utf8');
}

test('generates a studio project, sections, lesson page and meta entry', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, [SLUG, TITLE, '--course', 'databases', '--chapters', '3']);
  assert.equal(result.status, 0, result.stderr);

  const project = await read(root, 'apps/studio/src/projects', `${SLUG}.ts`);
  assert.match(project, /makeProject\(\{name: resolveProjectName\(lesson\.slug, lesson\), scenes: \[scene\]\}\)/);
  assert.match(project, new RegExp(`../scenes/${SLUG}/scene\\?scene`));
  assert.match(project, new RegExp(`../scenes/${SLUG}/chapters.json`));

  const chapters = JSON.parse(await read(root, 'apps/studio/src/scenes', SLUG, 'chapters.json'));
  assert.equal(chapters.slug, SLUG);
  assert.equal(chapters.title, TITLE.toUpperCase());
  assert.equal(chapters.theme, undefined);
  assert.equal(chapters.mode, undefined);
  assert.deepEqual(
    chapters.chapters.map(chapter => chapter.name),
    ['INTRO', 'CHAPTER 2', 'CHAPTER 3'],
  );
  assert.deepEqual(
    chapters.chapters.map(chapter => chapter.color),
    ['lime', 'cyan', 'pink'],
  );
  for (const chapter of chapters.chapters) assert.equal(typeof chapter.summary, 'string');

  const scene = await read(root, 'apps/studio/src/scenes', SLUG, 'scene.tsx');
  assert.match(scene, /defineLesson/);
  assert.match(scene, /from '.\/sections\/01-intro'/);
  assert.match(scene, /from '.\/sections\/02-chapter-2'/);
  assert.match(scene, /from '.\/sections\/03-chapter-3'/);
  assert.match(scene, /introSection,/);
  assert.match(scene, /chapter2Section,/);
  assert.match(scene, /chapter3Section,/);

  const intro = await read(root, 'apps/studio/src/scenes', SLUG, 'sections/01-intro.tsx');
  assert.match(intro, /titleBlock/);
  assert.match(intro, /yield\* say\(/);
  assert.match(intro, /yield\* waitFor\(3\)/);
  assert.match(intro, /yield\* leave\(root\(\)\)/);

  const chapter = await read(root, 'apps/studio/src/scenes', SLUG, 'sections/02-chapter-2.tsx');
  assert.match(chapter, /chip\('CHAPTER 2', colors\.cyan\)/);
  assert.match(chapter, /yield\* say\(/);
  assert.match(chapter, /yield\* waitFor\(3\)/);
  assert.match(chapter, /yield\* leave\(root\(\)\)/);

  const page = await read(root, 'apps/docs/content/docs/databases', `${SLUG}.mdx`);
  assert.match(page, /^---\n/);
  assert.match(page, new RegExp(`video: ${SLUG}`));
  assert.match(page, /status: draft/);
  assert.match(page, /duration: TBD/);
  assert.match(page, /## What you will learn/);
  assert.match(page, /## Chapters/);
  assert.match(page, /## Chapter notes/);
  assert.match(page, /### 2\. Chapter 2/);
  assert.match(page, new RegExp(`<LessonVideo slug="${SLUG}" />`));

  const meta = JSON.parse(await read(root, 'apps/docs/content/docs/databases/meta.json'));
  assert.equal(meta.title, 'Databases');
  assert.equal(meta.root, true);
  assert.deepEqual(meta.pages, ['index', 'transactions', SLUG]);

  const lessons = JSON.parse(await read(root, 'apps/docs/src/generated/lessons.json'));
  assert.ok(lessons[SLUG]);
  assert.equal(lessons[SLUG].chapters.length, 3);
  assert.deepEqual(lessons[SLUG].look, {theme: 'neubrutal', themeName: 'Neubrutal', mode: 'dark'});

  assert.match(result.stdout, new RegExp(`http://localhost:9000/src/projects/${SLUG}`));
  assert.match(result.stdout, /status: published/);
});

test('writes the theme and mode flags into chapters.json', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, [SLUG, TITLE, '--course', 'databases', '--theme', 'tokyo-night', '--mode', 'light']);
  assert.equal(result.status, 0, result.stderr);

  const chapters = JSON.parse(await read(root, 'apps/studio/src/scenes', SLUG, 'chapters.json'));
  assert.equal(chapters.theme, 'tokyo-night');
  assert.equal(chapters.mode, 'light');

  const lessons = JSON.parse(await read(root, 'apps/docs/src/generated/lessons.json'));
  assert.deepEqual(lessons[SLUG].look, {theme: 'tokyo-night', themeName: 'Tokyo Night', mode: 'light'});
});

test('rejects an unknown theme', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, [SLUG, TITLE, '--course', 'databases', '--theme', 'nope']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown theme "nope"\. Available: neubrutal/);
});

test('rejects an unknown mode', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, [SLUG, TITLE, '--course', 'databases', '--mode', 'sepia']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown mode "sepia"\. Available: dark, light/);
});

test('refuses to overwrite an existing lesson', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  assert.equal(run(root, [SLUG, TITLE, '--course', 'databases']).status, 0);

  const result = run(root, [SLUG, TITLE, '--course', 'databases']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /refusing to overwrite existing file|already listed/);
});

test('rejects a non-kebab-case slug', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, ['BadSlug', TITLE, '--course', 'databases']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be kebab-case/);
});

test('rejects an unknown course', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, [SLUG, TITLE, '--course', 'no-such-course']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not exist/);
});

test('rejects a missing title', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = run(root, [SLUG, '--course', 'databases']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing "<Title>"/);
});
