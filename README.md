# React Quality Skill

The team's React + TypeScript code quality rules, packaged three ways:

1. **A Claude skill** (`skills/react-quality/`) for Claude.ai, Claude Code and the Claude desktop app.
2. **Cursor rules** (`cursor/rules/`) generated from the same text, so the two never drift apart.
3. **Shared configs** (`configs/`) that enforce the rules in every project: ESLint, Prettier, tsconfig, Vite/Vitest, Git hooks, CI, PR template and repo settings.

It covers React web apps built with **Vite** and React Native apps built with **Expo / Metro**.

## What's inside

```text
skills/react-quality/
├── SKILL.md                      # Golden rules, naming, quality gates, index of references
└── references/
    ├── typescript.md
    ├── components-and-hooks.md
    ├── state-and-data.md
    ├── project-structure.md
    ├── error-handling.md
    ├── performance.md
    ├── accessibility.md
    ├── security.md
    ├── testing.md
    ├── web-vite.md
    ├── react-native.md
    └── code-review-checklist.md
cursor/rules/                     # Generated .mdc files (one per file above)
configs/
├── eslint/                       # eslint.base.js + web and native configs (ESLint 9 flat config)
├── prettier/                     # prettier.config.js + .prettierignore
├── tsconfig/                     # strict base + web (app, node, root) + native
├── vite/                         # vite.config.ts with Vitest + coverage thresholds, setup.ts for tests
├── editor/                       # .editorconfig, .nvmrc
├── vscode/                       # settings.json, extensions.json
├── git-hooks/                    # Husky hooks, lint-staged, commitlint
├── github/                       # CI workflows (web, native), PR template, Dependabot, CODEOWNERS, repo settings
└── templates/                    # package.json scripts + devDependencies for web and native
examples/                         # Tiny web and native projects that CI lints and tests with the configs
```

## Install the skill

### Claude Code (CLI, desktop, IDE)

Per project, so the whole team gets it from git:

```sh
mkdir -p .claude/skills
cp -r path/to/react-quality-skill/skills/react-quality .claude/skills/
```

Or for yourself across all projects: copy the folder to `~/.claude/skills/react-quality`.

### Claude.ai and the Claude desktop app

1. Run `npm run package:skill` (or download the `react-quality-skill` artifact from the latest **Validate** run in GitHub Actions).
2. In Claude, open the **Skills** section of **Settings** and upload `dist/react-quality.zip`.
3. Team and Enterprise admins can share it with the whole organization from the same page.

### Cursor

Copy the generated rules into the project:

```sh
mkdir -p .cursor/rules
cp path/to/react-quality-skill/cursor/rules/*.mdc .cursor/rules/
```

`react-quality-core.mdc` is always applied. The others attach automatically by file pattern (for example the testing rule on `*.test.tsx`) or when Cursor decides they are relevant from their description.

## Apply the configs to a project

### React web (Vite)

```sh
npm create vite@latest my-app -- --template react-ts
cd my-app
SRC=path/to/react-quality-skill/configs

cp $SRC/eslint/eslint.base.js .
cp $SRC/eslint/eslint.config.web.js eslint.config.js
cp $SRC/prettier/prettier.config.js $SRC/prettier/.prettierignore .
cp $SRC/tsconfig/tsconfig.base.json .
cp $SRC/tsconfig/tsconfig.web.json tsconfig.app.json
cp $SRC/tsconfig/tsconfig.node.json .
cp $SRC/tsconfig/tsconfig.web-root.json tsconfig.json
cp $SRC/vite/vite.config.ts .
mkdir -p src/test && cp $SRC/vite/setup.ts src/test/setup.ts
cp $SRC/editor/.editorconfig $SRC/editor/.nvmrc .
mkdir -p .vscode .husky .github/workflows
cp $SRC/vscode/*.json .vscode/
cp $SRC/git-hooks/pre-commit $SRC/git-hooks/commit-msg .husky/
cp $SRC/git-hooks/lint-staged.config.js $SRC/git-hooks/commitlint.config.js .
cp $SRC/github/workflows/ci-web.yml .github/workflows/ci.yml
cp $SRC/github/pull_request_template.md $SRC/github/dependabot.yml .github/
```

Then merge `configs/templates/package.web.json` into your `package.json` (scripts and devDependencies), run `npm install`, and fix what `npm run lint` reports.

### React Native (Expo)

```sh
npx create-expo-app@latest my-app
cd my-app
SRC=path/to/react-quality-skill/configs

cp $SRC/eslint/eslint.base.js .
cp $SRC/eslint/eslint.config.native.js eslint.config.js
cp $SRC/prettier/prettier.config.js $SRC/prettier/.prettierignore .
cp $SRC/tsconfig/tsconfig.base.json .
cp $SRC/tsconfig/tsconfig.native.json tsconfig.json
cp $SRC/editor/.editorconfig $SRC/editor/.nvmrc .
mkdir -p .vscode .husky .github/workflows
cp $SRC/vscode/*.json .vscode/
cp $SRC/git-hooks/pre-commit $SRC/git-hooks/commit-msg .husky/
cp $SRC/git-hooks/lint-staged.config.js $SRC/git-hooks/commitlint.config.js .
cp $SRC/github/workflows/ci-native.yml .github/workflows/ci.yml
cp $SRC/github/pull_request_template.md $SRC/github/dependabot.yml .github/
```

Then merge `configs/templates/package.native.json` into your `package.json`, remove Expo's default ESLint config if the template added one, and run `npm install`.

### Repository settings

Branch protection, squash merging, secret scanning and the other GitHub settings are listed in [`configs/github/repository-settings.md`](configs/github/repository-settings.md).

## What the configs enforce

| Area                                                                                                        | Enforced by                                        |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Strict types: no `any`, no `!`, no `@ts-ignore`, no enums, type-only imports                                | tsconfig + typescript-eslint (`strictTypeChecked`) |
| Unhandled promises, exhaustive switches, nullish checks                                                     | typescript-eslint                                  |
| Rules of Hooks, effect dependencies, React Compiler safety rules                                            | eslint-plugin-react-hooks v7                       |
| No nested components, no index keys, no leaked `&&` renders, no `dangerouslySetInnerHTML`                   | eslint-plugin-react                                |
| Accessibility (web)                                                                                         | eslint-plugin-jsx-a11y (strict)                    |
| Native: no inline styles or colour literals, raw text, unused styles; Pressable over Touchables; expo-image | eslint-plugin-react-native + restricted imports    |
| Import order, no cycles, no default exports in app code                                                     | eslint-plugin-import-x                             |
| Complexity ≤ 10, files ≤ 300 lines, functions ≤ 120 lines, ≤ 3 params                                       | ESLint core rules                                  |
| Boolean names start with `is` / `has` / `can` / `should`                                                    | `@typescript-eslint/naming-convention`             |
| Env vars read in one module; no `localStorage` for tokens (web)                                             | `no-restricted-syntax` / `no-restricted-globals`   |
| Testing Library best practices                                                                              | eslint-plugin-testing-library                      |
| Formatting                                                                                                  | Prettier, checked in CI                            |
| 80% coverage floor                                                                                          | Vitest / Jest thresholds                           |
| Conventional Commits                                                                                        | commitlint via Husky                               |
| Lint, types, tests, build and `npm audit` on every PR                                                       | GitHub Actions workflows                           |

## Tool versions

The configs target ESLint 9 (flat config), TypeScript 6.0, typescript-eslint 8, Vite 8, Vitest 5, React 19 and Expo SDK 58. ESLint 10 and TypeScript 7 are not used yet because `eslint-plugin-react`, `eslint-plugin-jsx-a11y` and typescript-eslint don't support them yet.

## Changing the rules

1. Edit the files in `skills/react-quality/`. Each reference file needs `description` and `globs` in its frontmatter.
2. Run `npm run build:cursor` to regenerate the Cursor rules.
3. Run `npm run validate`. It checks the Cursor rules are in sync, formats, type checks and lints the example projects with the configs, and runs the example tests.
4. Open a pull request. CI runs the same checks and attaches the packaged skill zip.
