import {afterEach, beforeAll, describe, expect, it} from 'vitest';
import {colors} from '../../theme';
import {setActiveTheme} from '../../themes/active-theme';
import {neubrutalTheme} from '../../themes/neubrutal';
import {registerTheme} from '../../themes/registry';
import type {CodeLanguage} from './languages';
import {tokenize} from './tokenizer';

const TEMP_THEME = 'tokenizer-test-theme';

function tempLime(): string {
  return neubrutalTheme.variants.dark.colors.cyan;
}

beforeAll(() => {
  registerTheme({
    ...neubrutalTheme,
    id: TEMP_THEME,
    variants: {
      dark: {...neubrutalTheme.variants.dark, colors: {...neubrutalTheme.variants.dark.colors, lime: tempLime()}},
      light: neubrutalTheme.variants.light,
    },
  });
});

afterEach(() => setActiveTheme('neubrutal'));

describe('tokenize', () => {
  it('colours SQL keywords and strings without losing characters', () => {
    const line = "SELECT * FROM users WHERE name = 'Ria';";
    const tokens = tokenize(line, 'sql');
    expect(tokens.find(([text]) => text === 'SELECT')?.[1]).toBe(colors.pink);
    expect(tokens.find(([text]) => text === "'Ria'")?.[1]).toBe(colors.lime);
    expect(tokens.map(([text]) => text).join('')).toBe(line);
  });

  it('keeps leading whitespace as the first token', () => {
    const line = '    WHERE id = 5';
    const tokens = tokenize(line, 'sql');
    expect(tokens[0]).toEqual(['    ', colors.ink]);
    expect(tokens.map(([text]) => text).join('')).toBe(line);
  });

  it('colours Seq Scan as a plan rule keyword', () => {
    const tokens = tokenize('Seq Scan on users', 'plan');
    expect(tokens[0]).toEqual(['Seq Scan', colors.lime]);
  });

  it('colours a plan cost group as muted', () => {
    const tokens = tokenize('  (cost=0.00..208334.00 rows=1)', 'plan');
    expect(tokens[1]).toEqual(['(cost=0.00..208334.00 rows=1)', colors.mute]);
  });

  it('colours JSON keys and string values differently', () => {
    const line = '  "role": "user",';
    const tokens = tokenize(line, 'json');
    expect(tokens.find(([text]) => text === '"role"')?.[1]).toBe(colors.pink);
    expect(tokens.find(([text]) => text === '"user"')?.[1]).toBe(colors.lime);
    expect(tokens.map(([text]) => text).join('')).toBe(line);
  });

  it('colours JSON numbers and literals', () => {
    expect(tokenize('"iat": 1767225600,', 'json').find(([text]) => text === '1767225600')?.[1]).toBe(colors.yellow);
    expect(tokenize('"exp": null', 'json').find(([text]) => text === 'null')?.[1]).toBe(colors.violet);
  });

  it('colours a SQL comment to the end of the line as muted', () => {
    const line = 'SELECT 1; -- count users';
    const tokens = tokenize(line, 'sql');
    expect(tokens[tokens.length - 1]).toEqual(['-- count users', colors.mute]);
    expect(tokens.map(([text]) => text).join('')).toBe(line);
  });

  it('is lossless on a mixed corpus for every language', () => {
    const corpus: Array<[string, CodeLanguage]> = [
      ["SELECT * FROM users WHERE name = 'Ria';", 'sql'],
      ['CREATE INDEX idx_users_name ON users (name);', 'sql'],
      ['EXPLAIN SELECT * FROM orders WHERE total BETWEEN 10 AND 20;', 'sql'],
      ['SELECT LOWER(email) FROM users ORDER BY id LIMIT 5;', 'sql'],
      ['    WHERE id = 5', 'sql'],
      ["-- a comment with 'quotes' and 42", 'sql'],
      ["UPDATE users SET name = 'Ana' WHERE id = 7;", 'sql'],
      ['import io.quarkus.hibernate.orm.panache.PanacheEntity;', 'java'],
      ['@Entity', 'java'],
      ['public class User extends PanacheEntity {', 'java'],
      ['    public String name;', 'java'],
      ['// TODO: add an index on email', 'java'],
      ['return find("name", name).firstResult();', 'java'],
      ['throw new IllegalStateException("boom");', 'java'],
      ['Seq Scan on users  (cost=0.00..1.05 rows=5 width=36)', 'plan'],
      ['Index Scan using idx_users_name on users', 'plan'],
      ["  Filter: (name = 'Ria')", 'plan'],
      ['Index Cond: (id = 42)', 'plan'],
      ['  (cost=0.00..208334.00 rows=1)', 'plan'],
      ['Index Only Scan using idx_email on users', 'plan'],
      ['  "sub": "user_42",', 'json'],
      ['  "iat": 1767225600,', 'json'],
      ['  "exp": 1767229200', 'json'],
      ['  "role": "user"', 'json'],
      ['}', 'json'],
    ];
    expect(corpus).toHaveLength(25);
    for (const [line, lang] of corpus) {
      expect(
        tokenize(line, lang)
          .map(([text]) => text)
          .join(''),
      ).toBe(line);
    }
  });
});

describe('tokenize theme sensitivity', () => {
  it('resolves token colours from the active theme', () => {
    setActiveTheme(TEMP_THEME);
    expect(tokenize("'Ria'", 'sql')[0][1]).toBe(tempLime());
  });

  it('changes a token colour when the mode changes', () => {
    setActiveTheme(TEMP_THEME);
    const dark = tokenize("'Ria'", 'sql')[0][1];
    setActiveTheme(TEMP_THEME, 'light');
    const light = tokenize("'Ria'", 'sql')[0][1];
    expect(light).not.toBe(dark);
    expect(light).toBe(neubrutalTheme.variants.light.colors.lime);
  });
});
