import js from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.output/**',
      '**/.source/**',
      '**/node_modules/**',
      'apps/docs/src/routeTree.gen.ts',
      'apps/docs/public/**',
      '.snapshots/**',
      '.agents/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        document: 'readonly',
        window: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
      },
    },
  },
  tseslint.config({
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  }),
  {
    // The processor replaces the file content with empty text, so filename
    // rules can inspect .mdx files without an MDX parser.
    files: ['**/*.mdx'],
    plugins: {'check-file': checkFile},
    processor: 'check-file/eslint-processor-check-file',
  },
  {
    files: ['**/*.{ts,tsx,mjs,mdx}'],
    plugins: {'check-file': checkFile},
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {'**/*.{ts,tsx,mjs,mdx}': 'KEBAB_CASE'},
        {ignoreMiddleExtensions: true},
      ],
    },
  },
  {
    files: ['apps/docs/src/routes/**', '**/*.d.ts', '**/*.config.{js,mjs,cjs,ts,mts,cts}'],
    rules: {'check-file/filename-naming-convention': 'off'},
  },
  {
    // Lesson sections are numbered by design: 01-intro.tsx, 02-full-table-scan.tsx.
    files: ['apps/studio/src/scenes/**/sections/*.tsx'],
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {'apps/studio/src/scenes/**/sections/*.tsx': '+([0-9])-+([a-z0-9])*(-+([a-z0-9]))'},
        {ignoreMiddleExtensions: true},
      ],
    },
  },
  {
    files: ['apps/**/src/**', 'packages/**/src/**', 'tools/**'],
    plugins: {'check-file': checkFile},
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        {
          'apps/**/src/**/': 'KEBAB_CASE',
          'packages/**/src/**/': 'KEBAB_CASE',
          'tools/**/': 'KEBAB_CASE',
        },
      ],
    },
  },
  {
    // TanStack route folders use $param names; underscore/private folders are
    // intentionally outside the convention.
    files: ['apps/docs/src/routes/**', '**/_*/**', '**/$*/**'],
    rules: {'check-file/folder-naming-convention': 'off'},
  },
);
