import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, join } from 'path';
import { readFileSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { hook, bash } from './helpers.js';

const MONITOR_HOOK = resolve('plugins/token-guard/hooks/context-monitor.js');
const PATTERN_HOOK = resolve('plugins/token-guard/hooks/expensive-pattern.js');

const stateDir = join(homedir(), '.claude', 'plugins', 'token-guard');
const counterFile = join(stateDir, 'call-count.json');
const backupFile = join(stateDir, 'call-count.backup.json');

function setCallCount(count) {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(counterFile, JSON.stringify({ count, sessionStart: Date.now() }), 'utf8');
}

beforeEach(() => {
  // back up any real counter so tests don't corrupt an active session
  if (existsSync(counterFile)) {
    writeFileSync(backupFile, readFileSync(counterFile, 'utf8'), 'utf8');
  }
});

afterEach(() => {
  if (existsSync(backupFile)) {
    writeFileSync(counterFile, readFileSync(backupFile, 'utf8'), 'utf8');
    rmSync(backupFile);
  } else if (existsSync(counterFile)) {
    rmSync(counterFile);
  }
});

describe('context-monitor — thresholds', () => {
  test('no output below 30 calls', async () => {
    setCallCount(20);
    const { code, stderr } = await hook(MONITOR_HOOK, { tool_name: 'Bash', tool_input: {} });
    assert.equal(code, 0);
    assert.equal(stderr, '');
  });

  test('warns at 30 calls', async () => {
    setCallCount(29);
    const { code, stderr } = await hook(MONITOR_HOOK, { tool_name: 'Write', tool_input: {} });
    assert.equal(code, 0);
    assert.match(stderr, /compact/i);
  });

  test('stronger warning at 50 calls', async () => {
    setCallCount(49);
    const { code, stderr } = await hook(MONITOR_HOOK, { tool_name: 'Read', tool_input: {} });
    assert.equal(code, 0);
    assert.match(stderr, /compact now/i);
  });

  test('critical warning at 65 calls', async () => {
    setCallCount(64);
    const { code, stderr } = await hook(MONITOR_HOOK, { tool_name: 'Bash', tool_input: {} });
    assert.equal(code, 0);
    assert.match(stderr, /critical|immediately/i);
  });

  test('always exits 0 — never blocks', async () => {
    setCallCount(100);
    const { code } = await hook(MONITOR_HOOK, { tool_name: 'Bash', tool_input: {} });
    assert.equal(code, 0);
  });
});

describe('expensive-pattern — blocks', () => {
  test('blocks access to node_modules', async () => {
    const { code } = await hook(PATTERN_HOOK, bash('cat node_modules/some-pkg/index.js'));
    assert.equal(code, 2);
  });
});

describe('expensive-pattern — warnings', () => {
  const warned = [
    'cat error.log',
    'cat dump.sql',
    'git log',
    'git log --all',
    'find . -name "*.js"',
    'find . -type f',
    'npm list',
    'pip list',
  ];

  for (const cmd of warned) {
    test(`warns: ${cmd}`, async () => {
      const { code, stderr } = await hook(PATTERN_HOOK, bash(cmd));
      assert.equal(code, 0);
      assert.match(stderr, /token-guard warning/);
    });
  }
});

describe('expensive-pattern — safe commands', () => {
  const safe = [
    'git log --oneline -20',
    'git log --since="1 week ago"',
    'find . -name "*.ts" -maxdepth 3',
    'npm list --depth=0',
    'cat src/index.ts',
    'npm run build',
    'npx tsc --noEmit',
  ];

  for (const cmd of safe) {
    test(`allows: ${cmd}`, async () => {
      const { code } = await hook(PATTERN_HOOK, bash(cmd));
      assert.equal(code, 0);
    });
  }
});
