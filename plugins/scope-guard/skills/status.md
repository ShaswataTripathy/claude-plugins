Show the current active scope and a log of what scope-guard has blocked or allowed this session.

Steps:
1. Read `~/.claude/plugins/scope-guard/current-scope.json`.

2. If no scope is defined:
   ```
   scope-guard: No active scope.
   Run /scope-set <task description> to define one.
   All writes are currently unrestricted.
   ```

3. If a scope exists:
   ```
   scope-guard status
   ──────────────────────────────────────────────────
   Task:          "fix the login bug in src/auth/"
   Allowed paths: src/auth/
   Blocked paths: (none)
   Created:       14 minutes ago
   Expires:       in 3h 46m

   Session activity:
     ✓ Allowed  src/auth/login.ts (2 writes)
     ✓ Allowed  src/auth/session.ts (1 write)
     ✗ Blocked  src/user/profile.ts — outside scope (1 attempt)
   ```

4. Read the session log from `~/.claude/plugins/scope-guard/session-log.json` for the blocked/allowed history.
   If the file doesn't exist, show "No activity recorded yet."
