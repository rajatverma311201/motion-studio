import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {cp, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REAL_ROOT = path.resolve(SCRIPT_DIR, '../..');
const SYNC = path.join(SCRIPT_DIR, 'sync-lessons.mjs');
const TSX = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;

async function write(root, file, content) {
  const target = path.join(root, file);
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, content, 'utf8');
}

function chapters(slug, names) {
  return JSON.stringify(
    {
      slug,
      title: slug.toUpperCase(),
      chapters: names.map((name, index) => ({name, color: index === 0 ? 'lime' : 'cyan'})),
    },
    null,
    2,
  );
}

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-studio-lessons-'));
  await cp(path.join(REAL_ROOT, 'packages/video-kit/src/themes'), path.join(root, 'packages/video-kit/src/themes'), {
    recursive: true,
  });

  for (const slug of ['demo', 'demo-no-notes', 'demo-missing-page']) {
    await write(root, `apps/studio/src/scenes/${slug}/chapters.json`, chapters(slug, ['INTRO', 'NEXT']));
    await write(root, `apps/studio/src/projects/${slug}.ts`, 'export default {};\n');
  }

  await write(
    root,
    'apps/docs/content/docs/security/demo.mdx',
    `---
title: 'Demo'
video: demo
---

### 01 · INTRO

<VoiceoverNotes>

- A transaction groups many steps into one unit.
- Use \`BEGIN\` and \`COMMIT\` together.

</VoiceoverNotes>

### 02 · NEXT

This chapter has no notes block.
`,
  );

  await write(
    root,
    'apps/docs/content/docs/security/demo-no-notes.mdx',
    `---
title: 'Demo without notes'
video: demo-no-notes
---

No voiceover notes at all.
`,
  );

  return root;
}

test('carries the VoiceoverNotes bullets into lessons.json', async t => {
  const root = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));

  const result = spawnSync(process.execPath, ['--import', TSX, SYNC], {
    cwd: root,
    encoding: 'utf8',
    env: {...process.env, MOTION_STUDIO_ROOT: root},
  });
  assert.equal(result.status, 0, result.stderr);

  const lessons = JSON.parse(await readFile(path.join(root, 'apps/docs/src/generated/lessons.json'), 'utf8'));

  assert.deepEqual(lessons.demo.chapters[0].notes, [
    'A transaction groups many steps into one unit.',
    'Use `BEGIN` and `COMMIT` together.',
  ]);
  assert.deepEqual(lessons.demo.chapters[1].notes, []);

  assert.deepEqual(
    lessons['demo-no-notes'].chapters.map(chapter => chapter.notes),
    [[], []],
  );
  assert.deepEqual(
    lessons['demo-missing-page'].chapters.map(chapter => chapter.notes),
    [[], []],
  );

  assert.equal(Object.keys(lessons.demo.chapters[0]).at(-1), 'notes');
  assert.match(result.stderr, /demo: chapter 02 \(NEXT\) has no <VoiceoverNotes>/);
  assert.match(result.stderr, /demo-missing-page: no MDX page/);
});
