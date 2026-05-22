#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// We can't read the actual token count from a hook, so we track tool call count
// as a proxy. Empirically, 30 calls ≈ 60% fill, 50 ≈ 80%, 70 ≈ 95% on a
// typical session with mixed read/write operations.

const stateDir = join(homedir(), '.claude', 'plugins', 'token-guard');
const counterFile = join(stateDir, 'call-count.json');

if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });

function readCounter() {
  if (!existsSync(counterFile)) return { count: 0, sessionStart: Date.now() };
  try {
    return JSON.parse(readFileSync(counterFile, 'utf8'));
  } catch {
    return { count: 0, sessionStart: Date.now() };
  }
}

const state = readCounter();

// Reset if this looks like a new session (>6 hours since last call)
const SIX_HOURS = 6 * 60 * 60 * 1000;
if (Date.now() - state.sessionStart > SIX_HOURS) {
  state.count = 0;
  state.sessionStart = Date.now();
}

state.count += 1;
writeFileSync(counterFile, JSON.stringify(state), 'utf8');

const n = state.count;

if (n === 30) {
  process.stderr.write(
    `\n  token-guard: ~60% context fill estimated (${n} tool calls this session).\n` +
    `  Consider running /compact soon to keep your session healthy.\n\n`
  );
} else if (n === 50) {
  process.stderr.write(
    `\n  token-guard: ~80% context fill estimated (${n} tool calls this session).\n` +
    `  Run /compact now to avoid hitting your limit mid-task.\n\n`
  );
} else if (n === 65) {
  process.stderr.write(
    `\n  token-guard: ~95% context fill estimated (${n} tool calls this session).\n` +
    `  ⚠️  Run /compact or /clear immediately — the next few calls may fail.\n\n`
  );
}

process.exit(0);
