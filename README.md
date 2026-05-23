# claude-plugins

[![CI](https://github.com/ShaswataTripathy/claude-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/ShaswataTripathy/claude-plugins/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/claude-plugins.svg)](https://www.npmjs.com/package/claude-plugins)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

> **The safety layer Claude Code doesn't ship with.**

```bash
npx claude-plugins install db-guard
npx claude-plugins install token-guard
```

Most Claude Code repos give you more slash commands — things you invoke manually. This one gives you **hooks that enforce automatically**, running on every tool call whether you ask Claude to or not.

---

## The incidents that motivated this

These are documented, real events:

| What happened | Tool | Impact |
|--------------|------|--------|
| `drizzle-kit push --force` ran against production PostgreSQL | Claude Code | Wiped every table. Months of data. Unrecoverable. |
| `terraform destroy` executed against live infrastructure | Claude Code | Deleted DataTalks.Club's infra serving 100,000 students. 2.5 years of submissions gone in seconds. |
| Developers hit the $200/month plan limit with no warning | Claude Code | Session wall mid-task, no way to complete work until next cycle. |
| Function signature refactored, 6 callers not updated | Claude Code | Silent build break discovered on the next CI run. |

None of these are bugs in Claude. Claude optimized for completing the task. The missing piece was a guard layer that ran at the tool level, not at the prompt level.

This repo is that guard layer.

---

## Plugins

| Plugin | Runs | What it does |
|--------|------|-------------|
| [db-guard](#db-guard) | Automatically | Blocks destructive DB and infra commands before they execute |
| [token-guard](#token-guard) | Automatically | Warns before context limit. Intercepts expensive patterns |
| [scope-guard](#scope-guard) | Automatically | Blocks writes outside the path boundary you set per task |
| [api-guard](#api-guard) | Automatically | Greps all callers of exported symbols before any file is saved |
| [context-doctor](#context-doctor) | Automatically | Warns when CLAUDE.md or skill files exceed effective size |
| [monorepo-setup](#monorepo-setup) | On `/monorepo-init` | Generates per-package CLAUDE.md from your workspace config |

The first five run as hooks — they fire on every matching tool call, silently, with no prompt required. `monorepo-setup` is a one-time setup command.

---

## Quick Start

```bash
# See all available plugins
npx claude-plugins search

# Install a plugin (global — active in every project)
npx claude-plugins install db-guard

# Install into the current project only
npx claude-plugins install scope-guard --project

# List what's installed
npx claude-plugins list

# Update all plugins
npx claude-plugins update

# Remove a plugin
npx claude-plugins uninstall db-guard
```

**Recommended first install:**

```bash
npx claude-plugins install db-guard      # prevents data loss
npx claude-plugins install token-guard   # prevents mid-task context walls
npx claude-plugins install api-guard     # prevents silent build breaks
```

---

## db-guard

Intercepts destructive database and infrastructure commands before Claude executes them.

```bash
npx claude-plugins install db-guard
```

| Command | Result |
|---------|--------|
| `drizzle-kit push --force` / `--accept-data-loss` | **Blocked** |
| `prisma db push --force-reset` / `migrate reset` | **Blocked** |
| `terraform destroy` / `pulumi destroy` / `cdk destroy` | **Blocked** |
| `DROP TABLE` / `TRUNCATE TABLE` / raw SQL | **Blocked** |
| `redis-cli FLUSHALL` / `FLUSHDB` | **Blocked** |
| `mongodump --drop` / `mongosh --drop` | **Blocked** |
| `knex migrate:rollback --all` | **Blocked** |
| `drizzle-kit push` (no force flag, but still mutates schema) | Warning |
| `UPDATE` without `WHERE` clause | Warning |
| `ALTER TABLE ... DROP COLUMN` | Warning |

When a production database URL is detected in `.env` — Railway, RDS, Supabase, Neon, PlanetScale — all warnings escalate to hard blocks automatically.

**Slash commands:** `/db-guard-status`, `/db-guard-audit`

---

## token-guard

Stops you from hitting your usage limit mid-task, before the wall appears.

```bash
npx claude-plugins install token-guard
```

Hooks fire after every tool call. Warnings appear while there's still time to act:

| Threshold | Warning |
|-----------|---------|
| 30 tool calls | "Consider running `/compact` soon" |
| 50 tool calls | "Run `/compact` now — context is filling" |
| 65 tool calls | "Critical — next calls may fail" |

Also blocks or warns on known context-exploding patterns before they run:

- `cat` on large files (logs, SQL dumps)
- `git log` without a count limit
- anything touching `node_modules`
- `find` without `-maxdepth`
- `npm list` / `pip list` unscoped

**Slash commands:** `/token-status`, `/token-estimate <task>`, `/token-report`

---

## scope-guard

Enforces task scope at the filesystem level. CLAUDE.md instructions get ignored sometimes. Hooks don't.

```bash
npx claude-plugins install scope-guard
```

Set a boundary at the start of a task:

```
/scope-set fix the login bug in src/auth/
```

Any write to a path outside `src/auth/` is blocked before it happens — with a clear message and the active scope shown. To handle exceptions:

```
/scope-allow          # one-time override for the next write
/scope-add src/utils/ # permanently expand the boundary
```

Scopes expire after 4 hours automatically, so stale rules from a previous task never bleed into a new session.

**Slash commands:** `/scope-set`, `/scope-status`, `/scope-allow`

---

## api-guard

Catches broken callers before the file is saved, not after CI fails.

```bash
npx claude-plugins install api-guard
```

Every time Claude writes to a file that contains exported symbols, api-guard greps the codebase for callers. If your refactored function signature has 6 callers across 4 files, you see them in the warning — before the write completes.

Supports TypeScript, JavaScript, Python, and Go exports.

```
  api-guard: "src/db/users.ts" exports symbols that have callers.

  getUserById — referenced in 3 file(s):
    src/routes/profile.ts
    src/routes/admin.ts
    tests/users.test.ts

  If you're changing a signature, update callers too, or the build will break.
```

**Slash commands:** `/api-check <symbol>`, `/api-diff`

---

## context-doctor

Stops context rot before it costs you tokens on every message.

```bash
npx claude-plugins install context-doctor
```

Every line in CLAUDE.md is loaded on every message — whether it's relevant or not. Claude also loses track of instructions past ~150 lines. A 300-line CLAUDE.md burns tokens constantly and only half of it is being read.

A hook fires every time you write a CLAUDE.md or skill file:

| File size | Action |
|-----------|--------|
| Under 150 lines | No output |
| 150–250 lines | Notice — consider splitting to skills |
| Over 250 lines | Warning — content past line 200 may be ignored |

**Slash commands:** `/context-doctor`, `/context-doctor fix`

---

## monorepo-setup

Fixes the root cause of Claude editing the wrong package in your monorepo.

```bash
npx claude-plugins install monorepo-setup
```

Run `/monorepo-init` from your repo root. It reads your workspace config and generates:

- A root `CLAUDE.md` with a package map and cross-package import rules
- A per-package `CLAUDE.md` for every workspace with its scope, correct import paths, and build/test commands

Supports: Nx, Turborepo, pnpm workspaces, npm/Yarn workspaces, Lerna, Go modules, Rust workspaces.

**Slash commands:** `/monorepo-init`, `/monorepo-add <path>`, `/monorepo-audit`

---

## How it works

Claude Code exposes two extension points:

**Hooks** are scripts that run at specific points in the tool execution lifecycle. They receive the tool call on stdin, write any messages to stderr, and exit with `0` (allow) or `2` (block). They run on every matching tool call — no prompt, no conversation, unconditionally.

**Slash commands (Skills)** are markdown files in `~/.claude/commands/` that tell Claude how to respond to `/command-name`. They work most of the time.

`claude-plugins` installs both automatically and patches `~/.claude/settings.json` with the correct hook entries. Uninstalling removes only what the plugin added.

---

## Writing a plugin

A plugin is a directory with a manifest, optional skills, and optional hooks.

**Minimal `plugin.json`:**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Blocks accidental terraform destroy.",
  "skills": ["status.md"],
  "hookFiles": ["intercept.js"],
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node \"{plugin_dir}/hooks/intercept.js\"" }]
      }
    ]
  }
}
```

**Hook script:**

```javascript
#!/usr/bin/env node
import { readFileSync } from 'fs';

const input = JSON.parse(readFileSync(0, 'utf8')); // fd 0 — works on Windows and Unix
const cmd = input?.tool_input?.command ?? '';

if (/something-dangerous/.test(cmd)) {
  process.stderr.write('\n  my-plugin blocked: reason\n  Run it in your terminal if intentional.\n\n');
  process.exit(2); // block
}
process.exit(0); // allow
```

**Submitting:**

1. Fork the repo
2. Add `plugins/your-plugin-name/`
3. Add an entry to `registry.json`
4. Add tests in `tests/hooks/your-plugin-name.test.js`
5. Open a PR

Hooks are reviewed for network requests, file access, and shell injection before any merge.

---

## FAQ

**Does this work on Windows?**
Yes. All hook scripts use `readFileSync(0, 'utf8')` (fd 0) instead of `/dev/stdin`, which works on Windows, macOS, and Linux.

**Will db-guard block my local dev workflow?**
Only the commands that have caused production data loss in documented incidents are hard-blocked. Ambiguous commands (like `drizzle-kit push` without `--force`) produce a warning and proceed — they don't stop your work.

**What if I need to run a blocked command?**
Run it directly in your terminal, outside Claude Code. Hooks only intercept commands Claude attempts to execute.

**Does installing a plugin slow down Claude?**
Hooks add a subprocess spawn per matching tool call. For fast hooks (regex match, file read), this is under 50ms. api-guard runs a scoped grep and takes up to 200ms on large projects. No hook makes network requests.

**Is it safe to install hooks from this repo?**
All hooks are open source, short by design, and reviewed before merge. Read the source at `plugins/<name>/hooks/` before installing. See [SECURITY.md](SECURITY.md) for exactly what each hook reads and writes.

---

## Docs

| | |
|--|--|
| [Getting started](docs/getting-started.md) | Install, verify, update, recommended setup order |
| [Writing plugins](docs/writing-plugins.md) | Step-by-step guide to building a hook-based plugin |
| [plugin.json reference](docs/plugin-manifest.md) | Every field the installer reads |
| [Hook API](docs/hook-api.md) | stdin format, exit codes, matchers, performance |
| [Security model](SECURITY.md) | What each hook reads, writes, and never touches |
| [Changelog](CHANGELOG.md) | Version history |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

The short version: add a plugin, add tests, open a PR. Hook submissions are reviewed for network requests, file access outside `~/.claude/plugins/`, and shell injection vectors.

---

## License

MIT — see [LICENSE](LICENSE).
