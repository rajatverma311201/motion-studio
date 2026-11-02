import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {borderWidth, boxStyle, colors, fonts, loadFonts, radius, withAlpha} from '../theme';
import {getTheme} from '../themes/active-theme';
import {hudState, type SectionDef} from './hud';
import {SHORT_CAPTION, SHORT_PROGRESS, SHORT_TITLE, progressSegments} from './short-layout';

/**
 * Build the portrait HUD for a Short: a chapter progress bar, a title chip and
 * the two-line caption zone. It fills the same `hudState` refs as the landscape
 * HUD, so `say()` and `setSection()` work unchanged in section generators.
 *
 * The section chip and pill labels are not drawn; they live in a hidden node so
 * `setSection()` can still update their text and fill.
 *
 * @example
 * buildShortHud(view, 'JWT IN 60 SECONDS', [{name: 'HOOK', color: colors.lime}]);
 */
export function buildShortHud(view: View2D, title: string, defs: SectionDef[]): void {
  hudState.pills = [];
  hudState.defs = defs;
  loadFonts();

  const segments = progressSegments(defs.length, SHORT_PROGRESS.width, SHORT_PROGRESS.gap);
  hudState.pillWidth = segments.width;
  hudState.pillActiveWidth = segments.activeWidth;

  const {hud} = getTheme();
  const grid: Line[] = [];
  if (hud.gridVisible && hud.gridSize > 0) {
    for (let x = -540; x <= 540; x += hud.gridSize) {
      grid.push(
        (
          <Line
            points={[
              [x, -960],
              [x, 960],
            ]}
            stroke={colors.grid}
            lineWidth={2}
          />
        ) as Line,
      );
    }
    for (let y = -960; y <= 960; y += hud.gridSize) {
      grid.push(
        (
          <Line
            points={[
              [-540, y],
              [540, y],
            ]}
            stroke={colors.grid}
            lineWidth={2}
          />
        ) as Line,
      );
    }
  }
  view.add(<Node zIndex={-10}>{grid}</Node>);

  hudState.pills = defs.map(
    (_, i) =>
      (
        <Rect
          x={segments.startX + i * segments.step}
          y={SHORT_PROGRESS.y}
          width={segments.width}
          height={SHORT_PROGRESS.height}
          radius={radius(SHORT_PROGRESS.height / 2)}
          fill={colors.dim}
        />
      ) as Rect,
  );

  view.add(
    <Node zIndex={50}>
      <Rect
        x={SHORT_TITLE.x}
        y={SHORT_TITLE.y}
        offsetX={-1}
        layout
        alignItems="center"
        padding={[5, 14]}
        radius={radius(9)}
        fill={colors.brand}
        {...boxStyle(colors.violet, 4, 2)}
      >
        <Txt
          text={title}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={SHORT_TITLE.fontSize}
          letterSpacing={2}
          fill={colors.onBrand}
        />
      </Rect>
      <Rect
        x={SHORT_PROGRESS.x}
        y={SHORT_PROGRESS.y}
        width={SHORT_PROGRESS.width}
        height={SHORT_PROGRESS.height}
        radius={radius(SHORT_PROGRESS.height / 2)}
        fill={colors.dim}
        opacity={0.35}
      />
      {hudState.pills}
      <Rect
        x={SHORT_CAPTION.x}
        y={SHORT_CAPTION.y}
        width={SHORT_CAPTION.width + 40}
        height={SHORT_CAPTION.lineHeight * SHORT_CAPTION.maxLines + 12}
        radius={radius(16)}
        fill={withAlpha(colors.bg, 0.72)}
        stroke={colors.border}
        lineWidth={borderWidth(1.5)}
      />
      <Txt
        ref={hudState.cap}
        x={SHORT_CAPTION.x}
        y={SHORT_CAPTION.y}
        width={SHORT_CAPTION.width}
        text=""
        fontFamily={fonts.sans}
        fontWeight={500}
        fontSize={SHORT_CAPTION.fontSize}
        lineHeight={SHORT_CAPTION.lineHeight}
        textAlign="center"
        textWrap
        fill={colors.ink}
      />
      <Node opacity={0}>
        <Rect ref={hudState.secChip} width={1} height={1} fill={colors.brand}>
          <Txt ref={hudState.secTxt} text="" />
        </Rect>
      </Node>
    </Node>,
  );
}
