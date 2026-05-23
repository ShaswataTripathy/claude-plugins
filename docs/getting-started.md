# Getting Started

## Requirements

- Node.js 18 or later
- Claude Code CLI installed and configured

## Install a plugin

You do not need to install `claude-code-guard` globally. Use `npx`:

```bash
npx claude-code-guard install db-guard
```

This will:
1. Fetch the plugin manifest from the registry
2. Copy skill files to `~/.claude/commands/db-guard/`
3. Copy hook scripts to `~/.claude/plugins/db-guard/hooks/`
4. Patch `~/.claude/settings.json` with the hook entries

The changes take effect in the next Claude Code session you start.

## Verify the install

```bash
npx claude-code-guard list
```

To confirm a hook is wired up, open Claude Code and run:

```
/db-guard-status
```

or check `~/.claude/settings.json` for the hook entry directly.

## Project-scoped install

By default, plugins install globally (available in every project). To install into the current project only:

```bash
npx claude-code-guard install scope-guard --project
```

This writes to `.claude/settings.json` and `.claude/commands/` in the current directory instead of `~/.claude/`.

## Remove a plugin

```bash
npx claude-code-guard uninstall db-guard
```

This removes all skill files, hook scripts, and `settings.json` entries for that plugin. It does not touch settings added by other plugins.

## Update all plugins

```bash
npx claude-code-guard update
```

Or update a specific one:

```bash
npx claude-code-guard update token-guard
```

## Browse available plugins

```bash
# List all plugins with descriptions
npx claude-code-guard search

# Search by keyword
npx claude-code-guard search database
npx claude-code-guard search git

# Get details on a specific plugin
npx claude-code-guard info db-guard
```

## Recommended install order

If you are setting up a new machine or project:

```bash
# Safety first — these are passive and cause no friction
npx claude-code-guard install db-guard
npx claude-code-guard install token-guard
npx claude-code-guard install api-guard

# If you work in a monorepo, run this next
npx claude-code-guard install monorepo-setup
# then: /monorepo-init

# Scope enforcement is opt-in per task, install globally
npx claude-code-guard install scope-guard

# Context health — useful after a few weeks of accumulation
npx claude-code-guard install context-doctor
```

## How hooks work

After installing a hook-based plugin, Claude Code will run the hook script on every relevant tool call. The hook receives the tool name and input on stdin, writes any warnings to stderr, and exits with:

- `0` — allow the operation (with optional warning on stderr)
- `2` — block the operation (Claude Code shows the stderr message and does not proceed)

Hooks run as your local user with your shell environment. See [SECURITY.md](../SECURITY.md) for details on what each hook does.
