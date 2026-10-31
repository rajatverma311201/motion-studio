import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {colors} from '../theme/colors';
import {fonts, loadFonts} from '../theme/fonts';
import {neubrutal} from '../theme/neubrutal';

/** One chapter of a lesson: its HUD label and accent colour. */
export interface SectionDef {
  name: string;
  color: string;
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
};

/**
 * Build the background grid, top bar, section pills and caption bar.
 *
 * @example
 * buildHud(view, 'DB INDEXING', [{name: 'INTRO', color: colors.lime}]);
 */
export function buildHud(view: View2D, title: string, defs: SectionDef[]): void {
  hudState.pills = [];
  hudState.defs = [];
  loadFonts();
  hudState.defs = defs;

  const grid: Line[] = [];
  for (let x = -960; x <= 960; x += 60)
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
  for (let y = -540; y <= 540; y += 60)
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
  view.add(<Node zIndex={-10}>{grid}</Node>);

  const n = defs.length;
  const step = 38;
  hudState.pills = defs.map(
    (_, i) =>
      (
        <Rect x={904 - (n - i) * step + step / 2} y={-492} width={28} height={14} radius={7} fill={colors.dim} />
      ) as Rect,
  );
  view.add(
    <Node zIndex={50}>
      <Rect
        x={-910}
        y={-492}
        width={30}
        height={30}
        radius={8}
        fill={colors.lime}
        stroke={colors.ink}
        lineWidth={3.5}
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
        x={-560}
        y={-492}
        offsetX={-1}
        layout
        alignItems="center"
        padding={[4, 16]}
        radius={999}
        fill={colors.lime}
      >
        <Txt
          ref={hudState.secTxt}
          text=""
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={20}
          letterSpacing={2}
          fill={colors.dark}
        />
      </Rect>
      {hudState.pills}
      <Rect y={462} width={1740} height={78} radius={20} fill={colors.surf} {...neubrutal(colors.lime, 7, 4)} />
      <Rect x={-800} y={462} width={92} height={40} radius={10} fill={colors.lime}>
        <Txt text="NOTE" fontFamily={fonts.mono} fontWeight={700} fontSize={20} letterSpacing={2} fill={colors.dark} />
      </Rect>
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
