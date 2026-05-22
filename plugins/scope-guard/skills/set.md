Define the scope boundary for the current task. All subsequent writes will be checked against it.

Arguments: $ARGUMENTS — describe the task, e.g. "fix the login bug in src/auth/" or "add tests for packages/api"

Steps:
1. Parse the task description.

2. Extract scope rules from the description:
   - File paths mentioned → allowed paths
   - File types mentioned → allowed extensions
   - Nature of the task:
     - "fix" / "bug" → read-write, source files only, no new files
     - "add tests" → read-write, test files + source files (read-only on source)
     - "refactor" → read-write, specified paths only
     - "docs" → read-write, documentation files only

3. Construct a scope definition:
```json
{
  "description": "fix the login bug in src/auth/",
  "allowedPaths": ["src/auth"],
  "blockedPaths": [],
  "createdAt": <timestamp>
}
```

4. Show the scope to the user:
```
scope-guard: Task scope set
──────────────────────────────────────
Task:          "fix the login bug in src/auth/"
Allowed paths: src/auth/
Blocked paths: (none explicitly)
Expires:       in 4 hours

Any write outside src/auth/ will be blocked until you
run /scope-clear or /scope-add <path>.
```

5. Write the scope to `~/.claude/plugins/scope-guard/current-scope.json`.

6. Confirm: "Scope active. Enforcement is now on."
