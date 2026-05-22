---
name: Plugin submission
about: Submit a new plugin for inclusion in the registry
labels: plugin-submission
---

## Plugin name

<!-- Lowercase, hyphen-separated. -->

## What it does

<!-- One paragraph. What problem does it solve? When would someone install it? -->

## Hook behavior

<!-- If the plugin has hooks: what tool events does it listen to, what does it block vs. warn, what files does it read and write? -->

## Skill list

<!-- If the plugin has skills: list each slash command and what it does in one sentence. -->

## Security review

<!-- Answer each question. -->

- Does any hook make network requests? <!-- yes/no -->
- Does any hook read files outside the project directory or `~/.claude/plugins/`? <!-- yes/no -->
- Does any hook write files outside `~/.claude/plugins/<name>/`? <!-- yes/no -->
- Does any hook execute subprocesses beyond scoped grep/find? <!-- yes/no — if yes, describe -->

## PR link

<!-- Link to the PR that adds the plugin code. -->

## Checklist

- [ ] `plugin.json` has `name`, `version`, `description`
- [ ] All skills listed in `plugin.json` have corresponding `.md` files
- [ ] All `hookFiles` listed in `plugin.json` have corresponding `.js` files
- [ ] Hook reads from `readFileSync(0, 'utf8')` (not `/dev/stdin`)
- [ ] Hook only writes to stderr
- [ ] Hook exits 0 or 2 only
- [ ] Hook makes no network requests
- [ ] Hook writes only to `~/.claude/plugins/<name>/`
- [ ] Tests exist in `tests/hooks/<name>.test.js` and pass
- [ ] Entry added to `registry.json`
- [ ] SECURITY.md updated to describe what the hook reads and writes
