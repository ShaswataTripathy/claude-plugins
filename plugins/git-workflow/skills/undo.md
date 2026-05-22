Safely undo or revert commits with full explanation of consequences.

Arguments: $ARGUMENTS (optional: number of commits to undo, default 1; or "push" to undo a pushed commit safely)

---

## Step 1 — Show what can be undone

Run:
- `git log --oneline -10` — last 10 commits with hashes
- `git status --short` — any uncommitted changes
- `git log --oneline origin/$(git branch --show-current)..HEAD 2>/dev/null` — commits NOT yet pushed to remote

Mark each commit in the log as `[local only]` or `[pushed]` based on whether it's in the above diff.

---

## Step 2 — Clarify the intent

Ask the user what they want to undo (if not clear from the argument):

1. **Undo last commit, keep changes staged** — "I committed too soon, want to recommit"
2. **Undo last commit, keep changes unstaged** — "I want to re-examine and re-stage selectively"
3. **Undo last commit, discard all changes** — "Throw it away completely"
4. **Undo a specific commit (further back)** — show the log and ask which hash
5. **Revert a pushed commit** — create a new commit that reverses it (safe for shared branches)

Default to option 2 (unstaged) if ambiguous — it's the least destructive.

---

## Step 3 — Safety check for pushed commits

**CRITICAL:** Before any reset that would rewrite history:
- Check if the target commits are in `[pushed]` state
- If yes: warn clearly:

  > "Commit `<hash>` has already been pushed to origin. Resetting it locally will cause your branch to diverge from remote and require a force push, which can destroy teammates' work if they've pulled this commit.
  >
  > **Safer option: use `git revert`** — it adds a new commit that undoes the change without rewriting history. This is always safe to push."

- Ask: "Use `git revert` (safe) or reset anyway (requires force push)?"
- Only proceed with reset if user explicitly chooses it

---

## Step 4 — Execute

**Undo N commits, keep changes staged (`--soft`):**
```bash
git reset --soft HEAD~N
```

**Undo N commits, keep changes unstaged (`--mixed`, default):**
```bash
git reset HEAD~N
```

**Undo N commits, discard everything (`--hard`):**
```bash
git reset --hard HEAD~N
```
→ Extra confirmation required: "This will permanently discard all changes in those commits. Are you sure? (type 'yes' to confirm)"

**Revert a specific commit (safe for pushed):**
```bash
git revert <hash> --no-edit
```
→ For a range: `git revert <oldest-hash>^..<newest-hash>`

**Undo a specific commit mid-history (rebase drop):**
→ Only if the commit is local-only
→ Identify the parent: `git log --oneline | grep -A1 <hash>`
→ Run interactive rebase approach: `git rebase --onto <parent> <hash> HEAD`
→ Confirm carefully — show the commits that will remain

---

## Step 5 — After undoing

- Run `git log --oneline -5` and `git status` to show the new state
- If `--hard` was used: show what was discarded (from the pre-reset reflog: `git reflog -3`)
- Remind user: "If you need to recover, `git reflog` has the old commit hash for the next 90 days."
- If the branch now diverges from remote: explain what push command is needed (`--force-with-lease`)
