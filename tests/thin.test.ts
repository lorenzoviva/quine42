import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';

const DT = 1 / 60;

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

/** A browser of a game of many, without the browser: a session, and a mirror kernel filled by the thin client. */
async function thin(server: SessionServer, id: string, nome?: string): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, nome });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), models: new MockModels(), mirror: true });
  return new ThinClient(k, session);
}

/** Frames of the clients (their kernels walk, then they send) and ticks of the server, as in time. */
function run(server: SessionServer, clients: ThinClient[], frames: number) {
  for (let i = 0; i < frames; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

async function settle(server: SessionServer, clients: ThinClient[]) {
  for (let i = 0; i < 80; i++) {
    run(server, clients, 1);
    await new Promise((r) => setTimeout(r, 25));
    if ([...server.kernel.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  run(server, clients, 12);
}

/** A run of free tiles toward east, at least 10 tiles from where the wanderer is (the server carries them there). */
function freeRunAway(k: Kernel, id: string, length: number): { x: number; y: number } {
  const at = k.wandererAt(id)!;
  for (let d = 10; d < 40; d++)
    for (const row of [Math.floor(at.y) + d, Math.floor(at.y) - d])
      for (let col = Math.floor(at.x) - 20; col < Math.floor(at.x) + 20; col++) {
        let ok = true;
        for (let i = -1; i <= length + 1 && ok; i++) ok = k.free(col + i + 0.5, row + 0.5, 0.4) && k.tileAt(col + i, row) !== undefined;
        if (ok) return { x: col + 0.5, y: row + 0.5 };
      }
  throw new Error('nessun tratto libero');
}

function put(k: Kernel, id: string, to: { x: number; y: number }) {
  k.as(id, () => {
    const p = k.playerPos();
    Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  });
}

/** The entity of a mirror that stands for another wanderer. */
const avatarOf = (c: ThinClient, id: string) => c.k.ecs.query('remote').find((e) => c.k.ecs.get(e, 'remote').id === id);

describe('the thin client (T39)', () => {
  it('two clients see each other walk, each with their look; the mirror makes nothing of its own', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna', 'Anna');
    const bruno = await thin(server, 'bruno', 'Bruno');
    await settle(server, [anna, bruno]);
    // The mirror has the server's places, and nothing it made itself.
    expect(anna.k.chunks.size).toBeGreaterThan(0);
    for (const [key, ch] of anna.k.chunks) expect(ch.tiles).toBe(anna.session.places.get(key)!.tiles);
    expect(anna.k.ecs.query('pickup').length).toBe([...anna.session.things.values()].filter((t) => t.c?.pickup).length);
    // Each sees the other as a wanderer of their own colour.
    const b = avatarOf(anna, 'bruno');
    expect(b).toBeDefined();
    expect(anna.k.ecs.get(b!, 'identity').name).toBe('Bruno');
    expect(anna.k.ecs.get(b!, 'form')).toMatchObject({ model: 'viandante', tint: k.ecs.get(k.wandererAt('bruno')!.entity, 'form').tint });
    expect(anna.k.ecs.get(b!, 'form').tint).not.toBe(anna.k.ecs.get(anna.k.playerId, 'form').tint);
    expect(anna.k.ecs.get(anna.k.playerId, 'form').tint).toBe(k.ecs.get(k.wandererAt('anna')!.entity, 'form').tint);
    // Her first steps from where she came in reach the server (walked, or corrected where she cannot go).
    const entered = k.wandererAt('anna')!;
    anna.k.input.setHeld('left', true);
    run(server, [anna, bruno], 10);
    anna.k.input.setHeld('left', false);
    run(server, [anna, bruno], 6);
    const moved = k.wandererAt('anna')!;
    expect(Math.hypot(moved.x - entered.x, moved.y - entered.y) > 0.05 || anna.session.corrections > 0).toBe(true);
    expect(anna.k.playerCarpet().x).toBeCloseTo(moved.x, 1);
    // The server carries Anna to a stretch of open ground: her client follows.
    const start = freeRunAway(k, 'anna', 6);
    put(k, 'anna', start);
    run(server, [anna, bruno], 12);
    expect(anna.k.playerCarpet().x).toBeCloseTo(start.x, 1);
    // Anna walks east, the keys held in her browser: she moves at once, the server lets every step through.
    const was = anna.session.corrections;
    anna.k.input.setHeld('right', true);
    run(server, [anna, bruno], 30);
    anna.k.input.setHeld('right', false);
    run(server, [anna, bruno], 12);
    const there = k.wandererAt('anna')!;
    expect(there.x - start.x).toBeGreaterThan(2);
    expect(anna.session.corrections).toBe(was);
    expect(anna.k.playerCarpet().x).toBeCloseTo(there.x, 1);
    // Bruno sees her where she is, if she is near enough to be seen.
    const near = Math.hypot(there.x - k.wandererAt('bruno')!.x, there.y - k.wandererAt('bruno')!.y) <= server.near;
    const a = avatarOf(bruno, 'anna');
    if (near) {
      expect(a).toBeDefined();
      const p = bruno.k.ecs.get(a!, 'pos');
      expect(Math.hypot(p.x - there.x, p.y - there.y)).toBeLessThan(0.2);
    } else expect(a).toBeUndefined();
    // What she says is above her head for the other.
    put(k, 'anna', { x: k.wandererAt('bruno')!.x + 1, y: k.wandererAt('bruno')!.y });
    k.bubbles.set(k.wandererAt('anna')!.entity, { text: 'ciao', until: k.time + 10 });
    run(server, [anna, bruno], 12);
    expect(bruno.k.bubbles.get(avatarOf(bruno, 'anna')!)?.text).toBe('ciao');
    // Who leaves is gone from the other's world.
    bruno.session.leave();
    run(server, [anna], 12);
    expect(avatarOf(anna, 'bruno')).toBeUndefined();
  });

  it('a client that runs ahead of its pace is put back where the server has it', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna');
    await settle(server, [anna]);
    const start = freeRunAway(k, 'anna', 6);
    put(k, 'anna', start);
    run(server, [anna], 12);
    // Five tiles in one frame (a carpet pushed by hand, as a cheat would).
    const c = anna.k.carpet()!;
    c.ox += 5;
    run(server, [anna], 20);
    expect(anna.session.corrections).toBeGreaterThan(0);
    const server_ = k.wandererAt('anna')!;
    expect(anna.k.playerCarpet().x).toBeCloseTo(server_.x, 1);
    expect(server_.x - start.x).toBeLessThan(5);
  });

  it('what the wanderer does shows at once, and is undone if the server refuses', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna');
    await settle(server, [anna]);
    const start = freeRunAway(k, 'anna', 8);
    put(k, 'anna', start);
    run(server, [anna], 12);
    // Something on the ground next to her, and something out of reach.
    const item = [...anna.k.content.items.keys()].find((i) => !i.startsWith('rune:'))!;
    const close = k.spawnItem(item, start.x + 1, start.y);
    const far = k.spawnItem(item, start.x + 7, start.y);
    run(server, [anna], 12);
    const mirrorOf = (sid: number) => anna.k.ecs.query('pickup').find((e) => {
      const p = anna.k.ecs.get(e, 'pos');
      const t = anna.session.things.get(sid);
      return t && Math.abs(p.x - t.x) < 0.01 && Math.abs(p.y - t.y) < 0.01;
    });
    const near = mirrorOf(close)!;
    const away = mirrorOf(far)!;
    expect(near).toBeDefined();
    expect(away).toBeDefined();
    // Picked up: gone at once in her world, then in her bag as the server says.
    void anna.k.perform(near, 'raccogli');
    expect(anna.k.ecs.alive.has(near)).toBe(false);
    run(server, [anna], 12);
    await new Promise((r) => setTimeout(r, 0));
    run(server, [anna], 12);
    expect(k.ecs.alive.has(close)).toBe(false);
    expect(anna.k.inventory().slots.some((s) => s?.item === item)).toBe(true);
    expect(anna.k.ecs.query('pickup').some((e) => anna.k.ecs.get(e, 'pos').x === anna.session.things.get(close)?.x)).toBe(false);
    // Out of reach: it vanishes, the server says no, it is back.
    void anna.k.perform(away, 'raccogli');
    expect(anna.k.ecs.alive.has(away)).toBe(false);
    run(server, [anna], 3);
    await new Promise((r) => setTimeout(r, 0));
    run(server, [anna], 12);
    expect(k.ecs.alive.has(far)).toBe(true);
    expect(mirrorOf(far)).toBeDefined();
    // The phrase: composed here, inscribed at once; at the end the hand is what the server has.
    k.as('anna', () => k.give('rune:luce', 2));
    run(server, [anna], 12);
    expect(anna.k.composeRune('luce')).toBe(true);
    run(server, [anna], 12);
    expect(k.as('anna', () => k.hand().tokens)).toEqual(['luce']);
    anna.k.inscribeHand();
    expect(anna.k.hand().tokens).toEqual([]);
    run(server, [anna], 3);
    await new Promise((r) => setTimeout(r, 0));
    run(server, [anna], 12);
    expect(anna.k.hand().tokens).toEqual(k.as('anna', () => k.hand().tokens));
    // What a game of many does not do yet says so, and changes nothing.
    const before = JSON.stringify(anna.k.inventory());
    anna.k.useSlot(0);
    expect(JSON.stringify(anna.k.inventory())).toBe(before);
  });
});
