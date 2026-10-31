import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {borderWidth, boxStyle, colors, fonts, radius, withAlpha} from '../../theme';
import type {CodeLanguage} from './languages';
import {tokenize} from './tokenizer';

/** Distance between two code lines inside a panel. */
export const LINE_HEIGHT = 38;

/** Options for {@link codePanel}. */
export interface CodePanelOptions {
  x: number;
  y: number;
  w: number;
  title: string;
  code: string[];
  lang: CodeLanguage;
  accent: string;
  fs?: number;
}

/** Handles returned by {@link codePanel}, consumed by `focusLine` and `revealLines`. */
export interface CodePanel {
  node: Rect;
  hl: Rect;
  lines: Node[];
  lineY: (i: number) => number;
}

/**
 * Build a syntax-coloured code panel with a title bar and a highlight bar.
 *
 * @example
 * const panel = codePanel({x: 0, y: 0, w: 980, title: 'users.sql', code, lang: 'sql', accent: colors.cyan});
 */
export function codePanel(options: CodePanelOptions): CodePanel {
  const h = 64 + options.code.length * LINE_HEIGHT + 36;
  const lineY = (i: number): number => -h / 2 + 64 + 18 + i * LINE_HEIGHT + LINE_HEIGHT / 2;
  const hl = (
    <Rect
      width={options.w - 24}
      height={LINE_HEIGHT}
      radius={radius(8)}
      fill={withAlpha(colors.ink, 0.09)}
      opacity={0}
      y={lineY(0)}
    >
      <Rect x={-(options.w - 24) / 2 + 3} width={6} height={LINE_HEIGHT - 8} radius={radius(3)} fill={options.accent} />
    </Rect>
  ) as Rect;
  // Each token is its own Txt on a fixed monospace grid (0.6 em per glyph):
  // nested Txt children do not flow inline in Motion Canvas 3.17.2.
  const fs = options.fs ?? 24;
  const cw = fs * 0.6;
  const lines = options.code.map((ln, i) => {
    let col = 0;
    const toks: Txt[] = [];
    for (const [t, c] of tokenize(ln, options.lang)) {
      if (t.trim().length > 0) {
        toks.push(
          (
            <Txt x={col * cw} offsetX={-1} text={t} fontFamily={fonts.mono} fontSize={fs} fontWeight={400} fill={c} />
          ) as Txt,
        );
      }
      col += t.length;
    }
    return (
      <Node x={-options.w / 2 + 32} y={lineY(i)} opacity={0}>
        {toks}
      </Node>
    ) as Node;
  });
  const node = (
    <Rect
      x={options.x}
      y={options.y}
      width={options.w}
      height={h}
      radius={radius(20)}
      fill={colors.code}
      {...boxStyle(options.accent, 10, 4)}
    >
      <Rect y={-h / 2 + 32} width={options.w} height={64} fill={colors.surf2} radius={radius([20, 20, 0, 0])} />
      <Line
        points={[
          [-options.w / 2, -h / 2 + 64],
          [options.w / 2, -h / 2 + 64],
        ]}
        stroke={colors.ink}
        lineWidth={borderWidth(4)}
      />
      <Circle x={-options.w / 2 + 38} y={-h / 2 + 32} size={18} fill={colors.red} />
      <Circle x={-options.w / 2 + 70} y={-h / 2 + 32} size={18} fill={colors.yellow} />
      <Circle x={-options.w / 2 + 102} y={-h / 2 + 32} size={18} fill={colors.lime} />
      <Txt
        x={options.w / 2 - 28}
        y={-h / 2 + 32}
        offsetX={1}
        text={options.title}
        fontFamily={fonts.mono}
        fontSize={20}
        fill={colors.mute}
      />
      {hl}
      {lines}
    </Rect>
  ) as Rect;
  return {node, hl, lines, lineY};
}
