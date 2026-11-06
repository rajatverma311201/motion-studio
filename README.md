# Motion Studio

Animated software-engineering explainers. Each lesson is a Motion Canvas scene rendered to video and paired with a recording page: voiceover notes, summary points, chapter timestamps and a copy-ready YouTube description. There is no voice-over in the render; a caption bar narrates the video. The docs site is the owner's recording companion and video tracker.

This repository contains the whole pipeline: the scenes, the shared visual kit, the documentation site that plays the videos, and the tools that keep them in sync. The videos use the neubrutalist visual identity; the docs site uses the stock Fumadocs look with a light/dark toggle.

## Architecture

```text
motion-studio/
├── apps/
│   ├── studio/                  Motion Canvas editor and lesson scenes (Vite 4)
│   │   └── src/
│   │       ├── projects/        one project per lesson (db-indexing.ts, ...)
│   │       └── scenes/
│   │           └── db-indexing/
│   │               ├── chapters.json   chapter names, colours, summaries
│   │               ├── scene.tsx       defineLesson(...) wiring
│   │               ├── scene.meta      editor metadata (committed)
│   │               └── sections/       numbered section files
│   └── docs/                    TanStack Start + Fumadocs site (Vite 8)
│       ├── content/docs/        lesson pages and production notes
│       ├── src/generated/       lessons.json + themes.json (generated)
│       └── public/videos/       player bundles (generated)
├── packages/
│   └── video-kit/               shared theme data, HUD, components, lesson factory
├── tools/
│   ├── scripts/                 sync-themes, sync-lessons, new-lesson, new-theme, studio
│   └── snapshots/               Playwright capture and pixel compare
├── video.config.json            default look for every video
├── package.json                 root scripts
└── pnpm-workspace.yaml
```

A lesson flows in one direction: `apps/studio/src/scenes/<slug>` is built by `pnpm videos:build` into `apps/docs/public/videos`, the chapter metadata is synced into `apps/docs/src/generated/lessons.json`, and the docs page embeds the bundle with the Motion Canvas player. Rendering the MP4 is a manual step in the studio editor (the ffmpeg exporter).

## Prerequisites

- **Node.js 22.12 or newer**
- **pnpm 12** (`corepack enable pnpm`, or install pnpm globally)

## Quick start

```sh
pnpm install
pnpm dev
```

- Docs: <http://localhost:3000>
- Themes gallery: <http://localhost:3000/themes>
- Studio editor: <http://localhost:9000>

`pnpm dev` syncs the generated lesson data, then runs the studio bundle watcher and the docs dev server together. The first build writes the player bundles into `apps/docs/public/videos`; open a lesson page after it finishes.

To produce a production build:

```sh
pnpm build
```

That builds every video bundle and then the docs site (`apps/docs/dist`).

## Commands

| Command                                              | What it does                                                                                                                                                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                           | Sync generated data, then run the studio bundle watcher and the docs dev server.                                                                                                                         |
| `pnpm build`                                         | `videos:build` followed by the docs production build.                                                                                                                                                    |
| `pnpm check`                                         | Typecheck, lint, tests and Prettier check in one go.                                                                                                                                                     |
| `pnpm studio`                                        | Start the editor. Add `--theme <id>` / `--mode dark\|light` for the look, and `--pause beat\|chapter\|off` / `--voice off\|record\|play` for recording voiceover.                                        |
| `pnpm studio:dev`                                    | Start the editor with no flags (the look still comes from the config and lesson).                                                                                                                        |
| `pnpm videos:build`                                  | Sync generated data and build every project into `apps/docs/public/videos`.                                                                                                                              |
| `pnpm sync`                                          | Regenerate `themes.json` and `lessons.json` (themes first).                                                                                                                                              |
| `pnpm new:lesson <slug> "<Title>" --course <course>` | Scaffold a lesson: project, scene, sections, MDX page and sidebar entry.                                                                                                                                 |
| `pnpm new:theme <id> "<Name>" --from <theme>`        | Copy an existing theme, register it and sync the docs data.                                                                                                                                              |
| `pnpm gen:signature-fixture`                         | Regenerate the ECDSA P-256 public key and signature fixture used by the signing lesson.                                                                                                                  |
| `pnpm status`                                        | Print slug, status, duration and YouTube link for every lesson page.                                                                                                                                     |
| `pnpm snap:capture current [slug]`                   | Capture every section of every video (or one) to `.snapshots/current`.                                                                                                                                   |
| `pnpm snap:compare [slug]`                           | Pixel-compare the current capture with `.snapshots/baseline`.                                                                                                                                            |
| `pnpm snap:themes`                                   | Capture two quick showcase chapters in 7 themes × 2 modes; write `.snapshots/themes.html`. Add `-- --only <id>` for one theme, `-- --mode dark\|light` for one row, or `-- --full` for all six chapters. |
| `pnpm smoke:docs`                                    | Playwright smoke test against the docs dev server on port 3000.                                                                                                                                          |
| `pnpm typecheck` / `pnpm lint` / `pnpm test`         | Run one check on its own.                                                                                                                                                                                |
| `pnpm format` / `pnpm format:check`                  | Write or verify Prettier formatting.                                                                                                                                                                     |

Snapshots need the studio dev server on port 9000 (`pnpm studio:dev`). The baseline lives in `.snapshots/baseline`, is git-ignored, and must be captured once on a machine before comparing. Run them when you want a pixel check: they are slow and optional, and the editor review is the normal verification.

## Themes

Every theme ships two variants, `dark` and `light`, and the theme and the mode are picked independently: seven themes give fourteen looks. Fonts are shared by both modes of a theme; colours, shape and HUD are per variant.

| Id                | Name            | Family       | Default mode | Character                                                            |
| ----------------- | --------------- | ------------ | ------------ | -------------------------------------------------------------------- |
| `neubrutal`       | Neubrutal       | `neubrutal`  | dark         | Thick borders, hard offset shadows, punchy accents.                  |
| `shadcn`          | Shadcn          | `shadcn`     | dark         | Zinc neutrals, hairline borders, calm and clean.                     |
| `notebook`        | Notebook        | `notebooklm` | light        | Soft tonal surfaces, no outlines, rounded everything, calm blue.     |
| `tokyo-night`     | Tokyo Night     | `dev`        | dark         | The popular editor palette; ideal for code-heavy videos.             |
| `terminal-green`  | Terminal Green  | `dev`        | dark         | Phosphor green on near-black with a soft glow.                       |
| `paper-editorial` | Paper Editorial | `editorial`  | light        | Warm paper, ink rules and one editorial red; a serif for titles.     |
| `blueprint`       | Blueprint       | `dev`        | dark         | Drafting-paper look with a strong grid; light mode is a white-print. |

Pick a pair with `#theme=<id>&mode=<dark|light>` on a project URL, set `theme` and `mode` in `chapters.json`, set the default for every video in `video.config.json`, or pass `--theme` / `--mode` to `pnpm studio`. Unknown ids and modes fall back with a warning. `pnpm snap:themes` captures the two quick chapters of the `theme-showcase` lesson (COMPONENTS and CODE) in all fourteen looks — 28 captures, about 8 to 10 minutes — and writes a contact sheet to `.snapshots/themes.html`. Add `-- --only <theme-id>` for one theme (about a minute), `-- --mode dark|light` to keep one row, or `-- --full` for all six chapters.

### Choosing a look

The theme id and the mode resolve independently; the first **valid** value wins per field:

| #   | Source                       | Example                                              |
| --- | ---------------------------- | ---------------------------------------------------- |
| 1   | URL hash                     | `#s=3&theme=tokyo-night&mode=light`                  |
| 2   | `pnpm studio` flags          | `pnpm studio --theme tokyo-night --mode light`       |
| 3   | Motion Canvas variables      | `theme` / `mode` project variables (the docs player) |
| 4   | The lesson's `chapters.json` | `"theme": "paper-editorial", "mode": "light"`        |
| 5   | `video.config.json`          | the repo-root default (`neubrutal` / `dark`)         |
| 6   | Built-in                     | `neubrutal`, or the chosen theme's `defaultMode`     |

```sh
pnpm studio --theme tokyo-night --mode light   # this session only
pnpm studio --mode light                       # theme still from the lesson or config
pnpm studio:dev                                # no flags, reads the config and lesson
```

Both `pnpm studio --theme ...` and `pnpm studio -- --theme ...` reach the script on pnpm 12.16.1. `video.config.json` is read when the Vite server starts, so restart the studio after editing it. The editor prints the winning layers on every scene start:

```text
[video-kit] look: tokyo-night / light  (theme from cli, mode from lesson)
```

MP4s come from the editor's Render button (Video / FFmpeg exporter) and land in `apps/studio/output`. The name is `<slug>.mp4` for the built-in look and `<slug>--<theme>--<mode>.mp4` otherwise, so two looks of one lesson do not overwrite each other. The full guide is at `/docs/production/render-in-a-look`.

Create a theme from an existing one:

```sh
pnpm new:theme midnight-purple "Midnight Purple" --from tokyo-night
```

It copies both variants, rewrites the id, name and constant, registers the theme between the generated markers in `registry.ts`, and runs `pnpm sync:themes`.

`NotebookLM` and `shadcn` here mean **inspired-by looks** built from public design ideas (Material tonal surfaces and Google's public colour tokens; zinc neutrals, 1 px borders and Tailwind colours). No logos, wordmarks or product UI are copied. The theme names shown in the UI are `Notebook` and `Shadcn`.

## Voice recording

Every `say(...)` call is one caption beat. The kit registers a presenter slide before each caption, records the beat start and — in voice mode `play` — stretches each beat to its recorded clip. The recording itself happens in the Motion Canvas PRESENT window:

```sh
pnpm studio --voice record            # force a presenter slide at every beat
pnpm studio --pause chapter           # one pause at the first beat of each chapter
pnpm studio --pause off               # no slides at all
```

Clips and manifests land in `apps/studio/voice/<slug>/` (git-ignored, local data — back it up). The default is `play` as soon as a manifest with clips exists, and the docs player bundle always runs with `voice: off`. The complete workflow is in `apps/docs/content/docs/production/recording-workflow.mdx`.

## Adding a lesson

```sh
pnpm new:lesson mvcc-and-isolation "MVCC and Isolation Levels" --course databases
```

The generator refuses to overwrite anything. It creates the project file, `chapters.json`, `scene.tsx`, numbered section files and the MDX page, appends the page to the course's `meta.json`, and runs `pnpm sync:lessons`. Add `--theme <id>` and `--mode dark|light` to write a permanent look into the new `chapters.json`.

1. Preview at `http://localhost:9000/src/projects/<slug>`. Start at a section with `#s=N` (zero-based).
2. Replace the `TODO` captions in `sections/*.tsx` and the placeholder chapters in `chapters.json`. Keep the chapter count and the section count equal; `defineLesson()` throws otherwise.
3. Fill in the MDX page (voiceover notes, summary points), then move `status` through `outline`, `animated`, `rendered`, `voiced`, `published`. Add `at` timestamps after the render and `youtube` when it is live; `pnpm status` prints the table.
4. Commit the `.meta` files the editor writes next to the scene and the project.
5. Run `pnpm check` and `pnpm build`.

The full walkthrough is at `/docs/production/adding-a-lesson` once the docs are running.

## Two apps, two Vite versions

Motion Canvas's Vite plugin supports **Vite 4 and 5 only**. TanStack Start requires **Vite 8**. That is why there are two apps and why their configs must never be shared:

- `apps/studio` runs Vite 4 with the Motion Canvas and ffmpeg plugins.
- `apps/docs` runs Vite 8 with TanStack Start, Fumadocs and Tailwind 4.

`apps/docs` must never import `.tsx` from `packages/video-kit`: the JSX runtimes differ. Data crosses the boundary as JSON (`chapters.json` and the theme registry in, `lessons.json` and `themes.json` out).

## Troubleshooting

### Vite: `Failed to resolve import "./src/project.ts?project"`

The Motion Canvas plugin defaults to a file named `src/project.ts`. This repo keeps one project per lesson under `src/projects/`, so `apps/studio/vite.config.ts` overrides the entry glob:

```ts
motionCanvas({project: ['./src/projects/*.ts']});
```

If the error appears, the glob no longer matches your project files (wrong folder, renamed file, or a missing `src/projects/<slug>.ts`). Fix the glob or create the project file; do not point the plugin at a single hard-coded path.

### Playwright: only one editor page at a time

The Motion Canvas editor rewrites the `.meta` files, which hot-restarts every other page open on the same project. The snapshot tools therefore run sequentially, one page at a time. Close other editor tabs before running `pnpm snap:capture` or Playwright, and never run two captures in parallel.

### `.meta` files must be committed

The editor writes `<name>.meta` next to every scene and project. They hold the saved editor state and belong in git. Never hand-edit them, never ignore them, and commit them together with the scene change that produced them.

### The player shows "Video bundle not found"

The player loads `/videos/projects/src/projects/<slug>.js`, which only exists after a build:

```sh
pnpm videos:build
```

`pnpm dev` also builds the bundles in watch mode; `pnpm build` does it for production. The `apps/docs/public/videos` folder is git-ignored, so a fresh clone has no bundles until one of those commands runs.

### Fresh clone: missing `lessons.json` or `themes.json`

`apps/docs/src/generated` is git-ignored. Run `pnpm sync` (or `pnpm dev`, or `pnpm build`) once after cloning, before `pnpm --filter @motion-studio/docs typecheck` or `pnpm check`.
