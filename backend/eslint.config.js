// ESLint flat config for the backend (Node.js, ESM)
// Run: npx eslint . --fix
import js from '@eslint/js';
import globals from 'globals';

const unusedVarsRule = [
  'error',
  {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrors: 'all',
    caughtErrorsIgnorePattern: '^_',
  },
];

export default [
  js.configs.recommended,
  {
    // ── Application source ────────────────────────────────────────────────
    files: ['**/*.js'],
    ignores: [
      '**/__tests__/**',
      '**/*.test.js',
      'scripts/**',
      'seedAdmin.js',
      'server.js',
      'config/passport.js',
      'firebase-entry.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-unused-vars': unusedVarsRule,
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    // ── Test files — add vitest globals, relax unused-vars and no-empty ────
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
        // Vitest globals (describe, it, expect, beforeEach, afterEach, vi, …)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      // Test files commonly import models/fixtures for side-effects or future use
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      // Allow empty catch blocks used to swallow expected errors in test loops
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // ── CLI scripts & entrypoints — console is the intended output mechanism
    files: ['scripts/**/*.js', 'seedAdmin.js', 'firebase-entry.js', 'server.js', 'config/passport.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': unusedVarsRule,
      'prefer-const': 'error',
    },
  },
  {
    ignores: ['node_modules/', 'coverage/', 'dist/'],
  },
];
