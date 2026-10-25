// T42c: the players from the corona. The master's mirror knows every player connected and where they are: the
// situation table and the atlas show them on their chunk, and the master can follow one (the server sends what is
// around them) without leaving the studio. Alone there are none.
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';

const DT = 1 / 60;

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

function join(server: SessionServer, id: string, nome?: string): { client: SessionClient; heard: ServerMsg[] } {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const heard: ServerMsg[] = [];
  c.onMessage((m) => heard.push(m));
  return { client: new SessionClient(c, { id, ...(nome ? { nome } : {}) }), heard };
}

/** The server's world as some ticks go by, and what the clients sent meanwhile. */
async function run(server: SessionServer, ticks = 12): Promise<void> {
  for (let i = 0; i < ticks; i++) server.tick(DT);
  await new Promise((r) => setTimeout(r, 0));
}

/** A wanderer of the server carried far in the world: their carpet, as a rune would. */
function carry(k: Kernel, id: string, x: number, y: number): void {
  k.as(id, () => {
    const p = k.playerPos();
    Object.assign(k.carpet()!, { ox: x - p.x, oy: y - p.y });
  });
}

describe('the players from the corona (T42c)', () => {
  it('the master’s situation lists the players connected, each on their chunk; a player hears of none', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = join(server, 'io');
    const anna = join(server, 'anna', 'Anna');
    const ben = join(server, 'ben', 'Ben');
    await Promise.all([master.client.ready, anna.client.ready, ben.client.ready]);
    const mirror = await Kernel.boot({ files: master.client.files, store: memoryStore(), models: new MockModels(), mirror: true });
    new ThinClient(mirror, master.client);
    const S = k.config.chunkSize;
    carry(k, 'anna', 5 * S + 3, -2 * S + 4);
    carry(k, 'ben', -S + 1, 7);
    await run(server);
    const players = mirror.situation().ops.filter((o) => o.kind === 'giocatore');
    expect(players.map((o) => [o.who, o.label, o.cx, o.cy]).sort()).toEqual([
      ['anna', 'Anna', 5, -2],
      ['ben', 'Ben', -1, 0],
    ]);
    // The atlas too.
    const atlas = await mirror.atlasView();
    expect(atlas.players.find((p) => p.id === 'anna')).toMatchObject({ cx: 5, cy: -2 });
    // They move: the master hears of it.
    carry(k, 'anna', 2 * S + 1, 2 * S + 1);
    await run(server);
    expect(mirror.situation().ops.find((o) => o.who === 'anna')).toMatchObject({ cx: 2, cy: 2 });
    // A player is never told of the others far away, nor of a list of who is connected.
    expect(anna.heard.some((m) => (m.t === 'aggiorna' || m.t === 'ingresso') && m.giocatori)).toBe(false);
    // One leaves: the master's table loses them.
    ben.client.leave();
    await run(server);
    expect(mirror.situation().ops.filter((o) => o.kind === 'giocatore').map((o) => o.who)).toEqual(['anna']);
  });

  it('the master follows a player: the world around them comes, the master stays where they are', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = join(server, 'io');
    const anna = join(server, 'anna', 'Anna');
    await Promise.all([master.client.ready, anna.client.ready]);
    const mirror = await Kernel.boot({ files: master.client.files, store: memoryStore(), models: new MockModels(), mirror: true });
    const thin = new ThinClient(mirror, master.client);
    const S = k.config.chunkSize;
    carry(k, 'anna', 9 * S + 5, 4 * S + 5);
    for (let i = 0; i < 4; i++) await run(server, 6);
    expect(mirror.chunks.has('9,4')).toBe(false);
    const before = { ...mirror.playerCarpet() };
    mirror.follow!('anna');
    expect(mirror.watching).toBe('anna');
    for (let i = 0; i < 10; i++) await run(server, 6);
    // The places around her are in the master's mirror, and she is seen where she is.
    expect(mirror.chunks.has('9,4')).toBe(true);
    const w = mirror.watched()!;
    expect(Math.hypot(w.x - (9 * S + 5), w.y - (4 * S + 5))).toBeLessThan(0.5);
    expect(mirror.playerCarpet()).toEqual(before);
    // She walks on: the view follows.
    carry(k, 'anna', 9 * S + 9, 4 * S + 5);
    for (let i = 0; i < 10; i++) await run(server, 6);
    // What moves on the server glides there, frame by frame.
    thin.frame(0.1);
    expect(Math.hypot(mirror.watched()!.x - (9 * S + 9), mirror.watched()!.y - (4 * S + 5))).toBeLessThan(0.5);
    // Esc: the view comes back to the master.
    mirror.follow!();
    expect(mirror.watching).toBeUndefined();
    expect(mirror.watched()).toBeUndefined();
    // She leaves while followed: the view comes back by itself.
    mirror.follow!('anna');
    await run(server);
    anna.client.leave();
    await run(server);
    expect(mirror.watching).toBeUndefined();
  }, 20_000);

  it('only the master follows, and only a player connected', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = join(server, 'io');
    const anna = join(server, 'anna');
    await Promise.all([master.client.ready, anna.client.ready]);
    // An answer comes at the server's next tick.
    const ask = async <T>(p: Promise<T>): Promise<T> => {
      await run(server, 1);
      return p;
    };
    expect(await ask(anna.client.act({ t: 'segui', id: 'io' }))).toMatchObject({ ok: false });
    expect(await ask(master.client.act({ t: 'segui', id: 'nessuno' }))).toMatchObject({ ok: false });
    expect(await ask(master.client.act({ t: 'segui', id: 'io' }))).toMatchObject({ ok: false });
    expect(await ask(master.client.act({ t: 'segui', id: 'anna' }))).toMatchObject({ ok: true });
    // Alone, nobody: no list, no follow.
    const alone = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    expect(alone.players()).toEqual([]);
    expect(alone.follow).toBeUndefined();
    expect(alone.situation().ops.some((o) => o.kind === 'giocatore')).toBe(false);
  });
});
