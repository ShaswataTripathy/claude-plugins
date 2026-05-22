# claude-plugins

> The safety layer Claude Code doesn't ship with.

```bash
npx claude-plugins install db-guard
npx claude-plugins install token-guard
```

Most Claude Code plugin repos give you more slash commands. This one gives you **enforcement** — hooks that run whether you ask Claude to or not, protecting against the failure modes that actually hurt people.

---

## Why this exists

Claude Code is powerful. It's also a capable assistant that optimizes for completing the task, without awareness of consequences. A few things that have happened in the wild:

- A `drizzle-kit push --force` wiped every table in a production PostgreSQL database. Months of data. Unrecoverable.
- A `terraform destroy` deleted DataTalks.Club's infrastructure serving 100,000 students. 2.5 years of submissions gone in seconds.
- Developers on the $200/month Max plan hitting usage limits in 19 minutes with no warning until the wall appears.
- Claude refactoring a function signature and missing 6 callers — build breaks silently on the next CI run.

These aren't edge cases. They're documented incidents. This repo is the guard layer.

---

## Quick Start

```bash
# Browse all plugins
npx claude-plugins search

# Install any plugin
npx claude-plugins install <name>

# See what's installed
npx claude-plugins list

# Remove a plugin
npx claude-plugins uninstall <name>
```

---

## Safety plugins

### `db-guard` — Destructive database and infrastructure interceptor

Blocks commands that have wiped production databases before they execute.

```bash
npx claude-plugins install db-guard
```

**What it intercepts:**

| Command | Action |
|---------|--------|
| `drizzle-kit push --force` | Hard block |
| `prisma db push --force-reset` / `migrate reset` | Hard block |
| `terraform destroy` / `pulumi destroy` / `cdk destroy` | Hard block |
| `DROP TABLE` / `TRUNCATE TABLE` / raw SQL | Hard block |
| `redis-cli FLUSHALL` / `mongodump --drop` | Hard block |
| `drizzle-kit push` (no force, but still mutates) | Warning |
| `UPDATE` without `WHERE` clause | Warning |
| `ALTER TABLE ... DROP COLUMN` | Warning |

When a production database URL is detected in `.env` (Railway, RDS, Supabase, Neon, PlanetScale), all warnings escalate to hard blocks.

**Slash commands:** `/db-guard-status`, `/db-guard-audit`

---

### `token-guard` — Proactive session burn prevention

Stops you from hitting your usage limit mid-task.

```bash
npx claude-plugins install token-guard
```

The `ccusage` dashboard tells you how much you burned. token-guard tells you **before** you burn it. Hooks fire after every tool call and before expensive operations, so you get a warning while there's still time to act.

Thresholds (based on tool call count as a context fill proxy):
- 30 calls → "Consider /compact soon"
- 50 calls → "Run /compact now"  
- 65 calls → "⚠️ Critical — next calls may fail"

Also intercepts known context-exploding patterns before they run: `cat` on large files, `git log` without count limits, anything touching `node_modules`, `find` without `-maxdepth`.

**Slash commands:** `/token-status`, `/token-estimate <task>`, `/token-report`

---

### `scope-guard` — Hook-enforced task scope boundaries

CLAUDE.md instructions work 70% of the time. Hooks work 100%.

```bash
npx claude-plugins install scope-guard
```

Set a scope at the start of a task. Any write outside that scope is blocked at the filesystem level before it happens.

```
/scope-set fix the login bug in src/auth/
```

After that, any attempt to write to `src/user/profile.ts` or any other path gets blocked with a clear explanation. You can `/scope-allow` for a one-time exception or `/scope-add <path>` to expand the boundary.

Scope definitions expire after 4 hours automatically.

**Slash commands:** `/scope-set`, `/scope-status`, `/scope-allow`, and auto-expiry

---

### `api-guard` — API contract integrity checker

Catches broken callers before the file is saved.

```bash
npx claude-plugins install api-guard
```

Every time Claude writes to a file that contains exported symbols, api-guard greps the codebase for callers. If your refactored function has 6 callers across 4 files, you see them in the warning — before the write completes, not after the CI run fails.

Supports TypeScript, JavaScript, Python, and Go exports.

**Slash commands:** `/api-check <symbol>`, `/api-diff`

---

## Productivity plugins

### `monorepo-setup` — Auto-generate nested CLAUDE.md files

Claude edits the wrong package in your monorepo because it doesn't know your workspace boundaries. This generates the right CLAUDE.md files automatically.

```bash
npx claude-plugins install monorepo-setup
```

Run `/monorepo-init` from your repo root. It reads your `nx.json`, `turbo.json`, `pnpm-workspace.yaml`, or `package.json` workspaces, maps every package, and generates:

- A root `CLAUDE.md` with a package map and cross-package import rules
- A per-package `CLAUDE.md` for every workspace with scope boundaries, correct import patterns, and the right build/test commands

What previously took an hour of manual setup takes 10 seconds.

Supports: Nx, Turborepo, pnpm workspaces, npm/Yarn workspaces, Lerna, Go modules, Rust workspaces.

**Slash commands:** `/monorepo-init`, `/monorepo-add <path>`, `/monorepo-audit`

---

### `context-doctor` — CLAUDE.md health auditor and optimizer

Context rot is what happens when your CLAUDE.md grows to 300 lines and Claude stops following half of it.

```bash
npx claude-plugins install context-doctor
```

Every line in CLAUDE.md costs tokens on every single message — whether it's relevant to the current task or not. Claude also loses track of instructions past line 200. So a 300-line CLAUDE.md burns 2,400 extra tokens per session and only half of it is being followed.

context-doctor audits all your context files, scores them, identifies bloat and duplicates, and applies fixes: moving sections to skills (load-on-demand vs. always-loaded), pruning stale entries, removing duplicate rules.

A hook fires whenever you modify a CLAUDE.md or skill file and warns if it crosses the size threshold.

**Slash commands:** `/context-doctor`, `/context-doctor fix`

---

## Workflow plugins

### `git-workflow` v2 — 8 git commands with safety hooks

```bash
npx claude-plugins install git-workflow
```

| Command | Does |
|---------|------|
| `/commit` | Conventional commit with auto-detected scope, ticket linking, breaking change detection |
| `/branch` | Creates branches from GitHub issue titles, sets upstream automatically |
| `/cleanup` | Detects squash-merged branches, checks for open PRs before deleting |
| `/sync` | Rebase or merge with upstream, auto-stashes dirty state, handles conflicts |
| `/undo` | Safe reset with clear distinction between local and pushed commits |
| `/stash` | Named stash management with previews and conflict handling |
| `/log` | Filtered history with bug archaeology mode (`-S` search) |
| `/fixup` | Interactive history cleanup before merge — squash, reorder, drop |

Hooks block `git push --force` (requires `--force-with-lease`) and block direct commits to `main`/`master`/`develop`.

---

### `code-review` — Deep diff analysis

```bash
npx claude-plugins install code-review
```

**Commands:** `/review`, `/security`

Reviews staged changes or a PR diff across correctness, security, performance, and maintainability. `/security` does a focused OWASP Top 10 scan.

---

### `docker-debug` — Container diagnostics

```bash
npx claude-plugins install docker-debug
```

**Commands:** `/diagnose`, `/compose`

Reads container logs, exit codes, and stats to find root causes. `/compose` audits your docker-compose.yml for missing healthchecks, exposed secrets, and `latest` tags.

---

## How plugins work

Claude Code supports three extension points:

**Slash commands (Skills)** — Markdown files in `~/.claude/commands/` that define how Claude responds to `/command-name`. Skills are instructions; they work most of the time.

**Hooks** — Shell scripts that run on Claude Code events (`PreToolUse`, `PostToolUse`, `SessionStart`). Hooks are enforcement; they run every time, without exception. Exit code `2` blocks the operation. Exit code `0` allows it through.

**MCP Servers** — External tool servers Claude can call. Not used in this repo currently.

`claude-plugins` installs all three automatically and writes the correct entries to `~/.claude/settings.json`.

---

## Scopes

```bash
# Global (default) — active in every project
npx claude-plugins install db-guard

# Project-local — only active in this directory
npx claude-plugins install scope-guard --project
```

---

## Writing a plugin

A plugin is a directory with a manifest and optional `skills/` and `hooks/` folders.

**Minimal plugin:**

```
my-plugin/
├── plugin.json
└── skills/
    └── my-command.md
```

**`plugin.json`:**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Does something useful",
  "author": "your-github-username",
  "components": ["skill"],
  "skills": ["my-command.md"]
}
```

**Plugin with a hook:**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "...",
  "components": ["skill", "hook"],
  "skills": ["my-command.md"],
  "hookFiles": ["my-hook.js"],
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node \"{plugin_dir}/hooks/my-hook.js\"" }]
      }
    ]
  }
}
```

The `{plugin_dir}` placeholder is resolved to the actual installed path during installation.

**Hook script basics:**

```javascript
#!/usr/bin/env node
import { readFileSync } from 'fs';

// fd 0 works on Windows and Unix
const input = JSON.parse(readFileSync(0, 'utf8'));
const cmd = input?.tool_input?.command ?? '';

// exit 2 = block, exit 0 = allow
if (/something-dangerous/.test(cmd)) {
  process.stderr.write('my-plugin: blocked because reason\n');
  process.exit(2);
}
process.exit(0);
```

### Submitting to the registry

1. Fork this repo
2. Add your plugin under `plugins/your-plugin-name/`
3. Add an entry to `registry.json`
4. Open a PR

Hooks are reviewed carefully — they run automatically in every session.

---

## FAQ

**Does this work on Windows?**
Yes. Hook scripts use `readFileSync(0, 'utf8')` (fd 0) instead of `/dev/stdin`, which works on Windows, macOS, and Linux.

**Will db-guard block my local dev workflow?**
Only Tier 1 commands (the ones that have wiped production data in documented incidents) are hard-blocked. Everything else is a stderr warning you can read and proceed past.

**What if I need to run a blocked command?**
Run it directly in your terminal, outside Claude Code. The hooks only intercept commands Claude attempts to execute.

**Is it safe to install hooks from this repo?**
All hooks are open source and reviewed before registry inclusion. Read the hook source before installing — it's always in `plugins/<name>/hooks/`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
