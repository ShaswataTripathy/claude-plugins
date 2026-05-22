Perform a thorough code review of the current changes.

Arguments: $ARGUMENTS (optional: file path, PR number, or "staged")

Steps:
1. Determine what to review:
   - If argument is a file path: read that file.
   - If argument is "staged" or empty: run `git diff --cached` then `git diff HEAD`.
   - If argument is a number: treat as PR and use `gh pr diff <number>`.
2. Analyze the diff across these dimensions:
   **Correctness** — logic errors, off-by-one, null/undefined handling, race conditions
   **Security** — injection risks, auth bypass, sensitive data exposure, insecure defaults
   **Performance** — N+1 queries, unnecessary re-renders, blocking operations, memory leaks
   **Maintainability** — naming clarity, function length, duplication, missing tests
   **API/Interface** — breaking changes, missing error handling, undocumented behavior
3. Format findings as:
   - Severity: 🔴 Critical / 🟡 Warning / 🔵 Suggestion
   - File + line reference
   - Short explanation of the issue
   - Concrete suggestion to fix it
4. End with a summary: overall assessment + top 3 priorities.

Be specific. Reference exact lines. Skip praise — focus on what needs attention.
