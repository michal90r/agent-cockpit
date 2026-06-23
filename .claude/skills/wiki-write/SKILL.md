---
name: wiki-write
description: Mandatory wrapper for ALL writes to this repo. Pulls --rebase from the default branch before any edit, batches all related changes into ONE atomic commit with an ISO timestamp, pushes immediately when a remote is configured.
---

## Scope (skill required)

`wiki/**`, `outputs/**`, root config (`CLAUDE.md`, `README.md`), `.claude/skills/**`

Skip for: reads, `raw/**`.

## Phase 1 — sync

```bash
git fetch origin && git pull --rebase
```

**No remote configured (local-only wiki)?** Skip this phase — go straight to Phase 2.

Dirty tree → STOP, surface to the operator. Rebase conflict → resolve per file type (log.md: union + chronological order; index sub-indexes: table merge; concepts/entities: semantic merge; root config/skills: STOP, ask), then `git add <file> && git rebase --continue`.

## Phase 2 — write

Make all edits. Batch everything into one logical task — do NOT commit between edits.

## Phase 3 — commit + push

```bash
date +"%Y-%m-%d %H:%M %Z"              # real timestamp, never guessed
git add <only changed files>          # never -A or .
git diff --cached --stat              # verify before committing
git commit -m "wiki: <desc> [YYYY-MM-DD HH:MM TZ]"
git push                              # skip if no remote (local-only)
```

**No remote (local-only)?** Skip the push — the commit is saved locally; you're done. Push rejected for **non-fast-forward** (a newer commit upstream) → `git pull --rebase && git push`; retry once, then STOP. Push rejected for **no upstream / no permission** (you cloned a repo you can't push to) → the commit is already saved locally; warn and continue, do NOT STOP — set your own remote when ready.

## Phase 4 — verify

```bash
git show --stat HEAD && git status --short
```

`show` lists exactly the intended files + an empty `status` = done. Mismatch (missing/extra file, dirty tree) → STOP, surface to the operator; never silently re-commit.
