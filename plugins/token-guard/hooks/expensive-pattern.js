#!/usr/bin/env node
import { readFileSync } from 'fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const cmd = input?.tool_input?.command ?? '';

if (!cmd) process.exit(0);

// Patterns that have caused accidental context explosions.
// Each entry has a pattern, a reason, and whether to hard-block or just warn.
const EXPENSIVE = [
  {
    pattern: /\bcat\b.+\.(log|txt|csv|json|sql)\b/,
    reason: 'Reading large files with cat dumps the entire content into context. Use head, tail, or grep instead.',
    block: false,
  },
  {
    pattern: /\bgit log\b(?!.*(?:--oneline|--max-count|-n\s*\d|--since))/,
    reason: 'git log without --oneline or --max-count can output thousands of lines. Add --oneline -20 or similar.',
    block: false,
  },
  {
    pattern: /\bfind\s+\.?\s+-(?:name|type|iname)\b(?!.*-maxdepth)/,
    reason: 'find without -maxdepth on large repos can recurse into node_modules and output thousands of paths.',
    block: false,
  },
  {
    pattern: /node_modules/,
    reason: 'Reading anything inside node_modules floods context with irrelevant output.',
    block: true,
  },
  {
    pattern: /\bnpm\s+list\b(?!\s+--depth=0)/,
    reason: 'npm list without --depth=0 outputs the full dependency tree. Add --depth=0 to limit output.',
    block: false,
  },
  {
    pattern: /\bpip\s+list\b/,
    reason: 'pip list dumps all installed packages. Pipe through grep if you\'re looking for something specific.',
    block: false,
  },
];

for (const { pattern, reason, block } of EXPENSIVE) {
  if (!pattern.test(cmd)) continue;

  if (block) {
    process.stderr.write(`\n  token-guard blocked: ${reason}\n\n`);
    process.exit(2);
  }

  process.stderr.write(`\n  token-guard warning: ${reason}\n\n`);
  break;
}

process.exit(0);
