// The ventures (T245d, ADR-0147; docs/design/comportamento-npc.md, section 3): the work of many towards a result one sees, days or
// months long. One file of the world, `world/ventures.json`, written only by the kernel (rule 8b: a wanderer acts in the world, never in
// the file), never sent to a client (it is in no list of `src/session/files.ts`), back with `R` as everything of the world.
// The progress is derived: the phase now is the first whose materials are not all brought or whose work is not done, so there is no
// counter to keep true. Pure: the kernel, the tests and the panel read it.

import { internalFields, internalName, internalVenture } from './internalNames';
import { hash32, hashStr } from './rng';

export const VENTURES_FILE = 'world/ventures.json';
export const VENTURE_TYPES = ['construction', 'harvest', 'feast', 'research', 'reclamation', 'journey', 'election'] as const;
export type VentureType = (typeof VENTURE_TYPES)[number];
export type VentureState = 'active' | 'waiting' | 'stopped' | 'finished';
/** The trade of a role that takes anyone (T307b: internal, `qualunque` before). */
export const ANY_TRADE = 'any';

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
  name: string;
  /** What this phase needs brought (item id → how many). */
  materials: Record<string, number>;
  /** Seconds of work of one person. */
  work: number;
  /** The stage of the building once this phase is done (0..1, T245e). */
  stage: number;
}

export interface VentureRole {
  role: string;
  /** The program of a trade the role wants (`farmer`), or `any`. */
  job: string;
  count: number;
}

export interface VentureMember {
  name: string;
  role: string;
}

/** What a member does at the site of a harvest (a `gather` of a trade): the tile, what it gives, what it leaves. */
export interface VentureTask {
  tile: string;
  item: string;
  drop: string;
  duration: number;
  pose?: string;
}

export interface Venture {
  id: string;
  title: string;
  type: VentureType;
  state: VentureState;
  /** The place (`cx,cy`) and where the work is in it (the centre of the lot, in tiles). */
  chunk: string;
  spot: { x: number; y: number };
  /** A rebuilding: the lot of the place it stands on and the origin of its structure. */
  lot?: number;
  origin?: string;
  /** A new building: its box in the cells of the place, inclusive. */
  area?: { x0: number; y0: number; x1: number; y1: number };
  model?: string;
  concept?: string;
  class?: string;
  size?: string;
  seed?: number;
  yaw?: number;
  phases: VenturePhase[];
  roles: VentureRole[];
  brought: Record<string, number>;
  worked: number;
  team: VentureMember[];
  /** The day it began, the last day someone worked, the day it ended; the day after which it is over anyway (a harvest). */
  start: number;
  last: number;
  end?: number;
  expires?: number;
  task?: VentureTask;
  /** Where it came from: `regola:ricostruzione`, `regola:casa`, `regola:raccolto` (and, with T245g, `trama:<id>`). */
  born_from: string;
  card?: Record<string, unknown>;
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
  // Values of the contract 0.2 (T307b), then fields of 0.3 (`luogo`, `squadra`, T308a): the migration ports the file, this a stray one.
  const r = internalFields('venture', internalVenture(raw as Record<string, unknown>));
  const id = str(r.id, 40);
  const luogo = str(r.chunk, 24);
  const rawType = typeof r.type === 'string' ? internalName('imprese', r.type) : r.type;
  const tipo = VENTURE_TYPES.includes(rawType as VentureType) ? (rawType as VentureType) : undefined;
  const posto = r.spot as { x?: unknown; y?: unknown } | undefined;
  if (!id || !luogo || !/^-?\d+,-?\d+$/.test(luogo) || !tipo || !posto || !Number.isFinite(posto.x) || !Number.isFinite(posto.y)) return undefined;
  const fasi = (Array.isArray(r.phases) ? r.phases : []).slice(0, 8).flatMap((f): VenturePhase[] => {
    const o = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>;
    const nome = str(o.name, 40);
    return nome ? [{ name: nome, materials: counts(o.materials), work: Math.max(0, Math.min(1e6, num(o.work))), stage: Math.max(0, Math.min(1, num(o.stage, 1))) }] : [];
  });
  if (!fasi.length) return undefined;
  const ruoli = (Array.isArray(r.roles) ? r.roles : []).slice(0, MAX_TEAM).flatMap((x): VentureRole[] => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const ruolo = str(o.role, 30);
    const mestiere = str(o.job, 40);
    return ruolo ? [{ role: ruolo, job: mestiere ? internalName('mestieri', mestiere) : ANY_TRADE, count: Math.max(1, Math.min(MAX_TEAM, Math.floor(num(o.count, 1)))) }] : [];
  });
  const squadra = (Array.isArray(r.team) ? r.team : []).slice(0, MAX_TEAM).flatMap((x): VentureMember[] => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const nome = str(o.name, 60);
    return nome ? [{ name: nome, role: str(o.role, 30) ?? 'manovale' }] : [];
  });
  const rawState = typeof r.state === 'string' ? internalName('imprese', r.state) : r.state;
  const stato = (['active', 'waiting', 'stopped', 'finished'] as const).find((s) => s === rawState) ?? 'active';
  const v: Venture = {
    ...(r as object),
    id,
    title: str(r.title, 80) ?? 'Un lavoro di molti',
    type: tipo,
    state: stato,
    chunk: luogo,
    spot: { x: Number(posto.x), y: Number(posto.y) },
    phases: fasi,
    roles: ruoli.length ? ruoli : [{ role: 'manovale', job: ANY_TRADE, count: 3 }],
    brought: counts(r.brought),
    worked: Math.max(0, Math.min(1e7, num(r.worked))),
    team: squadra,
    start: Math.floor(num(r.start)),
    last: Math.floor(num(r.last, num(r.start))),
    born_from: str(r.born_from, 60) ?? 'regola',
  } as Venture;
  if (r.end !== undefined) v.end = Math.floor(num(r.end));
  if (r.expires !== undefined) v.expires = Math.floor(num(r.expires));
  return v;
}

export function readVentures(src: string | undefined): Venture[] {
  if (!src) return [];
  try {
    const parsed = JSON.parse(src);
    const list = Array.isArray(parsed?.ventures) ? parsed.ventures : Array.isArray(parsed?.imprese) ? parsed.imprese : [];
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
  return JSON.stringify({ ventures: list }, null, 1) + '\n';
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
  for (let i = 0; i <= k && i < v.phases.length; i++) {
    for (const [it, n] of Object.entries(v.phases[i].materials)) materiali[it] = (materiali[it] ?? 0) + n;
    lavoro += v.phases[i].work;
  }
  return { materiali, lavoro };
}

/** Where a venture is, from what was brought and worked: nothing else (the state of the work is the work itself). */
export function ventureProgress(v: Venture): VentureProgress {
  for (let k = 0; k < v.phases.length; k++) {
    const need = upTo(v, k);
    const manca: Record<string, number> = {};
    for (const [it, n] of Object.entries(need.materiali)) if ((v.brought[it] ?? 0) < n) manca[it] = n - (v.brought[it] ?? 0);
    if (Object.keys(manca).length || v.worked < need.lavoro) {
      return { fase: k, stadio: k > 0 ? v.phases[k - 1].stage : 0, manca, daLavorare: Math.max(0, need.lavoro - v.worked), finita: false };
    }
  }
  return { fase: v.phases.length, stadio: 1, manca: {}, daLavorare: 0, finita: true };
}

/** What may still be brought: what the phases still need in all (more is not taken). */
export function stillNeeded(v: Venture): Record<string, number> {
  const all = upTo(v, v.phases.length - 1).materiali;
  const out: Record<string, number> = {};
  for (const [it, n] of Object.entries(all)) if ((v.brought[it] ?? 0) < n) out[it] = n - (v.brought[it] ?? 0);
  return out;
}

/** Work counts only as far as the materials let it: up to the end of the last phase whose materials are all there. */
export function workAllowed(v: Venture): number {
  let allowed = 0;
  for (let k = 0; k < v.phases.length; k++) {
    const need = upTo(v, k);
    if (Object.entries(need.materiali).some(([it, n]) => (v.brought[it] ?? 0) < n)) break;
    allowed = need.lavoro;
  }
  return allowed;
}

/** Seconds of work added (never past what the materials allow, never backwards). The phases it closed, by index. */
export function addWork(v: Venture, seconds: number): number[] {
  if (!Number.isFinite(seconds) || seconds <= 0) return [];
  const before = ventureProgress(v).fase;
  v.worked = Math.max(v.worked, Math.min(v.worked + seconds, workAllowed(v)));
  const after = ventureProgress(v).fase;
  return Array.from({ length: after - before }, (_, i) => before + i);
}

/** Things brought (at most what is still needed). How many were taken; and the phases it closed (a phase with no work left). */
export function bring(v: Venture, item: string, n: number): { taken: number; closed: number[] } {
  const want = stillNeeded(v)[item] ?? 0;
  const taken = Math.max(0, Math.min(Math.floor(Number.isFinite(n) ? n : 0), want));
  if (!taken) return { taken: 0, closed: [] };
  const before = ventureProgress(v).fase;
  v.brought[item] = (v.brought[item] ?? 0) + taken;
  const after = ventureProgress(v).fase;
  return { taken, closed: Array.from({ length: after - before }, (_, i) => before + i) };
}

/**
 * The state one reads, derived: finished when every phase is done (or a harvest's season passed); stopped with nobody in the team;
 * waiting when the phase now lacks a material that neither the team nor the deposits have; else going on.
 */
export function ventureState(v: Venture, today: number, available: (item: string) => number): VentureState {
  const p = ventureProgress(v);
  if (p.finita || (v.expires !== undefined && today > v.expires)) return 'finished';
  if (!v.team.length) return 'stopped';
  const missing = Object.keys(p.manca);
  if (missing.length && missing.every((it) => available(it) <= 0)) return 'waiting';
  return 'active';
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
  const left = v.team.filter((m) => !alive.has(m.name)).map((m) => m.name);
  v.team = v.team.filter((m) => alive.has(m.name));
  const joined: VentureMember[] = [];
  const here = placeXY(v.chunk)!;
  const dist = (c: VentureCandidate) => {
    const p = placeXY(c.luogo);
    return p ? Math.max(Math.abs(p[0] - here[0]), Math.abs(p[1] - here[1])) : 99;
  };
  const taken = new Set(v.team.map((m) => m.name));
  for (const role of v.roles) {
    let have = v.team.filter((m) => m.role === role.role).length;
    if (have >= role.count) continue;
    const free = candidates
      .filter((c) => !taken.has(c.nome) && !busy.has(c.nome) && dist(c) <= 2)
      .map((c) => ({ c, fit: role.job === ANY_TRADE || c.mestiere === role.job ? 0 : 1, d: dist(c), h: hash32(seed, hashStr(c.nome), hashStr(v.id)) }))
      .sort((a, b) => a.fit - b.fit || a.d - b.d || a.h - b.h || (a.c.nome < b.c.nome ? -1 : 1));
    for (const { c } of free) {
      if (have >= role.count || v.team.length >= MAX_TEAM) break;
      const m = { name: c.nome, role: role.role };
      v.team.push(m);
      joined.push(m);
      taken.add(c.nome);
      have++;
    }
  }
  return { joined, left };
}

/** What a member does next (the kernel says it to `build`): bring a material they can get, work on the site, or harvest. */
export type VentureStep =
  | { does: 'carry'; item: string; x: number; y: number }
  | { does: 'work'; x: number; y: number; pose: string }
  | ({ does: 'gather'; x: number; y: number } & VentureTask);

/** Each member stands at their own spot around the site: the same spot for the same name. */
export function spotOf(v: Venture, nome: string): { x: number; y: number } {
  const i = Math.max(0, v.team.findIndex((m) => m.name === nome));
  const a = (i / Math.max(1, v.team.length)) * Math.PI * 2 + (hashStr(v.id) % 628) / 100;
  const r = v.area ? Math.max(1.5, Math.min(3, (v.area.x1 - v.area.x0 + 2) / 2)) : 2;
  return { x: v.spot.x + Math.cos(a) * r, y: v.spot.y + Math.sin(a) * r };
}

/** The next step of a member: undefined when there is nothing they can do now (they go back to their trade). */
export function nextStep(v: Venture, nome: string, has: (item: string) => number): VentureStep | undefined {
  if (!v.team.some((m) => m.name === nome)) return undefined;
  const p = ventureProgress(v);
  if (p.finita) return undefined;
  if (v.task) return { does: 'gather', x: v.spot.x, y: v.spot.y, ...v.task };
  const missing = Object.keys(p.manca);
  if (missing.length) {
    const item = missing.find((it) => has(it) > 0);
    return item ? { does: 'carry', item: item, x: v.spot.x, y: v.spot.y } : undefined;
  }
  const at = spotOf(v, nome);
  return { does: 'work', x: at.x, y: at.y, pose: 'work' };
}

/** The phases of a house rebuilt or built new: the materials of the seed's trades (logs, nails), the stages of T245e. */
export function housePhases(classe: string | undefined): VenturePhase[] {
  const k = classe === 'structure' ? 1 : 0.6;
  const n = (x: number) => Math.max(1, Math.round(x * k));
  return [
    { name: 'platea', materials: { 'item.ciocco': n(4) }, work: n(200), stage: 0.2 },
    { name: 'muri', materials: { 'item.ciocco': n(6), 'item.chiodi': n(4) }, work: n(600), stage: 0.7 },
    { name: 'tetto', materials: { 'item.ciocco': n(6) }, work: n(450), stage: 0.9 },
    { name: 'finiture', materials: { 'item.chiodi': n(2) }, work: n(250), stage: 1 },
  ];
}

export const HOUSE_ROLES: VentureRole[] = [
  { role: 'capomastro', job: 'smith', count: 1 },
  { role: 'manovale', job: ANY_TRADE, count: 2 },
];

export const HARVEST_ROLES: VentureRole[] = [
  { role: 'mietitore', job: 'farmer', count: 3 },
  { role: 'manovale', job: ANY_TRADE, count: 1 },
];

/** A new id, the same for the same origin: two kernels that see the same thing make the same venture. */
export function ventureId(origin: string): string {
  return `i-${(hashStr(origin) >>> 0).toString(36)}`;
}

/** The ventures open (not finished) of a place, or of all. */
export const openVentures = (list: readonly Venture[], luogo?: string) => list.filter((v) => v.state !== 'finished' && (!luogo || v.chunk === luogo));

/**
 * The ventures to keep: all the open ones and, of the finished, those that stand as buildings (a new house is the venture that built
 * it) and the last others, up to `MAX_KEPT`.
 */
export function pruneVentures(list: readonly Venture[]): Venture[] {
  const done = list.filter((v) => v.state === 'finished' && !v.area);
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
