import {Line, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import {pop} from '../../animation';
import {borderWidth, boxStyle, colors, fonts, radius} from '../../theme';
import {chip} from '../chip';
import {label} from '../label';
import {keyIcon} from './icons';

/** Options for {@link hmacMachine}. */
export interface HmacMachineOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Text inside the centre box. Defaults to HMAC-SHA256. */
  label?: string;
}

/** What one {@link HmacMachine.run} shows. The machine never computes these. */
export interface HmacRunOptions {
  message: string;
  key: string;
  tag: string;
}

/** Handles returned by {@link hmacMachine}. */
export interface HmacMachine {
  node: Rect;
  /** Slide the message and key in, pulse the box, then move the tag to its slot. */
  run(options: HmacRunOptions): ThreadGenerator;
  /** Remove transient chips and reset the box. */
  reset(): void;
}

/**
 * A sealing machine: two input slots (MESSAGE and KEY), a labelled HMAC box and
 * a TAG output slot. The caller supplies every string; this component only
 * animates them.
 *
 * @example
 * const machine = hmacMachine({x: 0, y: 0, w: 880, h: 420});
 * view.add(machine.node);
 * yield* machine.run({message: 'header.payload', key: 'SECRET', tag: JWT_SIGNATURE});
 */
export function hmacMachine(options: HmacMachineOptions): HmacMachine {
  const {x, y, w, h} = options;
  const slotW = w * 0.32;
  const slotH = h * 0.2;
  const msg = {x: -w * 0.28, y: -h * 0.22};
  const key = {x: -w * 0.28, y: h * 0.06};
  const box = {x: w * 0.08, y: -h * 0.06, w: w * 0.3, h: h * 0.42};
  const tag = {x: 0, y: h * 0.34};
  const boxRef = createRef<Rect>();

  const slot = (at: {x: number; y: number}, width = slotW): Rect =>
    (
      <Rect
        x={at.x}
        y={at.y}
        width={width}
        height={slotH}
        radius={radius(14)}
        fill={colors.surf2}
        stroke={colors.dim}
        lineWidth={borderWidth(2)}
        lineDash={[8, 8]}
      />
    ) as Rect;

  const node = (
    <Rect x={x} y={y} width={w} height={h} radius={radius(28)} fill={colors.surf} {...boxStyle(colors.yellow, 12, 4)}>
      {slot(msg)}
      {slot(key)}
      {slot(tag, w * 0.8)}
      {label('MESSAGE', msg.x, msg.y - slotH / 2 - 18, {fs: 18})}
      {label('KEY', key.x, key.y - slotH / 2 - 18, {fs: 18})}
      {label('TAG', tag.x, tag.y - slotH / 2 - 18, {fs: 18})}
      {keyIcon({x: key.x - slotW / 2 + 36, y: key.y, size: 44, color: colors.yellow})}
      <Line
        points={[
          [msg.x + slotW / 2, msg.y],
          [box.x - box.w / 2, box.y],
        ]}
        stroke={colors.dim}
        lineWidth={3}
        endArrow
        arrowSize={14}
      />
      <Line
        points={[
          [key.x + slotW / 2, key.y],
          [box.x - box.w / 2, box.y],
        ]}
        stroke={colors.dim}
        lineWidth={3}
        endArrow
        arrowSize={14}
      />
      <Rect
        ref={boxRef}
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        radius={radius(18)}
        fill={colors.code}
        stroke={colors.yellow}
        lineWidth={borderWidth(4)}
      >
        <Txt
          text={options.label ?? 'HMAC-SHA256'}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={20}
          letterSpacing={1}
          fill={colors.yellow}
        />
      </Rect>
    </Rect>
  ) as Rect;

  let transients: Rect[] = [];

  function reset(): void {
    for (const child of transients) child.remove();
    transients = [];
    boxRef().scale(1);
  }

  function* run(runOptions: HmacRunOptions): ThreadGenerator {
    reset();
    const messageChip = chip(runOptions.message, colors.cyan, {fs: 20, mono: true});
    const keyChip = chip(runOptions.key, colors.yellow, {fs: 20, mono: true});

    for (const [transient, at] of [
      [messageChip, msg],
      [keyChip, key],
    ] as const) {
      transient.x(at.x);
      transient.y(at.y);
      transient.opacity(0);
      node.add(transient);
      transients.push(transient);
    }

    yield* all(pop(messageChip, 0.28), pop(keyChip, 0.28));
    yield* all(
      messageChip.position([box.x, box.y], 0.45, easeInOutCubic),
      keyChip.position([box.x, box.y], 0.45, easeInOutCubic),
    );
    yield* all(messageChip.opacity(0, 0.15), keyChip.opacity(0, 0.15));
    messageChip.remove();
    keyChip.remove();
    transients = transients.filter(child => child !== messageChip && child !== keyChip);

    yield* boxRef().scale(1.08, 0.18, easeOutCubic);
    yield* boxRef().scale(1, 0.22, easeInOutCubic);

    const tagChip = chip(runOptions.tag, colors.lime, {fs: 18, mono: true});
    tagChip.x(box.x);
    tagChip.y(box.y);
    tagChip.opacity(0);
    node.add(tagChip);
    transients.push(tagChip);

    yield* pop(tagChip, 0.28);
    yield* tagChip.position([tag.x, tag.y], 0.45, easeInOutCubic);
  }

  return {node, run, reset};
}
