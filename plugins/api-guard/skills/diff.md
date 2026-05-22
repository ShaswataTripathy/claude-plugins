Show all exported symbol changes made in this session and their blast radius.

Steps:
1. Get the current git diff:
   ```bash
   git diff HEAD
   ```
   If nothing staged or unstaged: "No changes detected since last commit."

2. For each modified file in the diff:
   - Extract exported symbols from the old version (git show HEAD:<file>)
   - Extract exported symbols from the new version (current working copy)
   - Compare: what was added, removed, or potentially renamed

3. For changed/removed symbols, find their callers (same grep approach as /api-check).

4. Display the full blast radius report:

```
api-guard diff — session changes
──────────────────────────────────────────────────────────────
src/auth/session.ts
  ✓ createSession(userId: string) — signature unchanged, 4 callers safe
  ✗ validateToken(token: string) → validateToken(token: string, strict: boolean)
    New required parameter added.
    Callers that will break (2):
      src/middleware/auth.ts:34
      src/routes/api.ts:112

src/utils/format.ts
  - formatDate removed entirely
    Callers that will break (3):
      src/components/Header.tsx:8
      src/components/Footer.tsx:22
      tests/format.test.ts:14

──────────────────────────────────────────────────────────────
Summary: 2 changed signatures, 1 removed export
         5 files will have broken imports/calls after these changes

Run /api-check <symbol> for details on any specific symbol.
```

5. If no exports changed: "No exported symbol changes in current diff. Internal refactors only."
