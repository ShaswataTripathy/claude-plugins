Clean up merged local branches and stale worktrees.

Steps:
1. Run `git branch --merged main` (try `master` if `main` fails) to find merged branches.
2. Filter out `main`, `master`, `develop`, and the currently checked-out branch.
3. Show the user the list of branches that will be deleted.
4. Ask for confirmation before deleting anything.
5. On confirmation, run `git branch -d <branch>` for each.
6. Optionally run `git remote prune origin` to clean up remote-tracking refs — ask first.
7. Report what was deleted.

Never force-delete (-D) without explicit user instruction.
