// Builds Cursor rules (.mdc) from the Claude skill so both stay in sync.
//   node scripts/build-cursor-rules.mjs          -> writes cursor/rules/*.mdc
//   node scripts/build-cursor-rules.mjs --check  -> fails if cursor/rules is out of date
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { format } from 'prettier';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKILL_DIR = path.join(ROOT, 'skills', 'react-quality');
const OUT_DIR = path.join(ROOT, 'cursor', 'rules');
const PREFIX = 'react-quality';
const HEADER =
  '<!-- Generated from skills/react-quality by scripts/build-cursor-rules.mjs. Edit the skill, not this file. -->';

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
  return { data, body: source.slice(match[0].length).trimStart() };
}

async function toMdc({ description, globs, alwaysApply, body }) {
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
    HEADER,
    '',
    formatted.trimEnd(),
    '',
  ].join('\n');
}

async function buildRules() {
  const rules = new Map();

  const skill = parseFrontmatter(readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8'));
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
  for (const file of readdirSync(referencesDir)
    .filter((name) => name.endsWith('.md'))
    .sort()) {
    const { data, body } = parseFrontmatter(readFileSync(path.join(referencesDir, file), 'utf8'));
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
  return rules;
}

const rules = await buildRules();
const isCheck = process.argv.includes('--check');

if (isCheck) {
  const existing = existsSync(OUT_DIR)
    ? readdirSync(OUT_DIR).filter((f) => f.endsWith('.mdc'))
    : [];
  const stale = [...rules].filter(
    ([name, content]) =>
      !existsSync(path.join(OUT_DIR, name)) ||
      readFileSync(path.join(OUT_DIR, name), 'utf8') !== content,
  );
  const extra = existing.filter((name) => !rules.has(name));
  if (stale.length > 0 || extra.length > 0) {
    console.error('Cursor rules are out of date. Run: npm run build:cursor');
    for (const [name] of stale) console.error(`  changed: ${name}`);
    for (const name of extra) console.error(`  extra:   ${name}`);
    process.exit(1);
  }
  console.log(`Cursor rules are up to date (${rules.size} files).`);
} else {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, content] of rules) {
    writeFileSync(path.join(OUT_DIR, name), content);
  }
  console.log(`Wrote ${rules.size} Cursor rules to ${path.relative(ROOT, OUT_DIR)}/`);
}
