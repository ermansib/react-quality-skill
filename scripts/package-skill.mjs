// Zips each Claude skill folder into dist/<skill>.zip for upload to claude.ai
// (the Skills section of Settings). Needs the `zip` command (macOS / Linux / Git Bash).
//   node scripts/package-skill.mjs                      -> both skills
//   node scripts/package-skill.mjs react-quality-review -> one skill
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SKILLS = ['react-quality', 'react-quality-review'];

const requested = process.argv.slice(2);
const skills = requested.length > 0 ? requested : SKILLS;

mkdirSync(DIST, { recursive: true });
for (const skill of skills) {
  if (!existsSync(path.join(ROOT, 'skills', skill, 'SKILL.md'))) {
    throw new Error(`No skill at skills/${skill}`);
  }
  const out = path.join(DIST, `${skill}.zip`);
  rmSync(out, { force: true });
  execFileSync('zip', ['-r', '-X', '-q', out, skill, '-x', '*.DS_Store'], {
    cwd: path.join(ROOT, 'skills'),
    stdio: 'inherit',
  });
  console.log(`Created ${path.relative(ROOT, out)}`);
}
