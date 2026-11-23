// The Physicist with the world on (T452, ADR-0235): what it may reshape of the physics after the Genesis, and how the kernel reads what it
// says. A terrain's crossing, pace, fatigue, depth and air, and the gravity of the world: each within the kernel's limits (`nature.ts`), never
// clamped here but refused with the reason, which goes back to the Physicist once. What stays fixed: the layer of a terrain (walls, trees and
// rocks are never crossed, floors and doors always walked, only a liquid is swum), the crossing and the depth of a base code (the engine and
// the draft rely on them), the void (the kernel's), and of the nature all but the gravity (the geography makes the drafts, the day the clock,
// the sky goes with the geography, the breath is not open). Whether a new crossing would cut a place (rule 10) the kernel measures on its places
// (`Kernel.crossingBreaks`): this file only says which codes change how they are crossed. Pure: no kernel, no models.

import { BASE_CODES } from './agents/genesis';
import { CROSSINGS, DEPTHS, NATURE_ACCEPTS, SWIM_PACE, TERRAIN_LIMITS, WATER_CODES, crossingOf, isVoid, terrainPhysicsErrors, type Crossing, type WaterDepth, type WorldNature } from './nature';
import type { TerrainDef } from './types';

/** What the Physicist says of one terrain, as read: nothing of it is trusted. */
export interface TerrainChange {
  code?: unknown;
  cross?: unknown;
  speed?: unknown;
  fatigue?: unknown;
  depth?: unknown;
  air?: unknown;
}

/** The fields of a terrain the Physicist may reshape with the world on. */
export const RESHAPED_TILE_FIELDS = ['cross', 'speed', 'fatigue', 'depth', 'air'] as const;

/** The fields of the nature the Physicist may reshape with the world on: the rest is the Genesis's (`keptNature`). */
export const RESHAPED_NATURE = ['gravity', 'automata'] as const satisfies ReadonlyArray<keyof WorldNature>;

/** At most this many terrains in one request (a palette has at most 24). */
export const MAX_RESHAPED = 8;

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isCrossing = (v: unknown): v is Crossing => typeof v === 'string' && (CROSSINGS as readonly string[]).includes(v);
const isDepth = (v: unknown): v is WaterDepth => typeof v === 'string' && (DEPTHS as readonly string[]).includes(v);
const round = (v: number) => Math.round(v * 100) / 100;

/** The crossing a layer fixes, whatever is said: walls, vegetation and rock are never crossed, floors and doors always walked. */
function fixedCrossing(layer: TerrainDef['layer']): Crossing | undefined {
  if (layer === 'wall' || layer === 'vegetation' || layer === 'rock') return 'none';
  if (layer === 'floor' || layer === 'door') return 'walk';
  return undefined;
}

/** How a crossing is said in the world's feed. */
export const crossingWords = (c: Crossing): string => (c === 'walk' ? 'si cammina' : c === 'swim' ? 'si nuota' : 'non si attraversa');

export type Reshaped = { ok: true; tile: TerrainDef; changed: string[] } | { ok: false; reason: string };

/**
 * One terrain as the Physicist reshapes it, or why not. The tile that comes out says its physics whole (`cross`, `solid` coherent with it,
 * the pace in the range of its crossing, the fatigue and the depth only where one swims), as `physicsOf` writes a palette of 0.10; what the
 * Physicist does not say stays as it was. Nothing is clamped: a value outside the kernel's limits is refused with them.
 */
export function reshapedTerrain(code: string, tile: TerrainDef | undefined, change: TerrainChange): Reshaped {
  const no = (reason: string): Reshaped => ({ ok: false, reason: `«${tile?.name ?? code}» (${code}): ${reason}` });
  if (!tile || code === '?') return no('non è un terreno di questo mondo');
  if (isVoid(tile)) return no('il vuoto è del kernel: la sua fisica non cambia');
  const base = BASE_CODES[code];
  const layer = tile.layer ?? (tile.solid ? 'rock' : 'ground');
  const was = crossingOf(tile);
  if (change.cross !== undefined && !isCrossing(change.cross)) return no(`cross è uno tra ${CROSSINGS.join(', ')}`);
  const cross: Crossing = (change.cross as Crossing | undefined) ?? was;
  if (cross !== was) {
    if (base) return no(`è un codice di base: come si attraversa è del kernel (${crossingWords(was)})`);
    const fixed = fixedCrossing(layer);
    if (fixed && fixed !== cross) return no(`il suo strato (${layer}) ${crossingWords(fixed)}, sempre`);
    if (cross === 'swim' && layer !== 'liquid') return no('si nuota solo un liquido');
    if (cross === 'walk' && layer === 'liquid') return no('un liquido non si cammina: si nuota o non si attraversa');
  }
  if (change.depth !== undefined) {
    if (!isDepth(change.depth)) return no(`depth è uno tra ${DEPTHS.join(', ')}`);
    if (cross !== 'swim') return no('la profondità è solo di ciò che si nuota');
    const fixedDepth = WATER_CODES[code];
    if (fixedDepth && change.depth !== fixedDepth) return no(`è un'acqua di base: la sua profondità è del kernel (${fixedDepth})`);
  }
  if (change.fatigue !== undefined && cross !== 'swim') return no('la fatica è solo di ciò che si nuota');
  if (change.speed !== undefined && cross === 'none') return no('ciò che non si attraversa non ha un passo');
  if (change.air !== undefined && typeof change.air !== 'boolean') return no('air è vero o falso');
  if (change.air !== undefined && base) return no("è un codice di base: l'aria vi resta com'è");
  for (const k of ['speed', 'fatigue'] as const) if (change[k] !== undefined && !finite(change[k])) return no(`${k} è un numero`);

  // The tile with the change: a crossing that changes takes the pace of its range (the one said, or its default) and drops what it no longer has.
  const next: TerrainDef = { ...tile, cross, solid: cross !== 'walk' };
  const [wlo, whi] = TERRAIN_LIMITS.walkPace;
  if (finite(change.speed)) next.speed = round(change.speed);
  else if (cross !== was) next.speed = cross === 'swim' ? SWIM_PACE : Math.min(whi, Math.max(wlo, finite(tile.speed) ? tile.speed : 1));
  if (cross === 'swim') {
    if (finite(change.fatigue)) next.fatigue = round(change.fatigue);
    next.depth = (change.depth as WaterDepth | undefined) ?? WATER_CODES[code] ?? (isDepth(tile.depth) ? tile.depth : 'deep');
  } else {
    delete next.fatigue;
    delete next.depth;
  }
  if (typeof change.air === 'boolean') next.air = change.air;
  // The kernel's limits, as the validator reads a manifest: the pace on foot too, which `terrainPhysicsErrors` leaves to the Genesis.
  const errors = terrainPhysicsErrors(code, next as unknown as Record<string, unknown>);
  if (cross === 'walk' && finite(next.speed) && (next.speed < wlo || next.speed > whi)) errors.push(`a piedi speed sta tra ${wlo} e ${whi}`);
  if (errors.length) return no(errors.map((e) => e.replace(/^tile "[^"]*": /, '')).join('; '));
  const changed = RESHAPED_TILE_FIELDS.filter((k) => (k === 'cross' ? cross !== was : JSON.stringify(next[k] ?? null) !== JSON.stringify(tile[k] ?? null)));
  if (!changed.length) return no('niente cambia');
  return { ok: true, tile: next, changed };
}

/** The gravity the Physicist says, or why not: within what this kernel accepts (0.2-2). */
export function reshapedGravity(g: unknown): { ok: true; gravity: number } | { ok: false; reason: string } {
  const [lo, hi] = NATURE_ACCEPTS.gravity;
  if (!finite(g) || g < lo || g > hi) return { ok: false, reason: `la gravità del mondo sta tra ${lo} e ${hi} (quella della terra è 1)` };
  return { ok: true, gravity: round(g) };
}

/**
 * The nature a universe.json says, against the one the world has: what the Physicist may reshape (the gravity and the cellular automata)
 * comes from what is said, the rest from the world's, fixed at the Genesis (`keepNature`). Both already repaired (`repairNature`).
 */
export function keptNature(world: WorldNature, said: WorldNature): WorldNature {
  const out: WorldNature = { ...world, gravity: said.gravity };
  if (said.automata?.length) out.automata = said.automata;
  else delete out.automata;
  return out;
}

/** The codes whose crossing differs between two palettes: those whose change the kernel measures on its places (rule 10). */
export function crossingChanged(before: Record<string, TerrainDef>, after: Record<string, TerrainDef>): string[] {
  return Object.keys(after).filter((c) => before[c] && crossingOf(before[c]) !== crossingOf(after[c]));
}

/** How a terrain reshaped is said in the feed: «Fango: non si attraversa, passo ×0,5». */
export function reshapedWords(t: TerrainDef, changed: readonly string[]): string {
  const parts: string[] = [];
  if (changed.includes('cross')) parts.push(crossingWords(crossingOf(t)));
  if (changed.includes('speed') && finite(t.speed)) parts.push(`passo ×${String(t.speed).replace('.', ',')}`);
  if (changed.includes('fatigue') && finite(t.fatigue)) parts.push(`fatica ×${String(t.fatigue).replace('.', ',')}`);
  if (changed.includes('depth') && t.depth) parts.push(t.depth === 'shallow' ? 'acqua bassa' : t.depth === 'reef' ? 'secca' : 'acqua profonda');
  if (changed.includes('air')) parts.push(t.air === false ? 'senz’aria' : 'con l’aria');
  return `${t.name}: ${parts.join(', ')}`;
}
