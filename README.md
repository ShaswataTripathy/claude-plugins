# claude-plugins

> A community plugin manager for [Claude Code](https://claude.ai/code) — add superpowers to your AI coding assistant in one command.

```bash
npx claude-plugins install git-workflow
```

---

## What is this?

Claude Code is a powerful AI coding CLI, but its real power comes from extending it with custom slash commands, hooks, and MCP integrations. **claude-plugins** is the community hub for sharing and installing these extensions.

Think of it like **Oh My Zsh** — but for Claude Code.

---

## Quick Start

```bash
# Browse available plugins
npx claude-plugins search

# Install a plugin
npx claude-plugins install git-workflow

# See what's installed
npx claude-plugins list

# Remove a plugin
npx claude-plugins uninstall git-workflow
```

No global install required — `npx` handles it.

---

## Available Plugins

| Plugin | Description | Commands Added |
|--------|-------------|----------------|
| `git-workflow` | AI commit messages, smart branching, branch cleanup | `/commit` `/branch` `/cleanup` |
| `code-review` | Deep review across correctness, security, and perf | `/review` `/security` |
| `docker-debug` | Diagnose failing containers and compose files | `/diagnose` `/compose` |
| `pr-description` | Generate structured PR descriptions from your diff | `/pr` |

---

## How It Works

Claude Code supports three extension points that plugins can use:

**Slash commands (Skills)**
Markdown files in `~/.claude/commands/` that define how Claude responds to `/command-name`.

**Hooks**
Shell scripts that run automatically on Claude Code events — before/after tool use, on session stop, etc.

**MCP Servers**
External tool servers that Claude can call for databases, APIs, browsers, and more.

`claude-plugins` manages all of these for you: installs files, patches `settings.json`, and tracks what's installed so it can be cleanly removed.

---

## Scopes

Plugins can be installed globally (available in every project) or per-project:

```bash
# Global (default) — goes in ~/.claude/
npx claude-plugins install code-review

# Project-local — goes in .claude/ in your current directory
npx claude-plugins install code-review --project
```

---

## Writing Your Own Plugin

A plugin is a directory with a `plugin.json` manifest and optional `skills/`, `hooks/`, and `mcp/` folders.

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

**`skills/my-command.md`:**

```markdown
Do something useful when the user runs /my-command.

Arguments: $ARGUMENTS

Steps:
1. ...
2. ...
```

### Submitting to the Registry

1. Fork this repo
2. Add your plugin under `plugins/your-plugin-name/`
3. Add an entry to `registry.json`
4. Open a pull request

Community plugins are reviewed for quality and security before being listed.

---

## Plugin Ideas (Contributions Welcome)

- `test-coverage` — run tests and identify untested code paths
- `env-check` — validate .env files against .env.example
- `deps-audit` — check for outdated/vulnerable dependencies
- `db-migrate` — generate and run database migrations safely
- `k8s-debug` — diagnose failing Kubernetes pods and deployments
- `changelog` — generate changelogs from git history
- `i18n` — extract and manage translation strings
- `perf-profile` — identify performance bottlenecks in code

Open an issue to claim one!

---

## FAQ

**Does this work on Windows?**
Yes — tested on Windows 11, macOS, and Linux.

**Is it safe?**
Plugins are open source and community-reviewed. Always read a plugin's source before installing, especially hooks (which run shell commands). Never install from unreviewed sources.

**Will this break if Claude Code updates?**
Plugins use stable Claude Code primitives (skills, hooks, settings.json) that Anthropic has documented as extension points. Breaking changes are unlikely but possible — watch this repo for updates.

**Can I install from a GitHub URL instead of the registry?**
Not yet, but it's on the roadmap.

---

## Contributing

Issues, plugin submissions, and PRs are all welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT
