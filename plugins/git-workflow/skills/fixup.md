Clean up commit history on the current branch before merging — squash, reorder, edit messages.

Arguments: $ARGUMENTS (optional: number of commits to consider, default is all commits since branching from main)

---

## Step 1 — Understand the branch history

Run in parallel:
- `git log --oneline origin/main..HEAD` — commits unique to this branch
- `git log --oneline origin/main..HEAD --format="%H %s"` — for analysis
- `git log --oneline -1 origin/main` — base commit

Display the commits clearly:
```
Commits on this branch (oldest → newest):

1. a1b2c3d feat(auth): add JWT token generation
2. e4f5a6b fix: typo in variable name
3. c7d8e9f WIP: auth tests half done
4. 1a2b3c4 wip: more tests
5. 5d6e7f8 fix(auth): finish tests and edge cases
6. 9g0h1i2 chore: remove console.logs
```

---

## Step 2 — Safety check

**CRITICAL:** Check which commits have been pushed:
```bash
git log --oneline origin/$(git branch --show-current)..HEAD 2>/dev/null
```

If some commits ARE already on the remote:
> "⚠️ N of these commits have been pushed to origin. Rewriting them will require `git push --force-with-lease`. Only do this if you're the sole author of this branch and no one else has pulled it."

Ask: "Proceed anyway? (yes / cancel)"

If the branch has no remote or all commits are local: proceed normally.

---

## Step 3 — Analyze and suggest a cleanup plan

Look at the commit messages and identify:
- **WIP/temp commits** — messages starting with "wip", "temp", "fixup", "checkpoint", "save"
- **Fixup candidates** — small commits that clearly belong with a previous one (e.g. "fix typo in auth", "remove debug logs" right after a feature commit)
- **Duplicate scope** — multiple commits touching the same area that could be one
- **Good commits** — well-written, standalone, should be kept as-is

Propose a cleaned-up commit list, e.g.:

```
Suggested cleaned history:

1. feat(auth): add JWT token generation and tests
   (squash: commits 1 + 3 + 4 + 5)

2. chore: remove console.logs
   (keep as-is: commit 6)

[commit 2 "fix: typo in variable name" → squash into commit 1]
```

---

## Step 4 — Confirm and choose method

Ask: "Does this look right? (yes / customize / cancel)"

- `yes` → proceed with the suggested plan
- `customize` → let user specify exactly which commits to squash, drop, or reorder
- `cancel` → exit without changes

---

## Step 5 — Execute the cleanup

Use interactive rebase under the hood:
```bash
git rebase -i origin/main
```

But instead of opening an editor (which doesn't work in Claude Code), use `GIT_SEQUENCE_EDITOR` to apply the plan non-interactively:

Construct the rebase todo script based on the confirmed plan:
- `pick` → keep as-is
- `squash` → squash into previous with combined message
- `fixup` → squash into previous, discard this commit's message
- `reword` → keep commit but edit its message
- `drop` → remove entirely

Run:
```bash
GIT_SEQUENCE_EDITOR="<script that writes the plan>" git rebase -i origin/main
```

After rebasing, if squashing was done, show the editor for the combined commit message and ask the user to confirm or edit it.

---

## Step 6 — Handle conflicts

If a conflict occurs during rebase:
1. Show which file conflicts: `git diff --name-only --diff-filter=U`
2. Show the conflict hunks
3. Ask user how to resolve or offer to abort: `git rebase --abort`
4. After resolving: `git add <files>` then `git rebase --continue`

---

## Step 7 — Final result

Show:
```bash
git log --oneline origin/main..HEAD
```

Compare before/after commit count.

If commits were pushed before: remind:
```
Your branch history was rewritten. Push with:
  git push --force-with-lease origin <branch>
```
