#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const cmd = input?.tool_input?.command ?? '';

if (!cmd) process.exit(0);

// ─── Tier 1: hard block — these have wiped production databases in the wild ──

const HARD_BLOCKS = [
  { pattern: /drizzle-kit\s+push(?:.*--force|.*--accept-data-loss)/i,     label: 'drizzle-kit push --force' },
  { pattern: /prisma\s+(db\s+push\s+--force-reset|migrate\s+reset)/i,     label: 'prisma db push --force-reset / migrate reset' },
  { pattern: /terraform\s+(destroy|apply\s+-destroy)/i,                   label: 'terraform destroy' },
  { pattern: /\b(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE)\b/i,    label: 'destructive SQL (DROP / TRUNCATE)' },
  { pattern: /mongo(?:sh|dump).*--drop/i,                                 label: 'mongodump --drop' },
  { pattern: /redis-cli\s+FLUSH(?:ALL|DB)/i,                              label: 'redis-cli FLUSH*' },
  { pattern: /knex\s+migrate:rollback\s+--all/i,                          label: 'knex migrate:rollback --all' },
  { pattern: /flyway\s+clean/i,                                           label: 'flyway clean' },
  { pattern: /pulumi\s+destroy/i,                                         label: 'pulumi destroy' },
  { pattern: /cdk\s+destroy/i,                                            label: 'cdk destroy' },
];

// ─── Tier 2: warn but allow through ──────────────────────────────────────────

const SOFT_WARNS = [
  { pattern: /drizzle-kit\s+push(?!\s*--force)/i,                        label: 'drizzle-kit push (no force flag, but still mutates schema)' },
  { pattern: /prisma\s+db\s+push(?!\s*--force-reset)/i,                  label: 'prisma db push' },
  { pattern: /knex\s+migrate:rollback(?!\s*--all)/i,                     label: 'knex migrate:rollback' },
  { pattern: /UPDATE\s+\w+\s+SET\s+(?!.*WHERE\b)/i,                      label: 'UPDATE without WHERE clause' },
  { pattern: /ALTER\s+TABLE\s+\w+\s+DROP\s+COLUMN/i,                     label: 'ALTER TABLE ... DROP COLUMN' },
];

// ─── Production database detection ───────────────────────────────────────────
// Railway, RDS, and Supabase endpoints are almost always production.
// Localhost and dev-named hosts are almost always safe.

function looksLikeProduction() {
  const envFiles = ['.env', '.env.local', '.env.production'];
  for (const f of envFiles) {
    if (!existsSync(join(process.cwd(), f))) continue;
    const content = readFileSync(join(process.cwd(), f), 'utf8');
    if (/rds\.amazonaws\.com|railway\.app|supabase\.co|neon\.tech|planetscale\.com/i.test(content)) {
      return true;
    }
    if (/DATABASE_URL=.*?(prod|production|live)/i.test(content)) {
      return true;
    }
  }
  return false;
}

const isProd = looksLikeProduction();

for (const { pattern, label } of HARD_BLOCKS) {
  if (!pattern.test(cmd)) continue;

  const prodBanner = isProd ? '\n  ⚠️  PRODUCTION DATABASE DETECTED in .env\n' : '';
  process.stderr.write(
    `\n  db-guard blocked: ${label}${prodBanner}\n` +
    `  This command can cause irreversible data loss.\n` +
    `  To run it anyway, execute it directly in your terminal.\n\n`
  );
  process.exit(2);
}

for (const { pattern, label } of SOFT_WARNS) {
  if (!pattern.test(cmd)) continue;

  const prodBanner = isProd ? '  ⚠️  PRODUCTION DATABASE DETECTED in .env\n' : '';
  process.stderr.write(
    `\n  db-guard warning: ${label}\n` +
    `${prodBanner}` +
    `  Review the command carefully before it runs.\n\n`
  );
  // exit 0 — warn only, let it through
  break;
}

process.exit(0);
