Explore git history with smart filtering, search, and visual output.

Arguments: $ARGUMENTS (optional: filter like "author:shaswata", "file:src/auth.js", "search:loginBug", "today", "since:2024-01-01", or a branch/tag name)

---

## Step 1 — Parse the argument

Detect filter type from the argument:

| Pattern | Meaning |
|---------|---------|
| `author:<name>` | Filter by author name/email (partial match) |
| `file:<path>` | History for a specific file |
| `search:<text>` | Find commits where this string was added or removed (`-S`) |
| `message:<text>` | Search commit messages (`--grep`) |
| `today` | Commits from today |
| `yesterday` | Commits from yesterday |
| `since:<date>` | Commits after a date (ISO or relative like "2 weeks ago") |
| `branch:<name>` | Commits unique to that branch vs main |
| `tag:<name>` | Changes since a tag |
| No argument | Last 20 commits on current branch |

---

## Step 2 — Build and run the log command

Base format:
```bash
git log --oneline --graph --decorate --color \
  --format="%C(yellow)%h%Creset %C(cyan)%ad%Creset %C(green)(%ar)%Creset %C(bold white)%an%Creset %s%C(red)%d%Creset" \
  --date=short
```

Apply filters based on Step 1:
- Author: `--author="<name>"`
- File: `-- <path>` at the end
- Search (code): `-S "<text>"` — shows commits that added/removed the string
- Message: `--grep="<text>" -i`
- Date range: `--since="<date>"` and/or `--until="<date>"`
- Branch unique: `git log main..<branch>` or `git log <branch> --not main`
- Limit: `--max-count=30` by default; show more if user asks

---

## Step 3 — Present results

Show the log output.

After displaying, offer follow-up actions:
1. **Show full diff for a commit** — user picks a hash → `git show <hash>`
2. **See what changed in a file across these commits** → `git log -p -- <file>`
3. **Find who last changed a specific line** → `git blame <file>`
4. **Compare two commits** → `git diff <hash1>..<hash2>`
5. **Check if a commit is in a branch** → `git branch --contains <hash>`

---

## Step 4 — Special modes

**`/log file:<path>`** — file history mode:
```bash
git log --follow --oneline --stat -- <path>
```
Show renames too (`--follow`). Offer to show the diff at each step.

**`/log search:<text>`** — bug archaeology mode:
```bash
git log -S "<text>" --oneline --source --all
```
Explain: "These are commits where the string `<text>` was added or removed from the codebase."
Useful for finding when a bug was introduced or when a feature was deleted.

**`/log branch:<name>`** — "what's on this branch" mode:
Show commits unique to the branch plus:
- `git diff main...<branch> --stat` — files changed vs main
- Whether a PR exists: `gh pr list --head <branch> 2>/dev/null`
