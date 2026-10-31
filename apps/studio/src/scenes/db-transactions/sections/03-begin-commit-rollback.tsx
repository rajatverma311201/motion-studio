import {Node, Rect, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeInOutCubic, waitFor} from '@motion-canvas/core';
import {
  accountCard,
  chip,
  chipText,
  codePanel,
  colors,
  focusLine,
  leave,
  pop,
  revealLines,
  say,
  shake,
  radius,
} from '@motion-studio/video-kit';
import {coin, fmt, moveBal, setTag, totalChip} from '../shared';

// ================================================================ 02 BEGIN / COMMIT / ROLLBACK
export function* beginCommitRollbackSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const alice = accountCard({
    name: 'ALICE',
    letter: 'A',
    color: colors.cyan,
    x: -560,
    y: -170,
    value: 1000,
    format: fmt,
  });
  const bob = accountCard({name: 'BOB', letter: 'B', color: colors.pink, x: -560, y: 80, value: 500, format: fmt});
  const total = totalChip(-560, 270);
  total.fill(colors.cyan);
  const box = (
    <Rect
      x={-560}
      y={-45}
      width={580}
      height={500}
      radius={radius(34)}
      stroke={colors.lime}
      lineWidth={4}
      lineDash={[16, 12]}
      opacity={0}
    />
  ) as Rect;
  const boxLabel = chip('TRANSACTION #4821 · ACTIVE', colors.lime, {
    x: -560,
    y: -310,
    fs: 20,
    sh: 5,
  }) as Rect;
  boxLabel.opacity(0);
  const code = codePanel({
    x: 390,
    y: -110,
    w: 900,
    title: 'transfer.sql',
    lang: 'sql',
    accent: colors.lime,
    code: [
      'BEGIN;',
      "UPDATE accounts SET bal = bal - 300 WHERE id = 'alice';",
      "UPDATE accounts SET bal = bal + 300 WHERE id = 'bob';",
      'COMMIT;',
      'ROLLBACK;  -- if anything fails',
    ],
  });
  const c = coin();
  c.position([-330, -170]);
  c.opacity(0);
  const commitStamp = chip('COMMITTED ✓', colors.lime, {
    fs: 50,
    rot: -3,
    x: 390,
    y: 150,
    sh: 10,
    mono: false,
  }) as Rect;
  const crash = chip('SERVER CRASH', colors.red, {
    fs: 40,
    rot: 3,
    x: 390,
    y: 150,
    sh: 10,
    color: colors.ink,
    mono: false,
  }) as Rect;
  const rb = chip('ROLLED BACK ↺', colors.pink, {
    fs: 50,
    rot: -3,
    x: 390,
    y: 250,
    sh: 10,
    mono: false,
  }) as Rect;
  [commitStamp, crash, rb].forEach(s => s.opacity(0));
  view.add(
    <Node ref={root} opacity={0}>
      {box}
      {boxLabel}
      {alice.node}
      {bob.node}
      {total}
      {code.node}
      {c}
      {commitStamp}
      {crash}
      {rb}
    </Node>,
  );
  yield* root().opacity(1, 0.35);

  // ---- happy path
  yield* say('Wrap both updates in BEGIN … COMMIT and they become one transaction.');
  yield* revealLines(code);
  yield* waitFor(1);
  yield* focusLine(code, 0, colors.lime);
  yield* all(box.opacity(1, 0.3), pop(boxLabel, 0.3));
  yield* waitFor(0.8);

  yield* say('Changes inside a transaction stay pending. Nobody else treats them as final.');
  yield* focusLine(code, 1, colors.cyan);
  yield* all(
    moveBal(alice, 700, 0.7, colors.yellow),
    pop(c, 0.3),
    c.position([-215, -45], 0.7, easeInOutCubic),
    setTag(alice, 'UNCOMMITTED', colors.yellow),
  );
  yield* focusLine(code, 2, colors.pink);
  yield* all(
    c.position([-330, 80], 0.6, easeInOutCubic),
    moveBal(bob, 800, 0.7, colors.yellow),
    setTag(bob, 'UNCOMMITTED', colors.yellow),
  );
  yield* c.opacity(0, 0.25);
  yield* waitFor(1);

  yield* say('COMMIT makes both changes permanent at the same instant.');
  yield* focusLine(code, 3, colors.lime);
  yield* all(
    setTag(alice, 'COMMITTED', colors.lime),
    setTag(bob, 'COMMITTED', colors.lime),
    alice.bal.fill(colors.ink, 0.3),
    bob.bal.fill(colors.ink, 0.3),
    boxLabel.fill(colors.lime, 0.2),
    pop(commitStamp, 0.35),
  );
  chipText(boxLabel).text('TRANSACTION #4821 · COMMITTED');
  yield* waitFor(3);

  // ---- failure path
  yield* say('Now replay it, and let the server crash halfway through.');
  yield* all(
    commitStamp.opacity(0, 0.3),
    alice.tag.opacity(0, 0.3),
    bob.tag.opacity(0, 0.3),
    box.opacity(0, 0.3),
    boxLabel.opacity(0, 0.3),
  );
  alice.bal.text(fmt(1000));
  bob.bal.text(fmt(500));
  alice.value = 1000;
  bob.value = 500;
  yield* all(code.hl.opacity(0, 0.2));
  chipText(boxLabel).text('TRANSACTION #4822 · ACTIVE');
  yield* waitFor(0.6);
  yield* focusLine(code, 0, colors.lime);
  yield* all(box.opacity(1, 0.3), pop(boxLabel, 0.3));
  yield* focusLine(code, 1, colors.cyan);
  c.position([-330, -170]);
  yield* all(
    moveBal(alice, 700, 0.7, colors.yellow),
    pop(c, 0.3),
    c.position([-215, -45], 0.7, easeInOutCubic),
    setTag(alice, 'UNCOMMITTED', colors.yellow),
  );
  yield* waitFor(0.6);

  yield* say('The crash hits before COMMIT. The database notices the unfinished transaction.');
  yield* focusLine(code, 2, colors.red);
  yield* all(pop(crash, 0.3), shake(root(), 16, 8));
  yield* waitFor(1.2);

  yield* say('ROLLBACK: every pending change is undone. It is as if nothing happened.');
  yield* focusLine(code, 4, colors.pink);
  yield* all(
    moveBal(alice, 1000, 0.8, colors.ink),
    c.position([-330, -170], 0.8, easeInOutCubic),
    box.stroke(colors.pink, 0.3),
    boxLabel.fill(colors.pink, 0.3),
    crash.opacity(0, 0.4),
  );
  chipText(boxLabel).text('TRANSACTION #4822 · ROLLED BACK');
  yield* all(c.opacity(0, 0.3), alice.tag.opacity(0, 0.3), pop(rb, 0.35));
  yield* waitFor(0.6);
  yield* total.fill(colors.lime, 0.3);
  chipText(total).text('TOTAL IN BANK  ₹1,500  ✓');
  yield* waitFor(3.4);
  yield* leave(root());
}
