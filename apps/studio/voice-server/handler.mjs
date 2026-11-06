/**
 * Dev-only voice server for the studio recorder.
 *
 * It is a plain Node request handler so it can be tested without Vite. The
 * Vite plugin in `plugin.mjs` mounts it on the dev server; it never ships in
 * the production player bundle.
 *
 * Security: only loopback callers are allowed (even when the dev server is
 * exposed with `--host`), slugs and beat ids are validated with fixed regular
 * expressions, and every filesystem path is built from those validated values
 * plus a fixed file name.
 */
import {randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir, readFile, rename, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';

export const MAX_BODY_BYTES = 50 * 1024 * 1024;

const PREFIX = '/__voice';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BEAT_ID = /^\d{2}-\d{2}$/;
const CLIP_FILE = /^(\d{2}-\d{2})\.(webm|mp4|ogg)$/;
const CLIP_TYPES = {webm: 'audio/webm', mp4: 'audio/mp4', ogg: 'audio/ogg'};
const EXTENSIONS = Object.keys(CLIP_TYPES);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Create the handler used as Vite middleware.
 *
 * @param {object} options
 * @param {string} options.rootDir - folder that holds `<slug>/` clip folders
 * @param {boolean} [options.allowRemote] - allow non-loopback callers (tests only)
 * @param {number} [options.maxBodyBytes] - request body limit
 * @returns {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => void}
 */
export function createVoiceHandler({rootDir, allowRemote = false, maxBodyBytes = MAX_BODY_BYTES}) {
  const root = path.resolve(rootDir);

  return (req, res, next) => {
    let url;
    try {
      url = new URL(req.url ?? '/', 'http://localhost');
    } catch {
      next();
      return;
    }

    if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) {
      next();
      return;
    }

    if (!allowRemote && !isLoopback(req.socket?.remoteAddress)) {
      sendJson(res, 403, {error: 'The voice server only answers loopback requests.'});
      return;
    }

    void route(req, res, url, {root, maxBodyBytes}).catch(error => {
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) console.error('[voice-server]', error);
      if (res.headersSent) {
        res.destroy();
      } else {
        sendJson(res, status, {error: error instanceof Error ? error.message : 'Voice server error.'});
      }
    });
  };
}

function isLoopback(address) {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

async function route(req, res, url, {root, maxBodyBytes}) {
  const subPath = url.pathname.slice(PREFIX.length) || '/';
  const method = req.method ?? 'GET';

  if (subPath === '/manifest' && method === 'GET') {
    const slug = requireSlug(url);
    sendJson(res, 200, await readManifest(root, slug));
    return;
  }

  if (subPath === '/clip' && method === 'POST') {
    await uploadClip(req, res, url, root, maxBodyBytes);
    return;
  }

  if (subPath === '/clip' && method === 'GET') {
    await sendClip(res, url, root);
    return;
  }

  if (subPath === '/clip' && method === 'DELETE') {
    await deleteClip(res, url, root);
    return;
  }

  if (subPath === '/timing' && method === 'POST') {
    await saveTiming(req, res, url, root, maxBodyBytes);
    return;
  }

  throw new HttpError(404, `Unknown voice route ${method} ${url.pathname}.`);
}

async function uploadClip(req, res, url, root, maxBodyBytes) {
  const slug = requireSlug(url);
  const id = requireBeatId(url);
  const ext = requireExtension(url);
  const seconds = requireSeconds(url);
  const slideName = (url.searchParams.get('name') ?? id).trim().slice(0, 200) || id;

  const body = await readBody(req, maxBodyBytes);
  if (body.length === 0) throw new HttpError(400, 'The clip body is empty.');

  const dir = path.join(root, slug);
  await mkdir(dir, {recursive: true});

  const entry = {
    file: `${id}.${ext}`,
    seconds,
    slideName,
    recordedAt: new Date().toISOString(),
  };
  await writeFile(path.join(dir, entry.file), body);

  for (const other of EXTENSIONS) {
    if (other !== ext) await rm(path.join(dir, `${id}.${other}`), {force: true});
  }

  const manifest = await readManifest(root, slug);
  manifest.clips[id] = entry;
  await writeJsonAtomic(dir, 'manifest.json', manifest);

  sendJson(res, 200, entry);
}

async function sendClip(res, url, root) {
  const slug = requireSlug(url);
  const id = requireBeatId(url);
  const manifest = await readManifest(root, slug);
  const entry = manifest.clips[id];
  if (!entry) throw new HttpError(404, 'Clip not found.');

  const match = CLIP_FILE.exec(entry.file);
  if (!match || match[1] !== id) throw new HttpError(404, 'Clip not found.');

  const file = path.join(root, slug, `${id}.${match[2]}`);
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) throw new HttpError(404, 'Clip file not found.');

  res.writeHead(200, {
    'content-type': CLIP_TYPES[match[2]],
    'content-length': info.size,
    'cache-control': 'no-store',
  });
  await pipeline(createReadStream(file), res);
}

async function deleteClip(res, url, root) {
  const slug = requireSlug(url);
  const id = requireBeatId(url);
  const dir = path.join(root, slug);
  const manifest = await readManifest(root, slug);
  const entry = manifest.clips[id];

  if (entry) {
    const match = CLIP_FILE.exec(entry.file);
    if (match && match[1] === id) await rm(path.join(dir, entry.file), {force: true});
    delete manifest.clips[id];
    await writeJsonAtomic(dir, 'manifest.json', manifest);
  }

  sendJson(res, 200, {deleted: Boolean(entry)});
}

async function saveTiming(req, res, url, root, maxBodyBytes) {
  const slug = requireSlug(url);
  const body = await readBody(req, maxBodyBytes);

  let data;
  try {
    data = JSON.parse(body.toString('utf8'));
  } catch {
    throw new HttpError(400, 'The timing body is not valid JSON.');
  }

  const timing = validateTiming(data);
  if (!timing) throw new HttpError(400, 'The timing body does not match the timing.json shape.');
  if (timing.slug !== slug) throw new HttpError(400, 'The timing body belongs to another lesson.');

  await writeJsonAtomic(path.join(root, slug), 'timing.json', timing);
  sendJson(res, 200, {ok: true});
}

function validateTiming(value) {
  if (!isRecord(value)) return null;
  if (typeof value.slug !== 'string' || !SLUG.test(value.slug)) return null;
  if (typeof value.fps !== 'number' || !Number.isFinite(value.fps) || value.fps <= 0) return null;
  if (typeof value.totalSeconds !== 'number' || !Number.isFinite(value.totalSeconds) || value.totalSeconds < 0) {
    return null;
  }
  if (!Array.isArray(value.beats)) return null;

  const beats = [];
  for (const beat of value.beats) {
    if (!isRecord(beat)) return null;
    if (typeof beat.id !== 'string' || !BEAT_ID.test(beat.id)) return null;
    if (typeof beat.name !== 'string') return null;
    if (typeof beat.start !== 'number' || !Number.isFinite(beat.start) || beat.start < 0) return null;
    beats.push({id: beat.id, name: beat.name, start: beat.start});
  }

  return {slug: value.slug, fps: value.fps, totalSeconds: value.totalSeconds, beats};
}

async function readManifest(root, slug) {
  const file = path.join(root, slug, 'manifest.json');
  let data;
  try {
    data = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return emptyManifest(slug);
  }

  if (!isRecord(data) || data.version !== 1 || !isRecord(data.clips)) return emptyManifest(slug);

  const clips = {};
  for (const [id, clip] of Object.entries(data.clips)) {
    if (!BEAT_ID.test(id) || !isRecord(clip)) continue;
    if (typeof clip.file !== 'string' || !CLIP_FILE.test(clip.file)) continue;
    if (typeof clip.seconds !== 'number' || !Number.isFinite(clip.seconds)) continue;
    if (typeof clip.slideName !== 'string' || typeof clip.recordedAt !== 'string') continue;
    clips[id] = {
      file: clip.file,
      seconds: clip.seconds,
      slideName: clip.slideName,
      recordedAt: clip.recordedAt,
    };
  }

  return {slug, version: 1, clips};
}

async function writeJsonAtomic(dir, name, value) {
  await mkdir(dir, {recursive: true});
  const target = path.join(dir, name);
  const temp = path.join(dir, `.${name}.${randomUUID()}.tmp`);
  try {
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(temp, target);
  } catch (error) {
    await rm(temp, {force: true});
    throw error;
  }
}

function emptyManifest(slug) {
  return {slug, version: 1, clips: {}};
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireSlug(url) {
  const slug = url.searchParams.get('slug');
  if (!slug || !SLUG.test(slug)) throw new HttpError(400, 'Invalid slug.');
  return slug;
}

function requireBeatId(url) {
  const id = url.searchParams.get('id');
  if (!id || !BEAT_ID.test(id)) throw new HttpError(400, 'Invalid beat id.');
  return id;
}

function requireExtension(url) {
  const ext = url.searchParams.get('ext');
  if (!ext || !EXTENSIONS.includes(ext)) {
    throw new HttpError(400, `Invalid clip extension; use ${EXTENSIONS.join(', ')}.`);
  }
  return ext;
}

function requireSeconds(url) {
  const seconds = Number(url.searchParams.get('seconds'));
  if (!Number.isFinite(seconds) || seconds <= 0) throw new HttpError(400, 'Invalid clip duration.');
  return seconds;
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] ?? 0);
    if (Number.isFinite(declared) && declared > limit) {
      req.resume();
      reject(new HttpError(413, `The body is larger than ${limit} bytes.`));
      return;
    }

    const chunks = [];
    let size = 0;
    let failed = false;

    req.on('data', chunk => {
      if (failed) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > limit) {
        failed = true;
        chunks.length = 0;
        req.resume();
        reject(new HttpError(413, `The body is larger than ${limit} bytes.`));
        return;
      }
      chunks.push(buffer);
    });
    req.on('end', () => {
      if (!failed) resolve(Buffer.concat(chunks));
    });
    req.on('error', error => {
      if (!failed) {
        failed = true;
        reject(error);
      }
    });
  });
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}
