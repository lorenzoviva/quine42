// T245d (ADR-0147): the ventures. The work of many towards a result one sees: a file of the world written only by the kernel, a team made
// without calls, materials brought from the deposit, work counted where someone really works, a progress derived from what was brought
// and worked. Months of clock and reopenings do not change what was done. No call to the models.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { MemoryChunks } from '../src/kernel/chunks';
import { addItem } from '../src/kernel/inventory';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { apiErrors } from '../src/kernel/validator';
import { addWork, bring, fillTeam, HARVEST_DAY, housePhases, HOUSE_ROLES, readVentures, ventureProgress, ventureState, VENTURES_FILE, workAllowed, writeVentures, YEAR_DAYS, type Venture } from '../src/kernel/ventures';
import { developAll, pause } from './espressivita/banco';

const STEP = 1 / 20;
const DAY = Kernel.DAY_SECONDS;
const at = (n: number, phase: 'morning' | 'day' | 'evening' | 'night') => (n + { morning: 0, day: 0.12, evening: 0.42, night: 0.58 }[phase] - 0.12) * DAY + 1;

const house = (over: Partial<Venture> = {}): Venture => ({
  id: 'i-prova',
  title: 'Si ricostruisce una casa',
  type: 'construction',
  state: 'active',
  chunk: '0,0',
  spot: { x: 9, y: 9 },
  phases: housePhases('structure'),
  roles: structuredClone(HOUSE_ROLES),
  brought: {},
  worked: 0,
  team: [],
  start: 0,
  last: 0,
  born_from: 'regola:ricostruzione',
  ...over,
});

describe('a venture, as data', () => {
  it('the progress is derived: the phase now is the first not brought or not worked; the stage is that of the phase done', () => {
    const v = house();
    expect(ventureProgress(v)).toMatchObject({ fase: 0, stadio: 0, manca: { 'item.ciocco': 4 }, finita: false });
    // Work without the materials does not count.
    expect(addWork(v, 500)).toEqual([]);
    expect(v.worked).toBe(0);
    expect(bring(v, 'item.ciocco', 100).taken).toBe(16);
    expect(bring(v, 'item.pietra', 5).taken).toBe(0);
    expect(workAllowed(v)).toBe(200);
    expect(addWork(v, 500)).toEqual([0]);
    expect(v.worked).toBe(200);
    expect(ventureProgress(v)).toMatchObject({ fase: 1, stadio: 0.2, manca: { 'item.chiodi': 4 } });
    bring(v, 'item.chiodi', 6);
    expect(addWork(v, 1e6)).toEqual([1, 2, 3]);
    expect(ventureProgress(v)).toMatchObject({ fase: 4, stadio: 1, finita: true });
    // Never backwards, never more than the work of all the phases.
    expect(addWork(v, -50)).toEqual([]);
    expect(v.worked).toBe(1500);
  });

  it('the state: going on, waiting for a material nobody has, stopped with no team, finished; a harvest whose season passed is over', () => {
    const v = house({ team: [{ name: 'Ada', role: 'manovale' }] });
    expect(ventureState(v, 0, () => 1)).toBe('active');
    expect(ventureState(v, 0, () => 0)).toBe('waiting');
    expect(ventureState({ ...v, team: [] }, 0, () => 1)).toBe('stopped');
    expect(ventureState({ ...v, expires: 3 }, 4, () => 1)).toBe('finished');
  });

  it('the team: by trade, then by nearness, then by a draw of the seed for the name; who is gone leaves and is replaced; never one in two', () => {
    const v = house();
    const people = [
      { nome: 'Baldo', mestiere: 'smith', luogo: '1,0' },
      { nome: 'Ivo', mestiere: 'farmer', luogo: '0,0' },
      { nome: 'Nives', mestiere: 'cuoco', luogo: '0,0' },
      { nome: 'Remo', mestiere: 'pescatore', luogo: '5,5' },
      { nome: 'Teo', mestiere: 'oste', luogo: '0,1' },
    ];
    fillTeam(v, people, new Set(), 42);
    expect(v.team.find((m) => m.role === 'capomastro')?.name).toBe('Baldo');
    expect(v.team.filter((m) => m.role === 'manovale').map((m) => m.name).sort()).toEqual(['Ivo', 'Nives']);
    // The same seed, the same team.
    const again = house();
    fillTeam(again, people, new Set(), 42);
    expect(again.team).toEqual(v.team);
    // Nives is gone: Teo (one place away) takes her place; Remo is too far.
    const { left, joined } = fillTeam(v, people.filter((p) => p.nome !== 'Nives'), new Set(), 42);
    expect(left).toEqual(['Nives']);
    expect(joined.map((m) => m.name)).toEqual(['Teo']);
    // Who works at another venture is not free.
    const other = house({ id: 'i-altra' });
    fillTeam(other, people, new Set(v.team.map((m) => m.name)), 42);
    expect(other.team.map((m) => m.name)).toEqual(['Nives']);
  });

  it('the file: what is wrong drops, what is out of range is clamped, what the kernel does not know stays', () => {
    const v = { ...house(), domani: { x: 1 }, worked: -5, brought: { 'item.ciocco': 3.7, x: -2 } };
    const list = readVentures(writeVentures([v as Venture, { id: 'rotta' } as unknown as Venture]));
    expect(list).toHaveLength(1);
    expect(list[0].worked).toBe(0);
    expect(list[0].brought).toEqual({ 'item.ciocco': 3 });
    expect((list[0] as unknown as { domani: unknown }).domani).toEqual({ x: 1 });
    expect(readVentures('{ non è json')).toEqual([]);
  });

  it('world.venture and world.venture_bring are in the API of Lua', () => {
    expect(apiErrors('local p = world.venture(1)\nlocal n = world.venture_bring(1, "item.ciocco")')).toEqual([]);
    // The names of the contract 0.4 are gone (T308b): a module of before is ported by the migration.
    expect(apiErrors('local p = world.impresa(1)').join()).toMatch(/world\.impresa non esiste/);
  });
});

/** A whole kernel with its places planned, a store of places that outlives it. */
async function world(files = bundledFiles, chunks = new MemoryChunks()): Promise<Kernel> {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), chunks });
  await developAll(k);
  // The individuals of the world (with a trade of the Narrator's) are taken away: the test says who lives here.
  for (const id of k.ecs.query('mind')) k.ecs.destroy(id);
  return k;
}

const placeOf = (k: Kernel) => {
  const pc = k.wandererCarpet();
  const S = k.config.chunkSize;
  return { key: `${Math.floor(pc.x / S)},${Math.floor(pc.y / S)}`, cx: Math.floor(pc.x / S), cy: Math.floor(pc.y / S), S };
};

/** The people of the world: who they are in `people.json` (what the team is made from). */
function setPeople(k: Kernel, list: Array<{ nome: string; mestiere: string; origine: string; famiglia?: Array<{ nome: string; legame: string }> }>): void {
  const src = JSON.stringify({ persone: list.map((p) => ({ tipo: 'npc.villager', routine: [], famiglia: [], ...p })), attesi: [] }, null, 2) + '\n';
  (k as unknown as { repo: { write(p: string, s: string): void } }).repo.write('world/people.json', src);
  (k as unknown as { files: Record<string, string> }).files = { ...k.files, 'world/people.json': src };
}

/** An individual with a trade, near a point, where the body fits. */
function worker(k: Kernel, name: string, job: string, x: number, y: number): number {
  let spot = { x, y };
  search: for (let d = 0; d < 6; d++)
    for (let oy = -d; oy <= d; oy++)
      for (let ox = -d; ox <= d; ox++) {
        const q = { x: Math.floor(x) + ox + 0.5, y: Math.floor(y) + oy + 0.5 };
        if (k.free(q.x, q.y, 0.4)) {
          spot = q;
          break search;
        }
      }
  const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, spot.x, spot.y)!;
  k.ecs.set(id, 'identity', { name, persona: '', look: '', carrying: [], job });
  k.ecs.set(id, 'mind', { mode: 'vaga', mood: '', history: [] });
  return id;
}

function play(k: Kernel, seconds: number, until?: () => boolean): void {
  for (let t = 0; t < seconds && !until?.(); t += STEP) k.tick(STEP);
}

/** The stage of the building of an origin: undefined when it stands whole, null when there is none. */
const stageOf = (k: Kernel, origin: string) => {
  const id = k.ecs.query('structure', 'origin').find((e) => k.ecs.get(e, 'origin').key === origin);
  return id === undefined ? null : k.ecs.get(id, 'structure').stage;
};
const liveVentures = (k: Kernel) => (k as unknown as { ventureList: Venture[] }).ventureList;
const consumed = (k: Kernel) => (k as unknown as { consumed: Set<string> }).consumed;

/** The structure of the first lot of the wanderer's place, and its origin. */
function aStructure(k: Kernel): { id: number; origin: string } {
  const { key } = placeOf(k);
  const id = k.ecs.query('structure', 'origin').find((e) => k.ecs.get(e, 'origin').key.startsWith(`${key}#s`));
  expect(id, 'the place of the wanderer has a building').toBeDefined();
  return { id: id!, origin: k.ecs.get(id!, 'origin').key };
}

describe('the ventures in a world', () => {
  it('a building that falls is rebuilt: the venture is born with a team of the place, the materials come from the deposit, the work from who is at the site', async () => {
    const k = await world();
    const { key } = placeOf(k);
    const { id, origin } = aStructure(k);
    const site = { ...k.ecs.get(id, 'pos') };
    const names = [['Baldo', 'fabbro'], ['Ivo', 'boscaiolo'], ['Nives', 'contadina']];
    setPeople(k, names.map(([nome, mestiere], i) => ({ nome, mestiere, origine: `${key}#t${i}` })));
    for (const [i, [nome, mestiere]] of names.entries()) worker(k, nome, mestiere, site.x + 3 + i, site.y + 3);
    k.stores.set('sys.work', `deposit:${key.replace(',', ':')}`, { 'item.ciocco': 40, 'item.chiodi': 20 });
    (k as unknown as { breakEntity(id: number): void }).breakEntity(id);
    const [v] = k.ventures();
    expect(v).toMatchObject({ type: 'construction', chunk: key, origin: origin, born_from: 'regola:ricostruzione', state: 'active' });
    expect(v.team.map((m) => `${m.name}:${m.role}`).sort()).toEqual(['Baldo:capomastro', 'Ivo:manovale', 'Nives:manovale']);
    // The lot shows its building at stage 0 while it is rebuilt (T245e): stakes and a rope.
    expect(stageOf(k, origin)).toBe(0);

    k.time = at(2, 'day');
    play(k, 170);
    const now = k.ventures()[0];
    expect(Object.values(now.brought).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    expect(now.worked).toBeGreaterThan(0);
    // The deposit gave what was brought.
    const dep = k.placeDeposit(key);
    expect((dep['item.ciocco'] ?? 0) + (now.brought['item.ciocco'] ?? 0)).toBeLessThanOrEqual(40);
    expect((dep['item.ciocco'] ?? 0)).toBeLessThan(40);

    // The panel of the site: the fields its manifest names travel with W (rule 8f), nothing else of the file.
    const fields = k.panelFields();
    expect(fields['worksite.title']).toBe(now.title);
    expect(String(fields['worksite.team'])).toMatch(/Baldo \(capomastro\)/);
    expect(Object.keys(fields).filter((f) => f.startsWith('worksite.')).sort()).toEqual(['worksite.missing', 'worksite.phase', 'worksite.state', 'worksite.team', 'worksite.title']);
  }, 60000);

  it('who dies leaves the team and someone else takes the place; with nobody it is stopped, and it goes on when someone is back', async () => {
    const k = await world();
    const { key } = placeOf(k);
    const { id } = aStructure(k);
    setPeople(k, [
      { nome: 'Baldo', mestiere: 'fabbro', origine: `${key}#t0` },
      { nome: 'Ivo', mestiere: 'boscaiolo', origine: `${key}#t1` },
    ]);
    (k as unknown as { breakEntity(id: number): void }).breakEntity(id);
    expect(k.ventures()[0].team.map((m) => m.name).sort()).toEqual(['Baldo', 'Ivo']);
    // Ivo dies (his entity is taken away for good): at the new day he leaves, and Teo, come to the place, takes his place.
    consumed(k).add(`${key}#t1`);
    setPeople(k, [
      { nome: 'Baldo', mestiere: 'fabbro', origine: `${key}#t0` },
      { nome: 'Ivo', mestiere: 'boscaiolo', origine: `${key}#t1` },
      { nome: 'Teo', mestiere: 'oste', origine: `${key}#t2` },
    ]);
    k.time = at(3, 'morning');
    play(k, 3.5);
    expect(k.ventures()[0].team.map((m) => m.name).sort()).toEqual(['Baldo', 'Teo']);
    // Nobody left: stopped, visible, still there.
    setPeople(k, []);
    k.time = at(4, 'morning');
    play(k, 3.5);
    expect(k.ventures()[0]).toMatchObject({ state: 'stopped', team: [] });
    setPeople(k, [{ nome: 'Remo', mestiere: 'pescatore', origine: `${key}#t3` }]);
    k.time = at(5, 'morning');
    play(k, 3.5);
    expect(k.ventures()[0].team.map((m) => m.name)).toEqual(['Remo']);
    expect(k.ventures()[0].state).not.toBe('stopped');
  }, 60000);

  it('months of clock and two reopenings: what was brought and worked stays; the house stands again when it is done', async () => {
    const chunks = new MemoryChunks();
    let k = await world(bundledFiles, chunks);
    const { key } = placeOf(k);
    const { id, origin } = aStructure(k);
    setPeople(k, [{ nome: 'Baldo', mestiere: 'fabbro', origine: `${key}#t0` }]);
    (k as unknown as { breakEntity(id: number): void }).breakEntity(id);
    const v = liveVentures(k)[0];
    bring(v, 'item.ciocco', 10);
    addWork(v, 150);
    // Months of clock, a day at a time: nobody works (Baldo has no body here), nothing goes backwards, nothing becomes NaN.
    let last = { ...v.brought, lavorato: v.worked };
    for (let d = 3; d < 3 + 60; d++) {
      k.time = at(d, 'day');
      play(k, 3.5);
      const now = k.ventures().find((x) => x.id === v.id)!;
      expect(Number.isFinite(now.worked)).toBe(true);
      expect(now.worked).toBeGreaterThanOrEqual(last.lavorato);
      last = { ...now.brought, lavorato: now.worked };
    }
    expect(k.saveState()).toBe(true);
    await pause(700);
    const saved = readVentures(k.files[VENTURES_FILE]).find((x) => x.id === v.id)!;
    expect(saved).toMatchObject({ brought: { 'item.ciocco': 10 }, worked: 150 });

    // Reopened: the same venture, the lot at the same stage, the clock where it was.
    k = await Kernel.boot({ files: { ...k.files }, store: memoryStore(), ai: new MockAiModels(), chunks });
    await developAll(k);
    expect(k.ventures().find((x) => x.id === v.id)).toMatchObject({ brought: { 'item.ciocco': 10 }, worked: 150, origin: origin });
    expect(stageOf(k, origin)).toBe(0);

    // The rest is brought and worked: the venture ends, the house stands again, the team remembers it.
    const w = liveVentures(k).find((x) => x.id === v.id)!;
    for (const it of ['item.ciocco', 'item.chiodi']) bring(w, it, 100);
    addWork(w, 1e6);
    play(k, 3.5);
    expect(k.ventures().find((x) => x.id === v.id)!.state).toBe('finished');
    expect(stageOf(k, origin)).toBeUndefined();
    expect(consumed(k).has(origin)).toBe(false);
    expect(k.individualOf('Baldo')?.memories?.some((r) => r.weight === 3 && /finito/.test(r.text))).toBe(true);

    // And a second reopening: finished it stays finished, the house stands.
    expect(k.saveState()).toBe(true);
    await pause(700);
    k = await Kernel.boot({ files: { ...k.files }, store: memoryStore(), ai: new MockAiModels(), chunks });
    await developAll(k);
    expect(k.ventures().find((x) => x.id === v.id)!.state).toBe('finished');
    expect(stageOf(k, origin)).toBeUndefined();
  }, 120000);

  it('the harvest is born once a year from the calendar, where something ripens into what a trade gathers; its season passes', async () => {
    const k = await world();
    const { key, cx, cy, S } = placeOf(k);
    setPeople(k, [{ nome: 'Nives', mestiere: 'contadina', origine: `${key}#t0` }]);
    // Four ripe fields in the place.
    let n = 0;
    for (let i = 0; i < S * S && n < 6; i++) {
      const c = cx * S + (i % S), r = cy * S + Math.floor(i / S);
      if (k.tileAt(c, r) === 'g' && k.setTile(c, r, 'u')) n++;
    }
    expect(n).toBeGreaterThanOrEqual(4);
    k.time = at(YEAR_DAYS + HARVEST_DAY, 'morning');
    play(k, 3.5);
    const h = k.ventures().find((v) => v.type === 'harvest' && v.chunk === key);
    expect(h).toMatchObject({ chunk: key, born_from: 'regola:raccolto', task: { tile: 'u', item: 'item.grano' } });
    expect(h!.team.map((m) => m.name)).toEqual(['Nives']);
    // Once a year: not again the day after, and after its days it is over.
    k.time = at(YEAR_DAYS + HARVEST_DAY + 1, 'morning');
    play(k, 3.5);
    expect(k.ventures().filter((v) => v.type === 'harvest' && v.chunk === key)).toHaveLength(1);
    k.time = at(YEAR_DAYS + HARVEST_DAY + 5, 'morning');
    play(k, 3.5);
    expect(k.ventures().find((v) => v.type === 'harvest' && v.chunk === key)!.state).toBe('finished');
  }, 60000);

  it('three families more than the houses of a place, and free ground that keeps the place joined: a common house; built, it stands', async () => {
    const k = await world();
    const { key, S } = placeOf(k);
    const lots = k.chunks.get(key)!.lots.length;
    setPeople(k, Array.from({ length: lots + 3 }, (_, i) => ({ nome: `Abitante ${i}`, mestiere: i === 0 ? 'fabbro' : 'contadino', origine: `${key}#t${i}` })));
    k.time = at(2, 'morning');
    play(k, 3.5);
    const v = k.ventures().find((x) => x.born_from === 'regola:casa');
    expect(v, 'a common house').toBeDefined();
    expect(v!.area).toBeDefined();
    const ch = k.chunks.get(key)!;
    for (let r = v!.area!.y0; r <= v!.area!.y1; r++) for (let c = v!.area!.x0; c <= v!.area!.x1; c++) expect(k.palette[ch.tiles[r * S + c]]?.solid ?? false).toBe(false);
    expect(v!.team.length).toBe(3);
    // Built: it stands as the others do.
    const w = liveVentures(k).find((x) => x.id === v!.id)!;
    for (const it of ['item.ciocco', 'item.chiodi']) bring(w, it, 100);
    addWork(w, 1e6);
    play(k, 3.5);
    expect(stageOf(k, v!.origin!)).toBeUndefined();
    // Families of one: no more common houses than the families need.
    k.time = at(3, 'morning');
    play(k, 3.5);
    expect(k.ventures().filter((x) => x.born_from === 'regola:casa')).toHaveLength(1);
  }, 60000);

  it('the wanderer brings what the site needs with the button of the panel: from the bag, only what it needs, the team remembers it', async () => {
    const k = await world();
    const { key } = placeOf(k);
    const { id } = aStructure(k);
    const site = { ...k.ecs.get(id, 'pos') };
    setPeople(k, [{ nome: 'Baldo', mestiere: 'fabbro', origine: `${key}#t0` }]);
    worker(k, 'Baldo', 'fabbro', site.x + 2, site.y + 2);
    (k as unknown as { breakEntity(id: number): void }).breakEntity(id);
    addItem(k.inventory(), 'item.ciocco', 30, { weight: 0, stack: 99 } as never);
    // Far: nothing is taken.
    k.uiAction('worksite', 'bring');
    expect(k.ventures()[0].brought).toEqual({});
    const p = k.ecs.get(k.wandererEntity, 'pos');
    p.x = site.x + 1;
    p.y = site.y + 1;
    k.uiAction('worksite', 'bring');
    expect(k.ventures()[0].brought).toEqual({ 'item.ciocco': 16 });
    expect(k.individualOf('Baldo')?.memories?.some((r) => r.weight === 2 && /materiale/.test(r.text))).toBe(true);
  }, 60000);

  it('where a wanderer is, for the site, is where the carpet took them: not their position on the carpet', async () => {
    const k = await world();
    const { key } = placeOf(k);
    const { id } = aStructure(k);
    const site = { ...k.ecs.get(id, 'pos') };
    setPeople(k, [{ nome: 'Baldo', mestiere: 'fabbro', origine: `${key}#t0` }]);
    (k as unknown as { breakEntity(id: number): void }).breakEntity(id);
    addItem(k.inventory(), 'item.ciocco', 30, { weight: 0, stack: 99 } as never);
    const carpet = k.carpet()!;
    // Carried far from the site, standing right on its coordinates on the carpet: too far to bring anything, and no site in the panel.
    const p = k.ecs.get(k.wandererEntity, 'pos');
    p.x = site.x + 1;
    p.y = site.y + 1;
    carpet.ox = 100;
    carpet.oy = 100;
    k.uiAction('worksite', 'bring');
    expect(k.ventures()[0].brought).toEqual({});
    play(k, 1.5);
    expect(k.ecs.get(k.wandererEntity, 'worksite')).toBeUndefined();
    // Carried next to it, at the centre of the carpet: what the game is, the panel says the site and the button brings.
    p.x = 0;
    p.y = 0;
    carpet.ox = site.x + 1;
    carpet.oy = site.y + 1;
    play(k, 1.5);
    expect(k.ecs.get(k.wandererEntity, 'worksite')?.title).toBe(k.ventures()[0].title);
    k.uiAction('worksite', 'bring');
    expect(k.ventures()[0].brought).toEqual({ 'item.ciocco': 16 });
  }, 60000);
});
