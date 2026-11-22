// The parts of the world (T472, S6 of T458, ADR-0242): parts the Sculptor of a universe takes from a good model of its own, beside the parts
// of the seed (ADR-0182, ADR-0241). The Sculptor says which lines of the model make the part and what its contract is (`readPartAnswer`);
// the kernel writes the part (those lines as they are, in a root with the values of the grid they write on and the model's colours and
// unions) and the model with `<import>` in their place (`composePart`), and takes the part only if the model so rewritten makes the same
// grid, voxel by voxel, on three seeds (the kernel's `addWorldPart`). A part of the world has a name that never changes (`worldPartId`: the
// hash of its program, so a new version is a new name), includes nothing and reads no file (`worldPartErrors`), keeps out of the letters the
// parts of the seed hold for themselves (`S`, `#90`-`#97`), is never written anew nor taken away while a model includes it (`partUsers`),
// and travels with the cards that include it (the store's `bring`). Pure and light (the XML reader, no engine): the store reads it too.

import { cleanText } from './cleantext';
import { hashStr, hex } from './rng';
import type { FileMap } from './types';
import { numberedSymbol, symbolName, symbolTokens } from '../mj/symbols';
import { parseXml, writeXml, type XmlElement } from '../mj/xml';

/**
 * The id of a part of the world: `part-`, a few words of its name and the hash of its program (`part-ruota-del-carro-1a2b3c4d`). A part of the
 * seed is `part-<name>` and never ends so; within the 41 characters of a model's id.
 */
export const WORLD_PART_RE = /^part-[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{8}$/;

/** The most parts of the world a specialty keeps and is offered (T472): the Sculptor takes no more once its trade has these. */
export const WORLD_PARTS = 4;
/** The longest contract, in characters: it goes into every request of the trade (some 200 tokens). */
export const PART_CONTRACT_MAX = 900;
/** The longest name of a part, as the library and the cards show it. */
export const PART_NAME_MAX = 60;

/** The elements beside a program's root: they stay with the model, and an imported file brings none of them (ADR-0171). */
const ASIDE = new Set(['animation', 'action', 'worn']);
/** The nodes a part may take (`MJX_NODES` of src/mj/model.ts, said here to stay light), and the colours and unions that go with them. */
const NODES = new Set(['one', 'all', 'prl', 'sequence', 'markov', 'convolution', 'path', 'map', 'wfc', 'convchain', 'pieces', 'box', 'ellipsoid', 'cylinder', 'cone', 'line']);
/** Where nodes stand one after the other: what holds the lines a part takes. */
const HOLDERS = new Set(['sequence', 'markov', 'pieces', 'map', 'wfc']);
/** The attributes that read a file of models/: a part reads none (it is tried alone and inside whoever includes it). */
const FILE_ATTRS = ['fin', 'fout', 'file', 'tileset', 'sample'];
/** The letters the parts of the seed keep for themselves (ADR-0241): the scene `S` and the markers `#90`-`#97`. */
export const RESERVED_PART_SYMBOLS: ReadonlySet<string> = new Set(['S', ...Array.from({ length: 8 }, (_, i) => numberedSymbol(90 + i))]);

/** A few plain words of a name for an id: no accents, lowercase, letters and digits joined by "-", at most 20 characters. */
function slugOf(name: string): string {
  const s = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)
    .replace(/-+$/, '');
  return s || 'parte';
}

/** The id a part of the world has, from its name and its program: the same text, the same id, on every machine. */
export const worldPartId = (name: string, xml: string): string => `part-${slugOf(name)}-${hex(hashStr(xml))}`;

/** Whether an entry of the library is a part of the world: an id of that shape and `part: true`, which only the kernel writes. */
export const isWorldPart = (id: string, entry: unknown): boolean => WORLD_PART_RE.test(id) && !!entry && typeof entry === 'object' && (entry as { part?: unknown }).part === true;

/** The files a program imports (`<import file="…"/>`), anywhere in it, each once; none if it does not read. Comments are not imports. */
export function importsOf(xml: string): string[] {
  if (typeof xml !== 'string' || !xml.includes('<import')) return [];
  let roots: XmlElement[];
  try {
    roots = parseXml(xml);
  } catch {
    return [];
  }
  const out = new Set<string>();
  const visit = (el: XmlElement) => {
    if (el.name === 'import' && typeof el.attrs.file === 'string') out.add(el.attrs.file);
    el.children.forEach(visit);
  };
  roots.forEach(visit);
  return [...out];
}

/** Who includes what (T472): part → the models of the library that import it, in the order of their ids. */
export function partsInUse(files: FileMap): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const path of Object.keys(files).sort()) {
    const m = /^models\/([^/]+)\.xml$/.exec(path);
    const text = files[path];
    if (!m || typeof text !== 'string') continue;
    for (const part of importsOf(text)) if (part !== m[1]) out.set(part, [...(out.get(part) ?? []), m[1]]);
  }
  return out;
}

/** The models of the library that include a part: while there is one, the part is not written anew nor taken away. */
export const partUsers = (files: FileMap, part: string): string[] => partsInUse(files).get(part) ?? [];

/** The contract of a part: the first paragraph of the comment at its top, in one line (what a request of its trade reads of it). */
export function partContract(xml: string): string | undefined {
  const comment = /^\s*<!--([\s\S]*?)-->/.exec(xml)?.[1]?.trim();
  return comment?.split(/\n\s*\n/)[0]?.replace(/\s*\n\s*/g, ' ').trim() || undefined;
}

/** The root of a program: its one element that is not an animation, an action or a worn section. */
const rootOf = (roots: XmlElement[]): XmlElement | undefined => roots.find((r) => !ASIDE.has(r.name));

/** The engine's characters of a set of symbols as written (`HIJ`, `H I J`, `#80,#81`), or why not. */
function symbolsOf(raw: unknown, what: string): { codes: string[] } | { error: string } {
  if (raw === undefined || raw === null || raw === '') return { codes: [] };
  if (typeof raw !== 'string') return { error: `${what}: le lettere come le scrive il programma` };
  const codes: string[] = [];
  for (const t of symbolTokens(raw.replace(/[\s,;]+/g, ''))) {
    if (t.error) return { error: `${what}: ${t.error}` };
    if (!t.code) return { error: `${what}: "${t.text}" non è una lettera né # e un numero` };
    if (!codes.includes(t.code)) codes.push(t.code);
  }
  return { codes };
}

/** What the Sculptor answers to `model.part` (T472): the part's name, the lines of the model it takes, the letters it reads and writes, its contract. */
export interface PartAnswer {
  name: string;
  /** The first and the last line of the model (from 1, as the request numbers them), both in the part. */
  from: number;
  to: number;
  /** The engine's characters of the letters it needs drawn before it, and of those it draws. */
  reads: string[];
  writes: string[];
  contract: string;
}

/**
 * The Sculptor's answer read (T472): `<part name="…" lines="A-B" reads="…" writes="…">the contract</part>`, or `<none/>` when nothing in
 * the model is worth sharing. Undefined fields, a contract too long or that does not read, letters that are not letters: the reason, which
 * goes back to the Sculptor.
 */
export function readPartAnswer(raw: string): PartAnswer | 'none' | { error: string } {
  const text = String(raw ?? '').replace(/```(?:xml)?/g, '');
  const m = /<part\b([^>]*)>([\s\S]*?)<\/part\s*>/i.exec(text);
  if (!m) return /<none\b/i.test(text) ? 'none' : { error: 'manca <part name="…" lines="A-B" reads="…" writes="…">il contratto</part>, o <none/>' };
  const attrs: Record<string, string> = {};
  for (const a of m[1].matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1].toLowerCase()] = a[2] ?? a[3];
  const name = cleanText(attrs.name, PART_NAME_MAX, 'name');
  if ('error' in name) return name;
  const span = /^\s*(\d+)\s*(?:(?:-|–|—|\.\.|to)\s*(\d+)\s*)?$/.exec(attrs.lines ?? '');
  if (!span) return { error: 'lines: la prima e l’ultima riga della parte, come «12-30»' };
  const from = Number(span[1]);
  const to = span[2] !== undefined ? Number(span[2]) : from;
  if (from < 1 || to < from) return { error: `lines: «${attrs.lines}» non è un tratto di righe` };
  const reads = symbolsOf(attrs.reads, 'reads');
  if ('error' in reads) return reads;
  const writes = symbolsOf(attrs.writes, 'writes');
  if ('error' in writes) return writes;
  if (!writes.codes.length) return { error: 'writes: le lettere che la parte disegna (almeno una)' };
  // The contract goes in a comment: no "--" there, no comment of its own around it.
  const contract = m[2]
    .replace(/<!--|-->/g, ' ')
    .replace(/--+/g, '—')
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/[\p{L}]/u.test(contract)) return { error: 'manca il contratto: che cosa costruisce e segna prima chi la include, che cosa fa la parte' };
  if (contract.length > PART_CONTRACT_MAX) return { error: `il contratto è lungo ${contract.length} caratteri: al più ${PART_CONTRACT_MAX}` };
  return { name: name.text, from, to, reads: reads.codes, writes: writes.codes, contract };
}

/** A part composed from a model (T472): its id, its program, the model with the import in its place and as it was. */
export interface ComposedPart {
  id: string;
  name: string;
  /** The part's program (`models/<id>.xml`). */
  part: string;
  /** The model with `<import file="<id>"/>` where the lines were. */
  rewritten: string;
  /** The model as it was: the part is taken only if it is still so in the library. */
  original: string;
  from: number;
  to: number;
  reads: string[];
  writes: string[];
}

/** An element and the path to it from a root (the root first), or undefined. */
function pathTo(el: XmlElement, hit: (e: XmlElement) => boolean, path: XmlElement[] = []): XmlElement[] | undefined {
  const here = [...path, el];
  if (hit(el)) return here;
  for (const c of el.children) {
    const p = pathTo(c, hit, here);
    if (p) return p;
  }
  return undefined;
}

/** Every element of a tree, but what is inside `skip`. */
function* elements(el: XmlElement, skip: (e: XmlElement) => boolean): Generator<XmlElement> {
  if (skip(el)) return;
  yield el;
  for (const c of el.children) yield* elements(c, skip);
}

const PLACEHOLDER = 'part-placeholder-0';
const commentSafe = (s: string) => s.replace(/--+/g, '—');
const showSet = (codes: readonly string[]) => (codes.length ? codes.map(symbolName).join(' ') : 'nothing');

/**
 * The part the Sculptor chose, written by the kernel (T472): lines `from`-`to` of the model, whole elements one after the other, as they
 * are, in a root (`<markov>` if they were in one, else `<sequence>`) with the values of the grid they write on, the model's colours of those
 * letters and the unions of the grids around them; the contract first, then where the part comes from. The model is the same with
 * `<import file="<id>"/>` in their place. Never a line of an animation, an action or a worn section (they stay with the model); nothing
 * that reads a file or includes another; none of the letters the parts of the seed keep. Whether the two make the same grid the kernel
 * tries afterwards: here only what the text says.
 */
export function composePart(xml: string, answer: PartAnswer, source: { id: string; name: string }): ComposedPart | { error: string } {
  const lines = xml.split('\n');
  const { from, to } = answer;
  if (to > lines.length) return { error: `lines: il programma ha ${lines.length} righe, non ${to}` };
  const span = lines.slice(from - 1, to).join('\n');
  // Whole elements: the lines alone in a node, with no text outside their elements.
  let moved: XmlElement[];
  try {
    const wrapped = parseXml(`<sequence>\n${span}\n</sequence>`)[0];
    if (wrapped.text?.trim()) return { error: `le righe ${from}-${to} hanno del testo fuori dagli elementi: devono essere elementi interi` };
    moved = wrapped.children;
  } catch (e) {
    return { error: `le righe ${from}-${to} non sono elementi interi (ogni elemento che vi comincia vi finisce): ${(e as Error).message}` };
  }
  for (const top of moved)
    for (const el of elements(top, () => false)) {
      if (el.name === 'import') return { error: 'una parte non include niente: scegli righe senza <import>' };
      if (FILE_ATTRS.some((a) => el.attrs[a] !== undefined)) return { error: 'una parte non legge file di models/: scegli righe senza fin, fout, file, tileset né sample' };
      if (ASIDE.has(el.name)) return { error: 'animazioni, azioni e sezioni indossate restano del modello' };
    }
  if (!moved.some((el) => NODES.has(el.name))) return { error: `le righe ${from}-${to} non hanno nodi: una parte fa qualcosa` };
  const stray = moved.find((el) => !NODES.has(el.name) && el.name !== 'color' && el.name !== 'union');
  if (stray) return { error: `le righe ${from}-${to} hanno <${stray.name}>: una parte prende nodi interi, uno dopo l'altro (non le regole di un nodo)` };
  // The model without those lines, a placeholder in their place: where it stands says the grid the part writes on.
  const indent = /^\s*/.exec(lines[from - 1])![0];
  const probe = [...lines.slice(0, from - 1), `${indent}<import file="${PLACEHOLDER}"/>`, ...lines.slice(to)].join('\n');
  let roots: XmlElement[];
  try {
    roots = parseXml(probe);
  } catch (e) {
    return { error: `senza le righe ${from}-${to} il programma non si legge: ${(e as Error).message}` };
  }
  const root = rootOf(roots);
  const path = root && pathTo(root, (el) => el.name === 'import' && el.attrs.file === PLACEHOLDER);
  if (!root || !path || path.length < 2) return { error: `le righe ${from}-${to} non sono dentro il programma: le animazioni, le azioni e le sezioni indossate restano del modello` };
  const parent = path[path.length - 2];
  if (!HOLDERS.has(parent.name)) return { error: `le righe ${from}-${to} stanno in <${parent.name}>: una parte prende nodi di una <sequence> (o di un <markov>, di una <map>, di <pieces>)` };
  const grid = [...path.slice(0, -1)].reverse().find((el) => el.attrs.values !== undefined);
  const values = grid?.attrs.values;
  if (!values) return { error: 'la griglia di quelle righe non ha values' };
  const codes = symbolsOf(values, 'values');
  if ('error' in codes) return codes;
  if (codes.codes.some((c) => RESERVED_PART_SYMBOLS.has(c))) return { error: 'la griglia di quelle righe usa S o #90-#97, che le parti del seme tengono per sé: non è una parte da condividere' };
  // What it reads may be the air; what it writes is drawn.
  const empty = codes.codes[0];
  for (const c of answer.reads) if (!codes.codes.includes(c)) return { error: `reads: «${symbolName(c)}» non è una lettera della griglia (${values})` };
  for (const c of answer.writes) if (!codes.codes.includes(c) || c === empty) return { error: `writes: «${symbolName(c)}» non è una lettera disegnata della griglia (${values})` };
  // The model's colours of those letters (the program's own win over an import's: nothing changes for it), and the unions of the grids
  // around the lines, so that the part reads alone and wherever it is included.
  const inWorn = (el: XmlElement) => el.name === 'worn';
  const colours = new Map<string, string>();
  for (const r of roots)
    for (const el of elements(r, inWorn)) {
      if (el.name !== 'color' || el.attrs.symbol === undefined) continue;
      const s = symbolsOf(el.attrs.symbol, 'color');
      const c = 'codes' in s && s.codes.length === 1 ? s.codes[0] : undefined;
      if (c && codes.codes.includes(c) && !colours.has(c)) colours.set(c, writeXml(el, '  '));
    }
  const ownColours = new Set<string>();
  for (const top of moved) for (const el of elements(top, inWorn)) if (el.name === 'color' && el.attrs.symbol) ownColours.add(el.attrs.symbol);
  for (const sym of ownColours) {
    const s = symbolsOf(sym, 'color');
    if ('codes' in s) for (const c of s.codes) colours.delete(c);
  }
  const unions = path.slice(0, -1).flatMap((el) => el.children.filter((c) => c.name === 'union').map((c) => writeXml(c, '  ')));
  const tag = parent.name === 'markov' ? 'markov' : 'sequence';
  const first = `${commentSafe(answer.contract)} Reads: ${showSet(answer.reads)}. Writes: ${showSet(answer.writes)}.`;
  const part = [
    '<!--',
    first,
    '',
    `A part of this world (T472, ADR-0242): lines ${from}-${to} of «${commentSafe(source.name)}» (${source.id}), which includes it in their place. It works on what the`,
    'program that includes it has drawn: alone it draws nothing.',
    '-->',
    `<${tag} values="${values}">`,
    ...colours.values(),
    ...unions,
    span,
    `</${tag}>`,
    '',
  ].join('\n');
  const id = worldPartId(answer.name, part);
  const rewritten = probe.replace(`<import file="${PLACEHOLDER}"/>`, `<import file="${id}"/>`);
  return { id, name: answer.name, part, rewritten, original: xml, from, to, reads: answer.reads, writes: answer.writes };
}

/**
 * What the text of a part of the world must say (T472), the light rules (the store reads them too; the validator then compiles it and runs it
 * alone): one program, no animation, action nor worn section beside it; nothing included nor read from models/; its contract, the first
 * paragraph of the comment at its top, not empty nor too long; none of the letters the parts of the seed keep in its grid. Empty: it may be one.
 */
export function worldPartErrors(xml: string): string[] {
  let roots: XmlElement[];
  try {
    roots = parseXml(xml);
  } catch (e) {
    return [`XML: ${(e as Error).message}`];
  }
  const errors: string[] = [];
  const root = rootOf(roots);
  if (!root || roots.length !== 1) errors.push('una parte è un programma solo: niente animazioni, azioni né sezioni indossate accanto (chi la include non le riceve)');
  for (const r of roots)
    for (const el of elements(r, () => false)) {
      if (el.name === 'import') errors.push('una parte non include niente');
      else if (FILE_ATTRS.some((a) => el.attrs[a] !== undefined)) errors.push('una parte non legge file di models/');
    }
  const contract = partContract(xml);
  if (!contract) errors.push('manca il contratto: il primo paragrafo del commento in cima');
  else if (contract.length > PART_CONTRACT_MAX + 200) errors.push(`il contratto è lungo ${contract.length} caratteri: al più ${PART_CONTRACT_MAX}`);
  const values = root?.attrs.values;
  const codes = values === undefined ? undefined : symbolsOf(values, 'values');
  if (codes && 'codes' in codes && codes.codes.some((c) => RESERVED_PART_SYMBOLS.has(c))) errors.push('la sua griglia usa S o #90-#97, che le parti del seme tengono per sé');
  return [...new Set(errors)];
}

/** A program with its lines numbered, as the request of `model.part` shows it: the Sculptor answers with these numbers. */
export function numberedLines(xml: string): string {
  const lines = xml.split('\n');
  const w = String(lines.length).length;
  return lines.map((l, i) => `${String(i + 1).padStart(w, ' ')} | ${l}`).join('\n');
}

/** The parts of the world of a library, with their entries and programs, the best voted first, then by id. */
export function worldPartsIn(files: FileMap, index: Record<string, unknown>): Array<{ id: string; entry: Record<string, unknown>; xml: string }> {
  const out: Array<{ id: string; entry: Record<string, unknown>; xml: string }> = [];
  for (const [id, entry] of Object.entries(index)) {
    const xml = files[`models/${id}.xml`];
    if (typeof xml === 'string' && isWorldPart(id, entry)) out.push({ id, entry: entry as Record<string, unknown>, xml });
  }
  const vote = (e: Record<string, unknown>) => (typeof e.score === 'number' && Number.isFinite(e.score) ? e.score : -1);
  return out.sort((a, b) => vote(b.entry) - vote(a.entry) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
