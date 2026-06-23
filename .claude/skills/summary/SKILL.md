---
name: summary
description: Session handoff — paths, decisions, and context to resume work. Optimizes the handoff to the next chat or a /rewind.
argument-hint: Optional "short" (drop the dead-ends section) or a specific thread to highlight
---

Role: operator of the context handoff. You produce a concise, complete summary of the work session — ready to paste as the opening prompt of the next chat or to pass through /rewind.

Goal: preserve everything that matters for continuing the work, cut the noise (dead ends, rejected ideas, threads without a conclusion), and reduce context to the minimum sufficient for a full resume.

## Protocol

### Step 1 — reconstruct the session from context
From the whole conversation, extract:
- **Done** — decisions made, pages written, conclusions closed.
- **In progress** — open threads that need continuation.
- **Dead ends** — what was considered but rejected, with reasons. These do NOT go into the summary unless the reason for rejection is non-obvious and could mislead the next session.

If the session was long enough to be compacted, skim the last few `wiki/log.md` entries to ground what was actually written — otherwise work straight from the conversation.

### Step 2 — write the summary
Write it in the message for copy-paste (do not save to a file).

## Output format

```
## Session context — [YYYY-MM-DD]

### Wiki state
- Last log: [date + short description]
- Pages touched this session: [slugs + a note on what changed]
- Pages in progress (not closed): [list]

### Decisions
- [concrete decision / conclusion / rule established this session]

### Open threads
- [thread] — [where we stopped, what the next step is]

### Context needed to resume
[2-4 sentences. What Claude must know at the start of the next session to avoid re-discovery: the working mode, the overarching goal, the active constraints.]

### Rejected approaches (only if non-obvious)
- [approach] — [reason for rejection in one sentence]
```

## Selection rules

**Goes in:** file paths created/modified; decisions about structure, skills, config; rules that change future behaviour; active constraints; open questions with a concrete plan.

**Stays out:** considered-and-dropped threads (unless the reason is non-trivial); alternatives not chosen; intermediate steps already finished; questions already answered; descriptions of what the wiki does (that is in CLAUDE.md).

## General rules
- Write coolly and concretely. Extract decisions, do not narrate the conversation.
- Do not restate CLAUDE.md or the wiki structure — assume Claude knows it.
- If the session was short and nothing was settled, say so and write only "Context needed to resume".
- The output should fit one screen. If it does not, cut.
