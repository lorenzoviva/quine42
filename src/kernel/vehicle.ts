// The vehicle (T439, ADR-0227): a primitive of the kernel, not a boat wired in. An entity whose manifest says `vehicle` moves on what its
// medium floats or rolls on (`water`: the water one swims, `land`: the ground one walks), within the kernel's limits: who stands on its
// deck (a floor of its form, or the disc of its body while it has none) goes and turns with it; who holds its helm steers it with the keys
// that walk (up and down push, left and right turn the bow), and does not walk; the anchor (the brake, on land) holds it; the shore and
// what is solid stop it, never break it. The Council makes boats, carts and capsules of it (the void, T448, ADR-0234: a capsule at the
// landing of every land of the void, which the kernel puts there, `islands.ts → dockOf`): Lua reads it (`world.vehicle`), gives it power and a course (`world.vehicle_set`), never a place.
// Pure functions here: the limits, the manifest read without trusting it, the state kept sane, the step, the hull's points, the save.

import { toLocal } from './forms';
import { crossingOf, isVoid, terrainPhysics } from './nature';
import type { TerrainDef } from './types';
import { saneTransit, type Transit } from './planets';
import { MAX_PLANETS } from './nature';

// --- What a manifest says ----------------------------------------------------------------------------------------------------------

/** What a hull moves on: the water one swims, the ground one walks, the void between the lands of a world of the void (T448). */
export const VEHICLE_MEDIA = ['water', 'land', 'void'] as const;
export type VehicleMedium = (typeof VEHICLE_MEDIA)[number];

/** How deep a hull goes: a shallow one floats on every water, a deep one only on the deep water (the sea). */
export const DRAUGHTS = ['shallow', 'deep'] as const;
export type Draught = (typeof DRAUGHTS)[number];

/**
 * The kernel's limits of a vehicle: whatever a manifest says, it stays inside them (rule 7). The speed in tiles a second (a body walks
 * 6, swims 2.4), the acceleration in tiles a second squared, the turn in radians a second at full way.
 */
export const VEHICLE_LIMITS = {
  speed: [0.5, 8],
  accel: [0.2, 4],
  turn: [0.2, 2],
} as const;

/** The vehicles of a world (a save keeps no more): beyond, a place's vehicle stays a thing of its place, Lua's is not made. */
export const MAX_VEHICLES = 32;

/** A vehicle as the kernel reads its manifest. */
export interface VehicleSpec {
  medium: VehicleMedium;
  /** Its top speed (tiles a second). */
  speed: number;
  accel: number;
  /** How fast its bow turns at full way (radians a second). */
  turn: number;
  /** On the water: whether it floats on the shallow water too. */
  draught: Draught;
  /**
   * Whether its deck holds air (T446, ADR-0237): who stands on it breathes, whatever is under it. A vehicle of the void holds it if it says
   * nothing (a capsule is closed); another only if it says so (an open deck has the air of the tile under it).
   */
  air: boolean;
}

/** What a manifest writes of a vehicle (`vehicle`), as read: nothing of it is trusted. */
export interface VehicleSaid {
  medium?: unknown;
  speed?: unknown;
  accel?: unknown;
  turn?: unknown;
  draught?: unknown;
  air?: unknown;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const within = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));
const isMedium = (v: unknown): v is VehicleMedium => typeof v === 'string' && (VEHICLE_MEDIA as readonly string[]).includes(v);
const isDraught = (v: unknown): v is Draught => typeof v === 'string' && (DRAUGHTS as readonly string[]).includes(v);

/** The vehicle a manifest says, within the kernel's limits; undefined if it says none or a medium the kernel does not know. */
export function vehicleSpecOf(said: unknown): VehicleSpec | undefined {
  if (!said || typeof said !== 'object') return undefined;
  const v = said as VehicleSaid;
  if (!isMedium(v.medium)) return undefined;
  return {
    medium: v.medium,
    speed: within(finite(v.speed) ? v.speed : 3, VEHICLE_LIMITS.speed),
    accel: within(finite(v.accel) ? v.accel : 1.5, VEHICLE_LIMITS.accel),
    turn: within(finite(v.turn) ? v.turn : 0.8, VEHICLE_LIMITS.turn),
    draught: isDraught(v.draught) ? v.draught : 'shallow',
    air: v.air === true || (v.air !== false && v.medium === 'void'),
  };
}

/** What the validator refuses of a manifest's `vehicle`: not an object, a medium not known, numbers outside the limits, a draught not known. */
export function vehicleSpecErrors(said: unknown): string[] {
  if (!said || typeof said !== 'object' || Array.isArray(said)) return ['vehicle deve essere un oggetto { medium, speed, accel, turn, draught }'];
  const v = said as VehicleSaid;
  const out: string[] = [];
  if (!isMedium(v.medium)) out.push(`vehicle.medium deve essere uno tra ${VEHICLE_MEDIA.join(', ')}`);
  for (const k of ['speed', 'accel', 'turn'] as const) {
    const n = v[k];
    const [lo, hi] = VEHICLE_LIMITS[k];
    if (n !== undefined && (!finite(n) || n < lo || n > hi)) out.push(`vehicle.${k} sta tra ${lo} e ${hi}`);
  }
  if (v.air !== undefined && typeof v.air !== 'boolean') out.push('vehicle.air deve essere true o false');
  if (v.draught !== undefined && (!isDraught(v.draught) || v.medium !== 'water')) out.push(`vehicle.draught (${DRAUGHTS.join(', ')}) solo sull'acqua`);
  return out;
}

/**
 * Whether a tile carries a hull: on the water what one swims (the deep only, for a deep hull; never a reef, where a hull runs aground,
 * T443), on land what one walks, in the void the void alone (T448: a capsule never flies over a land, it docks at its edge).
 */
export function carries(spec: Pick<VehicleSpec, 'medium' | 'draught'>, t: TerrainDef | undefined): boolean {
  if (!t) return false;
  if (spec.medium === 'void') return isVoid(t);
  const cross = crossingOf(t);
  if (spec.medium === 'land') return cross === 'walk';
  if (cross !== 'swim') return false;
  const depth = terrainPhysics(t).depth;
  return depth === 'deep' || (spec.draught === 'shallow' && depth !== 'reef');
}

// --- Its state: the component `vehicle` --------------------------------------------------------------------------------------------

/**
 * A vehicle now (the component `vehicle`, written only by the kernel): where its bow points (`heading`, the yaw of its form: the bow looks
 * toward (sin, cos)), its way and its turn, what it is asked (`thrust` −1…1 from the helm or Lua, `steer` −1…1, `power` 0…1 from Lua: the
 * wind in the sail, the oars, the horse), the anchor, who holds the helm (a wanderer's id), whether the last move was stopped.
 */
export interface VehicleState {
  heading: number;
  speed: number;
  turn: number;
  thrust: number;
  steer: number;
  power: number;
  anchored: boolean;
  helm?: string;
  bumped?: boolean;
  /** A voyage under way (T449, ADR-0236): only a vehicle of the void, only the kernel writes it (`travelTo`). */
  transit?: Transit;
}

/** A vehicle that comes into the world: still, at anchor, heading as its form faces. */
export function newVehicle(heading: number): VehicleState {
  return { heading: finite(heading) ? heading : 0, speed: 0, turn: 0, thrust: 0, steer: 0, power: 1, anchored: true };
}

/** The state made sane in place (rule 7): what is not a number is nothing, what is out of range the nearest it may be. */
export function saneVehicle(v: Partial<VehicleState> & Record<string, unknown>, spec: VehicleSpec, bands = 0): VehicleState {
  v.heading = finite(v.heading) ? v.heading % (2 * Math.PI) : 0;
  v.speed = finite(v.speed) ? within(v.speed, [-spec.speed * REVERSE, spec.speed]) : 0;
  v.turn = finite(v.turn) ? within(v.turn, [-spec.turn, spec.turn]) : 0;
  v.thrust = finite(v.thrust) ? within(v.thrust, [-1, 1]) : 0;
  v.steer = finite(v.steer) ? within(v.steer, [-1, 1]) : 0;
  v.power = finite(v.power) ? within(v.power, [0, 1]) : 1;
  v.anchored = v.anchored !== false;
  if (typeof v.helm !== 'string' || !v.helm) delete v.helm;
  if (v.bumped !== true) delete v.bumped;
  const tr = spec.medium === 'void' ? saneTransit(v.transit, bands) : undefined;
  if (tr) v.transit = Object.assign(v.transit as Transit, tr);
  else delete v.transit;
  return v as VehicleState;
}

/** Astern a vehicle makes half its way. */
export const REVERSE = 0.5;
/** At rest a hull still turns this share of its turn (a cart, a boat with oars); at full way all of it. */
export const TURN_AT_REST = 0.35;
/** The anchor (the brake) stops it this many times faster than it gathers way. */
export const ANCHOR_BRAKE = 3;

/** One step of a vehicle (`dt` seconds): its new way and turn, and how it moves (tiles, radians) if nothing stops it. */
export function vehicleStep(v: VehicleState, spec: VehicleSpec, dt: number): { speed: number; turn: number; dx: number; dy: number; dyaw: number } {
  const target = v.anchored ? 0 : (v.thrust >= 0 ? v.thrust : v.thrust * REVERSE) * v.power * spec.speed;
  const a = spec.accel * (v.anchored ? ANCHOR_BRAKE : 1) * dt;
  const speed = v.speed + within(target - v.speed, [-a, a]);
  const grip = TURN_AT_REST + (1 - TURN_AT_REST) * Math.min(1, Math.abs(speed) / spec.speed);
  const turn = v.anchored ? 0 : v.steer * spec.turn * grip;
  const dyaw = turn * dt;
  const h = v.heading + dyaw;
  return { speed, turn, dyaw, dx: Math.sin(h) * speed * dt, dy: Math.cos(h) * speed * dt };
}

/** What the helmsman's keys ask: up pushes ahead, down astern, left turns the bow to its left (port), right to its right. */
export function helmOrders(held: (action: string) => boolean): { thrust: number; steer: number } {
  return { thrust: (held('up') ? 1 : 0) - (held('down') ? 1 : 0), steer: (held('left') ? 1 : 0) - (held('right') ? 1 : 0) };
}

/** The facing of a body that looks where the bow points (the quarter nearest to the heading). */
export function facingOf(heading: number): 'up' | 'down' | 'left' | 'right' {
  const sx = Math.sin(heading), sy = Math.cos(heading);
  return Math.abs(sx) >= Math.abs(sy) ? (sx > 0 ? 'right' : 'left') : sy > 0 ? 'down' : 'up';
}

// --- The frame of a vehicle: where a point of its deck goes when it moves ----------------------------------------------------------

/** A point of a form's own frame (tiles from its middle) in the world, its form turned by `yaw` (the inverse of `toLocal`). */
export function toWorld(lx: number, lz: number, yaw: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [lx * c + lz * s, -lx * s + lz * c];
}

/** Where a vehicle is: its middle (carpet space) and where its bow points. */
export interface VehiclePose {
  x: number;
  y: number;
  heading: number;
}

/** Where a point carried by a vehicle goes: the same place on its deck, the deck moved from `from` to `to` (middle and heading). */
export function carried(x: number, y: number, from: VehiclePose, to: VehiclePose): [number, number] {
  const [lx, lz] = toLocal(x - from.x, y - from.y, from.heading);
  const [wx, wy] = toWorld(lx, lz, to.heading);
  return [to.x + wx, to.y + wy];
}

/** A point of the world in the frame of a vehicle's deck (T442): tiles from its middle, its bow toward +y. */
export function onDeck(pose: VehiclePose, x: number, y: number): [number, number] {
  return toLocal(x - pose.x, y - pose.y, pose.heading);
}

/** A point of a vehicle's deck (its frame) in the world (T442): the inverse of `onDeck`. */
export function offDeck(pose: VehiclePose, lx: number, ly: number): [number, number] {
  const [wx, wy] = toWorld(lx, ly, pose.heading);
  return [pose.x + wx, pose.y + wy];
}

// --- In a game of many (T442): what a client sees of a vehicle, and how its mirror carries it on between two words of the server -------

/**
 * A vehicle as a client sees it (T442, `EntityView.vehicle`): where its bow points, its way and its turn, the anchor, who holds the helm (a
 * wanderer's id, as `OtherView.id`). Nothing else of its state leaves the server: what is asked of it (`thrust`, `steer`, `power`) is the
 * helmsman's keys and Lua's.
 */
export interface VehicleView {
  heading: number;
  speed: number;
  turn: number;
  anchored: boolean;
  helm?: string;
  /** A voyage under way (T449): the client shows it, never moves it. */
  transit?: Transit;
}

/** The longest helm a client takes from the wire: a wanderer's id is shorter. */
const MAX_HELM = 64;

/** What the wire says of a vehicle, read without trusting it (rule 7): numbers within the kernel's widest limits, a helm that is a short text. */
export function readVehicleView(raw: unknown): VehicleView | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (!finite(r.heading)) return undefined;
  const top = VEHICLE_LIMITS.speed[1], turn = VEHICLE_LIMITS.turn[1];
  return {
    heading: r.heading % (2 * Math.PI),
    speed: finite(r.speed) ? within(r.speed, [-top, top]) : 0,
    turn: finite(r.turn) ? within(r.turn, [-turn, turn]) : 0,
    anchored: r.anchored !== false,
    ...(typeof r.helm === 'string' && r.helm && r.helm.length <= MAX_HELM ? { helm: r.helm } : {}),
    // A voyage (T449): bands within the most a world has, a time within its length.
    ...((t) => (t ? { transit: t } : {}))(saneTransit(r.transit, MAX_PLANETS)),
  };
}

/**
 * Where a vehicle seen at `pose`, with its way and its turn, is `t` seconds later if nothing changes (T442): on the arc its bow draws. The
 * mirror carries a vehicle on with it between two updates, instead of chasing the last one: its deck does not tremble.
 */
export function coast(pose: VehiclePose, speed: number, turn: number, t: number): VehiclePose {
  const h = pose.heading + turn * t;
  if (Math.abs(turn) < 1e-6) return { x: pose.x + Math.sin(pose.heading) * speed * t, y: pose.y + Math.cos(pose.heading) * speed * t, heading: h };
  return { x: pose.x + (speed * (Math.cos(pose.heading) - Math.cos(h))) / turn, y: pose.y + (speed * (Math.sin(h) - Math.sin(pose.heading))) / turn, heading: h };
}

/** The smallest turn from one heading to another (radians, −π…π). */
export function turnBetween(from: number, to: number): number {
  const d = (((to - from) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI);
  return d - Math.PI;
}

/**
 * The points of a hull (tiles from its middle, in its own frame) that must stand on what carries it: its columns with anything in them,
 * one every quarter of a tile and the outermost of every row; a hull with no form yet is the disc of its body.
 */
export function hullPoints(columns: Uint8Array, X: number, Y: number, vpt: number): Float64Array {
  const stride = Math.max(1, Math.round(vpt / 4));
  const out: number[] = [];
  const add = (vx: number, vy: number) => out.push((vx + 0.5) / vpt - X / (2 * vpt), (vy + 0.5) / vpt - Y / (2 * vpt));
  const rows: number[] = [];
  for (let vy = 0; vy < Y; vy += stride) rows.push(vy);
  if (Y > 0 && rows[rows.length - 1] !== Y - 1) rows.push(Y - 1);
  for (const vy of rows) {
    let first = -1, last = -1;
    for (let vx = 0; vx < X; vx++) {
      if (!columns[vx + vy * X]) continue;
      if (first < 0) first = vx;
      last = vx;
      if ((vx - first) % stride === 0) add(vx, vy);
    }
    if (last >= 0 && (last - first) % stride !== 0) add(last, vy);
  }
  return Float64Array.from(out);
}

/** The disc of a body (radius r) as points of a hull: its middle and eight around it. */
export function discPoints(r: number): Float64Array {
  const out = [0, 0];
  for (let i = 0; i < 8; i++) out.push(Math.cos((i * Math.PI) / 4) * r, Math.sin((i * Math.PI) / 4) * r);
  return Float64Array.from(out);
}

// --- The save: `world/state.json → vehicles` ---------------------------------------------------------------------------------------

/** A vehicle as the save keeps it: of no place, where it is, how it heads, at anchor or not, the seed of its look. */
export interface VehicleRecord {
  module: string;
  origin: string;
  x: number;
  y: number;
  heading: number;
  anchored: boolean;
  seed?: number;
}

const MAX_ORIGIN = 160;
const MAX_MODULE = 80;

/** The vehicles of a save, read without trusting it (rule 7): at most `MAX_VEHICLES`, each with a module, an origin and a place that are ones. */
export function readVehicles(list: unknown): VehicleRecord[] {
  if (!Array.isArray(list)) return [];
  const out: VehicleRecord[] = [];
  const seen = new Set<string>();
  for (const r of list.slice(0, MAX_VEHICLES * 2)) {
    if (!r || typeof r !== 'object') continue;
    const { module, origin, x, y, heading, anchored, seed } = r as Record<string, unknown>;
    if (typeof module !== 'string' || !module || module.length > MAX_MODULE) continue;
    if (typeof origin !== 'string' || !origin || origin.length > MAX_ORIGIN || seen.has(origin)) continue;
    if (!finite(x) || !finite(y) || Math.abs(x) > 1e7 || Math.abs(y) > 1e7) continue;
    seen.add(origin);
    out.push({ module, origin, x, y, heading: finite(heading) ? heading % (2 * Math.PI) : 0, anchored: anchored !== false, ...(Number.isInteger(seed) ? { seed: seed as number } : {}) });
    if (out.length >= MAX_VEHICLES) break;
  }
  return out;
}

// --- Words of the world ------------------------------------------------------------------------------------------------------------

/**
 * How near the helm of a vessel one takes it (T440), tiles from the middle of a tile of its `helm` area (`columnAreasOf`) to the body: a step
 * or two. A form without a helm area is steered from anywhere on its deck, as before (T439).
 */
export const HELM_REACH = 1.5;

/** How far a hull pushes who is where it came (T442), at most, in tiles; and how finely the room is looked for. */
export const PUSH_REACH = 2;
export const PUSH_STEP = 0.05;
/** How far from where one stands on a deck one goes over the side (T442), at most, in tiles. */
export const LEAVE_REACH = 3;
/** How far from a deck one climbs aboard from the menu (T448, «Sali a bordo»), at most, in tiles: from the head of a pier, the edge of a land. */
export const BOARD_REACH = 2.5;

/** What the menu and the world say of a vehicle, by what it moves on: a helm and an anchor on the water, the reins and a brake on land. */
export const VEHICLE_WORDS: Record<VehicleMedium, { take: string; leave: string; anchor: string; weigh: string; over: string; board: string; took: string; left: string; seized: string; anchored: string; weighed: string; bumped: string; aground: string; taken: string; aboard: string; far: string; went: string; noRoom: string; pushed: string; boarded: string; noDeck: string }> = {
  water: {
    take: 'Prendi il timone',
    leave: 'Lascia il timone',
    anchor: "Getta l'ancora",
    weigh: "Leva l'ancora",
    over: 'Tuffati',
    took: 'Prendi il timone.',
    left: 'Lasci il timone.',
    seized: 'Qualcuno ti prende il timone.',
    anchored: "Getti l'ancora.",
    weighed: "Levi l'ancora.",
    bumped: 'Lo scafo urta e si ferma.',
    aground: 'Lo scafo tocca la secca e si ferma.',
    taken: 'Al timone c’è già qualcuno.',
    aboard: 'Devi essere a bordo.',
    far: 'Il timone è più in là.',
    went: 'Ti tuffi in acqua.',
    noRoom: 'Non c’è spazio per tuffarsi qui.',
    pushed: 'Lo scafo ti spinge da parte.',
    board: 'Sali a bordo',
    boarded: 'Sali a bordo.',
    noDeck: 'Non c’è posto sul ponte.',
  },
  land: {
    take: 'Mettiti alla guida',
    leave: 'Lascia la guida',
    anchor: 'Tira il freno',
    weigh: 'Togli il freno',
    over: 'Scendi',
    took: 'Ti metti alla guida.',
    left: 'Lasci la guida.',
    seized: 'Qualcuno prende la guida al posto tuo.',
    anchored: 'Tiri il freno.',
    weighed: 'Togli il freno.',
    bumped: 'Le ruote urtano e si fermano.',
    aground: 'Le ruote urtano e si fermano.',
    taken: 'Alla guida c’è già qualcuno.',
    aboard: 'Devi esserci sopra.',
    far: 'Il posto di guida è più in là.',
    went: 'Scendi.',
    noRoom: 'Non c’è spazio per scendere qui.',
    pushed: 'Il carro ti spinge da parte.',
    board: 'Sali',
    boarded: 'Sali.',
    noDeck: 'Non c’è posto per salire.',
  },
  // The void (T448): a capsule's controls, its engines for an anchor; out of the hatch only onto a land.
  void: {
    take: 'Prendi i comandi',
    leave: 'Lascia i comandi',
    anchor: 'Spegni i motori',
    weigh: 'Accendi i motori',
    over: 'Esci',
    took: 'Prendi i comandi.',
    left: 'Lasci i comandi.',
    seized: 'Qualcuno prende i comandi al posto tuo.',
    anchored: 'Spegni i motori.',
    weighed: 'Accendi i motori.',
    bumped: 'La capsula urta e si ferma.',
    aground: 'La capsula urta e si ferma.',
    taken: 'Ai comandi c’è già qualcuno.',
    aboard: 'Devi essere a bordo.',
    far: 'I comandi sono più in là.',
    went: 'Esci dalla capsula.',
    noRoom: 'Fuori c’è solo il vuoto: niente su cui posare i piedi.',
    pushed: 'La capsula ti spinge da parte.',
    board: 'Entra',
    boarded: 'Entri nella capsula.',
    noDeck: 'Non c’è posto nella capsula.',
  },
};
