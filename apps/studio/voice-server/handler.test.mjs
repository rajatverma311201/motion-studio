import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp, readFile, readdir, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {describe, it} from 'node:test';
import {createVoiceHandler} from './handler.mjs';

const SLUG = 'demo-lesson';
const ID = '03-02';

async function start(options = {}, remoteAddress) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'voice-server-'));
  const handler = createVoiceHandler({rootDir: root, ...options});
  const server = createServer((req, res) => {
    if (remoteAddress) {
      Object.defineProperty(req.socket, 'remoteAddress', {value: remoteAddress, configurable: true});
    }
    handler(req, res, () => {
      res.statusCode = 418;
      res.end('next');
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const {port} = server.address();
  return {
    root,
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}

function clipUrl(base, params) {
  return `${base}/__voice/clip?${new URLSearchParams(params)}`;
}

function manifestUrl(base, slug = SLUG) {
  return `${base}/__voice/manifest?${new URLSearchParams({slug})}`;
}

async function upload(base, {id = ID, ext = 'webm', seconds = '6.42', name = '03-02 · Intro', body = 'clip'} = {}) {
  return fetch(clipUrl(base, {slug: SLUG, id, seconds, ext, name}), {method: 'POST', body});
}

async function fileExists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

describe('voice server clips', () => {
  it('round-trips a clip through the manifest, streaming and delete', async () => {
    const {root, base, close} = await start();
    try {
      const payload = Buffer.from([1, 2, 3, 4]);
      const uploadResponse = await upload(base, {body: payload});
      assert.equal(uploadResponse.status, 200);
      const entry = await uploadResponse.json();
      assert.equal(entry.file, `${ID}.webm`);
      assert.equal(entry.seconds, 6.42);
      assert.equal(entry.slideName, '03-02 · Intro');
      assert.match(entry.recordedAt, /^\d{4}-\d{2}-\d{2}T/);

      const manifest = await (await fetch(manifestUrl(base))).json();
      assert.deepEqual(manifest, {slug: SLUG, version: 1, clips: {[ID]: entry}});

      const clip = await fetch(clipUrl(base, {slug: SLUG, id: ID}));
      assert.equal(clip.status, 200);
      assert.equal(clip.headers.get('content-type'), 'audio/webm');
      assert.deepEqual(Buffer.from(await clip.arrayBuffer()), payload);

      const deleted = await fetch(clipUrl(base, {slug: SLUG, id: ID}), {method: 'DELETE'});
      assert.equal(deleted.status, 200);
      assert.deepEqual(await deleted.json(), {deleted: true});
      assert.equal(await fileExists(path.join(root, SLUG, `${ID}.webm`)), false);

      const emptyManifest = await (await fetch(manifestUrl(base))).json();
      assert.deepEqual(emptyManifest, {slug: SLUG, version: 1, clips: {}});

      assert.equal((await fetch(clipUrl(base, {slug: SLUG, id: ID}))).status, 404);
      const again = await fetch(clipUrl(base, {slug: SLUG, id: ID}), {method: 'DELETE'});
      assert.deepEqual(await again.json(), {deleted: false});
    } finally {
      await close();
    }
  });

  it('replaces a clip recorded with another extension', async () => {
    const {root, base, close} = await start();
    try {
      await upload(base, {ext: 'webm', body: 'old'});
      const replacement = await upload(base, {ext: 'mp4', body: 'new'});
      const entry = await replacement.json();
      assert.equal(entry.file, `${ID}.mp4`);

      const files = await readdir(path.join(root, SLUG));
      assert.deepEqual(files.sort(), [`${ID}.mp4`, 'manifest.json']);

      const manifest = await (await fetch(manifestUrl(base))).json();
      assert.equal(manifest.clips[ID].file, `${ID}.mp4`);
      assert.equal(await (await fetch(clipUrl(base, {slug: SLUG, id: ID}))).text(), 'new');
    } finally {
      await close();
    }
  });

  it('returns an empty manifest for an unknown lesson', async () => {
    const {base, close} = await start();
    try {
      const response = await fetch(manifestUrl(base, 'never-recorded'));
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {slug: 'never-recorded', version: 1, clips: {}});
    } finally {
      await close();
    }
  });

  it('serves every supported extension with its content type', async () => {
    const {base, close} = await start();
    try {
      const types = {webm: 'audio/webm', mp4: 'audio/mp4', ogg: 'audio/ogg'};
      for (const [ext, type] of Object.entries(types)) {
        await upload(base, {ext});
        const response = await fetch(clipUrl(base, {slug: SLUG, id: ID}));
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('content-type'), type);
      }
    } finally {
      await close();
    }
  });
});

describe('voice server validation', () => {
  it('rejects path traversal and absolute paths', async () => {
    const {root, base, close} = await start();
    try {
      const badSlugs = ['../evil', '%2e%2e%2fevil', '/tmp/evil', 'Demo-Lesson', 'demo--lesson', 'demo_lesson'];
      for (const slug of badSlugs) {
        const response = await fetch(
          `${base}/__voice/clip?slug=${encodeURIComponent(slug)}&id=${ID}&seconds=1&ext=webm`,
          {method: 'POST', body: 'x'},
        );
        assert.equal(response.status, 400, `slug ${slug}`);
      }

      const traversal = await fetch(`${base}/__voice/clip?slug=%2e%2e%2fevil&id=${ID}&seconds=1&ext=webm`, {
        method: 'POST',
        body: 'x',
      });
      assert.equal(traversal.status, 400);

      const absolute = await fetch(`${base}/__voice/clip?slug=%2Ftmp%2Fevil&id=${ID}&seconds=1&ext=webm`, {
        method: 'POST',
        body: 'x',
      });
      assert.equal(absolute.status, 400);
      assert.deepEqual(await readdir(root), []);
    } finally {
      await close();
    }
  });

  it('rejects invalid beat ids and extensions', async () => {
    const {base, close} = await start();
    try {
      for (const id of ['1-1', '01-1', '01-01.webm', '../01-01', '01-01%2F..']) {
        const response = await fetch(clipUrl(base, {slug: SLUG, id, seconds: '1', ext: 'webm'}), {
          method: 'POST',
          body: 'x',
        });
        assert.equal(response.status, 400, `id ${id}`);
      }

      const badExt = await upload(base, {ext: 'wav'});
      assert.equal(badExt.status, 400);

      const badSeconds = await upload(base, {seconds: '-1'});
      assert.equal(badSeconds.status, 400);

      const empty = await upload(base, {body: ''});
      assert.equal(empty.status, 400);
    } finally {
      await close();
    }
  });

  it('rejects bodies above the limit with 413', async () => {
    const {root, base, close} = await start({maxBodyBytes: 1024});
    try {
      const response = await upload(base, {body: Buffer.alloc(4096, 1)});
      assert.equal(response.status, 413);
      assert.match((await response.json()).error, /larger than 1024 bytes/);
      assert.deepEqual(await readdir(root), []);
    } finally {
      await close();
    }
  });

  it('rejects non-loopback callers with 403', async () => {
    const {base, close} = await start({}, '203.0.113.5');
    try {
      const response = await fetch(manifestUrl(base));
      assert.equal(response.status, 403);
      assert.match((await response.json()).error, /loopback/);
    } finally {
      await close();
    }
  });

  it('lets allowRemote bypass the loopback check', async () => {
    const {base, close} = await start({allowRemote: true}, '203.0.113.5');
    try {
      const response = await fetch(manifestUrl(base));
      assert.equal(response.status, 200);
    } finally {
      await close();
    }
  });

  it('returns 404 JSON for unknown voice routes and calls next for other paths', async () => {
    const {base, close} = await start();
    try {
      const unknown = await fetch(`${base}/__voice/nope`);
      assert.equal(unknown.status, 404);
      assert.match((await unknown.json()).error, /Unknown voice route/);

      const other = await fetch(`${base}/hello`);
      assert.equal(other.status, 418);
      assert.equal(await other.text(), 'next');
    } finally {
      await close();
    }
  });
});

describe('voice server timing', () => {
  const timing = {
    slug: SLUG,
    fps: 60,
    totalSeconds: 12.5,
    beats: [
      {id: '01-01', name: '01-01 · Intro', start: 0},
      {id: '01-02', name: '01-02 · Next', start: 6.2},
    ],
  };

  it('stores a valid timing table', async () => {
    const {root, base, close} = await start();
    try {
      const response = await fetch(`${base}/__voice/timing?${new URLSearchParams({slug: SLUG})}`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(timing),
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {ok: true});
      const stored = JSON.parse(await readFile(path.join(root, SLUG, 'timing.json'), 'utf8'));
      assert.deepEqual(stored, timing);
    } finally {
      await close();
    }
  });

  it('rejects a malformed timing body without writing a file', async () => {
    const {root, base, close} = await start();
    try {
      const cases = [
        {...timing, fps: 0},
        {...timing, totalSeconds: -1},
        {...timing, beats: [{id: '1-1', name: 'x', start: 0}]},
        {...timing, beats: [{id: '01-01', name: 'x', start: -2}]},
        {...timing, slug: 'another-lesson'},
        {fps: 60},
      ];
      for (const body of cases) {
        const response = await fetch(`${base}/__voice/timing?${new URLSearchParams({slug: SLUG})}`, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify(body),
        });
        assert.equal(response.status, 400);
      }

      const notJson = await fetch(`${base}/__voice/timing?${new URLSearchParams({slug: SLUG})}`, {
        method: 'POST',
        body: '{not json',
      });
      assert.equal(notJson.status, 400);
      assert.equal(await fileExists(path.join(root, SLUG, 'timing.json')), false);
    } finally {
      await close();
    }
  });
});
