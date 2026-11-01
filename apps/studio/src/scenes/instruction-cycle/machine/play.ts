import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, waitFor} from '@motion-canvas/core';
import {
  chip,
  colors,
  disassemble,
  flyAlong,
  formatBits,
  highlightRow,
  pop,
  setCell,
  setRegister,
  setRowTint,
  shake,
  valuePacket,
  writeCell,
  writeRegister,
  type CpuState,
  type InstructionTrace,
  type Lamp,
  type MemoryPanel,
  type MicroStep,
  type Phase,
  type PhaseTracker,
  type RegName,
  type RegisterBox,
} from '@motion-studio/video-kit';
import {ALU_IN_LEFT, ALU_IN_TOP, ALU_OUT, CU_POS, IN_ANCHOR, OUT_ANCHOR, RAILS, Z_OUT, rowY} from './layout';

/** How fast the machine plays a micro-step. */
export type Speed = 'slow' | 'normal' | 'fast' | 'blur';

const FACTOR: Record<Speed, number> = {slow: 1, normal: 0.55, fast: 0.22, blur: 0.05};

const PHASE_COLOR: Record<Phase, 'violet' | 'orange' | 'red'> = {
  fetch: 'violet',
  decode: 'orange',
  execute: 'red',
};

const REG_COLOR: Record<RegName, 'lime' | 'cyan' | 'pink' | 'yellow' | 'violet'> = {
  PC: 'lime',
  MAR: 'cyan',
  MDR: 'pink',
  IR: 'yellow',
  ACC: 'violet',
};

/** Everything {@link playStep} needs from the machine that owns the screen. */
export interface PlayRuntime {
  regs: Record<RegName | 'Z', RegisterBox>;
  mem: MemoryPanel;
  tracker: PhaseTracker;
  banner: {set(chipText: string, color: string, line: string): ThreadGenerator};
  tick: {set(n: number): void};
  cpuPanel: Rect;
  aluNode: Rect;
  cuNode: Rect;
  aluOp: Txt;
  busesNode: Node;
  bannerNode: Rect;
  tickNode: Rect;
  trackerNode: Node;
  decodeHint: Txt;
  fx: Node;
  pcMarker: Line;
  decoders: {opcode: number; lamp: Lamp}[];
  signals: {READ: Lamp; WRITE: Lamp; ADD: Lamp; SUB: Lamp};
  setBrackets(on: boolean): void;
  setHeaderLamp(node: Rect, on: boolean, color: string): void;
  setJunctions(address: number): void;
  setAddressJunction(address: number): void;
  hideJunctions(): void;
  restoreRow(address: number): void;
  meaningFor(address: number, value: number): string;
  nextTick(): number;
  setState(state: CpuState): void;
  getTrackerPhase(): Phase | null;
  setTrackerPhase(phase: Phase | null): void;
  getActiveRow(): number | null;
  setActiveRow(row: number | null): void;
}

function bitsOf(name: RegName | 'IR.operand'): number {
  if (name === 'IR.operand') return 4;
  return name === 'PC' || name === 'MAR' ? 4 : 8;
}

function hintFor(name: RegName, value: number): string {
  return name === 'IR' ? '' : String(value);
}

function nextHint(mnemonic: string): string {
  switch (mnemonic) {
    case 'LOAD':
      return 'ACC ← MDR';
    case 'ADD':
      return 'ACC ← ACC + MDR';
    case 'SUB':
      return 'ACC ← ACC − MDR';
    case 'STORE':
      return 'M ← ACC';
    case 'JUMP':
      return 'PC ← addr';
    case 'JZ':
      return 'PC ← addr if Z';
    case 'HALT':
      return 'stop the clock';
    default:
      return '';
  }
}

function clearSignals(runtime: PlayRuntime): void {
  runtime.signals.READ.setNow(false);
  runtime.signals.WRITE.setNow(false);
  runtime.signals.ADD.setNow(false);
  runtime.signals.SUB.setNow(false);
  runtime.setHeaderLamp(runtime.mem.header.read, false, colors.red);
  runtime.setHeaderLamp(runtime.mem.header.write, false, colors.red);
}

/**
 * Animate one micro-step and leave the machine at `step.after`.
 *
 * @example
 * yield* playStep(runtime, trace.steps[0], 'slow');
 */
export function* playStep(runtime: PlayRuntime, step: MicroStep, speed: Speed): ThreadGenerator {
  const f = FACTOR[speed];
  const tick = runtime.nextTick();
  runtime.tick.set(tick);
  if (runtime.getTrackerPhase() !== step.phase) {
    runtime.setTrackerPhase(step.phase);
    yield* runtime.tracker.set(step.phase);
  }
  yield* runtime.banner.set(step.phase.toUpperCase(), colors[PHASE_COLOR[step.phase]], `${step.id} · ${step.text}`);
  runtime.hideJunctions();

  if (step.kind === 'copy') {
    if (speed !== 'blur') {
      const packet = valuePacket(
        formatBits(step.value, bitsOf(step.from)),
        colors[REG_COLOR[step.from === 'IR.operand' ? 'IR' : step.from]],
      );
      runtime.fx.add(packet);
      yield* flyAlong(packet, [OUT_ANCHOR[step.from], IN_ANCHOR[step.to]], 0.5 * f);
    }
    if (speed === 'blur') setRegister(runtime.regs[step.to], step.value, hintFor(step.to, step.value));
    else yield* writeRegister(runtime.regs[step.to], step.value, {dur: 0.32 * f, hint: hintFor(step.to, step.value)});
    if (step.from === 'PC' && step.to === 'MAR') runtime.setAddressJunction(step.value);
    if (step.to === 'PC') {
      if (speed === 'blur') runtime.pcMarker.y(rowY(step.value));
      else yield* runtime.pcMarker.y(rowY(step.value), 0.35 * f);
    }
    if (step.setsZ) {
      if (speed === 'blur') setRegister(runtime.regs.Z, step.after.z ? 1 : 0);
      else yield* writeRegister(runtime.regs.Z, step.after.z ? 1 : 0, {dur: 0.25 * f});
    }
  } else if (step.kind === 'read') {
    const address = step.addr;
    const active = runtime.getActiveRow();
    if (active !== null && active !== address) runtime.restoreRow(active);
    runtime.setActiveRow(address);
    runtime.setJunctions(address);
    if (speed === 'blur' || speed === 'fast') {
      setRowTint(runtime.mem, address, colors.cyan, true);
      runtime.setHeaderLamp(runtime.mem.header.read, true, colors.red);
    } else {
      const addressPacket = valuePacket(formatBits(address, 4), colors.cyan);
      runtime.fx.add(addressPacket);
      yield* all(
        flyAlong(
          addressPacket,
          [
            [110, -255],
            [RAILS.addressX, -255],
            [RAILS.addressX, runtime.mem.rowY(address)],
            [330, runtime.mem.rowY(address)],
          ],
          0.42 * f,
        ),
        highlightRow(runtime.mem, address, colors.cyan, true),
      );
      runtime.setHeaderLamp(runtime.mem.header.read, true, colors.red);
      yield* runtime.signals.READ.set(true);
      const dataPacket = valuePacket(formatBits(step.value, 8), colors.pink);
      runtime.fx.add(dataPacket);
      yield* flyAlong(
        dataPacket,
        [
          [570, runtime.mem.rowY(address)],
          [RAILS.dataX, runtime.mem.rowY(address)],
          [RAILS.dataX, -95],
          [110, -95],
        ],
        0.5 * f,
      );
    }
    if (speed === 'blur' || speed === 'fast') setRegister(runtime.regs.MDR, step.value, String(step.value));
    else yield* writeRegister(runtime.regs.MDR, step.value, {dur: 0.3 * f, hint: String(step.value)});
    runtime.setHeaderLamp(runtime.mem.header.read, false, colors.red);
    runtime.signals.READ.setNow(false);
  } else if (step.kind === 'write') {
    const address = step.addr;
    const active = runtime.getActiveRow();
    if (active !== null && active !== address) runtime.restoreRow(active);
    runtime.setActiveRow(address);
    runtime.setJunctions(address);
    if (speed === 'blur' || speed === 'fast') {
      setRowTint(runtime.mem, address, colors.pink, true);
      runtime.setHeaderLamp(runtime.mem.header.write, true, colors.red);
    } else {
      runtime.setHeaderLamp(runtime.mem.header.write, true, colors.red);
      yield* runtime.signals.WRITE.set(true);
      yield* highlightRow(runtime.mem, address, colors.pink, true);
      const packet = valuePacket(formatBits(step.value, 8), colors.pink);
      runtime.fx.add(packet);
      yield* flyAlong(
        packet,
        [
          [110, -95],
          [RAILS.dataX, -95],
          [RAILS.dataX, runtime.mem.rowY(address)],
          [330, runtime.mem.rowY(address)],
        ],
        0.55 * f,
      );
    }
    if (speed === 'blur' || speed === 'fast') {
      setCell(runtime.mem, address, step.value, runtime.meaningFor(address, step.value));
      runtime.mem.cellText(address).fill(colors.ink);
    } else {
      yield* writeCell(runtime.mem, address, step.value, runtime.meaningFor(address, step.value));
    }
    runtime.setHeaderLamp(runtime.mem.header.write, false, colors.red);
    runtime.signals.WRITE.setNow(false);
  } else if (step.kind === 'increment') {
    if (speed !== 'blur') {
      const plus = chip('+1', colors.lime, {fs: 22, x: -245, y: -310}) as Rect;
      runtime.fx.add(plus);
      yield* pop(plus, 0.22 * f);
      yield* all(
        writeRegister(runtime.regs.PC, step.to, {dur: 0.28 * f, hint: String(step.to)}),
        runtime.pcMarker.y(rowY(step.to), 0.35 * f),
      );
      yield* waitFor(0.15 * f);
      plus.remove();
    } else {
      setRegister(runtime.regs.PC, step.to, String(step.to));
      runtime.pcMarker.y(rowY(step.to));
    }
  } else if (step.kind === 'decode') {
    setRegister(runtime.regs.IR, step.after.ir, step.mnemonic ? disassemble(step.after.ir) : '???');
    if (step.mnemonic === null) {
      if (speed !== 'blur') {
        const bad = chip('ILLEGAL INSTRUCTION', colors.red, {fs: 20, x: CU_POS.x, y: 214}) as Rect;
        runtime.fx.add(bad);
        yield* pop(bad, 0.3 * f);
        yield* shake(runtime.cuNode, 8, 5);
        yield* waitFor(0.7 * f);
        bad.remove();
      }
    } else {
      if (speed !== 'blur') {
        const packet = valuePacket(formatBits(step.opcode, 4), colors.yellow);
        runtime.fx.add(packet);
        yield* flyAlong(
          packet,
          [
            [-510, -95],
            [-610, -85],
          ],
          0.4 * f,
        );
      }
      runtime.decoders.forEach(decoder => decoder.lamp.setNow(false));
      const decoder = runtime.decoders.find(candidate => candidate.opcode === step.opcode);
      if (speed === 'blur' || speed === 'fast') decoder?.lamp.setNow(true);
      else if (decoder) yield* decoder.lamp.set(true);
      runtime.decodeHint.text(nextHint(step.mnemonic));
      runtime.decodeHint.fill(colors.mute);
      runtime.decodeHint.opacity(1);
      runtime.setBrackets(true);
      if (step.mnemonic === 'LOAD' || step.mnemonic === 'ADD' || step.mnemonic === 'SUB') {
        runtime.signals.READ.setNow(true);
      }
      if (step.mnemonic === 'STORE') runtime.signals.WRITE.setNow(true);
    }
  } else if (step.kind === 'alu') {
    const symbol = step.op === 'ADD' ? '+' : '−';
    runtime.aluOp.text(`${step.left} ${symbol} ${step.right}`);
    if (speed !== 'blur') {
      const leftPacket = valuePacket(formatBits(step.left, 8), colors.violet);
      const rightPacket = valuePacket(formatBits(step.right, 8), colors.pink);
      runtime.fx.add(leftPacket);
      runtime.fx.add(rightPacket);
      yield* all(
        flyAlong(leftPacket, [OUT_ANCHOR.ACC, ALU_IN_LEFT], 0.38 * f),
        flyAlong(rightPacket, [OUT_ANCHOR.MDR, ALU_IN_TOP], 0.44 * f),
      );
      const signal = step.op === 'ADD' ? runtime.signals.ADD : runtime.signals.SUB;
      yield* signal.set(true);
      const resultPacket = valuePacket(formatBits(step.result, 8), colors.violet);
      runtime.fx.add(resultPacket);
      yield* flyAlong(resultPacket, [ALU_OUT, IN_ANCHOR.ACC], 0.35 * f);
    }
    if (speed === 'blur') {
      setRegister(runtime.regs.ACC, step.result, String(step.result));
      setRegister(runtime.regs.Z, step.after.z ? 1 : 0);
    } else {
      yield* all(
        writeRegister(runtime.regs.ACC, step.result, {dur: 0.3 * f, hint: String(step.result)}),
        writeRegister(runtime.regs.Z, step.after.z ? 1 : 0, {dur: 0.25 * f}),
      );
    }
  } else if (step.kind === 'check-flag') {
    if (speed !== 'blur') {
      const packet = valuePacket(step.z ? '1' : '0', colors.orange);
      runtime.fx.add(packet);
      yield* flyAlong(packet, [Z_OUT, [CU_POS.x, 210], [CU_POS.x, 145]], 0.48 * f);
    }
    runtime.decodeHint.text(`Z = 1 ? ${step.taken ? 'YES' : 'NO'}`);
    runtime.decodeHint.fill(step.taken ? colors.lime : colors.mute);
    runtime.decodeHint.opacity(1);
  } else if (step.kind === 'halt') {
    runtime.decoders.forEach(decoder => decoder.lamp.setNow(false));
    runtime.decoders[0]?.lamp.setNow(true);
    runtime.setTrackerPhase(null);
    yield* runtime.tracker.set(null);
    yield* runtime.banner.set('HALT', colors.red, 'CLOCK STOPPED');
    if (speed !== 'blur') {
      yield* all(
        runtime.cpuPanel.opacity(0.6, 0.3),
        runtime.mem.node.opacity(0.6, 0.3),
        runtime.aluNode.opacity(0.6, 0.3),
        runtime.cuNode.opacity(0.6, 0.3),
        runtime.busesNode.opacity(0.6, 0.3),
        runtime.trackerNode.opacity(0.6, 0.3),
        runtime.bannerNode.opacity(0.6, 0.3),
        runtime.tickNode.opacity(0.6, 0.3),
        ...Object.values(runtime.regs).map(reg => reg.node.opacity(0.6, 0.3)),
      );
    }
  }

  clearSignals(runtime);
  runtime.setState(step.after);
}

/**
 * Animate every micro-step of one instruction.
 *
 * @example
 * yield* playInstruction(runtime, trace, 'normal');
 */
export function* playInstruction(runtime: PlayRuntime, trace: InstructionTrace, speed: Speed): ThreadGenerator {
  for (const step of trace.steps) yield* playStep(runtime, step, speed);
}

/**
 * Run a list of instructions after jumping to the first `before` state.
 *
 * @example
 * yield* runAll(runtime, sync, traces, i => i === 0 ? 'normal' : 'fast');
 */
export function* runAll(
  runtime: PlayRuntime,
  sync: (state: CpuState) => void,
  traces: readonly InstructionTrace[],
  speed: (index: number) => Speed,
): ThreadGenerator {
  if (traces.length === 0) return;
  sync(traces[0].before);
  for (let i = 0; i < traces.length; i++) yield* playInstruction(runtime, traces[i], speed(i));
}
