import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, join } from 'path';
import { hook, tempDir, write } from './helpers.js';

const HOOK = resolve('plugins/context-doctor/hooks/size-monitor.js');

function lines(n) {
  return Array.from({ length: n }, (_, i) => `# Rule ${i + 1}: do the right thing`).join('\n');
}

describe('context-doctor — size warnings', () => {
  test('no warning for a small CLAUDE.md', async () => {
    const td = tempDir({ 'CLAUDE.md': lines(50) });
    try {
      const { code, stderr } = await hook(HOOK, write(join(td.path, 'CLAUDE.md'), lines(50)), { cwd: td.path });
      assert.equal(code, 0);
      assert.equal(stderr, '');
    } finally {
      td.cleanup();
    }
  });

  test('watch-level notice at 160 lines', async () => {
    const td = tempDir({ 'CLAUDE.md': lines(160) });
    try {
      const { code, stderr } = await hook(HOOK, write(join(td.path, 'CLAUDE.md'), lines(160)), { cwd: td.path });
      assert.equal(code, 0);
      assert.match(stderr, /getting large|skills/i);
    } finally {
      td.cleanup();
    }
  });

  test('critical warning at 260 lines', async () => {
    const td = tempDir({ 'CLAUDE.md': lines(260) });
    try {
      const { code, stderr } = await hook(HOOK, write(join(td.path, 'CLAUDE.md'), lines(260)), { cwd: td.path });
      assert.equal(code, 0);
      assert.match(stderr, /context-doctor/);
      assert.match(stderr, /260 lines/);
    } finally {
      td.cleanup();
    }
  });

  test('never blocks — always exits 0', async () => {
    const td = tempDir({ 'CLAUDE.md': lines(500) });
    try {
      const { code } = await hook(HOOK, write(join(td.path, 'CLAUDE.md'), lines(500)), { cwd: td.path });
      assert.equal(code, 0);
    } finally {
      td.cleanup();
    }
  });
});

describe('context-doctor — non-context files', () => {
  const ignored = [
    'src/index.ts',
    'package.json',
    'README.md',
    '.env',
    'src/components/Button.tsx',
  ];

  for (const f of ignored) {
    test(`ignores: ${f}`, async () => {
      const { code, stderr } = await hook(HOOK, write(f, lines(500)));
      assert.equal(code, 0);
      assert.equal(stderr, '');
    });
  }
});

describe('context-doctor — edge cases', () => {
  test('no file_path exits clean', async () => {
    const { code } = await hook(HOOK, { tool_name: 'Write', tool_input: {} });
    assert.equal(code, 0);
  });

  test('file does not exist yet exits clean', async () => {
    const { code } = await hook(HOOK, write('/nonexistent/CLAUDE.md'));
    assert.equal(code, 0);
  });
});
