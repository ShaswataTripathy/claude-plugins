Clean up stale local branches with full context before deleting anything.

Arguments: $ARGUMENTS (optional: "remote" to also clean remote branches, "force" to include unmerged stale branches)

---

## Step 1 — Gather branch intelligence

Run in parallel:
- `git fetch --prune 2>&1` — refresh remote state and prune deleted remote refs
- `git branch -vv` — local branches with upstream tracking and last commit
- `git branch --merged $(git symbolic-ref --short HEAD 2>/dev/null || echo main)` — branches fully merged into current
- `git log --branches --not --remotes --simplify-by-decoration --oneline` — local commits not on any remote

---

## Step 2 — Categorize branches

Build a list of candidates with one of these statuses:

**Safe to delete:**
- `merged` — fully merged into main/master/develop via regular merge
- `squash-merged` — diff is empty compared to main (squash-merged via PR); detect with:
  `git log main...<branch> --oneline` returns empty AND branch has commits
- `remote-deleted` — local branch whose remote tracking branch no longer exists (pruned in Step 1)

**Stale (offer to delete, user decides):**
- Last commit older than 30 days AND no open PR detected
- Check for open PRs: `gh pr list --head <branch> --state open 2>/dev/null`

**Protected (never suggest deleting):**
- `main`, `master`, `develop`, `staging`, `production`, `release/*`
- The currently checked-out branch

---

## Step 3 — Display the report

Show a table like:

```
Branch                    Last Commit     Status             Action
─────────────────────────────────────────────────────────────────
feat/add-login            3 days ago      merged             delete
fix/typo-in-readme        2 weeks ago     squash-merged      delete
chore/old-experiment      47 days ago     stale, no PR       review
feat/wip-feature          1 day ago       open PR #234       skip
```

If nothing to clean: "All branches are active or protected. Nothing to clean up."

---

## Step 4 — Confirm deletions

If there are safe-to-delete branches:
Show the exact commands that will run and ask:
"Delete these N merged/squash-merged branches? (yes / select / cancel)"

- `yes` → delete all listed safe branches
- `select` → let user pick which ones to include/exclude
- `cancel` → exit

For stale branches: ask about each one individually ("Delete `chore/old-experiment`? Last commit 47 days ago, no open PR.")

Never auto-delete. Always confirm.

---

## Step 5 — Delete

For each confirmed branch:
```bash
git branch -d <branch>
```

If `-d` fails (not fully merged according to git): warn the user — do NOT use `-D` unless they explicitly say "force delete". Explain that squash-merged branches require `-D` because git doesn't track the merge.

---

## Step 6 — Remote cleanup (if "remote" argument given)

List remote branches that no longer have a local counterpart AND have no open PRs:
```bash
git branch -r | grep -v HEAD | grep -v "origin/main\|origin/master\|origin/develop"
```

For each candidate: `gh pr list --head <branch> --state open 2>/dev/null`

Show candidates, confirm per-branch, then:
```bash
git push origin --delete <branch>
```

---

## Step 7 — Final report

Show:
- How many branches deleted (local + remote)
- Current branch list after cleanup: `git branch -vv`
- If any branches were skipped, explain why briefly
