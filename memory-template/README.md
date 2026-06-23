# memory-template/ — the agent's persistent memory convention

Claude Code can keep a persistent, file-based memory that survives across sessions. Its real location is **outside this repo** and machine-specific (under Claude Code's project data dir). This folder documents the *convention* and ships a template so the agent learns your preferences over time instead of re-discovering them every session.

## How it works

- One memory = one file holding one fact, with frontmatter.
- `MEMORY.md` is the index: one line per memory, loaded into context each session. It never holds memory content — just pointers.
- Memories cross-link with `[[slug]]`, the same as wiki pages.

## File format

```markdown
---
name: <short-kebab-case-slug>
description: <one-line summary — used to decide relevance during recall>
metadata:
  type: user | feedback | project | reference
---

<the fact; for feedback/project, follow with **Why:** and **How to apply:** lines.
Link related memories with [[their-name]].>
```

## The four types

- **user** — who the user is (role, expertise, durable preferences).
- **feedback** — guidance on how the agent should work (corrections and confirmed approaches); always include the why.
- **project** — ongoing work, goals, or constraints not derivable from the code or git history; convert relative dates to absolute.
- **reference** — pointers to external resources (URLs, dashboards, tickets).

## Discipline

- Before saving, check for an existing file that already covers it — update rather than duplicate.
- Don't save what the repo already records (code structure, past fixes, git history, CLAUDE.md).
- Delete memories that turn out to be wrong.

See `example-memory.md` for the shape. To adopt: copy `MEMORY.md` and your memory files into Claude Code's memory directory for this project (it will tell you the path).
