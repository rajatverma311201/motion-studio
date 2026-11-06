import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {findFfmpeg, findFfprobe, hasBinary} from './ffmpeg-path.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MUX = path.join(SCRIPT_DIR, 'voice-mux.mjs');
const TSX = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;

const ffmpeg = findFfmpeg();
const ffprobe = findFfprobe();
const available = hasBinary(ffmpeg) && hasBinary(ffprobe);

function run(binary, args) {
  return spawnSync(binary, args, {encoding: 'utf8'});
}

test(
  'muxes two sine clips onto a three-second video',
  {skip: available ? false : 'ffmpeg is not installed'},
  async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'voice-mux-'));
    const voiceRoot = path.join(dir, 'voice');
    const lessonDir = path.join(voiceRoot, 'demo');
    const video = path.join(dir, 'demo.mp4');
    const out = path.join(dir, 'demo.voiced.mp4');
    await mkdir(lessonDir, {recursive: true});

    try {
      const videoResult = run(ffmpeg, [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'color=c=black:s=320x180:r=30',
        '-t',
        '3',
        '-pix_fmt',
        'yuv420p',
        '-c:v',
        'libx264',
        video,
      ]);
      assert.equal(videoResult.status, 0, videoResult.stderr);

      const first = run(ffmpeg, [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=440:duration=0.6',
        '-c:a',
        'libopus',
        path.join(lessonDir, '01-01.webm'),
      ]);
      assert.equal(first.status, 0, first.stderr);
      const second = run(ffmpeg, [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=660:duration=0.5',
        '-c:a',
        'aac',
        path.join(lessonDir, '01-02.mp4'),
      ]);
      assert.equal(second.status, 0, second.stderr);

      const recordedAt = '2026-01-01T00:00:00.000Z';
      await writeFile(
        path.join(lessonDir, 'manifest.json'),
        JSON.stringify({
          slug: 'demo',
          version: 1,
          clips: {
            '01-01': {file: '01-01.webm', seconds: 0.6, slideName: '01-01 · Intro', recordedAt},
            '01-02': {file: '01-02.mp4', seconds: 0.5, slideName: '01-02 · Next', recordedAt},
          },
        }),
        'utf8',
      );
      await writeFile(
        path.join(lessonDir, 'timing.json'),
        JSON.stringify({
          slug: 'demo',
          fps: 30,
          totalSeconds: 3,
          beats: [
            {id: '01-01', name: '01-01 · Intro', start: 0},
            {id: '01-02', name: '01-02 · Next', start: 1.5},
          ],
        }),
        'utf8',
      );

      const result = spawnSync(process.execPath, ['--import', TSX, MUX, 'demo', '--video', video, '--out', out], {
        cwd: SCRIPT_DIR,
        env: {...process.env, MOTION_STUDIO_VOICE_ROOT: voiceRoot},
        encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);

      const probe = run(ffprobe, [
        '-v',
        'error',
        '-show_entries',
        'stream=codec_type',
        '-show_entries',
        'format=duration',
        '-of',
        'json',
        out,
      ]);
      assert.equal(probe.status, 0, probe.stderr);
      const info = JSON.parse(probe.stdout);
      const types = info.streams.map(stream => stream.codec_type).sort();
      assert.deepEqual(types, ['audio', 'video']);
      assert.ok(Math.abs(Number(info.format.duration) - 3) <= 0.1, `duration ${info.format.duration}`);
    } finally {
      await rm(dir, {recursive: true, force: true});
    }
  },
);
