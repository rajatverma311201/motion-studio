#!/usr/bin/env node
/**
 * Copy an existing theme and register the copy.
 *
 *   pnpm new:theme midnight-purple "Midnight Purple" --from tokyo-night
 *   pnpm new:theme midnight-purple "Midnight Purple" --from tokyo-night --default-mode light
 *
 * MOTION_STUDIO_ROOT overrides the repository root; the tests use it.
 */
import {spawnSync} from 'node:child_process';
import {readFile, stat, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {themeIds} from '../../packages/video-kit/src/themes/registry.ts';

const ROOT = process.env.MOTION_STUDIO_ROOT
  ? path.resolve(process.env.MOTION_STUDIO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TSX = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
const THEMES_DIR = path.join(ROOT, 'packages/video-kit/src/themes');
const REGISTRY_FILE = path.join(THEMES_DIR, 'registry.ts');
const MODES = ['dark', 'light'];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const USAGE = `Usage:
  pnpm new:theme <id> "<Display Name>" --from <existing-theme-id> [--default-mode dark|light]

Example:
  pnpm new:theme midnight-purple "Midnight Purple" --from tokyo-night`;

function fail(message) {
  console.error(`new-theme: ${message}`);
  process.exit(1);
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const positional = [];
  let from;
  let defaultMode;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--from') {
      from = argv[++i];
    } else if (arg.startsWith('--from=')) {
      from = arg.slice('--from='.length);
    } else if (arg === '--default-mode') {
      defaultMode = argv[++i];
    } else if (arg.startsWith('--default-mode=')) {
      defaultMode = arg.slice('--default-mode='.length);
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else if (arg.startsWith('-')) {
      fail(`unknown option ${arg}\n\n${USAGE}`);
    } else {
      positional.push(arg);
    }
  }

  return {positional, from, defaultMode};
}

function camelCase(id) {
  return id.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function tsString(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function replaceProperty(source, property, value) {
  const pattern = new RegExp(`^  ${property}:[\\s\\S]*?(?=^  [A-Za-z])`, 'm');
  if (!pattern.test(source)) throw new Error(`could not find the top-level "${property}" property`);
  return source.replace(pattern, `  ${property}: ${value},\n`);
}

function insertBeforeLine(source, marker, text) {
  const index = source.indexOf(marker);
  if (index === -1) return null;
  const lineStart = source.lastIndexOf('\n', index) + 1;
  return `${source.slice(0, lineStart)}${text}${source.slice(lineStart)}`;
}

function ensureImportsMarkers(source) {
  if (source.includes('// <generated:imports>')) return source;
  const imports = [...source.matchAll(/^import .*;$/gm)];
  if (imports.length === 0) {
    return `// <generated:imports>\n// </generated:imports>\n\n${source}`;
  }
  const first = imports[0].index;
  const last = imports[imports.length - 1];
  const lastEnd = last.index + last[0].length;
  return (
    source.slice(0, first) +
    '// <generated:imports>\n' +
    source.slice(first, lastEnd) +
    '\n// </generated:imports>' +
    source.slice(lastEnd)
  );
}

function ensureEntriesMarkers(source) {
  if (source.includes('// <generated:entries>')) return source;
  const match = /export const themes: Record<string, Theme> = \{([\s\S]*?)\n\};/.exec(source);
  if (!match) return source;
  const block = match[1].replace(/^\n+|\n+$/g, '');
  const replacement = `export const themes: Record<string, Theme> = {\n  // <generated:entries>\n${block}\n  // </generated:entries>\n};`;
  return source.replace(match[0], replacement);
}

function registerTheme(source, id, constant) {
  let registry = source;
  const key = id.includes('-') ? tsString(id) : id;
  const importLine = `import {${constant}} from './${id}';\n`;
  const entryLine = `  ${key}: ${constant},\n`;

  registry = insertBeforeLine(registry, '// </generated:imports>', importLine);
  if (registry === null) fail('registry.ts is missing the "// </generated:imports>" marker');

  const withEntry = insertBeforeLine(registry, '// </generated:entries>', entryLine);
  if (withEntry === null) fail('registry.ts is missing the "// </generated:entries>" marker');

  return withEntry;
}

const {positional, from, defaultMode} = parseArgs(process.argv.slice(2));
const [id, name] = positional;

if (!id) fail(`missing <id>\n\n${USAGE}`);
if (!name) fail(`missing "<Display Name>"\n\n${USAGE}`);
if (!KEBAB.test(id)) fail(`id "${id}" must be kebab-case, e.g. midnight-purple`);
if (!from) fail(`--from <existing-theme-id> is required\n\n${USAGE}`);
if (!themeIds.includes(from)) fail(`unknown theme "${from}". Available: ${themeIds.join(', ')}`);
if (defaultMode !== undefined && !MODES.includes(defaultMode)) {
  fail(`unknown default mode "${defaultMode}". Available: ${MODES.join(', ')}`);
}

const fromFile = path.join(THEMES_DIR, `${from}.ts`);
const targetFile = path.join(THEMES_DIR, `${id}.ts`);

if (id === from) fail(`"${id}" is the source theme; choose a new id`);
if (!(await exists(fromFile))) fail(`source theme file packages/video-kit/src/themes/${from}.ts not found`);
if (await exists(targetFile)) fail(`refusing to overwrite packages/video-kit/src/themes/${id}.ts`);

const source = await readFile(fromFile, 'utf8');
const constantMatch = /export const (\w+): Theme = \{/.exec(source);
if (!constantMatch) fail(`could not find "export const <name>: Theme = {" in ${from}.ts`);

const constant = `${camelCase(id)}Theme`;
let copy = source.replace(constantMatch[0], `export const ${constant}: Theme = {`);
try {
  copy = replaceProperty(copy, 'id', tsString(id));
  copy = replaceProperty(copy, 'name', tsString(name));
  copy = replaceProperty(copy, 'description', tsString('TODO: describe this theme.'));
  if (defaultMode !== undefined) {
    copy = replaceProperty(copy, 'defaultMode', tsString(defaultMode));
  }
} catch (error) {
  fail(error.message);
}

await writeFile(targetFile, copy, 'utf8');

const registrySource = await readFile(REGISTRY_FILE, 'utf8');
const prepared = ensureEntriesMarkers(ensureImportsMarkers(registrySource));
await writeFile(REGISTRY_FILE, registerTheme(prepared, id, constant), 'utf8');

const sync = spawnSync(process.execPath, ['--import', TSX, path.join(ROOT, 'tools/scripts/sync-themes.mjs')], {
  cwd: ROOT,
  stdio: 'inherit',
  env: process.env,
});
if (sync.status !== 0) fail(`sync-themes.mjs failed (exit ${sync.status})`);

console.log('');
console.log(`Created theme "${id}" from "${from}".`);
console.log('');
console.log('Next steps:');
console.log(`  1. Edit both variants in packages/video-kit/src/themes/${id}.ts.`);
console.log('  2. pnpm --filter @motion-studio/video-kit test');
console.log(`  3. pnpm snap:themes -- --only ${id}`);
console.log('  4. Open .snapshots/themes.html and review Dark and Light.');
console.log(`  5. pnpm studio --theme ${id}`);
