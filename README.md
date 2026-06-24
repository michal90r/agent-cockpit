# Agent Cockpit

**A git-backed wiki your Claude Code agent maintains for you** — a personal knowledge base in the sense of [Karpathy's LLM wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

Point [Claude Code](https://claude.com/claude-code) at this repo and it reads from and writes to a compounding, cross-linked wiki under a fixed protocol — instead of giving you amnesiac one-off answers. You steer; the agent flies.

This is a **starter kit** — that idea shipped as a fixed, opinionated protocol (continuity as a hard gate before every reply, a sharded index that scales, one atomic write path), so your agent behaves the same from day one. Generic scaffolding, no personal content: clone it, point Claude Code at it, and fill it with your own knowledge.

## Why

LLM chats forget everything between sessions. This wiki makes the agent's knowledge **persist and compound**: every input is checked against what's already written, every conclusion worth keeping is filed back, and every write is an atomic, timestamped git commit. The result is context that grows instead of resetting.

## The core loop

```
input ──▶ Topic Continuity check ──▶ continue an existing page, or ──▶ ingest a new one
                 (read the index)                                            │
                                                                             ▼
                                                          atomic git commit (wiki-write)
```

1. **Continuity** — before answering anything, the agent checks the wiki so it builds on history instead of repeating it.
2. **Ingest** — content is filed as source / entity / concept pages, sized to how much it compounds (light / medium / deep tiers).
3. **wiki-write** — every write goes through one skill: pull-rebase → atomic commit → timestamp → push. No ad-hoc commits.
4. **Memory** — typed, persistent memory (`user` / `feedback` / `project` / `reference`) teaches the agent your preferences over time.

## What's inside

| Path | What |
|------|------|
| `CLAUDE.md` | The operating manual the agent reads first |
| `wiki/_schema.md` | Page templates (source / entity / concept / overview / index / log) |
| `wiki/index.md` + `wiki/index/` | Two-level router: a thin index that shards into per-domain catalogs |
| `.claude/skills/` | `wiki-write`, `ingest`, `wiki-clean`, `summary` |
| `scripts/wiki-clean.mjs` | Read-only hygiene scanner (orphans, dead links, stubs, stale pages) |
| `memory-template/` | The persistent-memory convention |

## Mechanisms worth stealing even if you don't adopt the whole thing

- **Topic Continuity Rule** — the anti-amnesia primitive: check the wiki before every response.
- **Two-level index router** — shard a growing index so the agent loads only the relevant domain, not the whole catalog.
- **wiki-write protocol** — all writes through one skill; git as the durable substrate.
- **Ingest tiers** — match the work to how much the content compounds; don't deep-process news that decays.
- **Read-only hygiene sweep** — a mechanical scanner proposes; you dispose. Never auto-mutates.

## Quick start

1. Install [Claude Code](https://claude.com/claude-code).
2. **Fork** it (so you can push to your own copy), clone your fork, and open it with Claude Code. Want a purely local wiki instead? Run `rm -rf .git && git init` — the agent then commits locally and skips pushing.
3. Read `CLAUDE.md` (the agent reads it automatically).
4. Drop a document in `raw/`, then ask the agent to `/ingest` it.
5. Check the wiki stayed clean: `node scripts/wiki-clean.mjs`.

No secrets or dependencies are needed — it's markdown + git + Node.

## License

MIT — see [LICENSE](LICENSE). Copy it, fork it, make it yours.
