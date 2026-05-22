import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'path';
import { hook, tempDir, bash } from './helpers.js';

const HOOK = resolve('plugins/db-guard/hooks/intercept.js');

describe('db-guard — hard blocks', () => {
  const cases = [
    ['drizzle-kit push --force',                    'drizzle-kit push --force'],
    ['npx drizzle-kit push --accept-data-loss',     'drizzle-kit push --force'],
    ['prisma db push --force-reset',                'prisma db push --force-reset'],
    ['npx prisma migrate reset',                    'prisma db push --force-reset'],
    ['terraform destroy',                           'terraform destroy'],
    ['terraform apply -destroy',                    'terraform destroy'],
    ['pulumi destroy',                              'pulumi destroy'],
    ['cdk destroy',                                 'cdk destroy'],
    ['flyway clean',                                'flyway clean'],
    ['redis-cli FLUSHALL',                          'redis-cli FLUSH*'],
    ['redis-cli FLUSHDB',                           'redis-cli FLUSH*'],
    ['mongodump --drop',                            'mongodump --drop'],
    ['mongosh --drop',                              'mongodump --drop'],
    ['knex migrate:rollback --all',                 'knex migrate:rollback --all'],
    ['psql -c "DROP TABLE users"',                  'destructive SQL'],
    ['psql -c "TRUNCATE TABLE orders"',             'destructive SQL'],
    ['mysql -e "DROP DATABASE myapp"',              'destructive SQL'],
  ];

  for (const [cmd] of cases) {
    test(`blocks: ${cmd}`, async () => {
      const { code } = await hook(HOOK, bash(cmd));
      assert.equal(code, 2, `expected exit 2 for: ${cmd}`);
    });
  }
});

describe('db-guard — soft warnings', () => {
  const cases = [
    'npx drizzle-kit push',
    'prisma db push',
    'knex migrate:rollback',
    'UPDATE users SET active=false',
    'ALTER TABLE orders DROP COLUMN legacy_id',
  ];

  for (const cmd of cases) {
    test(`warns and allows: ${cmd}`, async () => {
      const { code, stderr } = await hook(HOOK, bash(cmd));
      assert.equal(code, 0, `expected exit 0 for: ${cmd}`);
      assert.match(stderr, /db-guard warning/);
    });
  }
});

describe('db-guard — safe commands', () => {
  const safe = [
    'npm run dev',
    'git status',
    'prisma generate',
    'prisma migrate dev',
    'prisma studio',
    'drizzle-kit generate',
    'terraform plan',
    'terraform apply',
    'SELECT * FROM users WHERE id = 1',
    'UPDATE users SET name = $1 WHERE id = $2',
  ];

  for (const cmd of safe) {
    test(`allows: ${cmd}`, async () => {
      const { code } = await hook(HOOK, bash(cmd));
      assert.equal(code, 0, `expected exit 0 for: ${cmd}`);
    });
  }
});

describe('db-guard — production detection', () => {
  test('escalates warning when prod DB URL found in .env', async () => {
    const td = tempDir({
      '.env': 'DATABASE_URL=postgres://user:pass@app.railway.app:5432/mydb',
    });

    try {
      const { code, stderr } = await hook(HOOK, bash('drizzle-kit push'), { cwd: td.path });
      assert.equal(code, 0);
      assert.match(stderr, /PRODUCTION/i);
    } finally {
      td.cleanup();
    }
  });

  test('blocks hard with prod banner when .env has RDS endpoint', async () => {
    const td = tempDir({
      '.env': 'DATABASE_URL=postgres://admin:secret@myapp.xyz.us-east-1.rds.amazonaws.com:5432/prod',
    });

    try {
      const { code, stderr } = await hook(HOOK, bash('terraform destroy'), { cwd: td.path });
      assert.equal(code, 2);
      assert.match(stderr, /PRODUCTION/i);
    } finally {
      td.cleanup();
    }
  });

  test('no prod banner for localhost DB', async () => {
    const td = tempDir({
      '.env': 'DATABASE_URL=postgres://user:pass@localhost:5432/myapp_dev',
    });

    try {
      const { code, stderr } = await hook(HOOK, bash('drizzle-kit push'), { cwd: td.path });
      assert.equal(code, 0);
      assert.doesNotMatch(stderr, /PRODUCTION/i);
    } finally {
      td.cleanup();
    }
  });
});

describe('db-guard — edge cases', () => {
  test('empty command exits clean', async () => {
    const { code } = await hook(HOOK, bash(''));
    assert.equal(code, 0);
  });

  test('non-Bash tool input exits clean', async () => {
    const { code } = await hook(HOOK, { tool_name: 'Write', tool_input: { file_path: 'foo.ts' } });
    assert.equal(code, 0);
  });

  test('malformed input exits clean', async () => {
    const { code } = await hook(HOOK, { tool_name: 'Bash' });
    assert.equal(code, 0);
  });
});
