#!/usr/bin/env node
/**
 * project-dump.mjs
 * Writes ONE markdown file with (1) the directory tree and (2) the contents of every text file.
 * Skips everything git ignores, plus node_modules, build output, renders, binaries, lockfiles,
 * Motion Canvas .meta files and secrets (.env). Run it from the repository root:
 *
 *   node tools/scripts/project-dump.mjs
 *
 * Options:
 *   --out <file>        output file (default project-dump.md)
 *   --max-file-kb <n>   truncate files bigger than n KB (default 60)
 *   --split-kb <n>      split the output into parts of about n KB each (default: one file)
 *   --tree-only         write only the directory tree
 *   --include-meta      also include *.meta files
 *   --only <prefix>     only include paths starting with this prefix (repeatable), e.g. --only apps/studio
 */
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, statSync, writeFileSync} from 'node:fs';
import {basename, extname, join, resolve} from 'node:path';

const argv = process.argv.slice(2);
const has = name => argv.includes(name);
const value = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const values = name => argv.flatMap((arg, i) => (arg === name && argv[i + 1] ? [argv[i + 1]] : []));

const ROOT = process.cwd();
const OUT = value('--out', 'project-dump.md');
const MAX_FILE_CHARS = Number(value('--max-file-kb', 60)) * 1024;
const SPLIT_CHARS = Number(value('--split-kb', 0)) * 1024;
const TREE_ONLY = has('--tree-only');
const INCLUDE_META = has('--include-meta');
const OUT_DOT = OUT.lastIndexOf('.');
const OUT_BASE = OUT_DOT > 0 ? OUT.slice(0, OUT_DOT) : OUT;
const OUT_EXT = OUT_DOT > 0 ? OUT.slice(OUT_DOT) : '.md';
const ONLY = values('--only').map(p => p.replace(/^\.?\//, '').replace(/\/$/, ''));

// ---------------------------------------------------------------- what to skip entirely
const SKIP_SEGMENTS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.output',
  '.source',
  '.next',
  '.turbo',
  '.cache',
  '.vite',
  '.tanstack',
  '.nitro',
  '.vinxi',
  'coverage',
  '.snapshots',
  '.DS_Store',
]);
const SKIP_PATHS = [
  /(^|\/)apps\/studio\/output\//, // Motion Canvas renders
  /(^|\/)apps\/docs\/public\/videos\//, // built video bundles
  /(^|\/)apps\/docs\/src\/generated\//, // generated JSON
  /(^|\/)routeTree\.gen\.ts$/,
  /(^|\/)project-dump.*\.md$/, // earlier dumps
  /(^|\/)PROGRESS-archive\.md$/, // long history, not needed in a dump
  /(^|\/)pnpm-[^/]*\.ya?ml$/, // pnpm-lock.yaml, pnpm-workspace.yaml: not listed at all
  /(^|\/)apps\/studio\/output\//, // Motion Canvas renders
];

// ---------------------------------------------------------------- listed in the tree, content omitted
const BINARY_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.bmp',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.mp4',
  '.webm',
  '.mov',
  '.mp3',
  '.wav',
  '.ogg',
  '.pdf',
  '.zip',
  '.gz',
  '.tgz',
  '.7z',
  '.wasm',
  '.bin',
  '.lockb',
]);
const LOCKFILES = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lockb']);
const isSecret = name =>
  ((name === '.env' || name.startsWith('.env.')) && !/\.(example|sample|template)$/.test(name)) ||
  /\.(pem|key|p12|pfx)$/.test(name);

// ---------------------------------------------------------------- list files
function listWithGit() {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT,
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return out.toString('utf8').split('\0').filter(Boolean);
}

function listWithWalk(dir = '', acc = []) {
  for (const entry of readdirSync(join(ROOT, dir), {withFileTypes: true})) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) listWithWalk(rel, acc);
    else if (entry.isFile()) acc.push(rel);
  }
  return acc;
}

let usedGit = true;
let files;
try {
  files = listWithGit();
} catch {
  usedGit = false;
  files = listWithWalk();
}

files = [...new Set(files)]
  .map(f => f.split('\\').join('/'))
  .filter(f => existsSync(join(ROOT, f)) && statSync(join(ROOT, f)).isFile())
  .filter(f => !f.split('/').some(seg => SKIP_SEGMENTS.has(seg)))
  .filter(f => !SKIP_PATHS.some(re => re.test(f)))
  .filter(f => f !== OUT && !(f.startsWith(`${OUT_BASE}-part`) && f.endsWith(OUT_EXT)))
  .filter(f => ONLY.length === 0 || ONLY.some(p => f === p || f.startsWith(`${p}/`)))
  .sort((a, b) => a.localeCompare(b));

// ---------------------------------------------------------------- classify
function looksBinary(path) {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(8000);
    const n = readSync(fd, buf, 0, 8000, 0);
    return buf.subarray(0, n).includes(0);
  } finally {
    closeSync(fd);
  }
}

const records = files.map(rel => {
  const abs = join(ROOT, rel);
  const name = basename(rel);
  const size = statSync(abs).size;
  let omitted = null;
  if (isSecret(name)) omitted = 'secret';
  else if (LOCKFILES.has(name)) omitted = 'lockfile';
  else if (name === '.gitignore' || name === '.prettierignore') omitted = 'ignore file';
  else if (!INCLUDE_META && name.endsWith('.meta')) omitted = 'meta file';
  else if (BINARY_EXT.has(extname(name).toLowerCase())) omitted = 'binary';
  else if (looksBinary(abs)) omitted = 'binary';
  else if (TREE_ONLY) omitted = 'tree only';
  return {rel, size, omitted};
});

// ---------------------------------------------------------------- tree
const kb = n => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

function buildTree(recs) {
  const root = {dirs: new Map(), files: []};
  for (const rec of recs) {
    const parts = rec.rel.split('/');
    let node = root;
    for (const part of parts.slice(0, -1)) {
      if (!node.dirs.has(part)) node.dirs.set(part, {dirs: new Map(), files: []});
      node = node.dirs.get(part);
    }
    node.files.push({name: parts.at(-1), rec});
  }
  return root;
}

function renderTree(node, prefix = '') {
  const lines = [];
  const dirs = [...node.dirs.entries()].sort(([a], [b]) => a.localeCompare(b));
  const fileEntries = [...node.files].sort((a, b) => a.name.localeCompare(b.name));
  const total = dirs.length + fileEntries.length;
  let i = 0;
  for (const [name, child] of dirs) {
    const last = ++i === total;
    lines.push(`${prefix}${last ? '└── ' : '├── '}${name}/`);
    lines.push(...renderTree(child, `${prefix}${last ? '    ' : '│   '}`));
  }
  for (const {name, rec} of fileEntries) {
    const last = ++i === total;
    const note = rec.omitted && rec.omitted !== 'tree only' ? `  [content omitted: ${rec.omitted}]` : '';
    lines.push(`${prefix}${last ? '└── ' : '├── '}${name}  (${kb(rec.size)})${note}`);
  }
  return lines;
}

// ---------------------------------------------------------------- contents
const LANG = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.jsx': 'jsx',
  '.mjs': 'js',
  '.cjs': 'js',
  '.json': 'json',
  '.md': 'md',
  '.mdx': 'mdx',
  '.css': 'css',
  '.html': 'html',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.sh': 'bash',
  '.svg': 'svg',
  '.toml': 'toml',
};

function fenceFor(text) {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map(m => m.length));
  return '`'.repeat(Math.max(3, longest + 1));
}

const sections = [];
let truncated = 0;
for (const rec of records) {
  if (rec.omitted) continue;
  let text = readFileSync(join(ROOT, rec.rel), 'utf8').replace(/\r\n/g, '\n');
  let note = '';
  if (text.length > MAX_FILE_CHARS) {
    note = `\n[truncated: showing the first ${kb(MAX_FILE_CHARS)} of ${kb(rec.size)}]`;
    text = text.slice(0, MAX_FILE_CHARS);
    truncated += 1;
  }
  const fence = fenceFor(text);
  const lang = LANG[extname(rec.rel).toLowerCase()] ?? '';
  sections.push({
    rel: rec.rel,
    body: `\n### ${rec.rel}\n\n${fence}${lang}\n${text.replace(/\n$/, '')}\n${fence}${note}\n`,
  });
}

// ---------------------------------------------------------------- header
function git(args) {
  try {
    return execFileSync('git', args, {cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore']})
      .toString()
      .trim();
  } catch {
    return '';
  }
}
let projectName = basename(resolve(ROOT));
try {
  projectName = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).name ?? projectName;
} catch {
  /* no root package.json */
}

const reasons = {};
for (const r of records) if (r.omitted) reasons[r.omitted] = (reasons[r.omitted] ?? 0) + 1;
const contentChars = sections.reduce((n, s) => n + s.body.length, 0);
const biggest = [...sections].sort((a, b) => b.body.length - a.body.length).slice(0, 8);

const header = [
  `# Project dump: ${projectName}`,
  '',
  `- Generated: ${new Date().toISOString()}`,
  `- Branch: ${git(['rev-parse', '--abbrev-ref', 'HEAD']) || 'n/a'}`,
  `- Last commit: ${git(['log', '-1', '--format=%h %s']) || 'n/a'}`,
  `- Uncommitted changes: ${git(['status', '--porcelain']) ? 'yes' : 'no'}`,
  `- File list from: ${usedGit ? 'git (respects .gitignore)' : 'directory walk (no git found)'}`,
  `- Files listed: ${records.length}, with content: ${sections.length}, truncated: ${truncated}`,
  `- Omitted: ${
    Object.entries(reasons)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ') || 'none'
  }`,
  `- Size of contents: ${kb(contentChars)} (about ${Math.round(contentChars / 4).toLocaleString('en-US')} tokens)`,
  '',
  '## Directory structure',
  '',
  '```text',
  `${basename(resolve(ROOT))}/`,
  ...renderTree(buildTree(records)),
  '```',
  '',
  ...(TREE_ONLY ? [] : ['## File contents']),
].join('\n');

// ---------------------------------------------------------------- write
const parts = [[header]];
let size = header.length;
for (const s of sections) {
  if (SPLIT_CHARS > 0 && size + s.body.length > SPLIT_CHARS && parts.at(-1).length > 1) {
    parts.push([`# Project dump (continued): ${projectName}\n`]);
    size = parts.at(-1)[0].length;
  }
  parts.at(-1).push(s.body);
  size += s.body.length;
}

const written = [];
parts.forEach((chunks, i) => {
  const file = parts.length === 1 ? OUT : `${OUT_BASE}-part${i + 1}${OUT_EXT}`;
  writeFileSync(join(ROOT, file), chunks.join('\n') + '\n');
  written.push(file);
});

console.log(`Wrote ${written.join(', ')}`);
console.log(`${records.length} files listed, ${sections.length} with content, ${truncated} truncated`);
console.log(`Contents: ${kb(contentChars)} (about ${Math.round(contentChars / 4).toLocaleString('en-US')} tokens)`);
if (biggest.length) {
  console.log('Largest files in the dump:');
  for (const s of biggest) console.log(`  ${kb(s.body.length).padStart(9)}  ${s.rel}`);
}
