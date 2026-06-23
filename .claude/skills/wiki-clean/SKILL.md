---
name: wiki-clean
description: Read-only wiki hygiene sweep. Runs the mechanical scanner (scripts/wiki-clean.mjs), dispatches subagents to triage the candidates (contradictions, stale claims, near-duplicates, thin stubs, dead links, orphans), and returns a prioritized CANDIDATE list for the operator to decide on. NEVER edits or deletes — proposal only. Trigger: /wiki-clean.
---

Read-only. This skill **proposes**; the operator **disposes**. Do NOT edit or delete any wiki content while running it.

Division of labour: the mechanical scan and the page reading run on a cheap model (breadth); the main loop only collates and judges. Spend expensive tokens on the decision, not on reading every page.

1. **Mechanical scan (deterministic, no model).** Run `node scripts/wiki-clean.mjs --json` (add `--today=YYYY-MM-DD` from `date` for a fixed day). It emits candidates the LLM should not have to guess at — `orphans`, `brokenLinks`, `stubs`, `staleReview`, `indexMissing`, `dupeTitles` — with paths and line numbers. The script never writes. If it returns near-empty, say so; a clean wiki is a valid result, not a reason to invent work.

2. **Semantic triage (read-only).** Dispatch subagents — preferably a structurally read-only agent type (no Edit/Write) — pinned to a cheap model. Shard by domain (`wiki/index/<domain>`) when the candidate list is large; a single subagent when small. Each reads the flagged pages + their neighbours and judges what the script cannot:
   - **contradictions** — a claim conflicting with another page,
   - **staleness** — a claim superseded by a newer source/page,
   - **near-duplicates** — two pages that should be one (name the merge target + which survives),
   - **stubs** — too thin: grow, merge, or drop?,
   - **orphans / indexMissing** — wire into a router/sub-index, or let die,
   - **dead links** — fix the target, create the missing page, or remove the link,
   - **missing cross-refs** — related pages that should link each other.
   Each finding returns: `{ class, pages[], issue, evidence (quote + path:line), suggestedAction, confidence: high|med|low }`. Subagents must mutate nothing.

3. **Collate + prioritize (main loop).** Merge subagent findings with the mechanical signals into ONE candidate report, grouped by action class (MERGE · DELETE? · UPDATE-STALE · FIX-LINK · ADD-XREF · GROW/DROP-STUB · WIRE-INDEX). De-duplicate overlap; sort by confidence × impact.

4. **Present, do not act.** Show the operator the candidate list as a decision block, then STOP. Only if the operator approves specific items do you act — and acting goes through the `wiki-write` skill (one atomic commit per logical cleanup) plus a lint entry appended to `wiki/log.md`. Approval is the operator's call, never the skill's.

Hard rules:
- Zero mutations to `wiki/**`, `outputs/**` during the sweep. The only allowed side effect is an OPTIONAL report saved to `outputs/wiki-clean/<date>.md`, and only if the operator asks to persist it.
- Never delete on your own initiative — deletion is always operator-approved, even for a clear orphan or stub.
- Scale to the ask: "quick pass" → one subagent, high-confidence findings only; "deep clean" → per-domain subagents + a completeness critic asking "what did the scanner miss?".
