import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { keepProfile, savedProfile } from '../src/session/socket';
import { PROFILE_LIMITS, repairProfile, WANDERER_NAME, type Profile } from '../src/kernel/wanderers';

// The wanderer's profile (T44a): a name, a seed and a cloak, a few lines; repaired by the server, seen by the others.

const DT = 1 / 60;

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

async function thin(server: SessionServer, id: string, profile?: Partial<Profile>): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, profile });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
  return new ThinClient(k, session);
}

function run(server: SessionServer, clients: ThinClient[], frames: number) {
  for (let i = 0; i < frames; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

async function ask<T>(server: SessionServer, clients: ThinClient[], p: Promise<T>): Promise<T> {
  let done = false;
  void p.finally(() => (done = true));
  for (let i = 0; i < 200 && !done; i++) {
    run(server, clients, 1);
    await new Promise((r) => setTimeout(r, 0));
  }
  return p;
}

const avatarOf = (c: ThinClient, id: string) => c.k.ecs.query('remote').find((e) => c.k.ecs.get(e, 'remote').id === id);

describe('the profile repaired (T44a)', () => {
  it('a short name, unlike everyone else; seed and cloak within the limits; a few lines', () => {
    const ok = repairProfile({ nome: 'Ilaria', seme: 3, tinta: '#3060c0', presentazione: 'Vengo dal nord.' }, 'ila', ['Matteo'], 8);
    expect(ok).toEqual({ profilo: { name: 'Ilaria', seed: 3, tint: '#3060c0', introduction: 'Vengo dal nord.' }, riparato: [] });

    const long = repairProfile({ nome: '  ilaria   della valle dei <b>sette</b> fiumi lontani ' }, 'ila', [], 8);
    expect(long.profilo.name.length).toBeLessThanOrEqual(PROFILE_LIMITS.nome[1]);
    expect(long.profilo.name.startsWith('Ilaria della')).toBe(true);
    expect(long.profilo.name).not.toMatch(/[<>]/);
    expect(long.riparato.length).toBeGreaterThan(0);

    // Like an individual of the world or another wanderer: a fresh name, the same for the same id.
    const twin = repairProfile({ nome: 'Matteo' }, 'mat', ['Matteo Rossi', 'Anna'], 8);
    expect(twin.profilo.name).not.toBe('Matteo');
    expect(twin.riparato.join(' ')).toMatch(/somiglia/);
    expect(repairProfile({ nome: 'Matteo' }, 'mat', ['Matteo Rossi', 'Anna'], 8).profilo.name).toBe(twin.profilo.name);

    // Nothing to call them by: «Viandante», never a repair against another «Viandante».
    expect(repairProfile({}, 'x', [WANDERER_NAME], 8).profilo).toEqual({ name: WANDERER_NAME });
    expect(repairProfile({ nome: 'A' }, 'x', [], 8).profilo.name).toBe(WANDERER_NAME);

    const wild = repairProfile({ seme: 40, tinta: '#050505', presentazione: 'uno\ndue\ntre\nquattro\ncinque\n' + 'x'.repeat(600) }, 'x', [], 8);
    expect(wild.profilo.seed).toBeGreaterThanOrEqual(1);
    expect(wild.profilo.seed).toBeLessThanOrEqual(8);
    expect(wild.profilo.tint).toMatch(/^#[0-9a-f]{6}$/);
    expect(wild.profilo.tint).not.toBe('#050505');
    expect(wild.profilo.introduction!.split('\n')).toHaveLength(PROFILE_LIMITS.righe);
    expect(repairProfile({ tinta: 'rosso', seme: 'due' }, 'x', [], 8)).toEqual({ profilo: { name: WANDERER_NAME }, riparato: ['seme non valido', 'colore non valido'] });
  });
});

describe('the profile in a multiplayer game (T44a)', () => {
  it('a valid profile reaches the others: name, seed, cloak and presentation', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna', { name: 'Ilaria', seed: 3, tint: '#3060c0', introduction: 'Tessitrice del nord.' });
    expect(anna.session.name).toBe('Ilaria');
    expect(anna.session.repaired).toEqual([]);
    expect(anna.session.form).toMatchObject({ seed: 3, tint: '#3060c0' });
    const bruno = await thin(server, 'bruno', { name: 'Bruno', tint: '#c04020' });
    run(server, [anna, bruno], 12);
    const a = avatarOf(bruno, 'anna')!;
    expect(a).toBeDefined();
    expect(bruno.k.ecs.get(a, 'identity').name).toBe('Ilaria');
    expect(bruno.k.ecs.get(a, 'form')).toMatchObject({ seed: 3, tint: '#3060c0' });
    // Who she is, from her menu.
    expect(bruno.k.actionsFor(a).map((x) => x.id)).toContain('chi');
    expect(bruno.k.introOf(a)).toBe('Tessitrice del nord.');
    expect(k.wanderers().find((w) => w.id === 'anna')?.name).toBe('Ilaria');
    // Words between them carry the name.
    expect(bruno.session.others.get('anna')?.name).toBe('Ilaria');
  });

  it('a name like another wanderer’s, or out of measure, is repaired and the client is told', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna', { name: 'Ilaria' });
    const bruno = await thin(server, 'bruno', { name: 'Ilario', seed: 99 });
    expect(bruno.session.name).not.toBe('Ilario');
    expect(bruno.session.name).not.toBe('Ilaria');
    expect(bruno.session.repaired.join(' ')).toMatch(/somiglia/);
    expect(bruno.session.repaired.join(' ')).toMatch(/seme/);
    run(server, [anna, bruno], 12);
    // Choosing again during the game: what the others see changes with it.
    const o = await ask(server, [anna, bruno], bruno.setProfile({ name: 'Ilaria', tint: '#20a040', seed: 2 }));
    expect(o.ok).toBe(true);
    expect(o.profile?.name).not.toBe('Ilaria');
    expect(o.text).toMatch(/somiglia/);
    expect(bruno.k.ecs.get(bruno.k.wandererEntity, 'form')).toMatchObject({ seed: 2, tint: '#20a040' });
    run(server, [anna, bruno], 12);
    const b = avatarOf(anna, 'bruno')!;
    expect(anna.k.ecs.get(b, 'identity').name).toBe(o.profile!.name);
    expect(anna.k.ecs.get(b, 'form')).toMatchObject({ seed: 2, tint: '#20a040' });
  });

  it('who comes back without one has the profile they had', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna', { name: 'Ilaria', seed: 4, tint: '#a03080', introduction: 'Torno sempre.' });
    run(server, [anna], 6);
    anna.session.leave();
    run(server, [], 2);
    expect(server.connected()).not.toContain('anna');
    expect(JSON.parse(k.files['world/players/anna.json']).profile).toEqual({ name: 'Ilaria', seed: 4, tint: '#a03080', introduction: 'Torno sempre.' });
    const again = await thin(server, 'anna');
    expect(again.session.name).toBe('Ilaria');
    expect(again.session.profile).toEqual({ name: 'Ilaria', seed: 4, tint: '#a03080', introduction: 'Torno sempre.' });
    expect(again.session.form).toMatchObject({ seed: 4, tint: '#a03080' });
  });

  it('alone, the kernel keeps the profile of `io` with the state of play', async () => {
    const k = await Kernel.boot({ files: { ...bundledFiles }, store: memoryStore(), ai: new MockAiModels() });
    const r = k.setProfile('me', { nome: 'Ilaria', seme: 2, tinta: '#3060c0' })!;
    expect(r.profilo.name).toBe('Ilaria');
    expect(k.ecs.get(k.wandererEntity, 'form')).toMatchObject({ seed: 2, tint: '#3060c0' });
    k.saveState();
    const again = await Kernel.boot({ files: { ...k.files }, store: memoryStore(), ai: new MockAiModels() });
    expect(again.wanderer().name).toBe('Ilaria');
    expect(again.ecs.get(again.wandererEntity, 'form')).toMatchObject({ seed: 2, tint: '#3060c0' });
  });
});

describe('the other wanderer in the thin client (T44c)', () => {
  it('«Chi è» shows the presentation; the hover says the name and its first line; the right click opens the one under the pointer', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna', { name: 'Ilaria', introduction: 'Tessitrice del nord.\nAmo i fiumi.' });
    const bruno = await thin(server, 'bruno', { name: 'Bruno', introduction: 'Pescatore.' });
    const carlo = await thin(server, 'carlo', { name: 'Carlo' });
    const all = [anna, bruno, carlo];
    run(server, all, 6);
    // Anna and Carlo side by side, a step from Bruno.
    const at = bruno.k.wandererPos();
    const put = (id: string, x: number, y: number) => {
      const w = k.wandererAt(id)!;
      Object.assign(k.ecs.get(w.entity, 'pos'), { x, y });
    };
    put('anna', at.x + 1.2, at.y + 0.5);
    put('carlo', at.x + 1.8, at.y + 0.5);
    run(server, all, 40);
    const a = avatarOf(bruno, 'anna')!;
    const c = avatarOf(bruno, 'carlo')!;
    const dialogs: Array<{ speaker: string; text: string }> = [];
    bruno.k.bus.on('ui:dialog', (d) => dialogs.push(d));
    await bruno.k.performMenu('e:chi', a, 0, 0);
    expect(dialogs).toEqual([{ speaker: 'Ilaria', text: 'Tessitrice del nord.\nAmo i fiumi.' }]);

    const { ox, oy } = bruno.k.offset();
    const pa = bruno.k.ecs.get(a, 'pos');
    expect(bruno.k.hoverAt(pa.x - ox, pa.y - oy)).toMatchObject({ kind: 'entity', name: 'Ilaria', description: 'Tessitrice del nord.' });
    const pc = bruno.k.ecs.get(c, 'pos');
    expect(bruno.k.hoverAt(pc.x - ox, pc.y - oy)).toMatchObject({ kind: 'entity', name: 'Carlo', description: '' });

    const menus: Array<{ id: number }> = [];
    bruno.k.bus.on('ui:actions', (m) => menus.push(m));
    bruno.k.contextAt(pc.x - ox, pc.y - oy);
    bruno.k.contextAt(pa.x - ox, pa.y - oy);
    expect(menus.map((m) => m.id)).toEqual([c, a]);
  }, 180000);
});

describe('the profiles of two wanderers in the same browser (T44c)', () => {
  it('one key per universe and wanderer; a profile already saved is not replaced by the one a client brings', async () => {
    const store = new Map<string, string>();
    const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, v: string) => void store.set(key, v) };
    keepProfile('aurora', 'anna', { name: 'Ilaria' }, storage);
    keepProfile('aurora', 'bruno', { name: 'Bruno' }, storage);
    keepProfile('altrove', 'anna', { name: 'Anna' }, storage);
    expect(savedProfile('aurora', 'anna', storage)).toEqual({ name: 'Ilaria' });
    expect(savedProfile('aurora', 'bruno', storage)).toEqual({ name: 'Bruno' });
    expect(savedProfile('altrove', 'anna', storage)).toEqual({ name: 'Anna' });
    expect(savedProfile('aurora', 'carlo', storage)).toBeUndefined();

    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna', { name: 'Ilaria', introduction: 'Tessitrice.' });
    run(server, [anna], 6);
    anna.session.leave();
    run(server, [], 2);
    // Anna comes back with Bruno's profile (an old key shared by the origin): hers stays.
    const again = await thin(server, 'anna', { name: 'Bruno', introduction: 'Pescatore.' });
    expect(again.session.profile).toEqual({ name: 'Ilaria', introduction: 'Tessitrice.' });
    expect(JSON.parse(k.files['world/players/anna.json']).profile).toMatchObject({ name: 'Ilaria' });
    // Only an explicit change does.
    const o = await ask(server, [again], again.setProfile({ name: 'Ilenia' }));
    expect(o.profile?.name).toBe('Ilenia');
  }, 180000);
});
