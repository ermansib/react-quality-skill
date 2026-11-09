# Working on this repo

- The source of truth is `skills/react-quality/` (the rules) and `skills/react-quality-review/` (the reviewer). Never edit `cursor/rules/`, `cursor/react-quality-scan.mjs` or `skills/react-quality-review/references/rules/` by hand; run `npm run build:cursor` after changing either skill.
- When you add or change a rule in `skills/react-quality/`, add or update its row in `skills/react-quality-review/references/review-rules.md` (and the scanner in `scripts/scan.mjs` if it can be detected mechanically, with a fixture in `tests/review/fixtures/`). `npm run check:cursor` fails if a reference file has no catalogue section or the scanner uses an unknown rule id.
- Each file in `skills/react-quality/references/` needs frontmatter with `description` and `globs` (used for the Cursor rules).
- Keep `SKILL.md` short: golden rules, naming, quality gates and the reference index. Detail goes in a reference file.
- If you change `configs/vite/`, copy the change into `examples/web/` too.
- Run `npm run validate` before committing.
