import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import {pop} from '../../animation';
import {borderWidth, boxStyle, colors, fonts, radius} from '../../theme';
import {chip} from '../chip';
import {label} from '../label';

/** One input of a {@link processMachine}. */
export interface ProcessMachineInput {
  id: string;
  label: string;
}

/** One output of a {@link processMachine}. */
export type ProcessMachineOutput = ProcessMachineInput;

/** Options for {@link processMachine}. */
export interface ProcessMachineOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Text inside the centre box, e.g. SHA-256. */
  label: string;
  inputs: readonly ProcessMachineInput[];
  outputs: readonly ProcessMachineOutput[];
  /** Accent for the border and shadow. Defaults to colors.yellow. */
  color?: string;
}

/** Handles returned by {@link processMachine}. */
export interface ProcessMachine {
  node: Rect;
  /** Slide every input into the box, pulse it, then move each output to its slot. */
  run(values: Record<string, string>): ThreadGenerator;
  /** Remove transient chips and reset the box. */
  reset(): void;
}

/**
 * A generic process box: labelled input slots on the left, a centre box and
 * output slots on the right. It performs no computation; the caller passes
 * every string in `run()`.
 *
 * @example
 * const machine = processMachine({
 *   x: 0, y: 0, w: 1100, h: 420, label: 'SHA-256',
 *   inputs: [{id: 'message', label: 'MESSAGE'}],
 *   outputs: [{id: 'digest', label: 'DIGEST'}],
 * });
 * view.add(machine.node);
 * yield* machine.run({message: 'pay 500 to Bob', digest: '528c8ed2…'});
 */
export function processMachine(options: ProcessMachineOptions): ProcessMachine {
  const {x, y, w, h, label: machineLabel, inputs, outputs} = options;
  if (inputs.length === 0) throw new Error('processMachine: needs at least one input');
  if (outputs.length === 0) throw new Error('processMachine: needs at least one output');

  const color = options.color ?? colors.yellow;
  const slotW = w * 0.26;
  const slotH = Math.min(64, h * 0.16);
  const gap = h * 0.065;
  const inputX = -w / 2 + slotW / 2 + 30;
  const outputX = w / 2 - slotW / 2 - 30;
  const boxW = w * 0.28;
  const boxH = h * 0.46;
  const boxY = -h * 0.03;
  const boxRef = createRef<Rect>();

  const spread = (count: number): number[] => {
    const total = count * slotH + (count - 1) * gap;
    const start = boxY - total / 2 + slotH / 2;
    return Array.from({length: count}, (_, index) => start + index * (slotH + gap));
  };
  const inputYs = spread(inputs.length);
  const outputYs = spread(outputs.length);

  const slot = (cx: number, cy: number): Rect =>
    (
      <Rect
        x={cx}
        y={cy}
        width={slotW}
        height={slotH}
        radius={radius(14)}
        fill={colors.surf2}
        stroke={colors.dim}
        lineWidth={borderWidth(2)}
        lineDash={[8, 8]}
      />
    ) as Rect;

  const node = (
    <Rect x={x} y={y} width={w} height={h} radius={radius(26)} fill={colors.surf} {...boxStyle(color, 10, 4)}>
      {inputs.map((input, index) => slot(inputX, inputYs[index]))}
      {outputs.map((output, index) => slot(outputX, outputYs[index]))}
      {inputs.map((input, index) => (
        <Line
          points={[
            [inputX + slotW / 2, inputYs[index]],
            [-boxW / 2, inputYs[index]],
          ]}
          stroke={colors.dim}
          lineWidth={3}
          endArrow
          arrowSize={12}
        />
      ))}
      {outputs.map((output, index) => (
        <Line
          points={[
            [boxW / 2, outputYs[index]],
            [outputX - slotW / 2, outputYs[index]],
          ]}
          stroke={colors.dim}
          lineWidth={3}
          endArrow
          arrowSize={12}
        />
      ))}
      <Rect
        ref={boxRef}
        x={0}
        y={boxY}
        width={boxW}
        height={boxH}
        radius={radius(18)}
        fill={colors.code}
        stroke={color}
        lineWidth={borderWidth(4)}
      >
        <Txt
          text={machineLabel}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={24}
          letterSpacing={1}
          fill={color}
        />
      </Rect>
      {inputs.map((input, index) => label(input.label, inputX, inputYs[index] - slotH / 2 - 14, {fs: 15}))}
      {outputs.map((output, index) => label(output.label, outputX, outputYs[index] - slotH / 2 - 14, {fs: 15}))}
    </Rect>
  ) as Rect;

  let transients: Node[] = [];

  function reset(): void {
    for (const child of transients) child.remove();
    transients = [];
    boxRef().scale(1);
  }

  function* run(values: Record<string, string>): ThreadGenerator {
    reset();

    const inputChips = inputs.map((input, index) => {
      const item = chip(values[input.id] ?? '', colors.cyan, {fs: 18, mono: true});
      item.x(inputX);
      item.y(inputYs[index]);
      item.opacity(0);
      node.add(item);
      transients.push(item);
      return item;
    });

    yield* all(...inputChips.map((item, index) => delay(index * 0.1, pop(item, 0.24))));
    yield* all(...inputChips.map(item => item.position([0, boxY], 0.4, easeInOutCubic)));
    yield* all(...inputChips.map(item => item.opacity(0, 0.15)));
    for (const item of inputChips) item.remove();
    transients = transients.filter(child => !inputChips.includes(child as Rect));

    yield* boxRef().scale(1.08, 0.16, easeOutCubic);
    yield* boxRef().scale(1, 0.2, easeInOutCubic);

    for (let index = 0; index < outputs.length; index++) {
      const item = chip(values[outputs[index].id] ?? '', colors.lime, {fs: 18, mono: true});
      item.x(0);
      item.y(boxY);
      item.opacity(0);
      node.add(item);
      transients.push(item);
      yield* pop(item, 0.24);
      yield* item.position([outputX, outputYs[index]], 0.4, easeInOutCubic);
    }
  }

  return {node, run, reset};
}
