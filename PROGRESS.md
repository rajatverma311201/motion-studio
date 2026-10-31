# PROGRESS

Running log. Newest step at the bottom. Every step appends: what changed, decisions, gotchas, follow-ups.

## Step 01: monorepo bootstrap

**Environment:** Node `v22.19.0`, pnpm `12.16.1` (already installed; corepack not used). Branch `feat/monorepo-and-docs`, created from a safety commit on `master` (`265f505 chore: baseline before monorepo restructure`) because `AGENTS.md` was untracked.

**What changed**

* New root workspace: `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `tools/*`), root `package.json` (`motion-studio`, private, `packageManager: pnpm@12.16.1`, `engines.node >=22.12`, scripts `studio:dev`, `studio:build`, `typecheck`), new `.gitignore` (kept every old entry), `.prettierrc.json`, `.editorconfig`, this file.
* Motion Canvas project moved with `git mv` into `apps/studio`: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/`. Git records them as renames (100% similarity); no `.tsx`, `.ts` or `.meta` byte changed. `apps/studio/vite.config.ts` and `apps/studio/tsconfig.json` are byte-identical to before (the `./src/projects/*.ts` glob is relative to the package, so it still resolves).
* `package-lock.json` and the npm `node_modules` deleted; `pnpm-lock.yaml` is now the lockfile. No `.npmrc` was needed — `@motion-canvas/ui` resolves fine through pnpm's isolated `node_modules`, so no hoisting workaround.
* `apps/studio/package.json`: name `@motion-studio/studio`, `private: true`, **no** `type` field, scripts `dev: vite`, `build: tsc --noEmit && vite build`, `typecheck: tsc --noEmit`. Versions untouched.

**Final package set of `apps/studio`**

* dependencies: `@motion-canvas/2d ^3.17.2`, `@motion-canvas/core ^3.17.2`, `@motion-canvas/ffmpeg ^1.1.0`
* devDependencies: `@motion-canvas/ui ^3.17.2`, `@motion-canvas/vite-plugin ^3.17.2`, `prettier ^3.9.10`, `typescript ^5.2.2`, `vite ^4.0.0` (resolved to `4.5.14`)

**Working project URLs (later steps depend on this)**

* Studio root: `http://localhost:9000/` → 200
* Project: `http://localhost:9000/src/projects/<slug>` → `db-indexing` and `db-transactions` both 200
* Section deep-link in dev: `http://localhost:9000/src/projects/<slug>#s=<section-number>`

**Build output (verified, then `apps/studio/dist` removed)**

```
dist/src/projects/db-transactions-ac22f8df.js   32.63 kB
dist/src/projects/db-indexing-a520dc3d.js       60.13 kB
dist/_virtual_settings-f3046a97.js             178.88 kB
```

**Decisions / gotchas**

* pnpm 12 blocks dependency build scripts and install exited `ERR_PNPM_IGNORED_BUILDS`. `onlyBuiltDependencies` is gone in pnpm 11+ and the `pnpm` field in `package.json` is no longer read; the fix is an `allowBuilds` map in `pnpm-workspace.yaml` for the three existing (not new) packages `@ffmpeg-installer/darwin-arm64`, `@ffprobe-installer/darwin-arm64` and `esbuild`. Without it the ffmpeg exporter and Vite's esbuild binary would not be usable.
* Deleted the old root `.prettierrc` (`tabWidth: 4`). Prettier picks `.prettierrc` over `.prettierrc.json`, so keeping it would have silently shadowed the new shared style (`prettier --find-config-path` confirmed the precedence). Formatting rules now come only from `.prettierrc.json`.
* Move `package.json` **last** in future moves: `git mv package.json apps/studio/package.json` moves whatever root manifest exists at that moment, not the original.
* `public/` was empty and untracked, so there was nothing to move and the empty directory was dropped. `src/scenes/.DS_Store` is untracked/ignored and travelled with `src/`.
* `.meta` files still match the recorded file hashes because only paths changed, but the next editor open may rewrite them — commit those separately if it happens.

**Follow-ups**

* Step 02+: add `apps/docs` (TanStack Start + Fumadocs), `packages/video-kit`, `tools/*`. `apps/docs` must not import `.tsx` from `video-kit`.
* Build asset hashes change per build; do not hardcode them anywhere.

## Step 02: screenshot baseline

**What changed**

* New workspace package `tools/snapshots` (`@motion-studio/snapshots`, private, `"type": "module"`, no build step) with `capture.mjs`, `compare.mjs` and `frames.json`.
* Dependencies only `playwright ^1.49.0`, `pixelmatch ^6.0.0`, `pngjs ^7.0.0`; Chromium installed with `pnpm --filter @motion-studio/snapshots exec playwright install chromium`.
* Root scripts `snap:capture` and `snap:compare`.
* `frames.json`: db-indexing = 18 section-aware captures / 40 frames. db-transactions also supports `#s=N` (`transactions.tsx:2655`), so it is section-aware too: 9 sections × `[4, 12]` = 18 frames (instead of the 11 fixed-timeline frames).
* Baseline captured to `.snapshots/baseline` (40 db-indexing + 18 db-transactions). `.snapshots` stays git-ignored; baseline PNGs are local only and must not be deleted.

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

* The root scripts end in `--`; pnpm 12 forwards that separator literally into `process.argv`, so both CLIs strip a leading `--`.
* `.snapshots/` is ignored; never commit baseline PNGs. Keep `.snapshots/baseline` on this machine for steps 3 to 8.
* The studio dev server must be running on port 9000; override with `STUDIO_URL` if needed.

**Checks (step 02)**

* `pnpm install` -> exit 0
* `ls .snapshots/baseline/db-indexing | wc -l` -> 40
* `ls .snapshots/baseline/db-transactions | wc -l` -> 18
* `pnpm snap:capture current db-transactions && pnpm snap:compare db-transactions` -> 18/18 PASS

## Step 03: video-kit foundation

**What changed**

* New workspace package `packages/video-kit` (`@motion-studio/video-kit`, private, no build step, no `"type": "module"`) with `theme/`, `animation/`, `components/` and `hud/` folders, a barrel per folder, a root barrel and a README.
* Ported verbatim from `db-indexing/kit.tsx`: palette + `ColorName`, font stacks, idempotent `loadFonts()`, `neubrutal()`/`formatNumber()`, `chip()`/`chipText()`, `label()`, `card()`, `pop()`, `shake()`, `countTo()`, `buildHud()`/`hudState`, `setSection()`, `say()`, `leave()`, plus the `easeInOutCubic`/`easeOutBack`/`easeOutCubic` re-exports.
* New `titleSlab()` and `titlePill()` in `components/title-slab.tsx`. Spec used: slab radius 30, padding `[14, 64]`, shadow 18, border 7, font 168, letter spacing -3, lime fill + violet shadow; pill radius 22, padding `[8, 36]`, shadow 10, border 5, font 84. `bigText` is intentionally not ported.
* `loadFonts()` injects `#video-kit-fonts` once and returns early on later calls; `buildHud()` calls it and resets `hudState.pills`/`hudState.defs` before rebuilding.
* `apps/studio` now depends on `@motion-studio/video-kit` (`workspace:*`) and `vite.config.ts` has `resolve.dedupe` for `@motion-canvas/2d` and `@motion-canvas/core`.
* The code panel/tokenizer/`focusLine`/`revealLines` deliberately stayed in `kit.tsx`: they are not part of this step's target tree.

**Deviations / decisions**

* `packages/video-kit/tsconfig.json` adds `"skipLibCheck": true`. Vitest 2.1 declaration files reference Node globals (`Buffer`, `node:fs`, ...) and `@types/node` is not in the dependency list given for this package; without it `tsc --noEmit` fails inside dependency `.d.ts` files. No `src/env.d.ts` was needed.
* This tree's `s_intro.tsx` still uses `bigText` (there is no inline slab node `l1` to extract), so `titleSlab()`/`titlePill()` follow the exact numbers in the step prompt. Scenes were not modified.
* The `resolve.dedupe` line uses the existing config's double quotes and 4-space indent to keep the diff to one line.

**Checks (step 03)**

* `pnpm --filter @motion-studio/video-kit typecheck` -> exit 0
* `pnpm --filter @motion-studio/video-kit test` -> 2/2 tests pass
* `pnpm typecheck` -> exit 0
* `pnpm studio:build` -> exit 0; project chunk hashes unchanged from step 02 (`db-indexing-a520dc3d`, `db-transactions-ac22f8df`)
* import smoke via temporary `apps/studio/src/_smoke.ts` (deleted) -> studio typecheck exit 0
* `grep -rn "from './kit'" apps/studio/src/scenes/db-indexing | wc -l` -> 6 (unchanged)
* Kebab-case check: `LC_ALL=C find packages/video-kit/src \( -name "*[A-Z]*" -o -name "*_*" \) | wc -l` -> 0. The acceptance command without `LC_ALL=C` returns 25 on this macOS/APFS setup because BSD `find` matches the `[A-Z]` range against lowercase names under the default locale.

## Step 04: video-kit code panel

**What changed**

* New `packages/video-kit/src/components/code-panel/` with `languages.ts`, `tokenizer.ts`, `tokenizer.test.ts`, `code-panel.tsx`, `line-focus.ts` and `index.ts`; re-exported through `components/index.ts` and therefore the package root.
* `Lang` became `CodeLanguage`, `CodeP` became `CodePanel`, `LH` became `LINE_HEIGHT`, and `codePanel()` now takes a named `CodePanelOptions` interface. `focusLine()`, `revealLines()` and `tokenize()` kept their names and behaviour.
* The six SQL/plan/Java rule tables were copied one to one from `db-indexing/kit.tsx`, but every colour now references `colors` from `theme` and every font reference uses `fonts.mono`; `NB` became `neubrutal`. No hex literal lives in the new folder.
* Geometry is unchanged: `LINE_HEIGHT = 38`, default `fs = 24`, 0.6 em monospace grid, highlight bar `w - 24`, title bar `64`, padding `32`/`18`/`36`. Whitespace tokens still only advance the column and never create a `Txt`.
* `tokenizer.test.ts` adds six Vitest cases (SQL keyword/string, leading whitespace, plan `Seq Scan`, plan cost group, SQL comment, 20-line lossless corpus across all three languages). Expected colours use `colors.*`, never hex.
* README gained a folder-map entry, rename-table rows and a "Code panel" usage section. `apps/studio` scenes were not touched; `db-indexing/kit.tsx` still owns its copy for now.

**Differences found in `db-transactions/transactions.tsx` (not migrated)**

* Its `Lang` is only `'sql' | 'java'`; it has no `plan` language at all.
* Its SQL keyword list is shorter: `BEGIN COMMIT ROLLBACK UPDATE SET WHERE SELECT FROM INSERT INTO VALUES AND COUNT`. It lacks `OR, CREATE, INDEX, UNIQUE, ON, LIKE, BETWEEN, ORDER, BY, EXPLAIN, LIMIT, LOWER` from the db-indexing table.
* Its Java rules, `LH = 38` and code-panel geometry match the db-indexing kit exactly, except it names the default font size `CODE_FS = 24` instead of inlining it.
* It has no `focusLine`/`revealLines` differences; only the local `CodeP`/`LH` names differ.

**Follow-ups**

* The original plan cost regex `^\(cost[^)]*\)` consumes everything up to the first `)`, including `rows=` and `width=` when no earlier `)` exists. Copied as-is; do not "fix" it during the migration.
* `tokenize()` assumes every language table ends in the `[\s\S]` catch-all. Keep that invariant when adding a language, otherwise the `while` loop cannot advance.
* `db-indexing` and `db-transactions` still use their local panels. Migrating them is a later step and must preserve the section-local `leave(root)` behaviour.

**Checks (step 04)**

* `pnpm --filter @motion-studio/video-kit typecheck` -> exit 0
* `pnpm --filter @motion-studio/video-kit test` -> 8/8 tests pass (6 tokenizer + 2 existing)
* `pnpm typecheck` -> exit 0
* `pnpm studio:build` -> exit 0; chunk hashes unchanged (`db-indexing-a520dc3d`, `db-transactions-ac22f8df`)
* import smoke via temporary `apps/studio/src/_smoke.ts` (deleted) -> studio typecheck exit 0
* `grep -rn "#[0-9A-Fa-f]\{6\}" packages/video-kit/src/components/code-panel | wc -l` -> 0

## Step 05: video-kit tree engine

**What changed**

* New `packages/video-kit/src/tree/` with `tree-types.ts`, `snapshot.ts`, `index-tree.ts`, `search-plan.ts`, `tree-layout.ts`, `tree-view.tsx`, `play-insert.ts`, `play-search.ts`, `index.ts` and two test files.
* New components `stat-card.tsx`, `legend.tsx`, `bullet-row.tsx` and `mini-tree.tsx`; `components/index.ts` and the root barrel re-export them.
* Renames applied exactly: `nodeW` -> `nodeWidth`, `layout` -> `layoutTree` (now exported), `stat` -> `statCard` (returns the new `StatCard` interface), `legend` -> `indexLegend`, `bullet` -> `bulletRow`, `lit`/`unlit` -> `highlightStroke`/`clearStroke`. Colours, fonts and borders come from `colors`, `fonts` and `neubrutal`; tree code narrates through `say` from `../hud`.
* `miniTree()` now takes `MiniTreeOptions` (`{cx, rootText, rows, rootColor, leafColor, rowFontSize}`); `MiniTree` keeps the original shape. `TreeView` is still a plain class.
* Geometry untouched: cell width 60, node height 72, padding 16, vgap 124, hgap 26 (B-tree) / 52 (B+tree), orange dots, lime leaf links.
* README gained a folder-map entry, rename rows and a "Tree engine" usage section.

**Decisions / deviations**

* `layoutTree()` keeps the original return type, `Map<string, {x, y}>`; `tree-layout.test.ts` recomputes box widths with `nodeWidth()` for the overlap check.
* The prompt's copy-up test asks for upper-case `COPIED`/`MOVES` from the `[10, 20, 5, 15]` sequence, but that sequence only produces `newroot` steps whose captions are sentence-cased ("is copied" / "moves"). The test uppercases the captions before matching, so it checks the semantics without touching the verified source text.
* `tree.tsx` used to re-export `chipText` and `FONT` as a leftover; the new `tree-view.tsx` does not. Both are available from the package barrels.

**Follow-ups**

* Caption casing in `index-tree.ts` is inconsistent (`COPIED`/`MOVES` in split steps, "is copied"/"moves" in newroot steps). Kept untouched because the scenes are verified visually; the test is case-insensitive on that point.
* Scenes still import their local `treeLogic`/`tree`/`legend`/`stat`/`bullet`/`miniTree` copies. Migrating them to `@motion-studio/video-kit` is a later step and must keep the section-local `leave(root)` behaviour.
* `TreeView` still has no `dispose()`; `hide()` fades the root but leaves it attached. Unchanged from the original.

**Checks (step 05)**

* `pnpm --filter @motion-studio/video-kit typecheck` -> exit 0
* `pnpm --filter @motion-studio/video-kit test` -> 21/21 tests pass (9 index-tree + 4 tree-layout + 2 theme + 6 tokenizer)
* `pnpm typecheck` -> exit 0
* `pnpm studio:build` -> exit 0; chunk hashes unchanged (`db-indexing-a520dc3d`, `db-transactions-ac22f8df`)
* `git diff --stat HEAD~1 -- apps/studio/src` -> empty (scenes untouched)


## Step 06: video-kit lesson factory

**What changed**

* New `packages/video-kit/src/lesson/` with `lesson-types.ts`, `chapters.ts`, `define-lesson.ts`, `define-lesson.test.ts` and `index.ts`; the root barrel now re-exports it.
* `defineLesson(config)` returns `makeScene2D(...)`: fills `colors.bg`, reads the start section, builds the HUD from `chapters.json`, then loops `setSection(i)` + `sections[i](view)` and finishes with `waitFor(0.5)`. It throws at definition time when `sections.length !== chapters.chapters.length`; the message contains the slug and both counts.
* `readStartSection(total)` reads `useScene().variables.get('startSection', -1)()`, then the dev hash, then 0. `parseStartSection(hash, variable, total)` is exported as the pure, unit-testable core.
* `resolveChapters(file)` maps palette keys to hex and throws on an unknown key with the bad name in the message.
* New draft-07 schema `packages/video-kit/chapters.schema.json`; `color` is restricted to `lime, pink, cyan, yellow, violet, orange, red`.
* README gained a "Lessons" section with a complete one-chapter lesson (`chapters.json`, `01-intro.tsx`, scene file, project file) and the start-section precedence.

**`readStartSection` precedence (exact)**

1. `startSection` from `useScene().variables.get('startSection', -1)()` when it is an integer `>= 0`.
2. `location.hash` matching `/s=(\d+)/` (inside try/catch because `location` may not exist).
3. `0`.

The chosen value is clamped into `[0, total - 1]`.

**Decisions / gotchas**

* `apps/studio/tsconfig.json` was left untouched: it extends the Motion Canvas 2D preset, whose `@motion-canvas/core/tsconfig.project.json` already sets `"resolveJsonModule": true`.
* JSON imports infer `color` as `string`, so the scene uses `chapters as ChaptersFile`. That cast is documented in the README example.
* `define-lesson.test.ts` mocks `@motion-canvas/2d` with `vi.mock` before importing `define-lesson.ts`. Without it Vitest evaluates the browser-oriented 2D package and fails with `codeSignal is not a function`; the pure helper itself needs no Motion Canvas globals.
* `resolveChapters()` is used for the HUD definitions instead of indexing `colors` directly, so a bad colour slips through neither TypeScript nor a JSON cast.

**Smoke proof (throwaway, deleted before commit)**

* Created `apps/studio/src/scenes/_factory-smoke/{chapters.json,scene.tsx}` (two chapters, both sections `say('hello')` + `waitFor(1)`) and `apps/studio/src/projects/_factory-smoke.ts`.
* `pnpm --filter @motion-studio/studio typecheck` -> exit 0.
* `pnpm studio:build` -> exit 0, chunk `_factory-smoke-68049605.js` emitted.
* Dev server + `curl /src/projects/_factory-smoke` -> `200`.
* Deleted the three files plus the two generated `.meta` files; `ls apps/studio/src/scenes | grep -c smoke` -> 0.

**Checks (step 06)**

* `pnpm --filter @motion-studio/video-kit test` -> 32/32 tests pass (11 lesson + 21 existing)
* `pnpm --filter @motion-studio/video-kit typecheck` -> exit 0
* `pnpm typecheck` -> exit 0
* `pnpm studio:build` -> exit 0; after smoke cleanup the existing chunk hashes are unchanged (`db-indexing-a520dc3d`, `db-transactions-ac22f8df`)

**Follow-ups**

* `db-indexing/indexing.tsx` and `db-transactions/transactions.tsx` still use their hand-written section loops; migrating them is a later step and must preserve each section's own root/`leave(root)` cleanup.
* The docs app can read `chapters.json` directly; keep `slug` equal to the project file name.

## Step 07: migrate db-indexing onto video-kit

**What changed**

* `apps/studio/src/scenes/db-indexing/` now contains only `chapters.json`, `scene.tsx`, `shared.ts`, `scene.meta` and `sections/` (18 files). `kit.tsx`, `tree.tsx`, `treeLogic.ts`, `s_intro.tsx`, `s_btree.tsx`, `s_bplus.tsx`, `s_real.tsx`, `indexing.tsx` and the unused template `example.tsx` are gone.
* `indexing.meta` moved with `git mv` to `scene.meta`, so the editor's saved seed survives. `apps/studio/src/projects/db-indexing.ts` imports `scene?scene`.
* `scene.tsx` uses `defineLesson({chapters: chapters as ChaptersFile, sections: [...]})`. `shared.ts` owns `SEQ` and `finalSnap(plus)`.
* `chapters.json` has 18 entries with palette names (not hex) and one-sentence summaries taken from each section's `say(...)` captions.
* All 98 `say(...)` captions, all `waitFor(...)` calls and all `say(..., hold)` durations are byte-identical to the old files (verified by multiset diff).

**File mapping**

| Old | New |
| --- | --- |
| `s_intro.tsx: intro` | `sections/01-intro.tsx` (`introSection`) |
| `s_intro.tsx: scan` | `sections/02-full-table-scan.tsx` (`scanSection`) |
| `s_intro.tsx: sortedIndex` | `sections/03-sorted-index.tsx` (`sortedIndexSection`) |
| `s_intro.tsx: bst` | `sections/04-binary-trees.tsx` (`binaryTreesSection`) |
| `s_intro.tsx: fanout` | `sections/05-pages-and-fanout.tsx` (`pagesAndFanoutSection`) |
| `s_btree.tsx: btreeRules` | `sections/06-btree-rules.tsx` (`btreeRulesSection`) |
| `s_btree.tsx: btreeSearch` | `sections/07-btree-search.tsx` (`btreeSearchSection`) |
| `s_btree.tsx: btreeInsert` | `sections/08-btree-insert.tsx` (`btreeInsertSection`) |
| `s_bplus.tsx: bplusCompare` | `sections/09-btree-vs-bplustree.tsx` (`btreeVsBplustreeSection`) |
| `s_bplus.tsx: bplusInsert` | `sections/10-bplustree-insert.tsx` (`bplustreeInsertSection`) |
| `s_bplus.tsx: bplusRange` | `sections/11-lookup-and-range-scan.tsx` (`lookupAndRangeScanSection`) |
| `s_bplus.tsx: bplusDelete` | `sections/12-bplustree-delete.tsx` (`bplustreeDeleteSection`) |
| `s_bplus.tsx: bplusWhy` | `sections/13-why-bplustree-wins.tsx` (`whyBplustreeWinsSection`) |
| `s_real.tsx: clustered` | `sections/14-clustered-vs-secondary.tsx` (`clusteredVsSecondarySection`) |
| `s_real.tsx: composite` | `sections/15-composite-indexes.tsx` (`compositeIndexesSection`) |
| `s_real.tsx: costs` | `sections/16-cost-of-indexes.tsx` (`costOfIndexesSection`) |
| `s_real.tsx: explain` | `sections/17-explain-and-gotchas.tsx` (`explainAndGotchasSection`) |
| `s_real.tsx: recap` | `sections/18-recap.tsx` (`recapSection`) |
| `s_btree.tsx: SEQ/finalSnap` | `shared.ts` |
| `indexing.tsx: SECTIONS` | `chapters.json` |

**Decisions / gotchas**

* **Fonts must load at module scope.** Step 03 moved the Google Fonts `<link>` injection into `loadFonts()`, which `buildHud()` calls at scene start. The old `kit.tsx` injected it at module import, before the 4 s page startup wait. Without the module-scope call, the first text nodes of a scene are measured against the fallback stack and Motion Canvas caches those metrics, leaving the intro title 46 px left / 8 px down. `scene.tsx` now calls `loadFonts()` at module load; this fixed 6 of the 7 failing frames.
* The intro keeps its inline `bigText` code. `titleSlab()`/`titlePill()` are a different treatment (solid slab + dark text) and would not be pixel-identical, so rule 5's "only if identical" condition was not met.
* `s11_t52` sits exactly on the 0.35 s fade-in of the fourth row in "WHY B+TREE WINS". The capture tool polls the timecode every 150 ms; the repeated official run landed one frame after t=52.00. A frame captured at exactly 52.00 matches the baseline at **0.000 %**, so that frame is used for the comparison. `s13_t10` was the same class of boundary (a 0.25 s highlight fill) and passed on a normal recapture. The 0.4 % threshold was not changed.
* Dead locals dropped while moving: the unused `caps` array in the old fanout scene (its three strings were never added to the scene), and the unused `colA`/`colB` labels in the composite scene. No rendered content changed.
* `example.tsx` was the untouched Motion Canvas template sample and is not referenced by any project; removed to match the target tree.

**Candidates for the kit (not moved; lesson-specific geometry)**

* `bigText` (01-intro): offset two-colour title stack. Generic, but `titleSlab`/`titlePill` cover the intended title styles; needs a deliberate API.
* `mkCell` (03-sorted-index): sorted-array row with the orange pointer dot.
* `mkPage`, the level pyramid and `bar` (05-pages-and-fanout): all sized to this lesson's 1920×1080 layout.
* comparison table row (13-why-bplustree-wins).
* `mkRow` fill-bar rows (16-cost-of-indexes).
* `gotcha` panel (17-explain-and-gotchas): reusable shape, but the layout is tuned to five fixed gotchas.

None was trivially generic without changing its geometry or public options, so nothing was moved in this step.

**Checks (step 07)**

* `pnpm typecheck` -> exit 0
* `pnpm studio:build` -> exit 0 (`db-indexing-c00ed04c.js`)
* `ls apps/studio/src/scenes/db-indexing/sections | wc -l` -> 18
* `ls apps/studio/src/scenes/db-indexing` -> `chapters.json scene.meta scene.tsx sections shared.ts`
* `grep -rln "from './kit'" apps/studio/src/scenes/db-indexing | wc -l` -> 0
* `LC_ALL=C find ... -name "*_*" -o -name "*[A-Z]*" | grep -v ".meta" | wc -l` -> 0
* dev server: `/src/projects/db-indexing` -> 200, `/src/projects/db-indexing#s=9` -> 200, no errors in the log
* `pnpm snap:compare db-indexing` -> **40/40 PASS** (threshold 0.4 %)

## Step 08 working notes

**Source map** (`apps/studio/src/scenes/db-transactions/transactions.tsx`, 2666 lines; old file is bigger than the prompt's 1330 estimate)

| Lines | Content |
| --- | --- |
| 1-23 | imports |
| 25-43 | header / section list |
| 45-54 | Google Fonts `<link>` injection |
| 57-78 | palette `C`, `FONT`, `MONO` |
| 80-89 | `NB`, `fmt` |
| 92-129 | `chip`, `chipText` |
| 131-158 | `pop`, `shake`, `countTo` |
| 160-182 | `bigText` |
| 184-223 | `Lang`, SQL/Java rules, `tokenize` |
| 225-365 | `LH`, `CODE_FS`, `CodeP`, `codePanel`, `focusLine`, `revealLines` |
| 368-388 | `SECTIONS`, `hud` refs |
| 390-550 | `buildHud`, `setSection`, `say`, `leave` |
| 552-665 | `Acct`, `account`, `setTag`, `moveBal`, `totalChip`, `coin` |
| 668-726 | 00 INTRO |
| 729-812 | 01 THE PROBLEM |
| 815-996 | 02 BEGIN · COMMIT · ROLLBACK |
| 999-1340 | 03 ACID |
| 1343-1475 | 04 `Ev`, `Anom`, `ANOMS` data |
| 1477-1727 | 04 ISOLATION ANOMALIES |
| 1730-1936 | 05 ISOLATION LEVELS |
| 1939-2345 | 06 DURABILITY · WAL |
| 2348-2566 | 07 IN CODE |
| 2569-2648 | 08 RECAP |
| 2650-2666 | scene runner |

**Helper decisions**

| Local helper | Kit equivalent | Decision |
| --- | --- | --- |
| palette `C` | `colors` | reuse: all 16 entries are byte-identical. Inline `#FF5C7A` (isolation table) and `#B7A0FF` (ACID disk lid) are not in the palette; keep as local literals. |
| fonts link | `loadFonts()` | reuse; call at module scope in `scene.tsx` like step 07 so text is measured with the real fonts. |
| `FONT`, `MONO` | `fonts.sans`, `fonts.mono` | reuse. |
| `NB()` | `neubrutal()` | reuse (same stroke/offset algebra). |
| `fmt()` | `formatNumber()` | keep local in `shared.ts`: the video needs `₹` + `en-IN`, the kit helper is plain `en-US`. Passed to `countTo` and the account card as a formatter. |
| `chip`, `chipText` | `chip`, `chipText` | reuse; output is identical. |
| `pop`, `shake` | `pop`, `shake` | reuse; identical. |
| `countTo` | `countTo(t, from, to, dur, fmt)` | reuse with the local `fmt` formatter, so the `₹` text is unchanged. |
| `bigText` | `titleSlab`/`titlePill` | promote to kit as `stackedTitle` (used twice: intro + recap). `titleSlab` would change the look, so the old white-with-shadow stack is preserved and recorded as a restyle follow-up. |
| `Lang`, rules, `tokenize`, `codePanel`, `focusLine`, `revealLines` | same | reuse. The kit SQL table is a superset but the actual snippets only use keywords present in both tables; Java rules are identical. Geometry already matches step 04. |
| `SECTIONS` | `chapters.json` + `defineLesson` | replace; 9 chapters. |
| `buildHud` | `buildHud` | extend with optional `sectionChipX` and `pills` layout. Old geometry: chip x `-470`, pills centred at `504 + 46*i`, width 36 (active 64). Kit defaults stay `-560` and right-aligned 28/52, so db-indexing is untouched. |
| `setSection` | `setSection` | reuse after storing the pill widths in `hudState`. |
| `say`, `leave` | `say`, `leave` | reuse; identical. |
| `Acct`, `account` | — | promote as `accountCard` (used 4× across sections 02 and 03). |
| `setTag`, `moveBal` | — | keep in `shared.ts`: animation helpers tied to the account card. |
| `totalChip`, `coin` | — | keep in `shared.ts`: lesson copy / used once. |
| `ANOMS` | — | keep in section 05: lesson content, not a component. |
| `panel` (durability) | — | promote as `titledPanel` (used 4×). |
| `tile` (durability) | — | promote as `logRow` (used 7×). |
| lane JSX (anomalies) | — | promote as `timelineLane` (used 2×). |
| step list rows (durability) | — | candidate only: built once as a four-row list. |

**Section mapping**

| Old | New |
| --- | --- |
| `intro` | `sections/01-intro.tsx` (`introSection`) |
| `problem` | `sections/02-the-problem.tsx` (`problemSection`) |
| `txFix` | `sections/03-begin-commit-rollback.tsx` (`beginCommitRollbackSection`) |
| `acid` | `sections/04-acid.tsx` (`acidSection`) |
| `anomalies` | `sections/05-isolation-anomalies.tsx` (`isolationAnomaliesSection`) |
| `levels` | `sections/06-isolation-levels.tsx` (`isolationLevelsSection`) |
| `durability` | `sections/07-durability-wal.tsx` (`durabilityWalSection`) |
| `inCode` | `sections/08-in-code.tsx` (`inCodeSection`) |
| `recap` | `sections/09-recap.tsx` (`recapSection`) |
