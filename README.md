# claude-plugins

[![npm version](https://img.shields.io/npm/v/claude-plugins.svg)](https://www.npmjs.com/package/claude-plugins)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

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

## Plugins

| Plugin | What it does |
|--------|-------------|
| [`db-guard`](#db-guard) | Hard-blocks drizzle/prisma/terraform/SQL destructive commands. Escalates when prod DB detected in `.env` |
| [`token-guard`](#token-guard) | Warns before context limit. Intercepts expensive patterns before they run |
| [`scope-guard`](#scope-guard) | Blocks writes outside the path boundary you set at task start |
| [`api-guard`](#api-guard) | Greps all callers of exported symbols before a file is saved |
| [`context-doctor`](#context-doctor) | Warns when CLAUDE.md or skill files grow past the effective size threshold |
| [`monorepo-setup`](#monorepo-setup) | Auto-generates per-package CLAUDE.md files from nx/turbo/pnpm workspace config |

All plugins except `monorepo-setup` run as hooks — automatically, on every Claude tool call, no prompt needed.

---

## db-guard

Blocks commands that have wiped production databases before they execute.

```bash
npx claude-plugins install db-guard
```

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

## token-guard

Stops you from hitting your usage limit mid-task.

```bash
npx claude-plugins install token-guard
```

Hooks fire after every tool call and before expensive operations. Thresholds (based on tool call count as a context fill proxy):

- 30 calls → "Consider /compact soon"
- 50 calls → "Run /compact now"
- 65 calls → "Critical — next calls may fail"

Also intercepts known context-exploding patterns before they run: `cat` on large files, `git log` without count limits, anything touching `node_modules`, `find` without `-maxdepth`.

**Slash commands:** `/token-status`, `/token-estimate <task>`, `/token-report`

---

## scope-guard

CLAUDE.md instructions work most of the time. Hooks work every time.

```bash
npx claude-plugins install scope-guard
```

Set a scope at the start of a task. Any write outside that scope is blocked at the filesystem level before it happens.

```
/scope-set fix the login bug in src/auth/
```

Any attempt to write to `src/user/profile.ts` or any path outside the boundary gets blocked with a clear explanation. Use `/scope-allow` for a one-time exception or `/scope-add <path>` to expand the boundary.

Scope definitions expire after 4 hours automatically.

**Slash commands:** `/scope-set`, `/scope-status`, `/scope-allow`

---

## api-guard

Catches broken callers before the file is saved.

```bash
npx claude-plugins install api-guard
```

Every time Claude writes to a file containing exported symbols, api-guard greps the codebase for callers. If your refactored function has 6 callers across 4 files, you see them in the warning — before the write completes, not after the CI run fails.

Supports TypeScript, JavaScript, Python, and Go exports.

**Slash commands:** `/api-check <symbol>`, `/api-diff`

---

## context-doctor

Stops context rot before it costs you tokens.

```bash
npx claude-plugins install context-doctor
```

Every line in CLAUDE.md costs tokens on every message. Claude also loses track of instructions past a certain length. context-doctor audits all your context files, scores them, identifies bloat and duplicates, and applies fixes: moving sections to skills (load-on-demand vs. always-loaded), pruning stale entries, removing duplicate rules.

A hook fires whenever you modify a CLAUDE.md or skill file and warns if it crosses the size threshold.

**Slash commands:** `/context-doctor`, `/context-doctor fix`

---

## monorepo-setup

Claude edits the wrong package in your monorepo because it doesn't know your workspace boundaries. This fixes it automatically.

```bash
npx claude-plugins install monorepo-setup
```

Run `/monorepo-init` from your repo root. It reads your `nx.json`, `turbo.json`, `pnpm-workspace.yaml`, or `package.json` workspaces and generates:

- A root `CLAUDE.md` with a package map and cross-package import rules
- A per-package `CLAUDE.md` for every workspace with scope boundaries, correct import patterns, and the right build/test commands

Supports: Nx, Turborepo, pnpm workspaces, npm/Yarn workspaces, Lerna, Go modules, Rust workspaces.

**Slash commands:** `/monorepo-init`, `/monorepo-add <path>`, `/monorepo-audit`

---

## How plugins work

Claude Code supports two extension points used here:

**Hooks** — Scripts that run on Claude Code events (`PreToolUse`, `PostToolUse`). Exit code `2` blocks the operation. Exit code `0` allows it. They run every time, without exception, whether you ask Claude to or not.

**Slash commands (Skills)** — Markdown files in `~/.claude/commands/` that define how Claude responds to `/command-name`.

`claude-plugins` installs both automatically and writes the correct entries to `~/.claude/settings.json`.

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

**`plugin.json`:**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Does something useful",
  "author": "your-github-username",
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

**Hook script basics:**

```javascript
#!/usr/bin/env node
import { readFileSync } from 'fs';

const input = JSON.parse(readFileSync(0, 'utf8')); // fd 0 works on Windows and Unix
const cmd = input?.tool_input?.command ?? '';

if (/something-dangerous/.test(cmd)) {
  process.stderr.write('my-plugin: blocked because reason\n');
  process.exit(2); // block
}
process.exit(0); // allow
```

### Submitting to the registry

1. Fork this repo
2. Add your plugin under `plugins/your-plugin-name/`
3. Add an entry to `registry.json`
4. Add tests in `tests/hooks/your-plugin-name.test.js`
5. Open a PR

Hooks are reviewed for network requests, file access, and shell injection before any merge.

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

## Docs

| Topic | Link |
|-------|------|
| Installation and setup | [docs/getting-started.md](docs/getting-started.md) |
| Writing your own plugin | [docs/writing-plugins.md](docs/writing-plugins.md) |
| plugin.json field reference | [docs/plugin-manifest.md](docs/plugin-manifest.md) |
| Hook API (stdin, exit codes, matchers) | [docs/hook-api.md](docs/hook-api.md) |
| Security model | [SECURITY.md](SECURITY.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |

---

## Contributing

1. Fork the repo
2. Add your plugin under `plugins/your-plugin-name/`
3. Add an entry to `registry.json`
4. Add tests in `tests/hooks/your-plugin-name.test.js`
5. Open a PR — use the plugin submission issue template if you want feedback first

Hooks are reviewed for network requests, file access, and shell injection before any merge.

---

## License

MIT
