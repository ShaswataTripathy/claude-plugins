Generate a conventional commit message and commit all staged changes.

Steps:
1. Run `git diff --cached` to see what's staged. If nothing is staged, run `git status` and tell the user.
2. Analyze the diff and write a commit message following the Conventional Commits spec:
   - Format: `<type>(<scope>): <short summary>`
   - Types: feat, fix, docs, style, refactor, test, chore, perf, ci
   - Keep the summary under 72 characters
   - Add a body paragraph if the change is non-obvious (explain WHY, not what)
3. Show the proposed message to the user and ask for confirmation or edits.
4. Once confirmed, run `git commit -m "<message>"`.

Do not add Co-Authored-By lines unless the user asks.
Do not commit if there are no staged changes.
