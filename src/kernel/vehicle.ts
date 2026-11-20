// The vehicle (T439, ADR-0227): a primitive of the kernel, not a boat wired in. An entity whose manifest says `vehicle` moves on what its
// medium floats or rolls on (`water`: the water one swims, `land`: the ground one walks), within the kernel's limits: who stands on its
// deck (a floor of its form, or the disc of its body while it has none) goes and turns with it; who holds its helm steers it with the keys
// that walk (up and down push, left and right turn the bow), and does not walk; the anchor (the brake, on land) holds it; the shore and
// what is solid stop it, never break it. The Council makes boats, carts and, one day, capsules of it (the void opens with T445):
// Lua reads it (`world.vehicle`), gives it power and a course (`world.vehicle_set`), never a place.
// Pure functions here: the limits, the manifest read without trusting it, the state kept sane, the step, the hull's points, the save.

import { toLocal } from './forms';
import { crossingOf, terrainPhysics } from './nature';
import type { TerrainDef } from './types';

// --- What a manifest says ----------------------------------------------------------------------------------------------------------

/** What a hull moves on: the water one swims, the ground one walks. The void is not yet a terrain (T445): what the kernel cannot do is not said. */
export const VEHICLE_MEDIA = ['water', 'land'] as const;
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
}

/** What a manifest writes of a vehicle (`vehicle`), as read: nothing of it is trusted. */
export interface VehicleSaid {
  medium?: unknown;
  speed?: unknown;
  accel?: unknown;
  turn?: unknown;
  draught?: unknown;
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
  if (v.draught !== undefined && (!isDraught(v.draught) || v.medium !== 'water')) out.push(`vehicle.draught (${DRAUGHTS.join(', ')}) solo sull'acqua`);
  return out;
}

/** Whether a tile carries a hull: on the water what one swims (the deep only, for a deep hull), on land what one walks. */
export function carries(spec: Pick<VehicleSpec, 'medium' | 'draught'>, t: TerrainDef | undefined): boolean {
  if (!t) return false;
  const cross = crossingOf(t);
  if (spec.medium === 'land') return cross === 'walk';
  if (cross !== 'swim') return false;
  return spec.draught === 'shallow' || terrainPhysics(t).depth === 'deep';
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
}

/** A vehicle that comes into the world: still, at anchor, heading as its form faces. */
export function newVehicle(heading: number): VehicleState {
  return { heading: finite(heading) ? heading : 0, speed: 0, turn: 0, thrust: 0, steer: 0, power: 1, anchored: true };
}

/** The state made sane in place (rule 7): what is not a number is nothing, what is out of range the nearest it may be. */
export function saneVehicle(v: Partial<VehicleState> & Record<string, unknown>, spec: VehicleSpec): VehicleState {
  v.heading = finite(v.heading) ? v.heading % (2 * Math.PI) : 0;
  v.speed = finite(v.speed) ? within(v.speed, [-spec.speed * REVERSE, spec.speed]) : 0;
  v.turn = finite(v.turn) ? within(v.turn, [-spec.turn, spec.turn]) : 0;
  v.thrust = finite(v.thrust) ? within(v.thrust, [-1, 1]) : 0;
  v.steer = finite(v.steer) ? within(v.steer, [-1, 1]) : 0;
  v.power = finite(v.power) ? within(v.power, [0, 1]) : 1;
  v.anchored = v.anchored !== false;
  if (typeof v.helm !== 'string' || !v.helm) delete v.helm;
  if (v.bumped !== true) delete v.bumped;
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

/** Where a point carried by a vehicle goes: the same place on its deck, the deck moved from `from` to `to` (middle and heading). */
export function carried(x: number, y: number, from: { x: number; y: number; heading: number }, to: { x: number; y: number; heading: number }): [number, number] {
  const [lx, lz] = toLocal(x - from.x, y - from.y, from.heading);
  const [wx, wy] = toWorld(lx, lz, to.heading);
  return [to.x + wx, to.y + wy];
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

/** What the menu and the world say of a vehicle, by what it moves on: a helm and an anchor on the water, the reins and a brake on land. */
export const VEHICLE_WORDS: Record<VehicleMedium, { take: string; leave: string; anchor: string; weigh: string; took: string; left: string; anchored: string; weighed: string; bumped: string; taken: string; aboard: string }> = {
  water: {
    take: 'Prendi il timone',
    leave: 'Lascia il timone',
    anchor: "Getta l'ancora",
    weigh: "Leva l'ancora",
    took: 'Prendi il timone.',
    left: 'Lasci il timone.',
    anchored: "Getti l'ancora.",
    weighed: "Levi l'ancora.",
    bumped: 'Lo scafo urta e si ferma.',
    taken: 'Al timone c’è già qualcuno.',
    aboard: 'Devi essere a bordo.',
  },
  land: {
    take: 'Mettiti alla guida',
    leave: 'Lascia la guida',
    anchor: 'Tira il freno',
    weigh: 'Togli il freno',
    took: 'Ti metti alla guida.',
    left: 'Lasci la guida.',
    anchored: 'Tiri il freno.',
    weighed: 'Togli il freno.',
    bumped: 'Le ruote urtano e si fermano.',
    taken: 'Alla guida c’è già qualcuno.',
    aboard: 'Devi esserci sopra.',
  },
};
