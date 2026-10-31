import assert from 'node:assert/strict';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {collectLessons, formatTable, parseFrontmatter, validateStatus} from './lesson-status.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REAL_ROOT = path.resolve(SCRIPT_DIR, '../..');

async function fixture(files) {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-studio-status-'));
  const content = path.join(root, 'apps/docs/content/docs/databases');
  await mkdir(content, {recursive: true});
  for (const [name, source] of Object.entries(files)) {
    await writeFile(path.join(content, name), source, 'utf8');
  }
  return root;
}

function lessonPage({video, status, duration, youtube}) {
  return `---
title: 'A lesson: with a colon'
description: 'One sentence.'
video: ${video}
${status ? `status: ${status}\n` : ''}${duration ? `duration: ${duration}\n` : ''}${youtube ? `youtube: ${youtube}\n` : ''}---
`;
}

test('parseFrontmatter reads flat pairs and strips quotes', () => {
  const data = parseFrontmatter(`---
title: 'DB Indexing: B-tree and B+tree'
video: db-indexing
status: published
youtube: https://youtu.be/example
---

Body.`);

  assert.equal(data.title, 'DB Indexing: B-tree and B+tree');
  assert.equal(data.video, 'db-indexing');
  assert.equal(data.status, 'published');
  assert.equal(data.youtube, 'https://youtu.be/example');
});

test('collectLessons lists pages with a video and defaults missing fields', async t => {
  const root = await fixture({
    'one.mdx': lessonPage({video: 'db-one', status: 'voiced', duration: '12:40'}),
    'two.mdx': lessonPage({video: 'db-two'}),
    'notes.mdx': '---\ntitle: Notes\n---\n',
  });
  t.after(() => rm(root, {recursive: true, force: true}));

  const lessons = await collectLessons(root);
  assert.deepEqual(
    lessons.map(lesson => [lesson.slug, lesson.status, lesson.duration, lesson.youtube]),
    [
      ['db-one', 'voiced', '12:40', ''],
      ['db-two', 'outline', 'TBD', ''],
    ],
  );
});

test('an unknown status fails with the file name', async t => {
  const root = await fixture({
    'bad.mdx': lessonPage({video: 'db-bad', status: 'draft'}),
  });
  t.after(() => rm(root, {recursive: true, force: true}));

  await assert.rejects(() => collectLessons(root), /bad\.mdx: unknown status "draft"/);
  assert.throws(() => validateStatus('nope', 'page.mdx'), /unknown status "nope"/);
});

test('formatTable prints the four columns', () => {
  const table = formatTable([
    {slug: 'db-indexing', status: 'published', duration: '12:40', youtube: 'https://youtu.be/x'},
    {slug: 'db-transactions', status: 'voiced', duration: 'TBD', youtube: ''},
  ]);

  assert.match(table, /^slug\s+status\s+duration\s+youtube/m);
  assert.match(table, /db-indexing\s+published\s+12:40\s+https:\/\/youtu\.be\/x/);
  assert.match(table, /db-transactions\s+voiced\s+TBD\s+-/);
});

test('the repository content has only known statuses', async () => {
  const lessons = await collectLessons(REAL_ROOT);
  assert.ok(lessons.some(lesson => lesson.slug === 'db-indexing'));
  assert.ok(lessons.some(lesson => lesson.slug === 'db-transactions'));
});
