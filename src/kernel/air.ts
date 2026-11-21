// The air and the breath (T446, ADR-0238, `docs/design/acqua-spazio.md` § 2.4): where a body breathes, and what the kernel does of a
// wanderer's breath where the world counts it (`nature.oxygen`). The air is a property of tiles, places and vehicles, never a gas: what
// says it is the terrain (`air`, true if not said; the void never), the vehicle whose deck one stands on (`vehicle.air`), the master's
// region, the environment of the place, the body of the void (an asteroid has none); the first that says wins, in that order, the terrain's
// «none» before all but a deck. The need `oxygen` (0-100) exists only in a world that counts the breath: the kernel adds it to the needs,
// drains it out of the air, gives it back in the air, and at zero the health goes: asphyxia, a cause of `player.death`. A universe that
// rewrote `sys.needs` breathes as the seed's does; the client never writes it (the needs are the kernel's components). Pure.

import type { Body } from './islands';

/** How much oxygen a second out of the air costs: about 100 in two minutes (§ 2.4). */
export const OXYGEN_DRAIN = 100 / 120;

/** How much a second in the air gives back: quickly, about 100 in five seconds. */
export const OXYGEN_REFILL = 20;

/** The health a second of asphyxia costs (out of oxygen): quickly, more than hunger and thirst (0.6), about 100 in fifty seconds. */
export const ASPHYXIA_HEALTH = 2;

/** The most a worn suit slows the breath running out (a bonus `breath` of what is worn: 10, a suit; 2-3, a mask). */
export const BREATH_LIMITS = [1, 10] as const;

/** The full oxygen, at the start and at every revival. */
export const FULL_OXYGEN = 100;

/** The cause of a death without air, as `player.death` says it (with «sete», «fame», «annegato», «ferite»). */
export const ASPHYXIATED = 'asfissia';

/** What the world says once, when the air runs out around the wanderer and when it comes back. */
export const NO_AIR = 'Qui non c’è aria: il fiato comincia a mancare.';
export const AIR_AGAIN = 'Torni a respirare.';

/** What may say whether there is air at a point, from the most to the least close to the body. */
export interface AirSaid {
  /** On a vehicle's deck: whether the vehicle holds air (a capsule). Only true says: an open deck is the tile's. */
  deck?: boolean;
  /** The terrain of the tile (`terrainPhysics(...).air`): false, no air there whatever else says. */
  terrain: boolean;
  /** A region of the master that says it (`regionAir`), true or false. */
  region?: boolean;
  /** The environment of the place (`EnvironmentDef.air`): only false says. */
  environment?: boolean;
  /** The body of the void the tile is on (T445): an asteroid has no air, a station has. */
  body?: Body;
}

/** Whether a body breathes at a point, from what says it (see the head of the file for the order). */
export function airOf(s: AirSaid): boolean {
  if (s.deck === true) return true;
  if (s.terrain === false) return false;
  if (typeof s.region === 'boolean') return s.region;
  if (s.environment === false) return false;
  return s.body !== 'asteroid';
}

/** How many times slower the breath runs out with what is worn: the largest `bonus.breath`, within the kernel's limits (1: nothing). */
export function breathOf(bonuses: ReadonlyArray<Record<string, unknown> | undefined>): number {
  let best: number = BREATH_LIMITS[0];
  for (const b of bonuses) {
    const v = b?.breath;
    if (typeof v === 'number' && Number.isFinite(v)) best = Math.max(best, Math.min(BREATH_LIMITS[1], v));
  }
  return best;
}

/** Needs as the kernel reads them for the breath: numbers the world's code may have broken (rule 7: what is not a number is set right). */
export interface BreathNeeds {
  oxygen?: number;
  health: number;
  dead?: boolean;
}

/**
 * A tick of breath (`dt` seconds): in the air the oxygen comes back, out of it it goes (`breath` times slower with a suit), and once it is
 * gone the health. An oxygen that is not a number is full (a needs of before, or broken). True when the body has died of it this tick
 * (the kernel then says the death, `player.death`, with the game's level).
 */
export function breathTick(n: BreathNeeds, air: boolean, breath: number, dt: number): boolean {
  if (!(typeof n.oxygen === 'number' && Number.isFinite(n.oxygen))) n.oxygen = FULL_OXYGEN;
  if (!(dt > 0) || !Number.isFinite(dt) || n.dead) return false;
  const slow = Number.isFinite(breath) ? Math.min(BREATH_LIMITS[1], Math.max(BREATH_LIMITS[0], breath)) : 1;
  n.oxygen = air ? Math.min(FULL_OXYGEN, n.oxygen + OXYGEN_REFILL * dt) : Math.max(0, n.oxygen - (OXYGEN_DRAIN / slow) * dt);
  if (!(n.oxygen > 0) && Number.isFinite(n.health)) {
    n.health = Math.max(0, n.health - ASPHYXIA_HEALTH * dt);
    if (n.health <= 0) {
      n.dead = true;
      return true;
    }
  }
  return false;
}
