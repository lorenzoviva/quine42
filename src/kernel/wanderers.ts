// The wanderers (T34, ADR-0054): every wanderer has a stable id — `io` when playing alone, the account's
// id later (T44) — and a state of their own in `world/giocatori/<id>.json` (what they carry, needs, states,
// slots, the rune sentence). People's bonds and memories, children and quests say which wanderer they are
// about with that id, so two wanderers in the same world are remembered apart. Pure functions: the kernel
// keeps the entities.

import type { FileMap } from './types';
import { reservedName } from './paths';
import { hashStr } from './rng';
import { freshName, guessGender, similarNames } from './society';

/** The wanderer of a game alone (and of every universe before T34). */
/**
 * Systems that move one wanderer (T38): they run once for each wanderer the kernel moves itself, as that
 * wanderer, and see no other wanderer. Those a session's client moves (`setRemote`) they skip. The only ones a
 * thin client runs too (T39).
 */
export const PER_WANDERER = new Set(['core.movement', 'core.carpet']);

export const SOLO = 'io';
/** The name people use for a wanderer they know nothing more of. */
export const WANDERER_NAME = 'Viandante';

export interface Wanderer {
  id: string;
  nome: string;
  anonimo?: boolean;
}

/** A colour from hue, saturation and lightness (0-1). */
function hsl(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const c = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[c(0), c(8), c(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Hue, saturation and lightness (0-1) of a `#rrggbb` colour. */
function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

/**
 * The colour of a wanderer's cloak (T39, the `tinta` of the program `viandante`) when their profile does not choose one
 * (T44a): from their id. `io` keeps the cloak of the program. Saturated and not dark, so it reads on the grass.
 */
export function wandererColor(id: string): string | undefined {
  if (id === SOLO) return undefined;
  return hsl((hashStr(`mantello:${id}`) % 360) / 360, 0.55, 0.5);
}

/**
 * Who a wanderer is to the others (T44a, ADR-0074): the name the world calls them by, the seed of the program
 * `viandante` and the colour of its cloak, a few lines they say of themselves. It is the player's, not the universe's:
 * it goes in their own file, and the account of T44b will carry it.
 */
export interface Profile {
  nome: string;
  /** The seed of the program `viandante` (1 … the seeds of its class). */
  seme?: number;
  /** The cloak's colour, `#rrggbb`. */
  tinta?: string;
  presentazione?: string;
}

export const PROFILE_LIMITS = { nome: [2, 24], presentazione: 280, righe: 4, luce: [0.25, 0.75], saturazione: 0.2 } as const;

/** A profile repaired, and what was repaired in it (in words, for the player). */
export interface ProfileRepair {
  profilo: Profile;
  riparato: string[];
}

/** Letters, digits, spaces, apostrophes and hyphens: nothing else is a name. */
function cleanName(raw: unknown): string {
  const s = String(raw ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}' -]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  let out = s.charAt(0).toUpperCase() + s.slice(1);
  const max = PROFILE_LIMITS.nome[1];
  if (out.length > max) {
    const cut = out.slice(0, max + 1).lastIndexOf(' ');
    out = (cut >= PROFILE_LIMITS.nome[0] ? out.slice(0, cut) : out.slice(0, max)).trim();
  }
  return out;
}

/**
 * A profile from a client, made possible (T44a): a short name, unlike every individual of the world and every other
 * wanderer (`taken`; otherwise a fresh one, stable for the id), a seed among those of the class, a cloak neither too
 * dark nor too pale nor grey, a presentation of a few lines. What is not there stays out; the name defaults to
 * «Viandante», the name of whoever is not known.
 */
export function repairProfile(raw: unknown, id: string, taken: string[], seeds: number): ProfileRepair {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const riparato: string[] = [];
  let nome = cleanName(r.nome);
  if (r.nome !== undefined && String(r.nome).trim() && nome !== String(r.nome).trim()) riparato.push('nome accorciato o ripulito');
  if (nome && nome.length < PROFILE_LIMITS.nome[0]) {
    riparato.push('nome troppo corto');
    nome = '';
  }
  const others = taken.filter((t) => t && t !== WANDERER_NAME);
  if (nome && nome !== WANDERER_NAME && others.some((t) => similarNames(t, nome))) {
    const fresh = freshName('persona', guessGender({ nome, mestiere: '', famiglia: [] }), others, `viandante:${id}`);
    riparato.push(`«${nome}» somiglia al nome di qualcun altro: diventa «${fresh}»`);
    nome = fresh;
  }
  const out: Profile = { nome: nome || WANDERER_NAME };
  if (r.seme !== undefined) {
    const n = Math.max(1, Math.floor(seeds));
    const v = Number(r.seme);
    if (Number.isInteger(v) && v >= 1 && v <= n) out.seme = v;
    else if (Number.isFinite(v)) {
      out.seme = 1 + ((((Math.round(v) - 1) % n) + n) % n);
      riparato.push(`seme fuori misura: ${out.seme}`);
    } else riparato.push('seme non valido');
  }
  if (r.tinta !== undefined) {
    const t = String(r.tinta).trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(t)) {
      const [h, s, l] = toHsl(t);
      const [lo, hi] = PROFILE_LIMITS.luce;
      const ok = s >= PROFILE_LIMITS.saturazione && l >= lo && l <= hi;
      out.tinta = ok ? t : hsl(h, Math.max(PROFILE_LIMITS.saturazione, s), Math.min(hi, Math.max(lo, l)));
      if (!ok) riparato.push('colore del mantello troppo scuro, chiaro o spento: aggiustato');
    } else riparato.push('colore non valido');
  }
  if (r.presentazione !== undefined) {
    const lines = String(r.presentazione)
      .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ')
      .split('\n')
      .map((x) => x.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    let text = lines.slice(0, PROFILE_LIMITS.righe).join('\n');
    if (text.length > PROFILE_LIMITS.presentazione) text = text.slice(0, PROFILE_LIMITS.presentazione).trim();
    if (lines.length > PROFILE_LIMITS.righe || text !== lines.join('\n')) riparato.push('presentazione accorciata');
    if (text) out.presentazione = text;
  }
  return { profilo: out, riparato };
}

/** What a wanderer carries and is, between sessions. */
export interface WandererState {
  nome?: string;
  /** Who they are to the others (T44a). */
  profilo?: Profile;
  pos?: { x: number; y: number };
  inventory?: any;
  needs?: Record<string, number>;
  hand?: { tokens: string[]; sel: number };
  stati?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  trasceso?: boolean;
  /** Credit balance in USD (T45a), written only by the server. */
  /** Whether the wanderer is anonymous (T44b, T45a): has no credits and plays with local models. */
  anonimo?: boolean;
}

export const PLAYERS_DIR = 'world/giocatori/';

/** An id is a short slug (it names a file). */
export function validWandererId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) && !reservedName(id);
}

export function playerFile(id: string): string {
  return `${PLAYERS_DIR}${id}.json`;
}

function parse(src: string | undefined): any {
  try {
    return JSON.parse(src ?? 'null');
  } catch {
    return null;
  }
}

/** A wanderer's saved state: their own file, or (for `io`) the wanderer of the old `world/stato.json`. */
export function readWandererState(files: FileMap, id: string): WandererState | undefined {
  const own = parse(files[playerFile(id)]);
  const found = own && typeof own === 'object' ? own : id === SOLO ? parse(files['world/stato.json'])?.viandante : undefined;
  if (!found || typeof found !== 'object') return undefined;
  // A balance in the files is what an old commit left: the balances are in the ledger (ADR-0104), and what is saved next no longer has it.
  const { crediti: _old, ...state } = found;
  return state;
}

/** The wanderers the universe knows: one per player file, and `io` if an old state speaks of them. */
export function wanderersIn(files: FileMap): Wanderer[] {
  const out = new Map<string, Wanderer>();
  if (parse(files['world/stato.json'])?.viandante) out.set(SOLO, { id: SOLO, nome: WANDERER_NAME });
  for (const p of Object.keys(files).sort()) {
    if (!p.startsWith(PLAYERS_DIR) || !p.endsWith('.json')) continue;
    const id = p.slice(PLAYERS_DIR.length, -5);
    if (!validWandererId(id)) continue;
    const nome = parse(files[p])?.nome;
    out.set(id, { id, nome: typeof nome === 'string' && nome.trim() ? nome.trim().slice(0, 40) : WANDERER_NAME });
  }
  return [...out.values()];
}

/** The wanderer a relation or a memory is about: its id, or `io` for the old ones that name «Viandante». */
export function wandererOf(x: { nome?: string; con?: string; viandante?: string }): string | undefined {
  if (validWandererId(x.viandante)) return x.viandante;
  const name = (x.nome ?? x.con ?? '').trim().toLowerCase();
  return name === 'viandante' ? SOLO : undefined;
}

/** What an individual is to a wanderer, if anything. */
export function bondWith(p: { famiglia?: Array<{ nome: string; legame: string; viandante?: string }>; legameViandante?: string }, id: string): string | undefined {
  const r = (p.famiglia ?? []).find((f) => wandererOf(f) === id);
  return r?.legame ?? (id === SOLO ? p.legameViandante : undefined);
}

/** The memories an individual brings to a talk with a wanderer: theirs together and those of the others in the world, not of other wanderers. */
export function memoriesFor<T extends { con?: string; viandante?: string }>(list: T[] | undefined, id: string): T[] {
  return (list ?? []).filter((m) => {
    const w = wandererOf(m);
    return !w || w === id;
  });
}
