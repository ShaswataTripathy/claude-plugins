Add a CLAUDE.md for a new package and update the root package map.

Arguments: $ARGUMENTS — path to the new package (e.g. "packages/payments" or "apps/admin")

Steps:
1. Resolve the package path from the argument. If not given, ask: "Which package path should I generate a CLAUDE.md for?"

2. Verify the path exists and contains a `package.json` (or equivalent manifest).

3. Read the package manifest to extract name, scripts, and workspace dependencies.

4. Read the root CLAUDE.md to find the existing package map.

5. Generate the package's CLAUDE.md (same format as /monorepo-init produces for individual packages).

6. Update the root CLAUDE.md's package map table with the new entry.

7. Show a diff of both files and ask for confirmation before writing.

8. Write both files on confirmation.
