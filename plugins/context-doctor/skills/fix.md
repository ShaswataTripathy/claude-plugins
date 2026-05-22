Apply context-doctor's recommendations — prune, restructure, and move content to skills.

Arguments: $ARGUMENTS (optional: specific file path to fix, defaults to applying all recommendations)

---

## Step 1 — Get the current audit

If /context-doctor hasn't been run yet this session, run it first and show the results.

Ask: "Apply these changes? (yes / review-each / cancel)"
- `yes` → apply all non-destructive changes automatically
- `review-each` → walk through each change with explicit yes/no
- `cancel` → exit

---

## Step 2 — Remove duplicate rules

Show the duplicates side by side:
```
Duplicate found:
  ~/.claude/CLAUDE.md line 44: "Always use TypeScript strict mode"
  ./CLAUDE.md line 12: "Use TypeScript with strict: true"

Keep the project-level rule (./CLAUDE.md) and remove the global one?
```

On confirmation: remove from the global file, leave the project file.

---

## Step 3 — Move oversized sections to skills

For each block of content in a large CLAUDE.md that belongs in a specific skill:

Show what would move:
```
Lines 156–203 in ~/.claude/CLAUDE.md are deployment-related instructions.
Move them to ~/.claude/commands/ops/deploy-context.md (new skill)?
This saves ~376 tokens per session.
```

On confirmation:
1. Create the new skill file with the content
2. Replace the moved lines in CLAUDE.md with a one-liner: `For deployment context, see the /deploy-context skill.`

---

## Step 4 — Prune stale skills

For each skill unused in 30+ days:
```
~/.claude/commands/debug/old.md hasn't been invoked in 47 days.
Delete it? (It still loads on every session start.)
```

On confirmation: delete the file.

---

## Step 5 — Clean vague instructions

For each flagged vague rule, show it and suggest a tightened version:
```
Current: "Always write clean, maintainable code"
→ This adds tokens but constrains no specific behavior. Remove it?
```

---

## Step 6 — Final report

After all changes:
- Show before/after token counts
- Show the new total context load per session
- Run /context-doctor again to confirm the score improved
