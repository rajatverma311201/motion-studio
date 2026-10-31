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
