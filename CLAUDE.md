# Working on this repo

- The source of truth is `skills/react-quality/`. Never edit `cursor/rules/` by hand; run `npm run build:cursor` after changing the skill.
- Each file in `skills/react-quality/references/` needs frontmatter with `description` and `globs` (used for the Cursor rules).
- Keep `SKILL.md` short: golden rules, naming, quality gates and the reference index. Detail goes in a reference file.
- If you change `configs/vite/`, copy the change into `examples/web/` too.
- Run `npm run validate` before committing.
