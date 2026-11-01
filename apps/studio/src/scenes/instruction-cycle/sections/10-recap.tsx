import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, delay, sequence, waitFor} from '@motion-canvas/core';
import {boxStyle, chip, colors, fonts, leave, phaseTracker, pop, radius, say} from '@motion-studio/video-kit';

// ================================================================ 09 RECAP
export function* recapSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const tracker = phaseTracker({x: 0, y: -330});
  const repeat = chip('REPEAT ↺', colors.yellow, {fs: 17, x: 470, y: -330, sh: 4}) as Rect;

  const phases = [
    {label: 'FETCH', color: colors.violet, text: 'PC → MAR → memory → MDR → IR, then PC + 1'},
    {label: 'DECODE', color: colors.orange, text: 'opcode picks the action, operand names the data'},
    {label: 'EXECUTE', color: colors.red, text: 'ALU, memory or the PC does the work'},
  ];
  const rows = phases.map(
    (phase, i) =>
      (
        <Rect
          y={-210 + i * 120}
          width={1300}
          height={88}
          radius={radius(18)}
          fill={colors.surf}
          {...boxStyle(phase.color, 8, 4)}
        >
          <Rect x={-600} width={176} height={64} radius={radius(12)} fill={phase.color}>
            <Txt
              text={phase.label}
              fontFamily={fonts.mono}
              fontWeight={700}
              fontSize={25}
              letterSpacing={2}
              fill={colors.onAccent}
            />
          </Rect>
          <Txt x={-480} offsetX={-1} text={phase.text} fontFamily={fonts.mono} fontSize={24} fill={colors.ink} />
        </Rect>
      ) as Rect,
  );

  const registers = [
    {name: 'PC', role: 'next', color: colors.lime},
    {name: 'MAR', role: 'where', color: colors.cyan},
    {name: 'MDR', role: 'what', color: colors.pink},
    {name: 'IR', role: 'current', color: colors.yellow},
    {name: 'ACC', role: 'working', color: colors.violet},
    {name: 'Z', role: 'zero?', color: colors.orange},
  ];
  const regChips = registers.map(
    (reg, i) =>
      (
        <Rect
          x={(i - 2.5) * 200}
          y={150}
          width={180}
          height={62}
          radius={radius(12)}
          fill={colors.surf}
          {...boxStyle(reg.color, 4, 3)}
        >
          <Txt
            y={-11}
            text={reg.name}
            fontFamily={fonts.mono}
            fontWeight={700}
            fontSize={20}
            letterSpacing={1}
            fill={reg.color}
          />
          <Txt y={15} text={reg.role} fontFamily={fonts.mono} fontSize={15} fill={colors.mute} />
        </Rect>
      ) as Rect,
  );

  const teasers = ['PIPELINING', 'CACHES', 'INTERRUPTS'].map(
    (text, i) => chip(text, colors.surf2, {fs: 16, x: (i - 1) * 240, y: 255, color: colors.mute, sh: 3}) as Rect,
  );
  const tag = chip('FETCH. DECODE. EXECUTE. REPEAT.', colors.lime, {fs: 32, y: 350, sh: 10}) as Rect;

  rows.forEach(row => row.opacity(0));
  regChips.forEach(row => row.opacity(0));
  teasers.forEach(row => row.opacity(0));
  tag.opacity(0);
  repeat.opacity(0);
  view.add(
    <Node ref={root}>
      {tracker.node}
      {repeat}
      {rows}
      {regChips}
      {teasers}
      {tag}
    </Node>,
  );

  yield* say('One loop runs every program: fetch, decode, execute, repeat.');
  yield* tracker.set('fetch');
  yield* pop(repeat, 0.3);
  yield* waitFor(3.2);

  yield* say('Fetch copies the next instruction from memory into IR and moves the PC on.');
  yield* pop(rows[0], 0.4);
  yield* waitFor(4.4);

  yield* say('Decode reads the opcode to decide what to do.');
  yield* pop(rows[1], 0.4);
  yield* waitFor(4.4);

  yield* say('Execute uses the ALU, memory or the PC to do it.');
  yield* pop(rows[2], 0.4);
  yield* waitFor(4.6);

  yield* sequence(0.1, ...regChips.map(row => pop(row, 0.25)));
  yield* waitFor(5);

  yield* say('Real CPUs speed this up by overlapping the phases. That is a story for another video.');
  yield* sequence(0.18, ...teasers.map(row => all(row.opacity(1, 0.35), delay(0.1, pop(row, 0.3)))));
  yield* waitFor(5.2);

  yield* say('Fetch. Decode. Execute. Repeat.');
  yield* pop(tag, 0.45);
  yield* all(tracker.node.scale(1.04, 0.3), delay(0.2, tag.scale(1.04, 0.3)));
  yield* all(tracker.node.scale(1, 0.3), delay(0.2, tag.scale(1, 0.3)));
  yield* waitFor(5.4);
  yield* leave(root());
}
