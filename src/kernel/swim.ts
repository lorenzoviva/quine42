// The body that swims (T438, ADR-0224 § 1 and § 4): what the kernel does of a wanderer in the water one swims, in every universe. The
// pace is the tile's (`terrainPhysics`, through `world.speed_at`); the fatigue, the drowning, the load that stops at the shore and how deep
// the body sinks on the screen are here, numbers of the kernel the world's code does not change: a universe that rewrote `sys.needs`
// drowns as the seed's does. Pure: the kernel calls them with what it reads of the wanderer.

/**
 * The energy a second of walking costs (the seed's `sys.needs`: 0.06 a second, 1.6 times as much walking). In the water the kernel takes
 * `fatigue − 1` times as much again, whether the body moves or keeps afloat: with the seed's needs a swimmer tires `fatigue` times as fast as
 * a walker (3 if the Physicist said nothing: about 347 seconds from full energy, § 1.2 of `docs/design/acqua-spazio.md`).
 */
export const WALK_ENERGY = 0.06 * 1.6;

/** The health a second of drowning costs (out of energy, in the water): as hunger and thirst cost it in the seed's `sys.needs`. */
export const DROWN_HEALTH = 0.6;

/** More than this share of what one carries without slowing down, and the deep water is not entered (§ 1.1: «Troppo carico per nuotare»). */
export const SWIM_LOAD = 0.5;

/** How far under the water's surface the feet of a swimmer go, in tiles: the body sinks to the chest (a figure is about 1.2 tall). */
export const SWIM_SINK = 0.78;

/** The cause of a death in the water, as `player.death` says it (with «sete», «fame», «ferite»). */
export const DROWNED = 'annegato';

/** What the world says to who is too loaded to swim, at the shore (once in a while, not at every step). */
export const TOO_LOADED = 'Sei troppo carico per nuotare: posa qualcosa prima di entrare nell’acqua profonda.';
export const TOO_LOADED_EVERY = 4;

/** Needs as the kernel reads them in the water: numbers the world's code may have broken (rule 7: what is not a number is not drained). */
export interface SwimNeeds {
  energy: number;
  health: number;
  dead?: boolean;
}

/**
 * A tick in the water (`dt` seconds, a tile of fatigue `fatigue`): the energy the kernel takes, and once it is gone the health. True when the
 * swimmer has drowned this tick (the health is out; the kernel then says the death, `player.death`, with the game's level).
 */
export function swimTick(n: SwimNeeds, fatigue: number, dt: number): boolean {
  if (!(dt > 0) || !Number.isFinite(dt) || n.dead) return false;
  const f = Number.isFinite(fatigue) ? Math.max(1, fatigue) : 1;
  if (Number.isFinite(n.energy)) n.energy = Math.max(0, n.energy - WALK_ENERGY * (f - 1) * dt);
  if (!(n.energy > 0) && Number.isFinite(n.health)) {
    n.health = Math.max(0, n.health - DROWN_HEALTH * dt);
    if (n.health <= 0) {
      n.dead = true;
      return true;
    }
  }
  return false;
}

/** Whether a wanderer is too loaded for the deep water: more than half of what they carry without slowing down, or a thing over the head. */
export function tooLoadedToSwim(load: number, carriesThing: boolean): boolean {
  return carriesThing || (Number.isFinite(load) && load > SWIM_LOAD);
}
