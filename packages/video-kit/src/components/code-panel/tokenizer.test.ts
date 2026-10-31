import {describe, expect, it} from 'vitest';
import {colors} from '../../theme';
import type {CodeLanguage} from './languages';
import {tokenize} from './tokenizer';

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
    ];
    expect(corpus).toHaveLength(20);
    for (const [line, lang] of corpus) {
      expect(
        tokenize(line, lang)
          .map(([text]) => text)
          .join(''),
      ).toBe(line);
    }
  });
});
