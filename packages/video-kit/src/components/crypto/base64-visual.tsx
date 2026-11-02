import {Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, easeInOutCubic, sequence} from '@motion-canvas/core';
import {pop} from '../../animation';
import {base64Steps} from '../../jwt';
import {borderWidth, boxStyle, colors, fonts, radius, tintedSurface} from '../../theme';
import {chip} from '../chip';
import {label} from '../label';

/** Options for {@link base64Visual}. */
export interface Base64VisualOptions {
  x: number;
  y: number;
  w: number;
  /** The text to walk through the algorithm, e.g. `Man`. */
  input: string;
}

/** Handles returned by {@link base64Visual}. Every step is its own generator. */
export interface Base64Visual {
  node: Node;
  showBytes(): ThreadGenerator;
  showBits(): ThreadGenerator;
  regroup(): ThreadGenerator;
  lookup(): ThreadGenerator;
  showResult(): ThreadGenerator;
  showUrlSafe(): ThreadGenerator;
}

const BYTE_Y = -190;
const GROUP_Y = -40;
const ALPHABET_Y = 118;
const RESULT_Y = 248;
const URL_Y = 318;

/**
 * Animate the Base64 algorithm for one short string: bytes, bits, six-bit
 * groups, alphabet lookups, the encoded result and the URL-safe swap.
 *
 * @example
 * const visual = base64Visual({x: 0, y: -30, w: 1500, input: 'Man'});
 * view.add(visual.node);
 * yield* visual.showBytes();
 * yield* visual.showBits();
 * yield* visual.regroup();
 * yield* visual.lookup();
 * yield* visual.showResult();
 */
export function base64Visual(options: Base64VisualOptions): Base64Visual {
  const {x, y, w, input} = options;
  const steps = base64Steps(input);
  const characters = [...input];

  const byteWidth = Math.min(180, (w - 80) / Math.max(1, steps.bytes.length));
  const groupWidth = Math.min(190, (w - 60) / Math.max(1, steps.groups.length));
  const byteNodes: Rect[] = [];
  const bitNodes: Txt[] = [];
  const groupNodes: Rect[] = [];
  const cellNodes: Rect[] = [];
  const cellTexts: Txt[] = [];

  const byteBoxes = steps.bytes.map((byte, index) => {
    const boxX = (index - (steps.bytes.length - 1) / 2) * (byteWidth + 24);
    const box = (
      <Rect
        x={boxX}
        y={BYTE_Y}
        width={byteWidth}
        height={132}
        radius={radius(16)}
        fill={colors.surf}
        {...boxStyle(colors.yellow, 7, 3.5)}
      >
        <Txt
          text={characters[index] ?? ''}
          y={-30}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={46}
          fill={colors.ink}
        />
        <Txt y={30} text={steps.bits[index]} fontFamily={fonts.mono} fontSize={20} fill={colors.cyan} opacity={0} />
      </Rect>
    ) as Rect;
    byteNodes.push(box);
    const bits = box.children()[1] as Txt;
    bitNodes.push(bits);
    box.opacity(0);
    return box;
  });

  const groupBoxes = steps.groups.map((group, index) => {
    const boxX = (index - (steps.groups.length - 1) / 2) * (groupWidth + 18);
    const box = (
      <Rect
        x={boxX}
        y={GROUP_Y}
        width={groupWidth}
        height={96}
        radius={radius(14)}
        fill={colors.surf}
        {...boxStyle(colors.yellow, 6, 3)}
      >
        <Txt text={group} y={-12} fontFamily={fonts.mono} fontWeight={700} fontSize={24} fill={colors.cyan} />
        <Txt text={`#${steps.indices[index]}`} y={24} fontFamily={fonts.mono} fontSize={18} fill={colors.mute} />
      </Rect>
    ) as Rect;
    groupNodes.push(box);
    box.opacity(0);
    return box;
  });

  const cellWidth = w / 32;
  const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'];
  for (let index = 0; index < alphabet.length; index++) {
    const row = Math.floor(index / 32);
    const column = index % 32;
    const cell = (
      <Rect
        x={-w / 2 + cellWidth * (column + 0.5)}
        y={ALPHABET_Y + row * 34}
        width={cellWidth - 3}
        height={28}
        radius={radius(6)}
        fill={colors.surf2}
      >
        <Txt text={alphabet[index]} fontFamily={fonts.mono} fontSize={17} fill={colors.mute} />
      </Rect>
    ) as Rect;
    cellNodes.push(cell);
    cellTexts.push(cell.children()[0] as Txt);
  }

  const result = (
    <Rect
      y={RESULT_Y}
      width={Math.max(220, steps.chars.length * 42)}
      height={82}
      radius={radius(16)}
      fill={tintedSurface(colors.lime)}
      stroke={colors.lime}
      lineWidth={borderWidth(3.5)}
      opacity={0}
    >
      <Txt text={steps.chars.join('')} fontFamily={fonts.mono} fontWeight={700} fontSize={48} fill={colors.lime} />
    </Rect>
  ) as Rect;

  const standard = chip('STANDARD  +  /  =', colors.surf2, {
    x: -w / 2 + 220,
    y: URL_Y,
    fs: 20,
    color: colors.mute,
    shadow: colors.dim,
    sh: 4,
  }) as Rect;
  const arrow = label('→', -w / 2 + 400, URL_Y, {fs: 34, fill: colors.yellow});
  const urlSafe = chip('URL-SAFE  -  _  (no padding)', colors.yellow, {
    x: -w / 2 + 730,
    y: URL_Y,
    fs: 20,
    sh: 4,
  }) as Rect;
  standard.opacity(0);
  arrow.opacity(0);
  urlSafe.opacity(0);

  const node = (
    <Node x={x} y={y}>
      {label('BYTES  ·  8 BITS EACH', -w / 2, BYTE_Y - 92, {fs: 18, align: 'left'})}
      {byteBoxes}
      {label('SIX-BIT GROUPS', -w / 2, GROUP_Y - 76, {fs: 18, align: 'left'})}
      {groupBoxes}
      {label('BASE64 ALPHABET  ·  64 LETTERS', -w / 2, ALPHABET_Y - 34, {fs: 18, align: 'left'})}
      {cellNodes}
      {label('OUTPUT', -w / 2, RESULT_Y - 58, {fs: 18, align: 'left'})}
      {result}
      {standard}
      {arrow}
      {urlSafe}
    </Node>
  ) as Node;

  function* showBytes(): ThreadGenerator {
    yield* sequence(0.16, ...byteNodes.map(box => pop(box, 0.32)));
  }

  function* showBits(): ThreadGenerator {
    yield* sequence(0.1, ...bitNodes.map(bits => bits.opacity(1, 0.22)));
  }

  function* regroup(): ThreadGenerator {
    yield* sequence(0.12, ...groupNodes.map(box => pop(box, 0.3)));
  }

  function* lookup(): ThreadGenerator {
    for (let index = 0; index < steps.indices.length; index++) {
      const value = steps.indices[index];
      const cell = cellNodes[value];
      const text = cellTexts[value];
      const group = groupNodes[index];
      yield* all(
        cell.fill(colors.yellow, 0.16),
        text.fill(colors.onAccent, 0.16),
        cell.scale(1.25, 0.16),
        group.scale(1.06, 0.16),
      );
      yield* all(cell.scale(1, 0.18, easeInOutCubic), group.scale(1, 0.18, easeInOutCubic));
    }
  }

  function* showResult(): ThreadGenerator {
    yield* pop(result, 0.35);
  }

  function* showUrlSafe(): ThreadGenerator {
    yield* all(pop(standard, 0.28), pop(arrow, 0.28), pop(urlSafe, 0.28));
  }

  return {node, showBytes, showBits, regroup, lookup, showResult, showUrlSafe};
}
