Create a well-named git branch and set it up correctly.

Arguments: $ARGUMENTS (issue number, ticket ID, or free-form description — optional)

---

## Step 1 — Show context

Run in parallel:
- `git branch --show-current` — current branch
- `git log --oneline -1` — where HEAD is
- `git branch --sort=-committerdate --format="%(refname:short) %(committerdate:relative)" | head -8` — recent branches

Display this so the user knows where they are before branching.

---

## Step 2 — Get the branch purpose

**If no argument given:**
Ask the user: "What is this branch for?" and let them describe it freely.

**If argument looks like a GitHub issue number (#123 or just 123):**
Try `gh issue view <number> --json title,body,labels 2>/dev/null`.
- If it works: use the issue title as the description, extract labels for type hint
- If gh is not available or fails: ask the user to describe the branch

**If argument looks like a Jira/Linear ticket (PROJ-123, ENG-456):**
Use as-is and prepend to the branch name.

**If argument is free-form text:**
Use it directly as the description.

---

## Step 3 — Determine base branch

Check what branch to branch off from:
- Run `git remote show origin 2>/dev/null | grep "HEAD branch"` to find the default branch
- Fall back to checking if `main` or `master` exists: `git branch -a | grep -E "origin/(main|master)"`

If the user is currently on main/master/develop → branch from there (already correct).
If the user is on a feature branch → warn: "You're currently on `<branch>`, not `main`. Should I branch from `main` instead, or stay on `<branch>`?" — default to main.

---

## Step 4 — Generate the branch name

Format: `<type>/<ticket-slug>` or `<type>/<slug>`

**Type** — infer from description or issue labels:
- `feat/` — new feature, enhancement, issue labeled "feature" or "enhancement"
- `fix/` — bug fix, issue labeled "bug"
- `hotfix/` — critical fix needing fast merge
- `chore/` — dependency updates, tooling, cleanup
- `docs/` — documentation only
- `refactor/` — restructure without behavior change
- `test/` — tests only
- `experiment/` — exploratory, not expected to merge

**Slug rules:**
- Lowercase only
- Words separated by hyphens
- Strip special chars: `?`, `!`, `'`, `"`, `/`, `\`, `(`, `)`
- Max 45 characters total (including type prefix)
- Shorten by removing filler words: "the", "a", "an", "for", "with", "and", "to"
- If ticket ID present: `fix/PROJ-123-short-description`

**Examples:**
- "Add user authentication with OAuth" → `feat/add-user-auth-oauth`
- "#456 Fix login redirect loop" → `fix/456-login-redirect-loop`
- "PROJ-123 Update dependencies" → `chore/PROJ-123-update-deps`

---

## Step 5 — Confirm and create

Show:
```
Branch: feat/add-user-auth-oauth
Base:   main (3 commits ahead of origin/main)
```

Ask: "Create this branch? (yes / rename / cancel)"

On yes:
```bash
git checkout -b <branch-name>
```
or if basing off a specific remote:
```bash
git checkout -b <branch-name> origin/main
```

---

## Step 6 — Post-creation

After creating:
- Confirm: "Switched to new branch `<name>`"
- Ask: "Push to origin and set upstream? (recommended — lets others see the branch and enables PR creation)"
  - If yes: `git push -u origin <branch-name>`
  - If no: remind them to push before opening a PR

If a GitHub issue was used, ask: "Assign this issue to yourself? (`gh issue edit <number> --add-assignee @me`)"
