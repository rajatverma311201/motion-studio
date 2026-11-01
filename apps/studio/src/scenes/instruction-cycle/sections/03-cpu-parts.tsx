import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, sequence, waitFor} from '@motion-canvas/core';
import {
  ADD_PROGRAM,
  boxStyle,
  colors,
  flyAlong,
  fonts,
  lampOn,
  leave,
  pop,
  radius,
  say,
  tintedSurface,
  valuePacket,
  type RegisterBox,
} from '@motion-studio/video-kit';
import {buildMachine} from '../machine';

/** Turn an empty register outline into the coloured register it represents. */
function* activate(box: RegisterBox, hint: string): ThreadGenerator {
  yield* all(
    box.node.fill(tintedSurface(box.color), 0.3),
    box.node.stroke(box.color, 0.3),
    box.name.parent() ? box.name.parent().opacity(1, 0.2) : waitFor(0),
    box.name.opacity(1, 0.2),
    box.value.opacity(1, 0.2),
    box.hint.opacity(1, 0.2),
  );
  box.hint.text(hint);
  yield* box.node.scale(1.04, 0.12);
  yield* box.node.scale(1, 0.16);
}

// ================================================================ 02 CPU PARTS
export function* cpuPartsSection(view: View2D): ThreadGenerator {
  const machine = buildMachine(view, {program: ADD_PROGRAM, reveal: true});
  const extra = createRef<Node>();
  const fx = createRef<Node>();
  view.add(
    <Node ref={extra}>
      <Node ref={fx} zIndex={20} />
    </Node>,
  );

  // Every register starts as a plain outline.
  const boxes = Object.values(machine.regs);
  boxes.forEach(box => {
    box.node.fill(colors.surf2);
    box.node.stroke(colors.dim);
    if (box.name.parent()) box.name.parent().opacity(0);
    box.name.opacity(0);
    box.value.opacity(0);
    box.hint.opacity(0);
  });

  yield* say('The CPU is a fast, simple worker that sits next to memory.');
  yield* all(
    machine.mem.node.opacity(1, 0.4),
    machine.parts.cpu.opacity(1, 0.4),
    machine.parts.banner.opacity(1, 0.4),
    machine.parts.tick.opacity(1, 0.4),
  );
  yield* machine.banner.set('CPU', colors.pink, 'does one tiny step at a time');
  yield* waitFor(8);

  yield* say('Its desk is a handful of tiny storage slots called registers.');
  yield* machine.banner.set('REGISTERS', colors.pink, 'tiny, fast storage inside the CPU');
  yield* sequence(0.12, ...boxes.map(box => pop(box.node, 0.3)));
  yield* waitFor(7.8);

  yield* say('PC, the program counter, holds the address of the next instruction.');
  yield* machine.banner.set('PC', colors.lime, 'PROGRAM COUNTER · address of the next instruction');
  yield* activate(machine.regs.PC, 'next instruction');
  yield* waitFor(8);

  yield* say('MAR holds the address we want. MDR holds the data coming or going.');
  yield* machine.banner.set('MAR', colors.cyan, 'which box to open');
  yield* activate(machine.regs.MAR, 'address to open');
  yield* waitFor(4.5);
  yield* machine.banner.set('MDR', colors.pink, 'what came out of, or goes into, the box');
  yield* activate(machine.regs.MDR, 'data in or out');
  yield* waitFor(7);

  yield* say('IR holds the instruction we are working on right now.');
  yield* machine.banner.set('IR', colors.yellow, 'INSTRUCTION REGISTER · the instruction in hand');
  yield* activate(machine.regs.IR, 'instruction in hand');
  yield* waitFor(8);

  yield* say('ACC, the accumulator, holds the value we are calculating with.');
  yield* machine.banner.set('ACC', colors.violet, 'ACCUMULATOR · the working value');
  yield* activate(machine.regs.ACC, 'working value');
  yield* waitFor(8);

  yield* say('The Z flag remembers: was the last result zero?');
  yield* machine.banner.set('Z', colors.orange, 'ZERO FLAG · 1 if the last result was 0');
  yield* activate(machine.regs.Z, '');
  yield* waitFor(8);

  yield* say('The ALU does the arithmetic. The control unit tells everyone what to do.');
  yield* machine.banner.set('ALU', colors.violet, 'adds and subtracts');
  yield* pop(machine.parts.alu, 0.4);
  yield* waitFor(4);
  yield* machine.banner.set('CONTROL UNIT', colors.pink, 'decodes instructions, sends signals');
  yield* pop(machine.parts.control, 0.4);
  yield* waitFor(8);

  yield* say('Buses are shared wires between the CPU and memory.');
  yield* machine.banner.set('BUSES', colors.cyan, 'shared wires');
  yield* machine.parts.buses.opacity(1, 0.6);
  yield* waitFor(7);

  yield* say('Address bus: where. Data bus: what. Control lines: read or write.');
  yield* machine.banner.set(
    'BUSES',
    colors.cyan,
    'ADDRESS BUS → one way · DATA BUS ↔ two ways · CONTROL · READ / WRITE',
  );
  const addressPacket = valuePacket('0100', colors.cyan);
  const dataPacket = valuePacket('00000101', colors.pink);
  fx().add(addressPacket);
  fx().add(dataPacket);
  yield* all(
    flyAlong(
      addressPacket,
      [
        [110, -255],
        [250, -255],
        [250, 360],
      ],
      0.9,
    ),
    flyAlong(
      dataPacket,
      [
        [110, -95],
        [190, -95],
        [190, 360],
      ],
      1.1,
    ),
    lampOn(machine.mem.header.read, true),
  );
  yield* all(lampOn(machine.mem.header.read, false), lampOn(machine.mem.header.write, true));
  yield* lampOn(machine.mem.header.write, false);
  yield* waitFor(7);

  // ---- the speed ladder ---------------------------------------------------
  yield* say('Registers are fastest, memory is slower, disk is slower still.');
  yield* machine.root.opacity(0, 0.5);
  const ladder = [
    {label: 'REGISTERS', color: colors.violet, y: -140, width: 300, tag: 'inside the CPU · fastest'},
    {label: 'MEMORY (RAM)', color: colors.cyan, y: 20, width: 560, tag: 'across the bus · slower'},
    {label: 'DISK', color: colors.yellow, y: 180, width: 920, tag: 'slowest · keeps data when power is off'},
  ];
  const bars = ladder.map(item => {
    const left = -760;
    const bar = (
      <Rect
        x={left + item.width / 2}
        y={item.y}
        width={item.width}
        height={58}
        radius={radius(14)}
        fill={item.color}
        {...boxStyle(colors.ink, 6, 3.5)}
      >
        <Txt
          text={item.label}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={22}
          letterSpacing={2}
          fill={colors.onAccent}
        />
      </Rect>
    ) as Rect;
    const tag = (
      <Txt
        x={left + item.width + 28}
        y={item.y}
        offsetX={-1}
        text={item.tag}
        fontFamily={fonts.mono}
        fontSize={18}
        fill={colors.mute}
      />
    ) as Txt;
    bar.opacity(0);
    tag.opacity(0);
    extra().add(bar);
    extra().add(tag);
    return {bar, tag};
  });
  extra().add(
    <Txt
      x={-760}
      y={-310}
      offsetX={-1}
      text="SPEED"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={20}
      letterSpacing={3}
      fill={colors.mute}
    />,
  );
  yield* sequence(0.2, ...bars.map(({bar, tag}) => all(pop(bar, 0.35), delay(0.15, tag.opacity(1, 0.3)))));
  yield* waitFor(9);
  yield* all(leave(machine.root), leave(extra()));
}
