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
