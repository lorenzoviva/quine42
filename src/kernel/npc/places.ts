// Where the people go and how they get there (T327, ADR-0166; T245b, T281, T299): the spot of a routine step in their place (a bed,
// a field, the square), the nearest tile of a terrain, and the next point of the way for `world.path`, with the ways kept for a while.
// Part of `npc/`: the facade (`index.ts`) owns it; it reads the world only through the port (`host.ts`).

import type { Id } from '../ecs';
import type { Identity } from '../agents/content';
import { hashStr } from '../rng';
import type { TerrainDef } from '../types';
import type { NpcHost, NpcPlace } from './host';
import { findRoute, RouteCache, ROUTE_AHEAD, ROUTE_BODY, ROUTE_NEAR, type Cell } from './route';
import type { Activity } from './society';

export class Places {
  constructor(private readonly host: NpcHost) {}

  /** The ways found go: the ground under them changed (a place laid, left, a tile changed). */
  forgetWays(): void {
    this.routes.clear();
  }

  private routes = new RouteCache();

  /**
   * Where a routine step happens: home (a lot of their place), work, the square — and for what
   * they do, the right spot: a bed to sleep, a field to hoe, a bank to fish, a wood to cut.
   */
  placeFor(id: Id, identity: Identity, where: string, activity?: Activity): { x: number; y: number } | undefined {
    if (where === 'about' && !activity) return undefined;
    const S = this.host.config.chunkSize;
    const key: string | undefined = this.host.ecs.get(id, 'chunk')?.key;
    const p = this.host.ecs.get(id, 'pos');
    const ch = (key ? this.host.chunks.get(key) : undefined) ?? this.host.chunkAt(p.x, p.y);
    if (!ch || ch.stage !== 'planned') return undefined;
    const h = hashStr(identity.name);
    const tile = (i: number) => ({ x: ch.cx * S + (i % S) + 0.5, y: ch.cy * S + Math.floor(i / S) + 0.5 });
    const free = (i: number) => !this.host.palette[ch.tiles[i]]?.solid;
    const around = (i: number, pred: (t: TerrainDef | undefined) => boolean) => [i - 1, i + 1, i - S, i + S].some((n) => n >= 0 && n < S * S && pred(this.host.palette[ch.tiles[n]]));
    const pickTile = (pred: (i: number) => boolean) => {
      const list: number[] = [];
      for (let i = 0; i < S * S; i++) if (free(i) && pred(i)) list.push(i);
      return list.length ? tile(list[h % list.length]) : undefined;
    };
    if (activity === 'sleep') {
      // A bed of their place, always the same one.
      const beds = this.host.ecs.query('module', 'pos').filter((e) => {
        const m = this.host.modules.get(this.host.ecs.get(e, 'module').id)?.manifest;
        const ep = this.host.ecs.get(e, 'pos');
        return !!m && /letto|giaciglio|branda|pagliericcio|amaca/i.test(`${m.name} ${(m.tags ?? []).join(' ')}`) && this.host.chunkAt(ep.x, ep.y) === ch;
      });
      if (beds.length) {
        const bp = this.host.ecs.get(beds[h % beds.length], 'pos');
        return { x: bp.x + 0.6, y: bp.y };
      }
    }
    if (activity === 'hoe') {
      const field = pickTile((i) => /campo|orto|arato|solchi/i.test(this.host.palette[ch.tiles[i]]?.name ?? ''));
      if (field) return field;
    }
    if (activity === 'fish') {
      const bank = pickTile((i) => around(i, (t) => t?.layer === 'liquid'));
      if (bank) return bank;
    }
    if (activity === 'chop_wood') {
      const edge = pickTile((i) => around(i, (t) => t?.layer === 'vegetation'));
      if (edge) return edge;
    }
    if (where === 'about') return undefined;
    if (where === 'home' || activity === 'sleep' || activity === 'pray' || (where === 'work' && /fabbr|forn|oste|locand|bottega|mercant|sart|panett|cuoc|tessit|speziale|scriv|mago|monac/i.test(identity.job ?? ''))) {
      const bs = ch.lots.filter((b) => b.floor.some(free));
      if (bs.length) {
        const b = bs[(h + (where === 'work' ? 1 : 0)) % bs.length];
        // Home is the floor of the house's model, inside its walls (its lot, until the model is ready).
        const sid = this.host.ecs.query('structure', 'origin').find((e) => this.host.ecs.get(e, 'origin').key === `${ch.key}#s${ch.lots.indexOf(b)}`);
        const inside = sid !== undefined ? this.host.interiorPoints(sid) : [];
        if (inside.length) return inside[h % inside.length];
        const floor = b.floor.filter(free);
        return tile(floor[h % floor.length]);
      }
    }
    if (where === 'square') {
      const pathCode = this.host.palette.p ? 'p' : undefined;
      const centre = (S * S) / 2 + S / 2;
      let best = -1;
      for (let i = 0; i < S * S; i++) if ((pathCode ? ch.tiles[i] === pathCode : free(i)) && (best < 0 || Math.abs(i - centre) < Math.abs(best - centre))) best = i;
      if (best >= 0) return tile(best);
    }
    // Work outdoors (fields, woods, flock): a free spot of their place, always the same.
    for (let k = 0; k < 40; k++) {
      const i = (h + k * 7919) % (S * S);
      if (free(i)) return tile(i);
    }
    return undefined;
  }

  /**
   * The code of a terrain of the palette by its code, its internal id (T307a: «meadow») or its name in the language of the world
   * («prato»), in this order; undefined when none is.
   */
  tileCodeOf(word: unknown): string | undefined {
    if (typeof word !== 'string' || !word || word === '?') return undefined;
    if (this.host.palette[word]) return word;
    const codes = Object.keys(this.host.palette).filter((c) => c !== '?');
    const low = word.trim().toLowerCase();
    return codes.find((c) => this.host.palette[c].id === word) ?? codes.find((c) => this.host.palette[c].name.toLowerCase() === low);
  }

  /**
   * The centre of the nearest tile of a terrain (code, id or name) within r (at most 24) of a point: the nearest, then the first row, then
   * the first column. Not a tile of a lot (T281): a structure stands there, or will, and the grass under a house is not a pasture.
   */
  findTile(word: string, x: number, y: number, r: number): { x: number; y: number } | undefined {
    const code = this.tileCodeOf(word);
    if (!code || ![x, y].every(Number.isFinite)) return undefined;
    const R = Math.max(0, Math.min(24, Math.floor(Number.isFinite(r) ? r : 8)));
    const c0 = Math.floor(x);
    const r0 = Math.floor(y);
    const S = this.host.config.chunkSize;
    const lotTiles = new Map<NpcPlace, Set<number>>();
    const inLot = (col: number, row: number) => {
      const ch = this.host.chunkAt(col, row);
      if (!ch?.lots.length) return false;
      let tiles = lotTiles.get(ch);
      if (!tiles) lotTiles.set(ch, (tiles = new Set(ch.lots.flatMap((b) => [...b.floor, ...b.walls, ...b.doors]))));
      return tiles.has((row - ch.cy * S) * S + (col - ch.cx * S));
    };
    let best: { x: number; y: number; d: number } | undefined;
    for (let dr = -R; dr <= R; dr++)
      for (let dc = -R; dc <= R; dc++) {
        if (this.host.tileAt(c0 + dc, r0 + dr) !== code || inLot(c0 + dc, r0 + dr)) continue;
        const cx = c0 + dc + 0.5;
        const cy = r0 + dr + 0.5;
        const d = Math.hypot(cx - x, cy - y);
        if (!best || d < best.d - 1e-9) best = { x: cx, y: cy, d };
      }
    return best ? { x: best.x, y: best.y } : undefined;
  }

  /**
   * The next point of the way between two places of the world (carpet space), for a body of half-size `r` (none: a villager's):
   * on a way the cache keeps, the farthest of the next two tiles the body reaches in a straight line from where it is (T299: the
   * step goes where the way goes, it does not cut the corner the way went round), never nearer than `ROUTE_AHEAD` (who walks to it
   * takes it for arrived within a tile and more).
   */
  routeStep(x: number, y: number, tx: number, ty: number, r?: number, again = true): { x: number; y: number } | undefined {
    if (![x, y, tx, ty].every(Number.isFinite) || Math.hypot(tx - x, ty - y) > 60) return undefined;
    const body = Math.min(0.5, Math.max(0.1, typeof r === 'number' && Number.isFinite(r) ? r : ROUTE_BODY));
    const from = [Math.floor(x), Math.floor(y)] as const;
    const to = [Math.floor(tx), Math.floor(ty)] as const;
    // Passable as walking is (T299): the tile and the models standing on it (a wall of a house is a model, not a tile), and a step
    // only where the body passes between the two middles, as `free` sees a walk: what stands on the edge, a rise of more than a step.
    // Who stands where the middle of their tile is not free (by a wall, against a bench) leaves it as the tiles allow: the steps are
    // tried from that middle, where they are not.
    const startFree = this.host.free(from[0] + 0.5, from[1] + 0.5, body);
    const way: Cell[] | undefined = this.routes.get(
      from,
      to,
      this.host.ticks,
      () => findRoute(from, to, (c, rr) => this.host.free(c + 0.5, rr + 0.5, body), (c, rr, nc, nr) => (c === from[0] && rr === from[1] && !startFree) || this.routes.step(c, rr, nc, nr, String(body), this.host.ticks, () => this.stepFree(c, rr, nc, nr, body)), ROUTE_NEAR),
      String(body),
    );
    // A way kept that something now stops at its first step (a building gone up a stage, a thing put down): the ways are found again.
    if (again && startFree && way && way.length > 1 && !this.stepFree(way[0][0], way[0][1], way[1][0], way[1][1], body)) {
      this.routes.clear();
      return this.routeStep(x, y, tx, ty, r, false);
    }
    if (!way) return undefined;
    if (way.length <= 2) return { x: tx, y: ty };
    let next = way[1];
    if (way.length > 2 && this.walkable(x, y, way[2][0] + 0.5, way[2][1] + 0.5, body)) next = way[2];
    else if (!this.walkable(x, y, way[1][0] + 0.5, way[1][1] + 0.5, body)) next = way[0];
    // A direction more than a point: the walker asks again at every tick, from wherever it got to.
    let px = next[0] + 0.5, py = next[1] + 0.5;
    if (Math.hypot(px - x, py - y) < 1e-3) (px = way[1][0] + 0.5), (py = way[1][1] + 0.5);
    const d = Math.hypot(px - x, py - y);
    const k = Math.max(1, ROUTE_AHEAD / d);
    return { x: x + (px - x) * k, y: y + (py - y) * k };
  }

  /**
   * Whether a body (half-size r, under half a tile) steps from the middle of a free tile to the middle of the next: with no model on
   * the tiles the step touches, the tiles say it all (the box stays inside them, and the ground is never in the way); else, walked.
   */
  private stepFree(c: number, r: number, nc: number, nr: number, body: number): boolean {
    const h = this.host;
    if (!h.formOn(c, r) && !h.formOn(nc, nr) && !h.formOn(nc, r) && !h.formOn(c, nr)) return true;
    return this.walkable(c + 0.5, r + 0.5, nc + 0.5, nr + 0.5, body);
  }

  /**
   * Whether a body of half-size r walks in a straight line between two points (carpet space), from the floor under the first: `free`
   * every tenth of a tile (the steps of `stepWanderer`) at the height of its feet, which follow the floor as in a walk (up a stair, on the platform).
   */
  private walkable(x0: number, y0: number, x1: number, y1: number, r: number): boolean {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.1));
    let z = this.host.floorAt(x0, y0);
    for (let i = 1; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      if (!this.host.free(x, y, r, z)) return false;
      z = this.host.floorAt(x, y, z);
    }
    return true;
  }
}
