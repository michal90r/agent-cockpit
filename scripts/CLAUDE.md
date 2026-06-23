# scripts/ — local conventions

Executable scripts powering skills. Every script here is **I/O only** — it fetches or writes data; the *decision* is the agent's (the LLM), never a brittle regex.

## Runtimes

- **Node (.mjs):** the default here. Run as `node scripts/<name>.mjs`. No build step. Use `node --env-file=.env scripts/<name>.mjs` when a script needs secrets.
- Add other runtimes (Python, Bun) as your scripts require, and document them here.

## What lives here

| Script | Purpose | Skill consumer |
|--------|---------|----------------|
| `wiki-clean.mjs` | Read-only hygiene scanner. Walks `wiki/` (+ `outputs/` for link resolution) → deterministic candidates: orphans, dead `[[links]]`, stubs (<10 lines / <55 words), past-due `review_by`, off-router pages, duplicate-title suspects. `--json` / human print / `--today=YYYY-MM-DD`. Convention files (`CLAUDE`/`_schema`) and `memory/` refs are filtered out. Semantic judgment (contradictions, merges) is a subagent's job — the engine only signals. Never writes. | `/wiki-clean` |

## Discipline

- New scripts: add a row to the table above when committing.
- Scripts that touch `wiki/` must respect the wiki-write protocol (atomic commit via the skill, not ad-hoc git).
- Scripts may read `.env` via `--env-file` — never hard-code secrets.
- One-off throwaway scripts: do not commit; run from the repo-local gitignored `.cache/` — never `/tmp` or any OS temp dir (keep all scratch inside the repo so it is portable across machines).
