# Review React code

Review the code against the team's react-quality rules, following `.cursor/rules/react-quality-review.mdc`.

Scope: the files or folder I name after the command. If I name nothing, review the current branch's changes against `origin/main` (`git diff --merge-base origin/main...HEAD`).

1. Detect whether each file is web (Vite) or native (Expo), and whether the React Compiler is on.
2. Run the project's type check, lint, format check and tests, then `node .cursor/react-quality-scan.mjs --changed origin/main` (or with the paths I gave). Don't fix anything.
3. Confirm each scanner hit, then read the code against `.cursor/rules/react-quality-review-rules.mdc`.
4. Write the report exactly as `.cursor/rules/react-quality-review-report.mdc` describes: verdict, gates, findings by severity with rule id, `file:line`, why and fix, then what's done well.

Review only. Offer to fix the findings after the report.
