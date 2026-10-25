import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { COUNCIL_RUNE } from '../src/kernel/runes';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';

const DT = 1 / 60;

async function bootWith(partita: Record<string, unknown>): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

const many = () => bootWith({ modalita: 'multigiocatore', morte: 3 });

const run = (k: Kernel, seconds: number) => {
  for (let t = 0; t < seconds; t += DT) k.tick(DT);
};

const starve = (k: Kernel, id: string) => k.as(id, () => Object.assign(k.needs()!, { hunger: 0, thirst: 0, health: 0.5 }));

describe('the master in god mode (T42a)', () => {
  it('in a game of many the master does not die nor need anything; alone, nobody is a god', async () => {
    const k = await many();
    k.addWanderer('anna', 'Anna');
    expect(k.godMode('io')).toBe(true);
    expect(k.godMode('anna')).toBe(false);
    starve(k, 'io');
    run(k, 3);
    expect(k.dead).toBe(false);
    expect(k.as('io', () => k.needs())).toMatchObject({ hunger: 100, thirst: 100, energy: 100, health: 100, morto: false });
    // A player still starves: death among many is T43's, today it ends the world's wait as alone.
    starve(k, 'anna');
    run(k, 3);
    expect(k.dead).toBe(true);

    const solo = await bootWith({ modalita: 'singola', morte: 3 });
    expect(solo.isMaster()).toBe(true);
    expect(solo.godMode()).toBe(false);
    starve(solo, 'io');
    run(solo, 3);
    expect(solo.dead).toBe(true);
  });

  it('nothing a player does touches the master’s body; words arrive, and the master acts freely', async () => {
    const k = await many();
    const anna = k.addWanderer('anna', 'Anna')!;
    const io = k.as('io', () => k.playerId);
    const pos = { ...k.ecs.get(io, 'pos')! };
    // Anna right under the master (in world coordinates, the same as the master's: their carpets are both at rest).
    k.as('anna', () => Object.assign(k.playerPos(), { x: pos.x, y: pos.y + 1 }));
    const said = k.as('anna', () => k.applyEffects([{ tipo: 'spingi', forza: 3 } as any, { tipo: 'distruggi' } as any, { tipo: 'messaggio', testo: 'ehi' } as any], io));
    expect(said).toEqual(['ehi']);
    expect(k.ecs.alive.has(io)).toBe(true);
    expect(k.ecs.get(io, 'pos')).toMatchObject({ x: pos.x, y: pos.y });
    // The master pushes a player like anything else.
    const before = { ...k.ecs.get(anna, 'pos')! };
    k.as('io', () => k.applyEffects([{ tipo: 'spingi', forza: 3 } as any], anna));
    expect(Math.hypot(k.ecs.get(anna, 'pos')!.x - before.x, k.ecs.get(anna, 'pos')!.y - before.y)).toBeGreaterThan(0);
  });

  it('the others see the master in the world, and not when the master is in the corona', async () => {
    const k = await many();
    const server = new SessionServer(k);
    const { server: s, client: c } = fakeLink();
    server.connect(s);
    const anna = new SessionClient(c, { id: 'anna', nome: 'Anna' });
    await anna.ready;
    for (let i = 0; i < 12; i++) server.tick(DT);
    expect(k.inWorld('io')).toBe(true);
    expect(anna.others.has('io')).toBe(true);
    // The master speaks the Council's rune: off the carpet, to the hall. For Anna the body leaves.
    k.as('io', () => {
      k.hand().tokens = [COUNCIL_RUNE];
      expect(k.councilRune()).toBe(true);
    });
    for (let i = 0; i < 12; i++) server.tick(DT);
    expect(k.inWorld('io')).toBe(false);
    expect(anna.others.has('io')).toBe(false);
    // Out on the campus, with Anna standing where the master's carpet would put them: still not seen.
    k.as('io', () => Object.assign(k.playerPos(), k.corona.building('concilio')!.door));
    const there = k.wandererAt('io')!;
    k.as('anna', () => {
      const p = k.playerPos();
      Object.assign(k.carpet()!, { ox: there.x + 1 - p.x, oy: there.y - p.y });
    });
    for (let i = 0; i < 12; i++) server.tick(DT);
    expect(k.zone).toBe('corona');
    expect(Math.hypot(k.wandererAt('anna')!.x - k.wandererAt('io')!.x, k.wandererAt('anna')!.y - k.wandererAt('io')!.y)).toBeLessThan(8);
    expect(anna.others.has('io')).toBe(false);
    // Back in the circle, on the carpet: seen again.
    k.as('io', () => Object.assign(k.playerPos(), { x: 0, y: 0 }));
    const home = k.wandererAt('io')!;
    k.as('anna', () => {
      const p = k.playerPos();
      Object.assign(k.carpet()!, { ox: home.x + 1 - p.x, oy: home.y - p.y });
    });
    for (let i = 0; i < 12; i++) server.tick(DT);
    expect(k.inWorld('io')).toBe(true);
    expect(anna.others.has('io')).toBe(true);
  });
});
