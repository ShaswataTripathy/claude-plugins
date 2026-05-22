Run a full health audit on all context files — CLAUDE.md, skills, and memory — and score each one.

Arguments: $ARGUMENTS (optional: "verbose" to include full analysis per file)

---

## Step 1 — Find all context files

Collect:
- `~/.claude/CLAUDE.md` (global)
- `~/.claude/commands/**/*.md` (global skills)
- `~/.claude/memory/**/*.md` (memory files)
- `./CLAUDE.md` (project-level)
- Any nested CLAUDE.md files in subdirectories
- `.claude/commands/**/*.md` (project skills)

---

## Step 2 — Score each file

For each file, compute:

**Size score** (0 = healthy, higher = worse):
- Under 100 lines → 0
- 100–200 lines → 1 (watch)
- 200–300 lines → 2 (warning)
- 300+ lines → 3 (critical)

**Token estimate**: approximate (lines × 8 tokens average for instruction prose)

**Recency score** — for skills only:
- Invoked in last 7 days → active
- Not invoked in 30+ days → stale (loads context but never used)

**Content quality issues** (scan for):
- Duplicate rules appearing in multiple files
- Vague instructions: "be helpful", "write clean code", "always consider edge cases" — no behavioral constraint
- Instructions that belong in hooks, not prose: "never commit to main", "always run tests" — CLAUDE.md at 70% effectiveness vs hooks at 100%
- Dead references: mentions of files, tools, or commands that no longer exist in the project
- Excessive examples that pad size without adding instruction value

---

## Step 3 — Report

```
context-doctor audit
──────────────────────────────────────────────────────────────
File                              Lines   Est. Tokens   Score
──────────────────────────────────────────────────────────────
~/.claude/CLAUDE.md               312     ~2,500        ⚠️  Critical
./CLAUDE.md                       87      ~700          ✓  Healthy
~/.claude/commands/git/commit.md  45      ~360          ✓  Healthy
~/.claude/commands/debug/old.md   23      ~184          ⚠️  Stale (unused 47 days)
~/.claude/memory/project.md       203     ~1,624        ⚠️  Warning (at cap)

Total context loaded per session: ~5,368 tokens

Top issues:
  1. ~/.claude/CLAUDE.md is 312 lines — instructions past line 200 are frequently ignored.
     Potential savings: move ~120 lines to skills → save ~960 tokens per message.
  2. 3 rules in ~/.claude/CLAUDE.md duplicate rules in ./CLAUDE.md (lines 44, 89, 201).
  3. ~/.claude/commands/debug/old.md hasn't been used in 47 days.
     Delete it or it keeps loading on every session start.
  4. Lines 156–203 in CLAUDE.md are enforcement rules ("never do X") that should be hooks,
     not prose — prose is ignored ~30% of the time.

Run /context-doctor fix to apply recommendations.
```

---

## Step 4 — Detail mode

If "verbose" argument given, show the specific lines flagged for each issue with the exact recommendation.
