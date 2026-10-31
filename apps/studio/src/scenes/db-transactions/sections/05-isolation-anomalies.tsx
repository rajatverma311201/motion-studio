import {Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, waitFor} from '@motion-canvas/core';
import {chip, colors, fonts, leave, neubrutal, pop, say, shake, timelineLane} from '@motion-studio/video-kit';

// ================================================================ 04 ISOLATION ANOMALIES
interface Ev {
  lane: 1 | 2;
  a: string;
  b: string;
  result?: string;
  bad?: boolean;
  db: string;
  dbNote: string;
  dbColor: string;
  cap: string;
}
interface Anom {
  name: string;
  color: string;
  start: string;
  evs: Ev[];
  verdict: string;
}
const ANOMS: Anom[] = [
  {
    name: 'DIRTY READ',
    color: colors.pink,
    start: '₹1,000',
    verdict: 'DIRTY READ · T2 used a value that never existed',
    evs: [
      {
        lane: 1,
        a: 'UPDATE bal = 700',
        b: 'not committed yet',
        db: '₹700',
        dbNote: 'uncommitted',
        dbColor: colors.orange,
        cap: 'T1 sets the balance to 700 but has not committed yet.',
      },
      {
        lane: 2,
        a: 'SELECT bal',
        b: 'reads in-flight data',
        result: '→ ₹700',
        bad: true,
        db: '₹700',
        dbNote: 'uncommitted',
        dbColor: colors.orange,
        cap: 'T2 reads 700: an uncommitted value.',
      },
      {
        lane: 1,
        a: 'ROLLBACK',
        b: 'undo the update',
        db: '₹1,000',
        dbNote: 'restored',
        dbColor: colors.lime,
        cap: 'T1 rolls back. 700 never existed, yet T2 already acted on it.',
      },
    ],
  },
  {
    name: 'NON-REPEATABLE READ',
    color: colors.cyan,
    start: '₹1,000',
    verdict: 'NON-REPEATABLE READ · same row, different value',
    evs: [
      {
        lane: 1,
        a: 'SELECT bal',
        b: 'first read',
        result: '→ ₹1,000',
        db: '₹1,000',
        dbNote: 'committed',
        dbColor: colors.lime,
        cap: 'T1 reads the balance: 1000.',
      },
      {
        lane: 2,
        a: 'UPDATE bal = 700',
        b: 'then COMMIT',
        db: '₹700',
        dbNote: 'committed',
        dbColor: colors.lime,
        cap: 'T2 updates it to 700 and commits.',
      },
      {
        lane: 1,
        a: 'SELECT bal',
        b: 'same query, same tx',
        result: '→ ₹700',
        bad: true,
        db: '₹700',
        dbNote: 'committed',
        dbColor: colors.lime,
        cap: 'T1 reads again inside the same transaction and gets a different answer.',
      },
    ],
  },
  {
    name: 'PHANTOM READ',
    color: colors.yellow,
    start: '2 rows',
    verdict: 'PHANTOM READ · new rows appear mid-transaction',
    evs: [
      {
        lane: 1,
        a: 'SELECT … WHERE bal > 500',
        b: 'count matching rows',
        result: '→ 2 rows',
        db: '2 rows',
        dbNote: 'match',
        dbColor: colors.lime,
        cap: 'T1 lists accounts with a balance over 500: 2 rows.',
      },
      {
        lane: 2,
        a: 'INSERT account (900)',
        b: 'then COMMIT',
        db: '3 rows',
        dbNote: 'match',
        dbColor: colors.lime,
        cap: 'T2 inserts a new matching account and commits.',
      },
      {
        lane: 1,
        a: 'SELECT … WHERE bal > 500',
        b: 'same query, same tx',
        result: '→ 3 rows',
        bad: true,
        db: '3 rows',
        dbNote: 'match',
        dbColor: colors.lime,
        cap: 'T1 repeats the query: a phantom row has appeared.',
      },
    ],
  },
];

export function* isolationAnomaliesSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  const SX = [-300, 120, 540];
  const LY: Record<number, number> = {1: -200, 2: -50};
  const DBY = 120;

  // tabs
  const tabs = ANOMS.map(
    (a, i) =>
      (
        <Rect
          x={(i - 1) * 460}
          y={-380}
          width={440}
          height={60}
          radius={16}
          fill={colors.surf}
          stroke={colors.dim}
          lineWidth={3}
          shadowColor="rgba(244,241,234,0)"
          shadowBlur={0}
          shadowOffset={[6, 6]}
        >
          <Txt
            text={a.name}
            fontFamily={fonts.mono}
            fontWeight={700}
            fontSize={24}
            letterSpacing={1}
            fill={colors.mute}
          />
        </Rect>
      ) as Rect,
  );
  // lanes
  const lanes = [1, 2].map(l => timelineLane({y: LY[l], label: `T${l}`, color: l === 1 ? colors.pink : colors.cyan}));
  const dbLabel = (
    <Rect x={-800} y={DBY} width={100} height={64} radius={14} fill={colors.surf2} {...neubrutal(colors.ink, 5, 3.5)}>
      <Txt text="DB" fontFamily={fonts.sans} fontWeight={700} fontSize={34} fill={colors.ink} />
    </Rect>
  ) as Rect;
  const timeLbl = (
    <Txt
      x={800}
      y={-300}
      text="TIME →"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={22}
      letterSpacing={3}
      fill={colors.mute}
    />
  ) as Txt;
  const stage = createRef<Node>();
  view.add(
    <Node ref={root} opacity={0}>
      {tabs}
      {lanes}
      {dbLabel}
      {timeLbl}
      <Node ref={stage} />
    </Node>,
  );
  yield* root().opacity(1, 0.35);

  for (let k = 0; k < ANOMS.length; k++) {
    const an = ANOMS[k];
    // highlight tab
    yield* all(
      ...tabs.map((t, i) =>
        i === k
          ? all(
              t.fill(an.color, 0.3),
              t.shadowColor(colors.ink, 0.3),
              t.stroke(colors.ink, 0.3),
              (t.children()[0] as Txt).fill(colors.dark, 0.3),
            )
          : all(
              t.fill(colors.surf, 0.3),
              t.shadowColor('rgba(244,241,234,0)', 0.3),
              t.stroke(colors.dim, 0.3),
              (t.children()[0] as Txt).fill(colors.mute, 0.3),
            ),
      ),
    );
    // start chip
    const start = chip(`START ${an.start}`, colors.surf2, {
      x: -640,
      y: DBY,
      fs: 20,
      sh: 0,
      color: colors.ink,
    }) as Rect;
    start.opacity(0);
    stage().add(start);
    yield* say(`${an.name}: two transactions, T1 and T2, touch the same data at the same time.`);
    yield* start.opacity(1, 0.3);
    yield* waitFor(0.8);

    const made: Node[] = [start];
    for (let e = 0; e < an.evs.length; e++) {
      const ev = an.evs[e];
      const col = ev.lane === 1 ? colors.pink : colors.cyan;
      const card = (
        <Rect
          x={SX[e]}
          y={LY[ev.lane]}
          width={400}
          height={104}
          radius={16}
          fill={colors.surf}
          {...neubrutal(col, 7, 4)}
        >
          <Txt y={-18} text={ev.a} fontFamily={fonts.mono} fontWeight={700} fontSize={22} fill={colors.ink} />
          <Txt y={20} text={ev.b} fontFamily={fonts.mono} fontSize={18} fill={colors.mute} />
        </Rect>
      ) as Rect;
      card.opacity(0);
      const dbBox = (
        <Rect
          x={SX[e]}
          y={DBY}
          width={330}
          height={90}
          radius={16}
          fill={colors.surf2}
          stroke={ev.dbColor}
          lineWidth={4}
        >
          <Txt y={-14} text={ev.db} fontFamily={fonts.mono} fontWeight={700} fontSize={36} fill={ev.dbColor} />
          <Txt y={24} text={ev.dbNote} fontFamily={fonts.mono} fontSize={18} fill={colors.mute} />
        </Rect>
      ) as Rect;
      dbBox.opacity(0);
      const kids: Node[] = [card, dbBox];
      let res: Rect | undefined;
      if (ev.result) {
        res = chip(ev.result, ev.bad ? colors.red : colors.lime, {
          x: SX[e] + 110,
          y: LY[ev.lane] + (ev.lane === 1 ? -66 : 66),
          fs: 22,
          sh: 4,
          color: colors.dark,
        }) as Rect;
        res.opacity(0);
        kids.push(res);
      }
      stage().add(kids);
      made.push(...kids);
      yield* say(ev.cap);
      yield* pop(card, 0.35);
      if (res) yield* pop(res, 0.3);
      yield* dbBox.opacity(1, 0.3);
      yield* waitFor(2.2);
    }

    const verdict = chip(an.verdict, colors.red, {
      y: 290,
      fs: 32,
      rot: -1,
      sh: 9,
      color: colors.ink,
      mono: false,
    }) as Rect;
    verdict.opacity(0);
    stage().add(verdict);
    made.push(verdict);
    yield* say('This is what isolation levels exist to prevent.');
    yield* pop(verdict, 0.4);
    yield* shake(verdict, 6, 4);
    yield* waitFor(2.6);
    yield* stage().opacity(0, 0.35);
    made.forEach(n => n.remove());
    stage().opacity(1);
  }
  yield* leave(root());
}
