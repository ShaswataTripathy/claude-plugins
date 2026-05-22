Sync the current branch with its upstream and resolve any divergence safely.

Arguments: $ARGUMENTS (optional: branch name to sync with, default is main/master)

---

## Step 1 — Snapshot current state

Run in parallel:
- `git status --short` — check for uncommitted changes
- `git branch --show-current` — current branch name
- `git log --oneline -5` — recent local commits
- `git fetch origin 2>&1` — fetch latest remote state

---

## Step 2 — Detect the situation

After fetching, run:
- `git rev-list HEAD..origin/<current-branch> --count 2>/dev/null` — commits behind remote (same branch)
- `git rev-list origin/<current-branch>..HEAD --count 2>/dev/null` — commits ahead of remote
- `git rev-list HEAD..origin/<main> --count 2>/dev/null` — commits behind main

Classify the situation:

**A — Clean, up to date:** nothing to do. Report status and exit.

**B — Behind remote (same branch), no local commits:** safe to fast-forward.
→ `git pull --ff-only`

**C — Ahead of remote only:** already done, just not pushed yet. Report and suggest pushing.

**D — Diverged from remote (same branch):** local and remote have different commits.
→ Explain: "Your local branch and origin/<branch> have diverged. N local commits, M remote commits."
→ Ask: "Rebase local commits on top of remote? (recommended) or Merge? or Cancel"
→ Rebase: `git pull --rebase origin <branch>`
→ Merge: `git pull --no-rebase origin <branch>`

**E — Feature branch behind main:** the main use case — sync feature branch with latest main.
→ Show: "Your branch is N commits behind main. M commits ahead."
→ Ask: "Rebase on main (cleaner history) or merge main in (safer for shared branches)?"
→ Rebase: `git rebase origin/main` (or the target branch)
→ Merge: `git merge origin/main`

---

## Step 3 — Handle uncommitted changes

If there are uncommitted changes at the start:
- Stash them automatically: `git stash push -m "sync: auto-stash before sync"`
- Run the sync operation
- Pop the stash: `git stash pop`
- If stash pop has conflicts: show them clearly and stop — do not try to resolve automatically

---

## Step 4 — Handle rebase conflicts

If a rebase conflict occurs:
1. Show which files conflict: `git diff --name-only --diff-filter=U`
2. Show the conflicting hunks for each file
3. Ask the user how to resolve each conflict or offer to abort: `git rebase --abort`
4. After all conflicts are resolved and `git add`ed, run `git rebase --continue`

Do not auto-resolve conflicts. Present them clearly.

---

## Step 5 — Report result

After a successful sync:
- `git log --oneline -5` — show the new tip
- `git status -sb` — show tracking status
- If rebased: mention "Your branch history was rewritten. You'll need `git push --force-with-lease` to update the remote."
- If merged: mention "A merge commit was created. `git push` will work normally."
