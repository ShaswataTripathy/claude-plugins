#!/usr/bin/env node
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const input = JSON.parse(readFileSync(0, 'utf8'));
const cmd = input?.tool_input?.command ?? '';

if (!cmd) process.exit(0);

// Require --force-with-lease so remote commits can't be silently overwritten
if (/git\s+push\b.*--force(?!-with-lease)/.test(cmd)) {
  process.stderr.write(
    '\n  git-workflow blocked: use --force-with-lease instead of --force.\n' +
    '  --force can silently overwrite remote commits pushed by others.\n\n'
  );
  process.exit(2);
}

// Block direct commits to protected branches
if (/git\s+commit\b/.test(cmd)) {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (/^(main|master|develop|staging|production)$/.test(branch)) {
      process.stderr.write(
        `\n  git-workflow blocked: direct commit to '${branch}'.\n` +
        `  Use a feature branch. If this is intentional, run the command directly in your terminal.\n\n`
      );
      process.exit(2);
    }
  } catch {
    // not in a git repo — allow
  }
}

process.exit(0);
