# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

---

## [Unreleased]

### Added
- Full test suite for all hook scripts using `node:test`
- `.gitattributes` for consistent LF line endings
- `docs/` directory: getting-started, writing-plugins, hook-api, plugin-manifest
- `SECURITY.md` with hook execution model and vulnerability reporting
- GitHub issue and PR templates

### Fixed
- `scope-guard/enforce.js` was missing `writeFileSync` in its import

---

## [0.2.0] — 2026-05-22

### Added
- **db-guard**: hard-blocks destructive database and infrastructure commands (drizzle, prisma, terraform, SQL, redis, mongo). Escalates when production DB detected in `.env`.
- **token-guard**: PostToolUse context fill monitor + PreToolUse expensive-pattern interceptor. Warns at 60/80/95% estimated fill.
- **monorepo-setup**: auto-generates nested CLAUDE.md hierarchy from nx/turbo/pnpm/yarn/go/cargo workspace configs.
- **context-doctor**: audits CLAUDE.md and skill files for size, staleness, and duplicates. PostToolUse hook fires on every context file write.
- **scope-guard**: PreToolUse hook enforces task scope boundaries. One-time override and 4-hour auto-expiry.
- **api-guard**: PreToolUse hook greps callers of exported symbols before any write completes. Supports TypeScript, JavaScript, Python, Go.
- Installer updated to handle `hookFiles` — copies hook scripts to `~/.claude/plugins/<name>/hooks/` and resolves `{plugin_dir}` in hook commands.

---

## [0.1.0] — 2026-05-22

### Added
- `npx claude-plugins` CLI with `install`, `uninstall`, `list`, `search`, `info`, `update`
- **git-workflow** v2: `/commit`, `/branch`, `/cleanup`, `/sync`, `/undo`, `/stash`, `/log`, `/fixup` with safety hooks
- **code-review**: `/review`, `/security`
- **docker-debug**: `/diagnose`, `/compose`
- **pr-description**: `/pr`
- Plugin registry at `registry.json` with 10 plugins
