// ESLint flat config for the frontend (React + CRA)
// Run: npx eslint src --fix
import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        // CRA injects process.env at build time via webpack DefinePlugin
        process: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],

      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      // Apostrophes in prose are fine; escaping every ' clutters JSX
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    // Test files — add jest globals
    files: ['src/**/*.test.{js,jsx}', 'src/setupTests.js', 'src/App.test.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: ['node_modules/', 'build/', 'coverage/'],
  },
];
