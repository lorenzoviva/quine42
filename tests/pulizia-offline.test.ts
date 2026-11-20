// T454: the cleaning of the universes the local models wrote in before T433 (lab/scripts/pulisci-offline.ts) knows their places and their
// individuals by what the local models write today (a change in mock.ts that it would not see fails here), and never takes a place or a person
// of the Council for theirs.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { MemoryChunks, type ChunkRecord } from '../src/kernel/chunks';
import { Kernel } from '../src/kernel/kernel';
import { readPeople } from '../src/kernel/npc/model';
import { memoryStore } from '../src/kernel/repo';
import { TIMELESS_LAYOUTS } from '../src/kernel/themes';
import { agedSeedLayouts, cleanGraph, cleanPeople, isLocalPerson, isLocalPlan, planGoes, type PersonLike } from '../lab/scripts/pulisci-offline';
import { develop } from './world';

class Kept extends MemoryChunks {
  plans: ChunkRecord[] = [];
  async save(key: string, record: ChunkRecord): Promise<void> {
    this.plans.push(record);
    return super.save(key, record);
  }
}

describe('la pulizia dei modelli locali (T454)', () => {
  it('riconosce ogni luogo e ogni individuo che i modelli locali scrivono oggi', async () => {
    const chunks = new Kept();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), chunks });
    await develop(k);
    const places: Array<[number, number]> = [];
    for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) places.push([x, y]);
    for (const [x, y] of places) await k.planAhead(x, y);
    let born = 0;
    for (const [x, y] of places) born += await k.peopleOf(x, y);
    expect(chunks.plans.length).toBeGreaterThan(20);
    for (const r of chunks.plans) expect(isLocalPlan(r.plan as never), JSON.stringify(r.plan?.place)).toBe(true);
    const people = readPeople(k.files).people;
    expect(born).toBeGreaterThan(0);
    expect(people.length).toBeGreaterThan(0);
    for (const p of people) expect(isLocalPerson(p as never), p.name).toBe(true);
  }, 60_000);

  it('non tocca i luoghi né le persone del Concilio (gli universi di Claude Cloud, T273)', async () => {
    const root = 'lab/banco/universi-cloud';
    let plans = 0;
    for (const name of ['orichalcum', 'neapolis', 'sidera']) {
      const dir = path.join(root, name, 'maps');
      for (const f of await fs.readdir(dir)) {
        const plan = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8')).plan;
        expect(isLocalPlan(plan), `${name} ${f}`).toBe(false);
        plans++;
      }
      const people = JSON.parse(await fs.readFile(path.join(root, name, 'world', 'people.json'), 'utf8'));
      for (const p of people.persone ?? people.people ?? []) expect(isLocalPerson({ story: p.storia ?? p.story, routine: (p.routine ?? []).map((r: { fa?: string; does?: string }) => ({ does: r.fa ?? r.does })) }), p.nome ?? p.name).toBe(false);
    }
    expect(plans).toBeGreaterThan(40);
  });

  it('gli ambienti del seme che vanno sono quelli di un’età, mai quelli senza tempo', () => {
    const aged = agedSeedLayouts();
    expect(aged).toContain('castle');
    expect(aged).toContain('dragon_lair');
    for (const id of TIMELESS_LAYOUTS) expect(aged).not.toContain(id);
    const gone = new Set(aged);
    expect(planGoes({ place: { name: 'Caserma del Porto', description: 'Una caserma vera.' }, layout: 'barracks' }, gone)).toBe(true);
    expect(planGoes({ place: { name: 'Fonderie Ramelli', description: 'Forni d’oricalco.' }, layout: 'fonderia' }, gone)).toBe(false);
    expect(planGoes({ place: { name: 'Bosco Fitto', description: 'Alberi.' }, layout: 'woods' }, gone)).toBe(false);
  });

  it('toglie i legami con chi se ne va, i suoi nodi e quelli dei luoghi', () => {
    const local = { name: 'Gemma', story: 'È nata qui e da qui non è mai riuscita ad andarsene, anche se ci ha provato.', routine: [] };
    const kept = { name: 'Mora', story: 'Una gatta del porto.', family: [{ name: 'Gemma' }, { name: 'Lucia' }] };
    const out = cleanPeople<PersonLike>([kept, local, { name: 'Lucia', story: 'Vende il pesce.' }]);
    expect(out.gone.map((p) => p.name)).toEqual(['Gemma']);
    expect(out.kept[0].family).toEqual([{ name: 'Lucia' }]);
    expect(out.bonds).toBe(1);
    const graph = [
      '{"directed":true,"multigraph":true,"graph":{"hash":"x"},',
      '"nodes":[',
      '{"id":"chunk:1_1","tipo":"chunk","cx":1,"cy":1,"label":"Piazza","descrizione":"Vera."},',
      '{"id":"chunk:2_2","tipo":"chunk","cx":2,"cy":2,"label":"Prato di Valmora","descrizione":"x"},',
      '{"id":"individual:gemma","tipo":"individual","label":"Gemma"},',
      '{"id":"environment:castle","tipo":"environment"}',
      '],',
      '"links":[',
      '{"source":"individual:gemma","target":"chunk:1_1"},',
      '{"source":"chunk:1_1","target":"environment:castle"},',
      '{"source":"chunk:1_1","target":"chunk:1_1"}',
      ']}',
    ].join('\n');
    const g = cleanGraph(graph, new Set(), new Set(['individual:gemma']), new Set(['castle']));
    expect(g.nodes).toBe(3);
    const data = JSON.parse(g.text);
    expect(data.nodes.map((n: { id: string }) => n.id)).toEqual(['chunk:1_1']);
    expect(data.links).toHaveLength(1);
  });
});
