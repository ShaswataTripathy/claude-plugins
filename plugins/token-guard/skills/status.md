Show current session token health — call count, estimated context fill, and burn rate.

Steps:
1. Read the call counter from `~/.claude/plugins/token-guard/call-count.json`.
   Fields: `count` (tool calls this session), `sessionStart` (epoch ms).

2. Estimate context fill:
   - 0–29 calls  → Low    (~0–59%)
   - 30–49 calls → Medium (~60–79%)
   - 50–64 calls → High   (~80–94%)
   - 65+ calls   → Critical (~95%+)

3. Calculate burn rate: calls per hour since sessionStart.

4. Estimate time remaining at current rate before reaching the 65-call critical threshold.

5. Run `/usage` to get the official session usage window percentage if available.

6. Display:
```
token-guard status
───────────────────────────────────────
Tool calls this session:  42
Estimated context fill:   ~84% (High)
Session age:              2h 14m
Burn rate:                ~19 calls/hour
Time to critical:         ~1h 14m at current rate

Recommendation: Run /compact now to reset the context window
and extend your effective session time.
```

7. If the session counter file doesn't exist, explain that the hook hasn't fired yet (no tool calls recorded) and suggest running a simple command to trigger it.
