Generate an end-of-session report with token usage breakdown and recommendations for the next session.

Steps:
1. Read the call counter from `~/.claude/plugins/token-guard/call-count.json`.
   If missing or empty, explain there's nothing to report.

2. Analyze the session:
   - Total tool calls
   - Session duration (sessionStart to now)
   - Average calls per hour
   - Estimated peak context fill

3. Read `~/.claude/projects/<current-project-hash>/` if accessible to get additional session context.

4. Generate the report:

```
token-guard session report
───────────────────────────────────────
Session duration:    3h 42m
Total tool calls:    61
Peak context fill:   ~94% (critical threshold approached)
Avg burn rate:       16.5 calls/hour

Most expensive operation types (estimated):
  Bash commands:     ~28 calls
  File reads:        ~18 calls
  File writes/edits: ~15 calls

Session health: ⚠️  High burn — approached context limit

Recommendations for next session:
  1. Run /compact after every major task milestone, not just
     when context fills up. Earlier compaction = cheaper per call.
  2. Use /token-estimate before starting large tasks to plan breaks.
  3. Avoid reading files you don't intend to modify — use grep
     to locate relevant lines before reading the full file.
  4. Your highest-cost pattern was likely unfiltered Bash output.
     Pipe commands through head -50 or grep to limit what lands in context.
```

5. Reset the counter file after generating the report so the next session starts clean.
   Ask first: "Reset session counter for the next session? (yes/no)"
