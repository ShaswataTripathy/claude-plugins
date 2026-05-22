Estimate how many tool calls a task will consume before starting it.

Arguments: $ARGUMENTS — describe the task, e.g. "refactor the auth module" or "add tests for all API endpoints"

Steps:
1. Parse the task description from the argument.

2. Gather context about the codebase scope:
   - Run `find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" | wc -l` to get total file count
   - Identify which areas of the codebase the task will touch based on the description
   - Run `git diff --stat HEAD~5` or similar to understand typical change scope

3. Score the task across these dimensions:

   **Read depth** — how much code Claude will need to read first:
   - Single file fix → Low (2–5 reads)
   - Feature spanning 3–10 files → Medium (10–20 reads)
   - Codebase-wide change → High (30+ reads)

   **Write scope** — how many files will be modified:
   - 1–3 files → Low
   - 4–15 files → Medium
   - 15+ files → High

   **Iteration likelihood** — tasks that usually require back-and-forth:
   - "Add a function" → Low
   - "Write tests for X" → Medium (test-run-fix loops)
   - "Debug why X is broken" → High (investigation loops)
   - "Refactor Y to use Z pattern" → High

4. Output estimate:

```
token-guard estimate: "add tests for all API endpoints"
───────────────────────────────────────────────────────
Read depth:          High (need to read all endpoint files)
Write scope:         Medium (~12 test files)
Iteration likelihood: Medium (test runner feedback loops)

Estimated tool calls: 45–70
Estimated context fill: 70–108%

⚠️  This task may require a /compact mid-way through.
    Recommendation: run /compact after the first 5–6 endpoint
    tests are done, then continue with a fresh context window.
```

5. If the estimate exceeds 100% context fill, suggest how to break the task into stages.
