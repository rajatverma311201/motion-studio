import {
    Circle,
    Line,
    Node,
    Rect,
    Txt,
    View2D,
    makeScene2D,
} from "@motion-canvas/2d";
import {
    ThreadGenerator,
    all,
    createRef,
    delay,
    easeInCubic,
    easeInOutCubic,
    easeOutBack,
    easeOutCubic,
    map,
    sequence,
    tween,
    waitFor,
} from "@motion-canvas/core";

/**
 * DATABASE TRANSACTIONS: dark neubrutalism, modern edition
 * --------------------------------------------------------
 * No voiceover: every beat has an on-screen caption at the bottom.
 *
 *   00 Intro            title + the four ACID letters
 *   01 The problem      transfer without a transaction, crash, money vanishes
 *   02 BEGIN/COMMIT     the same transfer wrapped in a transaction, then a rollback
 *   03 ACID             four cards, each with a micro animation
 *   04 Anomalies        dirty read, non-repeatable read, phantom read (two lanes)
 *   05 Isolation levels the SQL-standard table
 *   06 Durability       write-ahead log, crash, replay
 *   07 In code          Quarkus @Transactional, rollback rules
 *   08 Recap
 *
 * Every section builds and removes its own nodes, so you can start anywhere:
 *   http://localhost:9000/motion/projects/db-transactions#s=4
 *   (s = section number above; ~4 minutes in total, the editor shows the exact length)
 */

// Fonts (loaded from Google Fonts when online; falls back to Inter / Menlo).
try {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
        "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap";
    document.head.appendChild(l);
} catch {
    /* offline or no DOM: system fonts */
}

// ---------------------------------------------------------------- theme
const C = {
    bg: "#0B0B10",
    grid: "rgba(255,255,255,0.045)",
    surf: "#15151D",
    surf2: "#1F1F2B",
    code: "#0F0F16",
    ink: "#F4F1EA", // borders + primary text
    dark: "#0B0B10", // text on bright fills
    lime: "#C6FF3D",
    pink: "#FF4D8D",
    cyan: "#3DE3FF",
    yellow: "#FFD23D",
    violet: "#9B7BFF",
    orange: "#FF8A3D",
    red: "#FF4D4D",
    mute: "#9A99A8",
    dim: "#3A3950",
    redBg: "#3A1521",
    limeBg: "#18301C",
};
const FONT = '"Space Grotesk", Inter, "Segoe UI", sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';

/** light border + hard coloured offset shadow: neubrutalism on a dark canvas */
const NB = (shadow: string, sh = 8, bw = 4) => ({
    stroke: C.ink,
    lineWidth: bw,
    shadowColor: shadow,
    shadowBlur: 0,
    shadowOffset: [sh, sh] as [number, number],
});

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

// ---------------------------------------------------------------- small helpers
function chip(
    text: string,
    fill: string,
    o: {
        fs?: number;
        mono?: boolean;
        rot?: number;
        x?: number;
        y?: number;
        sh?: number;
        color?: string;
        shadow?: string;
    } = {},
): Rect {
    return (
        <Rect
            layout
            alignItems="center"
            padding={[6, 16]}
            radius={10}
            fill={fill}
            rotation={o.rot ?? 0}
            x={o.x ?? 0}
            y={o.y ?? 0}
            {...NB(o.shadow ?? C.ink, o.sh ?? 5, 3.5)}
        >
            <Txt
                text={text}
                fill={o.color ?? C.dark}
                fontSize={o.fs ?? 22}
                fontWeight={700}
                fontFamily={o.mono === false ? FONT : MONO}
                letterSpacing={1}
            />
        </Rect>
    ) as Rect;
}
const chipText = (c: Rect) => c.children()[0] as Txt;

function* pop(n: Node, dur = 0.3): ThreadGenerator {
    n.scale(0.3);
    n.opacity(0);
    yield* all(n.scale(1, dur, easeOutBack), n.opacity(1, dur * 0.5));
}

function* shake(n: Node, amp = 14, count = 6): ThreadGenerator {
    const x0 = n.x();
    const y0 = n.y();
    let a = amp;
    for (let i = 0; i < count; i++) {
        yield* n.position(
            [x0 + (i % 2 ? a : -a), y0 + (i % 3 ? -a / 2 : a / 2)],
            0.04,
        );
        a *= 0.8;
    }
    yield* n.position([x0, y0], 0.04);
}

function* countTo(
    t: Txt,
    from: number,
    to: number,
    dur: number,
): ThreadGenerator {
    yield* tween(dur, (v) => t.text(fmt(map(from, to, easeInOutCubic(v)))));
}

/** hard-shadow stacked headline text */
function bigText(text: string, fs: number, y: number, ls = -2, off = 9): Node {
    const t = (fill: string, d: number) =>
        (
            <Txt
                text={text}
                fontSize={fs}
                fontWeight={700}
                fontFamily={FONT}
                fill={fill}
                x={d}
                y={d}
                letterSpacing={ls}
            />
        ) as Txt;
    return (
        <Node y={y}>
            {t(C.pink, off * 2)}
            {t(C.cyan, off)}
            {t(C.ink, 0)}
        </Node>
    ) as Node;
}

// ---------------------------------------------------------------- code panel (syntax coloured)
type Lang = "sql" | "java";
const SQL_RULES: [RegExp, string][] = [
    [/^\s+/, C.ink],
    [/^--.*/, C.mute],
    [/^'[^']*'/, C.lime],
    [/^\d+/, C.yellow],
    [
        /^(BEGIN|COMMIT|ROLLBACK|UPDATE|SET|WHERE|SELECT|FROM|INSERT|INTO|VALUES|AND|COUNT)\b/,
        C.pink,
    ],
    [/^\w+/, C.ink],
    [/^[\s\S]/, C.mute],
];
const JAVA_RULES: [RegExp, string][] = [
    [/^\s+/, C.ink],
    [/^\/\/.*/, C.mute],
    [/^@\w+/, C.cyan],
    [/^\d+/, C.yellow],
    [/^(import|public|class|void|new|return|throws|long)\b/, C.pink],
    [/^[A-Z]\w*/, C.violet],
    [/^\w+/, C.ink],
    [/^[\s\S]/, C.mute],
];
function tokenize(line: string, lang: Lang): [string, string][] {
    const rules = lang === "sql" ? SQL_RULES : JAVA_RULES;
    const out: [string, string][] = [];
    let rest = line;
    while (rest.length) {
        for (const [re, col] of rules) {
            const m = re.exec(rest);
            if (m) {
                out.push([m[0], col]);
                rest = rest.slice(m[0].length);
                break;
            }
        }
    }
    return out;
}

const LH = 38;
const CODE_FS = 24;
interface CodeP {
    node: Rect;
    hl: Rect;
    lines: Node[];
    lineY: (i: number) => number;
}
function codePanel(o: {
    x: number;
    y: number;
    w: number;
    title: string;
    code: string[];
    lang: Lang;
    accent: string;
    fs?: number;
}): CodeP {
    const h = 64 + o.code.length * LH + 36;
    const lineY = (i: number) => -h / 2 + 64 + 18 + i * LH + LH / 2;
    const hl = (
        <Rect
            width={o.w - 24}
            height={LH}
            radius={8}
            fill="rgba(255,255,255,0.09)"
            opacity={0}
            y={lineY(0)}
        >
            <Rect
                x={-(o.w - 24) / 2 + 3}
                width={6}
                height={LH - 8}
                radius={3}
                fill={o.accent}
            />
        </Rect>
    ) as Rect;
    // Each token is its own Txt placed on a fixed monospace grid (0.6 em per glyph),
    // which keeps syntax colours aligned without relying on inline text layout.
    const fs = o.fs ?? CODE_FS;
    const cw = fs * 0.6;
    const lines = o.code.map((ln, i) => {
        let col = 0;
        const toks: Txt[] = [];
        for (const [t, c] of tokenize(ln, o.lang)) {
            if (t.trim().length > 0) {
                toks.push(
                    (
                        <Txt
                            x={col * cw}
                            offsetX={-1}
                            text={t}
                            fontFamily={MONO}
                            fontSize={fs}
                            fontWeight={400}
                            fill={c}
                        />
                    ) as Txt,
                );
            }
            col += t.length;
        }
        return (
            <Node x={-o.w / 2 + 32} y={lineY(i)} opacity={0}>
                {toks}
            </Node>
        ) as Node;
    });
    const node = (
        <Rect
            x={o.x}
            y={o.y}
            width={o.w}
            height={h}
            radius={20}
            fill={C.code}
            {...NB(o.accent, 10, 4)}
        >
            <Rect
                y={-h / 2 + 32}
                width={o.w}
                height={64}
                fill={C.surf2}
                radius={[20, 20, 0, 0]}
            />
            <Line
                points={[
                    [-o.w / 2, -h / 2 + 64],
                    [o.w / 2, -h / 2 + 64],
                ]}
                stroke={C.ink}
                lineWidth={4}
            />
            <Circle x={-o.w / 2 + 38} y={-h / 2 + 32} size={18} fill={C.red} />
            <Circle
                x={-o.w / 2 + 70}
                y={-h / 2 + 32}
                size={18}
                fill={C.yellow}
            />
            <Circle
                x={-o.w / 2 + 102}
                y={-h / 2 + 32}
                size={18}
                fill={C.lime}
            />
            <Txt
                x={o.w / 2 - 28}
                y={-h / 2 + 32}
                offsetX={1}
                text={o.title}
                fontFamily={MONO}
                fontSize={20}
                fill={C.mute}
            />
            {hl}
            {lines}
        </Rect>
    ) as Rect;
    return { node, hl, lines, lineY };
}
function* focusLine(p: CodeP, i: number, color?: string): ThreadGenerator {
    const bar = p.hl.children()[0] as Rect;
    if (color) yield* bar.fill(color, 0.12);
    if (p.hl.opacity() < 0.5) {
        p.hl.y(p.lineY(i));
        yield* p.hl.opacity(1, 0.15);
    } else {
        yield* p.hl.y(p.lineY(i), 0.25, easeInOutCubic);
    }
}
const revealLines = (
    p: CodeP,
    from = 0,
    to = p.lines.length - 1,
): ThreadGenerator =>
    sequence(
        0.12,
        ...p.lines.slice(from, to + 1).map((l) => l.opacity(1, 0.25)),
    );

// ---------------------------------------------------------------- HUD (grid, top bar, caption)
const SECTIONS: {
    name: string;
    color: string;
    run: (v: View2D) => ThreadGenerator;
}[] = [
    { name: "INTRO", color: C.lime, run: intro },
    { name: "THE PROBLEM", color: C.red, run: problem },
    { name: "BEGIN · COMMIT · ROLLBACK", color: C.lime, run: txFix },
    { name: "ACID", color: C.cyan, run: acid },
    { name: "ISOLATION ANOMALIES", color: C.pink, run: anomalies },
    { name: "ISOLATION LEVELS", color: C.yellow, run: levels },
    { name: "DURABILITY · WAL", color: C.violet, run: durability },
    { name: "IN CODE", color: C.orange, run: inCode },
    { name: "RECAP", color: C.lime, run: recap },
];
const hud = {
    cap: createRef<Txt>(),
    secTxt: createRef<Txt>(),
    secChip: createRef<Rect>(),
    pills: [] as Rect[],
};

function buildHud(view: View2D) {
    const grid: Line[] = [];
    for (let x = -960; x <= 960; x += 60)
        grid.push(
            (
                <Line
                    points={[
                        [x, -540],
                        [x, 540],
                    ]}
                    stroke={C.grid}
                    lineWidth={2}
                />
            ) as Line,
        );
    for (let y = -540; y <= 540; y += 60)
        grid.push(
            (
                <Line
                    points={[
                        [-960, y],
                        [960, y],
                    ]}
                    stroke={C.grid}
                    lineWidth={2}
                />
            ) as Line,
        );
    view.add(<Node zIndex={-10}>{grid}</Node>);

    hud.pills = SECTIONS.map(
        (_, i) =>
            (
                <Rect
                    x={486 + 18 + i * 46}
                    y={-492}
                    width={36}
                    height={14}
                    radius={7}
                    fill={C.dim}
                />
            ) as Rect,
    );
    view.add(
        <Node zIndex={50}>
            <Rect
                x={-910}
                y={-492}
                width={30}
                height={30}
                radius={8}
                fill={C.lime}
                stroke={C.ink}
                lineWidth={3.5}
                offsetX={-1}
            />
            <Txt
                x={-866}
                y={-492}
                offsetX={-1}
                text="DB TRANSACTIONS"
                fontFamily={MONO}
                fontWeight={700}
                fontSize={22}
                letterSpacing={3}
                fill={C.ink}
            />
            <Rect
                ref={hud.secChip}
                x={-470}
                y={-492}
                offsetX={-1}
                layout
                alignItems="center"
                padding={[4, 16]}
                radius={999}
                fill={C.lime}
            >
                <Txt
                    ref={hud.secTxt}
                    text=""
                    fontFamily={MONO}
                    fontWeight={700}
                    fontSize={20}
                    letterSpacing={2}
                    fill={C.dark}
                />
            </Rect>
            {hud.pills}
            <Rect
                y={462}
                width={1740}
                height={78}
                radius={20}
                fill={C.surf}
                {...NB(C.lime, 7, 4)}
            />
            <Rect
                x={-800}
                y={462}
                width={92}
                height={40}
                radius={10}
                fill={C.lime}
            >
                <Txt
                    text="NOTE"
                    fontFamily={MONO}
                    fontWeight={700}
                    fontSize={20}
                    letterSpacing={2}
                    fill={C.dark}
                />
            </Rect>
            <Txt
                ref={hud.cap}
                x={-736}
                y={462}
                offsetX={-1}
                text=""
                fontFamily={FONT}
                fontWeight={500}
                fontSize={31}
                fill={C.ink}
            />
        </Node>,
    );
}

function* setSection(i: number): ThreadGenerator {
    const s = SECTIONS[i];
    hud.secTxt().text(`${String(i).padStart(2, "0")} · ${s.name}`);
    yield* all(
        hud.secChip().fill(s.color, 0.25),
        ...hud.pills.map((p, j) =>
            all(
                p.fill(
                    j < i
                        ? "rgba(244,241,234,0.55)"
                        : j === i
                          ? s.color
                          : C.dim,
                    0.3,
                ),
                p.width(j === i ? 64 : 36, 0.3, easeOutCubic),
            ),
        ),
    );
}

function* say(text: string, hold = 0): ThreadGenerator {
    yield* hud.cap().opacity(0, 0.12);
    hud.cap().text(text);
    yield* hud.cap().opacity(1, 0.22);
    if (hold > 0) yield* waitFor(hold);
}

function* leave(root: Node): ThreadGenerator {
    yield* root.opacity(0, 0.4);
    root.remove();
}

// ---------------------------------------------------------------- account cards (sections 1 + 2)
interface Acct {
    node: Rect;
    bal: Txt;
    tag: Rect;
    value: number;
}
function account(
    name: string,
    letter: string,
    color: string,
    x: number,
    y: number,
    value: number,
): Acct {
    const bal = createRef<Txt>();
    const tag = createRef<Rect>();
    const node = (
        <Rect
            x={x}
            y={y}
            width={500}
            height={190}
            radius={22}
            fill={C.surf}
            {...NB(color, 9, 4)}
        >
            <Rect
                x={-170}
                width={100}
                height={100}
                radius={20}
                fill={color}
                stroke={C.ink}
                lineWidth={4}
            >
                <Txt
                    text={letter}
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={66}
                    fill={C.dark}
                />
            </Rect>
            <Txt
                x={-100}
                y={-52}
                offsetX={-1}
                text={name}
                fontFamily={MONO}
                fontWeight={700}
                fontSize={20}
                letterSpacing={3}
                fill={C.mute}
            />
            <Txt
                ref={bal}
                x={-100}
                y={12}
                offsetX={-1}
                text={fmt(value)}
                fontFamily={MONO}
                fontWeight={700}
                fontSize={66}
                fill={C.ink}
            />
            <Rect
                ref={tag}
                x={158}
                y={-60}
                layout
                alignItems="center"
                padding={[3, 10]}
                radius={8}
                fill={C.yellow}
                opacity={0}
            >
                <Txt
                    text="UNCOMMITTED"
                    fontFamily={MONO}
                    fontWeight={700}
                    fontSize={14}
                    letterSpacing={1}
                    fill={C.dark}
                />
            </Rect>
        </Rect>
    ) as Rect;
    return { node, bal: bal(), tag: tag(), value };
}
function* setTag(a: Acct, text: string, fill: string): ThreadGenerator {
    (a.tag.children()[0] as Txt).text(text);
    a.tag.fill(fill);
    if (a.tag.opacity() < 0.5) yield* a.tag.opacity(1, 0.2);
}
function* moveBal(
    a: Acct,
    to: number,
    dur = 0.7,
    color: string = C.ink,
): ThreadGenerator {
    yield* all(countTo(a.bal, a.value, to, dur), a.bal.fill(color, dur));
    a.value = to;
}
function totalChip(x: number, y: number): Rect {
    return chip("TOTAL IN BANK  ₹1,500", C.cyan, {
        x,
        y,
        fs: 26,
        sh: 7,
        shadow: C.ink,
    }) as Rect;
}
const coin = () => chip("₹300", C.yellow, { fs: 24, sh: 4 }) as Rect;

// ================================================================ 00 INTRO
function* intro(view: View2D): ThreadGenerator {
    const root = createRef<Node>();
    const l1 = bigText("DB", 240, -200);
    const l2 = bigText("TRANSACTIONS", 168, 10);
    const sub = chip("ALL OR NOTHING.", C.yellow, {
        fs: 40,
        rot: -2,
        y: 175,
        sh: 8,
        mono: false,
    }) as Rect;
    const cols = [C.lime, C.cyan, C.pink, C.yellow];
    const tiles = "ACID".split("").map(
        (ch, i) =>
            (
                <Rect
                    x={(i - 1.5) * 150}
                    y={330}
                    width={118}
                    height={118}
                    radius={22}
                    fill={cols[i]}
                    {...NB(C.ink, 7, 4)}
                >
                    <Txt
                        text={ch}
                        fontFamily={FONT}
                        fontWeight={700}
                        fontSize={84}
                        fill={C.dark}
                    />
                </Rect>
            ) as Rect,
    );
    l1.x(-1400);
    l2.x(1400);
    sub.opacity(0);
    tiles.forEach((t) => t.opacity(0));
    view.add(
        <Node ref={root} opacity={0}>
            {l1}
            {l2}
            {sub}
            {tiles}
        </Node>,
    );
    yield* root().opacity(1, 0.2);
    yield* say(
        "A transaction groups many steps into one unit. All of them happen, or none do.",
    );
    yield* all(
        l1.x(0, 0.8, easeOutCubic),
        delay(0.25, l2.x(0, 0.8, easeOutCubic)),
    );
    yield* pop(sub, 0.35);
    yield* sequence(0.18, ...tiles.map((t) => pop(t, 0.3)));
    yield* waitFor(2.6);
    yield* leave(root());
}

// ================================================================ 01 THE PROBLEM
function* problem(view: View2D): ThreadGenerator {
    const root = createRef<Node>();
    const alice = account("ALICE", "A", C.cyan, -560, -170, 1000);
    const bob = account("BOB", "B", C.pink, -560, 80, 500);
    const total = totalChip(-560, 270);
    const code = codePanel({
        x: 380,
        y: -150,
        w: 900,
        title: "transfer.sql",
        lang: "sql",
        accent: C.pink,
        code: [
            "-- transfer ₹300 from Alice to Bob",
            "UPDATE accounts SET bal = bal - 300 WHERE id = 'alice';",
            "UPDATE accounts SET bal = bal + 300 WHERE id = 'bob';",
        ],
    });
    const c = coin();
    c.position([-330, -170]);
    c.opacity(0);
    const crash = chip("SERVER CRASH", C.red, {
        fs: 46,
        rot: -3,
        x: 380,
        y: 70,
        sh: 10,
        color: C.ink,
        shadow: C.ink,
        mono: false,
    }) as Rect;
    const gone = chip("₹300 VANISHED", C.yellow, {
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

    yield* say(
        "Alice sends ₹300 to Bob. In SQL that is two separate UPDATE statements.",
    );
    yield* revealLines(code);
    yield* waitFor(1.2);

    yield* say("Step 1 runs: the money leaves Alice’s account.");
    yield* focusLine(code, 1, C.cyan);
    yield* all(
        moveBal(alice, 700, 0.8, C.yellow),
        pop(c, 0.3),
        c.position([-215, -45], 0.8, easeInOutCubic),
    );
    yield* waitFor(1.2);

    yield* say("The server dies before step 2 ever runs.");
    yield* focusLine(code, 2, C.red);
    yield* waitFor(0.5);
    yield* all(pop(crash, 0.3), shake(root(), 16, 8));
    yield* all(c.opacity(0.25, 0.5), c.position([-215, 20], 0.5, easeInCubic));
    yield* waitFor(1.4);

    yield* say("Bob never receives it. The books no longer add up.");
    chipText(total).text("TOTAL IN BANK  ₹1,200");
    yield* all(total.fill(C.red, 0.3), pop(gone, 0.35));
    yield* shake(total, 8, 4);
    yield* waitFor(3.2);
    yield* say("The database is now inconsistent. We need all-or-nothing.", 3);
    yield* leave(root());
}

// ================================================================ 02 BEGIN / COMMIT / ROLLBACK
function* txFix(view: View2D): ThreadGenerator {
    const root = createRef<Node>();
    const alice = account("ALICE", "A", C.cyan, -560, -170, 1000);
    const bob = account("BOB", "B", C.pink, -560, 80, 500);
    const total = totalChip(-560, 270);
    total.fill(C.cyan);
    const box = (
        <Rect
            x={-560}
            y={-45}
            width={580}
            height={500}
            radius={34}
            stroke={C.lime}
            lineWidth={4}
            lineDash={[16, 12]}
            opacity={0}
        />
    ) as Rect;
    const boxLabel = chip("TRANSACTION #4821 · ACTIVE", C.lime, {
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
        title: "transfer.sql",
        lang: "sql",
        accent: C.lime,
        code: [
            "BEGIN;",
            "UPDATE accounts SET bal = bal - 300 WHERE id = 'alice';",
            "UPDATE accounts SET bal = bal + 300 WHERE id = 'bob';",
            "COMMIT;",
            "ROLLBACK;  -- if anything fails",
        ],
    });
    const c = coin();
    c.position([-330, -170]);
    c.opacity(0);
    const commitStamp = chip("COMMITTED ✓", C.lime, {
        fs: 50,
        rot: -3,
        x: 390,
        y: 150,
        sh: 10,
        mono: false,
    }) as Rect;
    const crash = chip("SERVER CRASH", C.red, {
        fs: 40,
        rot: 3,
        x: 390,
        y: 150,
        sh: 10,
        color: C.ink,
        mono: false,
    }) as Rect;
    const rb = chip("ROLLED BACK ↺", C.pink, {
        fs: 50,
        rot: -3,
        x: 390,
        y: 250,
        sh: 10,
        mono: false,
    }) as Rect;
    [commitStamp, crash, rb].forEach((s) => s.opacity(0));
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
    yield* say(
        "Wrap both updates in BEGIN … COMMIT and they become one transaction.",
    );
    yield* revealLines(code);
    yield* waitFor(1);
    yield* focusLine(code, 0, C.lime);
    yield* all(box.opacity(1, 0.3), pop(boxLabel, 0.3));
    yield* waitFor(0.8);

    yield* say(
        "Changes inside a transaction stay pending. Nobody else treats them as final.",
    );
    yield* focusLine(code, 1, C.cyan);
    yield* all(
        moveBal(alice, 700, 0.7, C.yellow),
        pop(c, 0.3),
        c.position([-215, -45], 0.7, easeInOutCubic),
        setTag(alice, "UNCOMMITTED", C.yellow),
    );
    yield* focusLine(code, 2, C.pink);
    yield* all(
        c.position([-330, 80], 0.6, easeInOutCubic),
        moveBal(bob, 800, 0.7, C.yellow),
        setTag(bob, "UNCOMMITTED", C.yellow),
    );
    yield* c.opacity(0, 0.25);
    yield* waitFor(1);

    yield* say("COMMIT makes both changes permanent at the same instant.");
    yield* focusLine(code, 3, C.lime);
    yield* all(
        setTag(alice, "COMMITTED", C.lime),
        setTag(bob, "COMMITTED", C.lime),
        alice.bal.fill(C.ink, 0.3),
        bob.bal.fill(C.ink, 0.3),
        boxLabel.fill(C.lime, 0.2),
        pop(commitStamp, 0.35),
    );
    chipText(boxLabel).text("TRANSACTION #4821 · COMMITTED");
    yield* waitFor(3);

    // ---- failure path
    yield* say("Now replay it, and let the server crash halfway through.");
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
    chipText(boxLabel).text("TRANSACTION #4822 · ACTIVE");
    yield* waitFor(0.6);
    yield* focusLine(code, 0, C.lime);
    yield* all(box.opacity(1, 0.3), pop(boxLabel, 0.3));
    yield* focusLine(code, 1, C.cyan);
    c.position([-330, -170]);
    yield* all(
        moveBal(alice, 700, 0.7, C.yellow),
        pop(c, 0.3),
        c.position([-215, -45], 0.7, easeInOutCubic),
        setTag(alice, "UNCOMMITTED", C.yellow),
    );
    yield* waitFor(0.6);

    yield* say(
        "The crash hits before COMMIT. The database notices the unfinished transaction.",
    );
    yield* focusLine(code, 2, C.red);
    yield* all(pop(crash, 0.3), shake(root(), 16, 8));
    yield* waitFor(1.2);

    yield* say(
        "ROLLBACK: every pending change is undone. It is as if nothing happened.",
    );
    yield* focusLine(code, 4, C.pink);
    yield* all(
        moveBal(alice, 1000, 0.8, C.ink),
        c.position([-330, -170], 0.8, easeInOutCubic),
        box.stroke(C.pink, 0.3),
        boxLabel.fill(C.pink, 0.3),
        crash.opacity(0, 0.4),
    );
    chipText(boxLabel).text("TRANSACTION #4822 · ROLLED BACK");
    yield* all(c.opacity(0, 0.3), alice.tag.opacity(0, 0.3), pop(rb, 0.35));
    yield* waitFor(0.6);
    yield* total.fill(C.lime, 0.3);
    chipText(total).text("TOTAL IN BANK  ₹1,500  ✓");
    yield* waitFor(3.4);
    yield* leave(root());
}

// ================================================================ 03 ACID
function* acid(view: View2D): ThreadGenerator {
    const root = createRef<Node>();
    interface Spec {
        letter: string;
        name: string;
        desc: string;
        color: string;
        cap: string;
        micro: (screen: Rect) => ThreadGenerator;
    }
    const tx = (
        text: string,
        x: number,
        y: number,
        o: { fs?: number; fill?: string; w?: number } = {},
    ) =>
        (
            <Txt
                text={text}
                x={x}
                y={y}
                fontFamily={MONO}
                fontWeight={700}
                fontSize={o.fs ?? 18}
                fill={o.fill ?? C.ink}
            />
        ) as Txt;
    const box = (
        text: string,
        x: number,
        y: number,
        w: number,
        fill: string,
        fs = 17,
    ) =>
        (
            <Rect
                x={x}
                y={y}
                width={w}
                height={60}
                radius={12}
                fill={fill}
                {...NB(C.ink, 4, 3)}
            >
                <Txt
                    text={text}
                    fontFamily={MONO}
                    fontWeight={700}
                    fontSize={fs}
                    fill={C.dark}
                />
            </Rect>
        ) as Rect;

    const specs: Spec[] = [
        {
            letter: "A",
            name: "ATOMICITY",
            desc: "All steps succeed, or none of them do.",
            color: C.lime,
            cap: "Atomicity: a failure anywhere undoes everything. No half-finished work.",
            micro: function* (s) {
                const b1 = box("UPDATE 1", -85, -20, 140, C.surf2);
                const b2 = box("UPDATE 2", 85, -20, 140, C.surf2);
                (b1.children()[0] as Txt).fill(C.ink);
                (b2.children()[0] as Txt).fill(C.ink);
                const st = tx("PENDING", 0, 70, { fill: C.mute });
                s.add([b1, b2, st]);
                yield* waitFor(0.6);
                yield* all(
                    b1.fill(C.lime, 0.3),
                    (b1.children()[0] as Txt).fill(C.dark, 0.3),
                );
                st.text("UPDATE 1 OK");
                yield* waitFor(0.7);
                yield* all(
                    b2.fill(C.red, 0.3),
                    (b2.children()[0] as Txt).fill(C.dark, 0.3),
                );
                st.text("UPDATE 2 FAILED");
                st.fill(C.red);
                yield* shake(b2, 6, 4);
                yield* waitFor(0.5);
                yield* all(
                    b1.fill(C.surf2, 0.4),
                    (b1.children()[0] as Txt).fill(C.ink, 0.4),
                );
                st.text("ROLLBACK: NOTHING APPLIED");
                st.fill(C.pink);
                yield* waitFor(1.4);
            },
        },
        {
            letter: "C",
            name: "CONSISTENCY",
            desc: "Every commit leaves the data valid. Rules always hold.",
            color: C.cyan,
            cap: "Consistency: constraints are enforced. A change that breaks a rule is rejected.",
            micro: function* (s) {
                const rule = chip("CHECK bal >= 0", C.cyan, {
                    y: -70,
                    fs: 18,
                    sh: 4,
                });
                const q = tx("withdraw ₹800 from ₹500", 0, -10, {
                    fill: C.mute,
                });
                const r = tx("→ balance −₹300", 0, 30, { fill: C.red, fs: 20 });
                r.opacity(0);
                const stamp = chip("REJECTED", C.red, {
                    fs: 26,
                    rot: -4,
                    y: 80,
                    sh: 5,
                    color: C.ink,
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
            letter: "I",
            name: "ISOLATION",
            desc: "Concurrent transactions can’t see half-done work.",
            color: C.pink,
            cap: "Isolation: two transactions running together behave as if they were separate.",
            micro: function* (s) {
                const t1 = box("T1", -115, -30, 90, C.pink, 24);
                const t2 = box("T2", 115, -30, 90, C.cyan, 24);
                const wall = (
                    <Rect
                        width={14}
                        height={120}
                        y={-30}
                        radius={5}
                        fill={C.lime}
                        stroke={C.ink}
                        lineWidth={3}
                    />
                ) as Rect;
                const w1 = tx("writing…", -115, 20, { fill: C.mute });
                const arrow = (
                    <Line
                        points={[
                            [60, -30],
                            [18, -30],
                        ]}
                        stroke={C.cyan}
                        lineWidth={5}
                        endArrow
                        arrowSize={12}
                        end={0}
                    />
                ) as Line;
                const st = tx("", 0, 78, { fill: C.mute });
                s.add([t1, t2, wall, w1, arrow, st]);
                yield* waitFor(0.7);
                yield* arrow.end(1, 0.5);
                yield* all(shake(wall, 4, 4), arrow.start(1, 0.4));
                st.text("T2 cannot peek at T1");
                yield* waitFor(1.8);
            },
        },
        {
            letter: "D",
            name: "DURABILITY",
            desc: "Once committed, it survives crashes and power loss.",
            color: C.yellow,
            cap: "Durability: after COMMIT returns, the data is safe on disk, even if the server dies.",
            micro: function* (s) {
                const body = (
                    <Rect
                        y={-6}
                        width={110}
                        height={84}
                        fill={C.violet}
                        stroke={C.ink}
                        lineWidth={4}
                    />
                ) as Rect;
                const bot = (
                    <Circle
                        y={36}
                        size={[110, 34]}
                        fill={C.violet}
                        stroke={C.ink}
                        lineWidth={4}
                    />
                ) as Circle;
                const top = (
                    <Circle
                        y={-48}
                        size={[110, 34]}
                        fill="#B7A0FF"
                        stroke={C.ink}
                        lineWidth={4}
                    />
                ) as Circle;
                const ok = (
                    <Circle
                        x={48}
                        y={-56}
                        size={38}
                        fill={C.lime}
                        stroke={C.ink}
                        lineWidth={3.5}
                    >
                        <Txt
                            text="✓"
                            fontFamily={FONT}
                            fontWeight={700}
                            fontSize={24}
                            fill={C.dark}
                        />
                    </Circle>
                ) as Circle;
                ok.opacity(0);
                const cut = chip("POWER CUT", C.red, {
                    x: -34,
                    y: -92,
                    fs: 15,
                    sh: 3,
                    color: C.ink,
                });
                cut.opacity(0);
                const st = tx("", 0, 86, { fill: C.mute });
                const disk = (<Node>{[bot, body, top, ok]}</Node>) as Node;
                s.add([disk, cut, st]);
                yield* waitFor(0.5);
                yield* pop(ok, 0.3);
                st.text("COMMITTED TO DISK");
                yield* waitFor(0.8);
                yield* all(pop(cut, 0.25), shake(disk, 5, 5));
                st.text("DATA IS STILL THERE");
                st.fill(C.lime);
                yield* waitFor(1.6);
            },
        },
    ];

    const CW = 410;
    const xs = [-657, -219, 219, 657];
    const screens: Rect[] = [];
    const cards = specs.map((sp, i) => {
        const screen = (
            <Rect
                y={170}
                width={350}
                height={220}
                radius={16}
                fill={C.code}
                stroke={C.dim}
                lineWidth={3}
            />
        ) as Rect;
        screens.push(screen);
        return (
            <Rect
                x={xs[i]}
                y={-10}
                width={CW}
                height={640}
                radius={26}
                fill={C.surf}
                {...NB(sp.color, 10, 4)}
            >
                <Rect
                    y={-215}
                    width={150}
                    height={150}
                    radius={26}
                    fill={sp.color}
                    stroke={C.ink}
                    lineWidth={4}
                >
                    <Txt
                        text={sp.letter}
                        fontFamily={FONT}
                        fontWeight={700}
                        fontSize={120}
                        fill={C.dark}
                    />
                </Rect>
                <Txt
                    y={-100}
                    text={sp.name}
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={38}
                    letterSpacing={2}
                    fill={C.ink}
                />
                <Txt
                    y={-35}
                    width={350}
                    textWrap
                    textAlign="center"
                    text={sp.desc}
                    fontFamily={FONT}
                    fontWeight={500}
                    fontSize={24}
                    fill={C.mute}
                />
                {screen}
            </Rect>
        ) as Rect;
    });
    cards.forEach((c) => c.opacity(0));
    view.add(<Node ref={root}>{cards}</Node>);

    yield* say(
        "ACID: four guarantees that make a database transaction trustworthy.",
    );
    yield* sequence(0.2, ...cards.map((c) => pop(c, 0.4)));
    yield* waitFor(1);
    for (let i = 0; i < specs.length; i++) {
        yield* say(specs[i].cap);
        yield* all(
            ...cards.map((c, j) =>
                j === i
                    ? c.scale(1.04, 0.3, easeOutCubic)
                    : all(c.scale(0.97, 0.3), c.opacity(0.4, 0.3)),
            ),
        );
        yield* specs[i].micro(screens[i]);
        yield* all(
            ...cards.map((c) => all(c.scale(1, 0.3), c.opacity(1, 0.3))),
        );
        yield* waitFor(0.3);
    }
    yield* say(
        "Atomicity and Durability are about crashes. Isolation is about concurrency.",
        3,
    );
    yield* leave(root());
}

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
        name: "DIRTY READ",
        color: C.pink,
        start: "₹1,000",
        verdict: "DIRTY READ · T2 used a value that never existed",
        evs: [
            {
                lane: 1,
                a: "UPDATE bal = 700",
                b: "not committed yet",
                db: "₹700",
                dbNote: "uncommitted",
                dbColor: C.orange,
                cap: "T1 sets the balance to 700 but has not committed yet.",
            },
            {
                lane: 2,
                a: "SELECT bal",
                b: "reads in-flight data",
                result: "→ ₹700",
                bad: true,
                db: "₹700",
                dbNote: "uncommitted",
                dbColor: C.orange,
                cap: "T2 reads 700: an uncommitted value.",
            },
            {
                lane: 1,
                a: "ROLLBACK",
                b: "undo the update",
                db: "₹1,000",
                dbNote: "restored",
                dbColor: C.lime,
                cap: "T1 rolls back. 700 never existed, yet T2 already acted on it.",
            },
        ],
    },
    {
        name: "NON-REPEATABLE READ",
        color: C.cyan,
        start: "₹1,000",
        verdict: "NON-REPEATABLE READ · same row, different value",
        evs: [
            {
                lane: 1,
                a: "SELECT bal",
                b: "first read",
                result: "→ ₹1,000",
                db: "₹1,000",
                dbNote: "committed",
                dbColor: C.lime,
                cap: "T1 reads the balance: 1000.",
            },
            {
                lane: 2,
                a: "UPDATE bal = 700",
                b: "then COMMIT",
                db: "₹700",
                dbNote: "committed",
                dbColor: C.lime,
                cap: "T2 updates it to 700 and commits.",
            },
            {
                lane: 1,
                a: "SELECT bal",
                b: "same query, same tx",
                result: "→ ₹700",
                bad: true,
                db: "₹700",
                dbNote: "committed",
                dbColor: C.lime,
                cap: "T1 reads again inside the same transaction and gets a different answer.",
            },
        ],
    },
    {
        name: "PHANTOM READ",
        color: C.yellow,
        start: "2 rows",
        verdict: "PHANTOM READ · new rows appear mid-transaction",
        evs: [
            {
                lane: 1,
                a: "SELECT … WHERE bal > 500",
                b: "count matching rows",
                result: "→ 2 rows",
                db: "2 rows",
                dbNote: "match",
                dbColor: C.lime,
                cap: "T1 lists accounts with a balance over 500: 2 rows.",
            },
            {
                lane: 2,
                a: "INSERT account (900)",
                b: "then COMMIT",
                db: "3 rows",
                dbNote: "match",
                dbColor: C.lime,
                cap: "T2 inserts a new matching account and commits.",
            },
            {
                lane: 1,
                a: "SELECT … WHERE bal > 500",
                b: "same query, same tx",
                result: "→ 3 rows",
                bad: true,
                db: "3 rows",
                dbNote: "match",
                dbColor: C.lime,
                cap: "T1 repeats the query: a phantom row has appeared.",
            },
        ],
    },
];

function* anomalies(view: View2D): ThreadGenerator {
    const root = createRef<Node>();
    const SX = [-300, 120, 540];
    const LY: Record<number, number> = { 1: -200, 2: -50 };
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
                    fill={C.surf}
                    stroke={C.dim}
                    lineWidth={3}
                    shadowColor="rgba(244,241,234,0)"
                    shadowBlur={0}
                    shadowOffset={[6, 6]}
                >
                    <Txt
                        text={a.name}
                        fontFamily={MONO}
                        fontWeight={700}
                        fontSize={24}
                        letterSpacing={1}
                        fill={C.mute}
                    />
                </Rect>
            ) as Rect,
    );
    // lanes
    const lanes = [1, 2].map(
        (l) =>
            (
                <Node>
                    <Line
                        points={[
                            [-730, LY[l]],
                            [880, LY[l]],
                        ]}
                        stroke={C.dim}
                        lineWidth={4}
                        lineDash={[10, 10]}
                    />
                    <Rect
                        x={-800}
                        y={LY[l]}
                        width={100}
                        height={64}
                        radius={14}
                        fill={l === 1 ? C.pink : C.cyan}
                        {...NB(C.ink, 5, 3.5)}
                    >
                        <Txt
                            text={`T${l}`}
                            fontFamily={FONT}
                            fontWeight={700}
                            fontSize={38}
                            fill={C.dark}
                        />
                    </Rect>
                </Node>
            ) as Node,
    );
    const dbLabel = (
        <Rect
            x={-800}
            y={DBY}
            width={100}
            height={64}
            radius={14}
            fill={C.surf2}
            {...NB(C.ink, 5, 3.5)}
        >
            <Txt
                text="DB"
                fontFamily={FONT}
                fontWeight={700}
                fontSize={34}
                fill={C.ink}
            />
        </Rect>
    ) as Rect;
    const timeLbl = (
        <Txt
            x={800}
            y={-300}
            text="TIME →"
            fontFamily={MONO}
            fontWeight={700}
            fontSize={22}
            letterSpacing={3}
            fill={C.mute}
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
                          t.shadowColor(C.ink, 0.3),
                          t.stroke(C.ink, 0.3),
                          (t.children()[0] as Txt).fill(C.dark, 0.3),
                      )
                    : all(
                          t.fill(C.surf, 0.3),
                          t.shadowColor("rgba(244,241,234,0)", 0.3),
                          t.stroke(C.dim, 0.3),
                          (t.children()[0] as Txt).fill(C.mute, 0.3),
                      ),
            ),
        );
        // start chip
        const start = chip(`START ${an.start}`, C.surf2, {
            x: -640,
            y: DBY,
            fs: 20,
            sh: 0,
            color: C.ink,
        }) as Rect;
        start.opacity(0);
        stage().add(start);
        yield* say(
            `${an.name}: two transactions, T1 and T2, touch the same data at the same time.`,
        );
        yield* start.opacity(1, 0.3);
        yield* waitFor(0.8);

        const made: Node[] = [start];
        for (let e = 0; e < an.evs.length; e++) {
            const ev = an.evs[e];
            const col = ev.lane === 1 ? C.pink : C.cyan;
            const card = (
                <Rect
                    x={SX[e]}
                    y={LY[ev.lane]}
                    width={400}
                    height={104}
                    radius={16}
                    fill={C.surf}
                    {...NB(col, 7, 4)}
                >
                    <Txt
                        y={-18}
                        text={ev.a}
                        fontFamily={MONO}
                        fontWeight={700}
                        fontSize={22}
                        fill={C.ink}
                    />
                    <Txt
                        y={20}
                        text={ev.b}
                        fontFamily={MONO}
                        fontSize={18}
                        fill={C.mute}
                    />
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
                    fill={C.surf2}
                    stroke={ev.dbColor}
                    lineWidth={4}
                >
                    <Txt
                        y={-14}
                        text={ev.db}
                        fontFamily={MONO}
                        fontWeight={700}
                        fontSize={36}
                        fill={ev.dbColor}
                    />
                    <Txt
                        y={24}
                        text={ev.dbNote}
                        fontFamily={MONO}
                        fontSize={18}
                        fill={C.mute}
                    />
                </Rect>
            ) as Rect;
            dbBox.opacity(0);
            const kids: Node[] = [card, dbBox];
            let res: Rect | undefined;
            if (ev.result) {
                res = chip(ev.result, ev.bad ? C.red : C.lime, {
                    x: SX[e] + 110,
                    y: LY[ev.lane] + (ev.lane === 1 ? -66 : 66),
                    fs: 22,
                    sh: 4,
                    color: C.dark,
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

        const verdict = chip(an.verdict, C.red, {
            y: 290,
            fs: 32,
            rot: -1,
            sh: 9,
            color: C.ink,
            mono: false,
        }) as Rect;
        verdict.opacity(0);
        stage().add(verdict);
        made.push(verdict);
        yield* say("This is what isolation levels exist to prevent.");
        yield* pop(verdict, 0.4);
        yield* shake(verdict, 6, 4);
        yield* waitFor(2.6);
        yield* stage().opacity(0, 0.35);
        made.forEach((n) => n.remove());
        stage().opacity(1);
    }
    yield* leave(root());
}

// ================================================================ 05 ISOLATION LEVELS
function* levels(view: View2D): ThreadGenerator {
    const root = createRef<Node>();
    const cols = [
        { name: "DIRTY READ", color: C.pink, x: -50 },
        { name: "NON-REPEATABLE", color: C.cyan, x: 250 },
        { name: "PHANTOM READ", color: C.yellow, x: 550 },
    ];
    const rows = [
        {
            name: "READ UNCOMMITTED",
            color: "#FF5C7A",
            y: -130,
            cells: [true, true, true],
            cap: "Read Uncommitted: no protection. All three anomalies can happen.",
        },
        {
            name: "READ COMMITTED",
            color: C.orange,
            y: -10,
            cells: [false, true, true],
            cap: "Read Committed: no dirty reads. You only ever see committed data.",
        },
        {
            name: "REPEATABLE READ",
            color: C.yellow,
            y: 110,
            cells: [false, false, true],
            cap: "Repeatable Read: rows you have read stay the same for the whole transaction.",
        },
        {
            name: "SERIALIZABLE",
            color: C.lime,
            y: 230,
            cells: [false, false, false],
            cap: "Serializable: it behaves as if transactions ran strictly one after another.",
        },
    ];
    const head = cols.map((c) => {
        const h = chip(c.name, c.color, {
            x: c.x,
            y: -260,
            fs: 20,
            sh: 5,
        }) as Rect;
        h.opacity(0);
        return h;
    });
    const levelCells = rows.map((r) => {
        const n = (
            <Rect
                x={-460}
                y={r.y}
                width={520}
                height={100}
                radius={20}
                fill={r.color}
                {...NB(C.ink, 7, 4)}
            >
                <Txt
                    text={r.name}
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={34}
                    letterSpacing={1}
                    fill={C.dark}
                />
            </Rect>
        ) as Rect;
        n.opacity(0);
        return n;
    });
    const cells = rows.map((r) =>
        r.cells.map((bad, i) => {
            const n = (
                <Rect
                    x={cols[i].x}
                    y={r.y}
                    width={280}
                    height={84}
                    radius={16}
                    fill={bad ? C.redBg : C.limeBg}
                    stroke={bad ? C.red : C.lime}
                    lineWidth={4}
                >
                    <Txt
                        text={bad ? "✗  POSSIBLE" : "✓  PREVENTED"}
                        fontFamily={MONO}
                        fontWeight={700}
                        fontSize={24}
                        fill={bad ? C.red : C.lime}
                    />
                </Rect>
            ) as Rect;
            n.opacity(0);
            return n;
        }),
    );
    const arrow = (
        <Line
            points={[
                [810, -150],
                [810, 250],
            ]}
            stroke={C.ink}
            lineWidth={5}
            endArrow
            arrowSize={14}
            opacity={0}
        />
    ) as Line;
    const faster = (
        <Txt
            x={810}
            y={-185}
            text="FASTER"
            fontFamily={MONO}
            fontWeight={700}
            fontSize={18}
            letterSpacing={2}
            fill={C.mute}
            opacity={0}
        />
    ) as Txt;
    const safer = (
        <Txt
            x={810}
            y={285}
            text="SAFER"
            fontFamily={MONO}
            fontWeight={700}
            fontSize={18}
            letterSpacing={2}
            fill={C.mute}
            opacity={0}
        />
    ) as Txt;
    const pg = chip("PostgreSQL default: READ COMMITTED", C.surf2, {
        x: -250,
        y: 345,
        fs: 20,
        sh: 5,
        color: C.ink,
        shadow: C.cyan,
    }) as Rect;
    const my = chip("MySQL InnoDB default: REPEATABLE READ", C.surf2, {
        x: 330,
        y: 345,
        fs: 20,
        sh: 5,
        color: C.ink,
        shadow: C.pink,
    }) as Rect;
    const note = (
        <Txt
            y={400}
            text="SQL-standard view. Real engines differ: PostgreSQL's Repeatable Read also blocks phantoms."
            fontFamily={MONO}
            fontSize={17}
            fill={C.mute}
            opacity={0}
        />
    ) as Txt;
    pg.opacity(0);
    my.opacity(0);
    view.add(
        <Node ref={root}>
            {head}
            {levelCells}
            {cells.flat()}
            {arrow}
            {faster}
            {safer}
            {pg}
            {my}
            {note}
        </Node>,
    );

    yield* say(
        "The SQL standard defines four isolation levels. Each blocks more anomalies.",
    );
    yield* sequence(0.15, ...head.map((h) => pop(h, 0.3)));
    yield* waitFor(0.8);
    for (let i = 0; i < rows.length; i++) {
        yield* say(rows[i].cap);
        yield* all(
            pop(levelCells[i], 0.35),
            delay(0.2, sequence(0.18, ...cells[i].map((c) => pop(c, 0.3)))),
        );
        yield* waitFor(2.6);
    }
    yield* say(
        "More isolation means more safety, but less concurrency. Pick the weakest safe level.",
    );
    yield* all(
        arrow.opacity(1, 0.4),
        faster.opacity(1, 0.4),
        safer.opacity(1, 0.4),
    );
    yield* waitFor(2.2);
    yield* say(
        "Defaults differ by database, so check what your engine really uses.",
    );
    yield* all(pop(pg, 0.35), delay(0.25, pop(my, 0.35)), note.opacity(1, 0.5));
    yield* waitFor(4.6);
    yield* leave(root());
}

// ================================================================ 06 DURABILITY / WAL
function* durability(view: View2D): ThreadGenerator {
    const root = createRef<Node>();
    const panel = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        color: string,
    ) =>
        (
            <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                radius={22}
                fill={C.surf}
                {...NB(color, 8, 4)}
            >
                <Txt
                    y={-h / 2 + 30}
                    text={title}
                    fontFamily={MONO}
                    fontWeight={700}
                    fontSize={19}
                    letterSpacing={2}
                    fill={color}
                />
            </Rect>
        ) as Rect;
    const client = panel(-780, -40, 190, 130, "CLIENT", C.cyan);
    client.add(
        <Txt
            y={22}
            text="COMMIT;"
            fontFamily={MONO}
            fontWeight={700}
            fontSize={26}
            fill={C.ink}
        />,
    );
    const ram = panel(-380, -40, 330, 360, "RAM · BUFFER POOL", C.orange);
    const wal = panel(
        200,
        -170,
        520,
        220,
        "WAL · APPEND-ONLY LOG (DISK)",
        C.lime,
    );
    const data = panel(200, 120, 520, 200, "DATA FILES (DISK)", C.violet);

    const tile = (
        txt: string,
        x: number,
        y: number,
        w: number,
        color: string,
    ) =>
        (
            <Rect
                x={x}
                y={y}
                width={w}
                height={44}
                radius={10}
                fill={C.surf2}
                stroke={color}
                lineWidth={3}
            >
                <Txt
                    text={txt}
                    fontFamily={MONO}
                    fontWeight={700}
                    fontSize={19}
                    fill={C.ink}
                />
            </Rect>
        ) as Rect;
    const pgA = tile("page 7 · alice = 1,000", 0, -30, 290, C.orange);
    const pgB = tile("page 9 · bob = 500", 0, 30, 290, C.orange);
    const lost = (
        <Txt
            y={10}
            text="MEMORY LOST"
            fontFamily={MONO}
            fontWeight={700}
            fontSize={22}
            letterSpacing={2}
            fill={C.red}
            opacity={0}
        />
    ) as Txt;
    ram.add([pgA, pgB, lost]);
    const dA = tile("alice = 1,000", 0, -10, 440, C.violet);
    const dB = tile("bob = 500", 0, 46, 440, C.violet);
    data.add([dA, dB]);
    const dirtyTag = chip("DIRTY", C.orange, {
        x: 100,
        y: 100,
        fs: 15,
        sh: 3,
    }) as Rect;
    dirtyTag.opacity(0);
    ram.add(dirtyTag);
    const stale = chip("STALE", C.red, {
        x: 180,
        y: -76,
        fs: 14,
        sh: 3,
        color: C.ink,
    }) as Rect;
    stale.opacity(0);
    data.add(stale);

    // WAL log rows
    const walRows = [
        "tx4821  alice 1000 → 700",
        "tx4821  bob 500 → 800",
        "tx4821  COMMIT",
    ].map((t, i) => {
        const r = tile(t, 0, -26 + i * 50, 470, i === 2 ? C.lime : C.dim);
        r.opacity(0);
        return r;
    });
    wal.add(walRows);
    const fsync = chip("fsync ✓", C.lime, {
        x: 190,
        y: -112,
        fs: 15,
        sh: 3,
    }) as Rect;
    fsync.opacity(0);
    wal.add(fsync);

    // steps checklist (right)
    const stepDefs = [
        ["1", "change in RAM first"],
        ["2", "append to WAL + fsync"],
        ["3", "tell client: COMMIT OK"],
        ["4", "data files updated later"],
    ];
    const list = stepDefs.map(([n, t], i) => {
        const r = (
            <Rect
                x={740}
                y={-190 + i * 82}
                width={330}
                height={68}
                radius={14}
                fill={C.surf}
                stroke={C.dim}
                lineWidth={3}
            >
                <Rect x={-132} width={36} height={36} radius={10} fill={C.dim}>
                    <Txt
                        text={n}
                        fontFamily={MONO}
                        fontWeight={700}
                        fontSize={22}
                        fill={C.ink}
                    />
                </Rect>
                <Txt
                    x={-104}
                    offsetX={-1}
                    text={t}
                    fontFamily={MONO}
                    fontWeight={700}
                    fontSize={16}
                    fill={C.mute}
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
            r.stroke(C.lime, 0.2),
            badge.fill(C.lime, 0.2),
            (badge.children()[0] as Txt).fill(C.dark, 0.2),
            (r.children()[1] as Txt).fill(C.ink, 0.2),
        );
    };

    // connection lines
    const lnA = (
        <Line
            points={[
                [-685, -40],
                [-545, -40],
            ]}
            stroke={C.dim}
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
            stroke={C.dim}
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
            stroke={C.dim}
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
            stroke={C.dim}
            lineWidth={4}
            lineDash={[8, 8]}
            endArrow
            arrowSize={12}
        />
    ) as Line;

    const packet = (text: string, color: string) => {
        const p = chip(text, color, { fs: 17, sh: 4 }) as Rect;
        p.opacity(0);
        return p;
    };
    const fly = function* (
        p: Rect,
        ln: Line,
        dur: number,
        reverse = false,
    ): ThreadGenerator {
        p.position(ln.getPointAtPercentage(reverse ? 1 : 0).position);
        p.opacity(1);
        yield* tween(dur, (v) => {
            const t = easeInOutCubic(v);
            p.position(ln.getPointAtPercentage(reverse ? 1 - t : t).position);
        });
        yield* p.opacity(0, 0.15);
    };

    const pk1 = packet("UPDATE", C.cyan);
    const pk2 = packet("LOG REC", C.lime);
    const pk3 = packet("COMMIT OK ✓", C.lime);
    const power = chip("POWER CUT", C.red, {
        x: -380,
        y: -262,
        fs: 34,
        rot: -3,
        sh: 8,
        color: C.ink,
        mono: false,
    }) as Rect;
    power.opacity(0);
    const restart = chip("RESTART → REPLAY LOG", C.lime, {
        x: 330,
        y: 270,
        fs: 24,
        sh: 6,
    }) as Rect;
    restart.opacity(0);
    const recovered = chip("RECOVERED", C.lime, {
        x: 180,
        y: -76,
        fs: 14,
        sh: 3,
    }) as Rect;
    recovered.opacity(0);
    data.add(recovered);

    const parts = [client, ram, wal, data];
    parts.forEach((p) => p.opacity(0));
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

    yield* say(
        "Writing every change straight to the data files would be slow random I/O.",
    );
    yield* sequence(0.15, ...parts.map((p) => pop(p, 0.35)));
    yield* sequence(0.1, ...list.map((l) => l.opacity(1, 0.3)));
    yield* waitFor(2.2);

    yield* say("First the change is made in memory, on a cached page.");
    yield* lightStep(0);
    yield* fly(pk1, lnA, 0.7);
    (pgA.children()[0] as Txt).text("page 7 · alice = 700");
    (pgB.children()[0] as Txt).text("page 9 · bob = 800");
    yield* all(
        pgA.stroke(C.yellow, 0.2),
        pgB.stroke(C.yellow, 0.2),
        pop(dirtyTag, 0.3),
    );
    yield* waitFor(1.8);

    yield* say(
        "Before COMMIT returns, the log records are appended to the WAL and flushed.",
    );
    yield* lightStep(1);
    yield* fly(pk2, lnB, 0.6);
    yield* walRows[0].opacity(1, 0.25);
    yield* fly(pk2, lnB, 0.5);
    yield* walRows[1].opacity(1, 0.25);
    yield* fly(pk2, lnB, 0.5);
    yield* walRows[2].opacity(1, 0.25);
    yield* all(pop(fsync, 0.3), wal.stroke(C.lime, 0.2));
    yield* waitFor(1.4);

    yield* say(
        "Only now does the client hear COMMIT OK. The log is on disk, so the commit is durable.",
    );
    yield* lightStep(2);
    yield* fly(pk3, lnD, 1.4);
    yield* waitFor(1.6);

    yield* say("Crash! Memory is wiped. The data files never got the update.");
    yield* all(
        pop(power, 0.3),
        shake(ram, 10, 6),
        ram.stroke(C.red, 0.3),
        ram.shadowColor(C.red, 0.3),
    );
    yield* all(
        pgA.opacity(0, 0.4),
        pgB.opacity(0, 0.4),
        dirtyTag.opacity(0, 0.3),
        lost.opacity(1, 0.4),
        pop(stale, 0.3),
    );
    yield* waitFor(2.2);

    yield* say(
        "On restart the database replays the log and re-applies every committed change.",
    );
    yield* all(power.opacity(0, 0.3), pop(restart, 0.35));
    yield* lightStep(3);
    const rp = packet("REPLAY", C.lime);
    const rl = (
        <Line
            points={[
                [200, -54],
                [200, 14],
            ]}
            stroke={C.lime}
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
    (dA.children()[0] as Txt).text("alice = 700");
    (dB.children()[0] as Txt).text("bob = 800");
    yield* all(
        dA.stroke(C.lime, 0.3),
        dB.stroke(C.lime, 0.3),
        stale.opacity(0, 0.2),
        data.stroke(C.lime, 0.3),
    );
    yield* pop(recovered, 0.3);
    yield* waitFor(3);
    yield* say(
        "That is durability: the log survives, so a committed transaction is never lost.",
        2.6,
    );
    yield* leave(root());
}

// ================================================================ 07 IN CODE (Quarkus)
function* inCode(view: View2D): ThreadGenerator {
    const root = createRef<Node>();
    const code = codePanel({
        x: -340,
        y: -20,
        w: 1100,
        title: "TransferService.java",
        lang: "java",
        accent: C.orange,
        code: [
            "import jakarta.transaction.Transactional;",
            "",
            "@ApplicationScoped",
            "public class TransferService {",
            "",
            "  @Transactional",
            "  public void transfer(long from, long to, BigDecimal amt) {",
            "    accounts.debit(from, amt);",
            "    accounts.credit(to, amt);",
            "  }",
            "}",
        ],
    });
    const py = (i: number) => code.node.y() + code.lineY(i);
    const px = (rel: number) => code.node.x() - 550 + rel;
    const begin = chip("BEGIN ▸ before the method runs", C.lime, {
        x: px(560),
        y: py(5),
        fs: 17,
        sh: 4,
    }) as Rect;
    const commitC = chip("COMMIT ▸ after it returns", C.lime, {
        x: px(450),
        y: py(9),
        fs: 17,
        sh: 4,
    }) as Rect;
    const thr = chip("← throws RuntimeException", C.red, {
        x: px(700),
        y: py(8),
        fs: 17,
        sh: 4,
        color: C.ink,
    }) as Rect;
    const undo = chip("← undone ↺", C.pink, {
        x: px(580),
        y: py(7),
        fs: 17,
        sh: 4,
    }) as Rect;
    [begin, commitC, thr, undo].forEach((n) => n.opacity(0));

    const rule = (
        y: number,
        a: string,
        b: string,
        tag: string,
        color: string,
    ) => {
        const n = (
            <Rect
                x={585}
                y={y}
                width={620}
                height={104}
                radius={20}
                fill={C.surf}
                {...NB(color, 8, 4)}
            >
                <Txt
                    x={-285}
                    y={-20}
                    offsetX={-1}
                    text={a}
                    fontFamily={MONO}
                    fontWeight={700}
                    fontSize={22}
                    fill={C.ink}
                />
                <Txt
                    x={-285}
                    y={22}
                    offsetX={-1}
                    text={b}
                    fontFamily={FONT}
                    fontWeight={500}
                    fontSize={22}
                    fill={C.mute}
                />
                <Rect x={215} width={150} height={44} radius={10} fill={color}>
                    <Txt
                        text={tag}
                        fontFamily={MONO}
                        fontWeight={700}
                        fontSize={20}
                        letterSpacing={1}
                        fill={C.dark}
                    />
                </Rect>
            </Rect>
        ) as Rect;
        n.opacity(0);
        return n;
    };
    const r1 = rule(
        -170,
        "RuntimeException",
        "unchecked: the default rolls back",
        "ROLLBACK",
        C.pink,
    );
    const r2 = rule(
        -48,
        "Checked Exception",
        "default: it still COMMITS",
        "COMMIT",
        C.yellow,
    );
    const r3 = rule(
        74,
        "@Transactional(rollbackOn = …)",
        "opt in to roll back on checked ones too",
        "ROLLBACK",
        C.lime,
    );
    const tip = (
        <Rect
            x={585}
            y={225}
            width={620}
            height={110}
            radius={20}
            fill={C.surf}
            {...NB(C.cyan, 8, 4)}
            opacity={0}
        >
            <Txt
                x={-285}
                y={-22}
                offsetX={-1}
                text="KEEP IT SHORT"
                fontFamily={MONO}
                fontWeight={700}
                fontSize={20}
                letterSpacing={2}
                fill={C.cyan}
            />
            <Txt
                x={-285}
                y={22}
                offsetX={-1}
                text="No HTTP calls or sleeps inside a transaction."
                fontFamily={FONT}
                fontWeight={500}
                fontSize={24}
                fill={C.ink}
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

    yield* say(
        "In Quarkus, one annotation gives you all of this: @Transactional.",
    );
    yield* revealLines(code);
    yield* waitFor(1);

    yield* say(
        "The interceptor starts a transaction before the method and commits after it returns.",
    );
    yield* focusLine(code, 5, C.orange);
    yield* pop(begin, 0.3);
    yield* waitFor(1.4);
    yield* focusLine(code, 9, C.orange);
    yield* pop(commitC, 0.3);
    yield* waitFor(2.2);

    yield* say(
        "If the method throws a runtime exception, the whole transaction rolls back.",
    );
    yield* all(begin.opacity(0, 0.2), commitC.opacity(0, 0.2));
    yield* focusLine(code, 8, C.red);
    yield* pop(thr, 0.3);
    yield* waitFor(0.8);
    yield* focusLine(code, 7, C.pink);
    yield* pop(undo, 0.3);
    yield* waitFor(2.4);

    yield* say("Watch out: checked exceptions do not roll back by default.");
    yield* all(
        thr.opacity(0, 0.2),
        undo.opacity(0, 0.2),
        code.hl.opacity(0, 0.2),
    );
    yield* sequence(0.35, pop(r1, 0.35), pop(r2, 0.35), pop(r3, 0.35));
    yield* shake(r2, 6, 4);
    yield* waitFor(3.4);

    yield* say(
        "And keep transactions short, so locks are held for as little time as possible.",
    );
    yield* pop(tip, 0.35);
    yield* waitFor(4);
    yield* leave(root());
}

// ================================================================ 08 RECAP
function* recap(view: View2D): ThreadGenerator {
    const root = createRef<Node>();
    const items = [
        ["A", "ATOMICITY", "all steps happen, or none do", C.lime],
        ["C", "CONSISTENCY", "the rules always hold", C.cyan],
        ["I", "ISOLATION", "concurrent work stays apart", C.pink],
        ["D", "DURABILITY", "committed means safe on disk (WAL)", C.yellow],
    ];
    const rows = items.map(([l, n, d, col], i) => {
        const r = (
            <Rect
                x={0}
                y={-240 + i * 118}
                width={1200}
                height={96}
                radius={20}
                fill={C.surf}
                {...NB(col, 8, 4)}
            >
                <Rect x={-540} width={72} height={72} radius={16} fill={col}>
                    <Txt
                        text={l}
                        fontFamily={FONT}
                        fontWeight={700}
                        fontSize={50}
                        fill={C.dark}
                    />
                </Rect>
                <Txt
                    x={-480}
                    offsetX={-1}
                    text={n}
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={36}
                    letterSpacing={2}
                    fill={C.ink}
                />
                <Txt
                    x={60}
                    offsetX={-1}
                    text={d}
                    fontFamily={MONO}
                    fontSize={22}
                    fill={C.mute}
                />
            </Rect>
        ) as Rect;
        r.opacity(0);
        return r;
    });
    const tag = bigText("COMMIT or ROLLBACK.", 84, 250, 1, 5);
    const tag2 = chip("NEVER HALF.", C.yellow, {
        fs: 44,
        rot: -2,
        y: 350,
        sh: 9,
        mono: false,
    }) as Rect;
    tag.opacity(0);
    tag2.opacity(0);
    view.add(
        <Node ref={root}>
            {rows}
            {tag}
            {tag2}
        </Node>,
    );
    yield* say(
        "Four guarantees, one idea: group the steps, and treat them as a single unit.",
    );
    yield* sequence(0.35, ...rows.map((r) => pop(r, 0.4)));
    yield* waitFor(3);
    yield* say(
        "When it matters, a transaction either fully happens or never happened at all.",
    );
    yield* all(tag.opacity(1, 0.5), delay(0.5, pop(tag2, 0.4)));
    yield* waitFor(5);
    yield* leave(root());
}

// ================================================================ the scene
export default makeScene2D(function* (view) {
    view.fill(C.bg);
    let START = 0;
    try {
        const m = /s=(\d+)/.exec(location.hash);
        if (m) START = Math.max(0, Math.min(Number(m[1]), SECTIONS.length - 1));
    } catch {
        START = 0;
    }
    buildHud(view);
    for (let i = START; i < SECTIONS.length; i++) {
        yield* setSection(i);
        yield* SECTIONS[i].run(view);
    }
    yield* waitFor(0.5);
});
