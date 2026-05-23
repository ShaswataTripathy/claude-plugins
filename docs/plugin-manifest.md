# Plugin Manifest Reference

Every plugin has a `plugin.json` at its root. This page documents every field the installer reads.

## Minimal example

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Blocks accidental terraform destroy."
}
```

A plugin with no skills or hooks is valid — it just does nothing useful.

## Full example

```json
{
  "name": "db-guard",
  "version": "1.0.0",
  "description": "Blocks destructive database and infrastructure commands.",
  "skills": ["status.md", "audit.md"],
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

## Fields

### `name` (required)

```json
"name": "db-guard"
```

Lowercase, hyphen-separated. Used as the directory name under `~/.claude/plugins/` and `~/.claude/commands/`. Must match the key in `registry.json`.

### `version` (required)

```json
"version": "1.0.0"
```

Semantic version string. The installer uses this to detect available updates.

### `description` (required)

```json
"description": "Blocks destructive database and infrastructure commands."
```

One sentence. Shown in `npx claude-code-guard search` output and `npx claude-code-guard info <name>`.

### `skills`

```json
"skills": ["status.md", "audit.md"]
```

Array of skill filenames including the `.md` extension. Each listed skill must have a corresponding file in `skills/`. The installer copies them to `~/.claude/commands/<name>/`.

Omit or leave empty if the plugin has no skills.

### `hookFiles`

```json
"hookFiles": ["intercept.js", "monitor.js"]
```

Array of hook script filenames. Each must exist in `hooks/`. The installer copies them to `~/.claude/plugins/<name>/hooks/`.

The installer does **not** register these in `settings.json` automatically — they are just files on disk. You register them by adding entries to the `hooks` object below, referencing them via `{plugin_dir}`.

Omit or leave empty if the plugin has no hooks.

### `hooks`

```json
"hooks": {
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [{ "type": "command", "command": "node \"{plugin_dir}/hooks/intercept.js\"" }]
    }
  ],
  "PostToolUse": [
    {
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "node \"{plugin_dir}/hooks/monitor.js\"" }]
    }
  ]
}
```

Object keyed by lifecycle event. Each key maps to an array of matcher entries. Each entry is patched into `~/.claude/settings.json` (or `.claude/settings.json` for project-scoped installs).

#### Event names

| Key | When it fires |
|-----|--------------|
| `PreToolUse` | Before the tool executes |
| `PostToolUse` | After the tool completes |
| `SessionStart` | When a Claude Code session begins |

#### `hooks.<event>[].matcher`

Regex matched against the tool name. Examples:

```json
"matcher": "Bash"           // Bash tool only
"matcher": "Write|Edit"     // Write and Edit
"matcher": ".*"             // every tool
```

Match as narrowly as your hook's logic requires.

#### `hooks.<event>[].hooks[].command`

Shell command the installer writes into `settings.json`. Use `{plugin_dir}` to reference the plugin's installed directory (the parent of `hooks/`):

```json
"command": "node \"{plugin_dir}/hooks/intercept.js\""
```

The installer replaces `{plugin_dir}` with the absolute path, e.g.:
```
node "/Users/you/.claude/plugins/db-guard/hooks/intercept.js"
```

Always quote `{plugin_dir}` — it may contain spaces on Windows.

### `mcpServers` (optional)

```json
"mcpServers": {
  "my-server": {
    "command": "node",
    "args": ["{plugin_dir}/server.js"]
  }
}
```

Registers MCP server entries in `settings.json`. The object is keyed by server name — the same key that appears under `mcpServers` in Claude Code settings. `{plugin_dir}` is resolved the same way as in hook commands. MCP servers must implement the Model Context Protocol spec.

## Validation

The installer validates:
- `name` and `version` are present
- Every file in `skills` has a `.md` counterpart
- Every file in `hookFiles` has a `.js` counterpart

If validation fails, the install is aborted before any files are written.

## Settings.json shape

After installing a plugin with one hook, the relevant section of `~/.claude/settings.json` looks like:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"/Users/you/.claude/plugins/db-guard/hooks/intercept.js\""
          }
        ]
      }
    ]
  }
}
```

The installer groups hooks by event type and matcher. Uninstalling removes only the entries added by that plugin.
