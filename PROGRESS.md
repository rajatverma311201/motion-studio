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
- Course `Security Basics` in the docs, with two vertical Shorts and a glossary. The player renders Shorts at 9:16 and the tracker shows a `SHORT` badge.
- `JWT in 60 Seconds` (slug `jwt-short`, 1080 × 1920, six chapters): three dotted parts, Base64URL, the HMAC signature and tampering.
- `Encoding vs Signing vs Encryption in 60 Seconds` (slug `encode-sign-encrypt-short`, 1080 × 1920, five chapters, about 55 s): one message is Base64-encoded, HMAC-signed and AES-GCM-encrypted, with an encoding/signing/encryption verdict. Docs page, glossary terms and course cards are in place.
- Step 23 kit additions: `crypto-demo/` fixtures verified with `node:crypto`, `scrambleFrame` / `scrambleText`, `textMorphCard` and `verdictRow`.
- Full landscape lesson `JWT Explained` (slug `jwt`, 1920 × 1080, eleven chapters, about 10 minutes planned): intro, sessions vs tokens, anatomy, Base64URL, encode/sign/encrypt, HS256 signing, keys and JWKS, claims, Quarkus practice, pitfalls and recap. The docs page has summary points, per-chapter voiceover notes, the decoded token and both signatures, a cheat sheet, four practice questions and the YouTube description.
- Shorts support in the kit: `ChaptersFile.format`, `buildShortHud` with a chapter progress bar, `SHORT_ZONES` / `progressSegments` / `readSeconds` (pure and tested), and the JWT pieces: pure Base64URL and token parsing, fixtures verified against Node's `crypto`, `tokenStrip`, `hmacMachine`, `keyIcon`, `lockIcon`, `stamp` and `slam`.
- Step 22 kit additions: `base64Steps` / `base64Alphabet` / `toUrlSafe`, `validateClaims` and `REGISTERED_CLAIMS`, the generated ES256 fixture (`ES256_TOKEN`, `ES256_JWK`, `ES256_HEADER_JSON`), `sequenceDiagram` / `sequenceLayout`, `compareTable` / `tableLayout` / `wrapGrid`, `base64Visual`, `timeBar` / `timeToX`, the `properties` and `http` code languages, and `pillRow` (the HUD pill arithmetic, pure and tested).

Commands:

- `pnpm dev` — sync generated data, then the studio bundle watcher and the docs dev server.
- `pnpm studio` — start the editor; add `--theme <id>` / `--mode dark|light` for this session.
- `pnpm studio:dev` — start the editor with no flags; the look comes from the lesson and config.
- `pnpm new:lesson <slug> "<Title>" --course <course> [--format short]` — scaffold a lesson; `short` writes a 1080 × 1920 project meta.
- `pnpm new:theme <id> "<Name>" --from <theme>` — copy and register a theme.
- `pnpm gen:jwt-fixtures` — regenerate `jwt-es256-fixture.ts` from a fresh P-256 key pair; only the public JWK is written.
- `pnpm status` — print slug, format (`SHORT`), status, duration and YouTube link for every lesson.
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
- The HUD pill x positions now come from `pillRow(count, options)`. With no options it reproduces the old right-aligned row exactly; the JWT lesson passes `{startX: 290, step: 60, width: 30, activeWidth: 64}` for its eleven pills. `pill-geometry.test.ts` checks bounds, spacing and clearance from the section chip.
- The `encode-sign-encrypt-short` layout test mirrors `SHORT_ZONES` locally. Importing the kit barrel under `node --import tsx` loads Motion Canvas and fails (`codeSignal is not a function`); keep the copy in sync with `hud/short-layout.ts` (step 23).
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
- A Short's project `.meta` is written by `new:lesson --format short` with `shared.size` 1080 × 1920. This is the one allowed `.meta` write: the portrait HUD must measure the canvas before the editor first opens the project; afterwards the editor owns the file (step 21).
- `instruction-cycle` is `status: animated`, `duration: TBD`; the MP4 render, timestamps and voiceover are still to do.
- `jwt-short` is `status: animated`, `duration: TBD`; the MP4 render, timestamps, voiceover and the phone check of the Shorts safe zones are still to do.
- `jwt` is `status: animated`, `duration: TBD`; chapter lengths are planned from the waits, not measured. All eleven `at` values are `0:00` placeholders; replace them after the first render. The MP4 and voiceover are still to do.
- The signing chapter shows `header.payload` as the machine MESSAGE rather than the full 165-character signing input; the full input is represented by the chip above the machine. A wider machine or a truncated display would be needed to show the literal string.
- `sequenceDiagram` uses a fixed 76 px message row from the top of the lifelines; more than about seven messages would run past the diagram box. `compareTable` uses a fixed row height per table; very long cells wrap but can still overflow if a row needs more than three lines.
- The JWKS panel shortens the `x` and `y` coordinates with `shortenMiddle()` for display only; the fixture keeps the full values. The ES256 payload is the same JSON as the HS256 fixture, stored again in the generated file.
- `base64Visual` is tuned to the three-byte `Man` demo; it handles other short inputs but its fixed vertical bands assume up to four six-bit groups.
- The toy flag model is simplified: `LOAD` also sets Z, while real CPUs usually set flags from arithmetic or compare instructions (step 20).
- The `Machine` helpers (`build.tsx`, `play.ts`) are candidates for the kit; they compose the kit primitives but are specific to this lesson (step 20).
- The docs player reads the Motion Canvas player's internal `player` property for `requestSeek` and `togglePlayback`; the package exposes no seek API. The smoke test guards it, but re-check after upgrading `@motion-canvas/player`.
- The Short HUD safe zones are estimates of the YouTube Shorts UI. The layout test keeps content out of them, but check the first render on a phone before publishing (step 21).
- `tokenStrip` creates one `Txt` per same-colour run per line; a much longer token would need a cheaper renderer. The 187-character fixture is five runs per line at 34 px (step 21).
- `hmacMachine` always uses the lime tag chip. A red "recomputed" tag is the lesson's comparison chip and INVALID stamp, not a machine option (step 21).
- `hmacMachine.run()` clears its transient tag on every run, so the signing chapter keeps the first tag as a separate comparison chip; the machine shows the second tag (step 23).
- `textMorphCard` derives its height as `fontSize * 2` and never wraps. Its widest current string is 20 Base64 characters at 64 px inside a 920 px card (step 23).
- `scrambleFrame` draws unresolved characters from a fixed Base64-ish glyph set, so the hex ciphertext morph also shows letters. It is deterministic and the glyph set is part of the look (step 23).
- `encode-sign-encrypt-short` is `status: animated`, `duration: TBD`; the MP4 render, timestamps, voiceover and the phone safe-zone check are still to do (step 23).
- The Shorts page appends `#Shorts #JWT #Security` as a visible tag line below `<YoutubeDescription>`; the copy button does not include them (step 21).

## Blocked

None.
