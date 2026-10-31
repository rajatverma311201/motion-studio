import {Circle, Line, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {
  ThreadGenerator,
  all,
  createRef,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  map,
  sequence,
  tween,
  waitFor,
} from '@motion-canvas/core';

/**
 * Shared kit for the DB-indexing video: theme, small shapes, code panel, HUD.
 * Dark neubrutalism: light borders, hard coloured offset shadows, mono labels.
 */

// Fonts (Google Fonts when online; falls back to Inter / Menlo).
try {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href =
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap';
  document.head.appendChild(l);
} catch {
  /* offline or no DOM */
}

export const C = {
  bg: '#0B0B10',
  grid: 'rgba(255,255,255,0.045)',
  surf: '#15151D',
  surf2: '#1F1F2B',
  code: '#0F0F16',
  ink: '#F4F1EA',
  dark: '#0B0B10',
  lime: '#C6FF3D',
  pink: '#FF4D8D',
  cyan: '#3DE3FF',
  yellow: '#FFD23D',
  violet: '#9B7BFF',
  orange: '#FF8A3D',
  red: '#FF4D4D',
  mute: '#9A99A8',
  dim: '#3A3950',
  redBg: '#3A1521',
  limeBg: '#18301C',
  clear: 'rgba(244,241,234,0)',
};
export const FONT = '"Space Grotesk", Inter, "Segoe UI", sans-serif';
export const MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';

/** light border + hard coloured offset shadow */
export const NB = (shadow: string, sh = 8, bw = 4) => ({
  stroke: C.ink,
  lineWidth: bw,
  shadowColor: shadow,
  shadowBlur: 0,
  shadowOffset: [sh, sh] as [number, number],
});

export const num = (n: number) => Math.round(n).toLocaleString('en-US');

// ---------------------------------------------------------------- small shapes
export function chip(
  text: string,
  fill: string,
  o: {fs?: number; mono?: boolean; rot?: number; x?: number; y?: number; sh?: number; color?: string; shadow?: string} = {},
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
export const chipText = (c: Rect) => c.children()[0] as Txt;

/** plain label */
export function label(text: string, x: number, y: number, o: {fs?: number; fill?: string; mono?: boolean; w?: number; align?: 'left' | 'center' | 'right'} = {}): Txt {
  const align = o.align ?? 'center';
  return (
    <Txt
      x={x}
      y={y}
      offsetX={align === 'left' ? -1 : align === 'right' ? 1 : 0}
      text={text}
      fontFamily={o.mono === false ? FONT : MONO}
      fontWeight={700}
      fontSize={o.fs ?? 20}
      fill={o.fill ?? C.mute}
    />
  ) as Txt;
}

/** dark card with coloured hard shadow */
export function card(x: number, y: number, w: number, h: number, shadow: string, fill: string = C.surf): Rect {
  return (<Rect x={x} y={y} width={w} height={h} radius={20} fill={fill} {...NB(shadow, 8, 4)} />) as Rect;
}

export function* pop(n: Node, dur = 0.3): ThreadGenerator {
  n.scale(0.3);
  n.opacity(0);
  yield* all(n.scale(1, dur, easeOutBack), n.opacity(1, dur * 0.5));
}

export function* shake(n: Node, amp = 14, count = 6): ThreadGenerator {
  const x0 = n.x();
  const y0 = n.y();
  let a = amp;
  for (let i = 0; i < count; i++) {
    yield* n.position([x0 + (i % 2 ? a : -a), y0 + (i % 3 ? -a / 2 : a / 2)], 0.04);
    a *= 0.8;
  }
  yield* n.position([x0, y0], 0.04);
}

/** count a Txt from a to b with a formatter */
export function* countTo(t: Txt, from: number, to: number, dur: number, f: (n: number) => string = num): ThreadGenerator {
  yield* tween(dur, v => t.text(f(map(from, to, easeInOutCubic(v)))));
}

export function bigText(text: string, fs: number, y: number, ls = -2, off = 9): Node {
  const t = (fill: string, d: number) =>
    (<Txt text={text} fontSize={fs} fontWeight={700} fontFamily={FONT} fill={fill} x={d} y={d} letterSpacing={ls} />) as Txt;
  return (
    <Node y={y}>
      {t(C.pink, off * 2)}
      {t(C.cyan, off)}
      {t(C.ink, 0)}
    </Node>
  ) as Node;
}

// ---------------------------------------------------------------- code panel (syntax coloured)
export type Lang = 'sql' | 'java' | 'plan';
const SQL_RULES: [RegExp, string][] = [
  [/^\s+/, C.ink],
  [/^--.*/, C.mute],
  [/^'[^']*'/, C.lime],
  [/^\d+/, C.yellow],
  [
    /^(BEGIN|COMMIT|ROLLBACK|UPDATE|SET|WHERE|SELECT|FROM|INSERT|INTO|VALUES|AND|OR|COUNT|CREATE|INDEX|UNIQUE|ON|LIKE|BETWEEN|ORDER|BY|EXPLAIN|LIMIT|LOWER)\b/,
    C.pink,
  ],
  [/^\w+/, C.ink],
  [/^[\s\S]/, C.mute],
];
const PLAN_RULES: [RegExp, string][] = [
  [/^\s+/, C.ink],
  [/^\(cost[^)]*\)/, C.mute],
  [/^(Seq Scan|Index Scan|Index Only Scan)/, C.lime],
  [/^(Filter|Index Cond):/, C.cyan],
  [/^'[^']*'/, C.yellow],
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
  const rules = lang === 'sql' ? SQL_RULES : lang === 'plan' ? PLAN_RULES : JAVA_RULES;
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
export interface CodeP {
  node: Rect;
  hl: Rect;
  lines: Node[];
  lineY: (i: number) => number;
}
export function codePanel(o: {x: number; y: number; w: number; title: string; code: string[]; lang: Lang; accent: string; fs?: number}): CodeP {
  const h = 64 + o.code.length * LH + 36;
  const lineY = (i: number) => -h / 2 + 64 + 18 + i * LH + LH / 2;
  const hl = (
    <Rect width={o.w - 24} height={LH} radius={8} fill="rgba(255,255,255,0.09)" opacity={0} y={lineY(0)}>
      <Rect x={-(o.w - 24) / 2 + 3} width={6} height={LH - 8} radius={3} fill={o.accent} />
    </Rect>
  ) as Rect;
  // each token is its own Txt on a fixed monospace grid (0.6 em per glyph)
  const fs = o.fs ?? 24;
  const cw = fs * 0.6;
  const lines = o.code.map((ln, i) => {
    let col = 0;
    const toks: Txt[] = [];
    for (const [t, c] of tokenize(ln, o.lang)) {
      if (t.trim().length > 0) {
        toks.push((<Txt x={col * cw} offsetX={-1} text={t} fontFamily={MONO} fontSize={fs} fontWeight={400} fill={c} />) as Txt);
      }
      col += t.length;
    }
    return (<Node x={-o.w / 2 + 32} y={lineY(i)} opacity={0}>{toks}</Node>) as Node;
  });
  const node = (
    <Rect x={o.x} y={o.y} width={o.w} height={h} radius={20} fill={C.code} {...NB(o.accent, 10, 4)}>
      <Rect y={-h / 2 + 32} width={o.w} height={64} fill={C.surf2} radius={[20, 20, 0, 0]} />
      <Line points={[[-o.w / 2, -h / 2 + 64], [o.w / 2, -h / 2 + 64]]} stroke={C.ink} lineWidth={4} />
      <Circle x={-o.w / 2 + 38} y={-h / 2 + 32} size={18} fill={C.red} />
      <Circle x={-o.w / 2 + 70} y={-h / 2 + 32} size={18} fill={C.yellow} />
      <Circle x={-o.w / 2 + 102} y={-h / 2 + 32} size={18} fill={C.lime} />
      <Txt x={o.w / 2 - 28} y={-h / 2 + 32} offsetX={1} text={o.title} fontFamily={MONO} fontSize={20} fill={C.mute} />
      {hl}
      {lines}
    </Rect>
  ) as Rect;
  return {node, hl, lines, lineY};
}
export function* focusLine(p: CodeP, i: number, color?: string): ThreadGenerator {
  const bar = p.hl.children()[0] as Rect;
  if (color) yield* bar.fill(color, 0.12);
  if (p.hl.opacity() < 0.5) {
    p.hl.y(p.lineY(i));
    yield* p.hl.opacity(1, 0.15);
  } else {
    yield* p.hl.y(p.lineY(i), 0.25, easeInOutCubic);
  }
}
export const revealLines = (p: CodeP, from = 0, to = p.lines.length - 1): ThreadGenerator =>
  sequence(0.12, ...p.lines.slice(from, to + 1).map(l => l.opacity(1, 0.25)));

// ---------------------------------------------------------------- HUD: grid, top bar, caption
export interface SectionDef {
  name: string;
  color: string;
}
export const hud = {
  cap: createRef<Txt>(),
  secTxt: createRef<Txt>(),
  secChip: createRef<Rect>(),
  pills: [] as Rect[],
  defs: [] as SectionDef[],
};

export function buildHud(view: View2D, title: string, defs: SectionDef[]) {
  hud.defs = defs;
  const grid: Line[] = [];
  for (let x = -960; x <= 960; x += 60) grid.push((<Line points={[[x, -540], [x, 540]]} stroke={C.grid} lineWidth={2} />) as Line);
  for (let y = -540; y <= 540; y += 60) grid.push((<Line points={[[-960, y], [960, y]]} stroke={C.grid} lineWidth={2} />) as Line);
  view.add(<Node zIndex={-10}>{grid}</Node>);

  const n = defs.length;
  const step = 38;
  hud.pills = defs.map((_, i) => (<Rect x={904 - (n - i) * step + step / 2} y={-492} width={28} height={14} radius={7} fill={C.dim} />) as Rect);
  view.add(
    <Node zIndex={50}>
      <Rect x={-910} y={-492} width={30} height={30} radius={8} fill={C.lime} stroke={C.ink} lineWidth={3.5} offsetX={-1} />
      <Txt x={-866} y={-492} offsetX={-1} text={title} fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={3} fill={C.ink} />
      <Rect ref={hud.secChip} x={-560} y={-492} offsetX={-1} layout alignItems="center" padding={[4, 16]} radius={999} fill={C.lime}>
        <Txt ref={hud.secTxt} text="" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={2} fill={C.dark} />
      </Rect>
      {hud.pills}
      <Rect y={462} width={1740} height={78} radius={20} fill={C.surf} {...NB(C.lime, 7, 4)} />
      <Rect x={-800} y={462} width={92} height={40} radius={10} fill={C.lime}>
        <Txt text="NOTE" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={2} fill={C.dark} />
      </Rect>
      <Txt ref={hud.cap} x={-736} y={462} offsetX={-1} text="" fontFamily={FONT} fontWeight={500} fontSize={31} fill={C.ink} />
    </Node>,
  );
}

export function* setSection(i: number): ThreadGenerator {
  const s = hud.defs[i];
  hud.secTxt().text(`${String(i).padStart(2, '0')} · ${s.name}`);
  yield* all(
    hud.secChip().fill(s.color, 0.25),
    ...hud.pills.map((p, j) =>
      all(
        p.fill(j < i ? 'rgba(244,241,234,0.55)' : j === i ? s.color : C.dim, 0.3),
        p.width(j === i ? 52 : 28, 0.3, easeOutCubic),
      ),
    ),
  );
}

export function* say(text: string, hold = 0): ThreadGenerator {
  yield* hud.cap().opacity(0, 0.12);
  hud.cap().text(text);
  yield* hud.cap().opacity(1, 0.22);
  if (hold > 0) yield* waitFor(hold);
}

export function* leave(root: Node): ThreadGenerator {
  yield* root.opacity(0, 0.4);
  root.remove();
}

export {easeInOutCubic, easeOutBack, easeOutCubic};
