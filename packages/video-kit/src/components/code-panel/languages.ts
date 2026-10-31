import {colors} from '../../theme';

/** Languages understood by {@link tokenize}. */
export type CodeLanguage = 'sql' | 'java' | 'plan';

/** A single syntax rule: the text it matches and the colour it paints. */
export type CodeRule = readonly [RegExp, string];

/** SQL keywords and literals. The order matters: first match wins. */
const SQL_RULES: readonly CodeRule[] = [
  [/^\s+/, colors.ink],
  [/^--.*/, colors.mute],
  [/^'[^']*'/, colors.lime],
  [/^\d+/, colors.yellow],
  [
    /^(BEGIN|COMMIT|ROLLBACK|UPDATE|SET|WHERE|SELECT|FROM|INSERT|INTO|VALUES|AND|OR|COUNT|CREATE|INDEX|UNIQUE|ON|LIKE|BETWEEN|ORDER|BY|EXPLAIN|LIMIT|LOWER)\b/,
    colors.pink,
  ],
  [/^\w+/, colors.ink],
  [/^[\s\S]/, colors.mute],
];

/** Postgres `EXPLAIN` output. First match wins. */
const PLAN_RULES: readonly CodeRule[] = [
  [/^\s+/, colors.ink],
  [/^\(cost[^)]*\)/, colors.mute],
  [/^(Seq Scan|Index Scan|Index Only Scan)/, colors.lime],
  [/^(Filter|Index Cond):/, colors.cyan],
  [/^'[^']*'/, colors.yellow],
  [/^\w+/, colors.ink],
  [/^[\s\S]/, colors.mute],
];

/** Java snippets. First match wins. */
const JAVA_RULES: readonly CodeRule[] = [
  [/^\s+/, colors.ink],
  [/^\/\/.*/, colors.mute],
  [/^@\w+/, colors.cyan],
  [/^\d+/, colors.yellow],
  [/^(import|public|class|void|new|return|throws|long)\b/, colors.pink],
  [/^[A-Z]\w*/, colors.violet],
  [/^\w+/, colors.ink],
  [/^[\s\S]/, colors.mute],
];

/** Rule tables keyed by language. */
export const LANGUAGES: Record<CodeLanguage, readonly CodeRule[]> = {
  sql: SQL_RULES,
  java: JAVA_RULES,
  plan: PLAN_RULES,
};
