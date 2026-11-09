#!/usr/bin/env node
// react-quality scan: flags mechanical react-quality rule violations so a reviewer can confirm them.
// Zero dependencies; needs Node 20+. Every hit is a lead, not a verdict: read the line before reporting it.
//
//   node scan.mjs [paths...]            scan files or folders (default: src, app)
//   node scan.mjs --changed [base]      scan files changed against base (default: origin/main)
//   node scan.mjs --json                machine-readable output
//   node scan.mjs --fail-on major       exit 1 if any hit is at or above this severity (blocker|major|minor|nit)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEVERITIES = ['blocker', 'major', 'minor', 'nit'];
const CODE_FILE = /\.(?:[cm]?[jt]sx?)$/;
const STYLE_FILE = /\.(?:css|scss)$/;
const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.expo',
  '.git',
  'android',
  'ios',
  '.next',
  'storybook-static',
]);
const MAX_FILE_LINES = 300;
const MAX_USE_STATE = 5;
const EFFECT_LOOKAHEAD_LINES = 15;

const isTestFile = (file) => /\.(?:test|spec)\.[jt]sx?$/.test(file) || /(?:^|\/)e2e\//.test(file);
const isConfigFile = (file) =>
  /(?:^|\/)[\w.-]+\.config\.[cm]?[jt]s$/.test(file) || /(?:^|\/)vite-env\.d\.ts$/.test(file);
const isEnvModule = (file) => /(?:^|\/)(?:lib|config)\/env\.[jt]s$/.test(file);
const isRouteFile = (file) => /(?:^|\/)app\//.test(file) || /(?:^|\/)(?:pages|routes)\//.test(file);
const isTsx = (file) => /\.[jt]sx$/.test(file);

// Line rules: one regex per line. `when` filters by file; `unless` skips a matching line.
const LINE_RULES = [
  {
    id: 'TS-01',
    severity: 'major',
    message: '`any` type: use `unknown` and narrow, or a real type',
    pattern: /(?::\s*any\b|\bas\s+any\b|<any>|\bany\[\]|Array<any>|Record<[^,>]+,\s*any>)/,
  },
  {
    id: 'TS-02',
    severity: 'major',
    message: '`@ts-ignore`: fix the type, or use `@ts-expect-error` with a reason and link',
    pattern: /@ts-ignore/,
  },
  {
    id: 'TS-02',
    severity: 'minor',
    message: '`@ts-expect-error` without a reason',
    pattern: /@ts-expect-error\s*$/,
  },
  {
    id: 'TS-03',
    severity: 'major',
    message: 'Non-null assertion `!`: handle the undefined case or narrow first',
    pattern: /[\w)\]]!(?=[.[);,\s])(?!\s*=)/,
    unless: /^\s*(?:\/\/|\*|import\b)|!==?|['"`][^'"`]*!['"`]/,
  },
  {
    id: 'TS-04',
    severity: 'minor',
    message:
      '`as` cast: prefer `satisfies`, a type guard or a schema parse (fine with a justifying comment)',
    pattern: /\bas\s+(?!const\b)(?:[A-Z][\w.]*|unknown\b|string\b|number\b|Record\b)/,
    unless:
      /^\s*(?:\/\/|\*|import\b|export\s+\*|export\s+\{)|\bimport\s*\{|\bas\s+\w+\s*\}|\/\/.*\b(?:because|why|see|https?:)/i,
  },
  {
    id: 'TS-05',
    severity: 'minor',
    message: '`enum`: use a string literal union or an `as const` object',
    pattern: /^\s*(?:export\s+)?(?:declare\s+)?(?:const\s+)?enum\s+\w+/,
  },
  {
    id: 'TS-07',
    severity: 'minor',
    message: 'Props declared with `interface`: use `type`',
    pattern: /^\s*(?:export\s+)?interface\s+\w*Props\b/,
  },
  {
    id: 'TS-08',
    severity: 'nit',
    message: '`I` prefix on a type name: drop it (`User`, not `IUser`)',
    pattern: /^\s*(?:export\s+)?(?:interface|type)\s+I[A-Z][a-z]\w*/,
  },
  {
    id: 'CMP-01',
    severity: 'major',
    message: 'Class component: use a function component (`react-error-boundary` for boundaries)',
    pattern: /\bclass\s+\w+\s+extends\s+(?:React\.)?(?:Pure)?Component\b/,
  },
  {
    id: 'CMP-02',
    severity: 'minor',
    message: '`React.FC`: annotate the props parameter instead',
    pattern: /(?:\bReact\.FC\b|\bReact\.FunctionComponent\b|:\s*FC<|:\s*FunctionComponent<)/,
  },
  {
    id: 'CMP-03',
    severity: 'minor',
    message: '`defaultProps`: put defaults in the destructuring',
    pattern: /\.defaultProps\s*=/,
  },
  {
    id: 'CMP-04',
    severity: 'minor',
    message:
      'Default export: use a named export (allowed for route files, `lazy` targets and config)',
    pattern: /^\s*export\s+default\b/,
    when: (file) => !isRouteFile(file) && !isConfigFile(file) && !isTestFile(file),
  },
  {
    id: 'CMP-07',
    severity: 'major',
    message:
      'Array index used as `key`: use a stable id from the data (fine only for static lists)',
    pattern: /\bkey=\{\s*(?:index|idx|i)\s*\}|\bkey=\{`[^`]*\$\{\s*(?:index|idx|i)\s*\}[^`]*`\}/,
  },
  {
    id: 'CMP-08',
    severity: 'blocker',
    message: 'Key generated during render: every item remounts on every render',
    pattern: /\bkey=\{[^}]*(?:Math\.random|Date\.now|randomUUID|nanoid|uuid)\(/,
  },
  {
    id: 'CMP-09',
    severity: 'major',
    message:
      'Number used with `&&` in JSX renders `0` (and crashes on native): use `> 0 &&` or a ternary',
    pattern: /\{\s*[\w.?]*(?:\.length|[cC]ount|[tT]otal|[nN]um\w*)\s*&&/,
    when: isTsx,
  },
  {
    id: 'CMP-17',
    severity: 'minor',
    message: '`forwardRef`: in React 19 accept `ref` as a prop',
    pattern: /\bforwardRef\s*[<(]/,
  },
  {
    id: 'CMP-18',
    severity: 'nit',
    message: '`<Context.Provider>`: in React 19 render `<Context>` directly',
    pattern: /<\w+Context\.Provider\b/,
  },
  {
    id: 'HK-02',
    severity: 'minor',
    message: '`exhaustive-deps` disabled: restructure, or give a reason after `--`',
    pattern: /eslint-disable(?:-next-line|-line)?\s+react-hooks\/exhaustive-deps(?!.*--)/,
  },
  {
    id: 'ST-03',
    severity: 'major',
    message: 'Network call in a component: wrap the endpoint in a typed query or mutation hook',
    pattern: /\b(?:fetch|axios(?:\.\w+)?)\(/,
    when: (file) => isTsx(file) && !isTestFile(file),
  },
  {
    id: 'STR-07',
    severity: 'minor',
    message: 'Env var read outside the env module: read it from `lib/env.ts`',
    pattern: /\bimport\.meta\.env\b|\bprocess\.env\b/,
    when: (file) => !isEnvModule(file) && !isConfigFile(file) && !isTestFile(file),
  },
  {
    id: 'ERR-03',
    severity: 'major',
    message: 'Empty `catch`: handle, surface to the user, or rethrow',
    pattern:
      /catch\s*(?:\([^)]*\))?\s*\{\s*\}|\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*(?:\{\s*\}|undefined|null)\s*\)/,
  },
  {
    id: 'ERR-04',
    severity: 'minor',
    message: 'Throwing a string: throw an `Error` (or a typed subclass)',
    pattern: /\bthrow\s+['"`]/,
  },
  {
    id: 'ERR-09',
    severity: 'minor',
    message: '`console` call in shipped code: remove it or use the logger',
    pattern: /\bconsole\.(?:log|debug|info|trace|dir|table)\(/,
    when: (file) => !isTestFile(file) && !isConfigFile(file),
  },
  {
    id: 'A11Y-01',
    severity: 'major',
    message: '`onClick` on a `<div>` / `<span>`: use a `<button>` (or `<a href>` for navigation)',
    pattern: /<(?:div|span|li|td|img)\b[^>]*\bonClick=/,
  },
  {
    id: 'A11Y-03',
    severity: 'major',
    message: '`<img>` without `alt`: describe it, or `alt=""` if decorative',
    pattern: /<img\b(?![^>]*\balt=)[^>]*\/?>/,
  },
  {
    id: 'A11Y-04',
    severity: 'major',
    message: 'Focus outline removed: add a visible `:focus-visible` style',
    pattern: /outline:\s*(?:none|0)\b|outline-none\b|\boutline:\s*['"](?:none|0)['"]/,
  },
  {
    id: 'A11Y-05',
    severity: 'minor',
    message: 'Positive `tabIndex`: use 0 or -1 and fix the DOM order',
    pattern: /tabIndex=\{?\s*["']?[1-9]/,
  },
  {
    id: 'A11Y-06',
    severity: 'nit',
    message: '`<button>` without `type`: add `type="button"` unless it submits a form',
    pattern: /<button\b(?![^>]*\btype=)[^>]*>/,
  },
  {
    id: 'A11Y-14',
    severity: 'minor',
    message: 'Font scaling disabled: support Dynamic Type',
    pattern: /allowFontScaling=\{\s*false\s*\}/,
  },
  {
    id: 'SEC-01',
    severity: 'blocker',
    message:
      'Secret-looking name in a public env var: `VITE_*` and `EXPO_PUBLIC_*` ship in the bundle',
    pattern: /\b(?:VITE|EXPO_PUBLIC)_\w*(?:SECRET|PRIVATE|PASSWORD|API_KEY|SERVICE_KEY|TOKEN)\w*/,
  },
  {
    id: 'SEC-01',
    severity: 'blocker',
    message: 'Hard-coded credential: move it to the backend',
    pattern: /(?:api[_-]?key|secret|password|private[_-]?key)\w*\s*[:=]\s*['"][^'"\s]{12,}['"]/i,
    when: (file) => !isTestFile(file),
  },
  {
    id: 'SEC-02',
    severity: 'blocker',
    message: '`dangerouslySetInnerHTML`: only with HTML sanitized by the shared DOMPurify helper',
    pattern: /dangerouslySetInnerHTML/,
    unlessFile: /DOMPurify|sanitize/,
  },
  {
    id: 'SEC-03',
    severity: 'blocker',
    message: 'Token in web storage: use an httpOnly cookie, or keep it in memory',
    pattern: /(?:localStorage|sessionStorage)\.setItem\([^)]*(?:token|jwt|auth|session)/i,
  },
  {
    id: 'SEC-03',
    severity: 'blocker',
    message: 'Token in AsyncStorage / MMKV: use `expo-secure-store`',
    pattern: /\b(?:AsyncStorage|storage|mmkv)\.(?:setItem|set)\([^)]*(?:token|jwt|auth|password)/i,
  },
  {
    id: 'SEC-04',
    severity: 'blocker',
    message: '`eval`, `new Function` or a string timer: never execute strings',
    pattern: /\beval\(|\bnew\s+Function\(|\bset(?:Timeout|Interval)\(\s*['"`]/,
  },
  {
    id: 'SEC-05',
    severity: 'blocker',
    message: '`javascript:` URL: validate URLs and allow only https (and mailto / tel)',
    pattern: /['"`]javascript:/i,
  },
  {
    id: 'SEC-06',
    severity: 'minor',
    message: '`target="_blank"` without `rel="noopener noreferrer"`',
    pattern: /target=["'{]+_blank(?![^>]*\brel=)/,
  },
  {
    id: 'TEST-02',
    severity: 'nit',
    message: '`getByTestId`: query by role and name, or by label, first',
    pattern: /\b(?:get|query|find)(?:All)?ByTestId\(/,
    when: isTestFile,
  },
  {
    id: 'TEST-03',
    severity: 'minor',
    message: '`fireEvent`: use `userEvent` for user interactions',
    pattern: /\bfireEvent\./,
    when: isTestFile,
  },
  {
    id: 'TEST-06',
    severity: 'major',
    message: 'Focused or skipped test committed',
    pattern: /\b(?:it|test|describe)\.(?:only|skip)\(|\bf(?:it|describe)\(|\bx(?:it|describe)\(/,
    when: isTestFile,
  },
  {
    id: 'WEB-04',
    severity: 'minor',
    message: 'Hard-coded colour in a component: use a design token',
    pattern:
      /(?:color|background(?:Color)?|borderColor|fill|stroke)\s*[:=]\s*['"]#[\da-fA-F]{3,8}['"]/,
    when: (file) => isTsx(file) && !/(?:^|\/)(?:theme|tokens)/.test(file),
  },
  {
    id: 'RN-02',
    severity: 'minor',
    message: '`Touchable*`: use `Pressable` with a role, a label and a pressed style',
    pattern: /<Touchable(?:Opacity|Highlight|WithoutFeedback|NativeFeedback)\b/,
  },
  {
    id: 'RN-03',
    severity: 'minor',
    message: "React Native's `Image`: use `expo-image`",
    pattern: /import\s*\{[^}]*\bImage\b[^}]*\}\s*from\s*['"]react-native['"]/,
  },
  {
    id: 'HYG-02',
    severity: 'minor',
    message: '`eslint-disable` without a reason: add `-- why`',
    pattern:
      /eslint-disable(?:-next-line|-line)?(?:\s+[\w@/-]+(?:\s*,\s*[\w@/-]+)*)?\s*(?:\*\/)?\s*$/,
  },
];

// File rules look at the whole file.
const FILE_RULES = [
  {
    id: 'STR-08',
    severity: 'minor',
    when: (file) => !isTestFile(file),
    check: (lines) =>
      lines.length > MAX_FILE_LINES
        ? [
            {
              line: 1,
              message: `File has ${lines.length} lines (limit ${MAX_FILE_LINES}): split by responsibility`,
            },
          ]
        : [],
  },
  {
    id: 'CMP-11',
    severity: 'minor',
    when: isTsx,
    check: (lines) => {
      const count = lines.filter((line) => /\buseState\s*[<(]/.test(line)).length;
      return count > MAX_USE_STATE
        ? [{ line: 1, message: `${count} useState calls: split the component or use useReducer` }]
        : [];
    },
  },
  {
    id: 'HK-03',
    severity: 'major',
    when: (file) => !isTestFile(file),
    check: (lines) => {
      const hits = [];
      lines.forEach((line, index) => {
        if (!/\buseEffect\(/.test(line)) return;
        const body = lines.slice(index, index + EFFECT_LOOKAHEAD_LINES).join('\n');
        if (/\b(?:fetch|axios(?:\.\w+)?)\(|\.(?:get|post|put|patch|delete)\(\s*['"`/]/.test(body)) {
          hits.push({
            line: index + 1,
            message: 'Data fetched in `useEffect`: use a TanStack Query hook',
          });
        }
      });
      return hits;
    },
  },
  {
    id: 'PERF-05',
    severity: 'major',
    when: isTsx,
    check: (lines) => {
      const source = lines.join('\n');
      if (!/<ScrollView\b/.test(source) || !/\.map\(\s*\(?/.test(source)) return [];
      const line = lines.findIndex((text) => /<ScrollView\b/.test(text)) + 1;
      return [
        {
          line,
          message:
            '`ScrollView` with `.map()`: use `FlatList` / `FlashList` for data that can grow',
        },
      ];
    },
  },
  {
    id: 'STR-02',
    severity: 'major',
    check: (lines, file) => {
      const own = /(?:^|\/)features\/([\w-]+)\//.exec(file)?.[1];
      const hits = [];
      lines.forEach((line, index) => {
        const match =
          /from\s+['"](?:@\/|(?:\.\.\/)+)features\/([\w-]+)\/(?!index['"])[\w./-]+['"]/.exec(line);
        if (match && match[1] !== own) {
          hits.push({
            line: index + 1,
            message: `Imports internals of feature "${match[1]}": import from its index.ts`,
          });
        }
      });
      return hits;
    },
  },
  {
    id: 'STR-03',
    severity: 'major',
    when: (file) => /(?:^|\/)src\/(?:components|hooks|lib|utils)\//.test(file),
    check: (lines) =>
      lines.flatMap((line, index) =>
        /from\s+['"](?:@\/|(?:\.\.\/)+)features\//.test(line)
          ? [
              {
                line: index + 1,
                message:
                  'Shared code imports from features/: move the shared piece out of the feature',
              },
            ]
          : [],
      ),
  },
];

function parseArgs(argv) {
  const options = { paths: [], json: false, changed: null, failOn: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') options.json = true;
    else if (arg === '--changed') {
      const next = argv[i + 1];
      options.changed = next && !next.startsWith('--') ? next : 'origin/main';
      if (next && !next.startsWith('--')) i += 1;
    } else if (arg === '--fail-on') {
      options.failOn = argv[i + 1];
      i += 1;
      if (!SEVERITIES.includes(options.failOn)) {
        throw new Error(`--fail-on expects one of: ${SEVERITIES.join(', ')}`);
      }
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else options.paths.push(arg);
  }
  return options;
}

function walk(target, files) {
  if (!existsSync(target)) return;
  const stats = statSync(target);
  if (stats.isFile()) {
    files.push(target);
    return;
  }
  for (const entry of readdirSync(target)) {
    if (IGNORED_DIRS.has(entry) || entry.startsWith('.')) continue;
    walk(path.join(target, entry), files);
  }
}

function changedFiles(base) {
  const output = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`],
    {
      encoding: 'utf8',
    },
  );
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  });
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  return [...new Set([...output.split('\n'), ...untracked.split('\n')])]
    .filter(Boolean)
    .map((file) => path.join(root, file))
    .filter((file) => existsSync(file));
}

function stripComment(line) {
  // Keep directive comments (ts-ignore, eslint-disable) visible; drop ordinary trailing // comments.
  if (/@ts-|eslint-disable/.test(line)) return line;
  return line.replace(/(^|[^:'"`\\])\/\/.*$/, '$1');
}

export function scanSource(file, source) {
  const normalized = file.split(path.sep).join('/');
  const lines = source.split(/\r?\n/);
  const findings = [];
  const isCode = CODE_FILE.test(normalized);
  const isStyle = STYLE_FILE.test(normalized);
  if (!isCode && !isStyle) return findings;

  lines.forEach((rawLine, index) => {
    const line = isCode ? stripComment(rawLine) : rawLine;
    for (const rule of LINE_RULES) {
      if (isStyle && rule.id !== 'A11Y-04') continue;
      if (rule.when && !rule.when(normalized)) continue;
      if (!rule.pattern.test(line)) continue;
      if (rule.unless?.test(rawLine)) continue;
      if (rule.unlessFile?.test(source)) continue;
      findings.push({
        file: normalized,
        line: index + 1,
        id: rule.id,
        severity: rule.severity,
        message: rule.message,
        code: rawLine.trim(),
      });
    }
  });

  if (isCode) {
    for (const rule of FILE_RULES) {
      if (rule.when && !rule.when(normalized)) continue;
      for (const hit of rule.check(lines, normalized)) {
        findings.push({
          file: normalized,
          line: hit.line,
          id: rule.id,
          severity: rule.severity,
          message: hit.message,
          code: lines[hit.line - 1]?.trim() ?? '',
        });
      }
    }
  }

  return findings.sort((a, b) => a.line - b.line);
}

export function scanFiles(files) {
  return files.flatMap((file) =>
    scanSource(path.relative(process.cwd(), file) || file, readFileSync(file, 'utf8')),
  );
}

function printReport(findings, fileCount) {
  if (findings.length === 0) {
    console.log(`react-quality scan: no hits in ${fileCount} files.`);
    return;
  }
  const bySeverity = Object.fromEntries(
    SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s)]),
  );
  console.log(
    `react-quality scan: ${findings.length} hits in ${fileCount} files ` +
      `(${SEVERITIES.map((s) => `${bySeverity[s].length} ${s}`).join(', ')}). Confirm each before reporting.\n`,
  );
  for (const severity of SEVERITIES) {
    if (bySeverity[severity].length === 0) continue;
    console.log(`${severity.toUpperCase()}`);
    for (const finding of bySeverity[severity]) {
      console.log(`  [${finding.id}] ${finding.file}:${finding.line}  ${finding.message}`);
      if (finding.code) console.log(`      ${finding.code.slice(0, 140)}`);
    }
    console.log('');
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(
      readFileSync(fileURLToPath(import.meta.url), 'utf8')
        .split('\n')
        .slice(1, 8)
        .join('\n')
        .replace(/^\/\/ ?/gm, ''),
    );
    return;
  }
  let files = [];
  if (options.changed) files = changedFiles(options.changed);
  const targets = options.paths.length > 0 ? options.paths : options.changed ? [] : ['src', 'app'];
  for (const target of targets) walk(path.resolve(target), files);
  files = [...new Set(files)].filter((file) => CODE_FILE.test(file) || STYLE_FILE.test(file));
  files = files.filter((file) => !file.split(path.sep).some((part) => IGNORED_DIRS.has(part)));

  const findings = scanFiles(files);
  if (options.json) console.log(JSON.stringify({ files: files.length, findings }, null, 2));
  else printReport(findings, files.length);

  if (options.failOn) {
    const limit = SEVERITIES.indexOf(options.failOn);
    if (findings.some((finding) => SEVERITIES.indexOf(finding.severity) <= limit))
      process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
