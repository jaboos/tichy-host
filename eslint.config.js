import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // design/ is a vendored mockup runtime (CLAUDE.md rule 5), docs/ is history.
  // Neither is part of the application and neither is linted.
  { ignores: ['dist', 'design', 'docs', 'sim-final.js', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    // CLAUDE.md rule 1: the engine is pure. No clock, no randomness, no DOM.
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'The engine is pure (CLAUDE.md rule 1).' },
        { name: 'document', message: 'The engine is pure (CLAUDE.md rule 1).' },
        { name: 'localStorage', message: 'The engine is pure (CLAUDE.md rule 1).' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded Rng (CLAUDE.md rule 1).' },
        { object: 'Date', property: 'now', message: 'The engine is pure (CLAUDE.md rule 1).' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'The engine is pure — no clock access (CLAUDE.md rule 1).',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
