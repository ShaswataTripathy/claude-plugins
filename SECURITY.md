# Security

## Hook execution model

Hooks in this repo are Node.js scripts that run inside your Claude Code session. Before installing any plugin from this repo — or anywhere else — you should understand what hooks can and cannot do.

**What hooks can do:**
- Read files in your project directory
- Read environment variables available in your shell
- Execute shell commands (hooks run as your user, with your permissions)
- Write to `~/.claude/plugins/` (the plugin state directory)
- Exit with code 2 to block a Claude Code tool call

**What hooks in this repo do:**
- `db-guard`: reads `.env` files to detect production database URLs. Reads no other files. Makes no network requests. Does not write anything.
- `token-guard`: reads and writes a counter file at `~/.claude/plugins/token-guard/call-count.json`. Makes no network requests.
- `scope-guard`: reads and writes `~/.claude/plugins/scope-guard/current-scope.json`. Makes no network requests.
- `api-guard`: runs `grep -rl` across your project source files to find callers. Reads file content from tool input. Makes no network requests.
- `context-doctor`: reads the size and line count of modified context files. Makes no network requests.

**No hook in this repo:**
- Makes network requests
- Reads or transmits secrets or credentials
- Writes outside `~/.claude/plugins/`
- Installs software or modifies system configuration

## Reviewing hook source

Hook scripts are always at `plugins/<name>/hooks/*.js`. Read them before installing. The code is short and straightforward by design.

## Reporting a vulnerability

If you find a security issue in this repo — particularly in a hook that could be exploited through crafted tool input or project files — open a private issue or email the maintainer directly.

Do not open a public issue for a security vulnerability until it has been reviewed and a fix is available.

## Third-party plugins

This repo can only vouch for the plugins listed in `registry.json` that have been reviewed before merge. If you install a plugin from a fork or unreviewed source, you are running that author's code with your user's permissions. Apply the same scrutiny you would to any shell script.
