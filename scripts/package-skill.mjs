// Zips the Claude skill folder into dist/react-quality.zip for upload to claude.ai
// (the Skills section of Settings). Needs the `zip` command (macOS / Linux / Git Bash).
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'react-quality.zip');

mkdirSync(DIST, { recursive: true });
rmSync(OUT, { force: true });
execFileSync('zip', ['-r', '-X', OUT, 'react-quality', '-x', '*.DS_Store'], {
  cwd: path.join(ROOT, 'skills'),
  stdio: 'inherit',
});
console.log(`Created ${path.relative(ROOT, OUT)}`);
