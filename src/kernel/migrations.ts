// The migrations of the universes (T302, ADR-0152): the one place where a universe of a contract `X.Y` is ported to the next.
// The author decided (D36) that a universe no longer compatible is neither thrown away nor migrated by default: it is labelled with the
// range of the kernels it runs on (`kernels`, version.ts) and left standing with the fault `universe:kernel`. When a contract changes and
// a migration is worth writing, it goes in MIGRATIONS: a pure function from the files of `from` to the files of `to`, with its test.
// The first is 0.1 → 0.2 (T307a, ADR-0153, ADR-0154): the internal language of the world's simulation.
// The universe's places live apart (`maps/`, a chunk store): a migration says how a place's plan is ported too (`migratePlan`), and the
// kernel ports every plan it reads (`migratePlanRecord`). The kernel runs the chain at boot (`Kernel.boot`), before the files are read; the
// pages, the worlds of many and the tools run it before they take the seed (`prepareUniverse`, universes.ts), so the seed's new files
// reach a universe in the same load. A ported universe says it in `kernels.from`.

import type { ChunkPlan } from './agents/cartography';
import { INTERNAL_NAMES, internalManifest, internalModelId, internalModelInfo, internalName } from './internalNames';
import { hashStr, hex } from './rng';
import type { FileMap } from './types';
import { checkKernelVersion, compareContracts, contractOf, KERNEL_VERSION, parseContract, parseVersion, showContract, universeKernels, type Contract } from './version';

export interface Migration {
  /** The contract it reads, `X.Y`. */
  from: string;
  /** The contract it writes, the next one, `X.Y`. */
  to: string;
  /** What it changes, in words for the master and the commit. */
  descrizione: string;
  /** The universe's files of `from` → those of `to`. Pure: the same files give the same files; universe.json's kernels are the kernel's. */
  migrate(files: FileMap): FileMap;
  /**
   * A place's plan of `from` → of `to`. The plans are read one at a time, when a place is loaded, and a plan does not say its contract:
   * so this must be idempotent (a plan already of `to` stays as it is), and it runs on every plan read.
   */
  migratePlan?(plan: ChunkPlan): ChunkPlan;
}

/** The migrations from one contract to the next, in order (their functions are below). */
export const MIGRATIONS: readonly Migration[] = [
  {
    from: '0.1',
    to: '0.2',
    descrizione:
      'la lingua interna della simulazione (T307a): classi, taglie, effetti e i loro campi, categorie, forme degli oggetti, id dei terreni, ambienti e timbri del seme, azioni dei programmi, rune in latino ed elementi, pannelli, passi dei casi',
    migrate: (files) => migrate0_2(files),
    migratePlan: (plan) => plan0_2(plan),
  },
];

/** The chain from the contract `from` to `to`, one step at a time; undefined when a step is missing (or `to` is not after `from`). */
export function migrationPath(from: Contract, to: Contract, list: readonly Migration[] = MIGRATIONS): Migration[] | undefined {
  if (compareContracts(from, to) >= 0) return undefined;
  const chain: Migration[] = [];
  let at = from;
  while (compareContracts(at, to) < 0) {
    const step = list.find((m) => {
      const a = parseContract(m.from);
      const b = parseContract(m.to);
      return !!a && !!b && compareContracts(a, at) === 0 && compareContracts(b, at) > 0 && compareContracts(b, to) <= 0;
    });
    if (!step) return undefined;
    chain.push(step);
    at = parseContract(step.to)!;
  }
  return chain;
}

export interface MigrationResult {
  files: FileMap;
  /** The migrations applied, «0.1→0.2: …»; empty when the universe stays as it is. */
  applied: string[];
}

/**
 * A universe's files for the kernel `kernelVersion`: the same files when it runs on it already, when it cannot be read, when it is of a
 * contract after this kernel's, or when a step of the chain is missing; ported by the chain otherwise, with `kernel` and
 * `kernels.from` of this kernel (a ported universe was born again with this contract).
 */
export function migrateUniverse(files: FileMap, kernelVersion: string = KERNEL_VERSION, list: readonly Migration[] = MIGRATIONS): MigrationResult {
  const same = { files, applied: [] };
  const kernel = parseVersion(kernelVersion);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(files['universe.json'] ?? '');
  } catch {
    return same;
  }
  if (!kernel || !parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return same;
  if (checkKernelVersion(parsed.kernel, kernelVersion, parsed.kernels).ok) return same;
  const read = universeKernels(parsed).kernels;
  if (!read) return same;
  const chain = migrationPath(read.last, contractOf(kernel), list);
  if (!chain) return same;
  let out = files;
  for (const m of chain) out = m.migrate(out);
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(out['universe.json'] ?? '');
  } catch {
    return same;
  }
  const ported = { ...config, kernel: kernelVersion, kernels: { from: showContract(contractOf(kernel)) } };
  return { files: { ...out, 'universe.json': JSON.stringify(ported, null, 2) + '\n' }, applied: chain.map((m) => `${m.from}→${m.to}: ${m.descrizione}`) };
}

/**
 * A plan read from the chunk store, ported by every migration that ports plans (all idempotent: a plan does not say its contract). The
 * kernel calls it on every plan it reads; what is not a plan comes back as it is.
 */
export function migratePlanRecord<T extends { plan?: ChunkPlan }>(record: T, list: readonly Migration[] = MIGRATIONS): T {
  if (!record || typeof record !== 'object' || !record.plan || typeof record.plan !== 'object') return record;
  let plan = record.plan;
  for (const m of list) if (m.migratePlan) plan = m.migratePlan(plan);
  return plan === record.plan ? record : { ...record, plan };
}

// --- 0.1 → 0.2 (T307a, ADR-0153, ADR-0154): the internal language of the world's simulation ------------------------------------------
// Classes, sizes, effects and their fields, categories, the common shapes of the items, the terrains' ids, the seed's environments, the
// stamps, the actions of the programs, the magic runes' tokens (Latin) and their elements, the elements of the panels, the steps of the
// cases: everything the table of internalNames.ts says for the step T307a, wherever a universe of 0.1 has it.
// What the Council wrote and only its own module reads (the ids of its actions, environments, items, models) stays as it is. The Lua of
// the Council's modules is ported only where the kernel reads a value (a category compared, an effect handed to core.effects); the
// player's modules and the seed's are not touched: the seed brings its own, and what the player wrote is theirs (rule 3).

const SEED = 'seed.json';
const hashOf = (s: string) => hex(hashStr(s));
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const namesOf = (domain: string): Readonly<Record<string, string>> => INTERNAL_NAMES.find((d) => d.id === domain)?.names ?? {};
const has = (domain: string, v: unknown): v is string => typeof v === 'string' && Object.hasOwn(namesOf(domain), v);
const word = (domain: string, v: unknown): unknown => (typeof v === 'string' ? internalName(domain, v) : v);

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** The JSON of a file changed by `fn` and written back with the indentation it had; the same text when nothing changes or it is not JSON. */
function rewriteJson(text: string, fn: (v: unknown) => unknown): string {
  const before = parseJson(text);
  if (before === undefined) return text;
  const after = fn(parseJson(text));
  if (JSON.stringify(after) === JSON.stringify(before)) return text;
  const indent = /^[[{]\r?\n( +)/.exec(text)?.[1].length ?? 2;
  return JSON.stringify(after, null, indent) + (text.endsWith('\n') ? '\n' : '');
}

/** An object's keys renamed, in their order; a key whose new name is there already gives way to it. */
function renameKeys(o: Record<string, unknown>, fn: (k: string) => string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = fn(k);
    if (key !== k && Object.hasOwn(o, key)) continue;
    out[key] = v;
  }
  return out;
}

/** A magic rune's token in Latin (`fuoco` → `ignis`); any other token as it is. */
const runeToken = (t: string): string => internalName('rune', t);
/** A formula of tokens (`terra fuoco`) in Latin (`terra ignis`). */
const formula = (f: string): string => f.split(/(\s+)/).map((t) => (/\s/.test(t) ? t : runeToken(t))).join('');

/** The stamps of an environment's program with their shapes internal, at any depth. */
function stampsOf(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stampsOf);
  if (!isRecord(node)) return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) out[k] = stampsOf(v);
  if (out.type === 'stamp' && typeof out.shape === 'string') out.shape = internalName('timbri', out.shape);
  return out;
}

/** Every `rune:<token>` of the seven runes at any depth (items in bags, chests, slots, on furniture) in Latin; a hand's tokens too. */
function runesOf(v: unknown): unknown {
  if (typeof v === 'string') {
    const m = /^rune:(.+)$/.exec(v);
    return m && has('rune', m[1]) ? `rune:${runeToken(m[1])}` : v;
  }
  if (Array.isArray(v)) return v.map(runesOf);
  if (!isRecord(v)) return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) out[k] = runesOf(x);
  if (isRecord(out.hand) && Array.isArray(out.hand.tokens)) out.hand = { ...out.hand, tokens: out.hand.tokens.map((t) => (typeof t === 'string' ? runeToken(t) : t)) };
  return out;
}

/** A manifest of 0.1 in 0.2: the values (internalManifest), the runes and incantations by Latin token, the seed's environments and the stamps, the terrains' ids. */
function manifest0_2(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const m = internalManifest(raw) as Record<string, unknown>;
  if (isRecord(m.runes)) {
    m.runes = renameKeys(m.runes, runeToken);
    if (typeof m.description === 'string') m.description = formulasInText(m.description);
  }
  if (isRecord(m.spells)) m.spells = renameKeys(m.spells, formula);
  if (isRecord(m.layouts)) m.layouts = renameKeys(Object.fromEntries(Object.entries(m.layouts).map(([id, def]) => [id, isRecord(def) && 'program' in def ? { ...def, program: stampsOf(def.program) } : def])), (id) => internalName('ambienti', id));
  if (isRecord(m.tiles)) {
    const taken = new Set(Object.values(m.tiles).flatMap((t) => (isRecord(t) && typeof t.id === 'string' ? [t.id] : [])));
    m.tiles = Object.fromEntries(
      Object.entries(m.tiles).map(([code, t]) => {
        if (!isRecord(t) || t.id !== undefined || !has('terreni', t.name)) return [code, t];
        const id = internalName('terreni', t.name);
        if (taken.has(id)) return [code, t];
        taken.add(id);
        return [code, { id, ...t }];
      }),
    );
  }
  return m;
}

/** models/index.json: the ids the kernel names (classes' models, common shapes, common houses), classes and sizes, the environments of the sounds. */
function index0_2(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const out: Record<string, unknown> = {};
  for (const [id, info] of Object.entries(raw)) {
    const to = internalModelId(id);
    if (to !== id && Object.hasOwn(raw, to)) continue;
    let v = internalModelInfo(info);
    if (isRecord(v) && isRecord(v.suono) && Array.isArray(v.suono.ambienti)) v = { ...v, suono: { ...v.suono, ambienti: v.suono.ambienti.map((a) => word('ambienti', a)) } };
    out[to] = v;
  }
  return out;
}

/** world/stato.json: the rare sizes' owners by internal size, the actions done on the forms, the runes carried and stored. */
function state0_2(raw: unknown): unknown {
  const st = runesOf(raw);
  if (!isRecord(st)) return st;
  if (isRecord(st.rari)) st.rari = renameKeys(st.rari, (k) => internalName('taglie', k));
  if (isRecord(st.forme)) st.forme = Object.fromEntries(Object.entries(st.forme).map(([k, d]) => [k, Array.isArray(d) ? d.map((a) => word('azioni-seme', a)) : d]));
  return st;
}

/** A house of a plan or of a venture: its class, size and model internal. */
function house0_2(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const o = { ...raw };
  if ('classe' in o) o.classe = word('classi', o.classe);
  if ('taglia' in o) o.taglia = word('taglie', o.taglia);
  if (typeof o.modello === 'string') o.modello = internalModelId(o.modello);
  return o;
}

/** world/imprese.json: every venture's house. */
const ventures0_2 = (raw: unknown): unknown => (isRecord(raw) && Array.isArray(raw.imprese) ? { ...raw, imprese: raw.imprese.map(house0_2) } : raw);

/** world/rules.json: the effects a rule names, by their internal type (the other words of the list stay: `forma`, `ricetta: …`). */
const rules0_2 = (raw: unknown): unknown =>
  isRecord(raw) && Array.isArray(raw.regole) ? { ...raw, regole: raw.regole.map((r) => (isRecord(r) && Array.isArray(r.effetti) ? { ...r, effetti: r.effetti.map((e) => word('effetti', e)) } : r)) } : raw;

/** world/atlas.json: the environment of every region of the seed's environments. */
const atlas0_2 = (raw: unknown): unknown =>
  isRecord(raw) && Array.isArray(raw.regioni) ? { ...raw, regioni: raw.regioni.map((r) => (isRecord(r) && 'ambiente' in r ? { ...r, ambiente: word('ambienti', r.ambiente) } : r)) } : raw;

/** world/carte.json: the uses of the models the kernel renamed follow them (`modello:albero` → `modello:tree`). */
function cards0_2(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const out = { ...raw };
  const rename = (k: string) => (k.startsWith('modello:') ? `modello:${internalModelId(k.slice('modello:'.length))}` : k);
  for (const field of ['utilizzi', 'allaNascita']) if (isRecord(out[field])) out[field] = renameKeys(out[field] as Record<string, unknown>, rename);
  return out;
}

const RUNE_WORDS = Object.keys(namesOf('rune')).join('|');
/** A formula in a text (two runes or more in a row, `terra fuoco fuoco`), and a token in guillemets (`«fuoco»`), in Latin. */
function formulasInText(text: string): string {
  const run = new RegExp(`(?<![\\p{L}])(?:${RUNE_WORDS})(?: (?:${RUNE_WORDS}))+(?![\\p{L}])`, 'gu');
  return text.replace(run, (f) => formula(f)).replace(new RegExp(`«(${RUNE_WORDS})»`, 'g'), (_, t: string) => `«${runeToken(t)}»`);
}

/** The XML of a program: the seed's names of the actions (`<action name="apri">` → `open`), the rest as it is. */
const xml0_2 = (xml: string): string => xml.replace(/(<action\b[^>]*?\bname=")([^"]+)(")/g, (_, a: string, n: string, b: string) => `${a}${internalName('azioni-seme', n)}${b}`);

// The Lua of the Council's modules: a lexer just good enough to replace a string or a key in place and leave everything else as it is
// (comments, long strings, spacing). A token replaced by a token of the same kind keeps the code as valid as it was.

interface LuaToken {
  kind: 'name' | 'string' | 'op' | 'other';
  /** Where it is in the source, and its text; for a quoted string, the value between the quotes. */
  start: number;
  end: number;
  text: string;
  value?: string;
}

function luaTokens(src: string): LuaToken[] {
  const out: LuaToken[] = [];
  let i = 0;
  const longClose = (at: number): number => {
    const m = /^\[(=*)\[/.exec(src.slice(at));
    if (!m) return -1;
    const close = src.indexOf(`]${m[1]}]`, at + m[0].length);
    return close < 0 ? src.length : close + m[1].length + 2;
  };
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (src.startsWith('--', i)) {
      const long = longClose(i + 2);
      if (long >= 0) i = long;
      else {
        const nl = src.indexOf('\n', i);
        i = nl < 0 ? src.length : nl;
      }
      continue;
    }
    if (c === '[' && /^\[=*\[/.test(src.slice(i))) {
      const end = longClose(i);
      out.push({ kind: 'other', start: i, end, text: src.slice(i, end) });
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let value = '';
      let plain = true;
      while (j < src.length && src[j] !== c && src[j] !== '\n') {
        if (src[j] === '\\') {
          plain = false;
          j += 2;
          continue;
        }
        value += src[j++];
      }
      const end = Math.min(src.length, j + 1);
      out.push({ kind: 'string', start: i, end, text: src.slice(i, end), ...(plain ? { value } : {}) });
      i = end;
      continue;
    }
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i, i + 200));
    if (name) {
      out.push({ kind: 'name', start: i, end: i + name[0].length, text: name[0] });
      i += name[0].length;
      continue;
    }
    const op = /^(==|~=|<=|>=|\.\.\.|\.\.|::|[{}()[\];,.=<>+\-*/%^#&|~:])/.exec(src.slice(i, i + 3));
    if (op) {
      out.push({ kind: 'op', start: i, end: i + op[0].length, text: op[0] });
      i += op[0].length;
      continue;
    }
    const other = /^[0-9][0-9A-Za-z_.]*/.exec(src.slice(i, i + 64))?.[0] ?? c;
    out.push({ kind: 'other', start: i, end: i + other.length, text: other });
    i += other.length;
  }
  return out;
}

/**
 * The Lua of a module of 0.1 in 0.2, where the kernel reads a value: a category compared (`d.category == "cibo"` → `"food"`), an effect
 * built as a table (`{ tipo = "fuoco", raggio = 2 }` → `{ type = "fire", radius = 2 }`). Nothing else changes.
 */
export function luaFor0_2(src: string): string {
  const toks = luaTokens(src);
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const quote = (t: LuaToken, value: string) => `${t.text[0]}${value}${t.text[0]}`;
  const isCategoryAt = (i: number) => toks[i]?.kind === 'name' && toks[i].text === 'category' && toks[i - 1]?.text === '.';
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    // A category compared, on either side of == or ~=.
    if (t.kind === 'string' && t.value !== undefined && has('categorie', t.value)) {
      const before = toks[i - 1]?.text === '==' || toks[i - 1]?.text === '~=' ? isCategoryAt(i - 2) : false;
      let after = false;
      if (toks[i + 1]?.text === '==' || toks[i + 1]?.text === '~=') {
        let j = i + 2;
        while (toks[j]?.kind === 'name' && toks[j + 1]?.text === '.') j += 2;
        after = isCategoryAt(j);
      }
      if (before || after) edits.push({ start: t.start, end: t.end, text: quote(t, internalName('categorie', t.value)) });
    }
    // A table constructor that is an effect: its own `tipo = "<effect>"`.
    if (t.text === '{') {
      const keys: number[] = [];
      let depth = 0;
      let effect: number | undefined;
      for (let j = i + 1; j < toks.length; j++) {
        const x = toks[j];
        if (x.text === '{' || x.text === '(' || x.text === '[') depth++;
        else if (x.text === '}' || x.text === ')' || x.text === ']') {
          if (depth === 0) break;
          depth--;
        } else if (depth === 0 && x.kind === 'name' && toks[j + 1]?.text === '=' && toks[j + 2]?.text !== '=' && (toks[j - 1]?.text === '{' || toks[j - 1]?.text === ',' || toks[j - 1]?.text === ';')) {
          keys.push(j);
          if (x.text === 'tipo' && toks[j + 2]?.kind === 'string' && has('effetti', toks[j + 2].value)) effect = j + 2;
        }
      }
      if (effect !== undefined) {
        for (const k of keys) {
          const to = internalName('campi-effetti', toks[k].text);
          if (to !== toks[k].text) edits.push({ start: toks[k].start, end: toks[k].end, text: to });
        }
        edits.push({ start: toks[effect].start, end: toks[effect].end, text: quote(toks[effect], internalName('effetti', toks[effect].value!)) });
      }
    }
  }
  if (!edits.length) return src;
  let out = '';
  let at = 0;
  for (const e of edits.sort((a, b) => a.start - b.start)) {
    if (e.start < at) continue;
    out += src.slice(at, e.start) + e.text;
    at = e.end;
  }
  return out + src.slice(at);
}

/** The modules of the Council (their manifest says where they come from): only their Lua is ported. */
function councilModules(files: FileMap): Set<string> {
  const out = new Set<string>();
  for (const [p, text] of Object.entries(files)) {
    const m = /^modules\/([^/]+)\/manifest\.json$/.exec(p);
    if (!m) continue;
    const man = parseJson(text);
    if (isRecord(man) && typeof man.origin === 'string' && man.origin && man.origin !== 'esempio') out.add(m[1]);
  }
  return out;
}

function migrate0_2(files: FileMap): FileMap {
  const council = councilModules(files);
  // The models the kernel names by an Italian id take the internal one, when the universe does not have it already.
  const renamed = new Map<string, string>();
  for (const p of Object.keys(files)) {
    const m = /^models\/([^/]+)\.xml$/.exec(p);
    if (!m) continue;
    const to = `models/${internalModelId(m[1])}.xml`;
    if (to !== p && files[to] === undefined) renamed.set(p, to);
  }
  const out: FileMap = {};
  for (const [p, text] of Object.entries(files)) {
    if (p === SEED) continue;
    let next = text;
    if (/^modules\/[^/]+\/manifest\.json$/.test(p)) next = rewriteJson(text, manifest0_2);
    else if (/^modules\/([^/]+)\/.+\.lua$/.test(p) && council.has(/^modules\/([^/]+)\//.exec(p)![1])) next = luaFor0_2(text);
    else if (p === 'models/index.json') next = rewriteJson(text, index0_2);
    else if (/^models\/[^/]+\.xml$/.test(p)) next = xml0_2(text);
    else if (p === 'world/stato.json' || /^world\/giocatori\/[^/]+\.json$/.test(p)) next = rewriteJson(text, p === 'world/stato.json' ? state0_2 : runesOf);
    else if (p === 'world/imprese.json') next = rewriteJson(text, ventures0_2);
    else if (p === 'world/rules.json') next = rewriteJson(text, rules0_2);
    else if (p === 'world/atlas.json') next = rewriteJson(text, atlas0_2);
    else if (p === 'world/carte.json') next = rewriteJson(text, cards0_2);
    else if (p === 'world/canone.md') next = formulasInText(text);
    out[renamed.get(p) ?? p] = next;
  }
  // seed.json says which files were the seed's as they are: one the migration changed or renamed that was the seed's stays the seed's
  // (its hash follows it), so the seed of 0.2 replaces it at the next upgrade; one the universe had changed stays its own.
  if (files[SEED] !== undefined) {
    const base = parseJson(files[SEED]);
    if (isRecord(base)) {
      const next: Record<string, unknown> = {};
      for (const [p, hash] of Object.entries(base)) {
        const to = renamed.get(p) ?? p;
        const pristine = files[p] !== undefined && hashOf(files[p]) === hash;
        next[to] = pristine && out[to] !== undefined ? hashOf(out[to]) : hash;
      }
      out[SEED] = JSON.stringify(next, null, 1) + '\n';
    } else out[SEED] = files[SEED];
  }
  return out;
}

/** A plan of 0.1 in 0.2 (idempotent): the seed's environment by its internal id, the structures' sizes, the runes' tokens, the houses. */
function plan0_2(plan: ChunkPlan): ChunkPlan {
  const p = plan as ChunkPlan & Record<string, unknown>;
  const layout = typeof p.layout === 'string' ? internalName('ambienti', p.layout) : p.layout;
  const strutture = Array.isArray(p.strutture) ? p.strutture.map((s) => (isRecord(s) && typeof s.taglia === 'string' ? { ...s, taglia: internalName('taglie', s.taglia) } : s)) : p.strutture;
  const runes = Array.isArray(p.runes) ? p.runes.map((r) => (typeof r === 'string' ? formula(r) : r)) : p.runes;
  const houses = Array.isArray(p.case) ? p.case.map(house0_2) : p.case;
  const next = { ...p, layout, ...(p.strutture !== undefined ? { strutture } : {}), runes, ...(p.case !== undefined ? { case: houses } : {}) } as ChunkPlan;
  return JSON.stringify(next) === JSON.stringify(plan) ? plan : next;
}
