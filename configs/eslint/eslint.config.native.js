// ESLint config for React Native apps built with Expo / Metro.
// In your project: copy this file as eslint.config.js and eslint.base.js next to it.
import reactNative from 'eslint-plugin-react-native';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { createBaseConfig, TS_FILES } from './eslint.base.js';

export default defineConfig(
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),

  {
    name: 'team/native',
    files: TS_FILES,
    plugins: { 'react-native': reactNative },
    languageOptions: {
      globals: { ...globals.es2024, __DEV__: 'readonly' },
    },
    rules: {
      'react-native/no-unused-styles': 'error',
      'react-native/no-inline-styles': 'error',
      'react-native/no-color-literals': 'error',
      'react-native/no-raw-text': ['error', { skip: ['ThemedText'] }],
      'react-native/no-single-element-style-arrays': 'error',
      'react-native/split-platform-components': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@react-native-async-storage/async-storage',
              message:
                'Fine for non-sensitive data only. Use expo-secure-store for tokens and secrets.',
              allowTypeImports: true,
            },
            {
              name: 'react-native',
              importNames: ['TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback'],
              message: 'Use Pressable with an accessibilityRole and label.',
            },
            {
              name: 'react-native',
              importNames: ['Image'],
              message: 'Use expo-image for caching and placeholders.',
            },
          ],
        },
      ],
    },
  },

  {
    // Expo Router route files and app config need default exports.
    name: 'team/native-default-exports',
    files: ['app/**/*.{ts,tsx}', 'app.config.ts'],
    rules: { 'import-x/no-default-export': 'off' },
  },
);
