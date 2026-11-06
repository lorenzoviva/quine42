// The census of the languages (T239): every text in Italian the game, the site, the server and the seed carry, file by file,
// split into what a translation would touch (texts shown, prompts, seed) and what it must not touch (ids the code compares by name,
// field names on disk). Heuristic but deterministic: the same tree gives the same numbers. It writes docs/lingue-censimento.md.
// npx vite-node lab/scripts/censimento-lingue.ts            (writes the document)
// npx vite-node lab/scripts/censimento-lingue.ts -- --json  (prints the numbers as JSON)

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv.find((a) => a.startsWith('--root='))?.slice(7) ?? '.');
const AREAS = ['src', 'site', 'server', 'universe'] as const;
const OUT = path.join(ROOT, 'docs/lingue-censimento.md');

// --- Italian or not --------------------------------------------------------------------------------------------------------

/** Function words of Italian that English, French and Spanish do not share in the same form. */
const IT_WORDS = new Set(
  ('il lo la gli le un una uno di del della dei degli delle dello al alla ai agli alle allo da dal dalla dai dalle nel nella nei negli nelle ' +
    'sul sulla sui sulle con per tra fra che non è sono ha hanno era più già anche come dove quando perché però ogni questo questa questi ' +
    'quello quella quelli niente nessuno nessuna tutto tutti tutte qui lì ancora sempre mai poi prima dopo sotto sopra dentro fuori ' +
    'ti mi si ci vi ne io tu noi voi lui lei e ed ad od cosa chi sei siamo hai fare fa fatto c\'è ciò cioè oppure ovvero solo senza molto poco troppo può puoi deve devi viene vuoi ' +
    'nuovo nuova nuovi nuove altro altra altri altre stesso stessa tuo tua tuoi tue suo sua suoi sue loro mio mia ecco qualcosa').split(' '),
);
/** Words that look Italian by their ending but are English (or code). */
const EN_WORDS = new Set(
  ('the of and to in is for on with as at by an be this that are from or not it its was have has can will all one if but ' +
    'none true false null undefined left right up down name type value string number object function boolean size mode code ' +
    'module file data line case style table state core more some time note node base same done here there where while share compare square care aware were mere sphere fire wire hire require desire entire prepare declare ignore pure sure secure measure capture feature texture future structure picture closure failure before score attribute parse tile settle little middle handle bundle single title toggle style none done phone zone bone stone alone gone home some come welcome become outcome').split(' '),
);

const LETTERS = /[a-zàèéìíòóùú']+/gi;
const ACCENT = /[àèéìòù]/i;

/** Whether a text is Italian prose: two or more words and Italian function words or accents that English lacks. */
export function isItalian(text: string): boolean {
  const words = (text.toLowerCase().match(LETTERS) ?? []).filter((w) => w.length > 0);
  if (words.length < 2) return false;
  let it = 0;
  let en = 0;
  for (const w of words) {
    if (IT_WORDS.has(w)) it++;
    if (EN_WORDS.has(w)) en++;
  }
  if (ACCENT.test(text) && it >= 1) return true;
  if (it >= 1 && it >= en) return true;
  // no function word: most words look Italian and none is English («lotti e strutture», «Missioni attive»)
  const look = words.filter((w) => isItalianWord(w)).length;
  return en === 0 && look >= 2 && look / words.length >= 0.6;
}

/** A single word an id could be (lower case, letters, `_`, `-`, `.`). */
const ID_RE = /^[a-zàèéìòù][a-zàèéìòù0-9_.-]{1,30}$/;

/** Whether a single word reads as Italian: an accent, or a vowel ending outside the English list, or an Italian function word. */
export function isItalianWord(w: string): boolean {
  const s = w.toLowerCase();
  if (!ID_RE.test(s) || EN_WORDS.has(s)) return false;
  if (ACCENT.test(s) || IT_WORDS.has(s)) return true;
  const last = s.split(/[_.-]/).pop() ?? s;
  // English words ending in -e are many (store, name, line): those with an Italian double consonant or -zione stay.
  if (/(zione|zioni|mento|menti|tore|trice|ggio|ccia|cchi|ello|ella|etta|etto|ino|ina|oso|osa)$/.test(last)) return true;
  if (/^(data|idea|area|extra|delta|media|via|meta|beta|alpha|schema|ui|api|ratio|audio|radio|video|info|demo|logo|memo|auto|piano|camera|tempo|pro|lo|go|no|so|do|to|studio|lambda|gamma|sigma|nano|micro|macro|veto|ego|echo|halo|hero|zero|solo|ok|mi|hi|pi|ai|wi|ui)$/.test(last)) return false;
  return /[aio]$/.test(last) || /(are|ere|ire|nte|nde|zze|tte|lle|nne|rre|sse|cce|gge|ppe|mme|ure|one|ome)$/.test(last);
}

const words = (s: string) => (s.match(/[\p{L}\p{N}'’]+/gu) ?? []).length;

// --- Scanning TypeScript ---------------------------------------------------------------------------------------------------

interface Literal {
  text: string;
  kind: 'quote' | 'template';
  /** The code just before the literal on its line: tells a comparison from a message. */
  before: string;
}

/** The string literals of a TypeScript source, comments skipped (template expressions skipped too). */
export function literalsOf(src: string): { literals: Literal[]; commentWords: number; regexes: string[] } {
  const out: Literal[] = [];
  const regexes: string[] = [];
  let commentWords = 0;
  let i = 0;
  let lineStart = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '\n') {
      lineStart = i + 1;
      i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      const e = src.indexOf('\n', i);
      const end = e < 0 ? n : e;
      commentWords += isItalian(src.slice(i, end)) ? words(src.slice(i + 2, end)) : 0;
      i = end;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      const end = e < 0 ? n : e + 2;
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let s = '';
      while (j < n && src[j] !== c && src[j] !== '\n') {
        if (src[j] === '\\') {
          s += src[j + 1] ?? '';
          j += 2;
          continue;
        }
        s += src[j++];
      }
      out.push({ text: s, kind: 'quote', before: src.slice(lineStart, i) });
      i = j + 1;
      continue;
    }
    if (c === '`') {
      let j = i + 1;
      let s = '';
      while (j < n && src[j] !== '`') {
        if (src[j] === '\\') {
          s += src[j + 1] ?? '';
          j += 2;
          continue;
        }
        if (src[j] === '$' && src[j + 1] === '{') {
          // skip the expression, nested braces included
          let depth = 1;
          j += 2;
          while (j < n && depth) {
            if (src[j] === '{') depth++;
            else if (src[j] === '}') depth--;
            j++;
          }
          s += ' ';
          continue;
        }
        if (src[j] === '\n') lineStart = j + 1;
        s += src[j++];
      }
      out.push({ text: s, kind: 'template', before: src.slice(lineStart, i) });
      i = j + 1;
      continue;
    }
    // a regex literal: skip it so its quotes do not open strings (rough: after = ( , : [ ! & | ? ; { } return)
    if (c === '/' && /[=(,:[!&|?;{}]\s*$|return\s*$/.test(src.slice(Math.max(lineStart, i - 12), i))) {
      let j = i + 1;
      let cls = false;
      while (j < n && src[j] !== '\n') {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '[') cls = true;
        else if (src[j] === ']') cls = false;
        else if (src[j] === '/' && !cls) break;
        j++;
      }
      regexes.push(src.slice(i + 1, j));
      i = j + 1;
      continue;
    }
    i++;
  }
  return { literals: out, commentWords, regexes };
}

/** A regular expression with at least two alternatives that are Italian words (or stems of three letters or more). */
export function readsItalian(re: string): boolean {
  if (!re.includes('|')) return false;
  const alts = re
    .replace(/\\[pPbBwWsSdD](?:\{[^}]*\})?/g, ' ')
    .split(/[|()[\]?:^$*+{}\\]/)
    .map((a) => a.replace(/[^a-zàèéìòù' ]/gi, '').trim().toLowerCase())
    .filter((a) => a.length >= 3);
  const it = alts.filter((a) => a.split(/\s+/).some((w) => isItalianWord(w) || IT_WORDS.has(w) || ACCENT.test(w)));
  return it.length >= 2 && it.length >= alts.length / 3;
}

/** A literal the code compares or switches on: an id that must not be translated. */
const COMPARED = /(?:===?|!==?|\bcase|\bincludes\(|\bhas\(|\bget\(|\bin\b|\|\s*|:\s*|\[\s*|,\s*)\s*$/;

// --- The census ------------------------------------------------------------------------------------------------------------

export interface FileCount {
  file: string;
  area: string;
  category: string;
  /** Italian texts that a translation touches (strings shown, prompts, seed texts). */
  texts: number;
  words: number;
  /** Long template literals that are instructions to the models. */
  prompts: number;
  promptWords: number;
  /** Single Italian words the code compares by name (ids, kinds, uses, effects, classes, actions). */
  ids: number;
  /** Italian field names on disk or on the wire (JSON keys). */
  keys: number;
  /** Regular expressions that read Italian words in texts (of the models, of the players): they break in another language. */
  regex: number;
  /** Italian words in comments (Lua and XML comments are Italian by convention; TS comments should be English). */
  commentWords: number;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-server']);

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc.sort();
}

/** What a file is, for the tables. */
export function categoryOf(rel: string): string {
  if (rel.startsWith('universe/prompts/')) return 'prompt degli agenti (seme)';
  if (rel === 'universe/world/canon.md') return 'canone delle rune';
  if (rel === 'universe/world/lexicon.md') return 'lessico';
  if (rel.startsWith('universe/world/')) return 'mondo del seme';
  if (rel.startsWith('universe/models/suono-')) return 'suoni (programmi)';
  if (rel.startsWith('universe/models/')) return 'modelli (programmi)';
  if (/^universe\/modules\/.*\.lua$/.test(rel)) return 'moduli: codice Lua';
  if (rel.startsWith('universe/modules/')) return 'moduli: manifest';
  if (rel.startsWith('universe/')) return 'seme: configurazione';
  if (rel.startsWith('src/kernel/agents/') || rel === 'src/kernel/fourthwall.ts' || rel === 'src/kernel/themes.ts') return 'kernel: agenti e prompt';
  if (rel.startsWith('src/kernel/')) return 'kernel: messaggi e logica';
  if (rel.startsWith('src/ui/') || rel === 'src/master.ts' || rel === 'src/main.ts' || rel === 'index.html') return 'UI del gioco';
  if (rel.startsWith('src/render/')) return 'render (etichette 3D)';
  if (rel.startsWith('src/audio/')) return 'audio';
  if (rel.startsWith('src/mj/')) return 'MarkovJunior (motore)';
  if (rel.startsWith('src/session/')) return 'multigiocatore (sessione)';
  if (rel.startsWith('src/')) return 'altro di src/';
  if (rel.startsWith('site/notizie/')) return 'sito: notizie';
  if (rel.startsWith('site/')) return 'sito';
  if (rel.startsWith('server/')) return 'server';
  return 'altro';
}

function empty(rel: string): FileCount {
  return { file: rel, area: rel.split('/')[0], category: categoryOf(rel), texts: 0, words: 0, prompts: 0, promptWords: 0, ids: 0, keys: 0, commentWords: 0, regex: 0 };
}

/** A template literal long enough and imperative enough to be an instruction to a model. */
const PROMPT_HINT = /\b(rispondi|scrivi|restituisci|devi|non inventare|json|campi|regole|principi|sei (?:il|la|un|una)|## )/i;

function countTs(rel: string, src: string): FileCount {
  const f = empty(rel);
  const { literals, commentWords, regexes } = literalsOf(src);
  f.commentWords = commentWords;
  for (const r of regexes) if (readsItalian(r)) f.regex++;
  // `new RegExp(String.raw\`…\`)` and `new RegExp('…')`: their text is a literal
  for (const l of literals) if (/new RegExp\(\s*(?:String\.raw)?$|String\.raw$|\[\s*$/.test(l.before) && l.text.includes('|') && readsItalian(l.text)) f.regex++;
  for (const l of literals) {
    const t = l.text.trim();
    if (!t || /^(?:\.{0,2}\/|[a-z]+:\/\/)|^[\w.-]+\/[\w./-]*$/.test(t) || /^[A-Z0-9_]+$/.test(t)) continue;
    if (!/\s/.test(t) && ID_RE.test(t.toLowerCase())) {
      if (IT_WORDS.has(t.toLowerCase())) continue;
      if (t !== t.toLowerCase()) {
        // a capitalized single word is a label someone reads («Raccogli», «Missioni»)
        if (isItalianWord(t)) {
          f.texts++;
          f.words++;
        }
      } else if (isItalianWord(t) && COMPARED.test(l.before)) f.ids++;
      continue;
    }
    if (!isItalian(t)) continue;
    if (l.kind === 'template' && t.length >= 200 && PROMPT_HINT.test(t)) {
      f.prompts++;
      f.promptWords += words(t);
    } else {
      f.texts++;
      f.words += words(t);
    }
  }
  return f;
}

/** Text nodes and the attributes a reader sees (alt, title, placeholder, aria-label, content) of an HTML page. */
function countHtml(rel: string, src: string): FileCount {
  const f = empty(rel);
  const body = src.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of body.matchAll(/\b(?:alt|title|placeholder|aria-label|content|data-tip)="([^"]+)"/gi))
    if (isItalian(m[1]) || (words(m[1]) === 1 && isItalianWord(m[1]))) {
      f.texts++;
      f.words += words(m[1]);
    }
  for (const m of body.matchAll(/>([^<>]+)</g)) {
    const t = m[1].replace(/&[a-z]+;|&#\d+;/g, ' ').trim();
    if (!t) continue;
    if (isItalian(t) || (words(t) <= 3 && t.split(/\s+/).some(isItalianWord))) {
      f.texts++;
      f.words += words(t);
    }
  }
  return f;
}

/** Prose: every paragraph, list item, heading. */
function countMd(rel: string, src: string): FileCount {
  const f = empty(rel);
  const blocks = src.split(/\n\s*\n|\n(?=\s*[-*#] )/).map((b) => b.trim()).filter(Boolean);
  for (const b of blocks) {
    f.texts++;
    f.words += words(b);
  }
  if (rel.startsWith('universe/prompts/agents/')) {
    f.prompts = 1;
    f.promptWords = f.words;
    f.texts = 0;
    f.words = 0;
  }
  return f;
}

/** Fields whose value is an id the code reads by name, wherever they are. */
const ID_FIELDS = new Set(['id', 'kind', 'tipo', 'classe', 'taglia', 'uso', 'ambiente', 'layout', 'model', 'slot', 'category', 'interaction', 'requires', 'quando', 'dove', 'azione', 'momento', 'specie', 'genere', 'modalita', 'stato', 'elemento', 'element', 'a', 'tiles', 'tags', 'layer', 'bottino']);

function countJson(rel: string, src: string): FileCount {
  const f = empty(rel);
  let data: unknown;
  try {
    data = JSON.parse(src.replace(/^﻿/, ''));
  } catch {
    return f;
  }
  const keys = new Set<string>();
  const visit = (v: unknown, key?: string) => {
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) return;
      if (key && ID_FIELDS.has(key) && !/\s/.test(t)) {
        if (isItalianWord(t)) f.ids++;
        return;
      }
      if (isItalian(t) || (!/\s/.test(t) && key && /^(name|nome|label|titolo|testo)$/.test(key) && isItalianWord(t))) {
        f.texts++;
        f.words += words(t);
      } else if (!/\s/.test(t) && isItalianWord(t) && key !== 'glyph' && key !== 'color') f.ids++;
      return;
    }
    if (Array.isArray(v)) return v.forEach((x) => visit(x, key));
    if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) {
        if (isItalianWord(k)) keys.add(k);
        visit(x, k);
      }
  };
  visit(data);
  f.keys = keys.size;
  return f;
}

/** Strings shown by Lua (said, written, returned) and Italian comments (they stay Italian: convention). */
function countLua(rel: string, src: string): FileCount {
  const f = empty(rel);
  for (const m of src.matchAll(/--(?!\[\[)([^\n]*)/g)) f.commentWords += words(m[1]);
  const code = src.replace(/--\[\[[\s\S]*?\]\]|--[^\n]*/g, '');
  for (const m of code.matchAll(/"((?:\\.|[^"\\\n])*)"|'((?:\\.|[^'\\\n])*)'|\[\[([\s\S]*?)\]\]/g)) {
    const t = (m[1] ?? m[2] ?? m[3] ?? '').trim();
    if (!t) continue;
    if (!/\s/.test(t)) {
      if (isItalianWord(t)) f.ids++;
      continue;
    }
    if (isItalian(t)) {
      f.texts++;
      f.words += words(t);
    }
  }
  return f;
}

/** A program: its comments (the Sculptor's notes) and the attributes in words; ids are the file name and the names of nodes. */
function countXml(rel: string, src: string): FileCount {
  const f = empty(rel);
  for (const m of src.matchAll(/<!--([\s\S]*?)-->/g)) f.commentWords += words(m[1]);
  for (const m of src.matchAll(/\b(?:nome|name|ambienti|momenti|effetti|uso)="([^"]+)"/g)) {
    const t = m[1].trim();
    if (/\s/.test(t) && isItalian(t)) {
      f.texts++;
      f.words += words(t);
    } else t.split(/[\s,]+/).forEach((w) => w && isItalianWord(w) && f.ids++);
  }
  // the file name is an id of the library (models/index.json, manifests)
  if (isItalianWord(path.basename(rel, '.xml').split('-')[0])) f.ids++;
  return f;
}

/** CSS: only the texts in `content: "…"`. */
function countCss(rel: string, src: string): FileCount {
  const f = empty(rel);
  for (const m of src.matchAll(/content:\s*["']([^"']+)["']/g))
    if (isItalian(m[1]) || isItalianWord(m[1])) {
      f.texts++;
      f.words += words(m[1]);
    }
  return f;
}

export function countFile(rel: string, src: string): FileCount | undefined {
  const ext = path.extname(rel);
  if (ext === '.ts' && !rel.endsWith('.d.ts')) return countTs(rel, src);
  if (ext === '.html') return countHtml(rel, src);
  if (ext === '.md') return countMd(rel, src);
  if (ext === '.json') return countJson(rel, src);
  if (ext === '.lua') return countLua(rel, src);
  if (ext === '.xml') return countXml(rel, src);
  if (ext === '.css') return countCss(rel, src);
  return undefined;
}

export function census(root = ROOT): FileCount[] {
  const out: FileCount[] = [];
  const files = [...AREAS.flatMap((a) => walk(path.join(root, a))), path.join(root, 'index.html')];
  for (const abs of files) {
    if (!fs.existsSync(abs)) continue;
    const rel = path.relative(root, abs).split(path.sep).join('/');
    const c = countFile(rel, fs.readFileSync(abs, 'utf8'));
    if (c) out.push(c);
  }
  return out;
}

// --- Semantic domains: the ids compared by name, read from the code itself ----------------------------------------------

interface Domain {
  name: string;
  where: string;
  values: string[];
}

function unionOf(src: string, typeName: string): string[] {
  const m = new RegExp(`type ${typeName}\\s*=\\s*([^;]+);`).exec(src);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
}

function read(rel: string): string {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

export function domains(): Domain[] {
  const society = read('src/kernel/society.ts');
  const types = read('src/kernel/types.ts');
  const validator = read('src/kernel/validator.ts');
  const classes = read('src/mj/classes.ts');
  const sound = read('src/mj/sound.ts');
  const activities = /ACTIVITIES\s*=\s*\[([^\]]+)\]/.exec(society)?.[1] ?? '';
  const effectTypes = [...new Set([...validator.matchAll(/case '([a-z_]+)':/g)].map((m) => m[1]))];
  const classIds = [...classes.matchAll(/\{ id: '([a-z]+)', taglia/g)].map((m) => m[1]);
  const sizes = [...classes.matchAll(/\{ id: '([a-z]+)', name: '[A-Z]/g)].map((m) => m[1]);
  const actionIds = new Set<string>();
  const ambienti = new Set<string>();
  const tileNames = new Set<string>();
  for (const abs of walk(path.join(ROOT, 'universe/modules'))) {
    if (!abs.endsWith('manifest.json')) continue;
    try {
      const m = JSON.parse(fs.readFileSync(abs, 'utf8'));
      for (const a of m.actions ?? []) if (a?.id) actionIds.add(a.id);
      for (const it of m.items ?? []) for (const a of it.actions ?? []) if (a?.id) actionIds.add(a.id);
      for (const k of Object.keys(m.layouts ?? {})) ambienti.add(k);
      for (const t of Object.values(m.tiles ?? {}) as Array<{ name?: string }>) if (t?.name) tileNames.add(t.name);
    } catch {
      /* not JSON: counted elsewhere */
    }
  }
  return [
    { name: 'classi dei modelli', where: 'src/mj/classes.ts', values: classIds },
    { name: 'taglie', where: 'src/mj/classes.ts', values: sizes },
    { name: 'effetti (`tipo`)', where: 'src/kernel/validator.ts', values: effectTypes },
    { name: 'momenti del giorno', where: 'src/kernel/society.ts', values: unionOf(society, 'DayPhase') },
    { name: 'dove (routine)', where: 'src/kernel/society.ts', values: unionOf(society, 'Where') },
    { name: 'attività', where: 'src/kernel/society.ts', values: [...activities.matchAll(/'([^']+)'/g)].map((m) => m[1]) },
    { name: 'specie e genere', where: 'src/kernel/society.ts', values: [...unionOf(society, 'Species'), ...unionOf(society, 'Gender')] },
    { name: 'uso dei suoni', where: 'src/mj/sound.ts', values: [...new Set([...sound.matchAll(/uso: '([a-z]+)'(?: \| '([a-z]+)')?/g)].flatMap((m) => [m[1], m[2]]).filter(Boolean))] },
    { name: 'tipi di modulo', where: 'src/kernel/types.ts', values: unionOf(types, 'ModuleKind') },
    { name: 'azioni del seme (`id`)', where: 'universe/modules/*/manifest.json', values: [...actionIds].sort() },
    { name: 'ambienti (layout) del seme', where: 'universe/modules/world.layouts', values: [...ambienti].sort() },
    { name: 'nomi dei terreni del seme', where: 'universe/modules/world.terrain', values: [...tileNames].sort() },
  ];
}

// --- The prompts that go with every request --------------------------------------------------------------------------------

/** The fixed texts of the kernel sent to the models, with their size: what a second language would double or replace. */
export function fixedPrompts(): Array<{ name: string; where: string; chars: number; words: number }> {
  const out: Array<{ name: string; where: string; chars: number; words: number }> = [];
  const fw = read('src/kernel/fourthwall.ts');
  const principles = /COUNCIL_PRINCIPLES = `([\s\S]*?)`;/.exec(fw)?.[1] ?? '';
  out.push({ name: 'COUNCIL_PRINCIPLES (con ogni richiesta)', where: 'src/kernel/fourthwall.ts', chars: principles.length, words: words(principles) });
  const meta = /const META_RE = new RegExp\(([\s\S]*?)\]\.map/.exec(fw)?.[1] ?? '';
  out.push({ name: 'META_RE (filtro, parole e frasi)', where: 'src/kernel/fourthwall.ts', chars: meta.length, words: (meta.match(/\|/g) ?? []).length + 1 });
  for (const abs of walk(path.join(ROOT, 'universe/prompts'))) {
    const t = fs.readFileSync(abs, 'utf8');
    out.push({ name: path.relative(path.join(ROOT, 'universe/prompts'), abs), where: 'universe/prompts/', chars: t.length, words: words(t) });
  }
  return out;
}

// --- The document ------------------------------------------------------------------------------------------------------------

type Sum = Omit<FileCount, 'file' | 'area' | 'category'> & { files: number };

function sum(list: FileCount[]): Sum {
  const s: Sum = { files: list.length, texts: 0, words: 0, prompts: 0, promptWords: 0, ids: 0, keys: 0, commentWords: 0, regex: 0 };
  for (const f of list) for (const k of ['texts', 'words', 'prompts', 'promptWords', 'ids', 'keys', 'commentWords', 'regex'] as const) s[k] += f[k];
  return s;
}

const fmt = (n: number) => n.toLocaleString('it-IT');
const row = (cells: Array<string | number>) => `| ${cells.map((c) => (typeof c === 'number' ? fmt(c) : c)).join(' | ')} |`;

/** Tokens of Gemini for a text in Italian: about 4 characters each (an estimate, not a measure: the tokenizer is not offline). */
const tokensOf = (chars: number) => Math.round(chars / 4);

export function report(files: FileCount[]): string {
  const lines: string[] = [];
  const total = sum(files);
  const head = ['file', 'testi', 'parole', 'prompt', 'parole dei prompt', 'id per nome', 'chiavi su disco', 'parole nei commenti'];
  lines.push(
    '# Censimento delle lingue (T239)',
    '',
    '> Generato da `npx vite-node lab/scripts/censimento-lingue.ts` sul commit corrente: non modificarlo a mano, rilancia lo script.',
    '> Il progetto delle lingue è in [`lingue.md`](lingue.md).',
    '',
    '## Come conta',
    '',
    '- **testi**: stringhe in italiano che una traduzione tocca (ciò che si mostra, si dice, si scrive); in TypeScript i letterali con almeno due parole e parole',
    '  funzionali italiane o accenti, in HTML nodi di testo e attributi visibili, in JSON i valori, in Lua le stringhe del codice, in Markdown ogni blocco.',
    '- **prompt**: i letterali template di almeno 200 caratteri con forma di istruzione (`Rispondi`, `JSON`, `##`…) e i file di `universe/prompts/agents/`.',
    '- **id per nome**: parole italiane singole che il codice confronta (`===`, `case`, `includes`, unioni di tipi) o che stanno in un campo identificatore',
    '  (`id`, `tipo`, `classe`, `uso`, `ambiente`, `azione`…): **non si traducono**, si etichettano.',
    '- **chiavi su disco**: nomi di campo italiani distinti nei JSON (`persone`, `famiglia`, `tappe`…): sul disco e sul filo, non si rinominano senza migrazione (ADR-0117).',
    '- **parole nei commenti**: commenti italiani (in Lua e negli XML sono italiani per convenzione; in TypeScript dovrebbero essere inglesi): non si traducono.',
    '- Euristica deterministica, non un parser di lingua: sbaglia sui casi di confine (una parola inglese che finisce in vocale, un\'etichetta di una parola sola).',
    '  Le cifre servono a dimensionare, non a fatturare. Controllato a campione su `src/kernel/kernel.ts`, `src/ui/hud.ts` e `server/production.ts`:',
    '  i letterali con segnaposto `${…}` contano solo le parole fisse; percorsi, tipi MIME e variabili d\'ambiente non contano.',
    '',
    '## Totale',
    '',
    `| file letti | testi | parole | prompt | parole dei prompt | id per nome | chiavi su disco | parole nei commenti |`,
    '|---:|---:|---:|---:|---:|---:|---:|---:|',
    row([total.files, total.texts, total.words, total.prompts, total.promptWords, total.ids, total.keys, total.commentWords]),
    '',
    '## Per area',
    '',
    '| area | file | testi | parole | prompt | parole dei prompt | id per nome | chiavi su disco | parole nei commenti |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  );
  for (const a of [...AREAS, 'index.html']) {
    const s = sum(files.filter((f) => f.area === a));
    lines.push(row([`\`${a}\``, s.files, s.texts, s.words, s.prompts, s.promptWords, s.ids, s.keys, s.commentWords]));
  }
  lines.push('', '## Per categoria', '', '| categoria | file | testi | parole | prompt | parole dei prompt | id per nome | chiavi su disco | parole nei commenti |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  const cats = [...new Set(files.map((f) => f.category))].sort();
  for (const c of cats) {
    const s = sum(files.filter((f) => f.category === c));
    lines.push(row([c, s.files, s.texts, s.words, s.prompts, s.promptWords, s.ids, s.keys, s.commentWords]));
  }

  lines.push('', '## Ciò che va con ogni richiesta ai modelli', '', '| testo | dove | caratteri | parole | token stimati (car./4) |', '|---|---|---:|---:|---:|');
  for (const p of fixedPrompts()) lines.push(row([p.name, `\`${p.where}\``, p.chars, p.words, tokensOf(p.chars)]));

  lines.push('', '## Gli identificatori che il codice confronta per nome', '', 'Letti dal codice (unioni di tipi, `case` del validatore, manifest del seme). Restano in italiano in ogni lingua: sono la lingua interna.', '', '| dominio | dove | valori | elenco |', '|---|---|---:|---|');
  for (const d of domains()) lines.push(row([d.name, `\`${d.where}\``, d.values.length, d.values.slice(0, 40).join(', ') + (d.values.length > 40 ? ', …' : '')]));

  lines.push('', '## I 40 file con più parole da tradurre', '', `| ${head.join(' | ')} |`, '|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const f of [...files].sort((a, b) => b.words + b.promptWords - (a.words + a.promptWords)).slice(0, 40))
    lines.push(row([`\`${f.file}\``, f.texts, f.words, f.prompts, f.promptWords, f.ids, f.keys, f.commentWords]));

  lines.push('', '## File per file', '', '<details><summary>Tutti i file con almeno un conteggio non nullo</summary>', '', `| ${head.join(' | ')} |`, '|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const f of files.filter((x) => x.texts || x.prompts || x.ids || x.keys || x.commentWords))
    lines.push(row([`\`${f.file}\``, f.texts, f.words, f.prompts, f.promptWords, f.ids, f.keys, f.commentWords]));
  lines.push('', '</details>', '');

  lines.push('', '## Le espressioni regolari che leggono l\'italiano', '', 'Ciò che il codice capisce di un testo scritto (dai modelli o dal giocatore) cercandovi parole italiane: il filtro della quarta parete,', 'le attività dalle routine, i legami, le intenzioni del giocatore. In un\'altra lingua tacciono. Una per una vanno rese multilingue o sostituite da un campo con un id.', '', '| file | espressioni |', '|---|---:|');
  for (const f of files.filter((x) => x.regex).sort((a, b) => b.regex - a.regex)) lines.push(row([`\`${f.file}\``, f.regex]));
  lines.push(row(['**totale**', sum(files).regex]));

  lines.push('', '## La documentazione (fuori dal gioco)', '', 'Non si traduce per giocare; conta solo se il lancio punta alla comunità dello sviluppo agentico (T240, punto 7).', '', '| dove | file | parole |', '|---|---:|---:|');
  for (const d of ['AGENTS.md', 'docs/architettura-dettagli.md', 'docs/adr', 'docs/plans', 'docs/pipeline', 'docs/archivio', 'docs']) {
    const abs = path.join(ROOT, d);
    const list = fs.existsSync(abs) && fs.statSync(abs).isDirectory() ? walk(abs).filter((x) => x.endsWith('.md')) : fs.existsSync(abs) ? [abs] : [];
    lines.push(row([`\`${d}\`${d === 'docs' ? ' (tutto)' : ''}`, list.length, list.reduce((n, x) => n + words(fs.readFileSync(x, 'utf8')), 0)]));
  }
  lines.push('');

  // Volume of a translation: the words a translator (or a model) has to write, per language.
  const toTranslate = total.words + total.promptWords;
  lines.push(
    '## Volume di una traduzione',
    '',
    `Parole da tradurre per lingua (testi + prompt, senza commenti né id): **${fmt(toTranslate)}**; per tre lingue in più: **${fmt(toTranslate * 3)}**.`,
    `Di queste, i testi (UI, sito, seme, Lua, messaggi del kernel e del server, risposte dei modelli offline) sono ${fmt(total.words)} parole; i prompt ${fmt(total.promptWords)} (si possono lasciare in italiano, vedi \`lingue.md\`).`,
    '',
  );
  return lines.join('\n');
}

if (!process.env.VITEST) {
  const files = census();
  if (process.argv.includes('--json')) console.log(JSON.stringify({ totale: sum(files), file: files }, null, 1));
  else {
    fs.writeFileSync(OUT, report(files));
    const s = sum(files);
    console.log(`scritto ${path.relative(ROOT, OUT)}: ${s.files} file, ${s.texts} testi (${s.words} parole), ${s.prompts} prompt (${s.promptWords} parole), ${s.ids} id, ${s.keys} chiavi`);
  }
}
