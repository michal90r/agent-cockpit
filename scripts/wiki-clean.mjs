#!/usr/bin/env node
// wiki-clean.mjs — mechanical, READ-ONLY hygiene scanner for the wiki.
//
// Surfaces deterministic cleanup CANDIDATES the LLM should not have to guess at:
//   orphans      — flaggable page with no inbound link from any live page or index
//   brokenLinks  — [[wikilink]] in a live page that resolves to no existing page
//   stubs        — flaggable page too thin to be useful (< STUB_LINES body lines)
//   staleReview  — frontmatter review_by date in the past
//   indexMissing — flaggable page not wired into any router index
//   dupeTitles   — same-directory pages with near-identical titles (merge suspects)
//
// It NEVER writes. Judgment (are these real? merge/delete/grow/fix?) is the job of
// the /wiki-clean skill: subagents triage the candidates, the main loop decides.
//
// Run:  node scripts/wiki-clean.mjs [--json] [--today=YYYY-MM-DD]
//   --json           machine output (full lists, no caps)
//   --today=DATE     override "today" for staleReview (default: system date)

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, basename } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(SCRIPT_DIR);
const WIKI = join(ROOT, 'wiki');
const OUTPUTS = join(ROOT, 'outputs');

const STUB_LINES = 10;       // body lines below this => stub candidate
const STUB_WORDS = 55;       // or word count below this
const DUPE_JACCARD = 0.6;    // title token overlap above this => duplicate suspect
const HUMAN_CAP = 30;        // max items printed per category in human mode

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const todayArg = (argv.find((a) => a.startsWith('--today=')) || '').split('=')[1];
const TODAY = todayArg ? new Date(`${todayArg}T00:00:00`) : new Date();
const TODAY_MID = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
const fmtLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------- filesystem walk ----------
function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      out.push(...walk(p));
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(p);
    }
  }
  return out;
}

// ---------- per-file classification ----------
function classify(path) {
  const base = basename(path).replace(/\.md$/, '');
  if (path.startsWith(WIKI)) {
    const rel = relative(WIKI, path).replace(/\.md$/, '');
    const top = rel.includes('/') ? rel.split('/')[0] : '';
    return { realm: 'wiki', top, rel, base };
  }
  if (path.startsWith(OUTPUTS)) return { realm: 'outputs', top: 'outputs', rel: `outputs/${relative(OUTPUTS, path).replace(/\.md$/, '')}`, base };
  return { realm: 'other', top: '', rel: base, base };
}

const FLAGGABLE = new Set(['concepts', 'entities', 'sources']);
// per-directory convention/template files — not content pages, must never be candidates
const CONVENTION = new Set(['CLAUDE', '_schema', 'README', 'AGENTS']);
const isConvention = (c) => CONVENTION.has(c.base);
const isIndex = (c) => c.realm === 'wiki' && (c.rel === 'index' || c.rel.startsWith('index/'));
const isChat = (c) => c.realm === 'wiki' && c.top === 'chats';
const isLog = (c) => c.realm === 'wiki' && c.rel === 'log';
const isFlaggable = (c) => c.realm === 'wiki' && FLAGGABLE.has(c.top) && !isConvention(c);
// pages whose outbound links count toward "reachability" (exclude archival chats + the chronological log)
const isInboundSource = (c) => !isChat(c) && !isLog(c);
// pages clean enough that a broken link inside them is worth reporting (template files excluded)
const isBrokenReportSource = (c) => !isConvention(c) && (isFlaggable(c) || c.rel === 'overview' || isIndex(c));

// ---------- frontmatter ----------
function parseFront(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: {}, bodyOffset: 0 };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (mm) fm[mm[1].toLowerCase()] = mm[2].trim().replace(/^["']|["']$/g, '');
  }
  return { fm, bodyOffset: m[0].length };
}

// ---------- title normalization (for dupe detection) ----------
const norm = (s) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
const tokenize = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 2));
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  const inter = [...a].filter((x) => b.has(x)).length;
  return inter / new Set([...a, ...b]).size;
};

// ---------- load all pages ----------
const files = [...walk(WIKI), ...walk(OUTPUTS)];
const pages = [];
const keyToRel = new Map();     // exact rel key  -> rel (unique)
const baseToRels = new Map();   // basename       -> [rel, ...] (may collide)

for (const path of files) {
  const c = classify(path);
  let text = '';
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    continue;
  }
  const { fm, bodyOffset } = parseFront(text);
  const body = text.slice(bodyOffset);
  const bodyLines = body.split('\n').filter((l) => l.trim().length > 0).length;
  const words = body.split(/\s+/).filter(Boolean).length;
  const page = {
    path,
    rel: c.rel,
    top: c.top,
    cls: c,
    title: fm.name || basename(path).replace(/\.md$/, ''),
    reviewBy: fm.review_by || fm['review-by'] || null,
    bodyLines,
    words,
    text,
    inbound: new Set(),
    inIndex: false,
  };
  pages.push(page);
  keyToRel.set(c.rel, c.rel);
  const base = basename(path).replace(/\.md$/, '');
  if (!baseToRels.has(base)) baseToRels.set(base, []);
  baseToRels.get(base).push(c.rel);
}

const relToPage = new Map(pages.map((p) => [p.rel, p]));

// ---------- resolve a single [[link]] target ----------
// template placeholders found in _schema/CLAUDE examples — never real links
const PLACEHOLDER = new Set([
  'page-name', 'link', 'source', 'source-slug', 'page', 'name', 'wikilink',
  'source-name', 'concept-name', 'entity-name', 'their-name',
  'concept or entity', 'related source', 'broader concept', 'opposing concept',
  'downstream concept', 'related entity or concept', 'index/<domain>',
]);

function resolve(rawTarget) {
  let t = rawTarget.split('|')[0].split('#')[0].trim();
  if (!t || t.startsWith('skill:')) return { kind: 'skip' };
  if (t.includes('"') || t.includes(',') || t.includes('...')) return { kind: 'skip' }; // code/array/ellipsis noise
  t = t.replace(/^\.\//, '').replace(/\/+$/, '');
  if (t.startsWith('memory/') || /\.(md|json)$/.test(t)) return { kind: 'memory', target: t }; // memory/external file ref
  if (PLACEHOLDER.has(t)) return { kind: 'skip' };
  if (keyToRel.has(t)) return { kind: 'ok', rel: t };
  const base = t.split('/').pop();
  if (keyToRel.has(base)) return { kind: 'ok', rel: base };
  if (baseToRels.has(base)) {
    const rels = baseToRels.get(base);
    return rels.length === 1 ? { kind: 'ok', rel: rels[0] } : { kind: 'ambiguous' };
  }
  // unresolved: underscore-no-slash slugs are memory cross-refs, not wiki pages
  if (/_/.test(t) && !t.includes('/')) return { kind: 'memory', target: t };
  return { kind: 'broken', target: t };
}

// ---------- pass: links, inbound graph, broken links ----------
const brokenLinks = [];
const LINK_RE = /\[\[([^\]]+)\]\]/g;

for (const src of pages) {
  const lines = src.text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let m;
    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(lines[i])) !== null) {
      const r = resolve(m[1]);
      if (r.kind === 'ok') {
        const target = relToPage.get(r.rel);
        if (target && target !== src && isInboundSource(src.cls)) {
          target.inbound.add(src.rel);
          if (isIndex(src.cls)) target.inIndex = true;
        }
      } else if (r.kind === 'broken' && isBrokenReportSource(src.cls)) {
        brokenLinks.push({ from: src.rel, link: r.target, line: i + 1 });
      }
    }
  }
}

// ---------- assemble candidates ----------
const flaggable = pages.filter((p) => isFlaggable(p.cls));

const orphans = flaggable
  .filter((p) => p.inbound.size === 0)
  .map((p) => ({ page: p.rel, title: p.title }));

const stubs = flaggable
  .filter((p) => p.bodyLines < STUB_LINES || p.words < STUB_WORDS)
  .map((p) => ({ page: p.rel, lines: p.bodyLines, words: p.words }));

const staleReview = [];
for (const p of pages) {
  if (!p.reviewBy) continue;
  const d = new Date(`${p.reviewBy}T00:00:00`);
  if (Number.isNaN(d.getTime())) continue;
  if (d < TODAY_MID) {
    const days = Math.floor((TODAY_MID - d) / 86400000);
    staleReview.push({ page: p.rel, reviewBy: p.reviewBy, daysOverdue: days });
  }
}

const indexMissing = flaggable
  .filter((p) => !p.inIndex)
  .map((p) => ({ page: p.rel }));

const dupeTitles = [];
const byDir = new Map();
for (const p of flaggable) {
  if (!byDir.has(p.top)) byDir.set(p.top, []);
  byDir.get(p.top).push(p);
}
for (const group of byDir.values()) {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const sim = jaccard(tokenize(group[i].title), tokenize(group[j].title));
      if (sim >= DUPE_JACCARD) {
        dupeTitles.push({ a: group[i].rel, b: group[j].rel, similarity: Math.round(sim * 100) / 100 });
      }
    }
  }
}

// stable, deterministic ordering
orphans.sort((a, b) => a.page.localeCompare(b.page));
brokenLinks.sort((a, b) => a.from.localeCompare(b.from) || a.line - b.line);
stubs.sort((a, b) => a.lines - b.lines || a.page.localeCompare(b.page));
staleReview.sort((a, b) => b.daysOverdue - a.daysOverdue);
indexMissing.sort((a, b) => a.page.localeCompare(b.page));
dupeTitles.sort((a, b) => b.similarity - a.similarity);

const report = {
  scanned: {
    files: files.length,
    wiki: pages.filter((p) => p.cls.realm === 'wiki').length,
    flaggable: flaggable.length,
    today: fmtLocal(TODAY_MID),
  },
  candidates: { orphans, brokenLinks, stubs, staleReview, indexMissing, dupeTitles },
};

// ---------- output ----------
if (asJson) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}

const total = Object.values(report.candidates).reduce((n, arr) => n + arr.length, 0);
const out = [];
out.push('WIKI-CLEAN — mechanical scan (read-only)');
out.push(
  `Scanned: ${report.scanned.files} .md files (wiki ${report.scanned.wiki}, flaggable ${report.scanned.flaggable}) · date ${report.scanned.today}`,
);
out.push('');

function section(key, label, fmt) {
  const arr = report.candidates[key];
  out.push(`[${key}] ${label} — ${arr.length}`);
  if (arr.length === 0) {
    out.push('  (none)');
  } else {
    for (const item of arr.slice(0, HUMAN_CAP)) out.push(`  - ${fmt(item)}`);
    if (arr.length > HUMAN_CAP) out.push(`  … +${arr.length - HUMAN_CAP} more (use --json)`);
  }
  out.push('');
}

section('orphans', 'Orphans (no inbound link and not in any index)', (i) => `${i.page}  — "${i.title}"`);
section('brokenLinks', 'Broken links', (i) => `${i.from}:${i.line} → [[${i.link}]]`);
section('stubs', `Stubs (<${STUB_LINES} body lines or <${STUB_WORDS} words)`, (i) => `${i.page}  (${i.lines} lines, ${i.words} words)`);
section('staleReview', 'Past review_by date', (i) => `${i.page}  (review_by ${i.reviewBy}, ${i.daysOverdue} days overdue)`);
section('indexMissing', 'Off-router (not wired into any index)', (i) => i.page);
section('dupeTitles', 'Duplicate-title suspects', (i) => `${i.a} ~ ${i.b}  (${i.similarity})`);

out.push(`SUMMARY: ${total} candidates in 6 categories. These are SIGNALS for judgment, not verdicts — triage on a cheap model, decide in the main loop. The script changes nothing.`);
process.stdout.write(`${out.join('\n')}\n`);
