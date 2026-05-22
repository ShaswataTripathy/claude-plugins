## What this changes

<!-- One paragraph. Bug fix, new plugin, docs update, etc. -->

## Testing

<!-- How did you verify this works? For hook changes: which test cases cover the new behavior? -->

```bash
node --test tests/hooks/<name>.test.js
```

## Checklist

- [ ] Tests pass locally (`npm test`)
- [ ] No network requests added to any hook
- [ ] No writes outside `~/.claude/plugins/<name>/` added to any hook
- [ ] CHANGELOG.md updated under `[Unreleased]`
- [ ] If adding a plugin: SECURITY.md updated, registry.json updated
- [ ] If changing the installer: `tests/cli/` covers the change
