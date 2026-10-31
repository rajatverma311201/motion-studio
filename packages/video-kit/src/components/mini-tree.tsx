import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {boxStyle, radius} from '../theme/box-style';
import type {ThreadGenerator} from '@motion-canvas/core';
import {all} from '@motion-canvas/core';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

export interface MiniTreeOptions {
  /** horizontal centre of the root and of the middle leaf */
  cx: number;
  rootText: string;
  /** one entry per leaf, each entry one highlightable row */
  rows: string[][];
  rootColor: string;
  leafColor: string;
  rowFontSize: number;
}

export interface MiniTree {
  node: Node;
  root: Rect;
  leaves: Rect[];
  rows: Rect[][];
  pos: (i: number) => {x: number; y: number};
}

/**
 * A two-level tree drawn with plain boxes: one root plus three leaves with
 * highlightable rows. Cheaper than TreeView for conceptual diagrams.
 *
 * @example
 * const mini = miniTree({cx: 0, rootText: 'PRIMARY INDEX', rows: [['10', '20'], ['30'], ['40']], rootColor: colors.violet, leafColor: colors.lime, rowFontSize: 22});
 * view.add(mini.node);
 */
export function miniTree({cx, rootText, rows, rootColor, leafColor, rowFontSize}: MiniTreeOptions): MiniTree {
  const LW = 262;
  const LH = 130;
  const G = 14;
  const rootY = -215;
  const leafY = 0;
  const node = (<Node opacity={0} />) as Node;
  const leaves: Rect[] = [];
  const rowRects: Rect[][] = [];
  const xs = rows.map((_, i) => cx + (i - 1) * (LW + G));
  xs.forEach(lx =>
    node.add(
      <Line
        points={[
          [cx, rootY + 33],
          [lx, leafY - LH / 2],
        ]}
        stroke={colors.ink}
        lineWidth={3.5}
      />,
    ),
  );
  const root = (
    <Rect
      x={cx}
      y={rootY}
      width={300}
      height={66}
      radius={radius(14)}
      fill={colors.surf}
      {...boxStyle(rootColor, 6, 3.5)}
    >
      <Txt text={rootText} fontFamily={fonts.mono} fontWeight={700} fontSize={24} fill={colors.ink} />
    </Rect>
  ) as Rect;
  rows.forEach((rs, i) => {
    const hls: Rect[] = [];
    const leaf = (
      <Rect
        x={xs[i]}
        y={leafY}
        width={LW}
        height={LH}
        radius={radius(14)}
        fill={colors.surf}
        {...boxStyle(leafColor, 6, 3.5)}
      >
        {rs.map((t, j) => {
          const h = (
            <Rect y={-30 + j * 58} width={LW - 20} height={46} radius={radius(8)} fill={colors.clear}>
              <Txt text={t} fontFamily={fonts.mono} fontWeight={700} fontSize={rowFontSize} fill={colors.ink} />
            </Rect>
          ) as Rect;
          hls.push(h);
          return h;
        })}
      </Rect>
    ) as Rect;
    leaves.push(leaf);
    rowRects.push(hls);
    node.add(leaf);
  });
  node.add(root);
  return {node, root, leaves, rows: rowRects, pos: i => ({x: xs[i], y: leafY})};
}

/**
 * Highlight a mini-tree row or leaf border.
 *
 * @example
 * yield* highlightStroke(mini.rows[0][1], colors.pink);
 */
export function highlightStroke(r: Rect, color: string, dur = 0.2): ThreadGenerator {
  return all(r.stroke(color, dur), r.lineWidth(6.5, dur));
}

/**
 * Reset a mini-tree row or leaf border to the default ink colour.
 *
 * @example
 * yield* clearStroke(mini.rows[0][1]);
 */
export function clearStroke(r: Rect, dur = 0.2): ThreadGenerator {
  return all(r.stroke(colors.ink, dur), r.lineWidth(3.5, dur));
}
