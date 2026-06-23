# wiki/ — local conventions

Primary writing surface. All persistent knowledge lives here.

## Layout

- `_schema.md` — page templates (source/entity/concept/overview/index/log). Open it when creating any new page.
- `index.md` — thin router. `index/<domain>.md` — per-domain catalogs. Update the sub-index on every ingest.
- `log.md` — append-only chronological record. One entry per ingest/update/query-filed-back/lint.
- `overview.md` — running synthesis of the whole domain. Touch only on **deep**-tier ingests that shift overall understanding.
- `sources/`, `concepts/`, `entities/`, `chats/` — content pages.

## Write discipline

- All writes go through the `wiki-write` skill (see root `CLAUDE.md`). No direct commits.
- Always cross-link: new pages without inbound or outbound `[[wikilinks]]` are orphans (the `wiki-clean` scanner flags them).
- Filename convention: `kebab-case.md`. Dated content: `<slug>-YYYY-MM-DD.md`. Evergreen: `<slug>.md`.
- When ingesting, run the **Topic Continuity** check first (root `CLAUDE.md`) — continue an existing page before creating a new one.
