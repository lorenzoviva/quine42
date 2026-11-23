// The vehicles of the Council (T487, ADR-0244): what looks like a vehicle behaves as one. A thing of the world whose name says a boat, a barge,
// a raft, a cart or a capsule promises a deck one stands on and a helm one steers by: without `vehicle` in its manifest the kernel would
// draw a boat that never moves, a lie as a wall one walks through (rule 10). Here, pure: the words that say a vehicle (the head of a name,
// in the languages of the world), what the kernel gives one when the Council does not say (`vehicleFor`), what the validator refuses of a
// forged module (`vehicleClaimErrors`), the repair of the universes made before (`repairVehicleClaims`) and where a vehicle comes into a
// place: where it floats or rolls with all of its hull, near a shore one boards from (`vehicleSpot`).

import { BOARD_REACH, DRAUGHTS, VEHICLE_LIMITS, VEHICLE_MEDIA, type Draught, type VehicleMedium } from './vehicle';
import type { FileMap, Manifest } from './types';

/** The origins of what the Council made (a forged module says one): the repair touches only these, never a module written by hand. */
export const COUNCIL_ORIGINS: ReadonlySet<string> = new Set(['genesi', 'agente', 'cartografo', 'combinazione']);

// --- The words ---------------------------------------------------------------------------------------------------------------------

// What may come before the noun of a name: articles and the adjectives that go before it (Italian and English, as `isStructure`).
const LEAD = String.raw`(?:(?:l['’]|un['’])\s*|(?:la|il|lo|una|un|uno|le|i|gli|the|an?|old|vecchi[oae]|antic[oaeh]i?|piccol[oaei]|grand[ei]|lung[oaeh]i?|nuov[oaei]|bell[aeo]|bel|robust[oaei]|modest[oaei]|small|big|great|little|large|long|new|sturdy)\s+)*`;

/**
 * The nouns that say a vehicle, by what it moves on, in Italian (the head of a name: «Chiatta a vapore della darsena», «Vecchio carro del
 * fieno»): what the kernel can make move. Not what runs on rails (a tram, a mine cart, a train: the kernel has no rails) nor what flies (an
 * airship): those stay things. The other languages are T239's.
 */
const IT_HEADS: Record<VehicleMedium, string> = {
  water: 'barca|barche|barchetta|barchette|barcone|barconi|barcaccia|chiatta|chiatte|chiattone|chiattoni|zattera|zattere|canoa|canoe|piroga|piroghe|kayak|gondola|gondole|battello|battelli|traghetto|traghetti|piroscafo|piroscafi|vaporetto|vaporetti|nave|navi|veliero|velieri|scialuppa|scialuppe|peschereccio|pescherecci|gozzo|gozzi|brigantino|brigantini|galeone|galeoni|caravella|caravelle|vascello|vascelli|goletta|golette|feluca|feluche|giunca|giunche|catamarano|catamarani|motoscafo|motoscafi|rimorchiatore|rimorchiatori|sandolo|sandoli|imbarcazione|imbarcazioni|natante|natanti|drakkar',
  land: 'carro|carri|carretto|carretti|carretta|carrette|carrozza|carrozze|calesse|calessi|diligenza|diligenze|biroccio|birocci|barroccio|barrocci|slitta|slitte|biga|bighe|cocchio|cocchi|landò|risciò',
  void: 'capsula|capsule|navetta|navette',
};

/** The same in English (a model may slip into it), anywhere in the first words of a name: «Steam barge», «Old fishing boat». */
const EN_WORDS: Record<VehicleMedium, string> = {
  water: 'boats?|barges?|rafts?|canoes?|kayaks?|gondolas?|ferry|ferries|steamboats?|steamers?|ships?|sailboats?|rowboats?|dinghy|dinghies|skiffs?|punts?|sloops?|schooners?|galleons?|brigs?|brigantines?|caravels?|longships?|catamarans?|tugboats?|lifeboats?|riverboats?|houseboats?|keelboats?',
  land: 'carts?|wagons?|waggons?|carriages?|stagecoach(?:es)?|buggy|buggies|chariots?|sleds?|sledges?|sleighs?|oxcarts?|handcarts?',
  void: 'capsules?|shuttles?',
};

/**
 * What a name says of what only looks like a vehicle, anywhere in it: a wreck, a boat hauled out or run aground, a model, a toy, a picture, a
 * sign, a carving. It is decoration, and says so: nothing promises it moves.
 */
const NOT_A_RIDE = /relitt|rottam|carcass|arenat|affondat|naufragat|sfasciat|\brott[oaei]\b|in secca|in bottiglia|modellin|giocattol|miniatur|dipint|quadro|affresc|insegn|scolpit|intagliat|statua|\bdi carta\b|\bwreck|\bsunken\b|\bstranded\b|\bbeached\b|\bbroken\b|\bruined\b|\bmodel\b|\btoy\b|\bminiature\b|\bpainting\b|\bpainted\b|\bsign\b|\bbottle\b|\bcarv(?:ed|ing)\b|\bstatue\b|\breplica\b|\bpaper\b/i;

/** The tags that declare a vehicle, when the name does not say which: the medium then comes from the other tags. */
const DECLARED = /^(?:veicol[oi]|vehicles?|mezzo di trasporto|mezzi di trasporto)$/i;

const IT_RE = Object.fromEntries(VEHICLE_MEDIA.map((m) => [m, new RegExp(String.raw`^${LEAD}(?:${IT_HEADS[m]})(?![a-zà-ÿ])`, 'i')])) as Record<VehicleMedium, RegExp>;
const EN_RE = Object.fromEntries(VEHICLE_MEDIA.map((m) => [m, new RegExp(String.raw`\b(?:${EN_WORDS[m]})\b`, 'i')])) as Record<VehicleMedium, RegExp>;
const WORD_RE = Object.fromEntries(VEHICLE_MEDIA.map((m) => [m, new RegExp(String.raw`^(?:${IT_HEADS[m]}|${EN_WORDS[m]})$`, 'i')])) as Record<VehicleMedium, RegExp>;

/** The first words of a name, before what it belongs to («Steam barge of the dock» → «Steam barge»). */
const firstPhrase = (name: string) => name.split(/\s+(?:of|with|for|from|on|in|at|by|del|della|dello|dei|degli|delle|di|da|con|per)\s+|[,;:(–—-]/i)[0] ?? '';

/**
 * The medium a name (and its tags) says a vehicle moves on, among those the world has (`media`: the void only in a world of the void), or
 * undefined: not a vehicle, or a vehicle of what the kernel cannot make move, or what only looks like one (a wreck, a model).
 */
export function vehicleMediumIn(name: string, tags: readonly unknown[] = [], media: readonly VehicleMedium[] = ['water', 'land']): VehicleMedium | undefined {
  const n = String(name ?? '').trim();
  const words = tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim());
  if (!n || NOT_A_RIDE.test(n) || words.some((t) => NOT_A_RIDE.test(t))) return undefined;
  for (const m of media) if (IT_RE[m].test(n)) return m;
  const head = firstPhrase(n);
  for (const m of media) if (EN_RE[m].test(head)) return m;
  // A thing whose tags say it is a vehicle: its medium from the other tags.
  if (words.some((t) => DECLARED.test(t))) for (const m of media) if (words.some((t) => WORD_RE[m].test(t))) return m;
  return undefined;
}

/** The media of a world (T487): the water and the land always (a barge where no water is has no place to come into), the void only in a world of the void. */
export function worldMedia(geography: unknown): VehicleMedium[] {
  return geography === 'void' ? ['water', 'land', 'void'] : ['water', 'land'];
}

/** A manifest that presents itself as a vehicle (T487): the medium it promises; a thing of the world (not someone, nor a thing one takes). */
export function claimedMedium(m: Pick<Manifest, 'kind' | 'name' | 'tags' | 'persona' | 'takeable'>, media?: readonly VehicleMedium[]): VehicleMedium | undefined {
  if (m.kind !== 'entity' || m.persona !== undefined) return undefined;
  return vehicleMediumIn(m.name, m.tags ?? [], media);
}

// --- What the kernel gives one ------------------------------------------------------------------------------------------------------

/** What a vehicle of each medium makes when the Council says nothing of its numbers: a barge, a cart, a capsule (the seed's). */
export const MEDIUM_DEFAULTS: Readonly<Record<VehicleMedium, { speed: number; accel: number; turn: number }>> = {
  water: { speed: 2.5, accel: 0.8, turn: 0.6 },
  land: { speed: 3, accel: 1.5, turn: 0.9 },
  void: { speed: 6, accel: 2, turn: 1.2 },
};

/**
 * What a name says of a sail (T484): a ship that goes by the wind («Veliero», «Galeone», «Barca a vela», «Sloop»). The kernel gives it
 * `SAIL` of its way from the wind, so in a world with wind it sails and close to it slows; a rowing boat, a barge, a raft have none.
 */
const SAILS = /\b(?:vel[ae]|velier[oi]|brigantin[oi]|galeon[ei]|caravell[ae]|vascell[oi]|golett[ae]|feluc(?:a|he)|giunc(?:a|he)|catamaran[oi]|drakkar|sails?|sailboats?|sailing|sloops?|schooners?|galleons?|brigs?|brigantines?|caravels?|longships?|catamarans?|junks?)\b/i;

/** The share of its way a vessel whose name says a sail takes from the wind (the rest from its oars): head to wind it still creeps. */
export const SAIL = 0.75;

/** Whether a name says a sail (T484). */
export const saysSail = (name: unknown): boolean => typeof name === 'string' && SAILS.test(name);

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const within = (v: number, [lo, hi]: readonly [number, number]) => Math.round(Math.min(hi, Math.max(lo, v)) * 100) / 100;

/**
 * The `vehicle` of a manifest the kernel writes (T487): the medium, the numbers the Physicist said within the kernel's limits (else the
 * medium's own), the draught only on the water (shallow if not said deep).
 */
export function vehicleFor(medium: VehicleMedium, said: { speed?: unknown; accel?: unknown; turn?: unknown; draught?: unknown } = {}, name?: string): { medium: VehicleMedium; speed: number; accel: number; turn: number; draught?: Draught; sail?: number } {
  const d = MEDIUM_DEFAULTS[medium];
  const draught = medium === 'water' ? ((DRAUGHTS as readonly unknown[]).includes(said.draught) ? (said.draught as Draught) : 'shallow') : undefined;
  return {
    medium,
    speed: within(num(said.speed) ? said.speed : d.speed, VEHICLE_LIMITS.speed),
    accel: within(num(said.accel) ? said.accel : d.accel, VEHICLE_LIMITS.accel),
    turn: within(num(said.turn) ? said.turn : d.turn, VEHICLE_LIMITS.turn),
    ...(draught ? { draught } : {}),
    // A sail (T484): what the name says goes by the wind takes a share of its way from it.
    ...(medium === 'water' && saysSail(name) ? { sail: SAIL } : {}),
  };
}

// --- The validator --------------------------------------------------------------------------------------------------------------------

/**
 * What the validator refuses of a forged module (T487, «ciò che sembra si comporta»): a thing of the world that presents itself as a vehicle
 * (its name, its tags) and has no `vehicle`; the reason goes back to who wrote it. A wreck, a model, a vehicle of what the kernel cannot move
 * do not present themselves as one.
 */
export function vehicleClaimErrors(m: Manifest, media?: readonly VehicleMedium[]): string[] {
  if (m.vehicle !== undefined) return [];
  const medium = claimedMedium(m, media);
  if (!medium) return [];
  return [`«${m.name}» si presenta come un mezzo che si guida (${MEDIUM_WORDS[medium]}) ma non ha vehicle: un mezzo che non si guida inganna come un muro che si attraversa. Dagli vehicle { medium: "${medium}" }, o fanne ciò che è davvero (un relitto, un modellino, una cosa ormeggiata per sempre) e dillo nel nome`];
}

const MEDIUM_WORDS: Record<VehicleMedium, string> = { water: "sull'acqua", land: 'su terra', void: 'nel vuoto' };

// --- The repair of the universes made before --------------------------------------------------------------------------------------

/**
 * The universes made before T487 (T487 point 4): the modules the Council forged that present themselves as vehicles and have no `vehicle`
 * (the barge of `orichalcum`) take it from the kernel, with the medium their name says and the medium's numbers; solid, not pushed, not
 * taken. A boat whose model is not sculpted yet takes the vessels' class, so the Sculptor makes it float; one whose model exists keeps it. What
 * is written by hand, a vehicle already, or someone, is left as it is. Pure: the files changed (none, most times) and the modules repaired.
 */
export function repairVehicleClaims(files: FileMap): { changes: Record<string, string>; repaired: string[] } {
  const changes: Record<string, string> = {};
  const repaired: string[] = [];
  let geography: unknown;
  let index: Record<string, unknown> = {};
  try {
    geography = JSON.parse(files['universe.json'] ?? '{}')?.nature?.geography;
  } catch {
    geography = undefined;
  }
  try {
    const parsed = JSON.parse(files['models/index.json'] ?? '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) index = parsed;
  } catch {
    index = {};
  }
  const media = worldMedia(geography);
  for (const path of Object.keys(files).sort()) {
    if (!/^modules\/[^/]+\/manifest\.json$/.test(path)) continue;
    let m: Record<string, any>;
    try {
      m = JSON.parse(files[path]);
    } catch {
      continue;
    }
    if (!m || typeof m !== 'object' || Array.isArray(m) || !COUNCIL_ORIGINS.has(m.origin) || m.vehicle !== undefined || m.takeable === true) continue;
    const medium = claimedMedium(m as Manifest, media);
    if (!medium) continue;
    m.vehicle = vehicleFor(medium);
    m.physics = { ...(m.physics && typeof m.physics === 'object' ? m.physics : {}), solid: true, pushable: false };
    if (m.components && typeof m.components === 'object') delete m.components.vel;
    const model = m.appearance?.model;
    const sculpted = typeof model === 'string' && (model in index || files[`models/${model}.xml`] !== undefined);
    if (medium === 'water' && m.appearance && typeof m.appearance === 'object' && !sculpted) m.appearance.class = 'vessel';
    changes[path] = JSON.stringify(m, null, 2) + '\n';
    repaired.push(String(m.id ?? path));
  }
  return { changes, repaired };
}

// --- Where a vehicle comes into a place -------------------------------------------------------------------------------------------

/** The ground of a place as `vehicleSpot` reads it: its side, whether a tile carries the hull, whether one walks on it (local tiles). */
export interface SpotGround {
  side: number;
  carries(col: number, row: number): boolean;
  walks(col: number, row: number): boolean;
}

/** Where a vehicle comes into a place: its middle (local tiles) and where its bow points (the yaw of its form: 0 toward +y, π/2 toward +x). */
export interface VehicleSpot {
  x: number;
  y: number;
  heading: number;
}

/** How much of a tile is left around a hull's box when it comes into a place (it sways, its form is not the box to the voxel). */
export const SPOT_MARGIN = 0.25;

/**
 * Where in a place a vehicle comes in (T487, point 3): a middle where its whole box (`box`: across, along its bow, in tiles) stands on what
 * carries it, inside the place, the bow along a side of it; of those, first the ones a wanderer boards from the ground (a tile of the hull
 * within `BOARD_REACH` of one that is walked), then the nearest to `near` (the tile the plan gave it), then the first in reading order.
 * Undefined if nowhere: a barge in a place without water does not come into it. Deterministic, no random draw.
 */
export function vehicleSpot(g: SpotGround, box: readonly [number, number], near?: readonly [number, number]): VehicleSpot | undefined {
  const S = Math.max(0, Math.floor(g.side));
  if (!S) return undefined;
  const across = Math.max(0.5, Number.isFinite(box[0]) ? box[0] : 1), along = Math.max(0.5, Number.isFinite(box[1]) ? box[1] : 1);
  // How far every tile is from one that is walked (8 neighbours), up to the reach of boarding.
  const reach = Math.ceil(BOARD_REACH);
  const dist = new Int16Array(S * S).fill(reach + 1);
  const queue: number[] = [];
  for (let i = 0; i < S * S; i++) if (g.walks(i % S, Math.floor(i / S))) {
    dist[i] = 0;
    queue.push(i);
  }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q], c = i % S, r = Math.floor(i / S);
    if (dist[i] >= reach) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nc = c + dx, nr = r + dy;
      if (nc < 0 || nr < 0 || nc >= S || nr >= S) continue;
      const j = nc + nr * S;
      if (dist[j] > dist[i] + 1) {
        dist[j] = dist[i] + 1;
        queue.push(j);
      }
    }
  }
  const carried = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) carried[i] = g.carries(i % S, Math.floor(i / S)) ? 1 : 0;
  let best: { spot: VehicleSpot; boards: boolean; d: number } | undefined;
  for (const heading of [0, Math.PI / 2]) {
    const hx = (heading ? along : across) / 2 + SPOT_MARGIN, hy = (heading ? across : along) / 2 + SPOT_MARGIN;
    // Middles every half tile, so a box of an even or an odd width fits as well.
    for (let ky = 1; ky < 2 * S; ky++) for (let kx = 1; kx < 2 * S; kx++) {
      const x = kx / 2, y = ky / 2;
      const c0 = Math.floor(x - hx), c1 = Math.ceil(x + hx) - 1, r0 = Math.floor(y - hy), r1 = Math.ceil(y + hy) - 1;
      if (c0 < 0 || r0 < 0 || c1 >= S || r1 >= S) continue;
      let fits = true, boards = false;
      for (let r = r0; r <= r1 && fits; r++) for (let c = c0; c <= c1; c++) {
        const i = c + r * S;
        if (!carried[i]) {
          fits = false;
          break;
        }
        if (dist[i] <= reach - 1) boards = true;
      }
      if (!fits) continue;
      const d = near ? Math.hypot(x - (near[0] + 0.5), y - (near[1] + 0.5)) : 0;
      if (!best || (boards && !best.boards) || (boards === best.boards && d < best.d - 1e-9)) best = { spot: { x, y, heading }, boards, d };
    }
  }
  return best?.spot;
}
