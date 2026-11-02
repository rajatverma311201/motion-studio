# @motion-studio/video-kit

Reusable Motion Canvas 3.17 building blocks for the DB explainer videos: palette, fonts, neubrutalist shapes, small animations and the lesson HUD.

The package ships **TypeScript source only**. There is no build step: the studio's Vite compiles it, so Motion Canvas code and the components share one JSX runtime. Do not add a bundler here. The package deliberately has no `"type": "module"` field.

## Folder map

```
src/
  index.ts                public barrel
  theme/
    colors.ts             active-theme colour Proxy + ColorName type
    fonts.ts              active-theme font Proxy + idempotent loadFonts()
    box-style.ts          boxStyle(), borderWidth(), tintedSurface() and radius()
    format.ts             formatNumber()
    shadows.ts            soft-elevation shadow inks
  themes/
    theme-types.ts        Theme, ThemeVariant, ThemeColors, ResolvedTheme, ...
    color-utils.ts        parseColor(), withAlpha(), mix(), contrastRatio()
    neubrutal.ts          neubrutalTheme (dark is the original look)
    shadcn.ts             shadcnTheme (zinc neutrals, hairline borders)
    notebook.ts           notebookTheme (tonal surfaces, no outlines)
    tokyo-night.ts        tokyoNightTheme (editor palette + day variant)
    terminal-green.ts     terminalGreenTheme (phosphor glow)
    paper-editorial.ts    paperEditorialTheme (warm paper, serif display)
    blueprint.ts          blueprintTheme (drafting grid, white-print)
    registry.ts           themes, themeIds, getThemeById(), registerTheme()
    active-theme.ts       setActiveTheme(), getTheme(), resolveThemeSelection()
    golden/               frozen default look for the golden test
  animation/
    pop.ts                pop()
    shake.ts              shake()
    slam.ts               slam()
    count-to.ts           countTo()
    seeded-random.ts      seededRandom() (deterministic scenes)
  components/
    account-card.tsx      accountCard()
    chip.tsx              chip(), chipText()
    label.tsx             label()
    card.tsx              card()
    log-row.tsx           logRow()
    stacked-title.tsx     stackedTitle()
    timeline-lane.tsx     timelineLane()
    titled-panel.tsx      titledPanel()
    title-block.tsx       titleBlock(), titlePill()
    stat-card.tsx         statCard()
    legend.tsx            indexLegend()
    bullet-row.tsx        bulletRow()
    mini-tree.tsx         miniTree(), highlightStroke(), clearStroke()
    cpu/
      register-box.tsx    registerBox(), writeRegister(), setRegister()
      memory-panel.tsx    memoryPanel(), setCell(), writeCell(), highlightRow()
      memory-geometry.ts  memoryRowY() (pure)
      memory-geometry.test.ts  row geometry unit tests
      lamp.tsx            lamp(), lampOn()
      value-packet.tsx    valuePacket(), flyAlong()
      phase-tracker.tsx   phaseTracker()
    code-panel/
      languages.ts        CodeLanguage type, rule tables, LANGUAGES
      tokenizer.ts        tokenize() (pure)
      tokenizer.test.ts   vitest unit tests
      code-panel.tsx      codePanel(), LINE_HEIGHT
      line-focus.ts       focusLine(), revealLines()
    crypto/
      token-strip.tsx     tokenStrip()
      token-strip-layout.ts layoutToken() (pure)
      hmac-machine.tsx    hmacMachine()
      icons.tsx           keyIcon(), lockIcon()
      base64-visual.tsx   base64Visual() with its step-by-step Base64 animation
    diagrams/
      sequence-diagram.tsx sequenceDiagram()
      sequence-layout.ts  sequenceLayout() (pure)
      compare-table.tsx   compareTable()
      table-layout.ts     tableLayout(), wrapGrid() (pure)
      time-bar.tsx        timeBar()
      time-to-x.ts        timeToX() (pure)
    stamp.tsx             stamp()
  jwt/
    base64url.ts          encodeBase64Url(), decodeBase64Url(), decodeBase64UrlText()
    base64-steps.ts       base64Steps(), base64Alphabet, toUrlSafe() (pure)
    claim-info.ts         REGISTERED_CLAIMS
    validate-claims.ts    validateClaims() (pure)
    jwt-parse.ts          splitToken(), decodeJson(), describeToken()
    jwt-fixtures.ts       demo header/payload/signatures, JWT_PART_COLOR
    jwt-es256-fixture.ts  generated ES256 token and public JWK
    index.ts              barrel; exported from the package root
  cpu/
    cpu-types.ts          RegName, Phase, Mnemonic, CpuState, MicroStep, InstructionTrace, ToyProgram
    isa.ts                OPCODES, encode(), decodeByte(), disassemble(), assemble()
    format.ts             formatBits(), toHex()
    cpu.ts                emptyState(), memoryImage(), loadedState(), stepInstruction(), runProgram(), totalTicks(), stateAfterStep()
    programs.ts           ADD_PROGRAM, COUNTDOWN_PROGRAM
    cpu.test.ts           trace, wrap, purity, illegal-opcode tests
    isa.test.ts           round-trip and assembler tests
    format.test.ts        binary and hex tests
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
    pill-row.ts           pillRow() (pure, used by buildHud)
    short-hud.tsx         buildShortHud() for 1080 x 1920 lessons
    short-layout.ts       SHORT_SIZE, SHORT_ZONES, progressSegments() (pure)
    read-time.ts          readSeconds() (pure)
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

## Themes

A theme is a design language; mode is a separate choice (`dark` or `light`). The kit flattens the pair into a `ResolvedTheme` once at scene start, and every helper reads it at call time.

The registry ships seven themes: `neubrutal`, `shadcn`, `notebook`, `tokyo-night`, `terminal-green`, `paper-editorial` and `blueprint`. Every theme has both variants, so the catalogue is fourteen looks. The root README has the id/name/family/default-mode table and the one-line character of each look.

### Fonts and the 0.6 em rule

Both modes of a theme share one Google Fonts stylesheet and one set of stacks. Every `fonts.mono` stack must advance exactly 0.6 em per glyph because `codePanel()` lays tokens out on that grid. The three mono families in the catalogue were measured with `CanvasRenderingContext2D.measureText('MMMMMMMMMM').width / 10 / fontSize`: Roboto Mono 0.6001, JetBrains Mono 0.6000, IBM Plex Mono 0.6000. Verify any replacement the same way before using it. `notebook` uses Google Sans (offered on Google Fonts at the time of writing; DM Sans is the documented fallback) with Roboto Mono.

### Types

- `Theme` — id, name, family, description, `defaultMode`, shared `fonts`, and mandatory `variants.dark` / `variants.light`.
- `ThemeVariant` — `colors` (`ThemeColors`), `shape` (`ThemeShape`) and `hud` (`ThemeHud`).
- `ResolvedTheme` — one variant plus `id`, `name`, `mode` and `fonts`. This is what `getTheme()` returns.
- `ThemeColors` has semantic accent slots (`lime`, `pink`, `cyan`, `yellow`, `violet`, `orange`, `red`), chrome keys (`brand`, `onBrand`), surfaces and text keys. Accent slots are roles, not literal hues.

```ts
import {getTheme, setActiveTheme, withAlpha} from '@motion-studio/video-kit';

setActiveTheme('neubrutal', 'light');
const theme = getTheme();
const text = theme.colors.ink;
```

### How a lesson picks a theme and mode

Theme id and mode are resolved independently, highest precedence first:

| Order | Theme id                                                                     | Mode                               |
| ----- | ---------------------------------------------------------------------------- | ---------------------------------- |
| 1     | player variable `theme` (`variables='{"theme":"neubrutal","mode":"light"}'`) | player variable `mode`             |
| 2     | dev hash `#theme=<id>` (works together with `#s=N&theme=...`)                | hash `#mode=dark` or `#mode=light` |
| 3     | `"theme"` in `chapters.json`                                                 | `"mode"` in `chapters.json`        |
| 4     | `neubrutal`                                                                  | the chosen theme's `defaultMode`   |

`defineLesson()` calls `resolveThemeSelection()` and then `setActiveTheme(themeId, mode)` before it fills the background or builds the HUD. Unknown ids are skipped with a warning; nothing throws. `chapters.json` may carry `"theme": "..."` and `"mode": "dark" | "light"`.

### No import-time colour reads

Never capture a colour or font at module load:

```ts
const accent = colors.lime; // WRONG: freezes the first theme forever
```

`colors` and `fonts` are Proxies over the active theme, so `colors.lime` inside a function body is correct. Rule tables store accent key names (`'lime'`) and resolve them with `colors[key]` when tokenizing.

### boxStyle, radius, withAlpha

- `boxStyle(accent, offset = 8, border = 4)` returns `ShapeProps` with the active theme's border width and elevation (`hard`, `soft`, `glow` or `none`).
- `borderWidth(base)` scales a border by `shape.borderWidthScale`; borderless themes return `0`, otherwise the result never drops below `1.5`.
- `tintedSurface(accent)` returns `colors.surf` when the elevation already shows the accent (hard or glow) and a subtle 22 % accent tint for soft or flat themes, so a semantic colour never disappears with the shadow.
- `radius(n)` scales a number or a 4-tuple by `shape.radiusScale`; values `>= 100` (pills) pass through.
- `withAlpha(color, alpha)` returns a `rgba(...)` string and accepts `#rgb`, `#rrggbb`, `rgb()` and `rgba()` inputs.

```tsx
<Rect {...boxStyle(colors.pink, 8, 4)} radius={radius(20)} fill={withAlpha(colors.ink, 0.09)} />
```

The default theme is `neubrutal` in `dark` mode, which reproduces the original look. `themes/golden/neubrutal-dark.json` freezes that palette, font stacks, HUD and shape numbers; `golden.test.ts` fails in milliseconds if any of them drift.

## How to add a component

1. Pick the folder: visual primitives in `components/`, timed animations in `animation/`, design tokens in `theme/`, scene furniture in `hud/`.
2. Create a kebab-case file and a named export. Export a typed options interface for anything with three or more optional parameters; keep the existing positional signatures of `chip`, `label` and `card` stable.
3. Give every exported function a one-line JSDoc with a usage example.
4. Re-export it from the folder's `index.ts`. The root barrel picks it up automatically.
5. Run `pnpm --filter @motion-studio/video-kit typecheck` and `pnpm --filter @motion-studio/video-kit test`.

Scenes are not part of this package. They import the barrel and keep their own section-local nodes.

## Rename table (from `db-indexing/kit.tsx`)

| Old                                      | New                                              | File                         |
| ---------------------------------------- | ------------------------------------------------ | ---------------------------- |
| `C`                                      | `colors`                                         | `theme/colors.ts`            |
| `FONT`                                   | `fonts.sans`                                     | `theme/fonts.ts`             |
| `MONO`                                   | `fonts.mono`                                     | `theme/fonts.ts`             |
| the `<link>` injection block             | `loadFonts()` (idempotent)                       | `theme/fonts.ts`             |
| `NB(shadow, sh, bw)`                     | `boxStyle(shadow, sh, bw)`                       | `theme/box-style.ts`         |
| `num`                                    | `formatNumber`                                   | `theme/format.ts`            |
| `chip`, `chipText`                       | same names                                       | `components/chip.tsx`        |
| `label`                                  | same name                                        | `components/label.tsx`       |
| `card`                                   | same name                                        | `components/card.tsx`        |
| `pop`                                    | same name                                        | `animation/pop.ts`           |
| `shake`                                  | same name                                        | `animation/shake.ts`         |
| `countTo`                                | same name                                        | `animation/count-to.ts`      |
| `hud`                                    | `hudState`                                       | `hud/hud.tsx`                |
| `buildHud`, `setSection`, `say`, `leave` | same names                                       | `hud/*`                      |
| `bigText`                                | `stackedTitle()` (legacy) / `titleBlock()` (new) | `components/title-block.tsx` |
| `CodeP`                                  | `CodePanel`                                      | `components/code-panel/`     |
| `codePanel(o)`                           | `codePanel(options)`                             | `code-panel.tsx`             |
| `Lang`                                   | `CodeLanguage`                                   | `languages.ts`               |
| `LH`                                     | `LINE_HEIGHT`                                    | `code-panel.tsx`             |
| `nodeW`                                  | `nodeWidth`                                      | `tree/tree-layout.ts`        |
| `layout`                                 | `layoutTree`                                     | `tree/tree-layout.ts`        |
| `stat`                                   | `statCard`                                       | `components/stat-card.tsx`   |
| `legend`                                 | `indexLegend`                                    | `components/legend.tsx`      |
| `bullet`                                 | `bulletRow`                                      | `components/bullet-row.tsx`  |
| `miniTree(cx, ...)`                      | `miniTree({cx, ...})`                            | `components/mini-tree.tsx`   |
| `lit` / `unlit`                          | `highlightStroke` / `clearStroke`                | `components/mini-tree.tsx`   |

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

`titledPanel()` and `logRow()` cover the durability diagrams: a neubrutalist panel with a mono title, and a fixed-height row with a coloured outline. `timelineLane()` draws a dashed lane with a coloured label tile. `stackedTitle()` keeps the older pink/cyan/cream offset headline; `titleBlock()` renders the theme's title style (slab, plain or pill).

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

Supported languages are `'sql'`, `'java'`, `'plan'` (Postgres `EXPLAIN` output) and `'json'` (keys, values, numbers and literals use different accents). `tokenize()` is pure and separately tested; import it directly when a scene needs the tokens without a panel.

## Shorts and the JWT pieces

`ChaptersFile.format` defaults to `'landscape'`, so older lessons are unchanged. A Short sets `"format": "short"` and renders at 1080 x 1920; `defineLesson()` picks `buildShortHud()`, which keeps the same `hudState` refs as the landscape HUD, so `say()` and `setSection()` work unchanged. The portrait HUD draws a thin chapter progress bar at the top, a small title chip and a centred 920 px caption zone at 52 px. `SHORT_SIZE`, `SHORT_ZONES`, `shortSafeBox` and `progressSegments()` are pure and exported for layout tests; `readSeconds()` gives the minimum caption hold.

`src/jwt/` is pure TypeScript (no Motion Canvas imports) and runs in Node tests. It ships Base64URL encode/decode without `Buffer` or `btoa`, token splitting/description, and the demo fixtures used by the JWT Short. The fixture test recomputes both HMAC-SHA256 signatures with Node's `crypto`, so a typo in a Base64URL part or signature fails the suite.

```ts
import {colors, JWT_TAMPERED_PAYLOAD, JWT_TOKEN, hmacMachine, slam, stamp, tokenStrip} from '@motion-studio/video-kit';

const strip = tokenStrip({x: 0, y: -600, width: 920, fontSize: 34, token: JWT_TOKEN});
const machine = hmacMachine({x: 0, y: 60, w: 880, h: 380});
const invalid = stamp('INVALID', colors.red, {rot: -8, fs: 64});

view.add(strip.node);
view.add(machine.node);
yield * strip.typeIn(1.2);
yield * strip.focus('payload');
yield * strip.replacePart('payload', JWT_TAMPERED_PAYLOAD);
view.add(invalid);
yield * slam(invalid);
yield * machine.run({message: 'header.payload', key: 'SECRET', tag: 'XpQ15Es-…'});
```

`tokenStrip()` lays one `Txt` per same-colour run on a 0.6 em grid. `layoutToken(token, charsPerLine)` is the pure wrapper and is tested against the 187-character fixture. `hmacMachine()` never computes a signature: the caller passes the message, key and tag strings, and the machine only animates them. `stamp()` is a rotated double-bordered label; `slam()` scales it in and shakes it. `keyIcon()` and `lockIcon()` are vector shapes only; `lockIcon()` returns `{node, unlock(), lock()}`.

## TinyCPU model and primitives

`src/cpu/` is a pure, tested model of the toy CPU used by the instruction-cycle lesson. It has no Motion Canvas imports: the scene animates the states, so the animation can never disagree with the rules.

```ts
import {
  ADD_PROGRAM,
  formatBits,
  loadedState,
  runProgram,
  stateAfterStep,
  stepInstruction,
} from '@motion-studio/video-kit';

const start = loadedState(ADD_PROGRAM); // PC = 4, memory holds the program
const trace = stepInstruction(start); // LOAD 12, F1..E3
trace.steps.map(step => step.id); // ['F1','F2','F3','F4','D1','E1','E2','E3']
stateAfterStep(trace, 'D1').pc; // 5, after fetch, before execute
runProgram(start).final.acc; // 8
formatBits(5, 8); // '00000101'
```

`memoryImage(program)` returns the 16 bytes; `assemble()` and `disassemble()` convert between mnemonics and bytes; `totalTicks(traces)` counts micro-steps. Every `CpuState` handed back is a fresh object and a fresh `mem` array, so freezing the input is safe.

The visual primitives in `components/cpu/` compose the lesson machine:

```tsx
const mem = memoryPanel({x: 610, y: -5, accent: colors.cyan});
const pc = registerBox({name: 'PC', bits: 4, color: colors.lime, x: -380, y: -255});
const tracker = phaseTracker({x: -380, y: -360});
const packet = valuePacket(formatBits(5, 8), colors.pink);
view.add(mem.node);
view.add(pc.node);
view.add(tracker.node);
view.add(packet);

yield * tracker.set('fetch');
yield * writeRegister(pc, 5, {hint: 'next: 5'});
yield * highlightRow(mem, 12, colors.cyan, true);
yield * lampOn(mem.header.read, true);
yield *
  flyAlong(
    packet,
    [
      [-250, -255],
      [250, -255],
      [250, 228],
    ],
    0.7,
  );
```

`memoryRowY(panelY, rows, i)` is pure geometry and separately tested. `lamp()` returns a handle with both an animated `set()` and an instant `setNow()`; use the latter when a scene jumps the machine to a known state.

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
