// V-011 (T129, ADR-0107): a client that floods is limited, the others are not, and the game as it is played never notices.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { fakeLink, type ServerMsg } from '../../src/session/protocol';
import { LIMITS, SessionServer } from '../../src/session/server';

// Booting takes seconds: one kernel, a server of its own for each test.
let kernel: Kernel;
beforeAll(async () => {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  kernel = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}, 120_000);
afterEach(() => void vi.restoreAllMocks());

const world = async () => new SessionServer(kernel);

type Esito = Extract<ServerMsg, { t: 'result' }>;

function enter(server: SessionServer, id: string) {
  const { server: s, client } = fakeLink();
  const got: ServerMsg[] = [];
  let closed = false;
  client.onMessage((m) => got.push(m));
  client.onClose(() => (closed = true));
  server.connect(s);
  client.send({ t: 'join', id });
  expect(got.some((m) => m.t === 'welcome')).toBe(true);
  return {
    send: (m: unknown) => client.send(m as never),
    leave: () => client.close(),
    esiti: () => got.filter((m): m is Esito => m.t === 'result'),
    limited: () => got.filter((m): m is Esito => m.t === 'result' && !m.ok && /fretta|attesa/.test(m.reason ?? '')),
    closed: () => closed,
    got,
  };
}

/** Lets what the requests started finish. */
const settle = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

/** Requests that stay open until told otherwise, so what is running can be counted. */
function holdCrafts(server: SessionServer) {
  const open: Array<() => void> = [];
  const spy = vi.spyOn(server.kernel, 'freeCraft').mockImplementation(() => new Promise((done) => open.push(() => done({ ok: true, story: 'fatto' }))));
  return { spy, open };
}

const TICK = 1 / 60;

describe('V-011 i limiti ai messaggi', () => {
  it('V-011 chi inonda è limitato, un altro nello stesso momento no', async () => {
    const server = await world();
    const a = enter(server, 'inonda');
    const b = enter(server, 'gioca');
    for (let i = 0; i < 600; i++) a.send({ t: 'say', seq: i + 1, wanderer: 'nessuno', text: 'x' });
    b.send({ t: 'say', seq: 1, wanderer: 'nessuno', text: 'y' });
    expect(a.limited().length).toBe(600 - LIMITS.burst);
    server.tick(TICK);
    expect(a.esiti().length).toBe(600);
    expect(b.limited()).toEqual([]);
    expect(b.esiti().length).toBe(1);
  });

  it('V-011 ciò che chiama il modello ha un ritmo suo: inondando non si arriva ai modelli', async () => {
    const server = await world();
    const { spy, open } = holdCrafts(server);
    const a = enter(server, 'inonda');
    for (let i = 0; i < 100; i++) a.send({ t: 'craft', seq: i + 1, text: 'una spada' });
    expect(a.limited().length).toBe(100 - LIMITS.heavyBurst);
    server.tick(TICK);
    // Two at a time, the queue full, the rest of what came told so.
    expect(spy).toHaveBeenCalledTimes(LIMITS.atOnce);
    expect(a.limited().length).toBe(100 - LIMITS.atOnce - LIMITS.waiting);
    open.splice(0).forEach((f) => f());
    await settle();
    server.tick(TICK);
    expect(spy).toHaveBeenCalledTimes(LIMITS.atOnce * 2);
  });

  it('V-011 il ritmo torna col tempo', async () => {
    const server = await world();
    const { spy, open } = holdCrafts(server);
    const a = enter(server, 'torna');
    for (let i = 0; i < LIMITS.heavyBurst + 1; i++) {
      a.send({ t: 'craft', seq: i + 1, text: 'una spada' });
      server.tick(TICK);
      open.splice(0).forEach((f) => f());
      await settle();
    }
    expect(a.limited().length).toBe(1);
    const asked = spy.mock.calls.length;
    for (let t = 0; t < 2.1 / 0.1; t++) server.tick(0.1);
    a.send({ t: 'craft', seq: 99, text: 'una spada' });
    server.tick(TICK);
    expect(spy.mock.calls.length).toBe(asked + 1);
  });

  it('V-011 le code sono per payer: chi aspetta non fa aspettare un altro', async () => {
    const server = await world();
    const { spy, open } = holdCrafts(server);
    const a = enter(server, 'inonda');
    const b = enter(server, 'gioca');
    for (let i = 0; i < 10; i++) a.send({ t: 'craft', seq: i + 1, text: 'una spada' });
    server.tick(TICK);
    expect(spy).toHaveBeenCalledTimes(LIMITS.atOnce);
    b.send({ t: 'craft', seq: 1, text: 'una mela' });
    server.tick(TICK);
    expect(spy).toHaveBeenCalledTimes(LIMITS.atOnce + 1);
    open.at(-1)!();
    await settle();
    expect(b.esiti().map((e) => e.ok)).toEqual([true]);
  });

  it('V-011 una raccolta non aspetta una chiacchierata', async () => {
    const server = await world();
    const { open } = holdCrafts(server);
    const a = enter(server, 'gioca');
    for (let i = 0; i < 5; i++) a.send({ t: 'craft', seq: i + 1, text: 'una spada' });
    server.tick(TICK);
    a.send({ t: 'action', seq: 50, entity: -1, action: 'raccogli' });
    server.tick(TICK);
    expect(a.esiti().map((e) => e.seq)).toEqual([50]);
    expect(open.length).toBe(LIMITS.atOnce);
  });

  it('V-011 il testo verso il Concilio ha una lunghezza massima', async () => {
    const server = await world();
    const { spy } = holdCrafts(server);
    const a = enter(server, 'lungo');
    a.send({ t: 'craft', seq: 1, text: 'x'.repeat(200_000) });
    server.tick(TICK);
    expect(spy.mock.calls[0][0].length).toBe(LIMITS.text);
  });

  it('V-011 rientrare non ridà il credito', async () => {
    const server = await world();
    const a = enter(server, 'torna');
    for (let i = 0; i < LIMITS.burst; i++) a.send({ t: 'say', seq: i + 1, wanderer: 'nessuno', text: 'x' });
    a.leave();
    const again = enter(server, 'torna');
    again.send({ t: 'say', seq: 1, wanderer: 'nessuno', text: 'x' });
    expect(again.limited().length).toBe(1);
  });

  it('V-011 chi se ne va non paga ciò che aspettava', async () => {
    const server = await world();
    const { spy, open } = holdCrafts(server);
    const a = enter(server, 'via');
    for (let i = 0; i < 5; i++) a.send({ t: 'craft', seq: i + 1, text: 'una spada' });
    server.tick(TICK);
    a.leave();
    open.splice(0).forEach((f) => f());
    await settle();
    server.tick(TICK);
    expect(spy).toHaveBeenCalledTimes(LIMITS.atOnce);
  });

  it('V-011 chi non smette viene chiuso; passi e immondizia contano, ma senza risposta', async () => {
    const server = await world();
    const a = enter(server, 'inonda');
    const others = enter(server, 'gioca');
    for (let i = 0; i < LIMITS.burst + 10; i++) a.send({ t: 'step', seq: i + 1, x: 0, y: 0 });
    expect(a.esiti()).toEqual([]);
    for (let i = 0; i < LIMITS.flood; i++) a.send(7);
    expect(a.closed()).toBe(true);
    expect(a.got.some((m) => m.t === 'refusal')).toBe(true);
    expect(server.connected()).toEqual(['gioca']);
    expect(others.closed()).toBe(false);
  });

  it('V-011 il gioco normale non se ne accorge: due minuti di passi, azioni, richieste e una raffica di clic', async () => {
    const server = await world();
    const { open } = holdCrafts(server);
    const a = enter(server, 'gioca');
    // The limits are the server's: two minutes of the kernel would only make this slow.
    vi.spyOn(server.kernel, 'tick').mockImplementation(() => {});
    let seq = 0;
    const DT = 1 / 20;
    for (let t = 0; t < 120 / DT; t++) {
      a.send({ t: 'step', seq: ++seq, x: 0, y: 0 });
      // An action a second, a burst of them going through a bag, something asked of the Council every 8 seconds.
      if (t % 20 === 0) a.send({ t: 'phrase', seq: ++seq, tokens: [] });
      if (t % 200 === 0) for (let i = 0; i < 12; i++) a.send({ t: 'item', seq: ++seq, op: 'move', slot: 0, toward: 1 });
      if (t % 160 === 0) a.send({ t: 'craft', seq: ++seq, text: 'una mela' });
      server.tick(DT);
      open.splice(0).forEach((f) => f());
      if (t % 40 === 0) await settle();
    }
    expect(a.limited()).toEqual([]);
    expect(a.closed()).toBe(false);
  });
});
