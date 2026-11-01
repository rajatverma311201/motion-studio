import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {
  ADD_PROGRAM,
  assemble,
  boxStyle,
  chip,
  colors,
  disassemble,
  flyAlong,
  fonts,
  formatBits,
  leave,
  memoryPanel,
  pop,
  radius,
  registerBox,
  say,
  setCell,
  setRowTint,
  toHex,
  valuePacket,
  writeCell,
  writeRegister,
} from '@motion-studio/video-kit';

// ================================================================ 03 LOADING
export function* loadingSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const fx = createRef<Node>();
  view.add(
    <Node ref={root}>
      <Node ref={fx} zIndex={20} />
    </Node>,
  );

  const memory = memoryPanel({x: 610, y: -5, accent: colors.cyan});
  root().add(memory.node);
  for (let i = 0; i < 4; i++) {
    setCell(memory, i, 0, 'reserved');
    memory.rowTag(i, 'OS', colors.mute);
    memory.cellText(i).fill(colors.mute);
  }

  // ---- the file on disk ---------------------------------------------------
  const diskX = -620;
  const diskY = -60;
  const disk = (
    <Rect
      x={diskX}
      y={diskY}
      width={520}
      height={430}
      radius={radius(20)}
      fill={colors.surf}
      {...boxStyle(colors.yellow, 9, 4)}
    >
      <Txt
        x={-230}
        y={-195}
        offsetX={-1}
        text="DISK"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={18}
        letterSpacing={3}
        fill={colors.yellow}
      />
      <Rect
        x={0}
        y={15}
        width={480}
        height={390}
        radius={radius(14)}
        fill={colors.surf2}
        stroke={colors.border}
        lineWidth={2}
      >
        <Txt
          x={-215}
          y={-160}
          offsetX={-1}
          text="add.prog"
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={19}
          fill={colors.ink}
        />
        <Txt
          x={215}
          y={-160}
          offsetX={1}
          text="7 BYTES"
          fontFamily={fonts.mono}
          fontSize={14}
          letterSpacing={1}
          fill={colors.mute}
        />
      </Rect>
    </Rect>
  ) as Rect;
  root().add(disk);

  const fileRows = [
    {address: 4, byte: assemble(ADD_PROGRAM.code)[0], tag: 'CODE'},
    {address: 5, byte: assemble(ADD_PROGRAM.code)[1], tag: 'CODE'},
    {address: 6, byte: assemble(ADD_PROGRAM.code)[2], tag: 'CODE'},
    {address: 7, byte: assemble(ADD_PROGRAM.code)[3], tag: 'CODE'},
    {address: 12, byte: ADD_PROGRAM.data[12], tag: 'DATA'},
    {address: 13, byte: ADD_PROGRAM.data[13], tag: 'DATA'},
    {address: 14, byte: ADD_PROGRAM.data[14], tag: 'DATA'},
  ];
  const fileRowY = (address: number): number =>
    diskY + (address < 12 ? -105 + (address - 4) * 44 : 89 + (address - 12) * 44);

  const fileNodes = fileRows.map(row => {
    const y = fileRowY(row.address);
    const tagColor = row.tag === 'CODE' ? colors.yellow : colors.cyan;
    const node = (
      <Rect x={diskX} y={y} width={440} height={38} radius={radius(8)} fill={colors.clear}>
        <Txt
          x={-215}
          offsetX={-1}
          text={String(row.address)}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={16}
          fill={colors.mute}
        />
        <Txt
          x={-160}
          offsetX={-1}
          text={toHex(row.byte)}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={18}
          fill={tagColor}
        />
        <Txt
          x={-90}
          offsetX={-1}
          text={formatBits(row.byte, 8)}
          fontFamily={fonts.mono}
          fontSize={18}
          fill={colors.ink}
        />
        <Txt
          x={215}
          offsetX={1}
          text={row.tag}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={13}
          letterSpacing={1}
          fill={tagColor}
        />
      </Rect>
    ) as Rect;
    node.opacity(0);
    root().add(node);
    return node;
  });

  yield* say('A program on disk is just a file full of bytes.');
  yield* all(pop(disk, 0.4), sequence(0.06, ...fileNodes.map(node => node.opacity(1, 0.2))));
  yield* waitFor(7);

  // ---- the CPU cannot run it from disk ------------------------------------
  const cpuIcon = (
    <Rect
      x={-770}
      y={275}
      width={170}
      height={86}
      radius={radius(14)}
      fill={colors.surf2}
      stroke={colors.dim}
      lineWidth={3}
    >
      <Txt text="CPU" fontFamily={fonts.mono} fontWeight={700} fontSize={26} letterSpacing={2} fill={colors.mute} />
    </Rect>
  ) as Rect;
  const crossA = (
    <Line
      points={[
        [-800, 205],
        [-740, 145],
      ]}
      stroke={colors.red}
      lineWidth={6}
      endArrow
      arrowSize={14}
    />
  ) as Line;
  const crossB = (
    <Line
      points={[
        [-740, 205],
        [-800, 145],
      ]}
      stroke={colors.red}
      lineWidth={6}
    />
  ) as Line;
  [cpuIcon, crossA, crossB].forEach(node => {
    node.opacity(0);
    root().add(node);
  });
  yield* say('The CPU cannot run it from there. It only runs what is in memory.');
  yield* all(cpuIcon.opacity(0.6, 0.35), crossA.opacity(1, 0.35), crossB.opacity(1, 0.35));
  yield* waitFor(7);

  // ---- start the loader ---------------------------------------------------
  const runChip = chip('YOU RUN THE PROGRAM', colors.lime, {fs: 20, x: -200, y: -255}) as Rect;
  runChip.opacity(0);
  root().add(runChip);
  const loader = (
    <Rect
      x={-200}
      y={-150}
      width={280}
      height={110}
      radius={radius(16)}
      fill={colors.surf}
      {...boxStyle(colors.yellow, 7, 4)}
    >
      <Txt
        y={-22}
        text="LOADER (OS)"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={19}
        letterSpacing={2}
        fill={colors.yellow}
      />
      <Txt y={22} text="copy · place · set PC" fontFamily={fonts.mono} fontSize={14} fill={colors.mute} />
    </Rect>
  ) as Rect;
  loader.opacity(0);
  root().add(loader);

  yield* say("You start the program. The operating system's loader takes over.");
  yield* all(pop(runChip, 0.3), pop(loader, 0.4));
  yield* waitFor(6);

  // ---- free space brackets ------------------------------------------------
  const bracket = (from: number, to: number, color: string, text: string) => {
    const top = memory.rowY(from) - 22;
    const bottom = memory.rowY(to) + 22;
    const line = (
      <Line
        points={[
          [330, top],
          [318, top],
          [318, bottom],
          [330, bottom],
        ]}
        stroke={color}
        lineWidth={4}
      />
    ) as Line;
    const labelNode = (
      <Txt
        x={306}
        y={(top + bottom) / 2}
        offsetX={1}
        text={text}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={16}
        letterSpacing={1}
        fill={color}
      />
    ) as Txt;
    line.opacity(0);
    labelNode.opacity(0);
    root().add(line);
    root().add(labelNode);
    return {line, labelNode};
  };
  const codeBracket = bracket(4, 7, colors.yellow, 'CODE');
  const dataBracket = bracket(12, 14, colors.cyan, 'DATA');
  yield* say('It finds free space in memory. Addresses 0 to 3 belong to the OS.');
  yield* all(
    codeBracket.line.opacity(1, 0.35),
    codeBracket.labelNode.opacity(1, 0.35),
    dataBracket.line.opacity(1, 0.35),
    dataBracket.labelNode.opacity(1, 0.35),
  );
  for (let i = 0; i < 4; i++) memory.rowTag(i, 'OS', colors.mute);
  yield* waitFor(7);

  // ---- copy the bytes -----------------------------------------------------
  const pathFor = (address: number): [number, number][] => [
    [-380, fileRowY(address)],
    [-330, -150],
    [-60, -150],
    [-60, memory.rowY(address)],
    [330, memory.rowY(address)],
  ];

  yield* say('Now it copies the code into memory, byte by byte.');
  for (const row of fileRows.slice(0, 4)) {
    const packet = valuePacket(formatBits(row.byte, 8), colors.yellow);
    fx().add(packet);
    yield* flyAlong(packet, pathFor(row.address), 0.55);
    yield* writeCell(memory, row.address, row.byte, disassemble(row.byte));
    memory.rowTag(row.address, 'CODE', colors.yellow);
    memory.cellText(row.address).fill(colors.ink);
    setRowTint(memory, row.address, colors.yellow, true);
    yield* waitFor(0.2);
  }
  for (const address of [4, 5, 6, 7]) setRowTint(memory, address, colors.yellow, true);
  yield* waitFor(5);

  yield* say('And the data, which has to be somewhere too.');
  for (const row of fileRows.slice(4)) {
    const packet = valuePacket(formatBits(row.byte, 8), colors.cyan);
    fx().add(packet);
    yield* flyAlong(packet, pathFor(row.address), 0.55);
    yield* writeCell(memory, row.address, row.byte, String(row.byte));
    memory.rowTag(row.address, 'DATA', colors.cyan);
    memory.cellText(row.address).fill(colors.ink);
    setRowTint(memory, row.address, colors.cyan, true);
    yield* waitFor(0.2);
  }
  for (const address of [12, 13, 14]) setRowTint(memory, address, colors.cyan, true);
  yield* waitFor(5);

  // ---- set the PC ---------------------------------------------------------
  const pc = registerBox({
    name: 'PC',
    bits: 4,
    color: colors.lime,
    x: -200,
    y: 40,
    w: 260,
    h: 120,
    value: 0,
    hint: 'entry point',
  });
  pc.node.opacity(0);
  root().add(pc.node);
  yield* say('Last step: set the PC to the address of the first instruction.');
  yield* pop(pc.node, 0.35);
  yield* writeRegister(pc, 4, {hint: 'first instruction'});
  yield* waitFor(8);

  yield* say('PC = 4. Now the CPU can start the cycle.');
  const ready = chip('PC = 4 · READY', colors.lime, {fs: 26, x: -200, y: 300}) as Rect;
  ready.opacity(0);
  root().add(ready);
  yield* all(disk.opacity(0.55, 0.4), loader.opacity(0.55, 0.4), pop(ready, 0.35));
  yield* waitFor(9.6);
  yield* leave(root());
}
