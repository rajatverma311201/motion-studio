import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, createRef, waitFor} from '@motion-canvas/core';
import {
  boxStyle,
  colors,
  decodeByte,
  disassemble,
  emptyState,
  fonts,
  lamp,
  memoryImage,
  memoryPanel,
  phaseTracker,
  radius,
  registerBox,
  setCell,
  setRegister,
  setRowTint,
  tintedSurface,
  type CpuState,
  type InstructionTrace,
  type MemoryPanel,
  type MicroStep,
  type Phase,
  type PhaseTracker,
  type RegName,
  type RegisterBox,
  type ToyProgram,
} from '@motion-studio/video-kit';
import {
  ALU_POS,
  BANNER,
  CPU_PANEL,
  CU_POS,
  MEMORY_PANEL,
  RAILS,
  REG_H,
  REG_POS,
  REG_W,
  TICK_POS,
  TRACKER,
  Z_POS,
  rowY,
} from './layout';
import {
  playInstruction as playInstructionRuntime,
  playStep as playStepRuntime,
  runAll as runAllRuntime,
  type PlayRuntime,
  type Speed,
} from './play';

export type {Speed};

/** Handles returned by {@link buildMachine}, used by the lesson sections. */
export interface Machine {
  root: Node;
  regs: Record<RegName | 'Z', RegisterBox>;
  mem: MemoryPanel;
  tracker: PhaseTracker;
  banner: {set(chipText: string, color: string, line: string): ThreadGenerator};
  tick: {set(n: number): void};
  state: CpuState;
  sync(state: CpuState, opts?: {memory?: boolean; decoded?: boolean}): void;
  play(step: MicroStep, speed: Speed): ThreadGenerator;
  playInstruction(trace: InstructionTrace, speed: Speed): ThreadGenerator;
  runAll(traces: readonly InstructionTrace[], speed: (index: number) => Speed): ThreadGenerator;
  parts: {
    cpu: Rect;
    memory: Rect;
    registers: Record<RegName | 'Z', Rect>;
    alu: Rect;
    control: Rect;
    buses: Node;
    tracker: Node;
    banner: Rect;
    tick: Rect;
    pcMarker: Line;
  };
}

/** Options for {@link buildMachine}. */
export interface BuildMachineOptions {
  program: ToyProgram;
  parts?: ('cpu' | 'memory')[];
  /** Start every part invisible so a chapter can reveal it piece by piece. */
  reveal?: boolean;
}

const DECODERS = [
  {opcode: 0, label: '0000 HALT'},
  {opcode: 1, label: '0001 LOAD'},
  {opcode: 2, label: '0010 ADD'},
  {opcode: 3, label: '0011 SUB'},
  {opcode: 4, label: '0100 STORE'},
  {opcode: 5, label: '0101 JUMP'},
  {opcode: 6, label: '0110 JZ'},
];

/**
 * Compose the TinyCPU view for one lesson section.
 *
 * @example
 * const machine = buildMachine(view, {program: ADD_PROGRAM});
 * machine.sync(loadedState(ADD_PROGRAM));
 * yield* machine.play(trace.steps[0], 'slow');
 */
export function buildMachine(view: View2D, options: BuildMachineOptions): Machine {
  const {program, parts: selected, reveal = false} = options;
  const root = createRef<Node>();
  const fx = createRef<Node>();
  const cpuPanel = (
    <Rect
      x={CPU_PANEL.x}
      y={CPU_PANEL.y}
      width={CPU_PANEL.w}
      height={CPU_PANEL.h}
      radius={radius(26)}
      fill={colors.surf}
      {...boxStyle(colors.pink, 12, 5)}
    >
      <Txt
        x={-CPU_PANEL.w / 2 + 28}
        y={-CPU_PANEL.h / 2 + 32}
        offsetX={-1}
        text="CPU"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={22}
        letterSpacing={3}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;

  const regs: Record<RegName | 'Z', RegisterBox> = {
    PC: registerBox({name: 'PC', bits: 4, color: colors.lime, ...REG_POS.PC, w: REG_W, h: REG_H, hint: '0'}),
    MAR: registerBox({name: 'MAR', bits: 4, color: colors.cyan, ...REG_POS.MAR, w: REG_W, h: REG_H, hint: '0'}),
    MDR: registerBox({name: 'MDR', bits: 8, color: colors.pink, ...REG_POS.MDR, w: REG_W, h: REG_H, hint: '0'}),
    IR: registerBox({name: 'IR', bits: 8, color: colors.yellow, ...REG_POS.IR, w: REG_W, h: REG_H, hint: ''}),
    ACC: registerBox({name: 'ACC', bits: 8, color: colors.violet, ...REG_POS.ACC, w: REG_W, h: REG_H, hint: '0'}),
    Z: registerBox({
      name: 'Z',
      bits: 1,
      color: colors.orange,
      x: Z_POS.x,
      y: Z_POS.y,
      w: Z_POS.w,
      h: Z_POS.h,
      hint: '',
    }),
  };

  const aluOp = createRef<Txt>();
  const aluNode = (
    <Rect
      x={ALU_POS.x}
      y={ALU_POS.y}
      width={ALU_POS.w}
      height={ALU_POS.h}
      radius={radius(14)}
      fill={tintedSurface(colors.violet)}
      {...boxStyle(colors.violet, 6, 3.5)}
    >
      <Txt
        y={-ALU_POS.h / 2 + 22}
        text="ALU"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={17}
        letterSpacing={2}
        fill={colors.violet}
      />
      <Txt ref={aluOp} y={8} text="—" fontFamily={fonts.mono} fontWeight={700} fontSize={34} fill={colors.ink} />
      <Txt y={ALU_POS.h / 2 - 20} text="ADD · SUB" fontFamily={fonts.mono} fontSize={13} fill={colors.mute} />
    </Rect>
  ) as Rect;

  const decoderLamps = DECODERS.map(decoder => ({
    ...decoder,
    lamp: lamp({label: decoder.label, color: colors.yellow, w: 210}),
  }));
  const signals = {
    READ: lamp({label: 'READ', color: colors.red, w: 106}),
    WRITE: lamp({label: 'WRITE', color: colors.red, w: 106}),
    ADD: lamp({label: 'ADD', color: colors.red, w: 106}),
    SUB: lamp({label: 'SUB', color: colors.red, w: 106}),
  };
  const cuNode = (
    <Rect
      x={CU_POS.x}
      y={CU_POS.y}
      width={CU_POS.w}
      height={CU_POS.h}
      radius={radius(16)}
      fill={tintedSurface(colors.pink)}
      {...boxStyle(colors.pink, 8, 4)}
    >
      <Txt
        y={-CU_POS.h / 2 + 26}
        text="CONTROL UNIT"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={17}
        letterSpacing={2}
        fill={colors.pink}
      />
      {decoderLamps.map(decoder => decoder.lamp.node)}
      <Line
        points={[
          [-100, 96],
          [100, 96],
        ]}
        stroke={colors.dim}
        lineWidth={2}
      />
      {Object.values(signals).map(signal => signal.node)}
    </Rect>
  ) as Rect;

  decoderLamps.forEach((decoder, i) => {
    decoder.lamp.node.x(0);
    decoder.lamp.node.y(-160 + i * 38);
  });
  signals.READ.node.x(-58);
  signals.READ.node.y(128);
  signals.WRITE.node.x(58);
  signals.WRITE.node.y(128);
  signals.ADD.node.x(-58);
  signals.ADD.node.y(170);
  signals.SUB.node.x(58);
  signals.SUB.node.y(170);

  const addressTap = createRef<Line>();
  const dataTap = createRef<Line>();
  const busesNode = (
    <Node>
      <Line
        points={[
          [RAILS.addressX, RAILS.addressTop],
          [RAILS.addressX, RAILS.bottom],
        ]}
        stroke={colors.cyan}
        lineWidth={5}
      />
      <Line
        points={[
          [RAILS.dataX, RAILS.dataTop],
          [RAILS.dataX, RAILS.bottom],
        ]}
        stroke={colors.pink}
        lineWidth={5}
      />
      <Line
        points={[
          [110, -255],
          [RAILS.addressX, -255],
        ]}
        stroke={colors.cyan}
        lineWidth={4}
      />
      <Line
        points={[
          [110, -95],
          [RAILS.dataX, -95],
        ]}
        stroke={colors.pink}
        lineWidth={4}
      />
      <Txt
        x={RAILS.addressX}
        y={RAILS.addressTop - 30}
        text="ADDRESS"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={14}
        letterSpacing={1}
        fill={colors.cyan}
      />
      <Txt
        x={RAILS.dataX}
        y={RAILS.dataTop - 30}
        text="DATA"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={14}
        letterSpacing={1}
        fill={colors.pink}
      />
      <Line
        ref={addressTap}
        x={RAILS.addressX}
        points={[
          [0, 0],
          [80, 0],
        ]}
        stroke={colors.cyan}
        lineWidth={5}
        opacity={0}
      />
      <Line
        ref={dataTap}
        x={RAILS.dataX}
        points={[
          [0, 0],
          [140, 0],
        ]}
        stroke={colors.pink}
        lineWidth={5}
        opacity={0}
      />
    </Node>
  ) as Node;

  const tracker = phaseTracker(TRACKER);

  const bannerChip = createRef<Rect>();
  const bannerChipText = createRef<Txt>();
  const bannerLine = createRef<Txt>();
  const bannerNode = (
    <Rect
      x={BANNER.x}
      y={BANNER.y}
      width={BANNER.w}
      height={BANNER.h}
      radius={radius(14)}
      fill={colors.surf}
      {...boxStyle(colors.violet, 7, 3.5)}
    >
      <Rect
        ref={bannerChip}
        x={-BANNER.w / 2 + 14}
        y={0}
        offsetX={-1}
        layout
        alignItems="center"
        padding={[4, 12]}
        radius={radius(8)}
        fill={colors.violet}
      >
        <Txt
          ref={bannerChipText}
          text="FETCH"
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={18}
          letterSpacing={1}
          fill={colors.onAccent}
        />
      </Rect>
      <Txt
        ref={bannerLine}
        x={-BANNER.w / 2 + 200}
        y={0}
        offsetX={-1}
        text=""
        fontFamily={fonts.mono}
        fontSize={17}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;

  const tickText = createRef<Txt>();
  const tickNode = (
    <Rect
      x={TICK_POS.x}
      y={TICK_POS.y}
      width={TICK_POS.w}
      height={TICK_POS.h}
      radius={radius(8)}
      fill={colors.surf2}
      {...boxStyle(colors.lime, 3, 2.5)}
    >
      <Txt
        ref={tickText}
        text="TICK 0"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={16}
        letterSpacing={1}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;

  const opcodeBracket = createRef<Line>();
  const operandBracket = createRef<Line>();
  const opcodeLabel = createRef<Txt>();
  const operandLabel = createRef<Txt>();
  const decodeHint = createRef<Txt>();
  const brackets = (
    <Node>
      <Line
        ref={opcodeBracket}
        points={[
          [-500, -28],
          [-390, -28],
        ]}
        stroke={colors.yellow}
        lineWidth={5}
        opacity={0}
      />
      <Line
        ref={operandBracket}
        points={[
          [-370, -28],
          [-260, -28],
        ]}
        stroke={colors.orange}
        lineWidth={5}
        opacity={0}
      />
      <Txt
        ref={opcodeLabel}
        x={-445}
        y={-4}
        text="OPCODE"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={13}
        letterSpacing={1}
        fill={colors.yellow}
        opacity={0}
      />
      <Txt
        ref={operandLabel}
        x={-315}
        y={-4}
        text="OPERAND"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={13}
        letterSpacing={1}
        fill={colors.orange}
        opacity={0}
      />
      <Txt
        ref={decodeHint}
        x={CU_POS.x}
        y={182}
        text=""
        fontFamily={fonts.mono}
        fontSize={16}
        fill={colors.mute}
        opacity={0}
      />
    </Node>
  ) as Node;

  const pcMarker = createRef<Line>();
  const marker = (
    <Line
      ref={pcMarker}
      x={318}
      points={[
        [-10, -14],
        [10, 0],
        [-10, 14],
      ]}
      closed
      fill={colors.lime}
      lineWidth={0}
    />
  ) as Line;

  const mem = memoryPanel({
    x: MEMORY_PANEL.x,
    y: MEMORY_PANEL.y,
    w: MEMORY_PANEL.w,
    rows: MEMORY_PANEL.rows,
    accent: colors.cyan,
  });
  const image = memoryImage(program);
  const codeStart = program.base;
  const codeEnd = program.base + program.code.length;
  const isCode = (address: number): boolean => address >= codeStart && address < codeEnd;
  const isData = (address: number): boolean => Object.prototype.hasOwnProperty.call(program.data, address);

  const meaningFor = (address: number, value: number): string => {
    if (address < 4) return 'reserved';
    if (isCode(address)) return disassemble(value);
    if (isData(address)) return String(value);
    return '';
  };

  const baseTint = (address: number): {color: string; on: boolean} => {
    if (isCode(address)) return {color: colors.yellow, on: true};
    if (isData(address)) return {color: colors.cyan, on: true};
    return {color: colors.mute, on: false};
  };

  for (let i = 0; i < 16; i++) {
    setCell(mem, i, image[i], meaningFor(i, image[i]));
    mem.cellText(i).fill(i < 4 ? colors.mute : colors.ink);
    if (i < 4) mem.rowTag(i, 'OS', colors.mute);
    else if (isCode(i)) mem.rowTag(i, 'CODE', colors.yellow);
    else if (isData(i)) mem.rowTag(i, 'DATA', colors.cyan);
    const tint = baseTint(i);
    setRowTint(mem, i, tint.color, tint.on);
  }

  const initial: CpuState = {...emptyState(), mem: image};
  let state = initial;
  let tickCount = 0;
  let trackerPhase: Phase | null = null;
  let activeRow: number | null = null;

  const regNodes = Object.values(regs).map(reg => reg.node);

  const setHeaderLamp = (node: Rect, on: boolean, color: string): void => {
    node.fill(on ? color : colors.surf2);
    (node.children()[0] as Txt).fill(on ? colors.onAccent : colors.mute);
    node.scale(on ? 1.05 : 1);
  };

  const clearSignals = (): void => {
    signals.READ.setNow(false);
    signals.WRITE.setNow(false);
    signals.ADD.setNow(false);
    signals.SUB.setNow(false);
    setHeaderLamp(mem.header.read, false, colors.red);
    setHeaderLamp(mem.header.write, false, colors.red);
  };

  const setJunctions = (address: number): void => {
    const y = mem.rowY(address);
    addressTap().y(y - 4);
    dataTap().y(y + 4);
    addressTap().opacity(1);
    dataTap().opacity(1);
  };

  const setAddressJunction = (address: number): void => {
    addressTap().y(mem.rowY(address) - 4);
    addressTap().opacity(1);
  };

  const hideJunctions = (): void => {
    addressTap().opacity(0);
    dataTap().opacity(0);
  };

  const restoreRow = (address: number): void => {
    const tint = baseTint(address);
    setRowTint(mem, address, tint.color, tint.on);
  };

  const setBrackets = (on: boolean): void => {
    opcodeBracket().opacity(on ? 1 : 0);
    operandBracket().opacity(on ? 1 : 0);
    opcodeLabel().opacity(on ? 1 : 0);
    operandLabel().opacity(on ? 1 : 0);
  };

  const sync = (next: CpuState, opts: {memory?: boolean; decoded?: boolean} = {}): void => {
    state = next;
    setRegister(regs.PC, next.pc, String(next.pc));
    setRegister(regs.MAR, next.mar, String(next.mar));
    setRegister(regs.MDR, next.mdr, String(next.mdr));
    setRegister(regs.IR, next.ir, opts.decoded ? disassemble(next.ir) : '');
    setRegister(regs.ACC, next.acc, String(next.acc));
    setRegister(regs.Z, next.z ? 1 : 0);
    tickCount = 0;
    tickText().text('TICK 0');
    aluOp().text('—');
    decoderLamps.forEach(decoder => decoder.lamp.setNow(false));
    clearSignals();
    decodeHint().text('');
    decodeHint().fill(colors.mute);
    decodeHint().opacity(0);
    setBrackets(false);
    pcMarker().y(rowY(next.pc));
    pcMarker().opacity(1);
    hideJunctions();
    activeRow = null;
    if (opts.decoded) {
      const decoded = decodeByte(next.ir);
      if (decoded.mnemonic) {
        const decoder = decoderLamps.find(candidate => candidate.opcode === decoded.opcode);
        decoder?.lamp.setNow(true);
        decodeHint().text(decoded.mnemonic);
        decodeHint().opacity(1);
        setBrackets(true);
      }
    }
    if (opts.memory !== false) {
      for (let i = 0; i < 16; i++) {
        const value = next.mem[i];
        setCell(mem, i, value, meaningFor(i, value));
        mem.cellText(i).fill(i < 4 ? colors.mute : colors.ink);
        restoreRow(i);
      }
    }
  };

  const banner = {
    *set(chipText: string, color: string, line: string): ThreadGenerator {
      bannerChip().fill(color);
      bannerChipText().text(chipText);
      bannerLine().text(line);
      yield* waitFor(0);
    },
  };

  const tick = {
    set(n: number): void {
      tickText().text(`TICK ${n}`);
    },
  };

  const useCpu = !selected || selected.includes('cpu');
  const useMemory = !selected || selected.includes('memory');

  view.add(
    <Node ref={root}>
      {useCpu ? cpuPanel : null}
      {useMemory ? mem.node : null}
      {useCpu ? regNodes : null}
      {useCpu ? aluNode : null}
      {useCpu ? cuNode : null}
      {useCpu ? busesNode : null}
      {useCpu ? marker : null}
      {useCpu ? tracker.node : null}
      {useCpu ? bannerNode : null}
      {useCpu ? tickNode : null}
      {useCpu ? brackets : null}
      <Node ref={fx} zIndex={20} />
    </Node>,
  );

  sync(initial);

  if (reveal) {
    mem.node.opacity(0);
    const hidden = [
      cpuPanel,
      ...regNodes,
      aluNode,
      cuNode,
      busesNode,
      marker,
      tracker.node,
      bannerNode,
      tickNode,
      brackets,
    ];
    hidden.forEach(node => node.opacity(0));
  }

  const runtime: PlayRuntime = {
    regs,
    mem,
    tracker,
    banner,
    tick,
    cpuPanel,
    aluNode,
    cuNode,
    aluOp: aluOp(),
    busesNode,
    bannerNode,
    tickNode,
    trackerNode: tracker.node,
    decodeHint: decodeHint(),
    fx: fx(),
    pcMarker: pcMarker(),
    decoders: decoderLamps.map(decoder => ({opcode: decoder.opcode, lamp: decoder.lamp})),
    signals,
    setBrackets,
    setHeaderLamp,
    setJunctions,
    setAddressJunction,
    hideJunctions,
    restoreRow,
    meaningFor,
    nextTick: () => {
      tickCount += 1;
      return tickCount;
    },
    setState: next => {
      state = next;
    },
    getTrackerPhase: () => trackerPhase,
    setTrackerPhase: phase => {
      trackerPhase = phase;
    },
    getActiveRow: () => activeRow,
    setActiveRow: row => {
      activeRow = row;
    },
  };

  return {
    root: root(),
    regs,
    mem,
    tracker,
    banner,
    tick,
    get state(): CpuState {
      return state;
    },
    sync,
    play: (step, speed) => playStepRuntime(runtime, step, speed),
    playInstruction: (trace, speed) => playInstructionRuntime(runtime, trace, speed),
    runAll: (traces, speed) => runAllRuntime(runtime, sync, traces, speed),
    parts: {
      cpu: cpuPanel,
      memory: mem.node,
      registers: {
        PC: regs.PC.node,
        MAR: regs.MAR.node,
        MDR: regs.MDR.node,
        IR: regs.IR.node,
        ACC: regs.ACC.node,
        Z: regs.Z.node,
      },
      alu: aluNode,
      control: cuNode,
      buses: busesNode,
      tracker: tracker.node,
      banner: bannerNode,
      tick: tickNode,
      pcMarker: marker,
    },
  };
}
