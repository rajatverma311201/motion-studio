import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {
  ADD_PROGRAM,
  boxStyle,
  chip,
  colors,
  disassemble,
  encode,
  fonts,
  leave,
  loadedState,
  pop,
  radius,
  say,
  stateAfterStep,
  stepInstruction,
} from '@motion-studio/video-kit';
import {buildMachine} from '../machine';

/** Execute-step texts for one instruction, straight from the model. */
function executeTexts(byte: number, z = false): string[] {
  const base = loadedState(ADD_PROGRAM);
  const mem = [...base.mem];
  mem[4] = byte;
  const trace = stepInstruction({...base, mem, z});
  return trace.steps.slice(5).map(step => step.text);
}

// ================================================================ 06 EXECUTE
export function* executeSection(view: View2D): ThreadGenerator {
  const machine = buildMachine(view, {program: ADD_PROGRAM});
  const overlay = createRef<Node>();
  view.add(<Node ref={overlay} />);

  const loadTrace = stepInstruction(loadedState(ADD_PROGRAM));
  const addTrace = stepInstruction(loadTrace.after);
  const storeTrace = stepInstruction(addTrace.after);
  const loadStart = stateAfterStep(loadTrace, 'D1');
  const addStart = stateAfterStep(addTrace, 'D1');
  const storeStart = stateAfterStep(storeTrace, 'D1');

  machine.sync(loadStart, {decoded: true});

  yield* say('Phase three: EXECUTE. Now the CPU does the work.');
  yield* waitFor(7);

  yield* say('LOAD 12. First, MAR gets the operand: the address 12.');
  yield* machine.play(loadTrace.steps[5], 'slow');
  yield* waitFor(8);

  yield* say('Memory is read again. The value 5 arrives in MDR.');
  yield* machine.play(loadTrace.steps[6], 'slow');
  yield* waitFor(8);

  yield* say('5 is copied into ACC. The load is complete.');
  yield* machine.play(loadTrace.steps[7], 'slow');
  yield* waitFor(8);

  // ---- ADD ----------------------------------------------------------------
  const nextAdd = chip('NEXT: ADD 13', colors.yellow, {fs: 20, x: 0, y: 400, sh: 5}) as Rect;
  nextAdd.opacity(0);
  overlay().add(nextAdd);
  yield* say('Next instruction: ADD 13. Same start, but the ALU joins in.');
  yield* pop(nextAdd, 0.3);
  machine.sync(addStart, {decoded: true, keepTicks: true});
  yield* waitFor(7);

  yield* say('MAR = 13. Memory gives back 3.');
  yield* machine.play(addTrace.steps[5], 'normal');
  yield* machine.play(addTrace.steps[6], 'normal');
  yield* waitFor(7);

  yield* say('ACC (5) and MDR (3) go into the ALU. Out comes 8.');
  yield* machine.play(addTrace.steps[7], 'normal');
  yield* waitFor(7);

  yield* say('The result goes back into ACC. Z stays 0 because 8 is not zero.');
  yield* waitFor(8);

  // ---- STORE --------------------------------------------------------------
  yield* nextAdd.opacity(0, 0.25);
  const nextStore = chip('NEXT: STORE 14', colors.yellow, {fs: 20, x: 0, y: 400, sh: 5}) as Rect;
  nextStore.opacity(0);
  overlay().add(nextStore);
  yield* say('Next: STORE 14. This time data flows the other way.');
  yield* pop(nextStore, 0.3);
  machine.sync(storeStart, {decoded: true, keepTicks: true});
  yield* waitFor(7);

  yield* say('ACC goes into MDR. Then MDR is written into memory box 14.');
  yield* machine.play(storeTrace.steps[5], 'normal');
  yield* machine.play(storeTrace.steps[6], 'normal');
  yield* machine.play(storeTrace.steps[7], 'normal');
  yield* waitFor(9);

  // ---- the execute recipe -------------------------------------------------
  yield* nextStore.opacity(0, 0.25);
  yield* say('Only execute is different for each instruction. Fetch and decode never change.');
  yield* machine.root.opacity(0, 0.45);

  const rows: {label: string; steps: string[]; muted?: boolean}[] = [
    {
      label: 'FETCH',
      steps: ['MAR ← PC', 'MDR ← M[MAR]', 'IR ← MDR', 'PC ← PC + 1'],
      muted: true,
    },
    {label: 'DECODE', steps: ['DECODE IR'], muted: true},
    {label: disassemble(encode('LOAD', 12)), steps: executeTexts(encode('LOAD', 12))},
    {label: disassemble(encode('ADD', 12)), steps: executeTexts(encode('ADD', 12))},
    {label: disassemble(encode('SUB', 12)), steps: executeTexts(encode('SUB', 12))},
    {label: disassemble(encode('STORE', 12)), steps: executeTexts(encode('STORE', 12))},
    {label: disassemble(encode('JUMP', 12)), steps: executeTexts(encode('JUMP', 12))},
    {label: disassemble(encode('JZ', 9)), steps: executeTexts(encode('JZ', 9), true)},
    {label: 'HALT', steps: executeTexts(encode('HALT'))},
  ];

  const tableHeight = 740;
  const table = (
    <Rect
      x={0}
      y={-20}
      width={1500}
      height={tableHeight}
      radius={radius(20)}
      fill={colors.surf}
      {...boxStyle(colors.red, 10, 4)}
      opacity={0}
    >
      <Rect x={-570} y={-tableHeight / 2 + 38} width={280} height={38} radius={radius(10)} fill={colors.surf2}>
        <Txt
          text="SAME FOR ALL"
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={17}
          letterSpacing={2}
          fill={colors.mute}
        />
      </Rect>
      <Txt
        x={-410}
        y={-tableHeight / 2 + 38}
        offsetX={-1}
        text="fetch and decode never change"
        fontFamily={fonts.sans}
        fontSize={22}
        fill={colors.mute}
      />
      <Rect x={-640} y={-tableHeight / 2 + 104} width={200} height={38} radius={radius(10)} fill={colors.red}>
        <Txt
          text="EXECUTE"
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={18}
          letterSpacing={2}
          fill={colors.onAccent}
        />
      </Rect>
      <Txt
        x={-530}
        y={-tableHeight / 2 + 104}
        offsetX={-1}
        text="the only part that differs"
        fontFamily={fonts.sans}
        fontSize={22}
        fill={colors.mute}
      />
    </Rect>
  ) as Rect;

  const tableRows = rows.map((row, i) => {
    const rowY = i < 2 ? -tableHeight / 2 + 78 + i * 54 : -120 + (i - 2) * 52;
    const node = (
      <Rect
        y={rowY}
        x={30}
        width={1420}
        height={46}
        radius={radius(8)}
        fill={row.muted ? colors.surf2 : i % 2 === 0 ? colors.clear : colors.surf2}
      >
        <Rect x={-600} width={200} height={36} radius={radius(8)} fill={row.muted ? colors.surf : colors.surf2}>
          <Txt
            text={row.label}
            fontFamily={fonts.mono}
            fontWeight={700}
            fontSize={18}
            letterSpacing={1}
            fill={row.muted ? colors.mute : colors.yellow}
          />
        </Rect>
        <Txt
          x={-480}
          offsetX={-1}
          text={row.steps.join('  ·  ')}
          fontFamily={fonts.mono}
          fontSize={20}
          fill={row.muted ? colors.mute : colors.ink}
        />
      </Rect>
    ) as Rect;
    node.opacity(0);
    table.add(node);
    return node;
  });

  overlay().add(table);
  yield* all(table.opacity(1, 0.4), sequence(0.05, ...tableRows.map(row => row.opacity(1, 0.2))));
  yield* waitFor(12);
  yield* leave(overlay());
  yield* leave(machine.root);
}
