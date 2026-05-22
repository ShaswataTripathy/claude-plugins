Manage git stashes with names, previews, and safe apply/drop operations.

Arguments: $ARGUMENTS (optional: "save <description>", "list", "apply <n>", "drop <n>", "pop")

---

## Step 1 — Show current stash list

Always start by running:
```bash
git stash list --format="%gd | %cr | %gs"
```

Display as a numbered table:
```
#  Index    Age          Description
0  stash@0  2 hours ago  WIP: half-done auth refactor
1  stash@1  3 days ago   experiment: new routing approach
2  stash@2  1 week ago   stash: auto-stash before sync
```

If no stashes: show "No stashes found." then ask if they want to create one.

---

## Step 2 — Route based on argument

**No argument / "list":** show the list above and ask what to do next.

**"save" or "push" (create a stash):**
→ Go to Step 3 (Create)

**"apply N" or just a number:**
→ Go to Step 4 (Apply)

**"pop":**
→ Apply stash@0 and drop it (Step 4, then Step 5)

**"drop N":**
→ Go to Step 5 (Drop)

**"show N" or "preview N":**
→ Go to Step 6 (Preview)

**"clear":**
→ Confirm: "Delete ALL stashes? This cannot be undone." → `git stash clear`

If argument is ambiguous, infer from context and confirm.

---

## Step 3 — Create a stash

Check current state:
- `git status --short` — uncommitted changes
- `git diff --stat` — what would be stashed

If nothing to stash: inform the user and stop.

Ask for a description if not given in the argument.

Options:
- Stash everything (tracked + untracked): `git stash push -u -m "<description>"`
- Stash only staged changes: `git stash push --staged -m "<description>"`
- Stash specific files: `git stash push -m "<description>" -- <file1> <file2>`

Confirm which option, then run.

After stashing: run `git status` to confirm working tree is clean.

---

## Step 4 — Apply a stash

Show preview of the stash first (Step 6 output).

Check for conflicts with current working tree:
- `git status --short` — are there uncommitted changes that might conflict?
- If yes: warn the user and ask if they want to stash current changes first

Apply:
- `git stash apply stash@{N}` — applies but keeps the stash entry
- Ask: "Keep the stash entry after applying, or drop it?"
  - Drop: `git stash drop stash@{N}`

If apply causes conflicts:
1. Show conflicting files: `git diff --name-only --diff-filter=U`
2. Show the conflicting sections
3. Do NOT auto-resolve — explain what each side represents (stashed vs current)
4. Offer to abort: `git checkout -- <files>` to discard stash changes, or let user resolve manually

---

## Step 5 — Drop a stash

Show the stash entry content first (brief):
```bash
git stash show stash@{N} --stat
```

Confirm: "Drop stash@{N} (`<description>`)? This cannot be undone."

Then: `git stash drop stash@{N}`

---

## Step 6 — Preview a stash

Show rich info:
```bash
git stash show stash@{N} --stat      # files changed summary
git stash show stash@{N} -p          # full diff
```

Format the diff readably — highlight additions/deletions by file.
