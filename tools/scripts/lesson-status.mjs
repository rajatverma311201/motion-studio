#!/usr/bin/env node
/**
 * Print the recording status of every lesson page.
 *
 *   pnpm status
 *
 * Reads the MDX frontmatter directly so it works without a build. Statuses are
 * the same five the docs schema accepts.
 */
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const LESSON_STATUSES = ['outline', 'animated', 'rendered', 'voiced', 'published'];

const ROOT = process.env.MOTION_STUDIO_ROOT
  ? path.resolve(process.env.MOTION_STUDIO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const COLUMNS = ['slug', 'status', 'duration', 'youtube'];

/** Read the flat `key: value` pairs between the leading `---` fences. */
export function parseFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!match) return {};

  const data = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('- ')) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"')))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return data;
}

export function validateStatus(status, file) {
  if (!LESSON_STATUSES.includes(status)) {
    throw new Error(`${file}: unknown status "${status}". Use one of ${LESSON_STATUSES.join(', ')}.`);
  }
  return status;
}

async function mdxFiles(dir) {
  const entries = await readdir(dir, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await mdxFiles(full)));
    else if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(full);
  }
  return files.sort();
}

export async function collectLessons(root = ROOT) {
  const contentDir = path.join(root, 'apps/docs/content/docs');
  const lessons = [];

  for (const file of await mdxFiles(contentDir)) {
    const data = parseFrontmatter(await readFile(file, 'utf8'));
    if (!data.video) continue;

    const relative = path.relative(root, file);
    lessons.push({
      slug: data.video,
      status: validateStatus(data.status ?? 'outline', relative),
      duration: data.duration || 'TBD',
      youtube: data.youtube || '',
      file: relative,
    });
  }

  return lessons.sort((a, b) => a.slug.localeCompare(b.slug, 'en'));
}

export function formatTable(rows) {
  const widths = COLUMNS.map(column => Math.max(column.length, ...rows.map(row => String(row[column] ?? '').length)));
  const line = values =>
    values
      .map((value, index) => String(value).padEnd(widths[index]))
      .join('  ')
      .trimEnd();
  const separator = widths.map(width => '-'.repeat(width)).join('  ');

  return [line(COLUMNS), separator, ...rows.map(row => line(COLUMNS.map(column => row[column] || '-')))].join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    const lessons = await collectLessons();
    if (lessons.length === 0) {
      console.log('No lesson pages found under apps/docs/content/docs.');
    } else {
      console.log(formatTable(lessons));
    }
  } catch (error) {
    console.error(`lesson-status: ${error.message}`);
    process.exit(1);
  }
}
