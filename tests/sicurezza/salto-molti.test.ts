// V-047 (T477, ADR-0251): the jump and the climb in a game of many. A client says only that it jumps (a direction) or climbs (a tile beside
// it, through `tile`): the server makes them on its world, with its rules and the means the wanderer has there, carries the body and takes no
// step of the client meanwhile; once it has landed, the server's place is the one that counts. A jump of garbage throws nothing and moves nobody
// beyond what a jump on the server's world reaches; a step onto the top of a cliff without a climb is stopped by the cliff (rule 10).

import { describe, expect, it } from 'vitest';
import { CLIMB_ACTION } from '../../src/kernel/climb';
import { edgeOf, holdRope, many, near, plateau } from '../cliff';

describe('V-047 · the jump and the climb in a game of many', () => {
  it('V-047 what the client claims counts for nothing: a jump of garbage, steps while the server carries, the top without a jump', async () => {
    const w = await many(plateau(8));
    const { col: e, row } = edgeOf(w.k, 8, near)!;
    w.put(e - 0.5, row + 0.5);
    // A jump whose direction is not numbers: the server jumps where Anna faces, on its world, or not at all; nothing throws.
    const raw = w.c.send as (m: unknown) => void;
    raw({ t: 'jump', dx: 'east', dy: { valueOf: 1 } });
    raw({ t: 'jump', dx: Infinity, dy: null });
    w.frames(60);
    expect(w.where().server.x).toBeLessThan(e);
    // On the server's climb (the rope there only), the client says it is already on top: not taken; landed, the server's word.
    w.k.as('anna', () => holdRope(w.k));
    expect(w.k.as('anna', () => w.k.climbTo(e, row))).toBe(true);
    w.c.send({ t: 'step', seq: 9000, x: e + 3.5, y: row + 0.5 });
    w.frames(1);
    expect(w.k.carriedBody('anna')).toBe(true);
    expect(w.where().server.x).toBeLessThan(e);
    // The top without a climb: the cliff stops the step, the client is put back.
    const k2 = await many(plateau(8));
    const ed = edgeOf(k2.k, 8, near)!;
    k2.put(ed.col - 0.5, ed.row + 0.5);
    k2.c.send({ t: 'step', seq: 9001, x: ed.col + 0.5, y: ed.row + 0.5 });
    k2.frames(2);
    expect(k2.where().server.x).toBeLessThan(ed.col);
    // A climb asked of the server without a means: refused.
    const r = await new Promise<{ ok: boolean }>((done) => {
      k2.c.onMessage((m) => void (m.t === 'result' && m.seq === 77 && done(m)));
      k2.c.send({ t: 'tile', seq: 77, col: ed.col, row: ed.row, action: CLIMB_ACTION });
      k2.frames(2);
    });
    expect(r.ok).toBe(false);
    expect(k2.k.carriedBody('anna')).toBe(false);
  }, 180_000);
});
