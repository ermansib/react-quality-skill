// Conventional Commits (feat:, fix:, refactor:, test:, docs:, chore: ...). Copy to your project root.
/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
  },
};

export default config;
