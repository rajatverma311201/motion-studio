import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, sequence, waitFor} from '@motion-canvas/core';
import {
  chip,
  codePanel,
  colors,
  fonts,
  focusLine,
  leave,
  pop,
  revealLines,
  say,
  shake,
  boxStyle,
  radius,
} from '@motion-studio/video-kit';

// ================================================================ 07 IN CODE (Quarkus)
export function* inCodeSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const code = codePanel({
    x: -340,
    y: -20,
    w: 1100,
    title: 'TransferService.java',
    lang: 'java',
    accent: colors.orange,
    code: [
      'import jakarta.transaction.Transactional;',
      '',
      '@ApplicationScoped',
      'public class TransferService {',
      '',
      '  @Transactional',
      '  public void transfer(long from, long to, BigDecimal amt) {',
      '    accounts.debit(from, amt);',
      '    accounts.credit(to, amt);',
      '  }',
      '}',
    ],
  });
  const py = (i: number) => code.node.y() + code.lineY(i);
  const px = (rel: number) => code.node.x() - 550 + rel;
  const begin = chip('BEGIN ▸ before the method runs', colors.lime, {
    x: px(560),
    y: py(5),
    fs: 17,
    sh: 4,
  }) as Rect;
  const commitC = chip('COMMIT ▸ after it returns', colors.lime, {
    x: px(450),
    y: py(9),
    fs: 17,
    sh: 4,
  }) as Rect;
  const thr = chip('← throws RuntimeException', colors.red, {
    x: px(700),
    y: py(8),
    fs: 17,
    sh: 4,
    color: colors.ink,
  }) as Rect;
  const undo = chip('← undone ↺', colors.pink, {
    x: px(580),
    y: py(7),
    fs: 17,
    sh: 4,
  }) as Rect;
  [begin, commitC, thr, undo].forEach(n => n.opacity(0));

  const rule = (y: number, a: string, b: string, tag: string, color: string) => {
    const n = (
      <Rect x={585} y={y} width={620} height={104} radius={radius(20)} fill={colors.surf} {...boxStyle(color, 8, 4)}>
        <Txt
          x={-285}
          y={-20}
          offsetX={-1}
          text={a}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={22}
          fill={colors.ink}
        />
        <Txt
          x={-285}
          y={22}
          offsetX={-1}
          text={b}
          fontFamily={fonts.sans}
          fontWeight={500}
          fontSize={22}
          fill={colors.mute}
        />
        <Rect x={215} width={150} height={44} radius={radius(10)} fill={color}>
          <Txt
            text={tag}
            fontFamily={fonts.mono}
            fontWeight={700}
            fontSize={20}
            letterSpacing={1}
            fill={colors.onAccent}
          />
        </Rect>
      </Rect>
    ) as Rect;
    n.opacity(0);
    return n;
  };
  const r1 = rule(-170, 'RuntimeException', 'unchecked: the default rolls back', 'ROLLBACK', colors.pink);
  const r2 = rule(-48, 'Checked Exception', 'default: it still COMMITS', 'COMMIT', colors.yellow);
  const r3 = rule(
    74,
    '@Transactional(rollbackOn = …)',
    'opt in to roll back on checked ones too',
    'ROLLBACK',
    colors.lime,
  );
  const tip = (
    <Rect
      x={585}
      y={225}
      width={620}
      height={110}
      radius={radius(20)}
      fill={colors.surf}
      {...boxStyle(colors.cyan, 8, 4)}
      opacity={0}
    >
      <Txt
        x={-285}
        y={-22}
        offsetX={-1}
        text="KEEP IT SHORT"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={20}
        letterSpacing={2}
        fill={colors.cyan}
      />
      <Txt
        x={-285}
        y={22}
        offsetX={-1}
        text="No HTTP calls or sleeps inside a transaction."
        fontFamily={fonts.sans}
        fontWeight={500}
        fontSize={24}
        fill={colors.ink}
      />
    </Rect>
  ) as Rect;

  view.add(
    <Node ref={root} opacity={0}>
      {code.node}
      {begin}
      {commitC}
      {thr}
      {undo}
      {r1}
      {r2}
      {r3}
      {tip}
    </Node>,
  );
  yield* root().opacity(1, 0.35);

  yield* say('In Quarkus, one annotation gives you all of this: @Transactional.');
  yield* revealLines(code);
  yield* waitFor(1);

  yield* say('The interceptor starts a transaction before the method and commits after it returns.');
  yield* focusLine(code, 5, colors.orange);
  yield* pop(begin, 0.3);
  yield* waitFor(1.4);
  yield* focusLine(code, 9, colors.orange);
  yield* pop(commitC, 0.3);
  yield* waitFor(2.2);

  yield* say('If the method throws a runtime exception, the whole transaction rolls back.');
  yield* all(begin.opacity(0, 0.2), commitC.opacity(0, 0.2));
  yield* focusLine(code, 8, colors.red);
  yield* pop(thr, 0.3);
  yield* waitFor(0.8);
  yield* focusLine(code, 7, colors.pink);
  yield* pop(undo, 0.3);
  yield* waitFor(2.4);

  yield* say('Watch out: checked exceptions do not roll back by default.');
  yield* all(thr.opacity(0, 0.2), undo.opacity(0, 0.2), code.hl.opacity(0, 0.2));
  yield* sequence(0.35, pop(r1, 0.35), pop(r2, 0.35), pop(r3, 0.35));
  yield* shake(r2, 6, 4);
  yield* waitFor(3.4);

  yield* say('And keep transactions short, so locks are held for as little time as possible.');
  yield* pop(tip, 0.35);
  yield* waitFor(4);
  yield* leave(root());
}
