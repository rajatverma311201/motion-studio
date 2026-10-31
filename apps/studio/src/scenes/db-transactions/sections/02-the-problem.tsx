import {Node, Rect, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeInCubic, easeInOutCubic, waitFor} from '@motion-canvas/core';
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
} from '@motion-studio/video-kit';
import {coin, fmt, moveBal, totalChip} from '../shared';

// ================================================================ 01 THE PROBLEM
export function* problemSection(view: View2D): ThreadGenerator {
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
  const code = codePanel({
    x: 380,
    y: -150,
    w: 900,
    title: 'transfer.sql',
    lang: 'sql',
    accent: colors.pink,
    code: [
      '-- transfer ₹300 from Alice to Bob',
      "UPDATE accounts SET bal = bal - 300 WHERE id = 'alice';",
      "UPDATE accounts SET bal = bal + 300 WHERE id = 'bob';",
    ],
  });
  const c = coin();
  c.position([-330, -170]);
  c.opacity(0);
  const crash = chip('SERVER CRASH', colors.red, {
    fs: 46,
    rot: -3,
    x: 380,
    y: 70,
    sh: 10,
    color: colors.ink,
    shadow: colors.ink,
    mono: false,
  }) as Rect;
  const gone = chip('₹300 VANISHED', colors.yellow, {
    fs: 44,
    rot: 2,
    x: 380,
    y: 200,
    sh: 10,
    mono: false,
  }) as Rect;
  crash.opacity(0);
  gone.opacity(0);
  view.add(
    <Node ref={root} opacity={0}>
      {alice.node}
      {bob.node}
      {total}
      {code.node}
      {c}
      {crash}
      {gone}
    </Node>,
  );
  yield* root().opacity(1, 0.35);

  yield* say('Alice sends ₹300 to Bob. In SQL that is two separate UPDATE statements.');
  yield* revealLines(code);
  yield* waitFor(1.2);

  yield* say('Step 1 runs: the money leaves Alice’s account.');
  yield* focusLine(code, 1, colors.cyan);
  yield* all(moveBal(alice, 700, 0.8, colors.yellow), pop(c, 0.3), c.position([-215, -45], 0.8, easeInOutCubic));
  yield* waitFor(1.2);

  yield* say('The server dies before step 2 ever runs.');
  yield* focusLine(code, 2, colors.red);
  yield* waitFor(0.5);
  yield* all(pop(crash, 0.3), shake(root(), 16, 8));
  yield* all(c.opacity(0.25, 0.5), c.position([-215, 20], 0.5, easeInCubic));
  yield* waitFor(1.4);

  yield* say('Bob never receives it. The books no longer add up.');
  chipText(total).text('TOTAL IN BANK  ₹1,200');
  yield* all(total.fill(colors.red, 0.3), pop(gone, 0.35));
  yield* shake(total, 8, 4);
  yield* waitFor(3.2);
  yield* say('The database is now inconsistent. We need all-or-nothing.', 3);
  yield* leave(root());
}
