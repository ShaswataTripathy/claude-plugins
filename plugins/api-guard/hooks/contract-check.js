#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { resolve, relative, extname } from 'path';
import { execSync } from 'child_process';

const input = JSON.parse(readFileSync(0, 'utf8'));
const toolName = input?.tool_name ?? '';
const filePath = input?.tool_input?.file_path ?? '';

if (!filePath) process.exit(0);

const CHECKABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs']);
if (!CHECKABLE_EXTENSIONS.has(extname(filePath))) process.exit(0);

const abs = resolve(filePath);
if (!existsSync(abs)) process.exit(0);

const oldContent = readFileSync(abs, 'utf8');

// Write gives us the full new content directly.
// Edit gives us old_string/new_string — reconstruct the resulting file.
let newContent;
if (toolName === 'Write') {
  newContent = input?.tool_input?.content ?? '';
} else if (toolName === 'Edit') {
  const oldStr = input?.tool_input?.old_string ?? '';
  const newStr = input?.tool_input?.new_string ?? '';
  newContent = oldContent.replace(oldStr, newStr);
} else {
  process.exit(0);
}

if (!newContent) process.exit(0);

// Pull exported symbol names out of a file. Catches the most common patterns
// across TS/JS/Python/Go without a full AST parse.
function extractExports(src, ext) {
  const symbols = new Set();

  if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    const patterns = [
      /^export\s+(?:async\s+)?function\s+(\w+)/gm,
      /^export\s+(?:const|let|var)\s+(\w+)/gm,
      /^export\s+(?:class|interface|type|enum|abstract\s+class)\s+(\w+)/gm,
      /^export\s+default\s+(?:function\s+)?(\w+)/gm,
    ];
    for (const re of patterns) {
      for (const m of src.matchAll(re)) symbols.add(m[1]);
    }
    // Named re-exports: export { foo, bar }
    for (const m of src.matchAll(/^export\s*\{([^}]+)\}/gm)) {
      for (const s of m[1].split(',')) symbols.add(s.trim().split(/\s+as\s+/)[0].trim());
    }
  }

  if (ext === '.py') {
    for (const m of src.matchAll(/^def\s+(\w+)|^class\s+(\w+)/gm)) {
      symbols.add(m[1] ?? m[2]);
    }
  }

  if (ext === '.go') {
    // Exported names in Go start with an uppercase letter
    for (const m of src.matchAll(/^func\s+([A-Z]\w*)|^type\s+([A-Z]\w*)/gm)) {
      symbols.add(m[1] ?? m[2]);
    }
  }

  return symbols;
}

const ext = extname(filePath);
const oldExports = extractExports(oldContent, ext);
const newExports = extractExports(newContent, ext);

// Find symbols that existed before and still exist now — those are the ones
// where a signature change could silently break callers.
const retained = [...oldExports].filter((s) => newExports.has(s));
if (retained.length === 0) process.exit(0);

// Quick grep for each retained symbol across the codebase.
// We skip node_modules, dist, .git to keep this fast enough for a hook.
const cwd = process.cwd();
const relPath = relative(cwd, abs);
const callerMap = {};
let totalCallers = 0;

for (const sym of retained) {
  let hits;
  try {
    const raw = execSync(
      `grep -rl --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" --include="*.go" "${sym}" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git`,
      { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    hits = raw ? raw.split('\n').filter((f) => f && f !== `./${relPath}` && f !== relPath) : [];
  } catch {
    hits = [];
  }
  if (hits.length > 0) {
    callerMap[sym] = hits;
    totalCallers += hits.length;
  }
}

if (totalCallers === 0) process.exit(0);

const lines = [
  `\n  api-guard: "${relPath}" exports symbols that have callers across the codebase.\n`,
];

for (const [sym, files] of Object.entries(callerMap)) {
  lines.push(`  ${sym} — referenced in ${files.length} file(s):`);
  for (const f of files.slice(0, 4)) lines.push(`    ${f}`);
  if (files.length > 4) lines.push(`    ... and ${files.length - 4} more`);
}

lines.push(
  `\n  If you're changing a signature, update callers too, or the build will break.\n`
);

process.stderr.write(lines.join('\n') + '\n');
// Warning only — we don't block because the signature might not actually be changing.
process.exit(0);
