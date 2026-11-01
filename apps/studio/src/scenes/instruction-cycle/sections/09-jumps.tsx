import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {
  COUNTDOWN_PROGRAM,
  boxStyle,
  chip,
  chipText,
  codePanel,
  colors,
  fonts,
  leave,
  loadedState,
  pop,
  radius,
  revealLines,
  runProgram,
  say,
} from '@motion-studio/video-kit';
import {buildMachine} from '../machine';

// ================================================================ 08 JUMPS
export function* jumpsSection(view: View2D): ThreadGenerator {
  // ---- Act A: the loop in source and machine code -------------------------
  const actA = createRef<Node>();
  const code = codePanel({
    x: -470,
    y: -60,
    w: 620,
    title: 'countdown.java',
    lang: 'java',
    accent: colors.pink,
    code: ['while (n != 0) {', '    n = n - 1;', '}'],
  });
  const mapHeight = 430;
  const mapPanel = (
    <Rect
      x={300}
      y={-40}
      width={700}
      height={mapHeight}
      radius={radius(18)}
      fill={colors.surf}
      {...boxStyle(colors.cyan, 8, 4)}
    >
      <Txt
        x={-310}
        y={-mapHeight / 2 + 18}
        offsetX={-1}
        text="ADDR"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={15}
        letterSpacing={2}
        fill={colors.mute}
      />
      <Txt
        x={-240}
        y={-mapHeight / 2 + 18}
        offsetX={-1}
        text="INSTRUCTION"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={15}
        letterSpacing={2}
        fill={colors.mute}
      />
    </Rect>
  ) as Rect;
  const mapRows = COUNTDOWN_PROGRAM.code.map((mnemonic, i) => {
    const row = (
      <Rect y={-148 + i * 54} width={660} height={46} radius={radius(8)} fill={colors.clear}>
        <Rect x={-320} width={8} height={38} radius={radius(4)} fill={colors.cyan} />
        <Txt
          x={-300}
          offsetX={-1}
          text={String(COUNTDOWN_PROGRAM.base + i)}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={18}
          fill={colors.mute}
        />
        <Txt
          x={-240}
          offsetX={-1}
          text={mnemonic}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={21}
          fill={colors.ink}
        />
      </Rect>
    ) as Rect;
    row.opacity(0);
    mapPanel.add(row);
    return row;
  });
  const jumpRowY = -40 + (-148 + 4 * 54);
  const jzRowY = -40 + (-148 + 1 * 54);
  const jumpChip = chip('PC ← 4', colors.lime, {fs: 19, x: 760, y: jumpRowY}) as Rect;
  const jzChip = chip('ONLY IF Z = 1', colors.yellow, {fs: 19, x: 800, y: jzRowY}) as Rect;
  jumpChip.opacity(0);
  jzChip.opacity(0);
  view.add(
    <Node ref={actA}>
      {code.node}
      {mapPanel}
      {jumpChip}
      {jzChip}
    </Node>,
  );

  yield* say('So far the PC just counted up. But programs need loops and decisions.');
  yield* waitFor(4.2);

  yield* say('A loop like this one counts n down to zero.');
  yield* revealLines(code);
  yield* waitFor(5.4);

  yield* say('In machine code it becomes six instructions.');
  yield* sequence(0.14, ...mapRows.map(row => row.opacity(1, 0.25)));
  yield* waitFor(5.4);

  yield* say('JUMP simply overwrites the PC with a new address.');
  yield* mapRows[4].fill(colors.surf2, 0.25);
  yield* jumpChip.opacity(1, 0.25);
  yield* waitFor(6.2);

  yield* say('JZ jumps only if the Z flag is 1.');
  yield* mapRows[1].fill(colors.surf2, 0.25);
  yield* jzChip.opacity(1, 0.25);
  yield* waitFor(6.4);
  yield* leave(actA());

  // ---- Act B: run the loop with n = 3 -------------------------------------
  const machine = buildMachine(view, {program: COUNTDOWN_PROGRAM});
  const overlay = createRef<Node>();
  view.add(<Node ref={overlay} />);
  machine.sync(loadedState(COUNTDOWN_PROGRAM));
  const {traces} = runProgram(loadedState(COUNTDOWN_PROGRAM));

  const instrChip = chip('INSTR 1', colors.surf2, {fs: 17, x: 235, y: -360, color: colors.ink, sh: 4}) as Rect;
  overlay().add(instrChip);

  yield* say('Let us run it with n = 3.');
  yield* machine.playInstruction(traces[0], 'normal');
  yield* waitFor(5.4);

  yield* say('LOAD sets ACC to 3. Z is 0, so JZ does nothing.');
  chipText(instrChip).text('INSTR 2');
  yield* machine.playInstruction(traces[1], 'normal');
  yield* waitFor(5.6);

  yield* say('SUB takes one off. STORE saves it.');
  chipText(instrChip).text('INSTR 3');
  yield* machine.playInstruction(traces[2], 'normal');
  chipText(instrChip).text('INSTR 4');
  yield* machine.playInstruction(traces[3], 'normal');
  yield* waitFor(5.6);

  yield* say('JUMP 4 sets the PC back to 4. The loop goes round again.');
  const jumpTrace = traces[4];
  chipText(instrChip).text('INSTR 5');
  for (const step of jumpTrace.steps.slice(0, 5)) yield* machine.play(step, 'normal');
  const plus = chip('+1', colors.lime, {fs: 22, x: -245, y: -310}) as Rect;
  const strike = (
    <Line
      points={[
        [-278, -310],
        [-212, -310],
      ]}
      stroke={colors.red}
      lineWidth={6}
    />
  ) as Line;
  plus.opacity(0);
  strike.opacity(0);
  overlay().add(plus);
  overlay().add(strike);
  yield* all(pop(plus, 0.25), strike.opacity(1, 0.2));
  yield* machine.play(jumpTrace.steps[5], 'normal');
  yield* waitFor(1.8);
  yield* all(plus.opacity(0, 0.25), strike.opacity(0, 0.25));
  plus.remove();
  strike.remove();
  yield* waitFor(5.4);

  yield* say('n goes 3, 2, 1…');
  for (let i = 5; i <= 14; i++) {
    chipText(instrChip).text(`INSTR ${i + 1}`);
    yield* machine.playInstruction(traces[i], 'blur');
    yield* waitFor(0.15);
  }
  yield* waitFor(2.6);

  yield* say('Now LOAD gives 0. Z becomes 1, and JZ jumps to the HALT.');
  chipText(instrChip).text('INSTR 16');
  yield* machine.playInstruction(traces[15], 'normal');
  chipText(instrChip).text('INSTR 17');
  yield* machine.playInstruction(traces[16], 'normal');
  chipText(instrChip).text('INSTR 18');
  yield* machine.playInstruction(traces[17], 'normal');
  yield* waitFor(5.4);

  const whileChip = chip('while → JZ + JUMP', colors.lime, {fs: 21, x: -330, y: 330}) as Rect;
  const ifChip = chip('if → JZ over the code', colors.cyan, {fs: 21, x: 300, y: 330}) as Rect;
  const note = chip('IN OUR TOY CPU, LOAD ALSO SETS Z', colors.surf2, {
    fs: 14,
    x: 0,
    y: 392,
    color: colors.mute,
    sh: 3,
  }) as Rect;
  whileChip.opacity(0);
  ifChip.opacity(0);
  note.opacity(0);
  overlay().add(whileChip);
  overlay().add(ifChip);
  overlay().add(note);

  yield* say('Loops and if-statements are just jumps that overwrite the PC.');
  yield* all(pop(whileChip, 0.35), pop(ifChip, 0.35), note.opacity(1, 0.4));
  yield* waitFor(7);
  yield* leave(overlay());
  yield* leave(machine.root);
}
