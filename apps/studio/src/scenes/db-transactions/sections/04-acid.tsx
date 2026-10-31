import {Circle, Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {chip, colors, fonts, leave, pop, say, shake, boxStyle, radius} from '@motion-studio/video-kit';

// ================================================================ 03 ACID
export function* acidSection(view: View2D): ThreadGenerator {
  const root = createRef<Node>();
  interface Spec {
    letter: string;
    name: string;
    desc: string;
    color: string;
    cap: string;
    micro: (screen: Rect) => ThreadGenerator;
  }
  const tx = (text: string, x: number, y: number, o: {fs?: number; fill?: string; w?: number} = {}) =>
    (
      <Txt
        text={text}
        x={x}
        y={y}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={o.fs ?? 18}
        fill={o.fill ?? colors.ink}
      />
    ) as Txt;
  const box = (text: string, x: number, y: number, w: number, fill: string, fs = 17) =>
    (
      <Rect x={x} y={y} width={w} height={60} radius={radius(12)} fill={fill} {...boxStyle(colors.ink, 4, 3)}>
        <Txt text={text} fontFamily={fonts.mono} fontWeight={700} fontSize={fs} fill={colors.onAccent} />
      </Rect>
    ) as Rect;

  const specs: Spec[] = [
    {
      letter: 'A',
      name: 'ATOMICITY',
      desc: 'All steps succeed, or none of them do.',
      color: colors.lime,
      cap: 'Atomicity: a failure anywhere undoes everything. No half-finished work.',
      micro: function* (s) {
        const b1 = box('UPDATE 1', -85, -20, 140, colors.surf2);
        const b2 = box('UPDATE 2', 85, -20, 140, colors.surf2);
        (b1.children()[0] as Txt).fill(colors.ink);
        (b2.children()[0] as Txt).fill(colors.ink);
        const st = tx('PENDING', 0, 70, {fill: colors.mute});
        s.add([b1, b2, st]);
        yield* waitFor(0.6);
        yield* all(b1.fill(colors.lime, 0.3), (b1.children()[0] as Txt).fill(colors.onAccent, 0.3));
        st.text('UPDATE 1 OK');
        yield* waitFor(0.7);
        yield* all(b2.fill(colors.red, 0.3), (b2.children()[0] as Txt).fill(colors.onAccent, 0.3));
        st.text('UPDATE 2 FAILED');
        st.fill(colors.red);
        yield* shake(b2, 6, 4);
        yield* waitFor(0.5);
        yield* all(b1.fill(colors.surf2, 0.4), (b1.children()[0] as Txt).fill(colors.ink, 0.4));
        st.text('ROLLBACK: NOTHING APPLIED');
        st.fill(colors.pink);
        yield* waitFor(1.4);
      },
    },
    {
      letter: 'C',
      name: 'CONSISTENCY',
      desc: 'Every commit leaves the data valid. Rules always hold.',
      color: colors.cyan,
      cap: 'Consistency: constraints are enforced. A change that breaks a rule is rejected.',
      micro: function* (s) {
        const rule = chip('CHECK bal >= 0', colors.cyan, {
          y: -70,
          fs: 18,
          sh: 4,
        });
        const q = tx('withdraw ₹800 from ₹500', 0, -10, {
          fill: colors.mute,
        });
        const r = tx('→ balance −₹300', 0, 30, {fill: colors.red, fs: 20});
        r.opacity(0);
        const stamp = chip('REJECTED', colors.red, {
          fs: 26,
          rot: -4,
          y: 80,
          sh: 5,
          color: colors.ink,
        });
        stamp.opacity(0);
        s.add([rule, q, r, stamp]);
        yield* waitFor(0.9);
        yield* r.opacity(1, 0.3);
        yield* waitFor(0.6);
        yield* all(pop(stamp, 0.3), shake(rule, 6, 4));
        yield* waitFor(1.6);
      },
    },
    {
      letter: 'I',
      name: 'ISOLATION',
      desc: 'Concurrent transactions can’t see half-done work.',
      color: colors.pink,
      cap: 'Isolation: two transactions running together behave as if they were separate.',
      micro: function* (s) {
        const t1 = box('T1', -115, -30, 90, colors.pink, 24);
        const t2 = box('T2', 115, -30, 90, colors.cyan, 24);
        const wall = (
          <Rect
            width={14}
            height={120}
            y={-30}
            radius={radius(5)}
            fill={colors.lime}
            stroke={colors.ink}
            lineWidth={3}
          />
        ) as Rect;
        const w1 = tx('writing…', -115, 20, {fill: colors.mute});
        const arrow = (
          <Line
            points={[
              [60, -30],
              [18, -30],
            ]}
            stroke={colors.cyan}
            lineWidth={5}
            endArrow
            arrowSize={12}
            end={0}
          />
        ) as Line;
        const st = tx('', 0, 78, {fill: colors.mute});
        s.add([t1, t2, wall, w1, arrow, st]);
        yield* waitFor(0.7);
        yield* arrow.end(1, 0.5);
        yield* all(shake(wall, 4, 4), arrow.start(1, 0.4));
        st.text('T2 cannot peek at T1');
        yield* waitFor(1.8);
      },
    },
    {
      letter: 'D',
      name: 'DURABILITY',
      desc: 'Once committed, it survives crashes and power loss.',
      color: colors.yellow,
      cap: 'Durability: after COMMIT returns, the data is safe on disk, even if the server dies.',
      micro: function* (s) {
        const body = (
          <Rect y={-6} width={110} height={84} fill={colors.violet} stroke={colors.ink} lineWidth={4} />
        ) as Rect;
        const bot = (
          <Circle y={36} size={[110, 34]} fill={colors.violet} stroke={colors.ink} lineWidth={4} />
        ) as Circle;
        const top = (
          <Circle y={-48} size={[110, 34]} fill={colors.violet} stroke={colors.ink} lineWidth={4} />
        ) as Circle;
        const ok = (
          <Circle x={48} y={-56} size={38} fill={colors.lime} stroke={colors.ink} lineWidth={3.5}>
            <Txt text="✓" fontFamily={fonts.sans} fontWeight={700} fontSize={24} fill={colors.onAccent} />
          </Circle>
        ) as Circle;
        ok.opacity(0);
        const cut = chip('POWER CUT', colors.red, {
          x: -34,
          y: -92,
          fs: 15,
          sh: 3,
          color: colors.ink,
        });
        cut.opacity(0);
        const st = tx('', 0, 86, {fill: colors.mute});
        const disk = (<Node>{[bot, body, top, ok]}</Node>) as Node;
        s.add([disk, cut, st]);
        yield* waitFor(0.5);
        yield* pop(ok, 0.3);
        st.text('COMMITTED TO DISK');
        yield* waitFor(0.8);
        yield* all(pop(cut, 0.25), shake(disk, 5, 5));
        st.text('DATA IS STILL THERE');
        st.fill(colors.lime);
        yield* waitFor(1.6);
      },
    },
  ];

  const CW = 410;
  const xs = [-657, -219, 219, 657];
  const screens: Rect[] = [];
  const cards = specs.map((sp, i) => {
    const screen = (
      <Rect y={170} width={350} height={220} radius={radius(16)} fill={colors.code} stroke={colors.dim} lineWidth={3} />
    ) as Rect;
    screens.push(screen);
    return (
      <Rect
        x={xs[i]}
        y={-10}
        width={CW}
        height={640}
        radius={radius(26)}
        fill={colors.surf}
        {...boxStyle(sp.color, 10, 4)}
      >
        <Rect y={-215} width={150} height={150} radius={radius(26)} fill={sp.color} stroke={colors.ink} lineWidth={4}>
          <Txt text={sp.letter} fontFamily={fonts.sans} fontWeight={700} fontSize={120} fill={colors.onAccent} />
        </Rect>
        <Txt
          y={-100}
          text={sp.name}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={38}
          letterSpacing={2}
          fill={colors.ink}
        />
        <Txt
          y={-35}
          width={350}
          textWrap
          textAlign="center"
          text={sp.desc}
          fontFamily={fonts.sans}
          fontWeight={500}
          fontSize={24}
          fill={colors.mute}
        />
        {screen}
      </Rect>
    ) as Rect;
  });
  cards.forEach(c => c.opacity(0));
  view.add(<Node ref={root}>{cards}</Node>);

  yield* say('ACID: four guarantees that make a database transaction trustworthy.');
  yield* sequence(0.2, ...cards.map(c => pop(c, 0.4)));
  yield* waitFor(1);
  for (let i = 0; i < specs.length; i++) {
    yield* say(specs[i].cap);
    yield* all(
      ...cards.map((c, j) =>
        j === i ? c.scale(1.04, 0.3, easeOutCubic) : all(c.scale(0.97, 0.3), c.opacity(0.4, 0.3)),
      ),
    );
    yield* specs[i].micro(screens[i]);
    yield* all(...cards.map(c => all(c.scale(1, 0.3), c.opacity(1, 0.3))));
    yield* waitFor(0.3);
  }
  yield* say('Atomicity and Durability are about crashes. Isolation is about concurrency.', 3);
  yield* leave(root());
}
