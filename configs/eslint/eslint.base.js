// Shared ESLint rules for React web and React Native projects.
// Used by eslint.config.web.js and eslint.config.native.js. Copy this file next to them.
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export const TS_FILES = ['**/*.{ts,tsx,mts,cts}'];
export const TEST_FILES = ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'];

/**
 * @param {{ tsconfigRootDir?: string, ignores?: string[], testingLibraryPreset?: 'react' }} [options]
 */
export function createBaseConfig(options = {}) {
  const { tsconfigRootDir = process.cwd(), ignores = [] } = options;

  return defineConfig(
    {
      name: 'team/ignores',
      ignores: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/.expo/**',
        '**/android/**',
        '**/ios/**',
        '**/*.d.ts',
        ...ignores,
      ],
    },

    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs.flat.recommended,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,

    {
      name: 'team/settings',
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      settings: {
        react: { version: 'detect' },
        'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
      },
    },

    {
      name: 'team/quality-rules',
      files: TS_FILES,
      rules: {
        // Size and complexity (see "Quality gates" in the skill)
        complexity: ['error', 10],
        'max-depth': ['error', 4],
        'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
        'max-lines-per-function': ['error', { max: 120, skipBlankLines: true, skipComments: true }],
        'max-params': ['error', 3],
        'max-nested-callbacks': ['error', 3],

        // General correctness and readability
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'no-debugger': 'error',
        'no-alert': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'off', // replaced by @typescript-eslint/no-implied-eval
        'no-nested-ternary': 'error',
        'no-param-reassign': ['error', { props: true }],
        'no-else-return': ['error', { allowElseIf: false }],
        'prefer-const': 'error',
        'object-shorthand': 'error',
        curly: ['error', 'all'],

        // TypeScript
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/consistent-type-exports': 'error',
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/ban-ts-comment': [
          'error',
          { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 10 },
        ],
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
        ],
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: { attributes: false } },
        ],
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
        '@typescript-eslint/no-restricted-types': 'off',
        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message: 'Use a union of string literals or an `as const` object instead of enum.',
          },
        ],
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: 'typeLike', format: ['PascalCase'] },
          {
            selector: ['interface', 'typeAlias'],
            format: ['PascalCase'],
            custom: { regex: '^[IT][A-Z]', match: false },
          },
          { selector: 'variable', modifiers: ['destructured'], format: null },
          {
            selector: 'variable',
            types: ['boolean'],
            format: ['PascalCase'],
            prefix: ['is', 'has', 'can', 'should', 'did', 'will'],
          },
        ],

        // React
        'react/prop-types': 'off',
        'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
        'react/jsx-boolean-value': ['error', 'never'],
        'react/self-closing-comp': 'error',
        'react/no-array-index-key': 'error',
        'react/no-unstable-nested-components': 'error',
        'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary', 'coerce'] }],
        'react/jsx-pascal-case': 'error',
        'react/function-component-definition': [
          'error',
          { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
        ],
        'react/hook-use-state': 'error',
        'react/no-danger': 'error',
        'react-hooks/exhaustive-deps': 'error',

        // Imports
        'import-x/no-default-export': 'error',
        'import-x/no-cycle': ['error', { maxDepth: 10 }],
        'import-x/no-self-import': 'error',
        'import-x/no-useless-path-segments': 'error',
        'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
        'import-x/first': 'error',
        'import-x/newline-after-import': 'error',
        'import-x/order': [
          'error',
          {
            groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'type'],
            pathGroups: [{ pattern: '@/**', group: 'internal' }],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],
      },
    },

    {
      name: 'team/tests',
      files: TEST_FILES,
      ...testingLibrary.configs['flat/react'],
      rules: {
        ...testingLibrary.configs['flat/react'].rules,
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        'max-nested-callbacks': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/unbound-method': 'off',
      },
    },

    {
      name: 'team/config-files',
      files: ['**/*.config.{js,mjs,cjs,ts,mts}', '**/vite-env.d.ts'],
      rules: { 'import-x/no-default-export': 'off' },
    },

    {
      name: 'team/plain-js',
      files: ['**/*.{js,mjs,cjs}'],
      extends: [tseslint.configs.disableTypeChecked],
      languageOptions: { globals: { ...globals.node } },
      rules: {
        'import-x/no-default-export': 'off',
        'import-x/no-named-as-default': 'off',
        'import-x/no-named-as-default-member': 'off',
      },
    },

    // Must stay last: turns off rules that conflict with Prettier.
    prettier,
  );
}
