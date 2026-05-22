import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, join } from 'path';
import { readFileSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { hook, tempDir, write } from './helpers.js';

const HOOK = resolve('plugins/scope-guard/hooks/enforce.js');
const scopeFile = join(homedir(), '.claude', 'plugins', 'scope-guard', 'current-scope.json');
const scopeDir = join(homedir(), '.claude', 'plugins', 'scope-guard');

function writeScope(scope) {
  mkdirSync(scopeDir, { recursive: true });
  writeFileSync(scopeFile, JSON.stringify({ createdAt: Date.now(), ...scope }, null, 2), 'utf8');
}

function clearScope() {
  if (existsSync(scopeFile)) rmSync(scopeFile);
}

afterEach(clearScope);

describe('scope-guard — no scope defined', () => {
  test('allows any write when no scope file exists', async () => {
    clearScope();
    const { code } = await hook(HOOK, write('/some/random/path/file.ts'));
    assert.equal(code, 0);
  });
});

describe('scope-guard — allowed paths', () => {
  test('allows write inside allowed path', async () => {
    const td = tempDir();
    writeScope({ description: 'fix auth', allowedPaths: ['src/auth'] });
    try {
      const { code } = await hook(HOOK, write(join(td.path, 'src/auth/login.ts')), { cwd: td.path });
      assert.equal(code, 0);
    } finally {
      td.cleanup();
    }
  });

  test('blocks write outside allowed path', async () => {
    const td = tempDir();
    writeScope({ description: 'fix auth', allowedPaths: ['src/auth'] });
    try {
      const { code, stderr } = await hook(HOOK, write(join(td.path, 'src/user/profile.ts')), { cwd: td.path });
      assert.equal(code, 2);
      assert.match(stderr, /outside the current task scope/);
    } finally {
      td.cleanup();
    }
  });
});

describe('scope-guard — blocked paths', () => {
  test('blocks write to an explicitly blocked path', async () => {
    const td = tempDir();
    writeScope({ description: 'frontend only', blockedPaths: ['src/db'] });
    try {
      const { code, stderr } = await hook(HOOK, write(join(td.path, 'src/db/migrations.ts')), { cwd: td.path });
      assert.equal(code, 2);
      assert.match(stderr, /explicitly blocked path/);
    } finally {
      td.cleanup();
    }
  });

  test('allows write to non-blocked path when only blockedPaths set', async () => {
    const td = tempDir();
    writeScope({ blockedPaths: ['src/db'] });
    try {
      const { code } = await hook(HOOK, write(join(td.path, 'src/components/Button.tsx')), { cwd: td.path });
      assert.equal(code, 0);
    } finally {
      td.cleanup();
    }
  });
});

describe('scope-guard — expiry', () => {
  test('ignores an expired scope (>4 hours old)', async () => {
    const td = tempDir();
    const FIVE_HOURS_AGO = Date.now() - 5 * 60 * 60 * 1000;
    writeScope({ description: 'old task', allowedPaths: ['src/auth'], createdAt: FIVE_HOURS_AGO });
    try {
      // would normally be blocked, but scope is expired
      const { code } = await hook(HOOK, write(join(td.path, 'src/user/profile.ts')), { cwd: td.path });
      assert.equal(code, 0);
    } finally {
      td.cleanup();
    }
  });
});

describe('scope-guard — one-time override', () => {
  test('allows write and removes override flag', async () => {
    const td = tempDir();
    writeScope({ description: 'fix auth', allowedPaths: ['src/auth'], oneTimeOverride: true });
    try {
      const { code } = await hook(HOOK, write(join(td.path, 'src/user/profile.ts')), { cwd: td.path });
      assert.equal(code, 0);

      // flag should be gone now
      const remaining = JSON.parse(readFileSync(scopeFile, 'utf8'));
      assert.equal(remaining.oneTimeOverride, undefined);
    } finally {
      td.cleanup();
    }
  });
});

describe('scope-guard — edge cases', () => {
  test('no file_path in input exits clean', async () => {
    writeScope({ allowedPaths: ['src/auth'] });
    const { code } = await hook(HOOK, { tool_name: 'Write', tool_input: {} });
    assert.equal(code, 0);
  });

  test('corrupt scope file exits clean', async () => {
    mkdirSync(scopeDir, { recursive: true });
    writeFileSync(scopeFile, 'not valid json', 'utf8');
    const { code } = await hook(HOOK, write('/any/file.ts'));
    assert.equal(code, 0);
  });
});

