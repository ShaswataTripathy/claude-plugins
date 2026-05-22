# Hook API Reference

Claude Code calls hook scripts at specific points in its tool execution lifecycle. This page documents the exact input format, exit codes, and environment available to hook scripts.

## Lifecycle events

| Event | When it fires | Common use |
|-------|--------------|------------|
| `PreToolUse` | Before a tool call executes | Block dangerous operations |
| `PostToolUse` | After a tool call completes | Monitor state, accumulate counts |
| `SessionStart` | When a session begins | Warm up state, detect environment |

## Input format

Hook scripts receive a JSON object on stdin (fd 0). The shape varies by tool:

### Bash tool
```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "git status"
  }
}
```

### Write tool
```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/absolute/path/to/file.ts",
    "content": "the full new file content"
  }
}
```

### Edit tool
```json
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/absolute/path/to/file.ts",
    "old_string": "original text",
    "new_string": "replacement text"
  }
}
```

### PostToolUse (all tools)
PostToolUse receives the same `tool_input` plus a `tool_response` field with the tool's output.

## Reading stdin

Use fd 0 — works on Windows, macOS, and Linux:

```javascript
import { readFileSync } from 'fs';
const input = JSON.parse(readFileSync(0, 'utf8'));
```

Never use `/dev/stdin` — it does not exist on Windows.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Allow the operation. Anything written to stderr is shown as a notice. |
| `2` | Block the operation. Stderr message is shown. Claude Code does not proceed. |

Exit code `1` is treated as an internal hook error and shows a generic message.

## Stderr output

Write user-facing messages to stderr. Claude Code displays them inline.

Keep messages short and actionable. The user is in the middle of a task:

```javascript
// good
process.stderr.write('\n  db-guard blocked: terraform destroy\n  Run it in your terminal if intentional.\n\n');

// avoid
process.stderr.write('The db-guard plugin has detected that the command you are about to run...');
```

## Matcher

In `plugin.json`, the `matcher` field on a hook entry is a regex matched against the tool name:

```json
{ "matcher": "Bash" }           // matches only Bash
{ "matcher": "Write|Edit" }     // matches Write and Edit
{ "matcher": ".*" }             // matches all tools
```

## Environment

Hook scripts run with the same environment as the Claude Code process — your shell's `PATH`, `HOME`, and any exported variables. The working directory is the project root.

## Performance

Hooks run synchronously in the tool execution path. Keep them fast:

- File reads: fine
- Regex matching: fine
- `execSync` with a scoped grep: acceptable (under 200ms on most projects)
- Network requests: avoid entirely — they block every tool call

## Template variable

When a hook command in `plugin.json` uses `{plugin_dir}`, the installer replaces it with the absolute path to the plugin's installed directory:

```json
"command": "node \"{plugin_dir}/hooks/intercept.js\""
```

becomes:

```
node "/Users/you/.claude/plugins/db-guard/hooks/intercept.js"
```
