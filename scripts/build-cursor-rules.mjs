// Builds every generated file from the two Claude skills so nothing drifts apart:
//   - cursor/rules/react-quality-*.mdc          from skills/react-quality
//   - cursor/rules/react-quality-review*.mdc    from skills/react-quality-review
//   - cursor/react-quality-scan.mjs             copy of the review skill's scanner
//   - skills/react-quality-review/references/rules/*.md   copy of the react-quality rules
//
//   node scripts/build-cursor-rules.mjs          -> writes the files
//   node scripts/build-cursor-rules.mjs --check  -> fails if any generated file is out of date
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { format, resolveConfig } from 'prettier';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKILL_DIR = path.join(ROOT, 'skills', 'react-quality');
const REVIEW_DIR = path.join(ROOT, 'skills', 'react-quality-review');
const RULES_COPY_DIR = path.join(REVIEW_DIR, 'references', 'rules');
const CURSOR_DIR = path.join(ROOT, 'cursor');
const OUT_DIR = path.join(CURSOR_DIR, 'rules');
const SCAN_SOURCE = path.join(REVIEW_DIR, 'scripts', 'scan.mjs');
const SCAN_COPY = path.join(CURSOR_DIR, 'react-quality-scan.mjs');
const PREFIX = 'react-quality';
const REVIEW_PREFIX = 'react-quality-review';
const HEADER =
  '<!-- Generated from skills/react-quality by scripts/build-cursor-rules.mjs. Edit the skill, not this file. -->';
const REVIEW_HEADER =
  '<!-- Generated from skills/react-quality-review by scripts/build-cursor-rules.mjs. Edit the skill, not this file. -->';
const COPY_HEADER =
  '<!-- Copied from skills/react-quality by scripts/build-cursor-rules.mjs. Edit the original, not this copy. -->';
const SCAN_HEADER =
  '// Copied from skills/react-quality-review/scripts/scan.mjs by scripts/build-cursor-rules.mjs. Edit the original.\n';
// Reference files that the review catalogue doesn't need its own section for.
const NOT_IN_CATALOGUE = new Set(['code-review-checklist.md']);

function parseFrontmatter(source) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) {
    throw new Error('Missing frontmatter');
  }
  const data = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    data[key] = value;
  }
  return { data, frontmatter: match[0], body: source.slice(match[0].length).trimStart() };
}

async function toMdc({ description, globs, alwaysApply, body, header = HEADER }) {
  const formatted = await format(body, {
    parser: 'markdown',
    printWidth: 100,
    proseWrap: 'preserve',
  });
  return [
    '---',
    `description: ${description}`,
    `globs: ${globs}`,
    `alwaysApply: ${alwaysApply}`,
    '---',
    '',
    header,
    '',
    formatted.trimEnd(),
    '',
  ].join('\n');
}

const read = (file) => readFileSync(file, 'utf8');
const referenceFiles = (dir) =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort();

async function buildQualityRules(rules) {
  const skill = parseFrontmatter(read(path.join(SKILL_DIR, 'SKILL.md')));
  const coreBody = skill.body
    .replace(
      'Load a reference file from `references/` when the task touches that area.',
      'Open the matching `.cursor/rules/react-quality-*.mdc` rule when the task touches that area.',
    )
    .replace(/`references\/([a-z-]+)\.md`/g, `\`.cursor/rules/${PREFIX}-$1.mdc\``);
  rules.set(
    `${PREFIX}-core.mdc`,
    await toMdc({
      description: skill.data.description,
      globs: '',
      alwaysApply: true,
      body: coreBody,
    }),
  );

  const referencesDir = path.join(SKILL_DIR, 'references');
  for (const file of referenceFiles(referencesDir)) {
    const { data, body } = parseFrontmatter(read(path.join(referencesDir, file)));
    if (!data.description) {
      throw new Error(`${file}: frontmatter needs a description`);
    }
    rules.set(
      `${PREFIX}-${file.replace(/\.md$/, '.mdc')}`,
      await toMdc({
        description: data.description,
        globs: data.globs ?? '',
        alwaysApply: false,
        body,
      }),
    );
  }
}

// Rewrites review-skill paths to where the files live in a Cursor project.
function toCursorPaths(body) {
  return body
    .replace(
      'It is the companion to the `react-quality` skill: that one tells you',
      'It is the companion to the `react-quality-*` rules: those tell you',
    )
    .replace(
      'is in `references/rules/`, copied from `react-quality` so the two always agree.',
      'is in the `react-quality-*.mdc` rules, generated from the same source as this one.',
    )
    .replace(/`references\/review-rules\.md`/g, `\`.cursor/rules/${REVIEW_PREFIX}-rules.mdc\``)
    .replace(/`references\/report-format\.md`/g, `\`.cursor/rules/${REVIEW_PREFIX}-report.mdc\``)
    .replace(/`(?:references\/)?rules\/core\.md`/g, `\`.cursor/rules/${PREFIX}-core.mdc\``)
    .replace(/`(?:references\/)?rules\/\*\.md`/g, `\`.cursor/rules/${PREFIX}-*.mdc\``)
    .replace(/`(?:references\/)?rules\/([a-z-]+)\.md`/g, `\`.cursor/rules/${PREFIX}-$1.mdc\``)
    .replace(/`(?:references\/)?rules\/`/g, '`.cursor/rules/`')
    .replace(/<this skill>\/scripts\/scan\.mjs/g, '.cursor/react-quality-scan.mjs')
    .replace(/`scripts\/scan\.mjs`/g, '`.cursor/react-quality-scan.mjs`')
    .replace(/This skill checks/g, 'This rule checks')
    .replace(/Files in this skill/g, 'Files this rule uses');
}

async function buildReviewRules(rules) {
  const skill = parseFrontmatter(read(path.join(REVIEW_DIR, 'SKILL.md')));
  rules.set(
    `${REVIEW_PREFIX}.mdc`,
    await toMdc({
      description: skill.data.description,
      globs: '',
      alwaysApply: false,
      body: toCursorPaths(skill.body),
      header: REVIEW_HEADER,
    }),
  );
  const names = { 'review-rules.md': 'rules', 'report-format.md': 'report' };
  for (const [file, suffix] of Object.entries(names)) {
    const { data, body } = parseFrontmatter(read(path.join(REVIEW_DIR, 'references', file)));
    rules.set(
      `${REVIEW_PREFIX}-${suffix}.mdc`,
      await toMdc({
        description: data.description,
        globs: '',
        alwaysApply: false,
        body: toCursorPaths(body),
        header: REVIEW_HEADER,
      }),
    );
  }
}

function buildRuleCopies() {
  const copies = new Map();
  const skill = parseFrontmatter(read(path.join(SKILL_DIR, 'SKILL.md')));
  const coreBody = skill.body
    .replace(
      'Load a reference file from `references/` when the task touches that area.',
      'Open the matching file in this folder when the task touches that area.',
    )
    .replace(/`references\/([a-z-]+\.md)`/g, '`$1`');
  copies.set(
    'core.md',
    `---\ndescription: ${skill.data.description}\nglobs: ''\n---\n\n${COPY_HEADER}\n\n${coreBody}`,
  );
  const referencesDir = path.join(SKILL_DIR, 'references');
  for (const file of referenceFiles(referencesDir)) {
    const { frontmatter, body } = parseFrontmatter(read(path.join(referencesDir, file)));
    copies.set(file, `${frontmatter}\n${COPY_HEADER}\n\n${body}`);
  }
  return copies;
}

// Format the copies with the repo's Prettier config so `prettier --check` stays clean.
async function formatCopies(copies) {
  const formatted = new Map();
  for (const [name, content] of copies) {
    const filepath = path.join(RULES_COPY_DIR, name);
    const options = (await resolveConfig(filepath)) ?? {};
    formatted.set(name, await format(content, { ...options, filepath }));
  }
  return formatted;
}

// Every rules file needs a section in the review catalogue, and every section must point at a real file.
function checkCatalogue(copies) {
  const catalogue = read(path.join(REVIEW_DIR, 'references', 'review-rules.md'));
  const cited = new Set(
    [...catalogue.matchAll(/^Source: `rules\/([a-z-]+\.md)`/gm)].map((m) => m[1]),
  );
  const problems = [];
  for (const file of copies.keys()) {
    if (!NOT_IN_CATALOGUE.has(file) && !cited.has(file)) {
      problems.push(`review-rules.md has no section with "Source: \`rules/${file}\`"`);
    }
  }
  for (const file of cited) {
    if (!copies.has(file))
      problems.push(`review-rules.md cites rules/${file}, which doesn't exist`);
  }
  const ids = [...catalogue.matchAll(/^\| ([A-Z0-9]+-\d{2}) /gm)].map((m) => m[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0)
    problems.push(`duplicate rule ids: ${[...new Set(duplicates)].join(', ')}`);

  const scanIds = new Set(
    [...read(SCAN_SOURCE).matchAll(/id: '([A-Z0-9]+-\d{2})'/g)].map((m) => m[1]),
  );
  for (const id of scanIds) {
    if (!ids.includes(id)) problems.push(`scan.mjs uses ${id}, which isn't in review-rules.md`);
  }
  if (problems.length > 0) {
    console.error('The review skill is out of step with the quality rules:');
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
}

function outputs(rules, copies) {
  const files = new Map();
  for (const [name, content] of rules) files.set(path.join(OUT_DIR, name), content);
  for (const [name, content] of copies) files.set(path.join(RULES_COPY_DIR, name), content);
  files.set(SCAN_COPY, SCAN_HEADER + read(SCAN_SOURCE).replace(/^#!.*\n/, ''));
  return files;
}

const rules = new Map();
await buildQualityRules(rules);
await buildReviewRules(rules);
const copies = await formatCopies(buildRuleCopies());
checkCatalogue(copies);
const files = outputs(rules, copies);
const managedDirs = [
  [OUT_DIR, '.mdc'],
  [RULES_COPY_DIR, '.md'],
];

if (process.argv.includes('--check')) {
  const stale = [...files].filter(([file, content]) => !existsSync(file) || read(file) !== content);
  const extra = managedDirs.flatMap(([dir, extension]) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((name) => name.endsWith(extension))
          .map((name) => path.join(dir, name))
          .filter((file) => !files.has(file))
      : [],
  );
  if (stale.length > 0 || extra.length > 0) {
    console.error('Generated files are out of date. Run: npm run build:cursor');
    for (const [file] of stale) console.error(`  changed: ${path.relative(ROOT, file)}`);
    for (const file of extra) console.error(`  extra:   ${path.relative(ROOT, file)}`);
    process.exit(1);
  }
  console.log(`Generated files are up to date (${files.size} files).`);
} else {
  for (const [dir] of managedDirs) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  }
  for (const [file, content] of files) writeFileSync(file, content);
  console.log(
    `Wrote ${rules.size} Cursor rules, ${copies.size} rule copies for the review skill and the scanner copy.`,
  );
}
