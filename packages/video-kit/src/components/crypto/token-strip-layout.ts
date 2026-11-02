import type {JwtPart} from '../../jwt';

/** A run of characters that share one colour. The dot separator is its own part. */
export type TokenPart = JwtPart | 'dot';

/** One same-colour run inside a line. */
export interface TokenRun {
  text: string;
  part: TokenPart;
  /** Column where the run starts inside its line. */
  column: number;
}

/** One wrapped line of the token. */
export interface TokenLine {
  runs: TokenRun[];
  /** Number of characters on this line. Never above `charsPerLine`. */
  length: number;
}

function tokenParts(token: string): TokenPart[] {
  const parts: TokenPart[] = [];
  let dots = 0;
  for (const char of token) {
    if (char === '.') {
      parts.push('dot');
      dots += 1;
    } else {
      parts.push(dots === 0 ? 'header' : dots === 1 ? 'payload' : 'signature');
    }
  }
  return parts;
}

/**
 * Wrap a JWT onto a fixed glyph grid and merge neighbouring characters that
 * share a part. Pure: no Motion Canvas imports, so the line runs are testable.
 *
 * @example
 * const lines = layoutToken(JWT_TOKEN, 38); // 5 lines
 * lines[0].runs; // [{text: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', part: 'header', column: 0}, ...]
 */
export function layoutToken(token: string, charsPerLine: number): TokenLine[] {
  if (!Number.isInteger(charsPerLine) || charsPerLine < 1) {
    throw new Error(`layoutToken needs a positive whole charsPerLine (got ${charsPerLine})`);
  }

  const parts = tokenParts(token);
  const lines: TokenLine[] = [];

  for (let start = 0; start < token.length; start += charsPerLine) {
    const end = Math.min(start + charsPerLine, token.length);
    const runs: TokenRun[] = [];
    let runStart = start;

    for (let i = start + 1; i <= end; i++) {
      if (i === end || parts[i] !== parts[runStart]) {
        runs.push({
          text: token.slice(runStart, i),
          part: parts[runStart],
          column: runStart - start,
        });
        runStart = i;
      }
    }

    lines.push({runs, length: end - start});
  }

  return lines;
}
