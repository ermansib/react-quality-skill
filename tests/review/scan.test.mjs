// Checks the review skill's scanner: it must flag the seeded violations and stay quiet on the clean examples.
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { scanFiles, scanSource } from '../../skills/react-quality-review/scripts/scan.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    return statSync(file).isDirectory() ? listFiles(file) : [file];
  });
}

const idsIn = (findings) => new Set(findings.map((finding) => finding.id));

test('flags the seeded violations in the fixtures', () => {
  const ids = idsIn(scanFiles(listFiles(path.join(ROOT, 'tests/review/fixtures'))));
  const expected = [
    'TS-01',
    'TS-02',
    'TS-03',
    'TS-04',
    'TS-05',
    'TS-07',
    'TS-08',
    'CMP-02',
    'CMP-04',
    'CMP-07',
    'CMP-08',
    'CMP-09',
    'CMP-17',
    'HK-03',
    'ST-03',
    'STR-02',
    'STR-03',
    'ERR-03',
    'ERR-09',
    'A11Y-01',
    'A11Y-03',
    'A11Y-06',
    'A11Y-14',
    'SEC-02',
    'SEC-03',
    'SEC-06',
    'TEST-02',
    'TEST-03',
    'TEST-06',
    'PERF-05',
    'RN-02',
    'RN-03',
  ];
  const missing = expected.filter((id) => !ids.has(id));
  assert.deepEqual(missing, [], `scanner missed: ${missing.join(', ')}`);
});

test('finds nothing in the example projects that follow the rules', () => {
  const files = [
    ...listFiles(path.join(ROOT, 'examples/web/src')),
    ...listFiles(path.join(ROOT, 'examples/native/src')),
  ];
  const findings = scanFiles(files);
  assert.deepEqual(findings, []);
});

test('accepts what the rules allow', () => {
  const clean = [
    'const items = [1, 2] as const;',
    'if (a !== b) return;',
    '{count > 0 && <Badge count={count} />}',
    '{isOpen && <Dialog />}',
    '// @ts-expect-error -- upstream bug https://github.com/x/y/issues/1',
    '<button type="button" onClick={handleClick}>Save</button>',
    '<img src={src} alt="" />',
    '<a href={url} target="_blank" rel="noopener noreferrer">Docs</a>',
    "import type { User } from './types';",
  ].join('\n');
  assert.deepEqual(scanSource('src/features/x/Clean.tsx', clean), []);
});

test('allows default exports in route files and env reads in the env module', () => {
  assert.deepEqual(scanSource('app/(tabs)/index.tsx', 'export default function Home() {}'), []);
  assert.deepEqual(scanSource('src/lib/env.ts', 'export const env = parse(import.meta.env);'), []);
});

test('treats a missing reason on eslint-disable as a finding', () => {
  const ids = idsIn(scanSource('src/a.ts', '// eslint-disable-next-line no-console'));
  assert.ok(ids.has('HYG-02'));
  assert.deepEqual(
    scanSource('src/a.ts', '// eslint-disable-next-line no-console -- CLI output'),
    [],
  );
});
