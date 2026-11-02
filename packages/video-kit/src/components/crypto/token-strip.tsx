import {Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, delay, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import {JWT_PART_COLOR, splitToken, type JwtPart} from '../../jwt';
import {colors, fonts} from '../../theme';
import type {ColorName} from '../../theme';
import {layoutToken, type TokenPart} from './token-strip-layout';

/** Options for {@link tokenStrip}. */
export interface TokenStripOptions {
  x: number;
  y: number;
  /** Width of the wrapping box. Characters sit on a 0.6 em monospace grid. */
  width: number;
  fontSize: number;
  token: string;
  /** Palette keys per part; defaults to the JWT series colours. */
  parts?: Record<JwtPart, ColorName>;
}

/** Handles returned by {@link tokenStrip}. */
export interface TokenStrip {
  node: Node;
  readonly height: number;
  readonly lineCount: number;
  /** Reveal the token run by run over `seconds`. */
  typeIn(seconds: number): ThreadGenerator;
  /** Flash the two dot separators in turn. */
  flashDots(): ThreadGenerator;
  /** Dim every other part and underline the focused one; `null` restores all parts. */
  focus(part: JwtPart | null): ThreadGenerator;
  /** Swap one part's Base64URL text and re-wrap the token. */
  replacePart(part: JwtPart, newText: string): ThreadGenerator;
}

/**
 * Render a JWT as wrapped monospace text: header pink, payload cyan, signature
 * lime and the dots ink. One `Txt` per same-colour run per line, because nested
 * text children do not flow inline in Motion Canvas 3.17.2.
 *
 * @example
 * const strip = tokenStrip({x: 0, y: -600, width: 920, fontSize: 34, token: JWT_TOKEN});
 * view.add(strip.node);
 * yield* strip.typeIn(1.2);
 * yield* strip.focus('payload');
 */
export function tokenStrip(options: TokenStripOptions): TokenStrip {
  const {x, y, width, fontSize, token} = options;
  const partColors = options.parts ?? JWT_PART_COLOR;
  const cw = fontSize * 0.6;
  const charsPerLine = Math.max(1, Math.floor(width / cw));
  const lineHeight = fontSize * 1.55;
  const container = (<Node />) as Node;
  const node = (
    <Node x={x} y={y}>
      {container}
    </Node>
  ) as Node;

  let tokenText = token;
  let lines = layoutToken(tokenText, charsPerLine);
  let runNodes: {node: Txt; part: TokenPart}[] = [];
  let underlineNodes: {node: Rect; part: TokenPart}[] = [];
  let dotNodes: Txt[] = [];

  const colorOf = (part: TokenPart): string => (part === 'dot' ? colors.ink : colors[partColors[part]]);

  function rebuild(): void {
    for (const child of [...container.children()]) child.remove();
    lines = layoutToken(tokenText, charsPerLine);
    runNodes = [];
    underlineNodes = [];
    dotNodes = [];

    const count = lines.length;
    lines.forEach((line, index) => {
      const lineY = (index - (count - 1) / 2) * lineHeight;
      for (const run of line.runs) {
        const runX = -width / 2 + run.column * cw;
        const txt = (
          <Txt
            x={runX}
            y={lineY}
            offsetX={-1}
            text={run.text}
            fontFamily={fonts.mono}
            fontWeight={700}
            fontSize={fontSize}
            fill={colorOf(run.part)}
          />
        ) as Txt;
        container.add(txt);
        runNodes.push({node: txt, part: run.part});
        if (run.part === 'dot') {
          dotNodes.push(txt);
        } else {
          const underline = (
            <Rect
              x={runX}
              y={lineY + fontSize * 0.62}
              offsetX={-1}
              width={run.text.length * cw}
              height={3}
              radius={1.5}
              fill={colorOf(run.part)}
              opacity={0}
            />
          ) as Rect;
          container.add(underline);
          underlineNodes.push({node: underline, part: run.part});
        }
      }
    });
  }

  rebuild();

  function* typeIn(seconds: number): ThreadGenerator {
    const runs = runNodes.map(run => run.node);
    runs.forEach(run => run.opacity(0));
    if (runs.length === 0) return;

    const fade = Math.max(0.25, Math.min(0.5, seconds * 0.25));
    const travel = Math.max(0, seconds - fade);
    yield* all(
      ...runs.map((run, index) =>
        delay(runs.length > 1 ? (index / (runs.length - 1)) * travel : 0, run.opacity(1, fade)),
      ),
    );
  }

  function* flashDots(): ThreadGenerator {
    for (const dot of dotNodes) {
      yield* all(dot.scale(1.7, 0.12, easeOutCubic), dot.fill(colors.yellow, 0.12));
      yield* all(dot.scale(1, 0.18, easeInOutCubic), dot.fill(colors.ink, 0.18));
    }
  }

  function* focus(part: JwtPart | null): ThreadGenerator {
    yield* all(
      ...runNodes.map(({node: run, part: runPart}) => run.opacity(part === null || runPart === part ? 1 : 0.45, 0.28)),
      ...underlineNodes.map(({node: underline, part: runPart}) =>
        underline.opacity(part !== null && runPart === part ? 1 : 0, 0.28),
      ),
    );
  }

  function* replacePart(part: JwtPart, newText: string): ThreadGenerator {
    const split = splitToken(tokenText);
    tokenText = [
      part === 'header' ? newText : split.header,
      part === 'payload' ? newText : split.payload,
      part === 'signature' ? newText : split.signature,
    ].join('.');

    yield* container.opacity(0, 0.08);
    rebuild();
    yield* container.opacity(1, 0.12);

    const changed = runNodes.filter(run => run.part === part);
    yield* all(...changed.map(run => run.node.scale(1.12, 0.12, easeOutCubic)));
    yield* all(
      ...changed.map(run => run.node.scale(1, 0.16, easeInOutCubic)),
      ...changed.map(run => run.node.fill(colors.yellow, 0.1)),
    );
    yield* all(...changed.map(run => run.node.fill(colorOf(part), 0.16)));
  }

  return {
    node,
    get height(): number {
      return lines.length * lineHeight;
    },
    get lineCount(): number {
      return lines.length;
    },
    typeIn,
    flashDots,
    focus,
    replacePart,
  };
}
