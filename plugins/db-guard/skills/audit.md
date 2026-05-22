Scan the project for dangerous database patterns in existing scripts, Makefiles, and CI configs.

Arguments: $ARGUMENTS (optional: directory path, defaults to current project root)

Steps:
1. Search the project for files that could contain destructive database commands:
   - `Makefile`, `makefile`
   - `package.json` scripts section
   - `.github/workflows/*.yml`
   - `scripts/*.sh`, `scripts/*.js`, `scripts/*.ts`
   - `docker-compose.yml`, `docker-compose.*.yml`
   - `Justfile`, `Taskfile.yml`

2. For each file found, check for the following patterns:
   - `drizzle-kit push` with any force flags
   - `prisma db push --force-reset` or `prisma migrate reset`
   - `terraform destroy`
   - Bare `DROP TABLE` or `TRUNCATE` in SQL files or inline commands
   - `mongodump --drop`, `redis-cli FLUSHALL`
   - Any migration command with `--force` flag

3. Build a report:

```
db-guard audit — /path/to/project
───────────────────────────────────────────────────

⚠️  Found 3 potentially dangerous patterns:

  Makefile:12
  → make db-reset runs: prisma migrate reset --force
  → Risk: wipes the entire database schema and data

  .github/workflows/deploy.yml:47
  → CI step runs: terraform apply -auto-approve
  → Risk: auto-approve bypasses the destroy confirmation
    (safe for apply, dangerous if someone changes to destroy)

  scripts/seed.js:8
  → Truncates all tables before seeding: TRUNCATE users, orders CASCADE
  → Risk: if run against production, all data is gone

───────────────────────────────────────────────────
Recommendations:
  1. Add a RAILS_ENV / NODE_ENV guard before destructive commands
  2. Never run seed scripts against a production DATABASE_URL
  3. Add db-guard's hook to your CI environment for automated protection
```

4. If no issues found: report clean with the paths that were scanned.

5. Do not modify any files — this is read-only.
