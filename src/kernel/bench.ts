// The bench of the Sala sistemi (T27): a case of a system runs in a kernel in miniature — only `core.*`,
// the content and that system, on a scene of 5 × 5 tiles — so what the visitor sees is what the code does.
// The Engineer writes the cases of the systems he forges; the kernel runs them before accepting them.

import type { Kernel, KernelOptions } from './kernel';
import type { BenchCase, BenchItem, BenchStep, BenchWay, FileMap, ItemDef, Manifest, UiPanel } from './types';
import { ITEM_CATEGORIES } from './types';
import { internalComponents, internalFieldPath, internalFields, internalName } from './internalNames';
import { memoryStore } from './repo';
import { MockAiModels } from './ai/mock';

/** Side of the scene of a case, in tiles (the wanderer in the middle). */
export const BENCH = 5;
/** Ticks per second of the bench: coarser than the game, the systems get the same dt. */
const HZ = 20;
const MAX_SECONDS = 30;
const MAX_CASES = 3;
/** The keys a walk of a case holds: the ways are the keys' own names (T307a). */
const WAYS: Record<BenchWay, 'up' | 'down' | 'left' | 'right'> = { up: 'up', down: 'down', left: 'left', right: 'right' };

/** One moment of a case: the watched values and where the wanderer and the entities are (carpet tiles). */
export interface BenchFrame {
  t: number;
  /** The step just done (index in `passi`), if this frame follows one. */
  passo?: number;
  valori: Record<string, unknown>;
  pos: Array<[number, number] | null>;
}

export interface BenchRun {
  prima: Record<string, unknown>;
  dopo: Record<string, unknown>;
  /** The watched fields that changed. */
  cambiati: string[];
  frames: BenchFrame[];
  /** What the system said to the wanderer during the case. */
  messaggi: string[];
  /** Why the case does not show the system working (faults, steps that fail, nothing changes). */
  errori: string[];
}

/** A case on the bench of the Systems Room (T27b): which system, which of its cases, where its code is. */
export interface BenchEntry {
  /** `<system>#<n>`. */
  id: string;
  system: string;
  name: string;
  description?: string;
  path: string;
  /** Its place among the cases of its system, and how many it has. */
  of: number;
  cases: number;
  case: BenchCase;
}

/** What the glass case sets out: the 5 × 5 tiles (row by row, from the top) and the entities of the case, in its order. */
export interface BenchScene {
  tiles: Array<{ color: string; layer?: string; solid: boolean }>;
  /** `fire`: it burns (a `fuoco` component in the case): drawn as a flame. */
  entities: Array<{ name: string; color: string; radius: number; individual: boolean; fire: boolean }>;
}

/** The bench now: the case, its place among all, its scene and code, and its run once the kernel in miniature has done it. */
export interface BenchShown {
  entry: BenchEntry;
  index: number;
  count: number;
  /** The case and the code it ran with: a new key when the player rewrites the system. */
  key: string;
  scene: BenchScene;
  code: string[];
  run?: BenchRun;
}

/** A short fingerprint of a text (FNV-1a): the runs of the bench are kept by case and code. */
export function textKey(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

const PATH_RE =/^(?:(\d+):)?([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)$/i;

const slugOf = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'cosa';

const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

function parseJson(v: unknown): Record<string, Record<string, unknown>> | undefined {
  let o = v;
  if (typeof v === 'string') {
    try {
      o = JSON.parse(v);
    } catch {
      return undefined;
    }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return undefined;
  const out: Record<string, Record<string, unknown>> = {};
  for (const [k, c] of Object.entries(o)) if (/^[a-z_][a-z0-9_]*$/i.test(k) && c && typeof c === 'object' && !Array.isArray(c)) out[k] = c as Record<string, unknown>;
  return Object.keys(out).length ? out : undefined;
}

/**
 * The cases as the kernel can run them: known steps, slots and buttons of the module's own panel, watched
 * fields as paths, at most 30 seconds. What can be mended is mended; a case without anything to watch is dropped.
 */
export function cleanCases(raw: unknown, panel: UiPanel | undefined, lines: number): { cases: BenchCase[]; errors: string[] } {
  const errors: string[] = [];
  const cases: BenchCase[] = [];
  const slots = new Set(panel?.elements.filter((e) => e.type === 'slot').map((e) => e.id!) ?? []);
  const buttons = new Set(panel?.elements.filter((e) => e.type === 'button').map((e) => e.id!) ?? []);
  const id = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
  for (const r0 of (Array.isArray(raw) ? raw : []).slice(0, MAX_CASES) as Array<Record<string, any>>) {
    if (!r0 || typeof r0 !== 'object') continue;
    // A case as the Engineer writes it (English fields since T310b; one of before reads with those of 0.4, T308a), or as a manifest keeps it.
    const r = internalFields('bench', r0) as Record<string, any>;
    const titolo = String(r.title ?? '').trim().slice(0, 60) || 'Caso';
    const v = r.wanderer && typeof r.wanderer === 'object' ? r.wanderer : {};
    // The items of the wanderer, also as the Engineer lists them beside the case (`items`; `oggetti` before T310b): with the fields of 0.4.
    const listed = (Array.isArray(r.items) ? r.items : Array.isArray(r.oggetti) ? r.oggetti : Array.isArray(v.items) ? v.items : []).map((o: any) => (typeof o === 'string' ? { name: o } : o));
    const oggetti: BenchItem[] = ((internalFields('bench', { viandante: { oggetti: listed } }) as { wanderer?: { items?: any[] } }).wanderer?.items ?? [])
      .slice(0, 6)
      .filter((o: any) => o && typeof o.name === 'string' && o.name.trim())
      .map((o: any) => {
        // The bonuses by their internal names (T310b): `{"difesa":3}` of before is `{"defense":3}`.
        const raw = typeof o.bonus_json === 'string' ? parseFlat(o.bonus_json) : o.bonus && typeof o.bonus === 'object' ? parseFlat(JSON.stringify(o.bonus)) : undefined;
        const bonus = raw ? Object.fromEntries(Object.entries(raw).map(([k, x]) => [internalName('bonus', k), x])) : undefined;
        return { name: o.name.trim().slice(0, 40), ...(o.slot ? { slot: internalName('posti', String(o.slot).toLowerCase().trim()) } : {}), ...(o.category ? { category: internalName('categorie', String(o.category).toLowerCase().trim()) } : {}), ...(bonus ? { bonus } : {}) };
      });
    const passi: BenchStep[] = [];
    for (const p of (Array.isArray(r.steps) ? r.steps : []).slice(0, 8) as Array<Record<string, any>>) {
      // The Engineer still writes the Italian steps of the contract 0.1 (T307a, until T310): `togli` is `remove`.
      const tipo = typeof p?.type === 'string' ? internalName('passi-banco', p.type) : undefined;
      if (tipo === 'slot' || tipo === 'remove') {
        const slot = id(p.slot);
        if (!slots.has(slot)) {
          errors.push(`«${titolo}»: lo slot «${p.slot}» non è nel pannello`);
          continue;
        }
        if (tipo === 'remove') passi.push({ type: tipo, slot });
        else if (typeof p.item === 'string' && p.item.trim()) passi.push({ type: tipo, slot, item: p.item.trim() });
        else errors.push(`«${titolo}»: il passo slot non dice quale oggetto`);
      } else if (tipo === 'button') {
        const azione = id(p.action ?? p.id);
        if (buttons.has(azione)) passi.push({ type: tipo, action: azione });
        else errors.push(`«${titolo}»: il pulsante «${p.action}» non è nel pannello`);
      } else if (tipo === 'wait') passi.push({ type: tipo, seconds: num(p.seconds, 0.1, MAX_SECONDS, 1) });
      else if (tipo === 'walk') {
        const verso = internalName('passi-banco', id(p.toward).replace(/^sotto$/, 'giu').replace(/^sopra$/, 'su'));
        if (verso in WAYS) passi.push({ type: tipo, toward: verso as BenchWay, seconds: num(p.seconds, 0.1, MAX_SECONDS, 1) });
        else errors.push(`«${titolo}»: «${p.toward}» non è una direzione (su, giu, sinistra, destra)`);
      }
    }
    const guarda = [...new Set((Array.isArray(r.watch) ? r.watch : []).map((g: unknown) => internalFieldPath(String(g).trim())).filter((g: string) => PATH_RE.test(g)))].slice(0, 6) as string[];
    if (!guarda.length) {
      errors.push(`«${titolo}»: "guarda" non ha campi del tipo componente.campo`);
      continue;
    }
    const terreno = Array.isArray(r.terrain) && r.terrain.length === BENCH && r.terrain.every((row: unknown) => typeof row === 'string' && [...row].length === BENCH) ? (r.terrain as string[]) : undefined;
    const cose = (Array.isArray(r.entities) ? r.entities : [])
      .slice(0, 6)
      .filter((c: any) => c && typeof c.module === 'string')
      .map((c: any) => ({ module: c.module, x: Math.round(num(c.x, -2, 2, 1)), y: Math.round(num(c.y, -2, 2, 0)), ...(parseJson(c.components ?? c.components_json ?? c.componenti_json) ? { components: internalComponents(parseJson(c.components ?? c.components_json ?? c.componenti_json)) as Record<string, Record<string, unknown>> } : {}) }));
    // The components and the watched fields of 0.4 (`meta.x`) the Engineer may still write (T308b): those of 0.5 (`goal.x`).
    const componenti = internalComponents(parseJson(v.components ?? r.wanderer_json ?? r.viandante_json)) as ReturnType<typeof parseJson>;
    const righe = [...new Set((Array.isArray(r.lines) ? r.lines : []).filter((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= lines))].slice(0, 12) as number[];
    cases.push({
      title: titolo,
      story: String(r.story ?? '').trim().slice(0, 300),
      ...(terreno ? { terrain: terreno } : {}),
      ...(componenti || oggetti.length ? { wanderer: { ...(componenti ? { components: componenti } : {}), ...(oggetti.length ? { items: oggetti } : {}) } } : {}),
      ...(cose.length ? { entities: cose } : {}),
      ...(passi.length ? { steps: passi } : {}),
      duration: num(r.duration, 0, MAX_SECONDS, 3),
      watch: guarda,
      ...(righe.length ? { lines: righe } : {}),
    });
  }
  return { cases, errors };
}

function parseFlat(src: string): Record<string, number> | undefined {
  try {
    const o = JSON.parse(src);
    if (!o || typeof o !== 'object') return undefined;
    const out = Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'number' && Number.isFinite(v))) as Record<string, number>;
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}

/** Id of the trial object of a case that the universe does not have. */
export const trialId = (nome: string) => `item.prova-${slugOf(nome)}`;

/**
 * The files of the kernel in miniature: the configuration, `core.*`, the content (data, items, entities, the
 * player, the terrain's palette) and the system of the case; no other system, no models, no world files.
 * Objects of the case the universe lacks become trial objects of a pack of the bench.
 */
export function benchFiles(files: FileMap, manifest: Manifest, logic: string, c: BenchCase, known: (name: string) => string | undefined): FileMap {
  const out: FileMap = {};
  const kinds = new Map<string, string>();
  for (const [path, text] of Object.entries(files)) {
    const m = /^modules\/([^/]+)\/manifest\.json$/.exec(path);
    if (!m) continue;
    try {
      kinds.set(m[1], JSON.parse(text).kind);
    } catch {
      /* an invalid manifest stays out */
    }
  }
  for (const [path, text] of Object.entries(files)) {
    if (path === 'universe.json') out[path] = text;
    const m = /^modules\/([^/]+)\//.exec(path);
    if (!m || m[1] === manifest.id) continue;
    const kind = kinds.get(m[1]);
    if (m[1].startsWith('core.') || (kind && kind !== 'system')) out[path] = text;
  }
  out[`modules/${manifest.id}/manifest.json`] = JSON.stringify(manifest);
  out[`modules/${manifest.id}/logic.lua`] = logic;
  const trial: ItemDef[] = (c.wanderer?.items ?? [])
    .filter((o) => !known(o.name))
    .map((o) => ({
      id: trialId(o.name),
      name: o.name,
      description: `oggetto di prova: ${o.name}`,
      category: (ITEM_CATEGORIES as readonly string[]).includes(internalName('categorie', o.category ?? '')) ? (internalName('categorie', o.category!) as ItemDef['category']) : o.slot ? 'clothing' : 'misc',
      weight: 1,
      stack: 1,
      tags: [],
      glyph: [...o.name][0].toUpperCase(),
      color: '#cccccc',
      ...(o.slot ? { slot: o.slot, equippable: true } : {}),
      ...(o.bonus ? { bonus: o.bonus } : {}),
    }));
  if (trial.length) out['modules/bench.prova/manifest.json'] = JSON.stringify({ id: 'bench.prova', name: 'Oggetti di prova', kind: 'data', items: trial });
  return out;
}

/** Runs a case in a kernel in miniature: before, the steps, after; what changed and what went wrong. */
export async function runCase(
  files: FileMap,
  manifest: Manifest,
  logic: string,
  c: BenchCase,
  opts: { wasmUri?: string; boot: (o: KernelOptions) => Promise<Kernel>; known: (name: string) => string | undefined },
): Promise<BenchRun> {
  const k = await opts.boot({ files: benchFiles(files, manifest, logic, c, opts.known), store: memoryStore(), ai: new MockAiModels(), wasmUri: opts.wasmUri, bench: { terreno: c.terrain } });
  const errori: string[] = [];
  const messaggi: string[] = [];
  const faults = new Map<string, string>();
  const prefix = `module:${manifest.id}:`;
  const prev = k.faults.onRaise;
  k.faults.onRaise = (f, isNew) => {
    if (f.key.startsWith(prefix)) faults.set(f.key, f.message);
    prev?.(f, isNew);
  };
  k.bus.on('ui:message', (m: { text: string }) => messaggi.push(m.text));
  const load = [...k.faults.list()].find((f) => f.key.startsWith(prefix) || f.key.startsWith(`manifest:modules/${manifest.id}/`));
  if (load) return { prima: {}, dopo: {}, cambiati: [], frames: [], messaggi, errori: [`il modulo non si carica: ${load.message}`] };

  const player = k.wandererEntity;
  Object.assign(k.wandererPos(), { x: 0.5, y: 0.5 });
  for (const [name, data] of Object.entries(c.wanderer?.components ?? {})) {
    if (['pos', 'module', 'player', 'inventory', 'hand', 'slots'].includes(name)) continue;
    const cur = k.ecs.get(player, name);
    if (cur && typeof cur === 'object') Object.assign(cur, structuredClone(data));
    else k.ecs.set(player, name, structuredClone(data));
  }
  const item = (nome: string) => opts.known(nome) ?? (k.content.get(trialId(nome)) ? trialId(nome) : undefined);
  for (const o of c.wanderer?.items ?? []) {
    const it = item(o.name);
    if (!it || !k.give(it, 1)) errori.push(`il viandante non riesce a portare «${o.name}»`);
  }
  const things = (c.entities ?? []).map((t) => {
    const m = k.modules.get(t.module);
    if (!m || (m.manifest.kind !== 'entity' && m.manifest.kind !== 'item')) {
      errori.push(`«${t.module}» non è una cosa che si possa mettere nella scena`);
      return 0;
    }
    const id = k.spawnModuleEntity(m, t.x + 0.5, t.y + 0.5);
    for (const [name, data] of Object.entries(t.components ?? {})) k.ecs.set(id, name, structuredClone(data));
    return id;
  });

  const read = (path: string): unknown => {
    const [, n, comp, field] = PATH_RE.exec(path)!;
    const id = n === undefined ? player : things[Number(n)];
    if (!id || !k.ecs.alive.has(id)) return 'assente';
    const v = k.ecs.get(id, comp)?.[field];
    return typeof v === 'number' ? Math.round(v * 1000) / 1000 : v === undefined || v === null ? null : structuredClone(v);
  };
  const where = (id: number): [number, number] | null => {
    if (!id || !k.ecs.alive.has(id)) return null;
    const p = id === player ? k.wandererCarpet() : k.ecs.get(id, 'pos');
    return [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100];
  };
  const frames: BenchFrame[] = [];
  let t = 0;
  const snap = (passo?: number) => {
    const valori = Object.fromEntries(c.watch.map((g) => [g, read(g)]));
    frames.push({ t: Math.round(t * 100) / 100, ...(passo === undefined ? {} : { passo }), valori, pos: [where(player), ...things.map(where)] });
    return valori;
  };
  const run = (seconds: number) => {
    const ticks = Math.round(seconds * HZ);
    for (let i = 1; i <= ticks; i++) {
      k.tick(1 / HZ);
      t += 1 / HZ;
      if (i % (HZ / 2) === 0 || i === ticks) snap();
    }
  };

  const prima = snap();
  const panel = manifest.ui?.id;
  (c.steps ?? []).forEach((p, i) => {
    let ok = true;
    if (p.type === 'slot') {
      const it = item(p.item);
      const at = it ? k.inventory().slots.findIndex((s) => s?.item === it) : -1;
      ok = !!panel && at >= 0 && k.equip(panel, p.slot, at);
      if (!ok) errori.push(`passo ${i + 1}: «${p.item}» non va nello slot «${p.slot}»${at < 0 ? ' (il viandante non lo porta)' : ''}`);
    } else if (p.type === 'remove') {
      ok = !!panel && k.unequip(panel, p.slot);
      if (!ok) errori.push(`passo ${i + 1}: lo slot «${p.slot}» è vuoto`);
    } else if (p.type === 'button') {
      if (panel) k.uiAction(panel, p.action);
    }
    if (p.type === 'wait') run(p.seconds);
    else if (p.type === 'walk') {
      k.input.setHeld(WAYS[p.toward], true);
      run(p.seconds);
      k.input.releaseAll();
    }
    else {
      k.tick(1 / HZ);
      t += 1 / HZ;
      snap(i);
    }
  });
  run(c.duration);
  const dopo = frames[frames.length - 1].valori;
  const cambiati = c.watch.filter((g) => JSON.stringify(prima[g]) !== JSON.stringify(dopo[g]));
  for (const [key, message] of faults) errori.push(`${key.slice(prefix.length)}: ${message}`);
  if (!cambiati.length && !faults.size) errori.push(`non cambia nulla di ciò che guarda (${c.watch.join(', ')})`);
  k.sandbox.close();
  return { prima, dopo, cambiati, frames, messaggi, errori };
}

/** The fields the systems of the seed watch, in words; the others keep their name. */
const FIELD_NAME: Record<string, string> = {
  'needs.health': 'salute',
  'needs.hunger': 'fame',
  'needs.thirst': 'sete',
  'needs.energy': 'energia',
  'needs.mana': 'mana',
  'body.solid': 'c’è',
  'shield.expires': 'scudo fino a',
  'ephemeral.expires': 'dura fino a',
  'pos.x': 'x',
  'pos.y': 'y',
  'vel.x': 'velocità x',
  'vel.y': 'velocità y',
};

/** «salute», «Rovo: c’è», «Abitante: x»: what a watched field is, with the name of its entity. */
export function fieldLabel(path: string, scene?: BenchScene): string {
  const m = PATH_RE.exec(path);
  if (!m) return path;
  const name = FIELD_NAME[`${m[2]}.${m[3]}`] ?? `${m[2]}.${m[3]}`;
  if (m[1] === undefined) return name;
  return `${scene?.entities[Number(m[1])]?.name ?? `cosa ${m[1]}`}: ${name}`;
}

/** A watched value as the screen says it: a number to one decimal, yes/no, «sparita» for an entity that is gone. */
export function valueText(v: unknown): string {
  if (v === 'assente') return 'sparita';
  if (v === null || v === undefined) return '—';
  if (v === true) return 'sì';
  if (v === false) return 'no';
  if (typeof v === 'number') return String(Math.round(v * 10) / 10).replace('.', ',');
  return typeof v === 'string' ? v : JSON.stringify(v);
}
