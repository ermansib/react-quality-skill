// Runs on staged files before each commit. Copy to your project root.
// Type checking runs on the whole project because types cross file boundaries.
/** @type {import('lint-staged').Configuration} */
const config = {
  '*.{ts,tsx}': ['eslint --fix --max-warnings 0', 'prettier --write', () => 'npm run typecheck'],
  '*.{js,mjs,cjs}': ['eslint --fix --max-warnings 0', 'prettier --write'],
  '*.{json,md,css,scss,yml,yaml,html}': ['prettier --write'],
};

export default config;
