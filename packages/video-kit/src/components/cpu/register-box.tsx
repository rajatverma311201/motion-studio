import {Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeOutCubic} from '@motion-canvas/core';
import {formatBits} from '../../cpu/format';
import {boxStyle, radius, tintedSurface} from '../../theme/box-style';
import {colors} from '../../theme/colors';
import {fonts} from '../../theme/fonts';

/** Options for {@link registerBox}. */
export interface RegisterBoxOptions {
  name: string;
  /** Width of the value in bits, e.g. 4 for PC and 8 for ACC. */
  bits: number;
  color: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** Starting value; rendered as zero-padded binary. */
  value?: number;
  /** Small muted line under the value. */
  hint?: string;
}

/** Handles returned by {@link registerBox}. */
export interface RegisterBox {
  node: Rect;
  name: Txt;
  bits: number;
  color: string;
  value: Txt;
  hint: Txt;
  w: number;
  h: number;
}

/** Options for {@link writeRegister}. */
export interface WriteRegisterOptions {
  dur?: number;
  hint?: string;
}

/**
 * A register card: name chip, large binary value and a muted hint line.
 *
 * @example
 * const pc = registerBox({name: 'PC', bits: 4, color: colors.lime, x: -380, y: -255, hint: '4'});
 * view.add(pc.node);
 */
export function registerBox(options: RegisterBoxOptions): RegisterBox {
  const {name, bits, color, x, y, w = 260, h = 120, value = 0, hint = ''} = options;
  const nameRef = createRef<Txt>();
  const valueRef = createRef<Txt>();
  const hintRef = createRef<Txt>();
  const short = h < 100;
  const valueFs = Math.min(short ? 30 : 52, (w - 36) / (Math.max(bits, 1) * 0.6));
  const node = (
    <Rect x={x} y={y} width={w} height={h} radius={radius(14)} fill={tintedSurface(color)} {...boxStyle(color, 6, 3.5)}>
      <Rect
        x={-w / 2 + 10}
        y={-h / 2 + 10}
        offsetX={-1}
        layout
        alignItems="center"
        padding={[2, 9]}
        radius={radius(6)}
        fill={color}
      >
        <Txt ref={nameRef} text={name} fontFamily={fonts.mono} fontWeight={700} fontSize={16} fill={colors.onAccent} />
      </Rect>
      <Txt
        ref={valueRef}
        y={short ? 12 : 10}
        text={formatBits(value, bits)}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={valueFs}
        fill={colors.ink}
        letterSpacing={1}
      />
      <Txt ref={hintRef} y={h / 2 - 18} text={hint} fontFamily={fonts.mono} fontSize={15} fill={colors.mute} />
    </Rect>
  ) as Rect;
  return {node, name: nameRef(), bits, color, value: valueRef(), hint: hintRef(), w, h};
}

/**
 * Pulse a register, swap its binary value and flash its border.
 *
 * @example
 * yield* writeRegister(pc, 5, {hint: 'next: 5'});
 */
export function* writeRegister(box: RegisterBox, value: number, options: WriteRegisterOptions = {}): ThreadGenerator {
  const {dur = 0.35, hint} = options;
  box.value.text(formatBits(value, box.bits));
  if (hint !== undefined) box.hint.text(hint);
  yield* all(box.node.scale(1.06, dur * 0.45, easeOutCubic), box.node.stroke(box.color, dur * 0.45));
  yield* all(box.node.scale(1, dur * 0.55, easeOutCubic), box.node.stroke(colors.border, dur * 0.55));
}

/**
 * Set a register's text with no animation, for jumping the machine to a known state.
 *
 * @example
 * setRegister(pc, 4, 'entry');
 */
export function setRegister(box: RegisterBox, value: number, hint?: string): void {
  box.value.text(formatBits(value, box.bits));
  if (hint !== undefined) box.hint.text(hint);
}
