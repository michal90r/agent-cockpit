# Wiki Schema — Page Templates

This file holds the page templates referenced by `CLAUDE.md`. Open it when you need to create a new page or check the exact frontmatter/section layout. The schema files carry the operating protocol; this file carries the formats.

---

## Source page (`wiki/sources/slug.md`)

```markdown
---
type: source
title: "Full Title"
author: ""
date: YYYY-MM-DD
ingested: YYYY-MM-DD
tags: []
source_file: raw/filename.md
---

# Title

**One-sentence verdict:** What does this source add to the wiki that was not here before?

## Core argument
2-4 sentences. The central thesis or finding.

## Key claims
- Claim 1 — *evidence or caveat*
- Claim 2 — *evidence or caveat*

## Connections
- Supports [[concept or entity]] because ...
- Contradicts [[concept or entity]] because ...
- See also [[related source]]

## Notes
What would a careful reader most want to know? What was non-obvious? Write as if explaining to a smart friend who will not read the source.

## Open questions
Questions this source raises that the wiki does not yet answer.
```

---

## Entity page (`wiki/entities/slug.md`)

```markdown
---
type: entity
subtype: person | org | product | place
name: ""
tags: []
---

# Name

**One-liner:** Role or significance in one sentence.

## Overview
2-5 sentences.

## Key facts
- ...

## Appearances
- [[source-slug]] — what role they play

## Connections
- [[related entity or concept]]
```

---

## Concept page (`wiki/concepts/slug.md`)

```markdown
---
type: concept
name: ""
tags: []
---

# Concept Name

**One-liner:** What this is, in one sentence.

## Core idea
3-6 sentences. Build intuition first, then precision. If you cannot explain it simply, you do not understand it yet.

## Key properties / variants
- ...

## Evidence / examples
- [[source]] — how it demonstrates this concept

## Relationships
- Subset of [[broader concept]]
- Contrasts with [[opposing concept]]
- Enables [[downstream concept]]

## Open questions / unsettled debates
```

Optional frontmatter field (any page type): `review_by: YYYY-MM-DD` — set it when the page carries a forward checkpoint (claims that need re-verification by a date). The `wiki-clean` scanner surfaces pages whose date has passed; after the review, bump or remove the field.

---

## Overview page (`wiki/overview.md`)

A running synthesis of the entire domain. Not a summary of sources — a synthesis. Keep under 800 words; prefer density over length.

---

## Index format (router + sub-indexes)

`wiki/index.md` is a **thin router**; full per-page catalogs live in `wiki/index/<domain>.md`. On ingest update the **sub-index** for the page's domain — the router only changes when a whole domain is added/removed.

**Router (`wiki/index.md`):**

```markdown
---
type: index
---

# Wiki Index — Router

_Last updated: YYYY-MM-DD — N sources, M pages, K outputs_

## Domains
| Sub-index | Scope |
|-----------|-------|
| [[index/<domain>]] | one-line scope of this domain |
```

**Sub-index (`wiki/index/<domain>.md`):** frontmatter `type: index`, then the same four catalog tables, scoped to the domain.

```markdown
---
type: index
---

# <Domain> — Index

## Sources
| Page | Summary | Ingested |
|------|---------|----------|
| [[sources/slug]] | One-line description | YYYY-MM-DD |

## Concepts
| Page | One-liner |
|------|-----------|
| [[concepts/slug]] | ... |

## Entities
| Page | Type | One-liner |
|------|------|-----------|
| [[entities/slug]] | person/org/product/place | ... |

## Outputs
| File | Description |
|------|-------------|
| [[outputs/slug]] | ... |
```

---

## Log format (`wiki/log.md`)

Append-only. Never edit existing entries. Parse tip: `grep "^## \[" wiki/log.md | tail -10`.

```markdown
## [YYYY-MM-DD] ingest | Source Title
- Source file: `raw/filename`
- Pages created: list
- Pages updated: list
- Key finding: one sentence

## [YYYY-MM-DD] query | Question asked
- Pages read: list
- Filed back: yes/no — what was filed

## [YYYY-MM-DD] update | Short title
- Pages updated: list
- Key change: one sentence

## [YYYY-MM-DD] lint | pass N
- Contradictions found: N
- Orphans resolved: N
- New pages created: N
- Notes: ...
```
