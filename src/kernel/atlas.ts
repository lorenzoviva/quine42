// The atlas: the geography of a universe (world/atlas.json). Regions — a desert, a castle, the elves'
// wood — have a centre (in chunks, carpet space), a radius and an environment; the places inside a
// region use its environment and carry its name. The Cartographer draws it at genesis and places new
// environments on it when asked; everyone can say in which direction and how far things are.

import type { FileMap } from './types';
import { Rng } from './rng';
import { internalFields, internalName, internalValues, italianName } from './internalNames';
import { cleanText } from './cleantext';
import { metaBreak } from './fourthwall';
import { NATURE_ACCEPTS } from './nature';
import { readRoughness, ROUGHNESS, ROUGHNESS_NAME, type Roughness } from './network';

/**
 * What a region the master declared does to the new places inside it (T375, ADR-0188 §5, D54.6): `filler` repeats an environment the world
 * already has, laid out by the kernel from its program with the place's seed, without a call to the Council; `held` keeps them drafts until
 * the master lets the region go or changes it. Absent: the places are planned by the Cartographer, with the region's environment.
 */
export type RegionKind = 'filler' | 'held';

export const REGION_KINDS: readonly RegionKind[] = ['filler', 'held'];

export interface Region {
  id: string;
  name: string;
  description: string;
  /** Layout (environment) id. */
  environment: string;
  center: [number, number];
  /** In chunks (Chebyshev distance). */
  radius: number;
  /** A region the master declared (T375): it wins over the Cartographer's where both cover a place. */
  master?: true;
  /** Only on a region of the master: what it does to the new places inside it. */
  kind?: RegionKind;
  /**
   * Only on a region of the master (T447, ADR-0226): the gravity of its places, within what the kernel accepts of the nature's (0.2-2); absent,
   * the world's. An asteroid, a moon. It changes how a body jumps and walks there, never what is reachable (`leapOf`).
   */
  gravity?: number;
  /**
   * Only on a region of the master (T446, ADR-0238): whether its places have air to breathe (false: a moon of bare rock; true: a dome of air
   * over an asteroid). Absent, what the terrain, the environment and the body of the void say. Read only where the world counts the breath.
   */
  air?: boolean;
  /**
   * Only on a region of the master (T474, ADR-0250): how rough its new places are for the rule 10 of the steps, whatever their relief
   * measures: `flat` and `hilly` keep every part of them joined to their paths, `mountainous` and `rugged` keep the enclaves their relief
   * has (a share of a place, their pass within a means of the world). Absent, the relief's own. Written into a place's plan when it is planned.
   */
  roughness?: Roughness;
  /**
   * The island of an archipelago this region names (T441, ADR-0229): the Cartographer's, written when the first place on it is planned. Its
   * centre and radius say where the island is on the atlas; its shape is the kernel's (`islands.ts`) and never changes. Not a region of
   * the places (`regionAt` passes over it): its environment was the first place's, and the island's places choose their own.
   */
  island?: string;
}

export interface Atlas {
  regions: Region[];
}

export const ATLAS_FILE = 'world/atlas.json';

export function readAtlas(files: FileMap): Atlas {
  try {
    // An atlas of the contract 0.3 (`regioni`, `centro`) reads internal (T308a): the migration ports the file, this a stray one.
    const a = internalFields('atlas', JSON.parse(files[ATLAS_FILE] ?? '{}'));
    return { regions: Array.isArray(a.regions) ? a.regions : [] };
  } catch {
    return { regions: [] };
  }
}

export function writeAtlas(a: Atlas): string {
  return JSON.stringify(a, null, 2) + '\n';
}

/**
 * The region a chunk belongs to: the nearest centre among those whose radius covers it, a region of the master before the Cartographer's
 * (T375: «only sea here» holds over the region that was there; an island in the master's sea is the master's region nearest to it).
 */
export function regionAt(atlas: Atlas, cx: number, cy: number): Region | undefined {
  let best: Region | undefined;
  let bd = Infinity;
  for (const r of atlas.regions) {
    if (!r || !Array.isArray(r.center) || r.island !== undefined) continue;
    const d = Math.max(Math.abs(cx - r.center[0]), Math.abs(cy - r.center[1]));
    if (d > r.radius) continue;
    const rank = r.master ? d - 1e6 : d;
    if (rank < bd) [best, bd] = [r, rank];
  }
  return best;
}

/** The region of the atlas that names an island (T441), if the Cartographer has named it. */
export function islandRegion(atlas: Atlas, island: string): Region | undefined {
  return atlas.regions.find((r) => r && r.island === island);
}

/** What a region does to the new places inside it (T375): only a region of the master has a kind, and only a known one. */
export function regionKind(r: Region | undefined): RegionKind | undefined {
  return r?.master && REGION_KINDS.includes(r.kind as RegionKind) ? r.kind : undefined;
}

/**
 * The gravity a region gives its places (T447): only a region of the master that is the world's (not held: its places are the master's plan,
 * not the world's yet, and the players' clients do not see it), and only within what the kernel accepts. Undefined: the world's.
 */
export function regionGravity(r: Region | undefined): number | undefined {
  if (!r?.master || r.kind === 'held') return undefined;
  const g = r.gravity;
  const [lo, hi] = NATURE_ACCEPTS.gravity;
  return typeof g === 'number' && Number.isFinite(g) && g >= lo && g <= hi ? g : undefined;
}

/**
 * Whether a region gives its places air (T446): only a region of the master that is the world's (not held), and only true or false. Undefined:
 * the region does not say, the terrain, the environment and the body do.
 */
export function regionAir(r: Region | undefined): boolean | undefined {
  if (!r?.master || r.kind === 'held') return undefined;
  return typeof r.air === 'boolean' ? r.air : undefined;
}

/**
 * The roughness a region gives its new places (T474): only a region of the master that is the world's (not held), and only one of the
 * four. Undefined: the relief of each place says it.
 */
export function regionRoughness(r: Region | undefined): Roughness | undefined {
  if (!r?.master || r.kind === 'held') return undefined;
  return readRoughness(r.roughness);
}

/** The kinds in the words of the master's tools. */
export const REGION_KIND_NAME: Record<RegionKind | 'plan', string> = { plan: 'ambiente', filler: 'riempitivo', held: 'trattenuta' };
/** What each kind means, for the master. */
export const REGION_KIND_NOTE: Record<RegionKind | 'plan', string> = {
  plan: 'il Cartografo pianifica i luoghi nuovi con questo ambiente',
  filler: 'i luoghi nuovi ripetono questo ambiente senza chiamate al Concilio: niente cose, persone né rune',
  held: 'i luoghi nuovi restano abbozzati finché non la liberi o la cambi',
};

/** The caps of a region of the master (T375): its radius in places, how far from the first place its centre may be, how many regions, the texts. */
export const MASTER_REGION_LIMITS = { radius: 8, reach: 200, regions: 32, name: 40, description: 200 } as const;

/** What the master's tools send to declare a region (T375): checked by `masterRegion`, never taken as it came. */
export interface RegionRequest {
  /** The id of a region of the master to change; absent, a new one. */
  id?: string;
  name: string;
  description?: string;
  center: [number, number];
  radius: number;
  /** `plan` (or absent): the Cartographer plans with the environment. */
  kind?: RegionKind | 'plan';
  environment?: string;
  /** The gravity of its places (T447): a number within the kernel's range; absent, none of its own. */
  gravity?: number;
  /** Whether its places have air (T446): true or false; absent, none of its own. */
  air?: boolean;
  /** How rough its new places are (T474): one of `ROUGHNESS`; absent, their relief's. */
  roughness?: Roughness;
}

const has = (o: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * A region the master declares (T375, ADR-0188 §5): the texts of a player (`cleanText`) inside the world (`metaBreak`, the local filter: the
 * master's words never go to Jev), a centre and a radius within the caps, an environment the world has (none needed for `held`, which keeps the
 * places drafts), not over the first place (nobody's region, as for the Cartographer). The atlas with it in, or every reason why not. An `id`
 * of a region of the master changes it; a region of the Cartographer is never changed (the master declares one of their own over it). Pure.
 */
export function masterRegion(atlas: Atlas, raw: unknown, environments: Record<string, unknown>, words: string[] = []): { atlas: Atlas; region: Region } | { errors: string[] } {
  const L = MASTER_REGION_LIMITS;
  if (!raw || typeof raw !== 'object') return { errors: ['la regione: serve un nome, un centro e un raggio'] };
  const r = raw as Record<string, unknown>;
  const errors: string[] = [];
  const name = cleanText(r.name, L.name, 'il nome');
  if ('error' in name) errors.push(name.error);
  const description = r.description === undefined || r.description === '' ? { text: '' } : cleanText(r.description, L.description, 'la descrizione');
  if ('error' in description) errors.push(description.error);
  for (const t of ['text' in name ? name.text : '', 'text' in description ? description.text : '']) {
    const hit = t ? metaBreak(t, words) : undefined;
    if (hit) errors.push(`«${hit}» non è una parola del mondo: il nome e la descrizione della regione li leggono anche le persone`);
  }
  const center = Array.isArray(r.center) && r.center.length === 2 && r.center.every((n) => Number.isInteger(n) && Math.abs(n as number) <= L.reach) ? [r.center[0] as number, r.center[1] as number] : undefined;
  if (!center) errors.push(`il centro: due numeri interi, al più ${L.reach} luoghi dal primo`);
  const radius = Number.isInteger(r.radius) && (r.radius as number) >= 0 && (r.radius as number) <= L.radius ? (r.radius as number) : undefined;
  if (radius === undefined) errors.push(`il raggio: un intero da 0 a ${L.radius} luoghi`);
  if (center && radius !== undefined && Math.max(Math.abs(center[0]), Math.abs(center[1])) <= radius) errors.push('il primo luogo non è di nessuna regione: sposta il centro o stringi il raggio');
  const kind = r.kind === undefined || r.kind === 'plan' ? undefined : REGION_KINDS.includes(r.kind as RegionKind) ? (r.kind as RegionKind) : null;
  if (kind === null) errors.push(`il tipo: ${Object.values(REGION_KIND_NAME).join(', ')}`);
  const environment = typeof r.environment === 'string' ? r.environment : '';
  if (kind !== 'held' && !has(environments, environment)) errors.push("l'ambiente: uno di quelli che il mondo ha già");
  if (kind === 'held' && environment && !has(environments, environment)) errors.push("l'ambiente: uno di quelli che il mondo ha già, o nessuno");
  const [glo, ghi] = NATURE_ACCEPTS.gravity;
  const gravity = r.gravity === undefined || r.gravity === null || r.gravity === '' ? undefined : typeof r.gravity === 'number' && Number.isFinite(r.gravity) && r.gravity >= glo && r.gravity <= ghi ? Math.round(r.gravity * 100) / 100 : null;
  if (gravity === null) errors.push(`la gravità: un numero da ${glo} a ${ghi} (1 è quella della terra), o nessuna`);
  else if (gravity !== undefined && kind === 'held') errors.push('la gravità: una regione trattenuta non è ancora del mondo, non ne ha una');
  const air = r.air === undefined || r.air === null || r.air === '' ? undefined : typeof r.air === 'boolean' ? r.air : null;
  if (air === null) errors.push('l’aria: c’è o non c’è (vero o falso), o quella dei suoi luoghi');
  else if (air !== undefined && kind === 'held') errors.push('l’aria: una regione trattenuta non è ancora del mondo, non ne ha una');
  const roughness = r.roughness === undefined || r.roughness === null || r.roughness === '' ? undefined : (readRoughness(r.roughness) ?? null);
  if (roughness === null) errors.push(`l’asprezza: ${ROUGHNESS.map((x) => ROUGHNESS_NAME[x]).join(', ')}, o quella del suo rilievo`);
  else if (roughness !== undefined && kind === 'held') errors.push('l’asprezza: una regione trattenuta non è ancora del mondo, non ne ha una');
  const regions = atlas.regions.slice();
  const id = r.id === undefined ? undefined : typeof r.id === 'string' ? r.id : null;
  const at = id ? regions.findIndex((x) => x.id === id) : -1;
  if (id === null || (id !== undefined && (at < 0 || !regions[at].master))) errors.push('la regione da cambiare: una regione del master che c’è');
  if (at < 0 && regions.filter((x) => x.master).length >= L.regions) errors.push(`al più ${L.regions} regioni del master: liberane una`);
  if (errors.length) return { errors };
  let fresh = at >= 0 ? regions[at].id : '';
  for (let n = 1; !fresh; n++) if (!regions.some((x) => x.id === `master-${n}`)) fresh = `master-${n}`;
  const region: Region = {
    id: fresh,
    name: (name as { text: string }).text,
    description: (description as { text: string }).text,
    environment,
    center: [center![0], center![1]],
    radius: radius!,
    master: true,
    ...(kind ? { kind } : {}),
    ...(gravity !== undefined && gravity !== null ? { gravity } : {}),
    ...(typeof air === 'boolean' ? { air } : {}),
    ...(roughness ? { roughness } : {}),
  };
  if (at >= 0) regions[at] = region;
  else regions.push(region);
  return { atlas: { regions }, region };
}

/** What declaring or letting go a region answers (T375): the region, or every reason why not. */
export type RegionAnswer = { ok: true; region: Region } | { ok: false; reasons: string[] };

/** The atlas without a region of the master (T375, «Libera»): the Cartographer's are never taken away. Undefined when there is none so. */
export function withoutMasterRegion(atlas: Atlas, id: unknown): { atlas: Atlas; region: Region } | undefined {
  const region = typeof id === 'string' ? atlas.regions.find((r) => r.id === id && r.master) : undefined;
  return region ? { atlas: { regions: atlas.regions.filter((r) => r !== region) }, region } : undefined;
}

// The directions as ids (T310b, `direzioni`): the Cartographer writes them, the world says them in its language (`directionWord`).
export const COMPASS = internalValues('direzioni').filter((d) => d !== 'here');
const DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

/** Compass direction from a to b (north is up: smaller y), as an id; `here` when they coincide. */
export function direction(dx: number, dy: number): string {
  if (!dx && !dy) return 'here';
  const a = Math.atan2(dy, dx);
  return DIRS[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}

/** A direction in the words of the world (today Italian: «nord-est»); the dictionaries of the other languages are T239's. */
export const directionWord = (id: string): string => italianName('direzioni', id);

/** The vector of a direction said as an id, or in the Italian of before T310b (`nord-est`); east when it is none. */
export function directionVector(dir: string): [number, number] {
  const i = COMPASS.indexOf(internalName('direzioni', dir.toLowerCase().replace(/\s+/g, '-')));
  if (i < 0) return [1, 0];
  const a = -Math.PI / 2 + (i * Math.PI) / 4;
  return [Math.round(Math.cos(a)), Math.round(Math.sin(a))];
}

/**
 * Where a new region goes: in that direction, at that distance from `from`, not overlapping places
 * already explored nor other regions (it slides further out until it fits).
 */
export function placeRegion(atlas: Atlas, from: [number, number], dir: string, dist: number, radius: number, explored: Set<string>): [number, number] {
  const [vx, vy] = directionVector(dir);
  for (let d = Math.max(2, dist); d < dist + 30; d++) {
    const c: [number, number] = [from[0] + vx * d, from[1] + vy * d];
    let free = true;
    for (let y = c[1] - radius; y <= c[1] + radius && free; y++) for (let x = c[0] - radius; x <= c[0] + radius && free; x++) if (explored.has(`${x},${y}`)) free = false;
    for (const r of atlas.regions) if (Math.max(Math.abs(r.center[0] - c[0]), Math.abs(r.center[1] - c[1])) <= r.radius + radius) free = false;
    if (Math.max(Math.abs(c[0]), Math.abs(c[1])) <= radius + 1) free = false;
    if (free) return c;
  }
  return [from[0] + vx * (dist + 30), from[1] + vy * (dist + 30)];
}

/**
 * A first geography when the Cartographer has not drawn one (offline, or a universe from before the
 * atlas): every environment that is not ordinary countryside gets a region somewhere around.
 */
export function defaultAtlas(layouts: Record<string, { name: string; description: string }>, explored: Set<string>, seed: number): Atlas {
  // The seed's environments by their ids (English since the contract 0.2; the Italian of a Council's environment of before stays).
  const ordinary = /^(village|woods|fields|ruins|inn|borgo|bosco|campi|rovine|locanda)$/;
  const ids = Object.keys(layouts).filter((id) => !ordinary.test(id));
  const rng = new Rng(seed ^ 0x51a7);
  const atlas: Atlas = { regions: [] };
  ids.forEach((id, i) => {
    const dir = COMPASS[(i * 3 + rng.int(8)) % 8];
    const dist = 3 + (i % 4) * 2 + rng.int(3);
    const radius = /desert|jungle|mountain|lake|sea|ocean|deserto|giungla|montagne|lago|mare|oceano/.test(id) ? 2 : 1;
    const centro = placeRegion(atlas, [0, 0], dir, dist, radius, explored);
    atlas.regions.push({ id, name: layouts[id].name, description: layouts[id].description, environment: id, center: centro, radius: radius });
  });
  return atlas;
}

/** What someone standing in chunk (cx, cy) knows about where things are. */
export function directionsFrom(atlas: Atlas, chunks: Array<{ name: string; cx: number; cy: number }>, cx: number, cy: number, max = 16): string[] {
  const out: Array<{ d: number; text: string }> = [];
  const seen = new Set<string>();
  for (const p of chunks) {
    const d = Math.max(Math.abs(p.cx - cx), Math.abs(p.cy - cy));
    if (!d || d > 6 || seen.has(p.name)) continue;
    seen.add(p.name);
    out.push({ d, text: `«${p.name}»: ${directionWord(direction(p.cx - cx, p.cy - cy))}, ${d === 1 ? 'appena oltre' : `a ${d} luoghi da qui`}` });
  }
  for (const r of atlas.regions) {
    const d = Math.max(Math.abs(r.center[0] - cx), Math.abs(r.center[1] - cy));
    if (seen.has(r.name)) continue;
    seen.add(r.name);
    out.push({ d: d + 0.5, text: d <= r.radius ? `qui siamo nella regione «${r.name}»` : `regione «${r.name}» (${r.description}): ${directionWord(direction(r.center[0] - cx, r.center[1] - cy))}, a circa ${d} luoghi` });
  }
  return out.sort((a, b) => a.d - b.d).slice(0, max).map((o) => o.text);
}
