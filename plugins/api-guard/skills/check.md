Find every file in the codebase that references a specific exported symbol.

Arguments: $ARGUMENTS — symbol name, e.g. "getUserById" or "AuthConfig"

Steps:
1. Get the symbol name from the argument. If not provided, ask: "Which symbol do you want to check?"

2. Find the file that exports it:
   ```bash
   grep -rl "export.*<symbol>" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" --exclude-dir=node_modules --exclude-dir=dist
   ```

3. Show the export definition (the actual function/type signature).

4. Find all callers:
   ```bash
   grep -rn "<symbol>" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" --exclude-dir=node_modules --exclude-dir=dist
   ```
   Filter out the file that defines it. Filter out comments. Filter out string literals where possible.

5. Display results:
```
api-guard: callers of "getUserById"
──────────────────────────────────────────────────────────────
Defined in: src/db/users.ts:14
Signature:  async function getUserById(id: string): Promise<User | null>

Called in 6 files:

  src/routes/profile.ts:23        const user = await getUserById(req.params.id)
  src/routes/auth.ts:87           const user = await getUserById(session.userId)
  src/middleware/auth.ts:34       if (!await getUserById(token.sub)) {
  src/jobs/cleanup.ts:12          const u = await getUserById(item.userId)
  tests/profile.test.ts:18        const user = await getUserById('test-user-1')
  tests/auth.test.ts:45           expect(await getUserById('x')).toBeNull()
```

6. If changing the signature: explicitly list which callers will need updating and what the change means for each one.
