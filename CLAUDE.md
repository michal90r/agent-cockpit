# Agent Cockpit — Claude Agent Schema & Operating Manual

Read this completely before doing anything else in this wiki. It defines the operating protocol; page templates live in `wiki/_schema.md`. Every significant subdirectory carries its own `CLAUDE.md` with local conventions — read the local one before editing inside it.

This repo is a **starter kit** — a git-backed wiki the agent maintains under the protocol below. Everything here is generic scaffolding with no personal content yet; populate the empty structure as you work. (The what-and-why for humans — the pitch and quick-start — lives in `README.md`.)

Naming: **agent-cockpit** is the repo (the control surface you steer from); **wiki** is the substrate it tends — hence the `wiki/` directory and the `wiki-write` / `wiki-clean` skills. Two layers, two names; they don't compete.

---

## Directory Layout

```
agent-cockpit/
├── CLAUDE.md            ← this schema (big-picture operating manual)
├── raw/                 ← immutable source documents (never modify)
├── wiki/                ← everything you write and maintain
│   ├── _schema.md       ← page templates (source/entity/concept/overview/index/log)
│   ├── index.md         ← two-level router (thin)
│   ├── index/           ← per-domain sub-indexes (full catalogs)
│   ├── log.md           ← append-only chronological record
│   ├── overview.md      ← evolving high-level synthesis of the whole domain
│   ├── entities/        ← people, organizations, products, places
│   ├── concepts/        ← ideas, techniques, frameworks, theories
│   ├── sources/         ← one summary page per ingested source
│   └── chats/           ← filed chat threads
├── outputs/             ← generated artifacts: slides, charts, tables
├── scripts/             ← engine code backing the skills
├── memory-template/     ← convention for the agent's persistent memory
└── .claude/skills/      ← Claude-facing custom skills
```

**Read/write boundary:** you read from `raw/`; you write to `wiki/` and `outputs/`. Never modify source files in `raw/`.

---

## Topic Continuity Rule (applies before every response)

Before responding to any input — question, statement, ingest, screenshot, casual remark, anything — first check whether the topic already exists in the wiki.

1. Read `wiki/index.md` (the two-level **router**) → pick the matching domain → open that domain's sub-index `wiki/index/<domain>.md` and look for related pages (entity, concept, source slug, project name, named product, named person). A topic spanning >1 domain → read both sub-indexes. On ingest, refresh the **sub-index** (the router only changes when a whole domain is added/removed).
2. If a related page exists → **continue it**: read the page before answering, ground your response in it, and update it if the input adds information.
3. If nothing related exists → **create**: file the new topic via the appropriate workflow (ingest tier for sourced content; new concept/entity stub for an emerging thread).

This applies to every input, not just `/ingest` calls or explicit questions. Continuation cues — "we talked about", "this topic", "again", "still", any named entity, product, or project — are hard triggers, but the absence of a cue does not exempt the check.

**Why this is mandatory:** the value of this wiki is compounding context. Skipping the check means giving advice without history, duplicating pages, and losing cross-references. A "quick helpful answer" without the wiki check is a regression, not a shortcut.

---

## Wiki Write Protocol (mandatory)

**ALL writes to tracked files in this repo MUST go through the `wiki-write` skill** (`.claude/skills/wiki-write/SKILL.md`). No direct `git commit`, no ad-hoc `git push`, no editing without first invoking the skill.

**Scope (skill required):** `wiki/**`, `outputs/**`, root config (`CLAUDE.md`, `README.md`), `.claude/skills/**`.
**Out of scope (skill not required):** reads; `raw/**` (immutable — never modify).

**What the skill enforces (see the skill for the exact phases):** pull-rebase before editing → one atomic, ISO-timestamped commit (only changed files, never `-A`) → immediate push → guardrails (no force-push, no `--no-verify`, no secrets staged, no silent conflict resolution).

**Invocation discipline:** invoke ONCE per logical task; batch all related edits inside one invocation. Do not split per-file. Do not commit between edits.

---

## Ingest

Trigger: `/ingest`, or any request to file content. The `ingest` skill runs the full procedure — Topic-Continuity check first, then source page → entity/concept updates → sub-index → `log.md`. Pick how deep to go by tier:

### Ingest Tiers

Determine tier at the start of every ingest based on how much the content compounds. Default: light for URLs/news, medium for saved articles, deep for papers/books/major decisions.

- **Light** — news, briefings, daily intelligence. _Content that decays._ Output: append one entry to `wiki/log.md` only. Optionally one concept page IF the source introduces a genuinely new idea. Skip source page, entity updates, overview.
- **Medium** — article, focused decision, technical reference. _Worth capturing, not deep synthesis._ Output: source page (~30–50 lines) + update 1–3 existing concept/entity pages. Skip overview.
- **Deep** — paper, book, system design, major decision. _Worth full synthesis._ Output: source page (long), 5–15 touched pages, overview update if the source shifts the synthesis.

---

## Two-Level Index Router

The index is sharded: `wiki/index.md` is a **thin router** (a list of domains); the full per-page catalogs live in `wiki/index/<domain>.md`.

**Why sharded:** a single monolithic index grows to tens of thousands of tokens and gets loaded into context at every session start. Sharding lets the agent descend to the one relevant domain instead of reading the whole catalog. The descent is mandatory, not optional.

**Update rule:** on ingest you update the **sub-index** for the page's domain (add a row, refresh a description). The router (`wiki/index.md`) only changes when a whole domain is added or removed.

A domain is the top-level partition of your knowledge (e.g. `work`, `health`, `projects`, `reference`). Pick domains that match how you actually think; a page on the boundary of two domains lives in one and is cross-linked from the other.

---

## Query Workflow

After the Topic Continuity check:
1. Read the wiki pages identified; follow cross-references as needed.
2. Answer with citations to wiki pages (`[[page-name]]`).
3. If the answer is non-trivial, ask whether to file it back as a new concept page, an update to an existing page, or a new `outputs/` artifact.

---

## Lint

Wiki hygiene. The `wiki-clean` skill runs the mechanical scan + triage (orphans, dead links, stubs, stale `review_by`, contradictions, near-duplicates) and proposes a candidate list — it never edits. Append a lint entry to `wiki/log.md` after you act on it.

---

## Output Formats

Store generated artifacts in `outputs/` and link from relevant wiki pages.

| Format | When to use | Tooling |
|--------|-------------|---------|
| Markdown page | Default analysis/comparison/synthesis | Markdown edits |
| Slide deck | Presentation output | Markdown + Marp |
| Data tables | Structured side-by-side analysis | Markdown tables |
| Charts | Numeric trends and visual comparisons | Python + matplotlib |

---

## YAGNI Decision Ladder (any code work)

Before adding any new code, climb this ladder. Stop at the first "yes":
1. Does this need to exist at all? (Can the requirement be met by doing nothing?)
2. Can a standard library / language built-in handle it?
3. Is there a native platform feature for it? (e.g. HTML `<dialog>`, `Intl`, `URL`)
4. Does an already-installed dependency do it?
5. Can it be a one-liner?

Only when every answer is "no", write new code — and only the minimum to make it work. No abstraction layers, config options, or dependencies for hypothetical future needs.

---

## Skill Routing

- `wiki-write` — **mandatory for ALL writes** (see Wiki Write Protocol).
- `ingest` — file a conversation or content into the wiki (source page + entity/concept updates + index/log).
- `wiki-clean` — read-only hygiene sweep: a mechanical scanner (`scripts/wiki-clean.mjs`) surfaces orphans, dead links, stubs, stale `review_by`, off-router pages, and duplicate-title suspects; subagents triage them and return a CANDIDATE list for you + the operator to decide. Never edits/deletes — proposal only.
- `summary` — session handoff: paths, decisions, and context for resuming work in a new chat.

---

## Memory

The agent keeps a persistent, file-based memory **outside** this repo (its location is machine-specific to Claude Code). The convention — typed memory files (`user` / `feedback` / `project` / `reference`) indexed by a `MEMORY.md` and cross-linked with `[[slug]]` — is documented in `memory-template/`. Adopt it so the agent learns your preferences over time instead of re-discovering them every session.

---

## Naming Conventions

- Filenames: `kebab-case.md`
- Wiki links: `[[entities/firstname-lastname]]`, `[[concepts/concept-name]]`, `[[sources/source-slug]]`
- Dated content: `<slug>-YYYY-MM-DD.md`. Evergreen: `<slug>.md`.
- Dates: ISO 8601 (`YYYY-MM-DD`)
- Tags: lowercase, hyphenated

---

## Operating Principles

- You propose; the operator directs.
- **The operator's decision loop is the bottleneck, not agent speed.** End non-trivial responses with a decision block (changed · trade-off · open question · next move); for ambiguous or multi-step work, surface the plan first; flag blind alleys before taking them.
- After updates, provide a brief change summary (what changed and why).
- Never fabricate; if uncertain, say so and track it as an open question.
- Entities are things; concepts are ideas.
- Prefer dense, high-signal pages with strong cross-links over verbose ones.
- Optimize for persistent compounding knowledge (wiki-first), not one-off chat outputs.
- Keep source files immutable; write only to `wiki/` and `outputs/`.
- **Scripts and scratch live in the repo, not `/tmp`.** Engine/script → `scripts/` (committed, with a row in `scripts/CLAUDE.md`); ephemeral scratch → repo-local `.cache/` (gitignored). Secrets via `${ENV}` / `.env` (gitignored), never hard-coded; paths relative to the repo, not absolute.
- **Writes go through `wiki-write`:** never `git commit` / `git push` outside the skill.
- **Session sync:** a `PreToolUse` hook (`.claude/settings.json`) runs `git pull --rebase --autostash` before the first action each session (once per 10 min, per session) — the checkout stays current across machines with no manual step. It uses `--autostash` so a dirty working tree does not disarm the pull, and only marks itself done on success. Portable via `${CLAUDE_PROJECT_DIR:-$PWD}` — same file works on macOS and a Linux VPS unchanged.
- **Context hygiene:** model quality degrades in very long sessions; proactively offer `/summary` for handoff before quality drops.
- **Date awareness:** when computing time deltas, run `date +%Y-%m-%d` first — never guess from memory.
- **Data accuracy:** when using web URLs or source-specific facts, verify by fetching directly. If a URL cannot be fetched, state that explicitly. Do not cite unverified claims as facts.
