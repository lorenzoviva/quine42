// The documentation in levels (T524, ADR-0266): which document sits at which level, who reads it, and the checks that keep level 1 honest.
// Pure functions over the files of the repository; `tools/documenti/mappa.ts` prints the map, `tests/documenti.test.ts` runs the checks.

import fs from 'node:fs';
import path from 'node:path';

/** The levels: the overview (1), the core (2), the details (3), and the registers, which are searched and never read whole. */
export type DocLevel = 'overview' | 'core' | 'detail' | 'register';

export interface DocEntry {
  /** A file or a folder, relative to the root of the repository. */
  path: string;
  level: DocLevel;
  /** Who reads it, and how. */
  readers: string;
}

export const OVERVIEW = 'docs/panoramica.md';
export const CORE = 'AGENTS.md';
export const DETAILS = 'docs/architettura-dettagli.md';

/**
 * Level 1 fits two pages. Measured in characters of the file (link targets included) and in lines: a limit in lines alone is kept
 * by writing longer lines, as the quadro does (60 lines, 25 KB).
 */
export const OVERVIEW_LIMITS = { chars: 10_000, lines: 120 };

/** A token every 3.5 characters: an estimate for Italian text with code, good enough to compare documents. */
export const CHARS_PER_TOKEN = 3.5;

/** Every document of docs/ and the core, with its level. A new file or folder at the top of docs/ gets a line here (a folder, or files inside it). */
export const DOC_LEVELS: DocEntry[] = [
  { path: OVERVIEW, level: 'overview', readers: "l'autore e ogni agente, per primo e intero" },
  { path: CORE, level: 'core', readers: 'ogni sessione, intero: CLAUDE.md e GEMINI.md lo importano' },
  { path: 'CLAUDE.md', level: 'core', readers: 'Claude Code, con il nucleo' },
  { path: 'GEMINI.md', level: 'core', readers: 'Gemini CLI, con il nucleo' },
  { path: DETAILS, level: 'detail', readers: 'la sezione del sottosistema che il task tocca' },
  { path: 'docs/glossario.md', level: 'detail', readers: 'chi conia o cerca un nome; tests/glossario.test.ts' },
  { path: 'docs/lingua-interna.md', level: 'detail', readers: 'chi tocca un nome su disco, sul filo o in Lua' },
  { path: 'docs/lingue.md', level: 'detail', readers: 'chi tocca la lingua del mondo' },
  { path: 'docs/fasi.md', level: 'detail', readers: "l'autore, il pianificatore; pipeline.mjs step" },
  { path: 'docs/design.md', level: 'detail', readers: 'il design di partenza, di rado' },
  { path: 'docs/design', level: 'detail', readers: 'gli studi, uno per area, quando un task nasce da uno' },
  { path: 'docs/guide', level: 'detail', readers: 'chi fa ciò che la guida dice' },
  { path: 'docs/self-hosting.md', level: 'detail', readers: 'chi ospita un server' },
  { path: 'docs/beta', level: 'detail', readers: 'i beta tester e chi prepara una run' },
  { path: 'docs/lancio', level: 'detail', readers: "l'autore, per il lancio" },
  { path: 'docs/sicurezza', level: 'detail', readers: 'chi tocca server, sessione, sandbox, validatore, crediti; il registro si cerca' },
  { path: 'docs/pipeline/README.md', level: 'detail', readers: 'chi esegue un task della pipeline: le regole del lavoro in parallelo' },
  { path: 'docs/pipeline/orchestra.md', level: 'detail', readers: "l'orchestratore, all'inizio di ogni epoca" },
  { path: 'docs/pipeline/pianifica.md', level: 'detail', readers: 'il pianificatore: dal to-do al backlog' },
  { path: 'docs/pipeline/modelli.md', level: 'detail', readers: 'chi sceglie il provider e lo sforzo di un task' },
  { path: 'docs/pipeline/quadro.md', level: 'register', readers: "la fotografia di oggi, che l'orchestratore riscrive e chi lo sostituisce legge per prima" },
  { path: 'docs/pipeline/orchestrazione.md', level: 'register', readers: "il diario dell'orchestratore: si cerca" },
  { path: 'docs/pipeline/consumi.jsonl', level: 'register', readers: 'i consumi dei task, per le stime' },
  { path: 'docs/pipeline/domande', level: 'register', readers: "le domande per l'autore; l'elenco è aperte.md" },
  { path: 'docs/README.md', level: 'detail', readers: 'le metodologie di prima e dove sono finiti i file storici' },
  { path: 'docs/conversazioni.md', level: 'detail', readers: 'il censimento delle chiamate ai modelli' },
  { path: 'docs/glossario-censimento.md', level: 'register', readers: 'derivato: tools/glossario/glossario.mjs' },
  { path: 'docs/lingue-censimento.md', level: 'register', readers: 'derivato, un censimento' },
  { path: 'docs/temi-censimento.md', level: 'register', readers: 'derivato, un censimento' },
  { path: 'docs/adr', level: 'register', readers: "per numero; l'indice è adr/README.md" },
  { path: 'docs/plans', level: 'register', readers: 'la pipeline e il pianificatore; un task riceve il suo blocco in .pipeline-task.md' },
  { path: 'docs/userchats', level: 'register', readers: "le richieste dell'autore: to-do.md e le sue copie datate" },
  { path: 'docs/archivio', level: 'register', readers: 'le metodologie di prima' },
  { path: 'docs/catture', level: 'register', readers: 'immagini' },
  { path: 'docs/img', level: 'register', readers: 'immagini' },
];

/** The anchor GitHub gives a heading: lower case, without punctuation, spaces as hyphens. */
export function slugOf(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .replace(/ /g, '-');
}

/** The anchors of a Markdown text: the explicit `<a id="…">` and the headings. */
export function anchorsOf(text: string): Set<string> {
  const anchors = new Set<string>();
  for (const m of text.matchAll(/<a id="([^"]+)"/g)) anchors.add(m[1]);
  for (const m of text.matchAll(/^#{1,6} (.+)$/gm)) anchors.add(slugOf(m[1]));
  return anchors;
}

export interface Link {
  href: string;
  line: number;
}

/** The links of a Markdown text that point inside the repository (not to a site, not to an address). */
export function linksOf(text: string): Link[] {
  const links: Link[] = [];
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z]+:/i.test(m[1])) continue;
      links.push({ href: m[1], line: i + 1 });
    }
  });
  return links;
}

/** The links of a file that lead nowhere: a missing file, or a missing anchor in a Markdown file. */
export function brokenLinks(root: string, file: string): string[] {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const broken: string[] = [];
  for (const { href, line } of linksOf(text)) {
    const [target, anchor] = href.split('#');
    const rel = target ? path.posix.normalize(path.posix.join(path.posix.dirname(file), target)) : file;
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      broken.push(`${file}:${line}: ${href} non esiste`);
      continue;
    }
    if (anchor && rel.endsWith('.md') && !anchorsOf(fs.readFileSync(abs, 'utf8')).has(anchor)) {
      broken.push(`${file}:${line}: ${href} non ha l'ancora #${anchor}`);
    }
  }
  return broken;
}

/** The text of a `## ` section, without its heading, up to the next `## `. */
export function sectionOf(text: string, title: string): string {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`## ${title}`));
  if (start < 0) return '';
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
}

/** The ids of the inviolable rules of the core: `0.`, `8b.`, `8b-bis.`, … at the start of a line of their section. */
export function coreRuleIds(core: string): string[] {
  return [...sectionOf(core, 'Regole inviolabili').matchAll(/^(\d+[a-z]?(?:-bis)?)\. \*\*/gm)].map((m) => m[1]);
}

/** The ids of the rules the overview gives a line: `- **8b**` in its section. */
export function overviewRuleIds(overview: string): string[] {
  return [...sectionOf(overview, 'Le regole inviolabili').matchAll(/^- \*\*(\d+[a-z]?(?:-bis)?)\*\* /gm)].map((m) => m[1]);
}

/** The sections of the details, by their explicit anchor. */
export function detailAnchors(details: string): string[] {
  return [...details.matchAll(/<a id="([^"]+)"/g)].map((m) => m[1]);
}

/** What says the state of a day, which level 1 never says: a task, a version. */
export const VOLATILE = [
  { what: 'un task', re: /\bT\d{2,3}[a-z]?\b/ },
  { what: 'una versione', re: /\b\d+\.\d+\.\d+\b/ },
];

/** Everything that is wrong with level 1 against the core and the details; an empty list when it holds. */
export function overviewProblems(root: string): string[] {
  const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
  const overview = read(OVERVIEW);
  const core = read(CORE);
  const details = read(DETAILS);
  const problems: string[] = [];

  const chars = [...overview].length;
  const lines = overview.split('\n').length;
  if (chars > OVERVIEW_LIMITS.chars) problems.push(`la panoramica ha ${chars} caratteri, più di ${OVERVIEW_LIMITS.chars}`);
  if (lines > OVERVIEW_LIMITS.lines) problems.push(`la panoramica ha ${lines} righe, più di ${OVERVIEW_LIMITS.lines}`);

  overview.split('\n').forEach((line, i) => {
    const visible = line.replace(/\]\([^)]*\)/g, ']');
    for (const { what, re } of VOLATILE) {
      const m = re.exec(visible);
      if (m) problems.push(`${OVERVIEW}:${i + 1}: dice ${what} (${m[0]}), che sta nel quadro o nelle fasi`);
    }
  });

  problems.push(...brokenLinks(root, OVERVIEW));

  const rules = coreRuleIds(core);
  const lined = overviewRuleIds(overview);
  for (const id of rules) if (!lined.includes(id)) problems.push(`la regola ${id} di ${CORE} non ha la sua riga nella panoramica`);
  for (const id of lined) if (!rules.includes(id)) problems.push(`la panoramica ha una riga per la regola ${id}, che ${CORE} non ha`);
  if (lined.join(' ') !== rules.filter((id) => lined.includes(id)).join(' ')) problems.push(`le regole della panoramica non sono nell'ordine di ${CORE}`);

  const linked = new Set(linksOf(overview).map((l) => l.href));
  for (const anchor of detailAnchors(details)) {
    if (!linked.has(`architettura-dettagli.md#${anchor}`)) problems.push(`la sezione #${anchor} dei dettagli non ha un link nella panoramica`);
  }

  if (!linksOf(core).some((l) => l.href === OVERVIEW)) problems.push(`${CORE} non rimanda alla panoramica (${OVERVIEW})`);
  return problems;
}

/** The documents at the top of docs/ that have no level in DOC_LEVELS. */
export function unlevelled(root: string): string[] {
  const known = DOC_LEVELS.map((d) => d.path);
  return fs
    .readdirSync(path.join(root, 'docs'), { withFileTypes: true })
    .filter((d) => d.isDirectory() || d.name.endsWith('.md'))
    .map((d) => (d.isDirectory() ? `docs/${d.name}/` : `docs/${d.name}`))
    .filter((p) => !known.some((k) => k === p || `${k}/` === p || k.startsWith(p)))
    .map((p) => p.replace(/\/$/, ''));
}

function sizeOf(abs: string): { bytes: number; chars: number; files: number } {
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    if (!/\.(md|jsonl)$/.test(abs)) return { bytes: 0, chars: 0, files: 0 };
    const text = fs.readFileSync(abs, 'utf8');
    return { bytes: stat.size, chars: [...text].length, files: 1 };
  }
  const total = { bytes: 0, chars: 0, files: 0 };
  for (const name of fs.readdirSync(abs)) {
    const s = sizeOf(path.join(abs, name));
    total.bytes += s.bytes;
    total.chars += s.chars;
    total.files += s.files;
  }
  return total;
}

export interface MapRow extends DocEntry {
  files: number;
  bytes: number;
  tokens: number;
}

/** The map of the documents: each with its level, its size in text files and the tokens it would cost to read it whole. */
export function docMap(root: string): MapRow[] {
  return DOC_LEVELS.filter((d) => fs.existsSync(path.join(root, d.path))).map((d) => {
    const s = sizeOf(path.join(root, d.path));
    return { ...d, files: s.files, bytes: s.bytes, tokens: Math.round(s.chars / CHARS_PER_TOKEN) };
  });
}
