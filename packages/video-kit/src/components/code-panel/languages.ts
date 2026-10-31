/** Languages understood by {@link tokenize}. */
export type CodeLanguage = 'sql' | 'java' | 'plan';

/** Semantic accent key stored in a rule table; resolved through the active theme when tokenizing. */
export type CodeColor = 'ink' | 'mute' | 'lime' | 'yellow' | 'pink' | 'cyan' | 'violet';

/** A single syntax rule: the text it matches and the accent key it paints. */
export type CodeRule = readonly [RegExp, CodeColor];

/** SQL keywords and literals. The order matters: first match wins. */
const SQL_RULES: readonly CodeRule[] = [
  [/^\s+/, 'ink'],
  [/^--.*/, 'mute'],
  [/^'[^']*'/, 'lime'],
  [/^\d+/, 'yellow'],
  [
    /^(BEGIN|COMMIT|ROLLBACK|UPDATE|SET|WHERE|SELECT|FROM|INSERT|INTO|VALUES|AND|OR|COUNT|CREATE|INDEX|UNIQUE|ON|LIKE|BETWEEN|ORDER|BY|EXPLAIN|LIMIT|LOWER)\b/,
    'pink',
  ],
  [/^\w+/, 'ink'],
  [/^[\s\S]/, 'mute'],
];

/** Postgres `EXPLAIN` output. First match wins. */
const PLAN_RULES: readonly CodeRule[] = [
  [/^\s+/, 'ink'],
  [/^\(cost[^)]*\)/, 'mute'],
  [/^(Seq Scan|Index Scan|Index Only Scan)/, 'lime'],
  [/^(Filter|Index Cond):/, 'cyan'],
  [/^'[^']*'/, 'yellow'],
  [/^\w+/, 'ink'],
  [/^[\s\S]/, 'mute'],
];

/** Java snippets. First match wins. */
const JAVA_RULES: readonly CodeRule[] = [
  [/^\s+/, 'ink'],
  [/^\/\/.*/, 'mute'],
  [/^@\w+/, 'cyan'],
  [/^\d+/, 'yellow'],
  [/^(import|public|class|void|new|return|throws|long)\b/, 'pink'],
  [/^[A-Z]\w*/, 'violet'],
  [/^\w+/, 'ink'],
  [/^[\s\S]/, 'mute'],
];

/** Rule tables keyed by language. */
export const LANGUAGES: Record<CodeLanguage, readonly CodeRule[]> = {
  sql: SQL_RULES,
  java: JAVA_RULES,
  plan: PLAN_RULES,
};
