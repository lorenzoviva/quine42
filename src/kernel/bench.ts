// The bench of the Sala sistemi (T27): a case of a system runs in a kernel in miniature — only `core.*`,
// the content and that system, on a scene of 5 × 5 tiles — so what the visitor sees is what the code does.
// The Engineer writes the cases of the systems he forges; the kernel runs them before accepting them.

import type { Kernel, KernelOptions } from './kernel';
import type { BenchCase, BenchItem, BenchStep, FileMap, ItemDef, Manifest, UiPanel } from './types';
import { ITEM_CATEGORIES } from './types';
import { memoryStore } from './repo';
import { MockModels } from './ai/mock';

/** Side of the scene of a case, in tiles (the wanderer in the middle). */
export const BENCH = 5;
/** Ticks per second of the bench: coarser than the game, the systems get the same dt. */
const HZ = 20;
const MAX_SECONDS = 30;
const MAX_CASES = 3;

/** One moment of a case: the watched values and where the wanderer and the things are (carpet tiles). */
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

const PATH_RE = /^(?:(\d+):)?([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)$/i;

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
  const slots = new Set(panel?.elementi.filter((e) => e.tipo === 'slot').map((e) => e.id!) ?? []);
  const buttons = new Set(panel?.elementi.filter((e) => e.tipo === 'pulsante').map((e) => e.id!) ?? []);
  const id = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
  for (const r of (Array.isArray(raw) ? raw : []).slice(0, MAX_CASES) as Array<Record<string, any>>) {
    if (!r || typeof r !== 'object') continue;
    const titolo = String(r.titolo ?? '').trim().slice(0, 60) || 'Caso';
    const v = r.viandante && typeof r.viandante === 'object' ? r.viandante : {};
    const oggetti: BenchItem[] = (Array.isArray(r.oggetti ?? v.oggetti) ? (r.oggetti ?? v.oggetti) : [])
      .slice(0, 6)
      .map((o: any) => (typeof o === 'string' ? { nome: o } : o))
      .filter((o: any) => o && typeof o.nome === 'string' && o.nome.trim())
      .map((o: any) => {
        const bonus = typeof o.bonus_json === 'string' ? parseFlat(o.bonus_json) : o.bonus && typeof o.bonus === 'object' ? parseFlat(JSON.stringify(o.bonus)) : undefined;
        return { nome: o.nome.trim().slice(0, 40), ...(o.posto ? { posto: String(o.posto).toLowerCase().trim() } : {}), ...(o.categoria ? { categoria: String(o.categoria).toLowerCase().trim() } : {}), ...(bonus ? { bonus } : {}) };
      });
    const passi: BenchStep[] = [];
    for (const p of (Array.isArray(r.passi) ? r.passi : []).slice(0, 8) as Array<Record<string, any>>) {
      const tipo = p?.tipo;
      if (tipo === 'slot' || tipo === 'togli') {
        const slot = id(p.slot);
        if (!slots.has(slot)) {
          errors.push(`«${titolo}»: lo slot «${p.slot}» non è nel pannello`);
          continue;
        }
        if (tipo === 'togli') passi.push({ tipo, slot });
        else if (typeof p.oggetto === 'string' && p.oggetto.trim()) passi.push({ tipo, slot, oggetto: p.oggetto.trim() });
        else errors.push(`«${titolo}»: il passo slot non dice quale oggetto`);
      } else if (tipo === 'pulsante') {
        const azione = id(p.azione ?? p.id);
        if (buttons.has(azione)) passi.push({ tipo, azione });
        else errors.push(`«${titolo}»: il pulsante «${p.azione}» non è nel pannello`);
      } else if (tipo === 'attendi') passi.push({ tipo, secondi: num(p.secondi, 0.1, MAX_SECONDS, 1) });
    }
    const guarda = [...new Set((Array.isArray(r.guarda) ? r.guarda : []).map((g: unknown) => String(g).trim()).filter((g: string) => PATH_RE.test(g)))].slice(0, 6) as string[];
    if (!guarda.length) {
      errors.push(`«${titolo}»: "guarda" non ha campi del tipo componente.campo`);
      continue;
    }
    const terreno = Array.isArray(r.terreno) && r.terreno.length === BENCH && r.terreno.every((row: unknown) => typeof row === 'string' && [...row].length === BENCH) ? (r.terreno as string[]) : undefined;
    const cose = (Array.isArray(r.cose) ? r.cose : [])
      .slice(0, 6)
      .filter((c: any) => c && typeof c.modulo === 'string')
      .map((c: any) => ({ modulo: c.modulo, x: Math.round(num(c.x, -2, 2, 1)), y: Math.round(num(c.y, -2, 2, 0)), ...(parseJson(c.componenti ?? c.componenti_json) ? { componenti: parseJson(c.componenti ?? c.componenti_json) } : {}) }));
    const componenti = parseJson(v.componenti ?? r.viandante_json);
    const righe = [...new Set((Array.isArray(r.righe) ? r.righe : []).filter((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= lines))].slice(0, 12) as number[];
    cases.push({
      titolo,
      racconto: String(r.racconto ?? '').trim().slice(0, 300),
      ...(terreno ? { terreno } : {}),
      ...(componenti || oggetti.length ? { viandante: { ...(componenti ? { componenti } : {}), ...(oggetti.length ? { oggetti } : {}) } } : {}),
      ...(cose.length ? { cose } : {}),
      ...(passi.length ? { passi } : {}),
      durata: num(r.durata, 0, MAX_SECONDS, 3),
      guarda,
      ...(righe.length ? { righe } : {}),
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
 * The files of the kernel in miniature: the configuration, `core.*`, the content (data, items, things, the
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
  const trial: ItemDef[] = (c.viandante?.oggetti ?? [])
    .filter((o) => !known(o.nome))
    .map((o) => ({
      id: trialId(o.nome),
      name: o.nome,
      description: `oggetto di prova: ${o.nome}`,
      category: (ITEM_CATEGORIES as readonly string[]).includes(o.categoria ?? '') ? (o.categoria as ItemDef['category']) : o.posto ? 'vestiario' : 'varie',
      weight: 1,
      stack: 1,
      tags: [],
      glyph: [...o.nome][0].toUpperCase(),
      color: '#cccccc',
      ...(o.posto ? { slot: o.posto, equippable: true } : {}),
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
  const k = await opts.boot({ files: benchFiles(files, manifest, logic, c, opts.known), store: memoryStore(), models: new MockModels(), wasmUri: opts.wasmUri, bench: { terreno: c.terreno } });
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

  const player = k.playerId;
  Object.assign(k.playerPos(), { x: 0.5, y: 0.5 });
  for (const [name, data] of Object.entries(c.viandante?.componenti ?? {})) {
    if (['pos', 'module', 'player', 'inventory', 'hand', 'slots'].includes(name)) continue;
    const cur = k.ecs.get(player, name);
    if (cur && typeof cur === 'object') Object.assign(cur, structuredClone(data));
    else k.ecs.set(player, name, structuredClone(data));
  }
  const item = (nome: string) => opts.known(nome) ?? (k.content.get(trialId(nome)) ? trialId(nome) : undefined);
  for (const o of c.viandante?.oggetti ?? []) {
    const it = item(o.nome);
    if (!it || !k.give(it, 1)) errori.push(`il viandante non riesce a portare «${o.nome}»`);
  }
  const things = (c.cose ?? []).map((t) => {
    const m = k.modules.get(t.modulo);
    if (!m || (m.manifest.kind !== 'entity' && m.manifest.kind !== 'item')) {
      errori.push(`«${t.modulo}» non è una cosa che si possa mettere nella scena`);
      return 0;
    }
    const id = k.spawnModuleEntity(m, t.x + 0.5, t.y + 0.5);
    for (const [name, data] of Object.entries(t.componenti ?? {})) k.ecs.set(id, name, structuredClone(data));
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
    const p = id === player ? k.playerCarpet() : k.ecs.get(id, 'pos');
    return [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100];
  };
  const frames: BenchFrame[] = [];
  let t = 0;
  const snap = (passo?: number) => {
    const valori = Object.fromEntries(c.guarda.map((g) => [g, read(g)]));
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
  (c.passi ?? []).forEach((p, i) => {
    let ok = true;
    if (p.tipo === 'slot') {
      const it = item(p.oggetto);
      const at = it ? k.inventory().slots.findIndex((s) => s?.item === it) : -1;
      ok = !!panel && at >= 0 && k.equip(panel, p.slot, at);
      if (!ok) errori.push(`passo ${i + 1}: «${p.oggetto}» non va nello slot «${p.slot}»${at < 0 ? ' (il viandante non lo porta)' : ''}`);
    } else if (p.tipo === 'togli') {
      ok = !!panel && k.unequip(panel, p.slot);
      if (!ok) errori.push(`passo ${i + 1}: lo slot «${p.slot}» è vuoto`);
    } else if (p.tipo === 'pulsante') {
      if (panel) k.uiAction(panel, p.azione);
    }
    if (p.tipo === 'attendi') run(p.secondi);
    else {
      k.tick(1 / HZ);
      t += 1 / HZ;
      snap(i);
    }
  });
  run(c.durata);
  const dopo = frames[frames.length - 1].valori;
  const cambiati = c.guarda.filter((g) => JSON.stringify(prima[g]) !== JSON.stringify(dopo[g]));
  for (const [key, message] of faults) errori.push(`${key.slice(prefix.length)}: ${message}`);
  if (!cambiati.length && !faults.size) errori.push(`non cambia nulla di ciò che guarda (${c.guarda.join(', ')})`);
  k.sandbox.close();
  return { prima, dopo, cambiati, frames, messaggi, errori };
}
