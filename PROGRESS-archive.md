# PROGRESS

Running log. Newest step at the bottom. Every step appends: what changed, decisions, gotchas, follow-ups.

## Step 01: monorepo bootstrap

**Environment:** Node `v22.19.0`, pnpm `12.16.1` (already installed; corepack not used). Branch `feat/monorepo-and-docs`, created from a safety commit on `master` (`265f505 chore: baseline before monorepo restructure`) because `AGENTS.md` was untracked.

**What changed**

- New root workspace: `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `tools/*`), root `package.json` (`motion-studio`, private, `packageManager: pnpm@12.16.1`, `engines.node >=22.12`, scripts `studio:dev`, `studio:build`, `typecheck`), new `.gitignore` (kept every old entry), `.prettierrc.json`, `.editorconfig`, this file.
- Motion Canvas project moved with `git mv` into `apps/studio`: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/`. Git records them as renames (100% similarity); no `.tsx`, `.ts` or `.meta` byte changed. `apps/studio/vite.config.ts` and `apps/studio/tsconfig.json` are byte-identical to before (the `./src/projects/*.ts` glob is relative to the package, so it still resolves).
- `package-lock.json` and the npm `node_modules` deleted; `pnpm-lock.yaml` is now the lockfile. No `.npmrc` was needed — `@motion-canvas/ui` resolves fine through pnpm's isolated `node_modules`, so no hoisting workaround.
- `apps/studio/package.json`: name `@motion-studio/studio`, `private: true`, **no** `type` field, scripts `dev: vite`, `build: tsc --noEmit && vite build`, `typecheck: tsc --noEmit`. Versions untouched.

**Final package set of `apps/studio`**

- dependencies: `@motion-canvas/2d ^3.17.2`, `@motion-canvas/core ^3.17.2`, `@motion-canvas/ffmpeg ^1.1.0`
- devDependencies: `@motion-canvas/ui ^3.17.2`, `@motion-canvas/vite-plugin ^3.17.2`, `prettier ^3.9.10`, `typescript ^5.2.2`, `vite ^4.0.0` (resolved to `4.5.14`)

**Working project URLs (later steps depend on this)**

- Studio root: `http://localhost:9000/` → 200
- Project: `http://localhost:9000/src/projects/<slug>` → `db-indexing` and `db-transactions` both 200
- Section deep-link in dev: `http://localhost:9000/src/projects/<slug>#s=<section-number>`

**Build output (verified, then `apps/studio/dist` removed)**

```
dist/src/projects/db-transactions-ac22f8df.js   32.63 kB
dist/src/projects/db-indexing-a520dc3d.js       60.13 kB
dist/_virtual_settings-f3046a97.js             178.88 kB
```

**Decisions / gotchas**

- pnpm 12 blocks dependency build scripts and install exited `ERR_PNPM_IGNORED_BUILDS`. `onlyBuiltDependencies` is gone in pnpm 11+ and the `pnpm` field in `package.json` is no longer read; the fix is an `allowBuilds` map in `pnpm-workspace.yaml` for the three existing (not new) packages `@ffmpeg-installer/darwin-arm64`, `@ffprobe-installer/darwin-arm64` and `esbuild`. Without it the ffmpeg exporter and Vite's esbuild binary would not be usable.
- Deleted the old root `.prettierrc` (`tabWidth: 4`). Prettier picks `.prettierrc` over `.prettierrc.json`, so keeping it would have silently shadowed the new shared style (`prettier --find-config-path` confirmed the precedence). Formatting rules now come only from `.prettierrc.json`.
- Move `package.json` **last** in future moves: `git mv package.json apps/studio/package.json` moves whatever root manifest exists at that moment, not the original.
- `public/` was empty and untracked, so there was nothing to move and the empty directory was dropped. `src/scenes/.DS_Store` is untracked/ignored and travelled with `src/`.
- `.meta` files still match the recorded file hashes because only paths changed, but the next editor open may rewrite them — commit those separately if it happens.

**Follow-ups**

- Step 02+: add `apps/docs` (TanStack Start + Fumadocs), `packages/video-kit`, `tools/*`. `apps/docs` must not import `.tsx` from `video-kit`.
- Build asset hashes change per build; do not hardcode them anywhere.

## Step 02: screenshot baseline

**What changed**

- New workspace package `tools/snapshots` (`@motion-studio/snapshots`, private, `"type": "module"`, no build step) with `capture.mjs`, `compare.mjs` and `frames.json`.
- Dependencies only `playwright ^1.49.0`, `pixelmatch ^6.0.0`, `pngjs ^7.0.0`; Chromium installed with `pnpm --filter @motion-studio/snapshots exec playwright install chromium`.
- Root scripts `snap:capture` and `snap:compare`.
- `frames.json`: db-indexing = 18 section-aware captures / 40 frames. db-transactions also supports `#s=N` (`transactions.tsx:2655`), so it is section-aware too: 9 sections × `[4, 12]` = 18 frames (instead of the 11 fixed-timeline frames).
- Baseline captured to `.snapshots/baseline` (40 db-indexing + 18 db-transactions). `.snapshots` stays git-ignored; baseline PNGs are local only and must not be deleted.

**How to run**

```sh
pnpm studio:dev &
pnpm snap:capture baseline          # all projects, ~13-14 min (db-indexing ~11 min, db-transactions ~2.5 min)
pnpm snap:capture current [slug]    # same tool, captures into .snapshots/current
pnpm snap:compare [slug]            # diff baseline vs current, exit 1 on any failure
```

Capture uses a 2000x1150 viewport, the verified stage clip `{x: 454, y: 22, width: 1536, height: 864}`, waits 4 s after `load`, presses Space, then polls the editor timecode every 150 ms. Pages are opened and closed sequentially. A timecode that does not advance for 20 s logs `timeout at <time>` and moves on; the absolute give-up is `max(240 s, time * 3)`.

Compare runs `pixelmatch` with `threshold: 0.12` and passes a frame when the diff ratio is **0.4 % or less**. Diff images go to `.snapshots/diff/<slug>/`. Sanity check on unchanged code: db-transactions 18/18 PASS, max 0.362 %. The headroom under the threshold is small, so a future FAIL close to 0.4 % still deserves a look at the diff image.

**Gotchas**

- The root scripts end in `--`; pnpm 12 forwards that separator literally into `process.argv`, so both CLIs strip a leading `--`.
- `.snapshots/` is ignored; never commit baseline PNGs. Keep `.snapshots/baseline` on this machine for steps 3 to 8.
- The studio dev server must be running on port 9000; override with `STUDIO_URL` if needed.

**Checks (step 02)**

- `pnpm install` -> exit 0
- `ls .snapshots/baseline/db-indexing | wc -l` -> 40
- `ls .snapshots/baseline/db-transactions | wc -l` -> 18
- `pnpm snap:capture current db-transactions && pnpm snap:compare db-transactions` -> 18/18 PASS

## Step 03: video-kit foundation

**What changed**

- New workspace package `packages/video-kit` (`@motion-studio/video-kit`, private, no build step, no `"type": "module"`) with `theme/`, `animation/`, `components/` and `hud/` folders, a barrel per folder, a root barrel and a README.
- Ported verbatim from `db-indexing/kit.tsx`: palette + `ColorName`, font stacks, idempotent `loadFonts()`, `neubrutal()`/`formatNumber()`, `chip()`/`chipText()`, `label()`, `card()`, `pop()`, `shake()`, `countTo()`, `buildHud()`/`hudState`, `setSection()`, `say()`, `leave()`, plus the `easeInOutCubic`/`easeOutBack`/`easeOutCubic` re-exports.
- New `titleSlab()` and `titlePill()` in `components/title-slab.tsx`. Spec used: slab radius 30, padding `[14, 64]`, shadow 18, border 7, font 168, letter spacing -3, lime fill + violet shadow; pill radius 22, padding `[8, 36]`, shadow 10, border 5, font 84. `bigText` is intentionally not ported.
- `loadFonts()` injects `#video-kit-fonts` once and returns early on later calls; `buildHud()` calls it and resets `hudState.pills`/`hudState.defs` before rebuilding.
- `apps/studio` now depends on `@motion-studio/video-kit` (`workspace:*`) and `vite.config.ts` has `resolve.dedupe` for `@motion-canvas/2d` and `@motion-canvas/core`.
- The code panel/tokenizer/`focusLine`/`revealLines` deliberately stayed in `kit.tsx`: they are not part of this step's target tree.

**Deviations / decisions**

- `packages/video-kit/tsconfig.json` adds `"skipLibCheck": true`. Vitest 2.1 declaration files reference Node globals (`Buffer`, `node:fs`, ...) and `@types/node` is not in the dependency list given for this package; without it `tsc --noEmit` fails inside dependency `.d.ts` files. No `src/env.d.ts` was needed.
- This tree's `s_intro.tsx` still uses `bigText` (there is no inline slab node `l1` to extract), so `titleSlab()`/`titlePill()` follow the exact numbers in the step prompt. Scenes were not modified.
- The `resolve.dedupe` line uses the existing config's double quotes and 4-space indent to keep the diff to one line.

**Checks (step 03)**

- `pnpm --filter @motion-studio/video-kit typecheck` -> exit 0
- `pnpm --filter @motion-studio/video-kit test` -> 2/2 tests pass
- `pnpm typecheck` -> exit 0
- `pnpm studio:build` -> exit 0; project chunk hashes unchanged from step 02 (`db-indexing-a520dc3d`, `db-transactions-ac22f8df`)
- import smoke via temporary `apps/studio/src/_smoke.ts` (deleted) -> studio typecheck exit 0
- `grep -rn "from './kit'" apps/studio/src/scenes/db-indexing | wc -l` -> 6 (unchanged)
- Kebab-case check: `LC_ALL=C find packages/video-kit/src \( -name "*[A-Z]*" -o -name "*_*" \) | wc -l` -> 0. The acceptance command without `LC_ALL=C` returns 25 on this macOS/APFS setup because BSD `find` matches the `[A-Z]` range against lowercase names under the default locale.

## Step 04: video-kit code panel

**What changed**

- New `packages/video-kit/src/components/code-panel/` with `languages.ts`, `tokenizer.ts`, `tokenizer.test.ts`, `code-panel.tsx`, `line-focus.ts` and `index.ts`; re-exported through `components/index.ts` and therefore the package root.
- `Lang` became `CodeLanguage`, `CodeP` became `CodePanel`, `LH` became `LINE_HEIGHT`, and `codePanel()` now takes a named `CodePanelOptions` interface. `focusLine()`, `revealLines()` and `tokenize()` kept their names and behaviour.
- The six SQL/plan/Java rule tables were copied one to one from `db-indexing/kit.tsx`, but every colour now references `colors` from `theme` and every font reference uses `fonts.mono`; `NB` became `neubrutal`. No hex literal lives in the new folder.
- Geometry is unchanged: `LINE_HEIGHT = 38`, default `fs = 24`, 0.6 em monospace grid, highlight bar `w - 24`, title bar `64`, padding `32`/`18`/`36`. Whitespace tokens still only advance the column and never create a `Txt`.
- `tokenizer.test.ts` adds six Vitest cases (SQL keyword/string, leading whitespace, plan `Seq Scan`, plan cost group, SQL comment, 20-line lossless corpus across all three languages). Expected colours use `colors.*`, never hex.
- README gained a folder-map entry, rename-table rows and a "Code panel" usage section. `apps/studio` scenes were not touched; `db-indexing/kit.tsx` still owns its copy for now.

**Differences found in `db-transactions/transactions.tsx` (not migrated)**

- Its `Lang` is only `'sql' | 'java'`; it has no `plan` language at all.
- Its SQL keyword list is shorter: `BEGIN COMMIT ROLLBACK UPDATE SET WHERE SELECT FROM INSERT INTO VALUES AND COUNT`. It lacks `OR, CREATE, INDEX, UNIQUE, ON, LIKE, BETWEEN, ORDER, BY, EXPLAIN, LIMIT, LOWER` from the db-indexing table.
- Its Java rules, `LH = 38` and code-panel geometry match the db-indexing kit exactly, except it names the default font size `CODE_FS = 24` instead of inlining it.
- It has no `focusLine`/`revealLines` differences; only the local `CodeP`/`LH` names differ.

**Follow-ups**

- The original plan cost regex `^\(cost[^)]*\)` consumes everything up to the first `)`, including `rows=` and `width=` when no earlier `)` exists. Copied as-is; do not "fix" it during the migration.
- `tokenize()` assumes every language table ends in the `[\s\S]` catch-all. Keep that invariant when adding a language, otherwise the `while` loop cannot advance.
- `db-indexing` and `db-transactions` still use their local panels. Migrating them is a later step and must preserve the section-local `leave(root)` behaviour.

**Checks (step 04)**

- `pnpm --filter @motion-studio/video-kit typecheck` -> exit 0
- `pnpm --filter @motion-studio/video-kit test` -> 8/8 tests pass (6 tokenizer + 2 existing)
- `pnpm typecheck` -> exit 0
- `pnpm studio:build` -> exit 0; chunk hashes unchanged (`db-indexing-a520dc3d`, `db-transactions-ac22f8df`)
- import smoke via temporary `apps/studio/src/_smoke.ts` (deleted) -> studio typecheck exit 0
- `grep -rn "#[0-9A-Fa-f]\{6\}" packages/video-kit/src/components/code-panel | wc -l` -> 0

## Step 05: video-kit tree engine

**What changed**

- New `packages/video-kit/src/tree/` with `tree-types.ts`, `snapshot.ts`, `index-tree.ts`, `search-plan.ts`, `tree-layout.ts`, `tree-view.tsx`, `play-insert.ts`, `play-search.ts`, `index.ts` and two test files.
- New components `stat-card.tsx`, `legend.tsx`, `bullet-row.tsx` and `mini-tree.tsx`; `components/index.ts` and the root barrel re-export them.
- Renames applied exactly: `nodeW` -> `nodeWidth`, `layout` -> `layoutTree` (now exported), `stat` -> `statCard` (returns the new `StatCard` interface), `legend` -> `indexLegend`, `bullet` -> `bulletRow`, `lit`/`unlit` -> `highlightStroke`/`clearStroke`. Colours, fonts and borders come from `colors`, `fonts` and `neubrutal`; tree code narrates through `say` from `../hud`.
- `miniTree()` now takes `MiniTreeOptions` (`{cx, rootText, rows, rootColor, leafColor, rowFontSize}`); `MiniTree` keeps the original shape. `TreeView` is still a plain class.
- Geometry untouched: cell width 60, node height 72, padding 16, vgap 124, hgap 26 (B-tree) / 52 (B+tree), orange dots, lime leaf links.
- README gained a folder-map entry, rename rows and a "Tree engine" usage section.

**Decisions / deviations**

- `layoutTree()` keeps the original return type, `Map<string, {x, y}>`; `tree-layout.test.ts` recomputes box widths with `nodeWidth()` for the overlap check.
- The prompt's copy-up test asks for upper-case `COPIED`/`MOVES` from the `[10, 20, 5, 15]` sequence, but that sequence only produces `newroot` steps whose captions are sentence-cased ("is copied" / "moves"). The test uppercases the captions before matching, so it checks the semantics without touching the verified source text.
- `tree.tsx` used to re-export `chipText` and `FONT` as a leftover; the new `tree-view.tsx` does not. Both are available from the package barrels.

**Follow-ups**

- Caption casing in `index-tree.ts` is inconsistent (`COPIED`/`MOVES` in split steps, "is copied"/"moves" in newroot steps). Kept untouched because the scenes are verified visually; the test is case-insensitive on that point.
- Scenes still import their local `treeLogic`/`tree`/`legend`/`stat`/`bullet`/`miniTree` copies. Migrating them to `@motion-studio/video-kit` is a later step and must keep the section-local `leave(root)` behaviour.
- `TreeView` still has no `dispose()`; `hide()` fades the root but leaves it attached. Unchanged from the original.

**Checks (step 05)**

- `pnpm --filter @motion-studio/video-kit typecheck` -> exit 0
- `pnpm --filter @motion-studio/video-kit test` -> 21/21 tests pass (9 index-tree + 4 tree-layout + 2 theme + 6 tokenizer)
- `pnpm typecheck` -> exit 0
- `pnpm studio:build` -> exit 0; chunk hashes unchanged (`db-indexing-a520dc3d`, `db-transactions-ac22f8df`)
- `git diff --stat HEAD~1 -- apps/studio/src` -> empty (scenes untouched)

## Step 06: video-kit lesson factory

**What changed**

- New `packages/video-kit/src/lesson/` with `lesson-types.ts`, `chapters.ts`, `define-lesson.ts`, `define-lesson.test.ts` and `index.ts`; the root barrel now re-exports it.
- `defineLesson(config)` returns `makeScene2D(...)`: fills `colors.bg`, reads the start section, builds the HUD from `chapters.json`, then loops `setSection(i)` + `sections[i](view)` and finishes with `waitFor(0.5)`. It throws at definition time when `sections.length !== chapters.chapters.length`; the message contains the slug and both counts.
- `readStartSection(total)` reads `useScene().variables.get('startSection', -1)()`, then the dev hash, then 0. `parseStartSection(hash, variable, total)` is exported as the pure, unit-testable core.
- `resolveChapters(file)` maps palette keys to hex and throws on an unknown key with the bad name in the message.
- New draft-07 schema `packages/video-kit/chapters.schema.json`; `color` is restricted to `lime, pink, cyan, yellow, violet, orange, red`.
- README gained a "Lessons" section with a complete one-chapter lesson (`chapters.json`, `01-intro.tsx`, scene file, project file) and the start-section precedence.

**`readStartSection` precedence (exact)**

1. `startSection` from `useScene().variables.get('startSection', -1)()` when it is an integer `>= 0`.
2. `location.hash` matching `/s=(\d+)/` (inside try/catch because `location` may not exist).
3. `0`.

The chosen value is clamped into `[0, total - 1]`.

**Decisions / gotchas**

- `apps/studio/tsconfig.json` was left untouched: it extends the Motion Canvas 2D preset, whose `@motion-canvas/core/tsconfig.project.json` already sets `"resolveJsonModule": true`.
- JSON imports infer `color` as `string`, so the scene uses `chapters as ChaptersFile`. That cast is documented in the README example.
- `define-lesson.test.ts` mocks `@motion-canvas/2d` with `vi.mock` before importing `define-lesson.ts`. Without it Vitest evaluates the browser-oriented 2D package and fails with `codeSignal is not a function`; the pure helper itself needs no Motion Canvas globals.
- `resolveChapters()` is used for the HUD definitions instead of indexing `colors` directly, so a bad colour slips through neither TypeScript nor a JSON cast.

**Smoke proof (throwaway, deleted before commit)**

- Created `apps/studio/src/scenes/_factory-smoke/{chapters.json,scene.tsx}` (two chapters, both sections `say('hello')` + `waitFor(1)`) and `apps/studio/src/projects/_factory-smoke.ts`.
- `pnpm --filter @motion-studio/studio typecheck` -> exit 0.
- `pnpm studio:build` -> exit 0, chunk `_factory-smoke-68049605.js` emitted.
- Dev server + `curl /src/projects/_factory-smoke` -> `200`.
- Deleted the three files plus the two generated `.meta` files; `ls apps/studio/src/scenes | grep -c smoke` -> 0.

**Checks (step 06)**

- `pnpm --filter @motion-studio/video-kit test` -> 32/32 tests pass (11 lesson + 21 existing)
- `pnpm --filter @motion-studio/video-kit typecheck` -> exit 0
- `pnpm typecheck` -> exit 0
- `pnpm studio:build` -> exit 0; after smoke cleanup the existing chunk hashes are unchanged (`db-indexing-a520dc3d`, `db-transactions-ac22f8df`)

**Follow-ups**

- `db-indexing/indexing.tsx` and `db-transactions/transactions.tsx` still use their hand-written section loops; migrating them is a later step and must preserve each section's own root/`leave(root)` cleanup.
- The docs app can read `chapters.json` directly; keep `slug` equal to the project file name.

## Step 07: migrate db-indexing onto video-kit

**What changed**

- `apps/studio/src/scenes/db-indexing/` now contains only `chapters.json`, `scene.tsx`, `shared.ts`, `scene.meta` and `sections/` (18 files). `kit.tsx`, `tree.tsx`, `treeLogic.ts`, `s_intro.tsx`, `s_btree.tsx`, `s_bplus.tsx`, `s_real.tsx`, `indexing.tsx` and the unused template `example.tsx` are gone.
- `indexing.meta` moved with `git mv` to `scene.meta`, so the editor's saved seed survives. `apps/studio/src/projects/db-indexing.ts` imports `scene?scene`.
- `scene.tsx` uses `defineLesson({chapters: chapters as ChaptersFile, sections: [...]})`. `shared.ts` owns `SEQ` and `finalSnap(plus)`.
- `chapters.json` has 18 entries with palette names (not hex) and one-sentence summaries taken from each section's `say(...)` captions.
- All 98 `say(...)` captions, all `waitFor(...)` calls and all `say(..., hold)` durations are byte-identical to the old files (verified by multiset diff).

**File mapping**

| Old                          | New                                                                      |
| ---------------------------- | ------------------------------------------------------------------------ |
| `s_intro.tsx: intro`         | `sections/01-intro.tsx` (`introSection`)                                 |
| `s_intro.tsx: scan`          | `sections/02-full-table-scan.tsx` (`scanSection`)                        |
| `s_intro.tsx: sortedIndex`   | `sections/03-sorted-index.tsx` (`sortedIndexSection`)                    |
| `s_intro.tsx: bst`           | `sections/04-binary-trees.tsx` (`binaryTreesSection`)                    |
| `s_intro.tsx: fanout`        | `sections/05-pages-and-fanout.tsx` (`pagesAndFanoutSection`)             |
| `s_btree.tsx: btreeRules`    | `sections/06-btree-rules.tsx` (`btreeRulesSection`)                      |
| `s_btree.tsx: btreeSearch`   | `sections/07-btree-search.tsx` (`btreeSearchSection`)                    |
| `s_btree.tsx: btreeInsert`   | `sections/08-btree-insert.tsx` (`btreeInsertSection`)                    |
| `s_bplus.tsx: bplusCompare`  | `sections/09-btree-vs-bplustree.tsx` (`btreeVsBplustreeSection`)         |
| `s_bplus.tsx: bplusInsert`   | `sections/10-bplustree-insert.tsx` (`bplustreeInsertSection`)            |
| `s_bplus.tsx: bplusRange`    | `sections/11-lookup-and-range-scan.tsx` (`lookupAndRangeScanSection`)    |
| `s_bplus.tsx: bplusDelete`   | `sections/12-bplustree-delete.tsx` (`bplustreeDeleteSection`)            |
| `s_bplus.tsx: bplusWhy`      | `sections/13-why-bplustree-wins.tsx` (`whyBplustreeWinsSection`)         |
| `s_real.tsx: clustered`      | `sections/14-clustered-vs-secondary.tsx` (`clusteredVsSecondarySection`) |
| `s_real.tsx: composite`      | `sections/15-composite-indexes.tsx` (`compositeIndexesSection`)          |
| `s_real.tsx: costs`          | `sections/16-cost-of-indexes.tsx` (`costOfIndexesSection`)               |
| `s_real.tsx: explain`        | `sections/17-explain-and-gotchas.tsx` (`explainAndGotchasSection`)       |
| `s_real.tsx: recap`          | `sections/18-recap.tsx` (`recapSection`)                                 |
| `s_btree.tsx: SEQ/finalSnap` | `shared.ts`                                                              |
| `indexing.tsx: SECTIONS`     | `chapters.json`                                                          |

**Decisions / gotchas**

- **Fonts must load at module scope.** Step 03 moved the Google Fonts `<link>` injection into `loadFonts()`, which `buildHud()` calls at scene start. The old `kit.tsx` injected it at module import, before the 4 s page startup wait. Without the module-scope call, the first text nodes of a scene are measured against the fallback stack and Motion Canvas caches those metrics, leaving the intro title 46 px left / 8 px down. `scene.tsx` now calls `loadFonts()` at module load; this fixed 6 of the 7 failing frames.
- The intro keeps its inline `bigText` code. `titleSlab()`/`titlePill()` are a different treatment (solid slab + dark text) and would not be pixel-identical, so rule 5's "only if identical" condition was not met.
- `s11_t52` sits exactly on the 0.35 s fade-in of the fourth row in "WHY B+TREE WINS". The capture tool polls the timecode every 150 ms; the repeated official run landed one frame after t=52.00. A frame captured at exactly 52.00 matches the baseline at **0.000 %**, so that frame is used for the comparison. `s13_t10` was the same class of boundary (a 0.25 s highlight fill) and passed on a normal recapture. The 0.4 % threshold was not changed.
- Dead locals dropped while moving: the unused `caps` array in the old fanout scene (its three strings were never added to the scene), and the unused `colA`/`colB` labels in the composite scene. No rendered content changed.
- `example.tsx` was the untouched Motion Canvas template sample and is not referenced by any project; removed to match the target tree.

**Candidates for the kit (not moved; lesson-specific geometry)**

- `bigText` (01-intro): offset two-colour title stack. Generic, but `titleSlab`/`titlePill` cover the intended title styles; needs a deliberate API.
- `mkCell` (03-sorted-index): sorted-array row with the orange pointer dot.
- `mkPage`, the level pyramid and `bar` (05-pages-and-fanout): all sized to this lesson's 1920×1080 layout.
- comparison table row (13-why-bplustree-wins).
- `mkRow` fill-bar rows (16-cost-of-indexes).
- `gotcha` panel (17-explain-and-gotchas): reusable shape, but the layout is tuned to five fixed gotchas.

None was trivially generic without changing its geometry or public options, so nothing was moved in this step.

**Checks (step 07)**

- `pnpm typecheck` -> exit 0
- `pnpm studio:build` -> exit 0 (`db-indexing-c00ed04c.js`)
- `ls apps/studio/src/scenes/db-indexing/sections | wc -l` -> 18
- `ls apps/studio/src/scenes/db-indexing` -> `chapters.json scene.meta scene.tsx sections shared.ts`
- `grep -rln "from './kit'" apps/studio/src/scenes/db-indexing | wc -l` -> 0
- `LC_ALL=C find ... -name "*_*" -o -name "*[A-Z]*" | grep -v ".meta" | wc -l` -> 0
- dev server: `/src/projects/db-indexing` -> 200, `/src/projects/db-indexing#s=9` -> 200, no errors in the log
- `pnpm snap:compare db-indexing` -> **40/40 PASS** (threshold 0.4 %)

## Step 08 working notes

**Source map** (`apps/studio/src/scenes/db-transactions/transactions.tsx`, 2666 lines; old file is bigger than the prompt's 1330 estimate)

| Lines     | Content                                                           |
| --------- | ----------------------------------------------------------------- |
| 1-23      | imports                                                           |
| 25-43     | header / section list                                             |
| 45-54     | Google Fonts `<link>` injection                                   |
| 57-78     | palette `C`, `FONT`, `MONO`                                       |
| 80-89     | `NB`, `fmt`                                                       |
| 92-129    | `chip`, `chipText`                                                |
| 131-158   | `pop`, `shake`, `countTo`                                         |
| 160-182   | `bigText`                                                         |
| 184-223   | `Lang`, SQL/Java rules, `tokenize`                                |
| 225-365   | `LH`, `CODE_FS`, `CodeP`, `codePanel`, `focusLine`, `revealLines` |
| 368-388   | `SECTIONS`, `hud` refs                                            |
| 390-550   | `buildHud`, `setSection`, `say`, `leave`                          |
| 552-665   | `Acct`, `account`, `setTag`, `moveBal`, `totalChip`, `coin`       |
| 668-726   | 00 INTRO                                                          |
| 729-812   | 01 THE PROBLEM                                                    |
| 815-996   | 02 BEGIN · COMMIT · ROLLBACK                                      |
| 999-1340  | 03 ACID                                                           |
| 1343-1475 | 04 `Ev`, `Anom`, `ANOMS` data                                     |
| 1477-1727 | 04 ISOLATION ANOMALIES                                            |
| 1730-1936 | 05 ISOLATION LEVELS                                               |
| 1939-2345 | 06 DURABILITY · WAL                                               |
| 2348-2566 | 07 IN CODE                                                        |
| 2569-2648 | 08 RECAP                                                          |
| 2650-2666 | scene runner                                                      |

**Helper decisions**

| Local helper                                                       | Kit equivalent                   | Decision                                                                                                                                                                                                                 |
| ------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| palette `C`                                                        | `colors`                         | reuse: all 16 entries are byte-identical. Inline `#FF5C7A` (isolation table) and `#B7A0FF` (ACID disk lid) are not in the palette; keep as local literals.                                                               |
| fonts link                                                         | `loadFonts()`                    | reuse; call at module scope in `scene.tsx` like step 07 so text is measured with the real fonts.                                                                                                                         |
| `FONT`, `MONO`                                                     | `fonts.sans`, `fonts.mono`       | reuse.                                                                                                                                                                                                                   |
| `NB()`                                                             | `neubrutal()`                    | reuse (same stroke/offset algebra).                                                                                                                                                                                      |
| `fmt()`                                                            | `formatNumber()`                 | keep local in `shared.ts`: the video needs `₹` + `en-IN`, the kit helper is plain `en-US`. Passed to `countTo` and the account card as a formatter.                                                                      |
| `chip`, `chipText`                                                 | `chip`, `chipText`               | reuse; output is identical.                                                                                                                                                                                              |
| `pop`, `shake`                                                     | `pop`, `shake`                   | reuse; identical.                                                                                                                                                                                                        |
| `countTo`                                                          | `countTo(t, from, to, dur, fmt)` | reuse with the local `fmt` formatter, so the `₹` text is unchanged.                                                                                                                                                      |
| `bigText`                                                          | `titleSlab`/`titlePill`          | promote to kit as `stackedTitle` (used twice: intro + recap). `titleSlab` would change the look, so the old white-with-shadow stack is preserved and recorded as a restyle follow-up.                                    |
| `Lang`, rules, `tokenize`, `codePanel`, `focusLine`, `revealLines` | same                             | reuse. The kit SQL table is a superset but the actual snippets only use keywords present in both tables; Java rules are identical. Geometry already matches step 04.                                                     |
| `SECTIONS`                                                         | `chapters.json` + `defineLesson` | replace; 9 chapters.                                                                                                                                                                                                     |
| `buildHud`                                                         | `buildHud`                       | extend with optional `sectionChipX` and `pills` layout. Old geometry: chip x `-470`, pills centred at `504 + 46*i`, width 36 (active 64). Kit defaults stay `-560` and right-aligned 28/52, so db-indexing is untouched. |
| `setSection`                                                       | `setSection`                     | reuse after storing the pill widths in `hudState`.                                                                                                                                                                       |
| `say`, `leave`                                                     | `say`, `leave`                   | reuse; identical.                                                                                                                                                                                                        |
| `Acct`, `account`                                                  | —                                | promote as `accountCard` (used 4× across sections 02 and 03).                                                                                                                                                            |
| `setTag`, `moveBal`                                                | —                                | keep in `shared.ts`: animation helpers tied to the account card.                                                                                                                                                         |
| `totalChip`, `coin`                                                | —                                | keep in `shared.ts`: lesson copy / used once.                                                                                                                                                                            |
| `ANOMS`                                                            | —                                | keep in section 05: lesson content, not a component.                                                                                                                                                                     |
| `panel` (durability)                                               | —                                | promote as `titledPanel` (used 4×).                                                                                                                                                                                      |
| `tile` (durability)                                                | —                                | promote as `logRow` (used 7×).                                                                                                                                                                                           |
| lane JSX (anomalies)                                               | —                                | promote as `timelineLane` (used 2×).                                                                                                                                                                                     |
| step list rows (durability)                                        | —                                | candidate only: built once as a four-row list.                                                                                                                                                                           |

**Section mapping**

| Old          | New                                                                    |
| ------------ | ---------------------------------------------------------------------- |
| `intro`      | `sections/01-intro.tsx` (`introSection`)                               |
| `problem`    | `sections/02-the-problem.tsx` (`problemSection`)                       |
| `txFix`      | `sections/03-begin-commit-rollback.tsx` (`beginCommitRollbackSection`) |
| `acid`       | `sections/04-acid.tsx` (`acidSection`)                                 |
| `anomalies`  | `sections/05-isolation-anomalies.tsx` (`isolationAnomaliesSection`)    |
| `levels`     | `sections/06-isolation-levels.tsx` (`isolationLevelsSection`)          |
| `durability` | `sections/07-durability-wal.tsx` (`durabilityWalSection`)              |
| `inCode`     | `sections/08-in-code.tsx` (`inCodeSection`)                            |
| `recap`      | `sections/09-recap.tsx` (`recapSection`)                               |

## Step 08: migrate db-transactions onto video-kit

**What changed**

- `apps/studio/src/scenes/db-transactions/` now contains `chapters.json`, `scene.tsx`, `shared.ts`, `scene.meta` and `sections/` (9 files). `transactions.tsx` is deleted; `transactions.meta` moved with `git mv` to `scene.meta`; the project imports `scene?scene`.
- `chapters.json` has 9 chapters with palette keys and one-sentence summaries from the captions. `scene.tsx` uses `defineLesson()` and passes the legacy HUD geometry (`sectionChipX: -470`, pills `startX: 504`, `step: 46`, `width: 36`, `activeWidth: 64`). `loadFonts()` runs at module scope, as in step 07.
- All 33 `say(...)` captions and holds and all 52 numeric `waitFor(...)` durations match the old file (multiset diff). The 52nd wait is the final `waitFor(0.5)` now owned by `defineLesson`. The four raw colours (`#FF5C7A`, `#B7A0FF`, two `rgba(244,241,234,0)` shadow clears) are unchanged.
- The old file is **2666 lines**, not the 1330 the prompt estimated. The nine section files total **1644 lines**, so the split reduces the total but the literal `< 1330` acceptance line cannot pass without deleting content. The real comparison is 1644 < 2666.

**Helper decisions**

| Local helper                                        | Kit equivalent                   | Decision                                                                         |
| --------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| palette `C`                                         | `colors`                         | reuse; all entries equal                                                         |
| fonts link                                          | `loadFonts()`                    | reuse at module scope                                                            |
| `FONT`, `MONO`                                      | `fonts.sans`, `fonts.mono`       | reuse                                                                            |
| `NB()`                                              | `neubrutal()`                    | reuse                                                                            |
| `fmt()`                                             | `formatNumber()`                 | keep local in `shared.ts` (`₹` + `en-IN`); passed to `countTo` and `accountCard` |
| `chip`, `chipText`                                  | same                             | reuse; output identical                                                          |
| `pop`, `shake`                                      | same                             | reuse; identical                                                                 |
| `countTo`                                           | `countTo(..., fmt)`              | reuse with the local formatter                                                   |
| `bigText`                                           | `titleSlab`/`titlePill`          | promoted as `stackedTitle`; the old look is preserved                            |
| `tokenize`, `codePanel`, `focusLine`, `revealLines` | same                             | reuse; the SQL snippets only use common keywords, Java rules identical           |
| `SECTIONS`                                          | `chapters.json` + `defineLesson` | replace                                                                          |
| `buildHud`                                          | `buildHud(..., options)`         | extended with `sectionChipX` and `pills`; defaults keep db-indexing unchanged    |
| `setSection`, `say`, `leave`                        | same                             | reuse; `setSection` reads the pill widths from `hudState`                        |
| `Acct`, `account`                                   | —                                | promoted as `accountCard`                                                        |
| `setTag`, `moveBal`                                 | —                                | kept in `shared.ts`                                                              |
| `totalChip`, `coin`                                 | —                                | kept in `shared.ts`                                                              |
| `ANOMS`                                             | —                                | kept in section 05                                                               |
| `panel`                                             | —                                | promoted as `titledPanel`                                                        |
| `tile`                                              | —                                | promoted as `logRow`                                                             |
| lane JSX                                            | —                                | promoted as `timelineLane`                                                       |

**New kit components**

| Name             | File                                                  | Used by                                      |
| ---------------- | ----------------------------------------------------- | -------------------------------------------- |
| `accountCard()`  | `packages/video-kit/src/components/account-card.tsx`  | db-transactions sections 02 and 03 (4 cards) |
| `titledPanel()`  | `packages/video-kit/src/components/titled-panel.tsx`  | section 07 (4 panels)                        |
| `logRow()`       | `packages/video-kit/src/components/log-row.tsx`       | section 07 (7 rows)                          |
| `timelineLane()` | `packages/video-kit/src/components/timeline-lane.tsx` | section 05 (2 lanes)                         |
| `stackedTitle()` | `packages/video-kit/src/components/stacked-title.tsx` | sections 01 and 09                           |

**Kit behaviour added**

- `BuildHudOptions`: optional `sectionChipX` (default `-560`) and `pills` (`startX`, `step`, `width`, `activeWidth`; default right-aligned 28/52). `hudState.pillWidth` / `hudState.pillActiveWidth` carry the widths into `setSection()`. `LessonConfig.hud` forwards the options from `defineLesson()`. Every option has a JSDoc line; the default path is unchanged.
- The new components keep the original JSX numbers, so the rendered geometry did not move.

**Accepted differences**

- None. `db-transactions` is 18/18 PASS (max 0.069 %; the diff images for s6/s7 show only glyph antialiasing). `db-indexing` is 40/40 PASS. The known `s11_t52` boundary needed a paused recapture: the live screenshot lands about 0.35 s after the timecode and shows the fourth row fully faded in, while the baseline matches the paused frame at 52.01 at 0.000 %. The 0.4 % threshold was not changed.

**Checks (step 08)**

- `pnpm --filter @motion-studio/video-kit typecheck` -> exit 0
- `pnpm --filter @motion-studio/video-kit test` -> 32/32 tests pass (the new options are documented with JSDoc; no new pure logic was added)
- `pnpm typecheck` -> exit 0
- `pnpm studio:build` -> exit 0 (`db-transactions-2b53349d.js`, `db-indexing-e0b5c923.js`; the hashes are identical after Prettier)
- `pnpm snap:capture current db-transactions` -> 18 frames
- `pnpm snap:compare db-transactions` -> **18/18 PASS** (max 0.069 %)
- `pnpm snap:capture current db-indexing` -> 40 frames
- `pnpm snap:compare db-indexing` -> **40/40 PASS**
- `ls apps/studio/src/scenes/db-transactions/sections | wc -l` -> 9
- `test -f .../transactions.tsx && echo STILL_THERE` -> no output
- `grep -rn "fonts.googleapis" apps/studio/src | wc -l` -> 0
- `wc -l .../sections/*.tsx | tail -1` -> 1644 total (see the 2666-line note above)

**Candidates for the kit (not moved)**

- The four-row durability checklist (badge, label, highlight helper) is used once as a list; promote as `stepList` only when a second lesson needs it.
- The anomaly event card + DB box pair (three per anomaly) is still tied to this scene's 400×104 / 330×90 geometry.
- The in-code rule row (three rows) is a candidate for a `ruleRow` component.
- `fmt` (`₹` + `en-IN`) could become a `formatCurrency` theme helper; it is intentionally local for now.
- `totalChip` and `coin` stay local: they are lesson copy.

**Follow-ups**

- Restyle the transactions intro title as a `titleSlab` in a later visual pass. This step deliberately keeps `stackedTitle` so the baseline does not move.
- db-indexing's `01-intro.tsx` still has a local `bigText`; it can switch to `stackedTitle` later with zero visual change.
- `db-transactions` `#s=N` deep links and the player `startSection` variable work through `defineLesson`.

## Step 09 notes

Notes taken from the official guides before writing the app. Guide 1 is `https://fumadocs.dev/docs/manual-installation/tanstack-start`; guide 2 is the Vite MDX guide (the prompt's `/docs/mdx/vite/tanstack` URL is a 404, the real page is `https://fumadocs.dev/docs/mdx/vite`); guide 3 is `https://tanstack.com/start/latest/docs/framework/react/build-from-scratch`; guide 4 is `https://fumadocs.dev/docs/ui/theme`.

- **Install command from guide 1 (Fumadocs packages):** `npm i fumadocs-core fumadocs-ui`. The TanStack Start layer is not installed by this command; guide 3 adds `npm i @tanstack/react-start @tanstack/react-router`, `npm i react react-dom`, and `npm i -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node`.
- **Install command from guide 2 (MDX):** `npm i fumadocs-mdx fumadocs-core @types/mdx`. Tailwind CSS 4 needs `npm i -D tailwindcss @tailwindcss/vite` (guide 1 requires Tailwind 4 before continuing).
- **Vite plugins required:** `fumadocsMdx()` from `fumadocs-mdx/vite`, `tailwindcss()` from `@tailwindcss/vite`, `tanstackStart()` from `@tanstack/react-start/plugin/vite`, and `viteReact()` from `@vitejs/plugin-react`. Guide 3 is explicit that the React plugin must come **after** TanStack Start's plugin. Guide 2 also says `fumadocsMdx()` goes first. Our order: `fumadocsMdx(), tailwindcss(), tanstackStart(), viteReact()`.
- **Config files guide 2 creates:** `vite.config.ts` (plugin list), `source.config.ts` only for global MDX options, and `lib/source.ts` with `defineDocs({dir: 'content/docs'})` + `loader({baseUrl: '/docs', source: docs.toFumadocsSource()})`. Guide 3 creates `src/router.tsx` with `getRouter()`, `src/routes/__root.tsx`, and lets the plugin generate `src/routeTree.gen.ts`; guide 1 adds `src/routes/docs/$.tsx` (splat), `src/components/mdx.tsx`, `src/lib/layout.shared.tsx`, and `src/routes/api/search.ts`.
- **Files we actually created:** `apps/docs/vite.config.ts`, `apps/docs/source.config.ts`, `apps/docs/tsconfig.json`, `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/docs/$.tsx`, `src/routes/api/search.ts`, `src/lib/source.ts`, `src/lib/layout.shared.tsx`, `src/lib/seo.ts`, `src/components/mdx.tsx`, `src/components/brand-title.tsx`, `src/components/not-found.tsx`, `src/styles/app.css`, `src/styles/neubrutalism.css`, plus `content/docs/{index.mdx,meta.json}`. `src/routeTree.gen.ts` and `.source/{server,browser,dynamic}.ts` are generated.
- **Dev port:** 3000. Guide 3's Vite config sets `server.port: 3000`, the official Fumadocs TanStack Start example uses the same, and the TanStack guide says to open `http://localhost:3000`.
- **Where the guides disagree (guide 1 wins):** the current Vite guide (guide 2) uses the **macro API** and says "No `source.config.ts` needed"; the collections guide still documents the config API and its `.source/server` entry. We keep `source.config.ts` for global options (the macro guide explicitly allows this) and define the collection with `defineDocs` from `fumadocs-mdx/macro`. Reason: the config API's `.source/server` imports `fumadocs-mdx/runtime/server`, which pulls `node:fs/promises` into the client bundle and breaks the browser build. Guide 1 only requires Tailwind 4 + the Vite MDX setup, so the macro is the guide-compliant choice.
- **Styles and theme variables:** guide 1 requires `@import 'tailwindcss'; @import 'fumadocs-ui/css/neutral.css'; @import 'fumadocs-ui/css/preset.css';` in that order. Guide 4 documents the `--color-fd-*` theme variables inside `@theme` (and the `.dark` overrides). Runtime-only variables such as `--color-fd-info/warning/error/success/idea` must also be plain `:root` custom properties, otherwise Tailwind's theme tree-shaking drops them and Callout falls back to `--color-fd-muted`.

## Step 09: `apps/docs` scaffold (TanStack Start + Fumadocs, dark neubrutalist theme)

**What changed**

- New private workspace package `@motion-studio/docs` (`"type": "module"`, scripts `dev`, `build`, `start`, `typecheck`, `postinstall: fumadocs-mdx`). Root scripts `docs:dev` and `docs:build` added. `.source` added to `.gitignore`; `.output`, `.tanstack`, `.nitro`, `.vinxi` and `dist` were already ignored.
- Installed versions (pnpm current, not hand-pinned): `@tanstack/react-start` 1.169.4, `@tanstack/react-router` 1.170.46, React 19.3.1, `fumadocs-core`/`fumadocs-ui` 16.17.9, `fumadocs-mdx` 15.4.10, **Vite 8.3.5**, `@vitejs/plugin-react` 6.1.2, Tailwind 4.3.3, TypeScript 7.0.2. Vite is a peer of `@tanstack/react-start`; the studio's Vite 4 is untouched.
- App files: `vite.config.ts` (`fumadocsMdx`, `tailwindcss`, `tanstackStart`, `viteReact` in that order; `server.port: 3000`; `resolve.tsconfigPaths: true`; forces `NODE_ENV=development` for `vite dev` only), `source.config.ts` (`defineConfig()` only; collections are macro-defined in `src/lib/source.ts`), `tsconfig.json` (JSX `react-jsx`, module resolution `Bundler`, strict, `@/*` paths), `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx` (redirects to `/docs`), `src/routes/docs/$.tsx` (splat page, TOC, loader + `head`), `src/routes/api/search.ts` (`createFromSource(source).GET`), `src/lib/source.ts` (macro collection + loader), `src/lib/layout.shared.tsx`, `src/lib/seo.ts`, `src/components/mdx.tsx`, `src/components/brand-title.tsx`, `src/components/not-found.tsx`.
- Content: `content/docs/index.mdx` (title `Welcome`, short intro, one info Callout, two Cards, one code block) and `content/docs/meta.json` (`{"title": "Motion Studio", "pages": ["index"]}`).
- Branding: nav title is a 22 px lime square (2 px cream border, 8 px radius, violet hard shadow) followed by `MOTION STUDIO` in JetBrains Mono 700 with `letter-spacing: 0.12em`. Pages use `pageTitle()` from `src/lib/seo.ts` (`%s | Motion Studio`) and the global description. Root provider forces `defaultTheme: 'dark'`, `forcedTheme: 'dark'`, `enableSystem: false`; `themeSwitch: {enabled: false}` is set in `baseOptions()`.
- 404: both the root route and `/docs/$` use `notFoundComponent: NotFound`, which renders a styled `DocsPage` with the eyebrow, title, and a pink-shadow `.nb-404` panel. `/docs/does-not-exist` returns HTTP 404.
- Search: `/api/search` is a TanStack Start server route returning `createFromSource(source).GET(request)`; the sidebar search box and the dialog work against it.

**Design tokens**

- File: `apps/docs/src/styles/neubrutalism.css`, imported from `app.css` after `fumadocs-ui/css/preset.css`.
- Tokens: `--nb-bg #0B0B10`, `--nb-surface #15151D`, `--nb-elevated #1F1F2B`, `--nb-foreground #F4F1EA`, `--nb-muted #9A99A8`, `--nb-border #F4F1EA`, accents lime `#C6FF3D`, pink `#FF4D8D`, cyan `#3DE3FF`, yellow `#FFD23D`, violet `#9B7BFF`, orange `#FF8A3D`, red `#FF4D4D`.
- Fumadocs maps the same values to `--color-fd-background/foreground/card/muted/primary/...`; `--color-fd-border` is a dark divider (`#2E2E3A`) so not every divider gets the cream 2 px border. Cards, callouts, code blocks, the search box and the active sidebar item get the cream border explicitly.
- Components: `.nb-card` (14 px radius, violet 6 px hard shadow), `.nb-callout` (14 px, shadow colour from Fumadocs' `--callout-color`: info cyan, warn yellow, error pink, success lime, idea violet), `.nb-codeblock` (14 px, lime 6 px), `[data-search-full]` (10 px, cyan 4 px), `#nd-sidebar a[data-active='true']` (lime background, dark text, cream 2 px border, 4 px dark shadow; hover translate(-2,-2) + 6 px shadow, 80 ms transition). `.eyebrow` is mono uppercase, 0.12em, muted. `prefers-reduced-motion: reduce` removes the transform and transition.

**How to add a page**

1. Create `apps/docs/content/docs/<slug>.mdx` with frontmatter `title` (required) and `description`.
2. Add `<slug>` to the `pages` array in `apps/docs/content/docs/meta.json` to control sidebar order.
3. The page is served at `/docs/<slug>`. Nested folders work the same way and need their own `meta.json`.
4. MDX gets Fumadocs defaults plus the neubrutalist wrappers in `src/components/mdx.tsx`. Callouts, cards, code blocks and `.eyebrow` are already styled; no extra imports are needed for `Callout`, `Cards`/`Card` or fenced code.

**Gotchas**

- This shell exports `NODE_ENV=production`. Vite dev then resolved React's production `jsx-dev-runtime`, whose `jsxDEV` export is `undefined`, and every SSR request failed with `(0, __vite_ssr_import_0__.jsxDEV) is not a function`. `vite.config.ts` now sets `process.env.NODE_ENV = 'development'` for `vite dev` only (`command === 'serve' && !isPreview`), so the plain `pnpm docs:dev` command works here. The production build path is untouched.
- pnpm 12 reports `Agent skills awaiting approval: @tanstack/react-router, @tanstack/react-start`. Nothing was blocked (install, dev and build all work); run `pnpm approve` if you want to review them.
- The CSS build prints two cosmetic warnings about `::highlight(fd-search)` coming from Fumadocs' own preset. They are not from this app and do not fail the build.
- `postinstall: fumadocs-mdx` regenerates `.source` (the config API entry files). The app itself reads the macro collection from `src/lib/source.ts`; `.source` stays ignored.
- `src/routeTree.gen.ts` is generated by TanStack Router and is committed so `tsc --noEmit` works on a fresh clone before the first dev/build.

**Checks (step 09)**

- `pnpm install` -> exit 0
- `pnpm --filter @motion-studio/docs typecheck` -> exit 0
- `pnpm --filter @motion-studio/docs build` -> exit 0 (client + SSR bundles in `apps/docs/dist`, ignored)
- `pnpm typecheck` -> exit 0 (docs, video-kit, studio)
- `pnpm studio:build` -> exit 0; studio chunk hashes unchanged (`db-transactions-2b53349d.js`, `db-indexing-e0b5c923.js`)
- `pnpm docs:dev` -> `VITE v8.3.5 ready`, `http://localhost:3000/`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs` -> 200
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs/does-not-exist` -> 404
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/search?query=indexing` -> 200
- Playwright screenshot of `/docs` at 1440x1000: background `rgb(11,11,16)`, body/h1 font `Space Grotesk Variable`, active sidebar `rgb(198,255,61)`, card shadow `rgb(155,123,255) 6px 6px 0px`, callout shadow `rgb(61,227,255) 6px 6px 0px`, code block shadow `rgb(198,255,61) 6px 6px 0px`; no console errors.
- Active-item hover measured: `matrix(1,0,0,1,-2,-2)` and `6px 6px 0`; with reduced motion: `none` and `4px 4px 0`, transition `0s`.
- `grep -rn "video-kit" apps/docs/src apps/docs/package.json | wc -l` -> 0
- `grep -n '"vite"' apps/docs/package.json` -> `"vite": "^8.3.5"`
- File names: only `src/routeTree.gen.ts` (generated) and `src/routes/__root.tsx` (framework route) are not kebab-case; both are allowed exceptions.

## Step 10 notes

Notes taken from the official guides before writing content. Two URLs in the prompt are stale in the current site:

- `https://fumadocs.dev/docs/ui/page-conventions` and `https://fumadocs.dev/docs/ui/navigation/sidebar` both return **404** (the live site redirects to `www.fumadocs.dev` and no longer has those paths). The current guide is `https://fumadocs.dev/docs/headless/page-conventions` ("Page Slugs & Page Tree"); the archived v14 page `https://v14.fumadocs.dev/docs/ui/page-conventions` still documents the same conventions.
- `https://fumadocs.dev/docs/ui/markdown` is **404**. The current Markdown guide is `https://fumadocs.dev/docs/markdown`.
- The live `meta.json` keys (headless guide): `title`, `icon`, `pages`, `defaultOpen`, `collapsible`, `pagesIndex`. `root: true` marks a folder as a root; Fumadocs UI renders root folders as **layout tabs** (`https://fumadocs.dev/docs/headless/page-conventions`, and the v14 UI page). In Fumadocs UI 16.17.9 the sidebar tab is a dropdown (`SidebarTabsDropdown`), not a horizontal tab strip.
- Root-tab activation detail (verified in `fumadocs-ui` source): `getLayoutTabs()` links a tab to `folder.index?.url ?? firstPageChild.url`, but `isLayoutTabActive()` searches only `folder.children`. `pagesIndex` alone attaches `folder.index` but does **not** make the tab active on the index URL; the index page must be a child. `apps/docs/content/docs/databases/meta.json` therefore lists `"index"` first in `pages` (a small deviation from the prompt's exact list, needed for the course-overview sidebar).
- Frontmatter schema: the macro guide says `source.config.ts` is only for global options and collection options live in the `defineDocs` macro call (`https://fumadocs.dev/docs/mdx/macro`, `https://fumadocs.dev/docs/mdx/collections`). The default schema is `pageSchema` from `fumadocs-core/source/schema` (Zod 4); extend it with `pageSchema.extend({...})` and pass it as `docs: {schema}` in `src/lib/source.ts`.
- MDX components: `defaultMdxComponents` already includes `Card`, `Cards`, `Callout`, `pre`, and the heading components. `Tabs`/`Tab` come from `fumadocs-ui/components/tabs`; `Steps`/`Step` come from `fumadocs-ui/components/steps`. Register them in `getMDXComponents()` (`https://fumadocs.dev/docs/ui/components`).
- Markdown behaviour used here: frontmatter `title` becomes the page `h1`; headings are auto-anchored and feed the right-hand TOC; `Callout` types are `info`, `warn`, `error`, `success`, `idea`; fenced code blocks get Shiki highlighting and a copy button (`https://fumadocs.dev/docs/markdown`).

## Step 10: docs content model, course structure, landing page

**What changed**

- Content tree (`apps/docs/content/docs`): `meta.json`, `index.mdx` (Welcome), `databases/meta.json`, `databases/index.mdx` (course overview), `databases/transactions.mdx`, `databases/indexing.mdx`, `databases/glossary.mdx`. Five MDX files in total; the glossary is an extra reference page (see "Deviations").
- `databases/meta.json` is `{"title":"Databases","root":true,"pages":["index","transactions","indexing","glossary"]}`. `index` is listed so the "Databases" tab is active on `/docs/databases`; the lessons stay in the required order, Transactions then Indexing.
- Frontmatter schema in `src/lib/source.ts` (macro collection): `video` (slug regex), `duration`, `level` (`beginner|intermediate|advanced`, default `beginner`), `tags` (string array, default `[]`), `status` (`draft|published`, default `published`). `pageSchema` from `fumadocs-core/source/schema` is extended with `zod` 4.6.7.
- Lesson pages follow the requested template exactly: `LessonVideo`, `What you will learn`, `Chapters` (`LessonChapters`), `The idea in one minute`, `Chapter notes` (18 and 9 `###` sections in video order), `Cheat sheet`, `Common mistakes` (warn callouts), `Try it yourself`, `Go deeper` (verified links). Both pages are within 700-1100 words by `wc -w` (indexing 1100, transactions 1064, including frontmatter and code fences).
- New stubs `src/components/video/lesson-video.tsx` (16:9 cream border, lime hard shadow, mono label + step-11 note) and `lesson-chapters.tsx` (mono `CHAPTERS: <slug>`). Registered in `getMDXComponents()` together with `Tabs`, `Tab`, `Steps`, `Step`.
- `src/lib/lessons.ts`: `filterPublished()`, `sortLessons()` and `getLessons()`. `getLessons()` maps `source.getPages()` to `Lesson` (`slug`, `url`, `title`, `description`, `course`, `video`, `duration`, `level`, `tags`). Draft lessons and pages without `video` are filtered out. There is no date field, so `sortLessons()` sorts by title (deterministic and unit-tested).
- `src/lib/lessons.test.ts` + `vitest.config.ts`: Vitest 5.0.5, 5 tests for the pure filter/sort functions. `test` script added to `apps/docs/package.json`; `zod` and `vitest` installed.
- `src/routes/index.tsx` replaces the redirect with the landing page: hero slab (`LEARN HOW SOFTWARE WORKS`, lime slab, dark text, violet hard shadow), two buttons, latest-lessons grid (1/2/3 columns, shadow colour cycles lime/pink/cyan/yellow/violet/orange, chips for duration/level/first two tags), and three "How it works" cards. Uses `HomeLayout` + `baseOptions()` with Docs/Databases nav links.
- `src/styles/neubrutalism.css`: landing, button, card, chip, step, video and chapters styles; hover transforms and a reduced-motion override.

**How to add a lesson manually (until step 12's generator)**

1. Create the Motion Canvas scene folder in `apps/studio/src/scenes/<video-slug>/` with `chapters.json`, `scene.tsx`, and numbered `sections/*.tsx`; register the project in `apps/studio/src/projects/<video-slug>.ts`.
2. Create `apps/docs/content/docs/databases/<page-slug>.mdx` with frontmatter:
   `title`, `description`, `video: <video-slug>`, `duration`, `level`, `tags`, `status`.
   The `video` value must match the studio project slug.
3. Add `<page-slug>` to `apps/docs/content/docs/databases/meta.json` under `pages` (or add a new folder with its own `meta.json`).
4. Copy the lesson template: `<LessonVideo slug="<video-slug>" />`, `<LessonChapters slug="<video-slug>" />`, and the eight `##` headings. Keep one `###` per chapter in video order.
5. Run `pnpm --filter @motion-studio/docs typecheck`, `test`, `build`. Published pages with a `video` appear on the landing page automatically; set `status: draft` to keep one out of the grid while its URL still works.

**Deviations / decisions**

- The schema lives in `src/lib/source.ts`, not `source.config.ts`, because this app defines its collection with the macro API (the macro guide says collection options belong in the macro call; `source.config.ts` keeps only global options).
- `databases/meta.json` lists `index` plus the glossary, unlike the prompt's two-item list. Without `index`, the root tab is inactive on `/docs/databases` and the sidebar shows the root tree (Welcome/Databases), which looked broken. With `index`, the course overview is active and the lessons remain in the required order.
- `glossary.mdx` is a fifth page, added to satisfy the acceptance check `find apps/docs/content -name "*.mdx" | wc -l # >= 5` (the stated four-file tree only produces four).
- The landing page sorts cards by title because the frontmatter schema has no date. "Latest lessons" is therefore alphabetical until a date/order field is added.
- The video previews are stubs; `VIDEO PREVIEW: <slug>` and the step-11 sentence are intentionally visible.

**Facts to double-check**

- Durations are presentational: indexing uses `12 min` from the prompt's template; transactions uses `4 min`, rounded from the prompt's "about 3.5 minutes". Neither is measured from the rendered video.
- Levels are editorial: transactions is `beginner`, indexing is `intermediate`.
- Numbers such as "fanout near 500", "ten million rows in three levels", "about 70% full", and the EXPLAIN costs are the video's illustrative examples; the plan output is explicitly labelled "illustrative PostgreSQL-style output". The pages keep the hedging ("around", "about") but do not repeat "illustrative" beside every number.
- The extra glossary page and the `index` entry in `databases/meta.json` are structural choices, not lesson content.

**Checks (step 10)**

- `pnpm --filter @motion-studio/docs typecheck` -> exit 0
- `pnpm --filter @motion-studio/docs test` -> 5/5 tests pass
- `pnpm --filter @motion-studio/docs build` -> exit 0 (client + SSR). One warning remains: `node:fs/promises` externalized for the browser from `fumadocs-mdx/dist/runtime/server.js`; the app renders and the browser has no console errors. The two `::highlight(fd-search)` CSS warnings are Fumadocs preset warnings from step 09.
- `find apps/docs/content -name "*.mdx" | wc -l` -> 5
- `grep -c "<LessonVideo" apps/docs/content/docs/databases/*.mdx` -> indexing 1, transactions 1 (other pages 0)
- Dev server: `/`, `/docs`, `/docs/databases`, `/docs/databases/indexing`, `/docs/databases/transactions`, `/docs/databases/glossary` -> all 200
- Playwright at 1440x1100: landing cards 2, card shadow changes `8px` -> `11px` on hover, no horizontal overflow on `/`, `/docs/databases`, `/docs/databases/indexing`; sidebar shows the "Databases" tab/dropdown and the links Course overview -> Transactions -> Indexing -> Glossary; zero page/console errors.
- `LC_ALL=C find apps/docs/content apps/docs/src -name "*[A-Z]*" -not -path "*/routes/*" | wc -l` -> 1, the generated `src/routeTree.gen.ts` (step 09 exception). Without `LC_ALL=C`, BSD `find` matches everything on this macOS/APFS setup (known since step 03).
- Word counts: `wc -w` -> indexing 1100, transactions 1064.

## Step 11: video player, chapters, build pipeline, one-command dev

**What changed**

- `apps/studio/vite.config.ts`: build output now goes straight into the docs app (`../docs/public/videos`, `emptyOutDir: true`) with `entryFileNames: "projects/[name].js"` and `chunkFileNames: "chunks/[name]-[hash].js"`. Plugins and `resolve.dedupe` unchanged.
- New `tools/scripts` package (`@motion-studio/scripts`, private, `"type": "module"`, no dependencies) with `sync-lessons.mjs`: finds every `apps/studio/src/scenes/*/chapters.json`, validates it with plain JS, and writes the slug-keyed `apps/docs/src/generated/lessons.json` (sorted, 2-space, trailing newline).
- Root scripts `sync:lessons`, `videos:build`, `videos:watch`, `dev`, `build`, `smoke:docs`; `concurrently ^10.0.6` is the only root devDependency.
- `apps/docs` now depends on `@motion-canvas/player@^3.17.2` **and** `@motion-canvas/core@^3.17.2` (see gotchas) and has `src/types/motion-canvas-player.d.ts` for the custom element in JSX.
- New `src/components/video/` files replacing the step-10 stubs: `video-source.ts`, `use-lessons.ts`, `use-player-ready.ts`, `video-player.tsx`, `chapter-list.tsx`, `studio-panel.tsx`, `lesson-video.tsx`, `lesson-chapters.tsx`. `getMDXComponents()` still registers only `LessonVideo` and `LessonChapters`; the MDX content did not change.
- `neubrutalism.css`: 16:9 frame (2 px cream border, 14 px radius, `8px 8px 0` lime shadow, `#0B0B10` background), skeleton/error/missing states, two-column chapter grid, static chapter cards, studio panel and reduced-motion overrides. The old `.nb-video*`/`.nb-chapters` stub rules were removed.
- `tools/snapshots/docs-smoke.mjs` (Playwright already in that package) and root script `smoke:docs`.

**Verified build output (task 1)**

```
pnpm studio:build
apps/docs/public/videos/projects/src/projects/db-indexing.js
apps/docs/public/videos/projects/src/projects/db-transactions.js
apps/docs/public/videos/chunks/_virtual_settings-2a06651c.js
```

Entry pattern: **`/videos/projects/src/projects/<slug>.js`**. The project bundles import chunks with a relative `../../../chunks/...`, so the layout works as-is. `videoSrc()` returns exactly that public path. The entry name is `src/projects/<slug>`, not just `<slug>`.

**How dev works**

`pnpm dev` = `pnpm sync:lessons` once, then `concurrently -k` runs:

- `videos:watch`: `vite build --watch` in `apps/studio` (Vite 4), writing into `apps/docs/public/videos`.
- `docs:dev`: Vite 8 on `http://localhost:3000`.

Both ready lines were verified: `[videos] watching for file changes...` / `[videos] built in ...` and `[docs] VITE v8.3.5 ready ... 3000`. Touching `apps/studio/src/scenes/db-indexing/sections/01-intro.tsx` while the watcher ran produced a real rebuild (`build started... ✓ 0 modules transformed ... built in 606ms`), so `chokidar-cli` was not needed.

Caveat: `sync:lessons` runs once. Editing `chapters.json` during `pnpm dev` rebuilds the video bundle (it is in the Vite graph) but the docs chapter list needs a restart of `pnpm dev` to regenerate `lessons.json`.

**How production works**

`pnpm build` = `videos:build` (sync + studio build) then `docs:build`. The build prints and writes:

- `apps/docs/dist/client` (static assets, including a copy of `public/videos`)
- `apps/docs/dist/server` (SSR entry)

Locally: `pnpm docs:build && pnpm --filter @motion-studio/docs start` serves the built app with `vite preview` on `http://localhost:4173`. The player `src` is made absolute against `window.location.href`, so it works on any deployment origin.

**Known limitation**

Clicking a chapter restarts playback **at that chapter and plays on until the end**; there is no seek/pause-at-chapter API in the player. Clicking the already-active chapter does not restart it because the remount key is `${slug}-${startSection}` (per spec); "Play from the start" only restarts when the section is not already 0.

**Decisions / gotchas**

- **React 19 vs read-only custom-element getters.** React 19 sets `src`, `width`, `height`, `auto` as properties when the property exists. The player defines them as getters without setters, so JSX props threw `Cannot set property width`. The element now gets `ref={playerRef}` plus `style`, and all attributes are set with `setAttribute()` in an effect. `width`/`height` are applied only after `element.state === 'ready'`: the player's `attributeChangedCallback` calls `player.configure()` and throws while `player` is still null (verified: two pageerrors if set too early).
- **Vite 8 rewrites dynamic imports.** Even with the player's `/* @vite-ignore */`, Vite 8 wraps `import(url)` in `__vite__injectQuery(url, 'import')`. A relative `/videos/...` therefore became `?import`, and Vite refuses to transform public files (`should not be imported from source code`). Passing an absolute same-origin URL makes `injectQuery()` return it untouched. This is why `absoluteVideoSrc()` exists.
- **`@motion-canvas/player` is missing its runtime dep.** Its `package.json` lists `@motion-canvas/core` only under `devDependencies`, so `apps/docs` could not resolve `@motion-canvas/core` and the player module failed. Added `@motion-canvas/core@^3.17.2` to `apps/docs` (still no `@motion-studio/video-kit` import).
- **Generated JSON is a hard prerequisite.** `lessons.json` is git-ignored, so on a fresh clone run `pnpm videos:build` (or `pnpm sync:lessons`) before `pnpm --filter @motion-studio/docs typecheck`/`build`; the root scripts always do it.
- **Acceptance grep caveat.** The literal `grep -rn "video-kit" apps/docs | grep -v node_modules` returns **2 after a build**: both hits are generated bundles (`apps/docs/public/videos/chunks/...` and the copy in `dist/client/videos/chunks/...`) that contain the kit's `video-kit-fonts` element id from `loadFonts()`. No docs source imports the kit: `grep -rn "video-kit" apps/docs/src apps/docs/package.json apps/docs/content` -> 0.

**Checks (step 11)**

- `pnpm videos:build` -> exit 0, prints `synced 2 lessons`, `built in 1.15s`
- `ls apps/docs/public/videos/projects/src/projects` -> `db-indexing.js db-transactions.js`
- `pnpm --filter @motion-studio/docs typecheck` -> exit 0
- `pnpm typecheck` -> exit 0 (studio, video-kit, docs)
- `pnpm --filter @motion-studio/docs test` -> 5/5 tests pass
- `pnpm docs:build` -> exit 0 (`dist/client` + `dist/server`)
- `pnpm docs:dev` -> ready on `:3000`; `pnpm smoke:docs` -> **PASS**
- Production preview (`vite preview` on `:4173`): `DOCS_URL=http://127.0.0.1:4173 pnpm smoke:docs` -> **PASS**
- `pnpm dev` -> both watcher and docs ready lines; `touch` on a scene -> rebuild logged; ports released afterwards
- SSR HTML: `motion-canvas-player` count 0, `LOADING PLAYER` count 1 (skeleton), editor link absent in the production build
- Missing-bundle path: after temporarily moving `apps/docs/public/videos`, the page showed "Video bundle not found. Run `pnpm videos:build` in the repo root." with `COPY COMMAND`; bundles restored with `pnpm videos:build`
- Screenshot `.snapshots/docs-indexing.png` (from the smoke run): framed player at chapter 06 (`B-TREE RULES`) with HUD, two-column chapter grid with chapter 06 active, and the studio panel. No error box.

## Step 12: lint, lesson generator, production docs, README

**What changed**

- Root devDependencies `prettier`, `eslint`, `typescript-eslint`, `eslint-plugin-check-file` and `@eslint/js`; new `eslint.config.mjs` (flat config) and `.prettierignore`.
- ESLint: `@eslint/js` recommended plus `typescript-eslint` recommended for `**/*.{ts,tsx}`; `no-explicit-any: error`; `consistent-type-imports: warn`; `check-file/filename-naming-convention` = `KEBAB_CASE` for `**/*.{ts,tsx,mjs,mdx}` with `ignoreMiddleExtensions: true`; `check-file/folder-naming-convention` = `KEBAB_CASE` for `apps/**/src/**`, `packages/**/src/**`, `tools/**`.
- Exemptions: numbered lesson sections keep the repo convention `01-intro.tsx` (custom pattern `+([0-9])-+([a-z0-9])*(-+([a-z0-9]))`); `apps/docs/src/routes/**`, `**/*.d.ts` and `**/*.config.*` are exempt; folders starting with `_` or `$` switch the folder rule off. MDX filenames are checked with the plugin's `eslint-processor-check-file`, so no MDX parser is needed.
- `pnpm format` formatted 11 files (AGENTS.md, PROGRESS.md, four MDX pages, three docs TSX/TS files, the studio Vite config and the kit README). **No scene file changed**, so the visual baseline was untouched. `pnpm typecheck` and `pnpm studio:build` passed afterwards.
- Scripts: `lint`, `test` (`pnpm -r --if-present test`), `check` (typecheck -> lint -> test -> format:check), `format`, `format:check`, `new:lesson`.
- One lint error existed: an unused `neubrutal` import in `apps/studio/src/scenes/db-transactions/sections/07-durability-wal.tsx`. Removed. The 70 `consistent-type-imports` warnings stay: the rule is deliberately `warn` (fixing them is safe but noisy, and they are not errors).
- `tools/scripts/new-lesson.mjs`: plain Node ESM, no dependencies. Validates kebab-case slug/course, non-empty title, positive `--chapters` (default 4), an existing course folder and `meta.json`, and refuses to overwrite existing files, the scene folder, or an existing `meta.json` entry. It creates the project, `chapters.json` (INTRO, CHAPTER 2, ... with lime/cyan/pink/yellow/violet/orange/red), `scene.tsx`, numbered sections, and the MDX page from the step-10 template; appends to `meta.json` keeping order and 2-space JSON; then runs the sync script. `MOTION_STUDIO_ROOT` overrides the repo root.
- `tools/scripts/new-lesson.test.mjs` (Node `node --test`, 5 tests) runs against a temporary minimal tree (apps, docs course, kit colors, copied sync script) and asserts the generated files, chapter names/colours, scene imports, MDX frontmatter, `meta.json` and both generated JSON files. `tools/scripts/package.json` gained `test: node --test`.
- Real generator run: `pnpm new:lesson generator-check "Generator Check" --course databases` created 4 chapters; `pnpm typecheck`, `pnpm studio:build` and `pnpm docs:build` passed, and `curl /docs/databases/generator-check` returned **200** with the title in the HTML. Everything it generated (including the two `.meta` files written by the studio build) was removed with scoped `git clean -fd`; `meta.json` was restored with `git checkout`; `pnpm sync:generated` reported 2 lessons again. The check lesson is not committed.
- `sync-lessons.mjs` renamed to `sync-generated.mjs`. It now also parses `packages/video-kit/src/theme/colors.ts` with `/^\s*([A-Za-z][A-Za-z0-9]*):\s*'([^']+)',?\s*$/gm` (hex and rgba) and writes `apps/docs/src/generated/palette.json` (19 colours). It honours `MOTION_STUDIO_ROOT`. All references were updated: root scripts, the generator, its test, both player error messages, `docs-smoke.mjs` and the AGENTS.md tree.
- Docs: new root folder `content/docs/production/` with `meta.json` (`root: true`, three pages); top-level `meta.json` lists `production`. Pages: `how-videos-are-made` (pipeline, ASCII architecture tree, commands, "why two Vite versions"), `design-system` (swatches, type, rules, 17-row kit component table derived from `packages/video-kit/src/components/index.ts` and each export's JSDoc), `adding-a-lesson` (generator, `#s=N`, chapter mapping, publish, `.meta` commits, checks). `ColorSwatches` reads `@/generated/palette.json`, is registered in `getMDXComponents()`, and has swatch styles in `neubrutalism.css`.
- `README.md`: architecture, prerequisites, quick start, command table, adding a lesson, the two-Vite rule and troubleshooting (project glob, one editor page, `.meta` commits, "Video bundle not found", fresh-clone generated data).
- Final `## Summary` below lists every step and its commits, plus the collected tech debt and kit candidates.

**Checks (step 12)**

- `pnpm check` -> exit 0; `eslint .` -> 0 errors, 70 warnings; `prettier --check .` -> all files formatted
- `pnpm test` -> docs 5/5, video-kit 32/32, tools/scripts 5/5
- `pnpm studio:build` -> exit 0 (after the format pass)
- `pnpm docs:build` -> exit 0
- generator check page -> HTTP 200; production pages `how-videos-are-made`, `design-system`, `adding-a-lesson` -> all 200; design-system SSR contains 19 swatches
- `pnpm sync:generated` -> `synced 2 lessons and 19 palette colours`
- `git status --short` after removing the check lesson -> only the intended step-12 files

**Final verification (step 12)**

- `pnpm install --frozen-lockfile` -> exit 0
- `pnpm check` -> exit 0 (typecheck, lint, tests, format:check)
- `pnpm build` -> exit 0 (`synced 2 lessons and 19 palette colours`; `db-transactions.js`, `db-indexing.js`, docs client + SSR)
- `pnpm snap:capture current` -> 58/58 frames captured (40 db-indexing, 18 db-transactions)
- `pnpm snap:compare` -> **58/58 PASS**, max 0.085% on db-transactions; `db-indexing/s11_t52` needed the documented paused recapture at timecode 52:01 (0.000% match, the live capture lands after the 0.35 s fade)
- `pnpm dev` -> `[videos] watching for file changes...` plus `[docs] VITE v8.3.5 ready ... :3000`; `pnpm smoke:docs` -> **PASS**
- both dev processes stopped; ports 3000 and 9000 released

## Step 13: theme system core

**What changed**

- New pure-TypeScript `packages/video-kit/src/themes/`: `theme-types.ts`, `color-utils.ts` (+ tests), `neubrutal.ts`, `registry.ts`, `active-theme.ts` (+ tests), `shadows.ts`, `golden.test.ts`, `golden/neubrutal-dark.json`, `index.ts`.
- `neubrutal` dark is the original palette verbatim plus `onAccent`, `border`, `brand`, `onBrand`; light uses the table from the prompt. Both modes share Space Grotesk / JetBrains Mono and the same Google Fonts URL.
- `theme/colors.ts` and `theme/fonts.ts` are Proxies over `getTheme()`; `loadFonts()` injects the active theme's stylesheet per theme id (`video-kit-fonts-<id>`).
- `theme/box-style.ts` replaces `theme/neubrutal.ts` with `boxStyle()` (hard/soft/glow/none) and `radius()` (number or 4-tuple; pills >= 100 pass through). `formatNumber()` moved to `theme/format.ts`.
- HUD reads `hud.gridSize`/`gridVisible`, uses brand/onBrand chrome, and implements `bar`/`tonal`/`outline` caption styles. `title-slab.tsx` became `title-block.tsx` with `slab`/`plain`/`pill` styles; `titlePill()` stays.
- `defineLesson()` resolves the theme/mode pair (player variable, hash, `chapters.json`, defaults), warns on unknown ids and calls `setActiveTheme()` before `view.fill()`/`buildHud()`. `resolveChapters()` moved inside the scene so chapter colours resolve after the theme is active. `ChaptersFile` and `chapters.schema.json` accept optional `theme` and `mode`.
- Code panel rule tables store accent keys and `tokenize()` resolves them at call time; the highlight bar uses `withAlpha(colors.ink, 0.09)`.
- Studio codemod: `neubrutal()` -> `boxStyle()`, `colors.dark` -> `colors.onAccent`, numeric/array radii -> `radius(...)`, every `rgba()`/hex literal in scenes replaced with `withAlpha(colors.x, a)`/`colors.x`, and the module-level `ANOMS` table plus the `coin` helper now resolve colours at call time.
- `tools/scripts/sync-generated.mjs` warns and keeps the existing `palette.json` when the colour regex finds nothing (0 pairs), exit 0.

**Codemod / grep results**

- `grep -rn "neubrutal(" apps packages --include=*.ts --include=*.tsx | wc -l` -> 0.
- `grep -rn "colors.dark" ...` -> 0.
- hex literal grep outside `themes/` -> 0 (tests included).
- rgba literal grep outside `themes/` -> 0 (tests included).
- module-level colour/font grep -> 0 (only JSDoc examples remain in the broader scan).

Two non-palette hexes had no exact slot: `#FF5C7A` (isolation-levels row) -> `colors.pink` and `#B7A0FF` (ACID disk lid) -> `colors.violet`. They are the nearest semantic slots; the quick subset does not cover those two frames. The soft-elevation shadow inks (`#000000` / `#1B2340`) live in `themes/shadows.ts`, so the raw-colour grep stays at 0 outside `themes/`.

**Checks (step 13)**

- `pnpm --filter @motion-studio/video-kit test` -> 65/65 tests pass (9 files), including golden, registry, active-theme, box-style and tokenizer theme tests.
- `pnpm check` -> exit 0 (typecheck, lint 0 errors / 69 pre-existing warnings, tests, format:check).
- `pnpm studio:build` -> exit 0 (`db-transactions.js`, `db-indexing.js`, chunk `_virtual_settings-972be7cb.js`).
- `pnpm snap:quick` -> **6/6 PASS** (0.000% each; capture 84.7 s, compare 0.2 s). Dev server stopped afterwards; port 9000 released.

**Blocked**

- None.

**Follow-ups**

- Step 14 adds the theme catalogue and showcase; step 15 adds the config/flag layers and the theme generator. `resolveThemeSelection` keeps its candidates as ordered lists so new layers are a small change.
- The docs palette regex now produces no entries; `apps/docs` keeps the last generated `palette.json` until step 15 replaces the source.
- `colors` is a Proxy over `{}`, so `Object.keys(colors)` is empty. No current caller enumerates it; use `themeIds`/`themes` instead.
- `titleBlock({style: 'plain'})` uses a 160 px brand underline; step 14 may want to tune it per theme.

## Step 14: theme catalogue and showcase

**What changed**

- Six new theme files in `packages/video-kit/src/themes/`: `shadcn.ts`, `notebook.ts`, `tokyo-night.ts`, `terminal-green.ts`, `paper-editorial.ts`, `blueprint.ts`, each exporting `<camelCaseId>Theme` with `variants.dark` and `variants.light`. `registry.ts` registers all seven themes in catalogue order and `themes/index.ts` exports them.
- `neubrutal.ts` only changed its `description` (the prompt's one-liner for the catalogue). The dark tokens, shape and HUD are untouched; the light table was already in place and needed no tuning.
- `registry.test.ts` now also checks that the mode is real (dark: bg luminance < 0.2 and ink lighter; light: bg luminance > 0.5 and ink darker), `contrastRatio(onBrand, brand) >= 4.5`, the red/lime channel semantics in both variants, and that both variants plus a valid `defaultMode` exist. All 14 theme x mode cases pass.
- New `theme-showcase` lesson: `apps/studio/src/projects/theme-showcase.ts`, `apps/studio/src/scenes/theme-showcase/{chapters.json,scene.tsx,sections/01..06,scene.meta}`, project `.meta`. Six chapters (TITLE, PALETTE, COMPONENTS, CODE, TREE, HUD) built only from kit components. The subtitle chip reads `getTheme().name` and `.mode` at render time.
- Snapshot tooling: `capture.mjs` accepts `--theme <id>` and `--mode dark|light`, appends `theme=<id>&mode=<mode>` after `#s=N`, and writes to `<label>/<slug>--<theme>--<mode>/`; a missing mode uses the registry's `defaultMode`. `frames.json` lists the six showcase captures. New `themes-run.mjs` loops the registry (loaded through `tsx`) and writes `.snapshots/themes.html`: one block per theme, Dark and Light rows, six chapter thumbnails per row; `--only <id>` runs one theme. Root script `snap:themes`.
- README gained the theme catalogue table, the "every theme has dark and light" sentence and the inspired-by framing. The kit README lists the new files, the catalogue, the 0.6 em rule and `borderWidth`/`tintedSurface`.

**Fonts**

- `shadcn`, `tokyo-night`: Inter + JetBrains Mono.
- `notebook`: **Google Sans** + Roboto Mono. Google Sans is offered by Google Fonts (both the CSS2 API and `fonts.google.com/specimen/Google+Sans` serve it), so the DM Sans fallback was not needed; the stack keeps DM Sans as the fallback.
- `terminal-green`: JetBrains Mono for sans, mono and display.
- `paper-editorial`: Fraunces (display) + Inter + JetBrains Mono.
- `blueprint`: IBM Plex Sans + IBM Plex Mono.
- Mono advance measured in Chromium with `measureText('MMMMMMMMMM').width / 10 / fontSize`: Roboto Mono 0.6001, JetBrains Mono 0.6000, IBM Plex Mono 0.6000 (all within 0.01 of 0.6).

**Final accent hexes after contrast tuning**

No accent needed a lightness change: all 14 variants passed the first registry run. The final values are exactly the prompt tables.

| Theme / mode            | lime      | pink      | cyan      | yellow    | violet    | orange    | red       |
| ----------------------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| `neubrutal` dark        | `#C6FF3D` | `#FF4D8D` | `#3DE3FF` | `#FFD23D` | `#9B7BFF` | `#FF8A3D` | `#FF4D4D` |
| `neubrutal` light       | `#15803D` | `#BE185D` | `#0E7490` | `#A16207` | `#6D28D9` | `#C2410C` | `#B91C1C` |
| `shadcn` dark           | `#4ADE80` | `#F472B6` | `#22D3EE` | `#FACC15` | `#A78BFA` | `#FB923C` | `#F87171` |
| `shadcn` light          | `#15803D` | `#BE185D` | `#0E7490` | `#A16207` | `#6D28D9` | `#C2410C` | `#B91C1C` |
| `notebook` light        | `#188038` | `#C2185B` | `#00658B` | `#B06000` | `#6750A4` | `#B04E00` | `#B3261E` |
| `notebook` dark         | `#81C995` | `#FF8BCB` | `#78D9EC` | `#FDD663` | `#D0BCFF` | `#FCAD70` | `#F28B82` |
| `tokyo-night` dark      | `#9ECE6A` | `#F7768E` | `#7DCFFF` | `#E0AF68` | `#BB9AF7` | `#FF9E64` | `#DB4B4B` |
| `tokyo-night` light     | `#4F7A1F` | `#B0305F` | `#0F6E8C` | `#8C6C3E` | `#7847BD` | `#B15C00` | `#C64343` |
| `terminal-green` dark   | `#39FF6A` | `#FF5FA2` | `#37E6D0` | `#E6E637` | `#9D8CFF` | `#FFA640` | `#FF4B4B` |
| `terminal-green` light  | `#1B7F3A` | `#B3246A` | `#0E7C72` | `#8A6A00` | `#5B3FB0` | `#B14F00` | `#B3261E` |
| `paper-editorial` light | `#2F6B3A` | `#A8305E` | `#1F5F7A` | `#8A6410` | `#5B3E91` | `#B2561A` | `#B5341F` |
| `paper-editorial` dark  | `#8FC98F` | `#E88AAE` | `#7CC4DE` | `#E0B656` | `#B79CEB` | `#EE9A5C` | `#E8643F` |
| `blueprint` dark        | `#B8F2A0` | `#FF9EBB` | `#7BDFF2` | `#FFE066` | `#B8A1FF` | `#FFB26B` | `#FF7F7F` |
| `blueprint` light       | `#1E7A3C` | `#B3246A` | `#00708F` | `#8F6200` | `#5B3FB0` | `#B14A00` | `#B3261E` |

**Kit fixes found in the visual review**

- Added `borderWidth(base)` and used it for the HUD logo, the outline caption bar/label and the code-panel title divider. Themes with `borderWidthScale: 0` (notebook) are now genuinely borderless; shadcn gets its hairline; neubrutal dark keeps the exact 3.5/4/1.5 px values, so the golden look is unchanged.
- Added `tintedSurface(accent)`: returns `colors.surf` when the elevation shows the accent (hard/glow) and a 22 % accent tint for soft/flat themes. `TreeView` and `miniTree` use it so internal vs leaf nodes stay distinguishable when a theme has no hard shadow. Neubrutal dark is unchanged.
- `TreeView.unmark()` and `miniTree.clearStroke()` now restore `colors.border` at the theme's `borderWidth(3.5)` instead of always `colors.ink` at 3.5. Notebook no longer grows outlines after a highlight.
- The HUD section chip text uses `colors.onBrand` (it sits on a `brand` fill); it was `colors.onAccent`. Identical for neubrutal dark; correct for light variants.

**Decisions / gotchas**

- The root `snap:themes` script is `pnpm --filter @motion-studio/snapshots exec node --import tsx themes-run.mjs`. The prompt's literal `node --import tsx tools/snapshots/themes-run.mjs` cannot resolve `tsx` from the workspace root under pnpm's isolated `node_modules` (verified: `ERR_MODULE_NOT_FOUND`). The filtered form runs with the snapshots package's cwd, where `tsx` resolves, and `pnpm snap:themes` is still the public command.
- `capture.mjs` now accepts any kebab-case label (needed for `themes`), not only `baseline`/`current`. The existing scripts are unchanged.
- The theme sheet and PNGs live under `.snapshots/`, which is git-ignored; only the runner and `frames.json` are committed.
- `theme-showcase` is a real studio project and `sync-generated.mjs` will include it in `lessons.json`, but it has no MDX page, so it does not appear on the docs site.
- `themes/shadows.ts` moved to `theme/shadows.ts`. It is a design-token helper, not a theme; the acceptance grep `ls packages/video-kit/src/themes/*.ts | grep -vE ... | wc -l` now returns the intended 7. No rendering changed.
- Chapter timings (estimated from the explicit animation durations): TITLE ~6.2 s, PALETTE ~6.4 s, COMPONENTS ~6.4 s, CODE ~6.2 s, TREE ~8.7 s, HUD ~7.9 s. The TREE chapter uses `IndexTree(3)` with keys 10/20/5 (one root leaf, no overflow), so `playInsert` does not hit its fixed 1.5 s overflow/new-root waits; the split version ran ~13 s and was over the 6-9 s target.
- Full baseline compare: **58/58 PASS**. Two frames needed a paused recapture at the stable side of a fade: `s11_t52` (known since step 07) at frame 1561, and `s4_t40` at frame 1206. The latter is new: `s4_t40` lands inside the 0.4 s legend/demo fade that starts section 05; the baseline was captured at the stable end, so frames 1206+ match at 0.000% while frame 1200 is mid-fade (0.718%). Both files keep their original names in `.snapshots/current`.

## Theme issues in existing lessons

Four looks smoke-tested: `neubrutal` light, `notebook` light, `notebook` dark and `tokyo-night` light, on `db-indexing` `#s=5`, `#s=9`, `#s=13` and `db-transactions` `#s=3`. Screenshots are in `.snapshots/_smoke/` (git-ignored). The kit components (HUD, caption styles, tree nodes/links, chips, legends) held up in all four looks. The defects below come from scene-local code, so they are listed, not fixed here.

- **`db-transactions` section 03 (ACID), light modes (seen in `notebook` light and `tokyo-night` light)**: `04-acid.tsx:240` dims the inactive A/I/D cards with `opacity(0.4)`. On a light page the pale tinted fills plus the low opacity make the big letters, the descriptions and the `UPDATE 1` / `UPDATE 2` / `ROLLBACK: NOTHING APPLIED` pills nearly invisible; `UPDATE 1` is pale grey on pale grey. The active C card is fine. Fix in `04-acid.tsx` by dimming through `colors.mute`/`colors.surf2` or a lower-contrast surface instead of whole-card opacity.
- **`db-transactions` section 03 (ACID), borderless/flat themes**: the local card markup uses `stroke={colors.ink}` with fixed `lineWidth` 3/4/5 (`04-acid.tsx:113-125`), so `notebook` (`borderWidthScale: 0`) still gets outlines on the ACID cards and the big letters. The theme's no-outline intent is not honoured. Fix locally with `borderWidth(...)` or `boxStyle(...)`, not in the kit.
- **`db-indexing` sections 05/09/13, leaf highlights in borderless themes**: the highlight code animates `stroke`/`lineWidth` directly (for example the orange 6 px border on the selected secondary leaf in section 13). It is readable and deliberately marks the selection, but it is the only outline in `notebook` and does not follow `borderWidthScale`. Listed as a scene-local inconsistency, not fixed.
- **Not defects**: the notebook soft shadows and the tokyo-night flat surfaces correctly remove the hard colour shadows from the tree/rule rows; the number badges, chips and legends still carry the accents. Caption bars, HUD pills and the seven-accent legend are readable in all four looks. The section 5 rule rows and the section 13 leaves keep their semantic tints after the `tintedSurface` kit fix.

**Checks (step 14)**

- `pnpm check` -> exit 0: typecheck (studio, video-kit, docs), ESLint 0 errors / 69 warnings, tests (docs 5/5, video-kit 77/77, tools/scripts 5/5), Prettier clean.
- `pnpm --filter @motion-studio/video-kit exec vitest run src/themes/registry.test.ts` -> **14/14** theme x mode cases pass.
- `ls packages/video-kit/src/themes/*.ts | grep -vE "test|types|utils|active|registry|index" | wc -l` -> **7**.
- `pnpm snap:themes` -> 14 looks x 6 chapters = **84 frames**; `.snapshots/themes.html` has **7 theme blocks x 2 rows x 6 thumbnails**, 0 missing. All 7 blocks and full-size frames in both modes inspected.
- `pnpm snap:compare` -> **58/58 PASS** (max 0.361% on `s10_t52`; everything else <= 0.229%). Boundary frames after paused recaptures: `s11_t52` at frame 1561 (0.001%) and `s4_t40` at frame 1206 (0.000%).
- Existing-lesson smoke: 4 looks x 4 frames = **16/16** screenshots, no browser errors; the defects are listed above.
- The `theme-showcase` `.meta` files are committed. The sheet and smoke PNGs stay under `.snapshots/` (ignored).

## Step 15: choose the look a video renders in

**What changed**

- Root `video.config.json` (`$schema`, `theme: neubrutal`, `mode: dark`) and `video.config.schema.json`. Both keys are optional; a missing mode uses the theme's `defaultMode`.
- `packages/video-kit/src/themes/active-theme.ts`: `resolveThemeSelection()` now takes `hashTheme/hashMode`, `cliTheme/cliMode`, `variableTheme/variableMode`, `lessonTheme/lessonMode` and `configTheme/configMode`, resolves each field independently in that order, skips invalid values and returns `{themeId, mode, source: {theme, mode}}`. `parseLookHash()` is exported for `#s=3&theme=x&mode=light`.
- New `globals.d.ts`, `build-look.ts` (`readBuildLook`, `readLocationHash`) and `project-name.ts` (`resolveProjectName`). `apps/studio/vite.config.ts` reads `video.config.json` with `fs.readFileSync` relative to `__dirname` and defines `__VIDEO_CLI_THEME__`, `__VIDEO_CLI_MODE__`, `__VIDEO_CONFIG_THEME__`, `__VIDEO_CONFIG_MODE__`; a malformed `VIDEO_THEME` (non-kebab) or `VIDEO_MODE` (not `dark`/`light`) throws before Vite starts.
- `defineLesson()` builds all six inputs and prints one line per scene start:
  `[video-kit] look: tokyo-night / light  (theme from cli, mode from lesson)`.
- `tools/scripts/studio.mjs`: parses `--theme`, `--mode`, `--port`, `--print`, ignores a leading `--`, validates the id against `themeIds`, sets `VIDEO_THEME`/`VIDEO_MODE` only when given, prints the banner, then spawns `pnpm --filter @motion-studio/studio exec vite --port <n>` and forwards SIGINT/SIGTERM. Root scripts `studio`, `studio:light`, `studio:dark`; `studio:dev` is unchanged.
- `sync-generated.mjs` replaced by `sync-lessons.mjs` (theme-aware, writes `look: {theme, themeName, mode}`) plus `sync-themes.mjs` (writes `apps/docs/src/generated/themes.json`). Root `sync:themes`, `sync:lessons`, `sync`; `videos:build`, `dev` and `build` call `pnpm sync`. The palette regex and `palette.json` are gone.
- `ColorSwatches` reads `themes.json` and renders the dark and light rows (`<ColorSwatches theme="neubrutal" />`); new `ThemeTable` lists every theme; the design-system page points at the theme files. New docs page `production/render-in-a-look.mdx` with the precedence table, commands, render steps, output names and the generator.
- `registry.ts` now uses explicit keys with `// <generated:imports>` and `// <generated:entries>` markers; `themeIds` derives from `Object.keys(themes)`. `new-theme.mjs` copies a theme, rewrites id/name/constant/description/defaultMode, inserts it between the markers and runs `sync:themes`. `new-lesson.mjs` accepts `--theme`/`--mode` and writes a named project.

**Precedence (per field, highest first)**

`hash` -> `cli` -> `variable` -> `lesson` -> `config` -> `default` (built-in: `neubrutal`, then the theme's `defaultMode`). Invalid ids and modes are skipped; the `source` fields name the winning layer.

**Output-file findings (task 5)**

- `@motion-canvas/ffmpeg` `FFmpegExporterServer` calls `.output(path.join(this.config.output, `${settings.name}.mp4`))`; the UI passes `name: project.name` from the Render button. `bootstrap()` builds `{name, ...config}`, so a `name` in `makeProject({...})` overrides the file-derived name.
- The project `.meta` name comes from the project **file** path in `@motion-canvas/vite-plugin` (`path.posix.parse(base).name` -> `${name}.meta`), not from `project.name`.
- `apps/studio/src/projects/*.ts` now call `resolveProjectName(chapters.slug, chapters)`: `<slug>` for the built-in look, `<slug>--<theme>--<mode>` otherwise. Verified in the editor: all three projects load, `db-indexing.meta`, `db-transactions.meta`, `theme-showcase.meta` and `scene.meta` are unchanged and not duplicated, and `git status` shows no `.meta` edits.
- The name is fixed when the project loads, so changing the hash needs a page reload before it affects the render file name.

**Browser verification**

- `pnpm studio --theme tokyo-night --mode light --port 9100` -> banner `Look from flags: tokyo-night / light`; console `[video-kit] look: tokyo-night / light  (theme from cli, mode from cli)`; screenshot `.snapshots/step15/tokyo-night-light.png` checked: light Tokyo Night, title chip `Tokyo Night / Light`.
- Same server, `.../theme-showcase#theme=shadcn&mode=dark` -> `look: shadcn / dark (theme from hash, mode from hash)`; screenshot checked: shadcn dark, chip `Shadcn / Dark`.
- `pnpm studio:dev` (no flags) on `.../db-indexing#s=2` -> `look: neubrutal / dark (theme from config, mode from config)` because the shipped `video.config.json` sets those values; screenshot checked: the familiar Neubrutal dark frame. With `video.config.json` temporarily moved aside, the same page logged `... (theme from default, mode from default)`, proving the built-in path.
- `video.config.json` set to `blueprint` / `light`, server restarted -> `look: blueprint / light (theme from config, mode from config)`; screenshot checked. File restored.
- `chapters.json` temporarily given `"theme": "paper-editorial"` -> `theme from lesson`; the config's explicit `mode: dark` correctly outranked the theme default. With `mode` temporarily removed from the config -> `look: paper-editorial / light (theme from lesson, mode from default)`; screenshot checked. Both files restored.
- The line prints twice per page load (initial scene start plus the editor's internal restart); both lines are identical.

**Checks (step 15)**

- `pnpm check` -> exit 0 (typecheck; ESLint 0 errors / 69 pre-existing warnings; docs 5/5, video-kit 87/87, tools/scripts 21/21; Prettier clean)
- `pnpm studio --theme tokyo-night --mode light --print` -> `VIDEO_THEME=tokyo-night VIDEO_MODE=light` and `COMMAND=pnpm --filter @motion-studio/studio exec vite --port 9000`; both `pnpm studio --theme ...` and `pnpm studio -- --theme ...` reach the script on pnpm 12.16.1
- `pnpm sync` -> `synced 7 themes`, `synced 3 lessons`; `lessons.json` has `look: {theme, themeName, mode}` for all three
- `pnpm studio:build` -> exit 0 (with and without `VIDEO_THEME`/`VIDEO_MODE`); the built settings chunk contains `cliTheme:"tokyo-night",cliMode:"light"`
- `pnpm docs:build` -> exit 0; `/docs/production/render-in-a-look` and `/docs/production/design-system` return 200, the swatch rows render `Neubrutal / dark` and `Neubrutal / light`, the theme table lists `blueprint`/`paper-editorial`/etc.
- sync validation: a temporary lesson produced `chapters.json: unknown theme "nope"` and `chapters.json: mode must be "dark" or "light"`, both exit 1
- `pnpm new:theme midnight-purple "Midnight Purple" --from tokyo-night` -> `synced 8 themes`; file, registry import/entry and `themes.json` verified, then removed
- `grep -rn "video-kit" apps/docs/src apps/docs/package.json | wc -l` -> 0
- No snapshot compare was run: this step does not change how the default look renders, and the two render path changes were checked with screenshots.

**Render a video in a look (5-line recipe)**

```sh
pnpm studio --theme tokyo-night --mode light      # or set theme/mode in video.config.json or chapters.json
open http://localhost:9000/src/projects/<slug>     # confirm "[video-kit] look: tokyo-night / light (theme from cli, ...)"
# Render tab -> Video (FFmpeg) -> Render
# Output: apps/studio/output/<slug>--tokyo-night--light.mp4 (plain <slug>.mp4 for the built-in look)
```

**Gotchas**

- `tsx` is a devDependency of both the root and `tools/scripts`: the root `node --import tsx` commands resolve it from the root, while `tools/scripts` tests and generators resolve it from their own package. `new-lesson`/`new-theme` spawn the sync with the resolved `tsx` loader URL so `MOTION_STUDIO_ROOT` temp trees work.
- `video.config.json` is read when the Vite server starts; restart the studio after editing it. The URL hash is read at scene start, and the project name at project load.
- The `**/*.config.*` ESLint filename exemption was narrowed to JS/TS config extensions so `video.config.json` is not parsed as JavaScript.
- `registry.ts` uses explicit keys now; `themeIds` is `Object.keys(themes)`, so a generated theme needs only the import and one entry.
- The default look compared with step 14 is unchanged: only `name` was added to `makeProject`, and the built-in name is still the plain slug.

## Step 16: docs as voiceover notes and video tracker

Branch `feat/docs-notes`, created from `master` at `45070ae` (v0.2.0). The docs are now the owner's recording companion, not a viewer-facing site.

**Installed versions (checked in `apps/docs/package.json` and `node_modules/.pnpm`)**

- `fumadocs-ui` 16.17.9, `fumadocs-core` 16.17.9, `fumadocs-mdx` 15.4.10
- `@tanstack/react-start` 1.169.4, `@tanstack/react-router` 1.170.46
- `vite` 8.3.5, `tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3, `zod` 4.6.7
- Node 22.19.0, pnpm 12.16.1

The installed docs were followed for theme setup and TanStack Start integration: <https://www.fumadocs.dev/docs/ui/theme> and <https://www.fumadocs.dev/docs/manual-installation/tanstack-start>. The collection API was checked in `node_modules/fumadocs-mdx/dist/*.d.ts`.

**Root provider and layouts**

- `apps/docs/src/routes/__root.tsx` uses `RootProvider` from `fumadocs-ui/provider/tanstack` with no theme overrides. Fumadocs' defaults are `attribute: "class"`, `defaultTheme: "system"`, `enableSystem: true`; `<html>` no longer has a forced `dark` class. Theme choice persists through next-themes' localStorage key.
- `/` uses `HomeLayout` (the tracker); `/docs/*` uses `DocsLayout` with the generated page tree. `baseOptions()` has `nav.title = "Motion Studio"`, `nav.url = "/"`, and the only links are `Videos` (`/`) and `Docs` (`/docs`). There is no theme-related nav item.
- The theme toggle is enabled by default: it is in the navbar on the home layout and at the bottom of the sidebar in the docs layout. On mobile it moves into the menu.
- `apps/docs/src/styles/app.css` is exactly `@import 'tailwindcss'`, `fumadocs-ui/css/neutral.css`, `fumadocs-ui/css/preset.css`. `neubrutalism.css` and every `nb-*` class are gone. The Fontsource imports and the `@fontsource/*` dependencies were removed; the docs use the system font stack.

**Frontmatter and data**

- `apps/docs/source.config.ts` now exports `docs = defineDocs({dir: 'content/docs', docs: {schema: pageSchema.extend({...})}})` from `fumadocs-mdx/config`. The config loader only accepts collection/default exports, so the schema lives there as requested. `lib/source.ts` imports the generated `docs` from `.source/server` and passes it to `loader()`; the old macro `defineDocs` in `lib/source.ts` is gone.
- New frontmatter fields: `status` (`outline | animated | rendered | voiced | published`, default `outline`), `duration` (default `TBD`), optional `youtube` URL and optional `recorded` `YYYY-MM-DD`. `video`, `level` and `tags` remain.
- The two lesson pages set `status: published`: neither had an explicit status before, and the old schema defaulted a missing status to `published`. They keep their old durations (`12 min`, `4 min`); `youtube` and `recorded` stay absent until the owner fills them.
- `chapters.schema.json` and `sync-lessons.mjs` validate optional `summaryPoints` (3 to 8 short strings, or exactly `["TODO"]` for a fresh lesson) and optional per-chapter `at` (`m:ss` or `h:mm:ss`). `lessons.json` carries both through. Both current lessons have 6 summary points and no `at` yet.
- `new-lesson` now writes `summaryPoints: ["TODO"]`, `status: outline`, `duration: TBD`, the new MDX template, and the tests assert it. `tools/scripts/lesson-status.mjs` + `pnpm status` print slug, status, duration and YouTube link; `lesson-status.test.mjs` covers the parser and rejects an unknown status.

**Pages and player**

- New MDX components in `apps/docs/src/components/notes/`: `VoiceoverNotes` (Say this callout with microphone SVG and larger text), `SummaryPoints` (list + TODO badge), `YoutubeDescription` (copy-ready pre with Copy/Copied and a `timestamps missing` warning), `StatusBadge` (word + light/dark-safe colours).
- The tracker at `/` has status counters that filter the table, a title filter, the joined table (title, course, status, chapters, duration, look, YouTube, recorded), and the data-driven Next actions list. Missing `lessons.json` entries render a `no studio project` note instead of crashing. The table scrolls inside its own container at 390 px.
- `LessonVideo` shows `Renders in: <themeName> · <Mode>`, the 16:9 player with a Fumadocs border, compact chapter cards, and the studio panel. Chapter clicks restart the player and scroll the matching `### NN ·` heading below the player.
- The player is sticky on wide screens at `top-0`, not `top-16`: this Fumadocs version's docs layout has no desktop top navbar (`--fd-header-height: 0px`, only the mobile `#nd-subnav` is a header). `top-16` left a 64 px strip of scrolling notes above the player; `top-0` keeps it flush in the content column without covering the sidebar or the TOC. It is not sticky below `lg`.
- Both lesson pages were migrated to the voiceover template. The 3 to 6 talking points per chapter come from the `say()` captions and the old chapter notes; SQL/Java examples, the cheat sheets, the common-mistake callouts and the reference links moved under the relevant chapters. `production/recording-workflow.mdx` is new and registered in `production/meta.json`; the other production pages were rewritten for the recording-companion purpose and the stock Fumadocs docs look.

**Checks (real output)**

- `pnpm check` -> exit 0. Typecheck clean; ESLint 0 errors / 69 pre-existing warnings; docs Vitest 2 files / 10 tests passed; video-kit 10 files / 87 tests passed; tools/scripts 26 tests passed; Prettier clean.
- `pnpm sync` -> `synced 7 themes`, `synced 3 lessons`.
- `pnpm videos:build` -> exit 0; `db-indexing.js`, `db-transactions.js`, `theme-showcase.js` and chunks written to `apps/docs/public/videos`.
- `pnpm docs:build` -> exit 0; the two known cosmetic `::highlight(fd-search)` CSS warnings remain. No new warnings.
- `pnpm docs:dev` -> Vite ready on `http://localhost:3000/`.
- `pnpm smoke:docs` -> `PASS`. It checks two tracker rows with status words, a status-counter filter that reduces the rows, no page-level horizontal overflow at 390 px, the toggle changing `<html>` between light and dark and persisting across reload, the player remount on chapter 3 plus the `03 ·` heading scroll, and the clipboard text containing `In this video:` and `Chapters:`.
- `pnpm status` -> both lessons `published`, durations `12 min` / `4 min`, YouTube `-`.
- `grep -rn "video-kit" apps/docs/src apps/docs/package.json | wc -l` -> 0.
- `grep -rniE "neubrutal" apps/docs/src apps/docs/content` -> 22 hits: 10 in `apps/docs/src/generated/*.json` (the generated theme id/name, unavoidable while the video theme is called `neubrutal`) and 12 explanatory mentions in the production pages. There is no neubrutalist CSS, class name or markup left in `apps/docs/src`.
- Screenshots in `.snapshots/docs/` were inspected: `tracker-light.png`, `tracker-dark.png`, `tracker-light-390.png`, `tracker-dark-390.png`, `lesson-light.png`, `lesson-dark.png` (plus `lesson-light-top.png`). Checked: no page overflow at 390 px, the table scrolls inside its container, badges are readable in both modes, the sticky player covers neither sidebar nor TOC, chapter 3 sits directly below the player, and the Say this blocks are readable at arm's length. The dark captures wait 400 ms after the toggle so the next-themes view transition is not captured mid-flight.

**Gotchas**

- The generated `.source` folder is git-ignored; `pnpm install` runs `fumadocs-mdx` as `postinstall`, which regenerates it. `pnpm check` needs `.source` and `apps/docs/src/generated`.
- `source.config.ts` can only export collections or a default config. Exporting a helper constant there throws `Unknown export`; shared status values live in `apps/docs/src/lib/status.ts` and are imported by the config.
- The docs layout has no desktop top navbar, which is why the sticky offset is `top-0`; see the layout note above.
- `YoutubeDescription` reads the page description from `source` and the points/chapters from `lessons.json`; `at` is optional, so the copied text shows `--:--` and the page warns `timestamps missing` until the owner times the render.
- The tracker filters by status counts from the frontmatter, not from `lessons.json`; a page whose `video` slug is missing from the generated data still appears with a muted `no studio project` note.

## Summary

Every commit from `git log --oneline --reverse`, grouped by step.

| Step | Scope                                    | Commits                                                                                                                                                                                                                                                                                                                                                                                            |
| ---- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00   | Import and safety baseline               | `bfadeb8 init-proj`, `265f505 chore: baseline before monorepo restructure`                                                                                                                                                                                                                                                                                                                         |
| 01   | Monorepo bootstrap                       | `5d30f17 chore: convert repo to pnpm workspace and move motion canvas project to apps/studio`                                                                                                                                                                                                                                                                                                      |
| 02   | Screenshot baseline                      | `7a2065d test: add playwright snapshot capture and compare tools`                                                                                                                                                                                                                                                                                                                                  |
| 03   | video-kit foundation                     | `5a5a779 feat(video-kit): add theme, animation, hud and base components`                                                                                                                                                                                                                                                                                                                           |
| 04   | video-kit code panel                     | `a02ff56 feat(video-kit): add syntax-coloured code panel with tokenizer tests`                                                                                                                                                                                                                                                                                                                     |
| 05   | video-kit tree engine                    | `3528303 feat(video-kit): add b-tree/b+tree engine, mini tree, stat card and legend`                                                                                                                                                                                                                                                                                                               |
| 06   | video-kit lesson factory                 | `7fdf57c feat(video-kit): add defineLesson factory and chapters schema`                                                                                                                                                                                                                                                                                                                            |
| 07   | db-indexing migration                    | `0956c1f`, `906b407`, `183cd17`, `25fad8e`, `fe8320d`, `70a6058`                                                                                                                                                                                                                                                                                                                                   |
| 08   | db-transactions migration                | `b25a6fa`, `5325eb4`, `ba89320`, `9d36777`                                                                                                                                                                                                                                                                                                                                                         |
| 09   | docs scaffold                            | `b273eca feat(docs): scaffold tanstack start + fumadocs app with neubrutalist dark theme`                                                                                                                                                                                                                                                                                                          |
| 10   | docs content model and landing page      | `42a2c8f feat(docs): add course structure, lesson pages and landing page`                                                                                                                                                                                                                                                                                                                          |
| 11   | player, chapters and build pipeline      | `201db8f feat(docs): embed motion canvas player with chapters and build pipeline`                                                                                                                                                                                                                                                                                                                  |
| 12   | lint, generator, production docs, README | `b043a26`, `8d2ac86`, `85c582c`, `7bbc5fc`, `5cdae08`, plus the commit that adds this summary (`git log -1`)                                                                                                                                                                                                                                                                                       |
| 13   | theme system core                        | `3d667c5 test(video-kit): freeze the current neubrutal look as golden values`, `a181920 test(snapshots): add quick six-frame capture and compare subset`, plus the commit that adds this section (`git log -1`)                                                                                                                                                                                    |
| 14   | theme catalogue and showcase             | `feat(video-kit): add six themes with dark and light variants`, `feat(video-kit): add theme-showcase lesson`, `feat(tools): add per-look snapshot runner and contact sheet`                                                                                                                                                                                                                        |
| 15   | render look and theme generator          | `feat(video-kit): add cli flag and config file for the render look`, `feat(tools): add studio launcher, new-theme generator and theme data sync`, `docs: add render-in-a-look page and theme swatches from theme data`                                                                                                                                                                             |
| 16   | docs voiceover notes and video tracker   | `241d176 refactor(docs): switch to stock fumadocs look with light and dark toggle`, `ed74118 feat(docs): add status tracking frontmatter and lesson data fields`, `42dd850 feat(docs): add voiceover notes, summary points and youtube description components`, `be08202 feat(docs): replace landing page with video tracker`, plus the commit that adds this section (`git log -1`); tag `v0.3.0` |

### Tech debt

- `apps/docs/src/generated` is git-ignored, so a fresh clone must run `pnpm sync` (or `pnpm dev` / `pnpm build`) before `pnpm check`; `pnpm check` itself does not sync.
- 70 `@typescript-eslint/consistent-type-imports` warnings remain. They are warnings by design; converting them would touch nearly every scene and kit file without changing behaviour.
- `apps/studio/src/scenes/db-indexing/sections/01-intro.tsx` still has its local `bigText`; it can switch to `stackedTitle` with no visual change.
- `db-transactions` sections 01 and 09 use `stackedTitle`; restyling them with the `slab` title style is a deliberate visual change and needs a new baseline.
- `s11_t52` (db-indexing) sits on a 0.35 s fade boundary: a live capture can land one frame late, so use a paused capture at 52.01 when it reports a mismatch.
- `TreeView` has no `dispose()`; `hide()` fades the root but leaves it attached.
- `pnpm dev` syncs generated data once. Editing `chapters.json` rebuilds the bundle but the docs chapter cards need a restart.
- `fmt` (`₹`, `en-IN`), `totalChip` and `coin` stay local to db-transactions; they are lesson copy, not kit API.
- Docs build prints two cosmetic Fumadocs CSS warnings (`::highlight(fd-search)`) and the `node:fs/promises` browser-externalization warning from `fumadocs-mdx`. The build and the page work.
- `new-lesson` requires a course folder with `meta.json`; it does not create a new course. `--chapters` only changes the skeleton, not the docs `###` note count after editing.
- The MP4 render is manual in the editor; there is no CI job that renders or uploads a video.
- `pnpm snap:quick` covers six of the 58 baseline frames. Step 14 ran the full 58-frame compare (58/58 PASS); later steps can use the quick subset unless a kit change touches more components.
- The two non-palette hexes in the old scenes are now `colors.pink` (`#FF5C7A`) and `colors.violet` (`#B7A0FF`); those two frames shift slightly. Exact parity needs a theme slot if it matters.
- `colors` is a Proxy over an empty target, so `Object.keys(colors)` is empty. Use `getTheme().colors` or `themes` when enumeration is needed.
- `apps/docs/src/generated/themes.json` is now the only palette source for the docs; `palette.json` is gone.
- `video.config.json` is read when the Vite server starts and the look line prints on every scene start (the editor restarts the scene once on load, so the console shows it twice). The project name, and therefore the MP4 name, is fixed at project load: reload after changing the hash.
- The `db-transactions` ACID inactive cards use scene-local `opacity(0.4)` and fixed strokes; they lose contrast in light themes and ignore `borderWidthScale` (see `## Theme issues in existing lessons`).
- The docs player sticks at `top-0` because Fumadocs 16's docs layout has no desktop top navbar. If a later Fumadocs version adds one, change the offset back to `top-16` and re-check the TOC.
- Both migrated lessons are `published` with no `youtube` or `recorded` value, because the old frontmatter had no explicit status and the old schema defaulted to published. Fill those fields when the uploads exist; `at` timestamps are empty until the final renders are timed.
- `grep -rniE "neubrutal" apps/docs/src` still matches the generated `themes.json`/`lessons.json` theme id and name. The docs code and CSS have no neubrutalist styling; the video theme id is `neubrutal`.

### Candidates for the kit

Collected in steps 07 and 08; none was moved because its geometry or copy is lesson-specific.

- `mkCell`: sorted-array row with the orange pointer dot (db-indexing 03).
- `mkPage`, the level pyramid and `bar`: page/fanout diagram sized to the 1920x1080 layout (db-indexing 05).
- comparison-table row (db-indexing 13).
- `mkRow`: fill-bar rows for the cost scene (db-indexing 16).
- `gotcha` panel (db-indexing 17); reusable shape, but tuned to five fixed gotchas.
- `stepList`: the four-row durability checklist (db-transactions 07).
- anomaly event card plus DB box pair (db-transactions 05).
- `ruleRow`: the three in-code rule rows (db-transactions 08).
- `formatCurrency`: `₹` with `en-IN` grouping, if a second lesson needs it.

`bigText` was a candidate in step 07 and is now covered by `stackedTitle` (step 08). `totalChip`, `coin` and `ANOMS` stay local: they are lesson copy, not reusable API.
