# Contributing to claude-plugins

## Adding a new plugin

1. Fork and clone the repo
2. Create `plugins/<your-plugin-name>/plugin.json`
3. Add skill files to `plugins/<your-plugin-name>/skills/`
4. Add your entry to `registry.json`
5. Test locally with `node cli/index.js install <your-plugin-name>`
6. Submit a PR with a description of what the plugin does

## Plugin review checklist

Before opening a PR, make sure your plugin:

- [ ] Has a clear, single-purpose description
- [ ] Skills have explicit step-by-step instructions
- [ ] Hooks do not make destructive changes without confirmation
- [ ] No hardcoded credentials or personal info
- [ ] `plugin.json` includes all required fields
- [ ] `skills` array in manifest matches actual files

## Hook safety guidelines

Hooks run automatically during Claude Code sessions. Submissions with hooks must:

- Only exit with code 2 (block) for operations that are genuinely dangerous and have no safe path forward — blocking too aggressively breaks normal workflows
- Never silently modify files or state outside `~/.claude/plugins/<name>/`
- Make no network requests
- Include a comment explaining why the operation is dangerous

## Code style

- ES modules (import/export), no CommonJS
- No TypeScript (keep the install surface minimal)
- Prefer clarity over cleverness
