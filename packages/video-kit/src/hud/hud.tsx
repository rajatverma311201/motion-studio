import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {borderWidth, boxStyle, colors, fonts, loadFonts, radius, SOFT_SHADOW_DARK, SOFT_SHADOW_LIGHT} from '../theme';
import {getTheme} from '../themes/active-theme';
import {withAlpha} from '../themes/color-utils';
import type {ThemeHud} from '../themes/theme-types';
import {pillRow} from './pill-row';

/** One chapter of a lesson: its HUD label and accent colour. */
export interface SectionDef {
  name: string;
  color: string;
}

/** Fixed pill geometry for lessons whose HUD predates the shared right-aligned row. */
export interface HudPillLayout {
  /** X centre of the first pill. */
  startX: number;
  /** Centre-to-centre distance between pills. */
  step: number;
  /** Width of an inactive pill. */
  width: number;
  /** Width of the active pill. */
  activeWidth: number;
}

/** Optional HUD overrides. Every field defaults to the shared layout. */
export interface BuildHudOptions {
  /** Left edge of the section chip. Defaults to -560. */
  sectionChipX?: number;
  /** Use a fixed left-to-right pill row instead of the right-aligned default. */
  pills?: HudPillLayout;
}

/**
 * Shared HUD refs and pills. Module-level on purpose: one HUD per scene.
 * `buildHud()` resets the arrays so a second lesson in the same page is clean.
 */
export const hudState = {
  cap: createRef<Txt>(),
  secTxt: createRef<Txt>(),
  secChip: createRef<Rect>(),
  pills: [] as Rect[],
  defs: [] as SectionDef[],
  pillWidth: 28,
  pillActiveWidth: 52,
};

/** The caption bar shape for the active caption style. */
function captionBar(hud: ThemeHud): Rect {
  const theme = getTheme();
  const scale = theme.shape.elevationScale;
  if (hud.captionStyle === 'tonal') {
    return (
      <Rect
        y={462}
        width={1740}
        height={78}
        radius={radius(39)}
        fill={colors.surf2}
        shadowColor={theme.mode === 'dark' ? withAlpha(SOFT_SHADOW_DARK, 0.28) : withAlpha(SOFT_SHADOW_LIGHT, 0.16)}
        shadowBlur={21 * scale}
        shadowOffset={[0, 5.6 * scale]}
      />
    ) as Rect;
  }

  if (hud.captionStyle === 'outline') {
    return (
      <Rect
        y={462}
        width={1740}
        height={78}
        radius={radius(14)}
        fill={colors.surf}
        stroke={colors.border}
        lineWidth={borderWidth(1.5)}
      />
    ) as Rect;
  }

  return (
    <Rect y={462} width={1740} height={78} radius={radius(20)} fill={colors.surf} {...boxStyle(colors.brand, 7, 4)} />
  ) as Rect;
}

/** The little caption label, or null when the theme hides it. */
function captionLabelChip(hud: ThemeHud): Rect | null {
  if (hud.captionLabel === null) return null;
  const outline = hud.captionStyle === 'outline';
  return (
    <Rect
      x={-800}
      y={462}
      width={92}
      height={40}
      radius={radius(10)}
      fill={outline ? colors.surf : colors.brand}
      stroke={outline ? colors.border : undefined}
      lineWidth={outline ? borderWidth(1.5) : undefined}
    >
      <Txt
        text={hud.captionLabel}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={20}
        letterSpacing={2}
        fill={outline ? colors.brand : colors.onBrand}
      />
    </Rect>
  ) as Rect;
}

/**
 * Build the background grid, top bar, section pills and caption bar.
 *
 * @example
 * buildHud(view, 'DB INDEXING', [{name: 'INTRO', color: colors.lime}]);
 * buildHud(view, 'DB TRANSACTIONS', defs, {sectionChipX: -470, pills: {startX: 504, step: 46, width: 36, activeWidth: 64}});
 */
export function buildHud(view: View2D, title: string, defs: SectionDef[], options: BuildHudOptions = {}): void {
  hudState.pills = [];
  hudState.defs = [];
  loadFonts();
  hudState.defs = defs;
  hudState.pillWidth = options.pills?.width ?? 28;
  hudState.pillActiveWidth = options.pills?.activeWidth ?? 52;

  const {hud} = getTheme();
  const grid: Line[] = [];
  if (hud.gridVisible && hud.gridSize > 0) {
    for (let x = -960; x <= 960; x += hud.gridSize)
      grid.push(
        (
          <Line
            points={[
              [x, -540],
              [x, 540],
            ]}
            stroke={colors.grid}
            lineWidth={2}
          />
        ) as Line,
      );
    for (let y = -540; y <= 540; y += hud.gridSize)
      grid.push(
        (
          <Line
            points={[
              [-960, y],
              [960, y],
            ]}
            stroke={colors.grid}
            lineWidth={2}
          />
        ) as Line,
      );
  }
  view.add(<Node zIndex={-10}>{grid}</Node>);

  const n = defs.length;
  const layout = options.pills;
  const pills = pillRow(n, layout);
  hudState.pills = defs.map(
    (_, i) =>
      (
        <Rect x={pills[i].x} y={-492} width={hudState.pillWidth} height={14} radius={radius(7)} fill={colors.dim} />
      ) as Rect,
  );
  const label = captionLabelChip(hud);
  view.add(
    <Node zIndex={50}>
      <Rect
        x={-910}
        y={-492}
        width={30}
        height={30}
        radius={radius(8)}
        fill={colors.brand}
        stroke={colors.border}
        lineWidth={borderWidth(3.5)}
        offsetX={-1}
      />
      <Txt
        x={-866}
        y={-492}
        offsetX={-1}
        text={title}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={22}
        letterSpacing={3}
        fill={colors.ink}
      />
      <Rect
        ref={hudState.secChip}
        x={options.sectionChipX ?? -560}
        y={-492}
        offsetX={-1}
        layout
        alignItems="center"
        padding={[4, 16]}
        radius={radius(999)}
        fill={colors.brand}
      >
        <Txt
          ref={hudState.secTxt}
          text=""
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={20}
          letterSpacing={2}
          fill={colors.onBrand}
        />
      </Rect>
      {hudState.pills}
      {captionBar(hud)}
      {label}
      <Txt
        ref={hudState.cap}
        x={-736}
        y={462}
        offsetX={-1}
        text=""
        fontFamily={fonts.sans}
        fontWeight={500}
        fontSize={31}
        fill={colors.ink}
      />
    </Node>,
  );
}
