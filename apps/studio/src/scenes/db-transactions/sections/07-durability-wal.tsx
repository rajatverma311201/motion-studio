import {Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeInOutCubic, sequence, tween, waitFor} from '@motion-canvas/core';
import {
  chip,
  colors,
  fonts,
  leave,
  logRow,
  neubrutal,
  pop,
  say,
  shake,
  titledPanel,
} from '@motion-studio/video-kit';

// ================================================================ 06 DURABILITY / WAL
export function* durabilityWalSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const client = titledPanel({x: -780, y: -40, width: 190, height: 130, title: 'CLIENT', color: colors.cyan});
  client.add(
    <Txt y={22} text="COMMIT;" fontFamily={fonts.mono} fontWeight={700} fontSize={26} fill={colors.ink} />,
  );
  const ram = titledPanel({x: -380, y: -40, width: 330, height: 360, title: 'RAM · BUFFER POOL', color: colors.orange});
  const wal = titledPanel({
    x: 200,
    y: -170,
    width: 520,
    height: 220,
    title: 'WAL · APPEND-ONLY LOG (DISK)',
    color: colors.lime,
  });
  const data = titledPanel({x: 200, y: 120, width: 520, height: 200, title: 'DATA FILES (DISK)', color: colors.violet});

  const pgA = logRow({text: 'page 7 · alice = 1,000', x: 0, y: -30, width: 290, color: colors.orange});
  const pgB = logRow({text: 'page 9 · bob = 500', x: 0, y: 30, width: 290, color: colors.orange});
  const lost = (
    <Txt
      y={10}
      text="MEMORY LOST"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={22}
      letterSpacing={2}
      fill={colors.red}
      opacity={0}
    />
  ) as Txt;
  ram.add([pgA, pgB, lost]);
  const dA = logRow({text: 'alice = 1,000', x: 0, y: -10, width: 440, color: colors.violet});
  const dB = logRow({text: 'bob = 500', x: 0, y: 46, width: 440, color: colors.violet});
  data.add([dA, dB]);
  const dirtyTag = chip('DIRTY', colors.orange, {
    x: 100,
    y: 100,
    fs: 15,
    sh: 3,
  }) as Rect;
  dirtyTag.opacity(0);
  ram.add(dirtyTag);
  const stale = chip('STALE', colors.red, {
    x: 180,
    y: -76,
    fs: 14,
    sh: 3,
    color: colors.ink,
  }) as Rect;
  stale.opacity(0);
  data.add(stale);

  // WAL log rows
  const walRows = ['tx4821  alice 1000 → 700', 'tx4821  bob 500 → 800', 'tx4821  COMMIT'].map((t, i) => {
    const r = logRow({text: t, x: 0, y: -26 + i * 50, width: 470, color: i === 2 ? colors.lime : colors.dim});
    r.opacity(0);
    return r;
  });
  wal.add(walRows);
  const fsync = chip('fsync ✓', colors.lime, {
    x: 190,
    y: -112,
    fs: 15,
    sh: 3,
  }) as Rect;
  fsync.opacity(0);
  wal.add(fsync);

  // steps checklist (right)
  const stepDefs = [
    ['1', 'change in RAM first'],
    ['2', 'append to WAL + fsync'],
    ['3', 'tell client: COMMIT OK'],
    ['4', 'data files updated later'],
  ];
  const list = stepDefs.map(([n, t], i) => {
    const r = (
      <Rect
        x={740}
        y={-190 + i * 82}
        width={330}
        height={68}
        radius={14}
        fill={colors.surf}
        stroke={colors.dim}
        lineWidth={3}
      >
        <Rect x={-132} width={36} height={36} radius={10} fill={colors.dim}>
          <Txt text={n} fontFamily={fonts.mono} fontWeight={700} fontSize={22} fill={colors.ink} />
        </Rect>
        <Txt
          x={-104}
          offsetX={-1}
          text={t}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={16}
          fill={colors.mute}
        />
      </Rect>
    ) as Rect;
    r.opacity(0);
    return r;
  });
  const lightStep = function* (i: number): ThreadGenerator {
    const r = list[i];
    const badge = r.children()[0] as Rect;
    yield* all(
      r.stroke(colors.lime, 0.2),
      badge.fill(colors.lime, 0.2),
      (badge.children()[0] as Txt).fill(colors.dark, 0.2),
      (r.children()[1] as Txt).fill(colors.ink, 0.2),
    );
  };

  // connection lines
  const lnA = (
    <Line
      points={[
        [-685, -40],
        [-545, -40],
      ]}
      stroke={colors.dim}
      lineWidth={4}
      lineDash={[8, 8]}
      endArrow
      arrowSize={12}
    />
  ) as Line;
  const lnB = (
    <Line
      points={[
        [-215, -110],
        [-60, -170],
      ]}
      stroke={colors.dim}
      lineWidth={4}
      lineDash={[8, 8]}
      endArrow
      arrowSize={12}
    />
  ) as Line;
  const lnC = (
    <Line
      points={[
        [-215, 60],
        [-60, 120],
      ]}
      stroke={colors.dim}
      lineWidth={4}
      lineDash={[8, 8]}
      endArrow
      arrowSize={12}
    />
  ) as Line;
  const lnD = (
    <Line
      points={[
        [200, -282],
        [200, -345],
        [-780, -345],
        [-780, -107],
      ]}
      radius={20}
      stroke={colors.dim}
      lineWidth={4}
      lineDash={[8, 8]}
      endArrow
      arrowSize={12}
    />
  ) as Line;

  const packet = (text: string, color: string) => {
    const p = chip(text, color, {fs: 17, sh: 4}) as Rect;
    p.opacity(0);
    return p;
  };
  const fly = function* (p: Rect, ln: Line, dur: number, reverse = false): ThreadGenerator {
    p.position(ln.getPointAtPercentage(reverse ? 1 : 0).position);
    p.opacity(1);
    yield* tween(dur, v => {
      const t = easeInOutCubic(v);
      p.position(ln.getPointAtPercentage(reverse ? 1 - t : t).position);
    });
    yield* p.opacity(0, 0.15);
  };

  const pk1 = packet('UPDATE', colors.cyan);
  const pk2 = packet('LOG REC', colors.lime);
  const pk3 = packet('COMMIT OK ✓', colors.lime);
  const power = chip('POWER CUT', colors.red, {
    x: -380,
    y: -262,
    fs: 34,
    rot: -3,
    sh: 8,
    color: colors.ink,
    mono: false,
  }) as Rect;
  power.opacity(0);
  const restart = chip('RESTART → REPLAY LOG', colors.lime, {
    x: 330,
    y: 270,
    fs: 24,
    sh: 6,
  }) as Rect;
  restart.opacity(0);
  const recovered = chip('RECOVERED', colors.lime, {
    x: 180,
    y: -76,
    fs: 14,
    sh: 3,
  }) as Rect;
  recovered.opacity(0);
  data.add(recovered);

  const parts = [client, ram, wal, data];
  parts.forEach(p => p.opacity(0));
  view.add(
    <Node ref={root}>
      {lnA}
      {lnB}
      {lnC}
      {lnD}
      {parts}
      {list}
      {pk1}
      {pk2}
      {pk3}
      {power}
      {restart}
    </Node>,
  );

  yield* say('Writing every change straight to the data files would be slow random I/O.');
  yield* sequence(0.15, ...parts.map(p => pop(p, 0.35)));
  yield* sequence(0.1, ...list.map(l => l.opacity(1, 0.3)));
  yield* waitFor(2.2);

  yield* say('First the change is made in memory, on a cached page.');
  yield* lightStep(0);
  yield* fly(pk1, lnA, 0.7);
  (pgA.children()[0] as Txt).text('page 7 · alice = 700');
  (pgB.children()[0] as Txt).text('page 9 · bob = 800');
  yield* all(pgA.stroke(colors.yellow, 0.2), pgB.stroke(colors.yellow, 0.2), pop(dirtyTag, 0.3));
  yield* waitFor(1.8);

  yield* say('Before COMMIT returns, the log records are appended to the WAL and flushed.');
  yield* lightStep(1);
  yield* fly(pk2, lnB, 0.6);
  yield* walRows[0].opacity(1, 0.25);
  yield* fly(pk2, lnB, 0.5);
  yield* walRows[1].opacity(1, 0.25);
  yield* fly(pk2, lnB, 0.5);
  yield* walRows[2].opacity(1, 0.25);
  yield* all(pop(fsync, 0.3), wal.stroke(colors.lime, 0.2));
  yield* waitFor(1.4);

  yield* say('Only now does the client hear COMMIT OK. The log is on disk, so the commit is durable.');
  yield* lightStep(2);
  yield* fly(pk3, lnD, 1.4);
  yield* waitFor(1.6);

  yield* say('Crash! Memory is wiped. The data files never got the update.');
  yield* all(
    pop(power, 0.3),
    shake(ram, 10, 6),
    ram.stroke(colors.red, 0.3),
    ram.shadowColor(colors.red, 0.3),
  );
  yield* all(
    pgA.opacity(0, 0.4),
    pgB.opacity(0, 0.4),
    dirtyTag.opacity(0, 0.3),
    lost.opacity(1, 0.4),
    pop(stale, 0.3),
  );
  yield* waitFor(2.2);

  yield* say('On restart the database replays the log and re-applies every committed change.');
  yield* all(power.opacity(0, 0.3), pop(restart, 0.35));
  yield* lightStep(3);
  const rp = packet('REPLAY', colors.lime);
  const rl = (
    <Line
      points={[
        [200, -54],
        [200, 14],
      ]}
      stroke={colors.lime}
      lineWidth={4}
      lineDash={[8, 8]}
      endArrow
      arrowSize={12}
      opacity={0}
    />
  ) as Line;
  root().add([rp, rl]);
  yield* rl.opacity(1, 0.3);
  yield* fly(rp, rl, 1.0);
  (dA.children()[0] as Txt).text('alice = 700');
  (dB.children()[0] as Txt).text('bob = 800');
  yield* all(
    dA.stroke(colors.lime, 0.3),
    dB.stroke(colors.lime, 0.3),
    stale.opacity(0, 0.2),
    data.stroke(colors.lime, 0.3),
  );
  yield* pop(recovered, 0.3);
  yield* waitFor(3);
  yield* say('That is durability: the log survives, so a committed transaction is never lost.', 2.6);
  yield* leave(root());
}
