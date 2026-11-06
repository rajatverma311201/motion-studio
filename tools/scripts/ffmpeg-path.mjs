/**
 * Locate ffmpeg and ffprobe.
 *
 * The Motion Canvas exporter already ships both binaries through
 * `@ffmpeg-installer/ffmpeg` and `@ffprobe-installer/ffprobe`. Resolve them
 * from the exporter package first, then fall back to the PATH.
 */
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = process.env.MOTION_STUDIO_ROOT
  ? path.resolve(process.env.MOTION_STUDIO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function exporterBinary(name) {
  try {
    const studioRequire = createRequire(path.join(ROOT, 'apps/studio/package.json'));
    const ffmpegPackage = studioRequire.resolve('@motion-canvas/ffmpeg/package.json');
    const ffmpegRequire = createRequire(ffmpegPackage);
    const installer = ffmpegRequire(`@${name}-installer/${name}`);
    return typeof installer.path === 'string' ? installer.path : null;
  } catch {
    return null;
  }
}

/** The ffmpeg binary, from the exporter or from the PATH. */
export function findFfmpeg() {
  return exporterBinary('ffmpeg') ?? 'ffmpeg';
}

/** The ffprobe binary, from the exporter or from the PATH. */
export function findFfprobe() {
  return exporterBinary('ffprobe') ?? 'ffprobe';
}

/** Whether a binary can be executed. */
export function hasBinary(binary) {
  try {
    const result = spawnSync(binary, ['-version'], {stdio: 'ignore'});
    return result.status === 0;
  } catch {
    return false;
  }
}
