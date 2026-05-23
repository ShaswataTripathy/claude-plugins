# Writing Plugins

This guide walks through building a plugin from scratch. By the end you will have a working plugin with a skill and a hook.

## What a plugin is

A plugin is a directory under `plugins/` in this repo with three things:

```
plugins/my-plugin/
  plugin.json         # manifest — name, version, what to install
  skills/             # markdown files that become slash commands
  hooks/              # Node.js scripts that fire on tool lifecycle events
```

After a user installs your plugin, the installer copies skills to `~/.claude/commands/my-plugin/` and hooks to `~/.claude/plugins/my-plugin/hooks/`, then patches `~/.claude/settings.json` with the hook entries.

## Step 1 — Pick a name

Use lowercase, hyphen-separated names: `my-guard`, `ts-helper`, `db-lint`. The name becomes the command prefix (`/my-guard-status`) and the directory name on disk.

## Step 2 — Write a skill

Skills are markdown files. The filename (minus `.md`) is the slash command name.

`plugins/my-plugin/skills/check.md`:
```markdown
Check the current environment for common issues and report a summary.

Steps:
1. Run `node --version` and `npm --version`
2. Check if `.env` exists in the project root
3. Report what you found — missing `.env` is worth mentioning
```

Skills are instructions for Claude, not code. Write them the same way you would describe a task to a competent engineer who is unfamiliar with your project.

## Step 3 — Write a hook (optional)

Hooks are Node.js scripts. They read the tool call from stdin, optionally write a message to stderr, and exit with 0 (allow) or 2 (block).

`plugins/my-plugin/hooks/intercept.js`:
```javascript
import { readFileSync } from 'fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const { tool_name, tool_input } = input;

if (tool_name !== 'Bash') process.exit(0);

const cmd = tool_input.command ?? '';

if (cmd.includes('rm -rf /')) {
  process.stderr.write('\n  my-plugin blocked: rm -rf /\n\n');
  process.exit(2);
}
```

Key rules:
- Read stdin with `readFileSync(0, 'utf8')` — never `/dev/stdin` (Windows does not have it)
- Write messages to **stderr**, not stdout
- Exit 0 to allow, exit 2 to block
- Keep it fast — hooks are synchronous and run on every tool call that matches your `matcher`

## Step 4 — Write plugin.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "One sentence about what this plugin does.",
  "skills": ["check.md"],
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

See [plugin-manifest.md](plugin-manifest.md) for the full field reference.

## Step 5 — Register it

Add an entry to `registry.json` in the repo root:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "One sentence about what this plugin does.",
  "author": "your-github-username",
  "components": ["skill", "hook"],
  "tags": ["relevant", "keywords"]
}
```

`name` must match the directory name under `plugins/`. `components` lists what the plugin provides (`"skill"`, `"hook"`, or both). `tags` are used by `npx claude-code-guard search`.

## Step 6 — Write tests

Put tests in `tests/hooks/my-plugin.test.js`. Use the `hook()` helper:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hook, bash } from './helpers.js';
import { resolve } from 'path';

const HOOK = resolve('plugins/my-plugin/hooks/intercept.js');

test('blocks rm -rf /', async () => {
  const { code, stderr } = await hook(HOOK, bash('rm -rf /'));
  assert.equal(code, 2);
  assert.match(stderr, /blocked/);
});

test('allows safe commands', async () => {
  const { code } = await hook(HOOK, bash('ls -la'));
  assert.equal(code, 0);
});
```

Run just your tests:
```bash
node --test tests/hooks/my-plugin.test.js
```

## Lifecycle events

| Event | Fires | Typical use |
|-------|-------|-------------|
| `PreToolUse` | Before the tool runs | Block dangerous operations |
| `PostToolUse` | After the tool completes | Monitor, count, log |
| `SessionStart` | When the session begins | Warm up state |

PostToolUse receives the same `tool_input` as PreToolUse, plus a `tool_response` field with the tool's output.

## Matching tools

The `matcher` field is a regex matched against the tool name:

```json
{ "matcher": "Bash" }           // Bash only
{ "matcher": "Write|Edit" }     // Write and Edit
{ "matcher": ".*" }             // every tool
```

Match as narrowly as possible — a hook that runs on every `Write` adds latency to every file save.

## State files

If your hook needs persistent state (counters, config, last-run timestamps), write it to `~/.claude/plugins/<your-plugin-name>/`. The installer does not create this directory — create it lazily on first write.

Do not write outside `~/.claude/plugins/`. Do not make network requests.

## Checklist before submitting a PR

- [ ] `plugin.json` has `name`, `version`, `description`
- [ ] All skills listed in `plugin.json` have a corresponding `.md` file
- [ ] All `hookFiles` listed in `plugin.json` have a corresponding `.js` file
- [ ] Hook reads from fd 0 (`readFileSync(0, 'utf8')`)
- [ ] Hook only writes to stderr (nothing on stdout)
- [ ] Hook exits 0 or 2 (not 1)
- [ ] Hook makes no network requests
- [ ] Hook writes only to `~/.claude/plugins/<name>/`
- [ ] Tests exist in `tests/hooks/<name>.test.js`
- [ ] Tests pass: `node --test tests/hooks/<name>.test.js`
- [ ] Entry added to `registry.json`
- [ ] SECURITY.md updated with what the hook reads and writes
