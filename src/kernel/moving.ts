// Taking furniture and putting it down elsewhere (T292, ADR-0168). Some things of the world can be taken: their manifest says
// `takeable` (a cupboard yes, a well no; absent is no). Taken, a thing leaves the world and is an item of the inventory,
// `thing:<module>`, with what makes it that thing (`CarriedThing`): its origin (who it is: the key of its container, of the actions
// done on its model, of its look) and its state (its components that are not the kernel's). Put down again it comes back as itself,
// where it was put, and stays there in the save (`moved` of `world/state.json`): the place it was born in no longer makes it.
// Pure functions: the item, what a thing takes with it, what a save of it keeps, and whether a solid thing put down splits the tiles
// a body walks (rule 10, ADR-0064). The world says why it does not go, with no word of the game.

/** The items that are things of the world while they are carried: `thing:` and the id of their module. */
export const THING_PREFIX = 'thing:';

/** The item a thing of a module is while it is carried. */
export const thingItem = (module: string): string => `${THING_PREFIX}${module}`;

/** The module of a carried thing's item, or undefined if the item is not one. */
export function thingModule(item: unknown): string | undefined {
  return typeof item === 'string' && item.startsWith(THING_PREFIX) && item.length > THING_PREFIX.length && item.length <= THING_PREFIX.length + MAX_MODULE ? item.slice(THING_PREFIX.length) : undefined;
}

export const isThing = (item: unknown): boolean => thingModule(item) !== undefined;

/** The option of a tile's menu that puts down there what is carried (`t:_posa`): not a slug, so no terrain's learned action is called so. */
export const PUT_DOWN = '_posa';

/** The state of a thing: its components that are not the kernel's, by name. */
export type ThingParts = Record<string, unknown>;

/**
 * What follows a thing while it is carried (a field of its slot): who it is, the seed of its look (the instance's, so that what is
 * carried looks as it did standing), and its state. A client gets only the seed (`shownInventory`).
 */
export interface CarriedThing {
  origin: string;
  seed?: number;
  parts?: ThingParts;
}

/** A thing put down somewhere else than where its place made it, as the save keeps it (`moved` of `world/state.json`). */
export interface MovedRecord {
  module: string;
  origin: string;
  x: number;
  y: number;
  yaw: number;
  parts?: ThingParts;
}

/**
 * The components the kernel makes again whenever an entity of a module comes into the world (where it is, its body, its look, its
 * menu, its container, which is kept by its origin) or that say someone rather than something: never part of a thing's state.
 */
export const KERNEL_PARTS: ReadonlySet<string> = new Set(['pos', 'module', 'body', 'glyph', 'form', 'interact', 'mind', 'container', 'inventory', 'vel', 'chunk', 'origin', 'placed', 'pickup', 'rune', 'remote', 'player', 'structure', 'identity', 'carpet', 'hand', 'needs', 'states', 'slots', 'jump']);

/** How much state a thing takes with it (characters of JSON): beyond, it comes back as its manifest makes it. */
export const MAX_THING_PARTS = 4096;
/** The things moved that a save keeps, the most recent ones. */
export const MAX_MOVED = 2000;
const MAX_ORIGIN = 160;
const MAX_MODULE = 80;
const PART_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,47}$/;
const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * A thing's state from its components, or as a file holds it: plain data by component name, no component of the kernel's, not more
 * than `MAX_THING_PARTS`; undefined when nothing is left (or too much is there: the thing comes back as its manifest makes it).
 */
export function readParts(v: unknown): ThingParts | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: ThingParts = {};
  for (const [name, c] of Object.entries(v as Record<string, unknown>)) {
    if (KERNEL_PARTS.has(name) || UNSAFE.has(name) || !PART_NAME.test(name) || c === null || c === undefined || typeof c === 'function') continue;
    out[name] = c;
  }
  if (!Object.keys(out).length) return undefined;
  let text: string;
  try {
    text = JSON.stringify(out);
  } catch {
    return undefined;
  }
  if (!text || text.length > MAX_THING_PARTS) return undefined;
  const parsed = JSON.parse(text) as ThingParts;
  for (const name of Object.keys(parsed)) if (parsed[name] === null) delete parsed[name];
  return Object.keys(parsed).length ? parsed : undefined;
}

const okOrigin = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ORIGIN;

const okSeed = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && Math.abs(v) < 1e9;

/** What a slot of a file says a carried thing is, or undefined: an origin, a seed, and a state read as `readParts` reads it. */
export function readThing(v: unknown): CarriedThing | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const { origin, seed, parts } = v as Record<string, unknown>;
  if (!okOrigin(origin)) return undefined;
  const p = readParts(parts);
  return { origin, ...(okSeed(seed) ? { seed } : {}), ...(p ? { parts: p } : {}) };
}

/** The seed of a carried thing's look as a slot has it (a client's slot has only that of who it is), or undefined. */
export function thingSeed(slot: { thing?: unknown } | null | undefined): number | undefined {
  const seed = slot?.thing && typeof slot.thing === 'object' ? (slot.thing as { seed?: unknown }).seed : undefined;
  return okSeed(seed) ? seed : undefined;
}

/**
 * How heavy a thing is in the inventory (weight units: the wanderer carries 20 without slowing down): half its mass in kg, between
 * 2 and 20, 10 when its manifest does not say. Alone it never slows who carries it; with much else it does.
 */
export function thingWeight(mass: unknown): number {
  const m = typeof mass === 'number' && Number.isFinite(mass) ? mass : 20;
  return Math.min(20, Math.max(2, Math.round(m / 2)));
}

/**
 * The things moved as `world/state.json` holds them, a file the master may write by hand: whatever is not a module's thing at a
 * finite place is left out, never thrown at the world; one record per origin (the last one), at most `MAX_MOVED`.
 */
export function readMoved(list: unknown): MovedRecord[] {
  if (!Array.isArray(list)) return [];
  const byOrigin = new Map<string, MovedRecord>();
  for (const r of list.slice(-MAX_MOVED)) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) continue;
    const { module, origin, x, y, yaw, parts } = r as Record<string, unknown>;
    if (typeof module !== 'string' || !module || module.length > MAX_MODULE || !okOrigin(origin)) continue;
    if (![x, y].every((v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1e6)) continue;
    const p = readParts(parts);
    byOrigin.delete(origin);
    byOrigin.set(origin, { module, origin, x: x as number, y: y as number, yaw: typeof yaw === 'number' && Number.isFinite(yaw) ? yaw : 0, ...(p ? { parts: p } : {}) });
  }
  return [...byOrigin.values()];
}

/** The yaw that turns a thing's front (its model's +y) toward (dx, dy), in quarter turns: what is put down faces who put it down. */
export function facingYaw(dx: number, dy: number): number {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || (!dx && !dy)) return 0;
  // The front of a model turned by `yaw` looks toward (sin yaw, cos yaw) of the world.
  const q = Math.round(Math.atan2(dx, dy) / (Math.PI / 2));
  return (((q * Math.PI) / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
}

// --- Why not, in words of the world ---------------------------------------------------------------------------------------------

/** Why a thing is not taken. */
export type TakeFailure = 'fixed' | 'nowhere' | 'far' | 'full' | 'on-top' | 'someone' | 'no-room';

/** Why a thing carried does not go down there. */
export type PutFailure = 'nothing' | 'nowhere' | 'down' | 'far' | 'ground' | 'taken' | 'you' | 'someone' | 'lying' | 'rune' | 'door' | 'split';

/** What the world says when a thing is not taken (T292): no word of the game in it. */
export function takeRefusal(why: TakeFailure, name: string): string {
  switch (why) {
    case 'fixed':
      return `${name} non si può portare via.`;
    case 'nowhere':
      return 'Qui non si porta via niente.';
    case 'far':
      return `Avvicinati a ${name}.`;
    case 'full':
      return `Dentro ${name} c'è ancora qualcosa: toglilo prima.`;
    case 'on-top':
      return `Sopra ${name} c'è ancora qualcosa: toglilo prima.`;
    case 'someone':
      return `Sopra ${name} c'è qualcuno.`;
    case 'no-room':
      return `Non hai posto per ${name}.`;
  }
}

/** What the world says when a thing carried does not go down there (T292): the thing stays in hand. */
export function putRefusal(why: PutFailure, name: string): string {
  switch (why) {
    case 'nothing':
      return 'Non porti niente da posare.';
    case 'nowhere':
      return `Qui non c'è dove posare ${name}.`;
    case 'down':
      return `Scendi a terra per posare ${name}.`;
    case 'far':
      return 'È troppo lontano: avvicinati.';
    case 'ground':
      return `Lì il terreno non regge ${name}.`;
    case 'taken':
      return `Lì ${name} non ci sta.`;
    case 'you':
      return 'Ci sei tu in mezzo: fai un passo indietro.';
    case 'someone':
      return "C'è qualcuno in mezzo.";
    case 'lying':
      return "Lì c'è qualcosa a terra: raccoglilo prima.";
    case 'rune':
      return "Lì c'è una runa nel terreno.";
    case 'door':
      return `Davanti a una porta ${name} chiuderebbe il passaggio.`;
    case 'split':
      return `Lì ${name} chiuderebbe il passaggio.`;
  }
}

// --- The place stays whole (rule 10, ADR-0064) ----------------------------------------------------------------------------------

/** A rectangle of tiles of the world: its first column and row, how many of each. */
export interface TileArea {
  col: number;
  row: number;
  cols: number;
  rows: number;
}

/** How a body goes over the tiles: whether it stands on one, and whether it steps from one to the next (both passable). */
export interface Walk {
  passable(col: number, row: number): boolean;
  step(col: number, row: number, toCol: number, toRow: number): boolean;
}

const NEXT: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * The groups of tiles of an area a body walks between: four ways, a step counted only if it goes both ways (what one only steps down
 * from does not join). A group number per tile of the area (`col - area.col + (row - area.row) · cols`), -1 where no body stands.
 */
export function walkGroups(area: TileArea, walk: Walk): Int32Array {
  const { col, row, cols, rows } = area;
  const group = new Int32Array(cols * rows).fill(-2);
  const queue: number[] = [];
  let next = 0;
  for (let start = 0; start < group.length; start++) {
    if (group[start] !== -2) continue;
    if (!walk.passable(col + (start % cols), row + Math.floor(start / cols))) {
      group[start] = -1;
      continue;
    }
    group[start] = next;
    queue.push(start);
    while (queue.length) {
      const i = queue.pop()!;
      const c = i % cols, r = (i - c) / cols;
      for (const [dc, dr] of NEXT) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const n = nc + nr * cols;
        if (group[n] >= 0 || group[n] === -1) continue;
        if (!walk.passable(col + nc, row + nr)) {
          group[n] = -1;
          continue;
        }
        if (!walk.step(col + c, row + r, col + nc, row + nr) || !walk.step(col + nc, row + nr, col + c, row + r)) continue;
        group[n] = next;
        queue.push(n);
      }
    }
    next++;
  }
  return group;
}

/**
 * Whether something put down splits the place (rule 10, ADR-0064), from the groups of an area before and after it (`walkGroups`):
 * two tiles a body walked between before, both still passable after, that it no longer walks between. What the thing covers is
 * gone; nothing else may be cut off by it. Measured on the area only: a way round outside it does not count (one more refusal,
 * never a place cut in two).
 */
export function splitBetween(before: Int32Array, after: Int32Array): boolean {
  const joined = new Map<number, number>();
  for (let i = 0; i < before.length; i++) {
    if (before[i] < 0 || after[i] < 0) continue;
    const was = joined.get(before[i]);
    if (was === undefined) joined.set(before[i], after[i]);
    else if (was !== after[i]) return true;
  }
  return false;
}

/** The same on two ways of walking an area that do not change meanwhile (the tests' worlds by hand). */
export const splits = (area: TileArea, before: Walk, after: Walk): boolean => splitBetween(walkGroups(area, before), walkGroups(area, after));
