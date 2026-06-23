---
name: ingest
description: Ingest content into the wiki with a source page, entity/concept updates, and index/log updates. Picks an ingest tier (light/medium/deep) first.
---

1. **Topic Continuity check first** — read the router (`wiki/index.md`), descend to the matching domain sub-index, and look for a related page. If one exists, update it rather than duplicating.
2. **Pick the tier** (see root `CLAUDE.md` → Ingest Tiers): light (log only), medium (source page + 1–3 pages), deep (full synthesis).
3. Create/update the source page in `wiki/sources/` with frontmatter (type, tags, dates) — per `wiki/_schema.md`.
4. Create/update the entity and concept pages that appear meaningfully; cross-link them to the source. Flag any contradiction with an existing claim before overwriting.
5. Update the domain sub-index `wiki/index/<domain>.md` and append one entry to `wiki/log.md`.
6. Confirm every touched file, then commit them atomically via the `wiki-write` skill (it handles sync, conflict resolution, and push).

_First ingest into an empty wiki:_ no domain exists yet, so create one — add a `[[index/<domain>]]` row to `wiki/index.md` and a `wiki/index/<domain>.md` from the sub-index template in `wiki/_schema.md`, then file the page into it.
