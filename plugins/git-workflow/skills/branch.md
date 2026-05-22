Create a well-named git branch from a description or issue title.

Arguments: $ARGUMENTS (issue title, ticket ID, or free-form description)

Steps:
1. Take the argument provided by the user.
2. If it looks like a ticket ID (e.g. "PROJ-123" or "#456"), prefix the branch with it.
3. Convert the description to kebab-case, strip special chars, max 50 chars total.
4. Suggest branch name in format: `<type>/<ticket-or-slug>`
   - type: feat, fix, chore, docs, refactor
   - Example: `feat/PROJ-123-add-user-auth` or `fix/login-redirect-loop`
5. Confirm with user, then run `git checkout -b <branch-name>`.

If no argument is given, ask the user what the branch is for.
