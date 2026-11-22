# PF-NNN — Progress handoff

## §0 CURRENT STATE (read this first when resuming)

**Ticket**: PF-NNN — {summary} · **Done means**: {one line} · **Branch**: `{branch}` · **Updated**: {YYYY-MM-DD HH:MM}

### Where things stand

- {what is built and verified}
- {what is partly done, and exactly where it stopped}

### Source-of-truth docs (read these; don't re-derive them)

| Doc | What it holds |
|---|---|
| `{path to the plan}` | how it is built |
| `{path to the refined requirement}` | what it must do |
| `{../portfolio-implementation-plan.md §n or ../cv-portfolio-content-plan.md §n}` | the master plan section it maps to |

### Decisions and why

- {decision}: {reason}

### Gotchas (verified; don't relearn them)

- {trap, and how to avoid it}

### What's next (in order)

1. {next action}

### Open questions

- {question}: {who decides, and the default currently in place}

### Resume recipe

```bash
git switch {branch} && git status --short
./backend/gradlew -p backend testUnit testIT          # last run: {green, or red with the failing test}
scripts/with-node.sh pnpm --dir frontend test --run   # last run: {result}
```

Key files: `{path:line}`, `{path:line}`.

## Log

{Dated entries, newest first. When §0 is rewritten, move the previous §0 here as a dated entry.}
