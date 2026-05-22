Scan the monorepo config and auto-generate nested CLAUDE.md files for every package.

Arguments: $ARGUMENTS (optional: "dry-run" to preview without writing, "force" to overwrite existing files)

---

## Step 1 — Detect workspace type

Scan the current directory root for:

| File | Type |
|------|------|
| `nx.json` | Nx |
| `turbo.json` | Turborepo |
| `pnpm-workspace.yaml` | pnpm workspaces |
| `package.json` with `workspaces` field | npm/Yarn workspaces |
| `lerna.json` | Lerna |
| `go.work` | Go multi-module |
| `Cargo.toml` with `[workspace]` section | Rust workspace |

If none found: "This doesn't look like a monorepo root. Run this from the root directory."

Read the workspace file to get the list of package globs (e.g. `packages/*`, `apps/*`, `libs/*`).

---

## Step 2 — Map all packages

For each resolved package directory:

1. Read its `package.json` (or `Cargo.toml` / `go.mod` for non-JS) to get:
   - Package name (e.g. `@myapp/auth`, `ui`, `api`)
   - Dependencies on other workspace packages
   - Build command (`scripts.build`)
   - Test command (`scripts.test`)
   - Lint command (`scripts.lint`)

2. Infer domain from name and path:
   - `apps/web` → frontend application
   - `apps/api` → backend application
   - `packages/ui` → shared UI components
   - `packages/shared` or `packages/common` → shared utilities/types
   - `packages/config` → shared configuration
   - `services/*` → microservices

3. Identify entry points (e.g. `src/index.ts`, `main.go`, `lib.rs`).

---

## Step 3 — Generate root CLAUDE.md

Content structure:
```markdown
# Monorepo Context

## Workspace type: <type>
## Package manager: <npm/pnpm/yarn/cargo/go>

## Packages

| Name | Path | Purpose |
|------|------|---------|
| @myapp/web | apps/web | Next.js frontend application |
| @myapp/api | apps/api | Express REST API backend |
| @myapp/ui | packages/ui | Shared React component library |
| @myapp/shared | packages/shared | Shared TypeScript types and utilities |

## Cross-package import rules
- Import shared types from `@myapp/shared` — never duplicate type definitions
- Import UI components from `@myapp/ui` — never reimplement in app packages
- Never import from `apps/*` in any `packages/*` — that's a circular dependency

## Do not touch
- `dist/`, `build/`, `.turbo/`, `node_modules/` — generated
- Root `package.json` `workspaces` field — managed by the package manager

## Running tasks
- Build all: `<build-all-command>`
- Test all: `<test-all-command>`
- Add a dep to a specific package: `<filter-command>`
```

---

## Step 4 — Generate per-package CLAUDE.md files

For each package, create `<package-path>/CLAUDE.md`:

```markdown
# <package-name>

## Scope
Only modify files under `<package-path>/`.
Do not touch other packages directly.

## This package's role
<one-line description inferred from name + deps>

## Import rules
- Internal imports: use relative paths within this package
- Shared types: import from `<shared-package-name>`
- <any other packages this one depends on>

## Commands
- Build: `<build-command>`
- Test: `<test-command>`
- Lint: `<lint-command>`

## Do not touch
- `dist/` — build output
- `node_modules/` — managed by package manager
<any generated files detected>
```

---

## Step 5 — Preview and confirm

Show a summary:
```
monorepo-init will create:
  CLAUDE.md (root) — updated
  apps/web/CLAUDE.md — new
  apps/api/CLAUDE.md — new
  packages/ui/CLAUDE.md — new
  packages/shared/CLAUDE.md — new

Total: 5 files
```

If "dry-run": print each file's full content without writing. Stop here.

Ask: "Write these files? (yes / selective / cancel)"
- `yes` → write all
- `selective` → ask about each file individually
- `cancel` → exit

---

## Step 6 — Write and confirm

Write the files. After writing:
- Run `find . -name "CLAUDE.md" -not -path "*/node_modules/*"` to show all context files now in the project.
- Remind: "Run /monorepo-audit periodically as packages are added or renamed."
