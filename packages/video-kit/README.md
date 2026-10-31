# @motion-studio/video-kit

Reusable Motion Canvas 3.17 building blocks for the DB explainer videos: palette, fonts, neubrutalist shapes, small animations and the lesson HUD.

The package ships **TypeScript source only**. There is no build step: the studio's Vite compiles it, so Motion Canvas code and the components share one JSX runtime. Do not add a bundler here. The package deliberately has no `"type": "module"` field.

## Folder map

```
src/
  index.ts                public barrel
  theme/
    colors.ts             colors palette + ColorName type
    fonts.ts              fonts + idempotent loadFonts()
    neubrutal.ts          neubrutal() border/shadow props + formatNumber()
  animation/
    pop.ts                pop()
    shake.ts              shake()
    count-to.ts           countTo()
  components/
    account-card.tsx      accountCard()
    chip.tsx              chip(), chipText()
    label.tsx             label()
    card.tsx              card()
    log-row.tsx           logRow()
    stacked-title.tsx     stackedTitle()
    timeline-lane.tsx     timelineLane()
    titled-panel.tsx      titledPanel()
    title-slab.tsx        titleSlab(), titlePill()
    stat-card.tsx         statCard()
    legend.tsx            indexLegend()
    bullet-row.tsx        bulletRow()
    mini-tree.tsx         miniTree(), highlightStroke(), clearStroke()
    code-panel/
      languages.ts        CodeLanguage type, rule tables, LANGUAGES
      tokenizer.ts        tokenize() (pure)
      tokenizer.test.ts   vitest unit tests
      code-panel.tsx      codePanel(), LINE_HEIGHT
      line-focus.ts       focusLine(), revealLines()
  tree/
    tree-types.ts         Key, TNode, Snap, Step, SearchStep
    snapshot.ts           snapOf(), leavesOf()
    index-tree.ts         IndexTree
    index-tree.test.ts    algorithm unit tests
    search-plan.ts        searchPlan()
    tree-layout.ts        nodeWidth(), layoutTree()
    tree-layout.test.ts   layout unit tests
    tree-view.tsx         TreeView
    play-insert.ts        playInsert()
    play-search.ts        playSearch()
  hud/
    hud.tsx               buildHud(), hudState
    section.ts            setSection()
    caption.ts            say()
    leave.ts              leave()
  lesson/
    lesson-types.ts       LessonChapter, ChaptersFile, LessonSection, LessonConfig
    chapters.ts           resolveChapters() (palette name -> hex)
    define-lesson.ts      defineLesson(), readStartSection(), parseStartSection()
    define-lesson.test.ts vitest unit tests
```

The package root also ships `chapters.schema.json`, the draft-07 JSON Schema for every lesson's `chapters.json`.

Every folder has an `index.ts` barrel and `src/index.ts` re-exports all of them, so consumers import from `@motion-studio/video-kit` and never from a deep path. The animation barrel also re-exports `easeInOutCubic`, `easeOutBack` and `easeOutCubic` from `@motion-canvas/core`.

## Lessons

A lesson lives in `apps/studio/src/scenes/<slug>/` and has one `chapters.json` matching `ChaptersFile`. That file is the single source of truth for the HUD pills and, later, the docs page. Validate it with `chapters.schema.json` (`color` must be one of `lime`, `pink`, `cyan`, `yellow`, `violet`, `orange`, `red`).

`apps/studio/src/scenes/db-indexing/chapters.json`:

```json
{
  "slug": "db-indexing",
  "title": "DB INDEXING",
  "chapters": [
    {
      "name": "INTRO",
      "color": "lime",
      "summary": "An index is a shortcut to the rows a query needs."
    }
  ]
}
```

`apps/studio/src/scenes/db-indexing/01-intro.tsx`:

```tsx
import type {View2D} from '@motion-canvas/2d';
import type {ThreadGenerator} from '@motion-canvas/core';
import {waitFor} from '@motion-canvas/core';
import {say} from '@motion-studio/video-kit';

export function* intro(_view: View2D): ThreadGenerator {
  yield* say('A database index is a shortcut to your rows.');
  yield* waitFor(1);
}
```

`apps/studio/src/scenes/db-indexing/indexing.tsx`:

```tsx
import {defineLesson, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {intro} from './01-intro';

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [intro],
});
```

`apps/studio/src/projects/db-indexing.ts`:

```ts
import {makeProject} from '@motion-canvas/core';
import indexing from '../scenes/db-indexing/indexing?scene';

export default makeProject({scenes: [indexing]});
```

`defineLesson()` fills the background, builds the HUD from `chapters.json`, then runs `setSection(i)` and `sections[i](view)` from the start section to the end. It throws at definition time when `sections.length` and `chapters.chapters.length` differ, so a forgotten section fails the studio load instead of drifting silently.

Start-section precedence, highest first:

1. The `startSection` project/player variable: `useScene().variables.get('startSection', -1)()`, when it is an integer `>= 0`.
2. The dev-only `#s=N` URL hash.
3. `0`.

The result is clamped into `[0, total - 1]`. The player web component passes the variable as JSON, e.g. `<motion-canvas-player variables='{"startSection": 3}'>`; the editor has no variables, so `#s=N` stays useful while authoring.

Older lessons can keep their original HUD geometry through the optional `hud` config. The defaults reproduce the shared right-aligned pill row; `db-transactions` passes its fixed left-to-right row:

```tsx
export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections,
  hud: {
    sectionChipX: -470,
    pills: {startX: 504, step: 46, width: 36, activeWidth: 64},
  },
});
```

`BuildHudOptions.sectionChipX` moves the section chip; `pills` replaces the right-aligned row with a fixed `startX`/`step` layout and explicit inactive/active widths. Both fields are optional and only change geometry, never the HUD animation durations.

## How to add a component

1. Pick the folder: visual primitives in `components/`, timed animations in `animation/`, design tokens in `theme/`, scene furniture in `hud/`.
2. Create a kebab-case file and a named export. Export a typed options interface for anything with three or more optional parameters; keep the existing positional signatures of `chip`, `label` and `card` stable.
3. Give every exported function a one-line JSDoc with a usage example.
4. Re-export it from the folder's `index.ts`. The root barrel picks it up automatically.
5. Run `pnpm --filter @motion-studio/video-kit typecheck` and `pnpm --filter @motion-studio/video-kit test`.

Scenes are not part of this package. They import the barrel and keep their own section-local nodes.

## Rename table (from `db-indexing/kit.tsx`)

| Old                                      | New                                             | File                           |
| ---------------------------------------- | ----------------------------------------------- | ------------------------------ |
| `C`                                      | `colors`                                        | `theme/colors.ts`              |
| `FONT`                                   | `fonts.sans`                                    | `theme/fonts.ts`               |
| `MONO`                                   | `fonts.mono`                                    | `theme/fonts.ts`               |
| the `<link>` injection block             | `loadFonts()` (idempotent)                      | `theme/fonts.ts`               |
| `NB(shadow, sh, bw)`                     | `neubrutal(shadow, sh, bw)`                     | `theme/neubrutal.ts`           |
| `num`                                    | `formatNumber`                                  | `theme/neubrutal.ts`           |
| `chip`, `chipText`                       | same names                                      | `components/chip.tsx`          |
| `label`                                  | same name                                       | `components/label.tsx`         |
| `card`                                   | same name                                       | `components/card.tsx`          |
| `pop`                                    | same name                                       | `animation/pop.ts`             |
| `shake`                                  | same name                                       | `animation/shake.ts`           |
| `countTo`                                | same name                                       | `animation/count-to.ts`        |
| `hud`                                    | `hudState`                                      | `hud/hud.tsx`                  |
| `buildHud`, `setSection`, `say`, `leave` | same names                                      | `hud/*`                        |
| `bigText`                                | `stackedTitle()` (legacy) / `titleSlab()` (new) | `components/stacked-title.tsx` |
| `CodeP`                                  | `CodePanel`                                     | `components/code-panel/`       |
| `codePanel(o)`                           | `codePanel(options)`                            | `code-panel.tsx`               |
| `Lang`                                   | `CodeLanguage`                                  | `languages.ts`                 |
| `LH`                                     | `LINE_HEIGHT`                                   | `code-panel.tsx`               |
| `nodeW`                                  | `nodeWidth`                                     | `tree/tree-layout.ts`          |
| `layout`                                 | `layoutTree`                                    | `tree/tree-layout.ts`          |
| `stat`                                   | `statCard`                                      | `components/stat-card.tsx`     |
| `legend`                                 | `indexLegend`                                   | `components/legend.tsx`        |
| `bullet`                                 | `bulletRow`                                     | `components/bullet-row.tsx`    |
| `miniTree(cx, ...)`                      | `miniTree({cx, ...})`                           | `components/mini-tree.tsx`     |
| `lit` / `unlit`                          | `highlightStroke` / `clearStroke`               | `components/mini-tree.tsx`     |

From `db-transactions/transactions.tsx`:

| Old         | New              | File                           |
| ----------- | ---------------- | ------------------------------ |
| `account()` | `accountCard()`  | `components/account-card.tsx`  |
| `panel()`   | `titledPanel()`  | `components/titled-panel.tsx`  |
| `tile()`    | `logRow()`       | `components/log-row.tsx`       |
| lane JSX    | `timelineLane()` | `components/timeline-lane.tsx` |
| `bigText()` | `stackedTitle()` | `components/stacked-title.tsx` |

## Lesson furniture

`accountCard()` returns the card plus the balance text and status tag so a scene can animate them. Pass a formatter when the video needs a currency other than plain `en-US` numbers:

```ts
import {accountCard, colors} from '@motion-studio/video-kit';

const alice = accountCard({
  name: 'ALICE',
  letter: 'A',
  color: colors.cyan,
  x: -560,
  y: -170,
  value: 1000,
  format: n => '₹' + Math.round(n).toLocaleString('en-IN'),
});
view.add(alice.node);
```

`titledPanel()` and `logRow()` cover the durability diagrams: a neubrutalist panel with a mono title, and a fixed-height row with a coloured outline. `timelineLane()` draws a dashed lane with a coloured label tile. `stackedTitle()` keeps the older pink/cyan/cream offset headline; `titleSlab()` remains the newer slab treatment.

```ts
view.add(titledPanel({x: 200, y: -170, width: 520, height: 220, title: 'WAL', color: colors.lime}));
view.add(logRow({text: 'tx4821  COMMIT', x: 0, y: 24, width: 470, color: colors.lime}));
view.add(timelineLane({y: -200, label: 'T1', color: colors.pink}));
view.add(stackedTitle({text: 'TRANSACTIONS', fontSize: 168, y: 10}));
```

## Code panel

`codePanel()` returns the panel node plus the handles `focusLine()` and `revealLines()` need. Lines start hidden; reveal them, then move the highlight bar.

```ts
import {codePanel, colors, focusLine, revealLines} from '@motion-studio/video-kit';

const panel = codePanel({
  x: 0,
  y: 0,
  w: 980,
  title: 'users.sql',
  code: ['CREATE INDEX idx_users_name ON users (name);', 'EXPLAIN SELECT * FROM users;'],
  lang: 'sql',
  accent: colors.cyan,
});
view.add(panel.node);
yield * revealLines(panel);
yield * focusLine(panel, 1, colors.lime);
```

Supported languages are `'sql'`, `'java'` and `'plan'` (Postgres `EXPLAIN` output). `tokenize()` is pure and separately tested; import it directly when a scene needs the tokens without a panel.

## Tree engine

`IndexTree` is pure logic: every `insert()` returns snapshots and captions. `TreeView` is a plain class (not a Motion Canvas component) that animates between snapshots. `playInsert` and `playSearch` drive it and narrate through `say()`.

```ts
import {IndexTree, TreeView, playInsert} from '@motion-studio/video-kit';

const tree = new IndexTree(3, false); // B-tree; pass true for B+tree
const tv = new TreeView({x: 0, y: -200, scale: 1.2});
view.add(tv.root);

for (const key of [10, 20, 5, 15]) {
  const steps = tree.insert(key); // snapshots for every micro-step
  yield * playInsert(tv, steps);
}
yield * tv.show(tree.snap()); // or jump straight to the final shape
```

The pure pieces are exported too: `snapOf()` / `leavesOf()` for hand-authored trees, `searchPlan()` for lookups, and `nodeWidth()` / `layoutTree()` for geometry. The B-tree and B+tree algorithm and layout each have their own unit-test file. `miniTree()` draws a cheaper two-level tree with highlightable rows; `statCard()`, `indexLegend()` and `bulletRow()` cover the remaining lesson furniture.
