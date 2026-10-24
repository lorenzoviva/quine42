import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { playerFile } from '../src/kernel/wanderers';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';

const DT = 1 / 60;

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

/** Ticks the server until the places near everyone are planned (their plans are asynchronous). */
async function settle(server: SessionServer) {
  for (let i = 0; i < 80; i++) {
    server.tick(DT);
    await new Promise((r) => setTimeout(r, 25));
    if ([...server.kernel.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  for (let i = 0; i < 12; i++) server.tick(DT);
}

function join(server: SessionServer, id: string, nome?: string): SessionClient {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  return new SessionClient(c, { id, nome });
}

/** A run of free tiles toward east in the world, near where the wanderer is: where they can walk straight. */
function freeRun(k: Kernel, id: string, length: number): { x: number; y: number } {
  const at = k.wandererAt(id)!;
  for (let d = 0; d < 30; d++)
    for (const row of [Math.floor(at.y) + d, Math.floor(at.y) - d])
      for (let col = Math.floor(at.x) - 30; col < Math.floor(at.x) + 10; col++) {
        let ok = true;
        for (let i = 0; i <= length && ok; i++) ok = k.free(col + i + 0.5, row + 0.5, 0.35) && k.tileAt(col + i, row) !== undefined;
        if (ok) return { x: col + 0.5, y: row + 0.5 };
      }
  throw new Error('nessun tratto libero');
}

/** Puts a wanderer of the session somewhere in the world (their carpet under them), as a test does by hand. */
function put(k: Kernel, id: string, to: { x: number; y: number }) {
  k.as(id, () => {
    const p = k.playerPos();
    Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  });
}

describe('the kernel on the server (T38)', () => {
  it('two clients see the same world: places, things, each other', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = join(server, 'anna', 'Anna');
    const bruno = join(server, 'bruno', 'Bruno');
    await Promise.all([anna.ready, bruno.ready]);
    expect(anna.refused).toBeUndefined();
    expect(server.connected()).toEqual(['anna', 'bruno']);
    // They come in with the universe's files: the same world.
    expect(anna.files['universe.json']).toBe(k.files['universe.json']);
    expect(Object.keys(bruno.files).length).toBe(Object.keys(k.files).length);
    await settle(server);
    // The places both have are the same tiles as the server's.
    const common = [...anna.places.keys()].filter((key) => bruno.places.has(key));
    expect(common.length).toBeGreaterThan(0);
    for (const key of common) {
      expect(anna.places.get(key)!.tiles).toBe(k.chunks.get(key)!.tiles);
      expect(bruno.places.get(key)!.tiles).toBe(anna.places.get(key)!.tiles);
    }
    // The things both see are where the server has them (to the last update: one more tick period).
    for (let i = 0; i < 6; i++) server.tick(DT);
    const things = [...anna.things.keys()].filter((id) => bruno.things.has(id));
    expect(things.length).toBeGreaterThan(0);
    for (const id of things) {
      const a = anna.things.get(id)!;
      const b = bruno.things.get(id)!;
      expect([a.x, a.y, a.m]).toEqual([b.x, b.y, b.m]);
    }
    // Each sees the other where the server has them.
    const b = k.wandererAt('bruno')!;
    expect(anna.others.get('bruno')).toMatchObject({ nome: 'Bruno', x: Math.round(b.x * 1000) / 1000 });
    expect(bruno.others.has('anna')).toBe(true);
    // Each has a carpet of their own: one walks, the other stays where they were.
    const start = freeRun(k, 'anna', 6);
    put(k, 'anna', start);
    const before = k.wandererAt('bruno')!;
    for (let i = 1; i <= 30; i++) {
      anna.move(start.x + i * 0.08, start.y);
      server.tick(DT);
    }
    expect(k.wandererAt('anna')!.x).toBeCloseTo(start.x + 2.4, 1);
    expect(k.wandererAt('bruno')).toMatchObject({ x: before.x, y: before.y });
  });

  it('a client that cheats on its speed is corrected; one that walks is not', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    await anna.ready;
    await settle(server);
    const start = freeRun(k, 'anna', 16);
    put(k, 'anna', start);
    for (let i = 0; i < 40; i++) server.tick(DT);
    // Walking at the pace of the wanderer (6 tiles a second): every step passes.
    for (let i = 1; i <= 30; i++) {
      anna.move(start.x + i * 0.09, start.y);
      server.tick(DT);
    }
    expect(anna.corrections).toBe(0);
    const walked = k.wandererAt('anna')!;
    expect(walked.x).toBeCloseTo(start.x + 2.7, 2);
    // Now a tile per frame (60 a second): the server lets through what the pace allows, and says where they are.
    for (let i = 1; i <= 30; i++) {
      anna.move(walked.x + i, walked.y);
      server.tick(DT);
    }
    expect(anna.corrections).toBeGreaterThan(0);
    const after = k.wandererAt('anna')!;
    expect(after.x - walked.x).toBeLessThan(k.paceOf('anna') * (0.5 + 0.5 * 1.15) + 0.5);
    expect(after.x - walked.x).toBeGreaterThan(1);
    // The client knows where it really is.
    expect(anna.me!.x).toBeCloseTo(after.x, 2);
    // Nor through what is not a number.
    anna.move(NaN, 0);
    server.tick(DT);
    expect(k.wandererAt('anna')!.x).toBe(after.x);
    // Nor through what blocks: a free tile with a solid one east of it.
    const at = k.wandererAt('anna')!;
    let wall: { col: number; row: number } | undefined;
    for (let d = 0; d < 40 && !wall; d++)
      for (let row = Math.floor(at.y) - d; row <= Math.floor(at.y) + d && !wall; row++)
        for (let col = Math.floor(at.x) - d; col <= Math.floor(at.x) + d && !wall; col++)
          if (k.free(col + 0.5, row + 0.5, 0.35) && !k.free(col + 1.5, row + 0.5, 0.05)) wall = { col, row };
    expect(wall).toBeDefined();
    put(k, 'anna', { x: wall!.col + 0.5, y: wall!.row + 0.5 });
    const was = anna.corrections;
    for (let i = 1; i <= 15; i++) {
      anna.move(wall!.col + 0.5 + i * 0.08, wall!.row + 0.5);
      server.tick(DT);
    }
    expect(anna.corrections).toBeGreaterThan(was);
    expect(k.wandererAt('anna')!.x).toBeLessThan(wall!.col + 1);
  });

  it('actions come back with what came of them; who leaves is saved and gone', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    const bruno = join(server, 'bruno');
    await Promise.all([anna.ready, bruno.ready]);
    await settle(server);
    k.as('anna', () => k.give('rune:luce', 1));
    // The phrase holds only the runes they carry.
    const ok = anna.act({ t: 'frase', tokens: ['luce'] });
    server.tick(DT);
    expect(await ok).toMatchObject({ ok: true });
    const no = anna.act({ t: 'frase', tokens: ['fuoco'] });
    server.tick(DT);
    expect((await no).ok).toBe(false);
    for (let i = 0; i < 6; i++) server.tick(DT);
    expect(anna.stato.hand?.tokens).toEqual([]);
    expect(bruno.stato.hand?.tokens ?? []).toEqual([]);
    // What is far is out of reach; what does not exist is not there.
    const far = [...anna.things.values()].find((t) => Math.hypot(t.x - anna.me!.x, t.y - anna.me!.y) > 6);
    if (far) {
      const r = anna.act({ t: 'chat', entita: far.id, testo: 'ciao' });
      server.tick(DT);
      expect(await r).toMatchObject({ ok: false, motivo: 'è troppo lontano' });
    }
    const none = anna.act({ t: 'altro', entita: 999999, testo: 'lo accarezzo' });
    server.tick(DT);
    expect((await none).ok).toBe(false);
    // The same wanderer cannot come in twice.
    const twin = join(server, 'anna');
    await twin.ready;
    expect(twin.refused).toBeTruthy();
    // Bruno leaves: Anna no longer sees him, his state is in his file.
    bruno.leave();
    for (let i = 0; i < 6; i++) server.tick(DT);
    expect(server.connected()).toEqual(['anna']);
    expect(k.wanderers().map((w) => w.id)).not.toContain('bruno');
    expect(anna.others.has('bruno')).toBe(false);
    expect(k.files[playerFile('bruno')]).toBeTruthy();
  });
});
