import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {
  ADD_PROGRAM,
  boxStyle,
  chip,
  chipText,
  codePanel,
  colors,
  disassemble,
  fonts,
  highlightRow,
  label,
  leave,
  memoryImage,
  memoryPanel,
  pop,
  radius,
  revealLines,
  say,
  setCell,
  setRowTint,
  writeCell,
} from '@motion-studio/video-kit';

interface BitStripOptions {
  x: number;
  y: number;
  size?: number;
  step?: number;
  onColor: string;
}

/** Eight (or four) bit squares with a flip animation and a direct setter. */
function bitStrip(bits: string, options: BitStripOptions) {
  const {x, y, size = 64, step = 74, onColor} = options;
  const squares: Rect[] = [];
  const texts: Txt[] = [];
  const nodes: Rect[] = [];
  bits.split('').forEach((bit, i) => {
    const on = bit === '1';
    const text = (
      <Txt
        text={bit}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={size * 0.5}
        fill={on ? colors.onAccent : colors.mute}
      />
    ) as Txt;
    const square = (
      <Rect
        x={x + i * step}
        y={y}
        width={size}
        height={size}
        radius={radius(10)}
        fill={on ? onColor : colors.surf2}
        {...boxStyle(colors.cyan, 4, 2.5)}
      >
        {text}
      </Rect>
    ) as Rect;
    squares.push(square);
    texts.push(text);
    nodes.push(square);
  });

  const apply = (value: string): void => {
    value.split('').forEach((bit, i) => {
      const on = bit === '1';
      texts[i].text(bit);
      texts[i].fill(on ? colors.onAccent : colors.mute);
      squares[i].fill(on ? onColor : colors.surf2);
    });
  };

  const flip = function* (value: string): ThreadGenerator {
    for (let i = 0; i < value.length; i++) {
      const on = value[i] === '1';
      texts[i].text(value[i]);
      texts[i].fill(on ? colors.onAccent : colors.mute);
      yield* all(squares[i].scale(1.12, 0.07), squares[i].fill(on ? onColor : colors.surf2, 0.07));
      yield* squares[i].scale(1, 0.1);
    }
  };

  return {nodes, squares, texts, apply, flip};
}

// ================================================================ 01 MEMORY
export function* memorySection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  view.add(<Node ref={root} />);
  const add = (node: Node): Node => {
    root().add(node);
    return node;
  };

  const mem = memoryPanel({x: 610, y: -5, accent: colors.cyan});
  mem.node.opacity(0);
  add(mem.node);

  yield* say('Memory is a long row of numbered boxes.');
  yield* pop(mem.node, 0.5);
  yield* waitFor(6);

  // ---- addresses ---------------------------------------------------------
  const addressChip = chip('4 BITS → 2⁴ = 16 ADDRESSES', colors.cyan, {fs: 24, x: -300, y: -310}) as Rect;
  addressChip.opacity(0);
  add(addressChip);
  yield* say("A box's number is its address. Four bits give us 16 addresses.");
  yield* pop(addressChip, 0.3);
  for (let i = 0; i < 16; i++) {
    setRowTint(mem, i, colors.cyan, true);
    if (i > 0) setRowTint(mem, i - 1, colors.cyan, false);
    yield* waitFor(0.07);
  }
  setRowTint(mem, 15, colors.cyan, false);
  yield* waitFor(6.6);
  addressChip.remove();

  // ---- one byte ----------------------------------------------------------
  const byteChip = chip('8 BITS = 1 BYTE', colors.cyan, {fs: 24, x: -300, y: -170}) as Rect;
  byteChip.opacity(0);
  add(byteChip);
  const byteBits = bitStrip('00000000', {x: -560, y: -40, onColor: colors.cyan});
  byteBits.nodes.forEach(node => {
    node.opacity(0);
    add(node);
  });
  yield* say('Every box holds 8 bits, which we call one byte.');
  yield* all(pop(byteChip, 0.3), sequence(0.05, ...byteBits.nodes.map(node => node.opacity(1, 0.18))));
  yield* byteBits.flip('00000101');
  yield* highlightRow(mem, 12, colors.cyan, true);
  yield* writeCell(mem, 12, 5, '5');
  yield* waitFor(7);

  // ---- the same bits as a number -----------------------------------------
  const numberCard = (
    <Rect
      x={-300}
      y={170}
      width={560}
      height={120}
      radius={radius(16)}
      fill={colors.surf}
      {...boxStyle(colors.violet, 6, 3.5)}
    >
      <Txt
        y={-36}
        text="AS A NUMBER"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={15}
        letterSpacing={2}
        fill={colors.mute}
      />
      <Txt x={-130} y={18} text="00000101" fontFamily={fonts.mono} fontWeight={700} fontSize={38} fill={colors.ink} />
      <Txt x={150} y={18} text="= 5" fontFamily={fonts.mono} fontWeight={700} fontSize={38} fill={colors.lime} />
    </Rect>
  ) as Rect;
  add(numberCard);
  yield* say('The same 8 bits can mean a number, like 5…');
  yield* pop(numberCard, 0.35);
  yield* waitFor(7);

  // ---- the same bits as an instruction -----------------------------------
  yield* all(
    ...byteBits.nodes.map(node => node.opacity(0, 0.25)),
    byteChip.opacity(0, 0.25),
    numberCard.opacity(0, 0.25),
  );
  byteBits.nodes.forEach(node => node.remove());
  byteChip.remove();
  numberCard.remove();

  const opBits = bitStrip('0001', {x: -590, y: -120, size: 56, step: 64, onColor: colors.yellow});
  const operandBits = bitStrip('1100', {x: -330, y: -120, size: 56, step: 64, onColor: colors.orange});
  opBits.nodes.forEach(node => {
    node.opacity(0);
    add(node);
  });
  operandBits.nodes.forEach(node => {
    node.opacity(0);
    add(node);
  });
  const opcodeChip = chip('0001', colors.yellow, {fs: 26, x: -526, y: -30}) as Rect;
  const operandChip = chip('1100', colors.orange, {fs: 26, x: -266, y: -30}) as Rect;
  const opcodeLabel = label('OPCODE · what to do', -526, 24, {fs: 17, fill: colors.yellow});
  const operandLabel = label('OPERAND · which address', -266, 24, {fs: 17, fill: colors.orange});
  const loadText = (
    <Txt x={-300} y={105} text="LOAD 12" fontFamily={fonts.mono} fontWeight={700} fontSize={44} fill={colors.ink} />
  ) as Txt;
  [opcodeChip, operandChip, opcodeLabel, operandLabel, loadText].forEach(node => {
    node.opacity(0);
    add(node);
  });

  yield* say('…or an instruction, like LOAD 12.');
  yield* all(
    sequence(0.05, ...opBits.nodes.map(node => node.opacity(1, 0.18))),
    sequence(0.05, ...operandBits.nodes.map(node => node.opacity(1, 0.18))),
    pop(opcodeChip, 0.3),
    pop(operandChip, 0.3),
    opcodeLabel.opacity(1, 0.3),
    operandLabel.opacity(1, 0.3),
    pop(loadText, 0.35),
  );
  yield* highlightRow(mem, 4, colors.yellow, true);
  yield* writeCell(mem, 4, 0x1c, 'LOAD 12');
  mem.rowTag(4, 'CODE', colors.yellow);
  mem.cellText(4).fill(colors.ink);
  yield* waitFor(7);

  yield* say('An instruction is split in two: what to do, and what to do it to.');
  yield* all(opcodeChip.scale(1.08, 0.2), operandChip.scale(1.08, 0.2));
  yield* all(opcodeChip.scale(1, 0.2), operandChip.scale(1, 0.2));
  yield* waitFor(7.6);

  // ---- the seven instructions --------------------------------------------
  yield* all(
    ...opBits.nodes.map(node => node.opacity(0, 0.25)),
    ...operandBits.nodes.map(node => node.opacity(0, 0.25)),
    opcodeChip.opacity(0, 0.25),
    operandChip.opacity(0, 0.25),
    opcodeLabel.opacity(0, 0.25),
    operandLabel.opacity(0, 0.25),
    loadText.opacity(0, 0.25),
  );
  [...opBits.nodes, ...operandBits.nodes, opcodeChip, operandChip, opcodeLabel, operandLabel, loadText].forEach(node =>
    node.remove(),
  );

  const instructions: [string, string, string][] = [
    ['0000', 'HALT', 'stop the clock'],
    ['0001', 'LOAD a', 'ACC ← M[a]'],
    ['0010', 'ADD a', 'ACC ← ACC + M[a]'],
    ['0011', 'SUB a', 'ACC ← ACC − M[a]'],
    ['0100', 'STORE a', 'M[a] ← ACC'],
    ['0101', 'JUMP a', 'PC ← a'],
    ['0110', 'JZ a', 'if Z = 1 then PC ← a'],
  ];
  const tableHeight = 470;
  const table = (
    <Rect
      x={-300}
      y={-60}
      width={980}
      height={tableHeight}
      radius={radius(18)}
      fill={colors.surf}
      {...boxStyle(colors.cyan, 8, 4)}
    >
      <Txt
        x={-430}
        y={-tableHeight / 2 + 36}
        offsetX={-1}
        text="OPCODE"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={15}
        letterSpacing={2}
        fill={colors.mute}
      />
      <Txt
        x={-250}
        y={-tableHeight / 2 + 36}
        offsetX={-1}
        text="MNEMONIC"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={15}
        letterSpacing={2}
        fill={colors.mute}
      />
      <Txt
        x={-70}
        y={-tableHeight / 2 + 36}
        offsetX={-1}
        text="MEANING"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={15}
        letterSpacing={2}
        fill={colors.mute}
      />
    </Rect>
  ) as Rect;
  const tableRows = instructions.map(([opcode, mnemonic, meaning], i) => {
    const row = (
      <Rect
        y={-tableHeight / 2 + 86 + i * 50}
        width={940}
        height={44}
        radius={radius(8)}
        fill={i % 2 === 0 ? colors.surf2 : colors.clear}
      >
        <Txt
          x={-430}
          offsetX={-1}
          text={opcode}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={21}
          fill={colors.yellow}
        />
        <Txt
          x={-250}
          offsetX={-1}
          text={mnemonic}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={21}
          fill={colors.lime}
        />
        <Txt x={-70} offsetX={-1} text={meaning} fontFamily={fonts.mono} fontSize={19} fill={colors.mute} />
      </Rect>
    ) as Rect;
    table.add(row);
    return row;
  });
  add(table);
  yield* say('Our toy CPU knows just seven instructions.');
  yield* sequence(0.12, ...tableRows.map(row => pop(row, 0.24)));
  yield* waitFor(8);

  // ---- same bits, two readings -------------------------------------------
  yield* table.opacity(0, 0.35);
  table.remove();

  const readingCard = (x: number, accent: string, title: string, value: string, bottom: string, color: string) =>
    (
      <Rect x={x} y={-20} width={440} height={200} radius={radius(18)} fill={colors.surf} {...boxStyle(accent, 7, 4)}>
        <Txt
          y={-62}
          text={title}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={15}
          letterSpacing={2}
          fill={colors.mute}
        />
        <Txt y={-2} text={value} fontFamily={fonts.mono} fontWeight={700} fontSize={42} fill={colors.ink} />
        <Txt y={62} text={bottom} fontFamily={fonts.mono} fontWeight={700} fontSize={32} fill={color} />
      </Rect>
    ) as Rect;
  const numberReading = readingCard(-560, colors.violet, 'AS A NUMBER', '00011100', '= 28', colors.lime);
  const instructionReading = readingCard(-60, colors.yellow, 'AS AN INSTRUCTION', '00011100', 'LOAD 12', colors.yellow);
  const sameChip = chip('SAME BITS', colors.pink, {fs: 20, x: -310, y: -180}) as Rect;
  [numberReading, instructionReading, sameChip].forEach(node => {
    node.opacity(0);
    add(node);
  });
  yield* say('Same bits, two meanings. How they are used decides which one.');
  yield* all(pop(sameChip, 0.3), pop(numberReading, 0.4), pop(instructionReading, 0.4));
  yield* waitFor(7);

  // ---- compiler and assembler --------------------------------------------
  yield* all(numberReading.opacity(0, 0.3), instructionReading.opacity(0, 0.3), sameChip.opacity(0, 0.3));
  [numberReading, instructionReading, sameChip].forEach(node => node.remove());

  const panel = codePanel({
    x: -680,
    y: -40,
    w: 380,
    title: 'Main.java',
    code: ['c = a + b;'],
    lang: 'java',
    accent: colors.pink,
  });
  add(panel.node);
  const asmChips = ['LOAD a', 'ADD b', 'STORE c'].map(
    (text, i) => chip(text, colors.surf2, {fs: 22, color: colors.ink, x: -230, y: -110 + i * 60, sh: 4}) as Rect,
  );
  asmChips.forEach(node => {
    node.opacity(0);
    add(node);
  });
  const bytes = ['00011100', '00101101', '01001110'].map(
    (text, i) =>
      (
        <Txt
          x={100}
          y={-110 + i * 60}
          text={text}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={22}
          fill={colors.ink}
        />
      ) as Txt,
  );
  const compilerArrow = (
    <Line
      points={[
        [-480, -40],
        [-320, -40],
      ]}
      stroke={colors.ink}
      lineWidth={5}
      endArrow
      arrowSize={14}
      end={0}
    />
  ) as Line;
  const assemblerArrow = (
    <Line
      points={[
        [-150, -40],
        [20, -40],
      ]}
      stroke={colors.ink}
      lineWidth={5}
      endArrow
      arrowSize={14}
      end={0}
    />
  ) as Line;
  const compilerLabel = label('COMPILER', -400, -78, {fs: 16, fill: colors.mute});
  const assemblerLabel = label('ASSEMBLER', -65, -78, {fs: 16, fill: colors.mute});
  const pipeline = [compilerArrow, assemblerArrow, compilerLabel, assemblerLabel, ...bytes];
  pipeline.forEach(node => {
    node.opacity(0);
    add(node);
  });

  yield* say('A compiler turns your code into these instruction bytes.');
  yield* revealLines(panel);
  yield* sequence(0.12, ...asmChips.map(node => pop(node, 0.24)));
  yield* all(compilerArrow.end(0.6, 0.5), compilerArrow.opacity(1, 0.1));
  yield* all(
    assemblerArrow.end(0.6, 0.5),
    assemblerArrow.opacity(1, 0.1),
    compilerLabel.opacity(1, 0.2),
    assemblerLabel.opacity(1, 0.2),
    ...bytes.map(node => node.opacity(1, 0.25)),
  );
  yield* waitFor(4);
  asmChips.forEach((node, i) => chipText(node).text(['LOAD 12', 'ADD 13', 'STORE 14'][i]));
  yield* waitFor(6.4);

  // ---- the program lands in memory ---------------------------------------
  yield* all(
    panel.node.opacity(0, 0.3),
    ...asmChips.map(node => node.opacity(0, 0.3)),
    ...pipeline.map(node => node.opacity(0, 0.3)),
  );
  panel.node.remove();
  [...asmChips, ...pipeline].forEach(node => node.remove());

  const image = memoryImage(ADD_PROGRAM);
  for (let i = 0; i < 4; i++) {
    setCell(mem, i, 0, 'reserved');
    mem.rowTag(i, 'OS', colors.mute);
    mem.cellText(i).fill(colors.mute);
  }
  const leftTitle = (
    <Txt x={-300} y={-100} text="ONE MEMORY" fontFamily={fonts.sans} fontWeight={700} fontSize={56} fill={colors.ink} />
  ) as Txt;
  const leftSub = chip('CODE + DATA, SIDE BY SIDE', colors.cyan, {fs: 22, x: -300, y: 0}) as Rect;
  [leftTitle, leftSub].forEach(node => {
    node.opacity(0);
    add(node);
  });
  yield* say('The program and its data sit side by side in memory.');
  yield* all(pop(leftTitle, 0.4), pop(leftSub, 0.35));
  for (let i = 4; i < 8; i++) {
    yield* writeCell(mem, i, image[i], disassemble(image[i]));
    mem.rowTag(i, 'CODE', colors.yellow);
    mem.cellText(i).fill(colors.ink);
    setRowTint(mem, i, colors.yellow, true);
  }
  for (const address of [12, 13, 14]) {
    yield* writeCell(mem, address, image[address], String(image[address]));
    mem.rowTag(address, 'DATA', colors.cyan);
    mem.cellText(address).fill(colors.ink);
    setRowTint(mem, address, colors.cyan, true);
  }
  yield* waitFor(8);
  yield* leave(root());
}
