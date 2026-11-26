// T513: the houses of sidera walked as the world walks them. The kernel's walk (`walkIn`) jumps as the world's jump, looking at every tenth of a
// tile on the way, so it no longer goes through the wall between two rooms; the Sculptor's checks want every room of the ground floor reached
// from the door (`closedRoomErrors`), and the house of sidera whose middle wall has no door (the stair behind it) is refused with the reason;
// a solid thing the plan puts inside a structure never shuts what a body walks there (`Kernel.shutsInside`, the world's collision).

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkSeed, filesOf } from '../src/kernel/agents/sculptor';
import { bundledFiles } from '../src/kernel/bundle';
import { walkIn } from '../src/kernel/forms';
import { roomsReached } from '../src/kernel/interior';
import { classOf } from '../src/mj/classes';
import { closedRoomErrors, CLOSED_ROOM } from '../src/mj/check';
import type { VoxelGrid } from '../src/mj/mesh';
import { boot } from './world';

const VPT = 16;

/**
 * A house by hand, at 16 voxels a tile: a floor, a roof over it, walls around with a door in the front (+y), and a wall across its middle as
 * high as the roof, `thick` voxels, with a door in it or not.
 */
function house(opts: { thick: number; middleDoor: boolean }): VoxelGrid {
  const X = 64, Y = 80, Z = 40;
  const cells = new Uint8Array(X * Y * Z);
  const set = (x: number, y: number, z: number) => (cells[x + y * X + z * X * Y] = 1);
  for (let y = 4; y < Y - 4; y++)
    for (let x = 4; x < X - 4; x++) {
      set(x, y, 0);
      set(x, y, 36);
    }
  for (let z = 1; z < 36; z++)
    for (let y = 4; y < Y - 4; y++)
      for (let x = 4; x < X - 4; x++) {
        const edge = x < 7 || x >= X - 7 || y < 7 || y >= Y - 7;
        const frontDoor = y >= Y - 7 && x >= 26 && x < 38 && z < 32;
        const mid = y >= 36 && y < 36 + opts.thick;
        const midDoor = opts.middleDoor && x >= 26 && x < 38 && z < 32;
        if ((edge && !frontDoor) || (mid && !midDoor)) set(x, y, z);
      }
  return { X, Y, Z, cells, alphabet: ['.', 'A'] };
}
const PALETTE = { A: { color: '808080' } };

describe('il cammino del kernel non salta attraverso un tramezzo (T513)', () => {
  it('un tramezzo più sottile di una casella, senza porta, chiude la stanza dietro', () => {
    const w = walkIn(house({ thick: 5, middleDoor: false }), PALETTE, VPT, 0, [], 1);
    const { rooms } = roomsReached(w, VPT);
    expect(rooms.length).toBe(2);
    expect(rooms.filter((r) => r.reached).length).toBe(1);
    expect(closedRoomErrors(rooms)[0]).toMatch(/^stanze: una stanza a terra di [\d,]+ caselle² non si raggiunge a piedi dalla porta/);
  });
  it('con la porta nel tramezzo si raggiungono le due stanze, anche a piedi senza salti', () => {
    for (const jumps of [true, false]) {
      const w = walkIn(house({ thick: 5, middleDoor: true }), PALETTE, VPT, 0, [], 1, { jumps });
      const { rooms } = roomsReached(w, VPT);
      expect(rooms.length).toBe(2);
      expect(rooms.every((r) => r.reached)).toBe(true);
      expect(closedRoomErrors(rooms)).toEqual([]);
    }
  });
  it('un muretto basso si salta ancora, come nel mondo', () => {
    // The middle wall a third of a tile high: the walk jumps over it; on foot it does not pass it.
    const g = house({ thick: 5, middleDoor: false });
    const { X, Y } = g;
    for (let z = 6; z < 36; z++) for (let y = 36; y < 41; y++) for (let x = 7; x < X - 7; x++) g.cells[x + y * X + z * X * Y] = 0;
    expect(roomsReached(walkIn(g, PALETTE, VPT, 0, [], 1), VPT).rooms.every((r) => r.reached)).toBe(true);
    expect(roomsReached(walkIn(g, PALETTE, VPT, 0, [], 1, { jumps: false }), VPT).rooms.some((r) => !r.reached)).toBe(true);
  });
  it('una stanzina sotto CLOSED_ROOM non è una stanza da raggiungere', () => {
    expect(closedRoomErrors([{ area: CLOSED_ROOM - 0.1, reached: false }, { area: 5, reached: true }])).toEqual([]);
    expect(closedRoomErrors([{ area: 2, reached: false }, { area: 3, reached: false }])[0]).toMatch(/^stanze: 2 stanze a terra \(2,0, 3,0 caselle²\)/);
  });
});

describe('la Residenza modulare di sidera (T513)', () => {
  // Its program as the run of 26/11 found it: the door of the middle wall is asked on a layer where no wall stands (`f/Y/Y/Y/Y/Y/f`).
  const xml = readFileSync(new URL('./fixtures/sidera-residenza-modulare.xml', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  it('i controlli dello Scultore la rifiutano col motivo: la stanza sul retro con la scala non si raggiunge', () => {
    const cls = classOf('structure')!;
    for (const seed of [1, 2]) {
      const error = checkSeed(xml, cls, undefined, seed, filesOf(xml, bundledFiles), { dwelling: true });
      expect(error).toMatch(/piani: 1 \(serve ≥ 2\)/);
      expect(error).toMatch(/stanze: una stanza a terra di [\d,]+ caselle² non si raggiunge a piedi dalla porta/);
    }
  }, 60_000);
});

describe('una cosa solida posata dentro una struttura non chiude il cammino (T513)', () => {
  it('sulla soglia chiude, fuori dalla struttura no', async () => {
    const k = await boot();
    const kk = k as any;
    // A structure of the seed's world with its form ready, and the generic furniture as the thing.
    let sid: number | undefined;
    for (let i = 0; i < 300 && sid === undefined; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 20));
      sid = k.ecs.query('structure', 'form').find((id) => {
        const f = k.ecs.get(id, 'form');
        const p = k.ecs.get(id, 'pos');
        return !!k.forms.ready(f.model, f.seed, f.tint) && !!p && !!k.lotAt(p.x, p.y)?.lot.doors.length && !!kk.insideWalk(id);
      });
    }
    expect(sid).toBeDefined();
    const w = kk.insideWalk(sid!);
    await k.forms.settled('furniture', 1);
    const thing = { model: 'furniture', seed: 1, yaw: 0, f: k.forms.ready('furniture', 1)! };
    const p = k.ecs.get(sid!, 'pos');
    const { chunk, lot } = k.lotAt(p.x, p.y)!;
    const S = k.config.chunkSize;
    const door = lot.doors[0];
    // From the lot's door to the middle of the structure: the doorway is somewhere on the way, and a thing there shuts the rooms behind it.
    const dx = chunk.cx * S + (door % S) + 0.5, dy = chunk.cy * S + Math.floor(door / S) + 0.5;
    let shut = 0;
    for (let t = 0; t <= 1.001; t += 0.05) if (kk.shutsInside(w, thing, dx + (p.x - dx) * t, dy + (p.y - dy) * t)) shut++;
    expect(shut).toBeGreaterThan(0);
    // At the corner of the window it walks, out of the structure, nothing is shut.
    expect(kk.shutsInside(w, thing, w.x0 + 0.3, w.y0 + 0.3)).toBe(false);
  }, 120_000);
});
