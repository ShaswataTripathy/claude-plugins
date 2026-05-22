import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, join } from 'path';
import { hook, tempDir, write } from './helpers.js';

const HOOK = resolve('plugins/api-guard/hooks/contract-check.js');

const TS_WITH_EXPORTS = `
export async function getUserById(id: string): Promise<User | null> {
  return db.query('SELECT * FROM users WHERE id = $1', [id]);
}

export type UserRole = 'admin' | 'member';
export const DEFAULT_ROLE: UserRole = 'member';
`;

const TS_CALLER = `
import { getUserById, DEFAULT_ROLE } from '../db/users';

export async function getProfile(req, res) {
  const user = await getUserById(req.params.id);
  res.json(user);
}
`;

describe('api-guard — exported file with callers', () => {
  test('emits a warning when callers exist', async () => {
    const td = tempDir({
      'src/db/users.ts': TS_WITH_EXPORTS,
      'src/routes/profile.ts': TS_CALLER,
    });

    try {
      const { code, stderr } = await hook(
        HOOK,
        write(join(td.path, 'src/db/users.ts'), TS_WITH_EXPORTS),
        { cwd: td.path }
      );
      // Warning only — never blocks
      assert.equal(code, 0);
      assert.match(stderr, /api-guard/);
    } finally {
      td.cleanup();
    }
  });

  test('exit 0 when no callers found', async () => {
    const td = tempDir({
      'src/db/users.ts': TS_WITH_EXPORTS,
      // no callers
    });

    try {
      const { code } = await hook(
        HOOK,
        write(join(td.path, 'src/db/users.ts'), TS_WITH_EXPORTS),
        { cwd: td.path }
      );
      assert.equal(code, 0);
    } finally {
      td.cleanup();
    }
  });
});

describe('api-guard — non-checkable files', () => {
  const skipped = [
    ['styles.css', ''],
    ['README.md', '# hello'],
    ['data.json', '{}'],
    ['Makefile', 'build:\n\tnpm run build'],
  ];

  for (const [name, content] of skipped) {
    test(`skips: ${name}`, async () => {
      const { code, stderr } = await hook(HOOK, write(`/some/path/${name}`, content));
      assert.equal(code, 0);
      assert.equal(stderr, '');
    });
  }
});

describe('api-guard — non-exported file', () => {
  test('no warning for file with no exports', async () => {
    const td = tempDir({
      'src/internal/helper.ts': `
function formatDate(d: Date) { return d.toISOString(); }
const MAX_RETRIES = 3;
`,
    });

    try {
      const { code, stderr } = await hook(
        HOOK,
        write(join(td.path, 'src/internal/helper.ts'), 'function formatDate(d: Date) { return d.toISOString(); }'),
        { cwd: td.path }
      );
      assert.equal(code, 0);
      assert.equal(stderr, '');
    } finally {
      td.cleanup();
    }
  });
});

describe('api-guard — Edit tool events', () => {
  test('warns when Edit renames an exported function that has callers', async () => {
    const td = tempDir({
      'src/db/users.ts': TS_WITH_EXPORTS,
      'src/routes/profile.ts': TS_CALLER,
    });

    try {
      const editInput = {
        tool_name: 'Edit',
        tool_input: {
          file_path: join(td.path, 'src/db/users.ts'),
          old_string: 'async function getUserById',
          new_string: 'async function findUserById',
        },
      };
      const { code, stderr } = await hook(HOOK, editInput, { cwd: td.path });
      assert.equal(code, 0);
      assert.match(stderr, /api-guard/);
    } finally {
      td.cleanup();
    }
  });

  test('exits clean for Edit on file with no callers', async () => {
    const td = tempDir({
      'src/db/users.ts': TS_WITH_EXPORTS,
    });

    try {
      const editInput = {
        tool_name: 'Edit',
        tool_input: {
          file_path: join(td.path, 'src/db/users.ts'),
          old_string: 'async function getUserById',
          new_string: 'async function findUserById',
        },
      };
      const { code } = await hook(HOOK, editInput, { cwd: td.path });
      assert.equal(code, 0);
    } finally {
      td.cleanup();
    }
  });
});

describe('api-guard — edge cases', () => {
  test('missing file_path exits clean', async () => {
    const { code } = await hook(HOOK, { tool_name: 'Write', tool_input: {} });
    assert.equal(code, 0);
  });

  test('new file that does not exist yet exits clean', async () => {
    const { code } = await hook(HOOK, write('/nonexistent/path/new-file.ts', 'export const x = 1;'));
    assert.equal(code, 0);
  });
});
