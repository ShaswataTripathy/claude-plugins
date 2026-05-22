Generate a structured pull request description from the current branch's changes.

Arguments: $ARGUMENTS (optional: base branch, default "main")

Steps:
1. Determine base branch from argument or default to `main` (try `master` as fallback).
2. Run `git log <base>...HEAD --oneline` to see commits.
3. Run `git diff <base>...HEAD --stat` for a file-level summary.
4. Run `git diff <base>...HEAD` for full diff context.
5. Generate a PR description in this format:

---
## Summary
<!-- 2-4 bullet points: what changed and why -->

## Changes
<!-- Group by area: Backend / Frontend / Config / Tests / Docs -->

## Testing
<!-- What was tested, how to verify, any manual steps needed -->

## Screenshots
<!-- Delete if not applicable -->

## Breaking Changes
<!-- List any breaking API/interface changes, or "None" -->
---

6. If `gh` CLI is available, ask: "Want me to create the PR now?" and offer to run `gh pr create`.

Keep it factual. No marketing language. Focus on what reviewers need to know.
