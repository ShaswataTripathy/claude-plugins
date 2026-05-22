#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, relative } from 'path';
import { homedir } from 'os';

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = input?.tool_input?.file_path ?? input?.tool_input?.path ?? '';

if (!filePath) process.exit(0);

const scopeFile = join(homedir(), '.claude', 'plugins', 'scope-guard', 'current-scope.json');

// No scope defined — pass everything through. scope-guard is opt-in per task.
if (!existsSync(scopeFile)) process.exit(0);

let scope;
try {
  scope = JSON.parse(readFileSync(scopeFile, 'utf8'));
} catch {
  process.exit(0);
}

// Scope expires after 4 hours to avoid stale rules blocking unrelated sessions
const FOUR_HOURS = 4 * 60 * 60 * 1000;
if (scope.createdAt && Date.now() - scope.createdAt > FOUR_HOURS) {
  process.exit(0);
}

const abs = resolve(filePath);
const cwd = process.cwd();

// One-time override written by /scope-allow — consume it and exit clean
if (scope.oneTimeOverride) {
  delete scope.oneTimeOverride;
  writeFileSync(scopeFile, JSON.stringify(scope, null, 2), 'utf8');
  process.exit(0);
}

const allowed = (scope.allowedPaths ?? []).map((p) => resolve(join(cwd, p)));
const blocked = (scope.blockedPaths ?? []).map((p) => resolve(join(cwd, p)));

const isBlocked = blocked.some((b) => abs.startsWith(b));
if (isBlocked) {
  process.stderr.write(
    `\n  scope-guard blocked: "${relative(cwd, abs)}" is in an explicitly blocked path.\n` +
    `  Active scope: "${scope.description ?? 'unnamed'}"\n` +
    `  Run /scope-allow to override for this operation.\n\n`
  );
  process.exit(2);
}

if (allowed.length > 0) {
  const isAllowed = allowed.some((a) => abs.startsWith(a));
  if (!isAllowed) {
    process.stderr.write(
      `\n  scope-guard blocked: "${relative(cwd, abs)}" is outside the current task scope.\n` +
      `  Allowed paths: ${scope.allowedPaths.join(', ')}\n` +
      `  Run /scope-allow to override or /scope-add <path> to expand scope.\n\n`
    );
    process.exit(2);
  }
}

process.exit(0);
