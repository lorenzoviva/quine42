// T245f (ADR-0149): out of sight. A place nobody sees has no entities and no Lua: once a day, when the day's work ends, the kernel
// keeps its accounts (a venture takes from the deposit and adds a day's work of its team, the trades fill their deposits); when the
// place is seen again what ripened ripens, the buildings are at the stage their ventures reached, and `on_return` says how long it was.
// In a world of many it is the same kernel, with two wanderers far from the place and from each other. No call to the models.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { MemoryChunks } from '../src/kernel/chunks';
import { dailyProduce, type JobProgram } from '../src/kernel/jobs';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import type { Venture } from '../src/kernel/ventures';
import type { FileMap } from '../src/kernel/types';
import { developAll, manyPlayers } from './espressivita/banco';

const DAY = Kernel.DAY_SECONDS;
const at = (n: number, phase: 'mattina' | 'giorno' | 'sera' | 'notte') => (n + { mattina: 0, giorno: 0.12, sera: 0.42, notte: 0.58 }[phase] - 0.12) * DAY + 1;
const STEP = 1 / 20;
const play = (k: Kernel, s: number) => {
  for (let t = 0; t < s; t += STEP) k.tick(STEP);
};
const program = (id: string): JobProgram => JSON.parse(bundledFiles[`modules/lavoro.${id}/manifest.json`]).mestieri[0];

/** A module that hears the returns: it keeps the last one in its store. */
const RETURNS: FileMap = {
  'modules/prova.ritorno/manifest.json': JSON.stringify({ id: 'prova.ritorno', name: 'Chi torna', kind: 'system', logic: 'logic.lua', order: 99 }),
  'modules/prova.ritorno/logic.lua': 'local M = {}\nfunction M.update(dt) end\nfunction M.on_return(luogo, trascorso)\n  world.store_set("ultimo", { luogo = luogo, trascorso = trascorso })\nend\nreturn M\n',
};

describe('what a trade brings to its deposit in a day', () => {
  it('what it gathers or makes and carries to the deposit, and what making it uses up', () => {
    expect(dailyProduce(program('contadino')).gathered['item.grano']).toBeGreaterThan(0);
    expect(dailyProduce(program('boscaiolo')).gathered['item.ciocco']).toBeGreaterThan(0);
    const smith = dailyProduce(program('fabbro'));
    expect(smith.made.some((m) => m.oggetto === 'item.chiodi' && m.con === 'item.ciocco')).toBe(true);
    // A guard carries nothing to a deposit.
    expect(dailyProduce(program('guardia'))).toEqual({ gathered: {}, made: [] });
  });
});

function setPeople(k: Kernel, list: Array<{ nome: string; mestiere: string; origine: string }>): void {
  const src = JSON.stringify({ persone: list.map((p) => ({ tipo: 'npc.villager', routine: [], famiglia: [], ...p })), attesi: [] }, null, 2) + '\n';
  (k as unknown as { repo: { write(p: string, s: string): void } }).repo.write('world/people.json', src);
  (k as unknown as { files: FileMap }).files = { ...k.files, 'world/people.json': src };
}

const live = (k: Kernel) => (k as unknown as { ventureList: Venture[] }).ventureList;
const loaded = (k: Kernel, key: string) => k.chunks.get(key)?.stage === 'planned';

/**
 * Moves the wanderer acting this many places along x (the carpet moves), more times if needed, until `until` holds: the kernel
 * lets the places go only when many more are loaded than seen. How far it went, in places.
 */
async function goAway(k: Kernel, places: number, until: () => boolean): Promise<number> {
  let gone = 0;
  for (let jump = 0; jump < 3 && !until(); jump++) {
    k.carpet()!.ox += places * k.config.chunkSize;
    gone += places;
    for (let i = 0; i < 400 && !until(); i++) {
      k.tick(STEP);
      await new Promise((r) => setTimeout(r, 2));
    }
  }
  expect(until()).toBe(true);
  return gone;
}

describe('a place nobody sees', () => {
  it('the venture goes on by accounts, the trades fill the deposit, and back there the field is ripe, the house at its stage, on_return says how long', async () => {
    const k = await Kernel.boot({ files: { ...bundledFiles, ...RETURNS }, store: memoryStore(), ai: new MockAiModels(), chunks: new MemoryChunks() });
    await developAll(k);
    for (const id of k.ecs.query('mind')) k.ecs.destroy(id);
    const pc = k.wandererCarpet();
    const S = k.config.chunkSize;
    const key = `${Math.floor(pc.x / S)},${Math.floor(pc.y / S)}`;
    const [cx, cy] = key.split(',').map(Number);
    setPeople(k, [
      { nome: 'Baldo', mestiere: 'fabbro', origine: `${key}#t0` },
      { nome: 'Ivo', mestiere: 'oste', origine: `${key}#t1` },
      // A farmer of a place far away: in no team (too far to be asked), her trade fills the deposit of her place.
      { nome: 'Nives', mestiere: 'contadina', origine: `${cx - 5},${cy}#t2` },
    ]);
    // A house falls; a field is sown today.
    const sid = k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key.startsWith(`${key}#s`))!;
    const origin = k.ecs.get(sid, 'origin').key;
    (k as unknown as { breakEntity(id: number): void }).breakEntity(sid);
    const v = live(k)[0];
    expect(v.squadra.map((m) => m.nome).sort()).toEqual(['Baldo', 'Ivo']);
    let field: [number, number] | undefined;
    for (let i = 0; i < S * S && !field; i++) {
      const c = cx * S + (i % S), r = cy * S + Math.floor(i / S);
      if (k.tileAt(c, r) === 'g' && k.setTile(c, r, 'e')) field = [c, r];
    }
    expect(field).toBeDefined();
    k.stores.set('sys.lavoro', `deposito:${key.replace(',', ':')}`, { 'item.ciocco': 16, 'item.chiodi': 3 });

    // Away: the place unloads.
    const day0 = k.day();
    const gone = await goAway(k, 12, () => !loaded(k, key));
    // Three evenings pass where nobody sees it.
    for (let d = 1; d <= 3; d++) {
      k.time = at(day0 + d, 'sera');
      play(k, 3.5);
    }
    const now = k.ventures().find((x) => x.id === v.id)!;
    expect(now.portati).toEqual({ 'item.ciocco': 16, 'item.chiodi': 3 });
    // Two of them, three days of work, as far as the materials let it: the ground floor and the walls are done, not the roof's nails.
    expect(now.lavorato).toBeGreaterThan(0);
    expect(now.lavorato).toBeLessThanOrEqual(2 * 3 * Kernel.AWAY_WORK);
    // The deposit gave what was needed; the trades of the place (the farmer, not in the team) filled it again.
    const dep = k.placeDeposit(key);
    expect(dep['item.ciocco'] ?? 0).toBe(0);
    expect(k.placeDeposit(`${cx - 5},${cy}`)['item.grano']).toBeGreaterThan(0);
    // A clock moved forward counts once: the same evening again adds nothing.
    const worked = now.lavorato;
    play(k, 3.5);
    expect(k.ventures().find((x) => x.id === v.id)!.lavorato).toBe(worked);

    // Back: the field sown three days ago is ripe, the house is at the stage its venture reached, on_return heard it.
    await goAway(k, -gone, () => loaded(k, key));
    expect(k.tileAt(field![0], field![1])).toBe('u');
    const stage = k.ecs.get(k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key === origin)!, 'struttura').stadio;
    expect(stage).toBeGreaterThan(0);
    expect(k.chunks.get(key)!.plan!.stadi?.[origin]).toBe(stage);
    const heard = k.stores.get('prova.ritorno', 'ultimo') as { luogo: string; trascorso: number } | undefined;
    expect(heard?.luogo).toBe(key);
    expect(heard!.trascorso).toBeGreaterThanOrEqual(2 * DAY);
    expect(k.chunks.get(key)!.plan!.visto).toBeUndefined();
  }, 120000);

  it('in a world of many: two wanderers far from the place and from each other, the server keeps its accounts; who comes back sees the result', async () => {
    const k = await Kernel.boot({ files: manyPlayers(bundledFiles), store: memoryStore(), ai: new MockAiModels(), chunks: new MemoryChunks() });
    await developAll(k);
    for (const id of k.ecs.query('mind')) k.ecs.destroy(id);
    const S = k.config.chunkSize;
    const me = k.wanderer().id;
    const pc = k.wandererCarpet();
    const key = `${Math.floor(pc.x / S)},${Math.floor(pc.y / S)}`;
    setPeople(k, [{ nome: 'Baldo', mestiere: 'fabbro', origine: `${key}#t0` }]);
    const sid = k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key.startsWith(`${key}#s`))!;
    const origin = k.ecs.get(sid, 'origin').key;
    (k as unknown as { breakEntity(id: number): void }).breakEntity(sid);
    k.stores.set('sys.lavoro', `deposito:${key.replace(',', ':')}`, { 'item.ciocco': 4 });
    // Ugo arrives, and goes the other way; the master goes one way.
    expect(k.addWanderer('ugo', 'Ugo')).toBeDefined();
    k.as('ugo', () => (k.carpet()!.oy -= 12 * S));
    await goAway(k, 12, () => !loaded(k, key));
    const day0 = k.day();
    for (let d = 1; d <= 2; d++) {
      k.time = at(day0 + d, 'sera');
      play(k, 3.5);
    }
    const v = k.ventures().find((x) => x.origine === origin)!;
    expect(v.portati).toEqual({ 'item.ciocco': 4 });
    expect(v.lavorato).toBeGreaterThanOrEqual(200);
    // Ugo comes back: the house is past its ground floor, for whoever looks.
    k.as('ugo', () => (k.carpet()!.oy += 12 * S));
    for (let i = 0; i < 600 && !loaded(k, key); i++) {
      k.tick(STEP);
      await new Promise((r) => setTimeout(r, 5));
    }
    expect(loaded(k, key)).toBe(true);
    const back = k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key === origin)!;
    expect(k.ecs.get(back, 'struttura').stadio).toBe(0.2);
    expect(me).toBeDefined();
  }, 120000);
});
