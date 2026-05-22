Generate a precise conventional commit message and commit changes.

Arguments: $ARGUMENTS (optional: "amend" to fix the last commit, "wip" for a quick save)

---

## Step 1 — Understand the current state

Run in parallel:
- `git status --short`
- `git diff --cached --stat`
- `git diff --stat` (unstaged)
- `git log --oneline -3` (context for what came before)
- `git branch --show-current` (extract ticket ID if present, e.g. feat/PROJ-123-login → PROJ-123)

---

## Step 2 — Handle nothing staged

If nothing is staged:
- Show `git status` output
- Ask the user: "Nothing is staged. What would you like to commit?"
  - Option A: Stage everything → `git add -A` then continue
  - Option B: Stage specific files → ask which files/patterns
  - Option C: Cancel

Do not proceed without staged changes.

---

## Step 3 — Analyze the diff deeply

Run `git diff --cached` for the full staged diff.

Determine:

**Type** — pick the most accurate:
- `feat` — new capability visible to users or callers
- `fix` — corrects a bug or wrong behavior
- `refactor` — restructures code without changing behavior
- `perf` — measurable performance improvement
- `test` — adds or fixes tests only
- `docs` — documentation only
- `style` — formatting, whitespace, no logic change
- `chore` — build scripts, deps, tooling, config
- `ci` — CI/CD pipeline changes
- `revert` — reverts a previous commit

**Scope** — derive from the file paths changed:
- Group changed files by top-level domain folder (e.g. `src/auth/`, `src/payments/`, `api/`)
- If all changes are in one domain → use that as scope (e.g. `auth`, `payments`)
- If spread across multiple unrelated domains → omit scope
- If it's a config file at root → scope is the tool name (e.g. `eslint`, `docker`, `ci`)

**Breaking change** — flag if any of:
- A function/method signature changed (params removed, renamed, reordered)
- A public API endpoint changed (path, method, required fields)
- An exported symbol was removed or renamed
- A required env var was added
- A database schema change that isn't backward-compatible

**Ticket/issue** — if branch name contains a ticket pattern (PROJ-123, #456, ISS-789), include it in the commit footer.

**Size warning** — if diff is >400 lines changed, warn: "This is a large diff. Consider splitting into smaller commits for easier review." Ask if the user wants to proceed anyway.

---

## Step 4 — Draft the commit message

Format:
```
<type>(<scope>): <imperative summary, max 72 chars>

<body — only if the WHY is non-obvious>

<footer>
```

Rules for the summary line:
- Imperative mood: "add", "fix", "remove" — not "added", "fixes", "removing"
- No period at the end
- No vague words: "update", "change", "improve" — be specific about what changed
- Good: `fix(auth): prevent session fixation on concurrent logins`
- Bad: `fix: update auth stuff`

Rules for the body (include only when genuinely needed):
- Explain WHY the change was made, not what it does
- Mention the constraint, bug, or tradeoff that drove the decision
- If fixing a bug: briefly describe the root cause
- Max 3-4 sentences

Footer (include when applicable):
- `Fixes #123` or `Closes PROJ-456` — links issue from branch name
- `BREAKING CHANGE: <description>` — if breaking change detected

---

## Step 5 — Present and confirm

Show the full proposed commit message in a code block.

If a breaking change was detected, highlight it clearly and ask the user to confirm the `BREAKING CHANGE` footer wording.

Ask: "Commit with this message? (yes / edit / cancel)"

- yes → proceed
- edit → let the user provide the corrected message or parts
- cancel → stop

---

## Step 6 — Commit

Run:
```bash
git commit -m "<message>"
```

For multiline messages use a heredoc or `-m` with `\n`.

After committing:
- Run `git log --oneline -1` to confirm success
- Check if local branch is ahead of remote: `git status -sb`
- If ahead: mention "You're N commit(s) ahead of origin. Run `git push` when ready."

---

## Amend mode

If argument is "amend" or the user says "fix last commit" / "amend":
- Show the last commit: `git log -1 --format="%H %s%n%b"`
- Show what's currently staged (if anything)
- Ask what to change: message only, or add staged changes too
- Run `git commit --amend` appropriately
- Warn if the commit was already pushed: "This commit has been pushed. Amending will require a force push — consider `git revert` instead."

---

## WIP mode

If argument is "wip":
- Stage everything: `git add -A`
- Commit with message: `wip: <short description of current state>`
- No confirmation needed — fast save
- Remind: "WIP commit created. Remember to squash or amend before merging."
