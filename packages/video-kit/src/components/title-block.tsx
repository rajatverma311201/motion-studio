import {Node, Rect, Txt} from '@motion-canvas/2d';
import {boxStyle, colors, fonts, radius, type ColorName} from '../theme';
import {getTheme} from '../themes/active-theme';
import type {TitleStyle} from '../themes/theme-types';

/** Options for the large intro title block. */
export interface TitleBlockOptions {
  text: string;
  fontSize?: number;
  y?: number;
  /** Overrides the active theme's `hud.titleStyle`. */
  style?: TitleStyle;
}

/**
 * The video title in the style chosen by the active theme.
 *
 * @example
 * view.add(titleBlock({text: 'DB INDEXING', y: -210}));
 */
export function titleBlock(options: TitleBlockOptions): Node {
  const {text, fontSize = 168, y = 0} = options;
  const style = options.style ?? getTheme().hud.titleStyle;

  if (style === 'plain') {
    return (
      <Node y={y}>
        <Txt
          text={text}
          fontSize={fontSize}
          fontWeight={700}
          fontFamily={fonts.display}
          fill={colors.ink}
          letterSpacing={-2}
        />
        <Rect y={fontSize * 0.62} width={160} height={6} radius={radius(3)} fill={colors.brand} />
      </Node>
    ) as Node;
  }

  if (style === 'pill') {
    return (
      <Rect
        y={y}
        layout
        alignItems="center"
        padding={[8, 36]}
        radius={radius(999)}
        fill={colors.brand}
        {...boxStyle(colors.violet, 10, 5)}
      >
        <Txt
          text={text}
          fontSize={fontSize}
          fontWeight={700}
          fontFamily={fonts.display}
          fill={colors.onBrand}
          letterSpacing={-1}
        />
      </Rect>
    ) as Rect;
  }

  return (
    <Rect
      layout
      alignItems="center"
      padding={[14, 64]}
      radius={radius(30)}
      fill={colors.brand}
      y={y}
      {...boxStyle(colors.violet, 18, 7)}
    >
      <Txt
        text={text}
        fontSize={fontSize}
        fontWeight={700}
        fontFamily={fonts.display}
        fill={colors.onBrand}
        letterSpacing={-3}
      />
    </Rect>
  ) as Rect;
}

/** Options for the smaller intro title pill. */
export interface TitlePillOptions {
  text: string;
  fill?: ColorName;
  fontSize?: number;
}

/**
 * Smaller coloured pill with dark text for a secondary title line.
 *
 * @example
 * view.add(titlePill({text: 'B-TREE', fill: 'cyan'}));
 */
export function titlePill(options: TitlePillOptions): Rect {
  const {text, fill = 'lime', fontSize = 84} = options;
  return (
    <Rect
      layout
      alignItems="center"
      padding={[8, 36]}
      radius={radius(22)}
      fill={colors[fill]}
      {...boxStyle(colors.violet, 10, 5)}
    >
      <Txt
        text={text}
        fontSize={fontSize}
        fontWeight={700}
        fontFamily={fonts.display}
        fill={colors.onAccent}
        letterSpacing={-1}
      />
    </Rect>
  ) as Rect;
}
