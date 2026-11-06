#!/usr/bin/env node
/**
 * Lay the recorded voice clips onto a rendered MP4.
 *
 *   pnpm voice:mux <slug>
 *   pnpm voice:mux db-transactions --video apps/studio/output/db-transactions.mp4
 *   pnpm voice:mux db-transactions --no-normalize
 *
 * Reads <voice-root>/<slug>/manifest.json and timing.json, places every clip at
 * its beat start, mixes the track, pads or cuts it to the video duration and
 * writes <video>.voiced.mp4 (or --out). The video stream is copied, never
 * re-encoded, and the input file is never overwritten.
 */
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildFfmpegArgs, planAudio} from '../../packages/video-kit/src/voice/mux-plan.ts';
import {findFfmpeg, findFfprobe, hasBinary} from './ffmpeg-path.mjs';

const ROOT = process.env.MOTION_STUDIO_ROOT
  ? path.resolve(process.env.MOTION_STUDIO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const VOICE_ROOT = process.env.MOTION_STUDIO_VOICE_ROOT
  ? path.resolve(process.env.MOTION_STUDIO_VOICE_ROOT)
  : path.join(ROOT, 'apps/studio/voice');
const STUDIO_OUTPUT = path.join(ROOT, 'apps/studio/output');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const USAGE = `Usage:
  pnpm voice:mux <slug> [--video <file.mp4>] [--out <file.mp4>] [--no-normalize]

The default video is the newest MP4 the studio exported for the lesson in
${STUDIO_OUTPUT}. The default output is <video>.voiced.mp4 next to the input.`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {slug: undefined, video: undefined, out: undefined, normalize: true};
  const args = [...argv];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else if (arg === '--no-normalize') {
      parsed.normalize = false;
    } else if (arg === '--video') {
      parsed.video = args[++i];
      if (parsed.video === undefined) fail('--video needs a file');
    } else if (arg.startsWith('--video=')) {
      parsed.video = arg.slice('--video='.length);
    } else if (arg === '--out') {
      parsed.out = args[++i];
      if (parsed.out === undefined) fail('--out needs a file');
    } else if (arg.startsWith('--out=')) {
      parsed.out = arg.slice('--out='.length);
    } else if (arg.startsWith('-')) {
      fail(`unknown option ${arg}\n\n${USAGE}`);
    } else if (parsed.slug === undefined) {
      parsed.slug = arg;
    } else {
      fail(`unexpected argument ${arg}\n\n${USAGE}`);
    }
  }

  if (!parsed.slug) fail(USAGE);
  if (!SLUG.test(parsed.slug)) fail(`"${parsed.slug}" is not a kebab-case lesson slug.`);
  return parsed;
}

async function readJson(file, what) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    fail(`Could not read ${what} at ${file}: ${error.message}`);
  }
}

async function newestRender(slug) {
  let entries;
  try {
    entries = await readdir(STUDIO_OUTPUT);
  } catch {
    return null;
  }

  const pattern = new RegExp(`^${slug}(?:--[a-z0-9-]+--(?:dark|light))?\\.mp4$`);
  const files = entries.filter(name => pattern.test(name));
  let newest = null;
  for (const name of files) {
    const file = path.join(STUDIO_OUTPUT, name);
    const info = await stat(file).catch(() => null);
    if (info?.isFile() && (!newest || info.mtimeMs > newest.mtimeMs)) {
      newest = {file, mtimeMs: info.mtimeMs};
    }
  }
  return newest?.file ?? null;
}

function probeDuration(ffprobe, video) {
  const result = spawnSync(
    ffprobe,
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', video],
    {encoding: 'utf8'},
  );
  if (result.status !== 0) fail(`ffprobe could not read ${video}:\n${result.stderr}`);
  const duration = Number(result.stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) fail(`Could not read the duration of ${video}.`);
  return duration;
}

const {slug, video: videoArg, out: outArg, normalize} = parseArgs(process.argv.slice(2));
const voiceDir = path.join(VOICE_ROOT, slug);
const manifestFile = path.join(voiceDir, 'manifest.json');
const timingFile = path.join(voiceDir, 'timing.json');

if (!existsSync(manifestFile)) {
  fail(
    `No manifest at ${manifestFile}.\n` +
      'Record the voice with `pnpm studio --voice record`, open the lesson on localhost and press PRESENT.',
  );
}
if (!existsSync(timingFile)) {
  fail(
    `No timing at ${timingFile}.\n` +
      'Render the MP4 in the editor while voice mode "play" is active, then run `pnpm voice:mux` again.',
  );
}

const manifest = await readJson(manifestFile, 'the voice manifest');
const timing = await readJson(timingFile, 'the timing table');
if (manifest?.slug !== slug || !manifest.clips || typeof manifest.clips !== 'object') {
  fail(`${manifestFile} does not belong to "${slug}" or has no clips object.`);
}
if (timing?.slug !== slug || !Array.isArray(timing.beats)) {
  fail(`${timingFile} does not belong to "${slug}" or has no beats array.`);
}

const plan = planAudio(manifest, timing);
if (plan.warnings.length > 0) {
  console.error('Cannot mux the voice track:');
  for (const warning of plan.warnings) console.error(`  - ${warning}`);
  fail('\nRender again in voice mode "play" so each beat is stretched to its clip, then retry.');
}
if (plan.items.length === 0) {
  fail(`No recorded clips for "${slug}" in ${voiceDir}.`);
}

const items = [];
for (const item of plan.items) {
  if (path.basename(item.file) !== item.file) fail(`Refusing clip path "${item.file}" for ${item.id}.`);
  const file = path.join(voiceDir, item.file);
  if (!existsSync(file)) fail(`Clip ${item.id} is missing: ${file}`);
  items.push({...item, file});
}

const video = videoArg ? path.resolve(videoArg) : await newestRender(slug);
if (!video) {
  fail(
    `No MP4 found for "${slug}" in ${STUDIO_OUTPUT}.\n` +
      `Looked for ${slug}.mp4 and ${slug}--<theme>--<mode>.mp4. Render the video in the editor or pass --video.`,
  );
}
if (!existsSync(video)) fail(`The video does not exist: ${video}`);

if (path.extname(video).toLowerCase() !== '.mp4') fail(`The input must be an MP4: ${video}`);
const out = outArg
  ? path.resolve(outArg)
  : path.join(path.dirname(video), `${path.basename(video, path.extname(video))}.voiced.mp4`);
if (path.resolve(out) === path.resolve(video)) fail('The output must not overwrite the input video.');

const ffmpeg = findFfmpeg();
const ffprobe = findFfprobe();
if (!hasBinary(ffprobe)) fail('ffprobe is not available; install ffmpeg or run pnpm install again.');
if (!hasBinary(ffmpeg)) fail('ffmpeg is not available; install ffmpeg or run pnpm install again.');

const duration = probeDuration(ffprobe, video);
const ffmpegArgs = buildFfmpegArgs({
  video,
  out,
  durationSeconds: duration,
  plan: {items, warnings: []},
  normalize,
});

console.log(`Muxing ${items.length} clip${items.length === 1 ? '' : 's'} onto ${video}`);
const result = spawnSync(ffmpeg, ffmpegArgs, {stdio: 'inherit'});
if (result.status !== 0) fail(`ffmpeg failed with exit code ${result.status ?? 'unknown'}.`);

console.log(`Wrote ${out}`);
