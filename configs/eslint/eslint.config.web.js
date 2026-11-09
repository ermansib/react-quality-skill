// ESLint config for React web apps built with Vite.
// In your project: copy this file as eslint.config.js and eslint.base.js next to it.
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { createBaseConfig, TS_FILES } from './eslint.base.js';

export default defineConfig(
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),

  {
    name: 'team/web',
    files: TS_FILES,
    ...jsxA11y.flatConfigs.strict,
    languageOptions: {
      ...jsxA11y.flatConfigs.strict.languageOptions,
      globals: { ...globals.browser },
    },
  },

  {
    name: 'team/web-refresh',
    files: ['**/*.tsx'],
    ...reactRefresh.configs.vite,
  },

  {
    name: 'team/web-rules',
    files: TS_FILES,
    rules: {
      // Don't read import.meta.env directly; go through src/lib/env.ts
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use a union of string literals or an `as const` object instead of enum.',
        },
        {
          selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
          message:
            'Read env vars through src/lib/env.ts so they are parsed and typed in one place.',
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Use the storage helper; never store tokens in localStorage.',
        },
        {
          name: 'sessionStorage',
          message: 'Use the storage helper; never store tokens in sessionStorage.',
        },
      ],
    },
  },

  {
    name: 'team/web-env-module',
    files: ['src/lib/env.ts', '**/lib/env.ts', '**/lib/storage.ts'],
    rules: { 'no-restricted-syntax': 'off', 'no-restricted-globals': 'off' },
  },
);
