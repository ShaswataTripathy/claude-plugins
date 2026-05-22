Check existing CLAUDE.md files across the monorepo for staleness and missing packages.

Steps:
1. Find all CLAUDE.md files in the project:
   ```
   find . -name "CLAUDE.md" -not -path "*/node_modules/*" -not -path "*/.git/*"
   ```

2. Read the workspace config (nx.json / turbo.json / pnpm-workspace.yaml / package.json) to get the current list of packages.

3. For each known package directory: check if a CLAUDE.md exists. Report missing ones.

4. For each existing CLAUDE.md: check for staleness:
   - Package name in the file matches the current `package.json` name?
   - Build/test commands in the file match current `package.json` scripts?
   - Referenced packages in import rules still exist in the workspace?
   - Paths marked "Do not touch" still exist?

5. Check the root CLAUDE.md package map:
   - Any packages listed that no longer exist in the workspace?
   - Any packages in the workspace that are missing from the map?

6. Report findings:

```
monorepo-audit
───────────────────────────────────────────────────────
✓  apps/web/CLAUDE.md — up to date
✓  apps/api/CLAUDE.md — up to date
⚠️  packages/ui/CLAUDE.md — build command outdated
    File says: "pnpm build", package.json now has: "tsup src/index.ts"
✗  packages/payments — no CLAUDE.md (new package detected)
✗  Root CLAUDE.md still lists packages/legacy which was deleted

3 issues found. Run /monorepo-init --force to regenerate all,
or /monorepo-add packages/payments to add just the missing one.
```

7. Do not modify any files — report only.
