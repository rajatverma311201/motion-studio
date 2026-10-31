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
    chip.tsx              chip(), chipText()
    label.tsx             label()
    card.tsx              card()
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
```

Every folder has an `index.ts` barrel and `src/index.ts` re-exports all of them, so consumers import from `@motion-studio/video-kit` and never from a deep path. The animation barrel also re-exports `easeInOutCubic`, `easeOutBack` and `easeOutCubic` from `@motion-canvas/core`.

## How to add a component

1. Pick the folder: visual primitives in `components/`, timed animations in `animation/`, design tokens in `theme/`, scene furniture in `hud/`.
2. Create a kebab-case file and a named export. Export a typed options interface for anything with three or more optional parameters; keep the existing positional signatures of `chip`, `label` and `card` stable.
3. Give every exported function a one-line JSDoc with a usage example.
4. Re-export it from the folder's `index.ts`. The root barrel picks it up automatically.
5. Run `pnpm --filter @motion-studio/video-kit typecheck` and `pnpm --filter @motion-studio/video-kit test`.

Scenes are not part of this package. They import the barrel and keep their own section-local nodes.

## Rename table (from `db-indexing/kit.tsx`)

| Old                                      | New                                | File                        |
| ---------------------------------------- | ---------------------------------- | --------------------------- |
| `C`                                      | `colors`                           | `theme/colors.ts`           |
| `FONT`                                   | `fonts.sans`                       | `theme/fonts.ts`            |
| `MONO`                                   | `fonts.mono`                       | `theme/fonts.ts`            |
| the `<link>` injection block             | `loadFonts()` (idempotent)         | `theme/fonts.ts`            |
| `NB(shadow, sh, bw)`                     | `neubrutal(shadow, sh, bw)`        | `theme/neubrutal.ts`        |
| `num`                                    | `formatNumber`                     | `theme/neubrutal.ts`        |
| `chip`, `chipText`                       | same names                         | `components/chip.tsx`       |
| `label`                                  | same name                          | `components/label.tsx`      |
| `card`                                   | same name                          | `components/card.tsx`       |
| `pop`                                    | same name                          | `animation/pop.ts`          |
| `shake`                                  | same name                          | `animation/shake.ts`        |
| `countTo`                                | same name                          | `animation/count-to.ts`     |
| `hud`                                    | `hudState`                         | `hud/hud.tsx`               |
| `buildHud`, `setSection`, `say`, `leave` | same names                         | `hud/*`                     |
| `bigText`                                | deleted, replaced by `titleSlab()` | `components/title-slab.tsx` |
| `CodeP`                                  | `CodePanel`                        | `components/code-panel/`    |
| `codePanel(o)`                           | `codePanel(options)`               | `code-panel.tsx`            |
| `Lang`                                   | `CodeLanguage`                     | `languages.ts`              |
| `LH`                                     | `LINE_HEIGHT`                      | `code-panel.tsx`            |
| `nodeW`                                  | `nodeWidth`                        | `tree/tree-layout.ts`       |
| `layout`                                 | `layoutTree`                       | `tree/tree-layout.ts`       |
| `stat`                                   | `statCard`                         | `components/stat-card.tsx`  |
| `legend`                                 | `indexLegend`                      | `components/legend.tsx`     |
| `bullet`                                 | `bulletRow`                        | `components/bullet-row.tsx` |
| `miniTree(cx, ...)`                      | `miniTree({cx, ...})`              | `components/mini-tree.tsx`  |
| `lit` / `unlit`                          | `highlightStroke` / `clearStroke`  | `components/mini-tree.tsx`  |

## Code panel

`codePanel()` returns the panel node plus the handles `focusLine()` and `revealLines()` need. Lines start hidden; reveal them, then move the highlight bar.

```ts
import {codePanel, colors, focusLine, revealLines} from '@motion-studio/video-kit';

const panel = codePanel({
  x: 0, y: 0, w: 980, title: 'users.sql',
  code: ['CREATE INDEX idx_users_name ON users (name);', 'EXPLAIN SELECT * FROM users;'],
  lang: 'sql', accent: colors.cyan,
});
view.add(panel.node);
yield* revealLines(panel);
yield* focusLine(panel, 1, colors.lime);
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
  yield* playInsert(tv, steps);
}
yield* tv.show(tree.snap()); // or jump straight to the final shape
```

The pure pieces are exported too: `snapOf()` / `leavesOf()` for hand-authored trees, `searchPlan()` for lookups, and `nodeWidth()` / `layoutTree()` for geometry. The B-tree and B+tree algorithm and layout each have their own unit-test file. `miniTree()` draws a cheaper two-level tree with highlightable rows; `statCard()`, `indexLegend()` and `bulletRow()` cover the remaining lesson furniture.

