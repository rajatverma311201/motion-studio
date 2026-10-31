import {Node, Txt} from '@motion-canvas/2d';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

/** Options for {@link stackedTitle}. */
export interface StackedTitleOptions {
  text: string;
  fontSize: number;
  y: number;
  /** Letter spacing in pixels. Defaults to -2. */
  letterSpacing?: number;
  /** Offset between the three stacked copies. Defaults to 9. */
  offset?: number;
}

/**
 * Hard-shadow headline stack: pink and cyan copies sit behind the cream text.
 * This is the older lesson title look; `titleBlock()` is the theme-aware treatment.
 *
 * @example
 * view.add(stackedTitle({text: 'DB TRANSACTIONS', fontSize: 168, y: 10}));
 */
export function stackedTitle(options: StackedTitleOptions): Node {
  const {text, fontSize, y, letterSpacing = -2, offset = 9} = options;
  const copy = (fill: string, d: number) =>
    (
      <Txt
        text={text}
        fontSize={fontSize}
        fontWeight={700}
        fontFamily={fonts.sans}
        fill={fill}
        x={d}
        y={d}
        letterSpacing={letterSpacing}
      />
    ) as Txt;
  return (
    <Node y={y}>
      {copy(colors.pink, offset * 2)}
      {copy(colors.cyan, offset)}
      {copy(colors.ink, 0)}
    </Node>
  ) as Node;
}
