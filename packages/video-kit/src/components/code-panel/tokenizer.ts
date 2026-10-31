import {colors} from '../../theme';
import {LANGUAGES, type CodeLanguage} from './languages';

/** A `[text, colour]` pair. Joining the texts of a line always returns the line. */
export type Token = [text: string, color: string];

/**
 * Split one source line into coloured tokens for the given language.
 *
 * Pure: no Motion Canvas imports, so it runs in Node and in tests.
 *
 * @example
 * tokenize("SELECT * FROM users", 'sql'); // [['SELECT', colors.pink], [' ', colors.ink], ...]
 */
export function tokenize(line: string, lang: CodeLanguage): Token[] {
  const rules = LANGUAGES[lang];
  const out: Token[] = [];
  let rest = line;
  while (rest.length) {
    for (const [re, key] of rules) {
      const m = re.exec(rest);
      if (m) {
        out.push([m[0], colors[key]]);
        rest = rest.slice(m[0].length);
        break;
      }
    }
  }
  return out;
}
