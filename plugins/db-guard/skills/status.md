Show db-guard's current protection status and what it will block.

Arguments: $ARGUMENTS (optional: "detail" to include full blocklist)

Steps:
1. Check if db-guard hooks are active: read `~/.claude/settings.json` and confirm the PreToolUse Bash hook for db-guard is present.

2. Check the current project's database environment:
   - Look for `.env`, `.env.local`, `.env.production` in the current directory
   - Look for `DATABASE_URL` or similar connection strings
   - Determine if a production host is detected (railway.app, rds.amazonaws.com, supabase.co, neon.tech, planetscale.com)

3. Display status report:
```
db-guard status
───────────────────────────────────────
Hook:        active
Environment: PRODUCTION detected (railway.app)
Project:     /path/to/current/project

Hard blocks (require terminal confirmation):
  drizzle-kit push --force
  prisma db push --force-reset
  prisma migrate reset
  terraform destroy
  DROP TABLE / TRUNCATE TABLE
  redis-cli FLUSHALL/FLUSHDB
  flyway clean / pulumi destroy / cdk destroy

Soft warnings (let through with stderr notice):
  drizzle-kit push (no force flag)
  prisma db push
  UPDATE without WHERE clause
  ALTER TABLE ... DROP COLUMN
```

4. If environment is production: show a prominent warning banner.

5. If hooks are not active: explain that the plugin may need reinstalling and show the manual install command.
