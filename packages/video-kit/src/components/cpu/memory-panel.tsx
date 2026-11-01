import {Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeOutCubic} from '@motion-canvas/core';
import {formatBits} from '../../cpu/format';
import {boxStyle, radius} from '../../theme/box-style';
import {colors} from '../../theme/colors';
import {fonts} from '../../theme/fonts';
import {withAlpha} from '../../themes/color-utils';
import {lamp, lampOn, type Lamp} from './lamp';
import {memoryRowY} from './memory-geometry';

/** Options for {@link memoryPanel}. */
export interface MemoryPanelOptions {
  x: number;
  y: number;
  w?: number;
  rows?: number;
  accent: string;
}

/** Handles returned by {@link memoryPanel}. */
export interface MemoryPanel {
  node: Rect;
  rowY(i: number): number;
  decText(i: number): Txt;
  addrText(i: number): Txt;
  cellText(i: number): Txt;
  meaningText(i: number): Txt;
  header: {title: Txt; read: Rect; write: Rect};
  rowTag(i: number, text: string, color: string): void;
}

/** Row highlight nodes, kept out of the public handle. */
const highlightsByPanel = new WeakMap<MemoryPanel, Rect[]>();

/**
 * A memory table: decimal address, binary address, 8-bit byte and meaning.
 *
 * @example
 * const mem = memoryPanel({x: 610, y: -5, accent: colors.cyan});
 * view.add(mem.node);
 * setCell(mem, 12, 5, '5');
 */
export function memoryPanel(options: MemoryPanelOptions): MemoryPanel {
  const {x, y, w = 560, rows = 16, accent} = options;
  const h = 70 + rows * 44;
  const dec = Array.from({length: rows}, () => createRef<Txt>());
  const addr = Array.from({length: rows}, () => createRef<Txt>());
  const cell = Array.from({length: rows}, () => createRef<Txt>());
  const meaning = Array.from({length: rows}, () => createRef<Txt>());
  const tags = Array.from({length: rows}, () => createRef<Txt>());
  const highlights = Array.from({length: rows}, () => createRef<Rect>());
  const title = createRef<Txt>();
  const readLamp = lamp({label: 'READ', color: colors.red, w: 78});
  const writeLamp = lamp({label: 'WRITE', color: colors.red, w: 82});

  const localRowY = (i: number): number => -h / 2 + 70 + 44 * i + 22;

  const rowNodes = Array.from({length: rows}, (_, i) => [
    <Rect
      ref={highlights[i]}
      y={localRowY(i)}
      width={w - 20}
      height={40}
      radius={radius(8)}
      fill={withAlpha(accent, 0.24)}
      opacity={0}
    />,
    <Txt
      ref={dec[i]}
      x={-w / 2 + 24}
      y={localRowY(i)}
      offsetX={-1}
      text={String(i)}
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={19}
      fill={colors.mute}
    />,
    <Txt
      ref={addr[i]}
      x={-w / 2 + 74}
      y={localRowY(i)}
      offsetX={-1}
      text={formatBits(i, 4)}
      fontFamily={fonts.mono}
      fontSize={17}
      fill={colors.dim}
    />,
    <Txt
      ref={cell[i]}
      x={-w / 2 + 176}
      y={localRowY(i)}
      offsetX={-1}
      text="00000000"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={20}
      fill={colors.mute}
    />,
    <Txt
      ref={meaning[i]}
      x={w / 2 - 156}
      y={localRowY(i)}
      offsetX={-1}
      text=""
      fontFamily={fonts.mono}
      fontSize={16}
      fill={colors.mute}
    />,
    <Txt
      ref={tags[i]}
      x={w / 2 - 18}
      y={localRowY(i)}
      offsetX={1}
      text=""
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={13}
      letterSpacing={1}
      fill={colors.mute}
    />,
  ]).flat();

  const node = (
    <Rect x={x} y={y} width={w} height={h} radius={radius(18)} fill={colors.surf} {...boxStyle(accent, 8, 4)}>
      <Txt
        ref={title}
        x={-w / 2 + 24}
        y={-h / 2 + 34}
        offsetX={-1}
        text="MEMORY"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={19}
        letterSpacing={2}
        fill={colors.ink}
      />
      {readLamp.node}
      {writeLamp.node}
      {rowNodes}
    </Rect>
  ) as Rect;

  readLamp.node.x(w / 2 - 190);
  readLamp.node.y(-h / 2 + 34);
  writeLamp.node.x(w / 2 - 92);
  writeLamp.node.y(-h / 2 + 34);

  const handle: MemoryPanel = {
    node,
    rowY: (i: number) => memoryRowY(y, rows, i),
    decText: (i: number) => dec[i](),
    addrText: (i: number) => addr[i](),
    cellText: (i: number) => cell[i](),
    meaningText: (i: number) => meaning[i](),
    header: {title: title(), read: readLamp.node, write: writeLamp.node},
    rowTag: (i: number, text: string, color: string) => {
      tags[i]().text(text);
      tags[i]().fill(color);
    },
  };
  highlightsByPanel.set(
    handle,
    highlights.map(ref => ref()),
  );
  return handle;
}

/**
 * Write a cell's byte and meaning with no animation.
 *
 * @example
 * setCell(mem, 14, 8, '8');
 */
export function setCell(panel: MemoryPanel, i: number, value: number, meaning?: string): void {
  panel.cellText(i).text(formatBits(value, 8));
  if (meaning !== undefined) panel.meaningText(i).text(meaning);
}

/**
 * Write a cell with a short flash, as if memory stored a new byte.
 *
 * @example
 * yield* writeCell(mem, 14, 8, '8');
 */
export function* writeCell(panel: MemoryPanel, i: number, value: number, meaning?: string): ThreadGenerator {
  const text = panel.cellText(i);
  text.text(formatBits(value, 8));
  if (meaning !== undefined) panel.meaningText(i).text(meaning);
  text.fill(colors.ink);
  yield* all(text.scale(1.16, 0.08, easeOutCubic), text.fill(colors.yellow, 0.08));
  yield* all(text.scale(1, 0.2, easeOutCubic), text.fill(colors.ink, 0.2));
}

/**
 * Fade a row tint on or off.
 *
 * @example
 * yield* highlightRow(mem, 4, colors.yellow, true);
 */
export function* highlightRow(panel: MemoryPanel, i: number, color: string, on: boolean): ThreadGenerator {
  const highlight = highlightsByPanel.get(panel)?.[i];
  if (!highlight) return;
  highlight.fill(withAlpha(color, 0.24));
  yield* highlight.opacity(on ? 1 : 0, 0.2);
}

/**
 * Set a row tint with no animation, for jumping the machine to a known state.
 *
 * @example
 * setRowTint(mem, 4, colors.yellow, true);
 */
export function setRowTint(panel: MemoryPanel, i: number, color: string, on: boolean): void {
  const highlight = highlightsByPanel.get(panel)?.[i];
  if (!highlight) return;
  highlight.fill(withAlpha(color, 0.24));
  highlight.opacity(on ? 1 : 0);
}

/** Re-export the lamp helper so a scene can drive the memory header directly. */
export {lampOn, type Lamp};
