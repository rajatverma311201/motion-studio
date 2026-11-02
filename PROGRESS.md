# PROGRESS

Short current state. Full per-step history, checks and decisions: [PROGRESS-archive.md](./PROGRESS-archive.md).

## Current state

Repo layout (six parts):

- `apps/studio` — Motion Canvas editor and lesson scenes, one project per lesson, numbered section files (Vite 4).
- `apps/docs` — TanStack Start + Fumadocs site: tracker, lesson pages and production notes (Vite 8).
- `packages/video-kit` — themes, HUD, components and lesson factory; TypeScript source, no build step.
- `tools/scripts` — sync, generators, lesson status, studio launcher and repository dump.
- `tools/snapshots` — Playwright capture, pixel compare and the theme contact sheet.
- Root — `video.config.json` (default look), `pnpm-workspace.yaml`, `AGENTS.md`, `README.md`, this file and the archive.

Tags: `v0.1.0`, `v0.2.0`, `v0.3.0`.

- Docs gallery at `/themes`: all 14 video looks, a live preview of `theme-showcase`, and copy-ready command, `chapters.json` and `video.config.json` snippets.
- Course `Computer Organization` in the docs, with an overview, the `instruction-cycle` lesson and a glossary. The lesson has ten animated chapters; the page has summary points, per-chapter voiceover notes, a cheat sheet and four practice questions.
- Instruction-cycle measured chapter lengths: 22.7 s intro, 91.5 s memory, 107.8 s CPU parts, 68.8 s loading, 80.5 s fetch, 50.5 s decode, 103.5 s execute, 60.9 s full run, 123.2 s jumps, 40.2 s recap (targets 25 / 95 / 110 / 70 / 80 / 60 / 120 / 75 / 110 / 45, all within ±25 %).
- Docs video player: play/pause, restart and a filled seek bar for the selected chapter range; the controls stay visible in the sticky player after a chapter jump.

Commands:

- `pnpm dev` — sync generated data, then the studio bundle watcher and the docs dev server.
- `pnpm studio` — start the editor; add `--theme <id>` / `--mode dark|light` for this session.
- `pnpm studio:dev` — start the editor with no flags; the look comes from the lesson and config.
- `pnpm new:lesson <slug> "<Title>" --course <course>` — scaffold a lesson.
- `pnpm new:theme <id> "<Name>" --from <theme>` — copy and register a theme.
- `pnpm status` — print slug, status, duration and YouTube link for every lesson.
- `pnpm snap:quick` — capture and compare the six quick frames.
- `pnpm snap:themes` — two quick chapters × 14 looks; add `-- --only <id>`, `-- --mode dark|light` or `-- --full`.
- `pnpm check` — typecheck, lint, tests and Prettier check.
- `pnpm dump` — write `project-dump.md` with the tree and the contents of every text file.

## Decisions that still matter

- Two Vite versions: `apps/studio` is Vite 4 (the Motion Canvas plugin supports 4/5 only), `apps/docs` is Vite 8 (TanStack). Never share a Vite config, and `apps/studio/package.json` must not be `"type": "module"` (steps 01, 09).
- `apps/docs` never imports `.tsx` from `video-kit`; data crosses as JSON (`chapters.json` in, `lessons.json` / `themes.json` out) (step 09).
- The shell exports `NODE_ENV=production`, so `apps/docs/vite.config.ts` forces `development` for `vite dev` only; otherwise React's `jsxDEV` is undefined and SSR fails (step 09).
- `.meta` files are committed and never hand-edited. Only one editor page may be open: the editor rewrites `.meta` and hot-restarts the others, which is why Playwright runs sequentially (step 01).
- Look precedence, per field: URL hash > CLI flags > Motion Canvas variables > lesson `chapters.json` > `video.config.json` > built-in. Invalid values are skipped with a warning (step 15).
- The MP4 name is `<slug>.mp4` for the built-in look and `<slug>--<theme>--<mode>.mp4` otherwise; it is fixed at project load, so reload after changing the hash (step 15).
- `golden.test.ts` freezes the neubrutal dark palette; changing a token needs a deliberate golden update (step 13).
- Every section builds its own root and calls `leave(root)`; that is what makes `#s=N` and `startSection` work (step 06).
- `pnpm snap:quick` covers 6 of the 58 baseline frames. The full compare is not routine; run it only when a kit change touches many components (step 13).
- `colors` is a Proxy over an empty target; enumerate with `getTheme().colors` or `themes`, not `Object.keys(colors)` (step 13).
- Fonts must load at module scope through `loadFonts()`; otherwise Motion Canvas caches fallback metrics and the intro title shifts (step 07).
- The neubrutalist identity belongs to the videos only; `apps/docs` keeps the stock Fumadocs look with its light/dark toggle (step 16).
- The toy ISA is fixed in `packages/video-kit/src/cpu`; the tests freeze its micro-step ids, texts and traces. The lesson animates the model, never re-implements the rules (step 20).
- The `instruction-cycle` machine (`build.tsx`, `play.ts`) is lesson code for now. A generic version could move into the kit once a second architecture lesson needs it (step 20).
- Steps never run snapshot capture or compare (AGENTS.md section 7); the owner reviews in the editor.

## Tech debt and open items

- Build asset hashes change per build; never hardcode them (step 01).
- `tokenize()` needs every language table to end with the `[\s\S]` catch-all; otherwise the loop cannot advance (step 04).
- The plan cost regex `^\(cost[^)]*\)` consumes up to the first `)`, including `rows=` and `width=` when no earlier `)` exists; copied as-is, do not "fix" it (step 04).
- `index-tree.ts` caption casing is inconsistent (`COPIED`/`MOVES` vs "is copied"/"moves"); the test is case-insensitive (step 05).
- `TreeView` has no `dispose()`; `hide()` fades the root but leaves it attached (step 05).
- The docs may read `chapters.json` directly; keep `slug` equal to the project file name (step 06).
- Kit candidate `mkCell`: sorted-array row with the orange pointer dot (db-indexing 03) (step 07).
- Kit candidate `mkPage`, the level pyramid and `bar`: fanout diagram sized to 1920×1080 (db-indexing 05) (step 07).
- Kit candidate: comparison-table row (db-indexing 13) (step 07).
- Kit candidate `mkRow`: fill-bar rows for the cost scene (db-indexing 16) (step 07).
- Kit candidate `gotcha` panel (db-indexing 17): reusable shape, tuned to five fixed gotchas (step 07).
- Kit candidate `stepList`: four-row durability checklist (db-transactions 07) (step 08).
- Kit candidate: anomaly event card plus the DB box pair (db-transactions 05) (step 08).
- Kit candidate `ruleRow`: three in-code rule rows (db-transactions 08) (step 08).
- Kit candidate `formatCurrency` (`₹`, `en-IN`) when a second lesson needs it (step 08).
- `totalChip`, `coin` and `ANOMS` stay local: lesson copy, not kit API (step 08).
- db-indexing `01-intro.tsx` still has a local `bigText`; it can switch to `stackedTitle` with no visual change (steps 08, 16).
- The db-transactions intro uses `stackedTitle`; switching to the slab title is a deliberate visual change and needs a new baseline (step 08).
- `titleBlock({style: 'plain'})` uses a 160 px brand underline; may need per-theme tuning (step 13).
- db-transactions section 03 (ACID) in light themes: `opacity(0.4)` on inactive cards makes letters and pills nearly invisible; dim through `colors.mute`/`surf2` instead (step 14).
- db-transactions ACID cards use fixed `stroke`/`lineWidth`, so borderless themes still get outlines; fix locally with `borderWidth()`/`boxStyle()` (step 14).
- db-indexing sections 05/09/13 animate `stroke`/`lineWidth` on leaf highlights and ignore `borderWidthScale` in borderless themes (step 14).
- `apps/docs/src/generated` is git-ignored; a fresh clone must run `pnpm sync` (or `pnpm dev` / `pnpm build`) before `pnpm check` (step 16).
- About 70 `@typescript-eslint/consistent-type-imports` warnings remain by design (step 16).
- `s11_t52` sits on a 0.35 s fade boundary; a live capture can land one frame late, so use a paused capture at 52.01 (steps 07, 16).
- `pnpm dev` syncs once; editing `chapters.json` rebuilds the bundle but the docs chapter cards need a restart (step 16).
- The docs build prints two cosmetic Fumadocs CSS warnings plus a `node:fs/promises` browser-externalization warning; build and page work (steps 09, 16).
- `new-lesson` needs a course folder with `meta.json`; it does not create a new course (step 16).
- The MP4 render is manual in the editor; no CI job renders or uploads a video (step 16).
- Two non-palette hexes map to `colors.pink`/`colors.violet`; two frames shift slightly, exact parity needs a theme slot (step 16).
- The docs player sticks at `top-0` because Fumadocs 16 has no desktop top navbar; if one appears, use `top-16` and re-check the TOC (step 16).
- `instruction-cycle` is `status: animated`, `duration: TBD`; the MP4 render, timestamps and voiceover are still to do.
- The toy flag model is simplified: `LOAD` also sets Z, while real CPUs usually set flags from arithmetic or compare instructions (step 20).
- The `Machine` helpers (`build.tsx`, `play.ts`) are candidates for the kit; they compose the kit primitives but are specific to this lesson (step 20).
- The docs player reads the Motion Canvas player's internal `player` property for `requestSeek` and `togglePlayback`; the package exposes no seek API. The smoke test guards it, but re-check after upgrading `@motion-canvas/player`.

## Blocked

None.
