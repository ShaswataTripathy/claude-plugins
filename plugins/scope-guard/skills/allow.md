Grant a one-time exception for the next write operation outside the current scope.

Arguments: $ARGUMENTS (optional: file path or reason)

Steps:
1. Read the current scope from `~/.claude/plugins/scope-guard/current-scope.json`.
   If no scope is set, inform the user that there's nothing to override.

2. Show what will be overridden:
   ```
   scope-guard: One-time override granted.
   The next write operation will proceed regardless of scope boundaries.
   Scope enforcement resumes after that operation.
   ```

3. Write an override flag to `~/.claude/plugins/scope-guard/current-scope.json`:
   ```json
   { ..., "oneTimeOverride": true }
   ```

4. Log the override to the session log with the reason (if provided) and timestamp.

Note: The enforce.js hook reads this flag, allows one write through, then removes the flag.
