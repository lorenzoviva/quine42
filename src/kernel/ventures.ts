// The ventures (T245d, ADR-0148; docs/design/comportamento-npc.md, section 3): the work of many towards a result one sees, days or
// months long. One file of the world, `world/imprese.json`, written only by the kernel (rule 8b: a wanderer acts in the world, never in
// the file), never sent to a client (it is in no list of `src/session/files.ts`), back with `R` as everything of the world.
// The progress is derived: the phase now is the first whose materials are not all brought or whose work is not done, so there is no
// counter to keep true. Pure: the kernel, the tests and the panel read it.

import { hash32, hashStr } from './rng';

export const VENTURES_FILE = 'world/imprese.json';
export const VENTURE_TYPES = ['costruzione', 'raccolto', 'festa', 'ricerca', 'bonifica', 'viaggio', 'elezione'] as const;
export type VentureType = (typeof VENTURE_TYPES)[number];
export type VentureState = 'in corso' | 'attesa' | 'ferma' | 'finita';

/** At most this many in a team, this many ventures open at once, this many kept once finished (the oldest finished go first). */
export const MAX_TEAM = 6;
export const MAX_OPEN = 12;
export const MAX_KEPT = 40;
/** A year of the world, in days, and the day of it the harvest begins (T245d: the calendar of the kernel). */
export const YEAR_DAYS = 24;
export const HARVEST_DAY = 16;
/** How long a harvest lasts at most, in days: then the season has passed. */
export const HARVEST_DAYS = 3;
/** How near the site one works, in tiles. */
export const SITE_REACH = 3.5;

export interface VenturePhase {
  nome: string;
  /** What this phase needs brought (item id → how many). */
  materiali: Record<string, number>;
  /** Seconds of work of one person. */
  lavoro: number;
  /** The stage of the building once this phase is done (0..1, T245e). */
  stadio: number;
}

export interface VentureRole {
  ruolo: string;
  /** The program of a trade the role wants (`contadino`), or `qualunque`. */
  mestiere: string;
  quanti: number;
}

export interface VentureMember {
  nome: string;
  ruolo: string;
}

/** What a member does at the site of a harvest (a `raccogli` of a trade): the tile, what it gives, what it leaves. */
export interface VentureTask {
  casella: string;
  oggetto: string;
  lascia: string;
  durata: number;
  posa?: string;
}

export interface Venture {
  id: string;
  titolo: string;
  tipo: VentureType;
  stato: VentureState;
  /** The place (`cx,cy`) and where the work is in it (the centre of the lot, in tiles). */
  luogo: string;
  posto: { x: number; y: number };
  /** A rebuilding: the lot of the place it stands on and the origin of its structure. */
  lotto?: number;
  origine?: string;
  /** A new building: its box in the cells of the place, inclusive. */
  area?: { x0: number; y0: number; x1: number; y1: number };
  modello?: string;
  concetto?: string;
  classe?: string;
  taglia?: string;
  seme?: number;
  yaw?: number;
  fasi: VenturePhase[];
  ruoli: VentureRole[];
  portati: Record<string, number>;
  lavorato: number;
  squadra: VentureMember[];
  /** The day it began, the last day someone worked, the day it ended; the day after which it is over anyway (a harvest). */
  inizio: number;
  ultimo: number;
  fine?: number;
  scade?: number;
  compito?: VentureTask;
  /** Where it came from: `regola:ricostruzione`, `regola:casa`, `regola:raccolto` (and, with T245g, `trama:<id>`). */
  nato_da: string;
  carta?: Record<string, unknown>;
}

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, n = 80) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : undefined);
const counts = (v: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
    const c = Math.floor(num(n));
    if (c > 0 && k.length <= 60 && k !== '__proto__') out[k] = Math.min(c, 100000);
  }
  return out;
};

/** One venture as the file says it, made right (a field out of range is clamped, one that is wrong drops the venture). Unknown fields stay. */
export function readVenture(raw: unknown): Venture | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  const id = str(r.id, 40);
  const luogo = str(r.luogo, 24);
  const tipo = VENTURE_TYPES.includes(r.tipo as VentureType) ? (r.tipo as VentureType) : undefined;
  const posto = r.posto as { x?: unknown; y?: unknown } | undefined;
  if (!id || !luogo || !/^-?\d+,-?\d+$/.test(luogo) || !tipo || !posto || !Number.isFinite(posto.x) || !Number.isFinite(posto.y)) return undefined;
  const fasi = (Array.isArray(r.fasi) ? r.fasi : []).slice(0, 8).flatMap((f): VenturePhase[] => {
    const o = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>;
    const nome = str(o.nome, 40);
    return nome ? [{ nome, materiali: counts(o.materiali), lavoro: Math.max(0, Math.min(1e6, num(o.lavoro))), stadio: Math.max(0, Math.min(1, num(o.stadio, 1))) }] : [];
  });
  if (!fasi.length) return undefined;
  const ruoli = (Array.isArray(r.ruoli) ? r.ruoli : []).slice(0, MAX_TEAM).flatMap((x): VentureRole[] => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const ruolo = str(o.ruolo, 30);
    return ruolo ? [{ ruolo, mestiere: str(o.mestiere, 40) ?? 'qualunque', quanti: Math.max(1, Math.min(MAX_TEAM, Math.floor(num(o.quanti, 1)))) }] : [];
  });
  const squadra = (Array.isArray(r.squadra) ? r.squadra : []).slice(0, MAX_TEAM).flatMap((x): VentureMember[] => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const nome = str(o.nome, 60);
    return nome ? [{ nome, ruolo: str(o.ruolo, 30) ?? 'manovale' }] : [];
  });
  const stato = (['in corso', 'attesa', 'ferma', 'finita'] as const).find((s) => s === r.stato) ?? 'in corso';
  const v: Venture = {
    ...(r as object),
    id,
    titolo: str(r.titolo, 80) ?? 'Un lavoro di molti',
    tipo,
    stato,
    luogo,
    posto: { x: Number(posto.x), y: Number(posto.y) },
    fasi,
    ruoli: ruoli.length ? ruoli : [{ ruolo: 'manovale', mestiere: 'qualunque', quanti: 3 }],
    portati: counts(r.portati),
    lavorato: Math.max(0, Math.min(1e7, num(r.lavorato))),
    squadra,
    inizio: Math.floor(num(r.inizio)),
    ultimo: Math.floor(num(r.ultimo, num(r.inizio))),
    nato_da: str(r.nato_da, 60) ?? 'regola',
  } as Venture;
  if (r.fine !== undefined) v.fine = Math.floor(num(r.fine));
  if (r.scade !== undefined) v.scade = Math.floor(num(r.scade));
  return v;
}

export function readVentures(src: string | undefined): Venture[] {
  if (!src) return [];
  try {
    const parsed = JSON.parse(src);
    const list = Array.isArray(parsed?.imprese) ? parsed.imprese : [];
    const seen = new Set<string>();
    return list.flatMap((x: unknown) => {
      const v = readVenture(x);
      if (!v || seen.has(v.id)) return [];
      seen.add(v.id);
      return [v];
    });
  } catch {
    // A file that does not read is no venture: the world stands, the next save writes it again.
    return [];
  }
}

export function writeVentures(list: readonly Venture[]): string {
  return JSON.stringify({ imprese: list }, null, 1) + '\n';
}

export interface VentureProgress {
  /** The phase now (its index; `fasi.length` when all are done). */
  fase: number;
  /** The stage of the last phase done: what one sees (0 when none is). */
  stadio: number;
  /** What the phase now still needs brought. */
  manca: Record<string, number>;
  /** Seconds of work the phase now still needs. */
  daLavorare: number;
  finita: boolean;
}

/** Materials and work up to a phase, summed: what being past it means. */
function upTo(v: Venture, k: number): { materiali: Record<string, number>; lavoro: number } {
  const materiali: Record<string, number> = {};
  let lavoro = 0;
  for (let i = 0; i <= k && i < v.fasi.length; i++) {
    for (const [it, n] of Object.entries(v.fasi[i].materiali)) materiali[it] = (materiali[it] ?? 0) + n;
    lavoro += v.fasi[i].lavoro;
  }
  return { materiali, lavoro };
}

/** Where a venture is, from what was brought and worked: nothing else (the state of the work is the work itself). */
export function ventureProgress(v: Venture): VentureProgress {
  for (let k = 0; k < v.fasi.length; k++) {
    const need = upTo(v, k);
    const manca: Record<string, number> = {};
    for (const [it, n] of Object.entries(need.materiali)) if ((v.portati[it] ?? 0) < n) manca[it] = n - (v.portati[it] ?? 0);
    if (Object.keys(manca).length || v.lavorato < need.lavoro) {
      return { fase: k, stadio: k > 0 ? v.fasi[k - 1].stadio : 0, manca, daLavorare: Math.max(0, need.lavoro - v.lavorato), finita: false };
    }
  }
  return { fase: v.fasi.length, stadio: 1, manca: {}, daLavorare: 0, finita: true };
}

/** What may still be brought: what the phases still need in all (more is not taken). */
export function stillNeeded(v: Venture): Record<string, number> {
  const all = upTo(v, v.fasi.length - 1).materiali;
  const out: Record<string, number> = {};
  for (const [it, n] of Object.entries(all)) if ((v.portati[it] ?? 0) < n) out[it] = n - (v.portati[it] ?? 0);
  return out;
}

/** Work counts only as far as the materials let it: up to the end of the last phase whose materials are all there. */
export function workAllowed(v: Venture): number {
  let allowed = 0;
  for (let k = 0; k < v.fasi.length; k++) {
    const need = upTo(v, k);
    if (Object.entries(need.materiali).some(([it, n]) => (v.portati[it] ?? 0) < n)) break;
    allowed = need.lavoro;
  }
  return allowed;
}

/** Seconds of work added (never past what the materials allow, never backwards). The phases it closed, by index. */
export function addWork(v: Venture, seconds: number): number[] {
  if (!Number.isFinite(seconds) || seconds <= 0) return [];
  const before = ventureProgress(v).fase;
  v.lavorato = Math.max(v.lavorato, Math.min(v.lavorato + seconds, workAllowed(v)));
  const after = ventureProgress(v).fase;
  return Array.from({ length: after - before }, (_, i) => before + i);
}

/** Things brought (at most what is still needed). How many were taken; and the phases it closed (a phase with no work left). */
export function bring(v: Venture, item: string, n: number): { taken: number; closed: number[] } {
  const want = stillNeeded(v)[item] ?? 0;
  const taken = Math.max(0, Math.min(Math.floor(Number.isFinite(n) ? n : 0), want));
  if (!taken) return { taken: 0, closed: [] };
  const before = ventureProgress(v).fase;
  v.portati[item] = (v.portati[item] ?? 0) + taken;
  const after = ventureProgress(v).fase;
  return { taken, closed: Array.from({ length: after - before }, (_, i) => before + i) };
}

/**
 * The state one reads, derived: finished when every phase is done (or a harvest's season passed); stopped with nobody in the team;
 * waiting when the phase now lacks a material that neither the team nor the deposits have; else going on.
 */
export function ventureState(v: Venture, today: number, available: (item: string) => number): VentureState {
  const p = ventureProgress(v);
  if (p.finita || (v.scade !== undefined && today > v.scade)) return 'finita';
  if (!v.squadra.length) return 'ferma';
  const missing = Object.keys(p.manca);
  if (missing.length && missing.every((it) => available(it) <= 0)) return 'attesa';
  return 'in corso';
}

/** Someone who could work: their name, the program of their trade, the place they belong to (`cx,cy`). */
export interface VentureCandidate {
  nome: string;
  mestiere?: string;
  luogo?: string;
}

const placeXY = (k: string | undefined) => {
  const m = k ? /^(-?\d+),(-?\d+)$/.exec(k) : null;
  return m ? [Number(m[1]), Number(m[2])] : undefined;
};

/**
 * The team, without calls (section 3.3): who is no longer there leaves; the roles left are filled by trade, then by nearness (the
 * same place, then the nearest), then by a draw of the seed of the universe for the name, never by the clock. Who is in another
 * venture open is not free. At most `MAX_TEAM`. Returns who joined and who left.
 */
export function fillTeam(v: Venture, candidates: readonly VentureCandidate[], busy: ReadonlySet<string>, seed: number): { joined: VentureMember[]; left: string[] } {
  const alive = new Map(candidates.map((c) => [c.nome, c]));
  const left = v.squadra.filter((m) => !alive.has(m.nome)).map((m) => m.nome);
  v.squadra = v.squadra.filter((m) => alive.has(m.nome));
  const joined: VentureMember[] = [];
  const here = placeXY(v.luogo)!;
  const dist = (c: VentureCandidate) => {
    const p = placeXY(c.luogo);
    return p ? Math.max(Math.abs(p[0] - here[0]), Math.abs(p[1] - here[1])) : 99;
  };
  const taken = new Set(v.squadra.map((m) => m.nome));
  for (const role of v.ruoli) {
    let have = v.squadra.filter((m) => m.ruolo === role.ruolo).length;
    if (have >= role.quanti) continue;
    const free = candidates
      .filter((c) => !taken.has(c.nome) && !busy.has(c.nome) && dist(c) <= 2)
      .map((c) => ({ c, fit: role.mestiere === 'qualunque' || c.mestiere === role.mestiere ? 0 : 1, d: dist(c), h: hash32(seed, hashStr(c.nome), hashStr(v.id)) }))
      .sort((a, b) => a.fit - b.fit || a.d - b.d || a.h - b.h || (a.c.nome < b.c.nome ? -1 : 1));
    for (const { c } of free) {
      if (have >= role.quanti || v.squadra.length >= MAX_TEAM) break;
      const m = { nome: c.nome, ruolo: role.ruolo };
      v.squadra.push(m);
      joined.push(m);
      taken.add(c.nome);
      have++;
    }
  }
  return { joined, left };
}

/** What a member does next (the kernel says it to `costruisci`): bring a material they can get, work on the site, or harvest. */
export type VentureStep =
  | { fa: 'porta'; oggetto: string; x: number; y: number }
  | { fa: 'lavora'; x: number; y: number; posa: string }
  | ({ fa: 'raccogli'; x: number; y: number } & VentureTask);

/** Each member stands at their own spot around the site: the same spot for the same name. */
export function spotOf(v: Venture, nome: string): { x: number; y: number } {
  const i = Math.max(0, v.squadra.findIndex((m) => m.nome === nome));
  const a = (i / Math.max(1, v.squadra.length)) * Math.PI * 2 + (hashStr(v.id) % 628) / 100;
  const r = v.area ? Math.max(1.5, Math.min(3, (v.area.x1 - v.area.x0 + 2) / 2)) : 2;
  return { x: v.posto.x + Math.cos(a) * r, y: v.posto.y + Math.sin(a) * r };
}

/** The next step of a member: undefined when there is nothing they can do now (they go back to their trade). */
export function nextStep(v: Venture, nome: string, has: (item: string) => number): VentureStep | undefined {
  if (!v.squadra.some((m) => m.nome === nome)) return undefined;
  const p = ventureProgress(v);
  if (p.finita) return undefined;
  if (v.compito) return { fa: 'raccogli', x: v.posto.x, y: v.posto.y, ...v.compito };
  const missing = Object.keys(p.manca);
  if (missing.length) {
    const item = missing.find((it) => has(it) > 0);
    return item ? { fa: 'porta', oggetto: item, x: v.posto.x, y: v.posto.y } : undefined;
  }
  const at = spotOf(v, nome);
  return { fa: 'lavora', x: at.x, y: at.y, posa: 'lavora' };
}

/** The phases of a house rebuilt or built new: the materials of the seed's trades (logs, nails), the stages of T245e. */
export function housePhases(classe: string | undefined): VenturePhase[] {
  const k = classe === 'grande' ? 1 : 0.6;
  const n = (x: number) => Math.max(1, Math.round(x * k));
  return [
    { nome: 'platea', materiali: { 'item.ciocco': n(4) }, lavoro: n(200), stadio: 0.2 },
    { nome: 'muri', materiali: { 'item.ciocco': n(6), 'item.chiodi': n(4) }, lavoro: n(600), stadio: 0.7 },
    { nome: 'tetto', materiali: { 'item.ciocco': n(6) }, lavoro: n(450), stadio: 0.9 },
    { nome: 'finiture', materiali: { 'item.chiodi': n(2) }, lavoro: n(250), stadio: 1 },
  ];
}

export const HOUSE_ROLES: VentureRole[] = [
  { ruolo: 'capomastro', mestiere: 'fabbro', quanti: 1 },
  { ruolo: 'manovale', mestiere: 'qualunque', quanti: 2 },
];

export const HARVEST_ROLES: VentureRole[] = [
  { ruolo: 'mietitore', mestiere: 'contadino', quanti: 3 },
  { ruolo: 'manovale', mestiere: 'qualunque', quanti: 1 },
];

/** A new id, the same for the same origin: two kernels that see the same thing make the same venture. */
export function ventureId(origin: string): string {
  return `i-${(hashStr(origin) >>> 0).toString(36)}`;
}

/** The ventures open (not finished) of a place, or of all. */
export const openVentures = (list: readonly Venture[], luogo?: string) => list.filter((v) => v.stato !== 'finita' && (!luogo || v.luogo === luogo));

/**
 * The ventures to keep: all the open ones and, of the finished, those that stand as buildings (a new house is the venture that built
 * it) and the last others, up to `MAX_KEPT`.
 */
export function pruneVentures(list: readonly Venture[]): Venture[] {
  const done = list.filter((v) => v.stato === 'finita' && !v.area);
  const drop = new Set(done.slice(0, Math.max(0, done.length - MAX_KEPT)).map((v) => v.id));
  return list.filter((v) => !drop.has(v.id));
}

/** A line of the panel: what the phase now still needs, in words of the world (the names of the items from `name`). */
export function missingWords(v: Venture, name: (item: string) => string): string {
  const p = ventureProgress(v);
  if (p.finita) return 'niente: è finita';
  const m = Object.entries(p.manca).map(([it, n]) => `${n} × ${name(it)}`);
  // A day of the world is 600 seconds: an hour is 25.
  const w = p.daLavorare > 0 ? `${Math.ceil(p.daLavorare / 25)} ore di lavoro` : '';
  return [...m, w].filter(Boolean).join(', ') || 'niente';
}
