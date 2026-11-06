// T298: the trades of orichalcum, neapolis and sidera (lab/banco/universi-cloud/, installed by `npm run universi:cloud`). Each universe
// has `sys.lavoro` and its own programs `lavoro.<mestiere>`, in its theme, with the items they need: every person with a trade has a
// program (the animals have none: a team takes who has a program, ADR-0147), and a building that falls is rebuilt by the people of the
// place with what their trades bring to the deposits (`item.ciocco` and `item.chiodi`, named in the world's words). On the real Kernel,
// as installed (`componi`: the seed's upgrade included), with the offline models only. No call to a model.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { lexiconWords, metaBreak } from '../src/kernel/fourthwall';
import { matchJob, validateJobProgram } from '../src/kernel/jobs';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { ventureProgress, type Venture } from '../src/kernel/ventures';
import { negozioMappe } from '../lab/banco/universi-cloud/strumenti/carica';
import { UNIVERSI } from '../lab/banco/universi-cloud/strumenti/cloud';
import { componi } from '../lab/banco/universi-cloud/strumenti/installa';

const STEP = 1 / 20;
const DAY = Kernel.DAY_SECONDS;
const at = (n: number, phase: 'mattina' | 'giorno' | 'sera' | 'notte') => (n + { mattina: 0, giorno: 0.12, sera: 0.42, notte: 0.58 }[phase] - 0.12) * DAY + 1;

/** Each universe, the place where a building falls (it has one, and the trades that make what rebuilds it), what its trades make there. */
const CASI = [
  { nome: 'orichalcum', luogo: '0,-1', fa: 'fabbro', programmi: 9 },
  { nome: 'neapolis', luogo: '1,2', fa: 'portuale', programmi: 12 },
  { nome: 'sidera', luogo: '-2,-2', fa: 'fabbro', programmi: 13 },
];

interface Persona {
  nome: string;
  specie?: string;
  mestiere: string;
  origine: string;
}

async function avvia(nome: string) {
  const u = UNIVERSI.find((x) => x.nome === nome)!;
  const { files, maps } = componi(u);
  const records = Object.fromEntries(Object.entries(maps).map(([p, t]) => [p.slice(5, -5), JSON.parse(t)]));
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), chunks: negozioMappe(files, records) });
  // No tick yet: the first places to load are those around the place of the case (`vaiA`), so its individuals are there first (a
  // place holds at most `NPC_CAP` individuals of one kind loaded, and the places the offline Cartographer makes take some).
  return { k, files };
}

let ticks = 0;
const faults = new Set<string>();
function play(k: Kernel, seconds: number, until?: () => boolean): void {
  for (let t = 0; t < seconds && !until?.(); t += STEP) {
    k.tick(STEP);
    ticks++;
    for (const f of k.faults.list()) faults.add(`${f.key}: ${f.message}`);
  }
}

const loaded = (k: Kernel, key: string) => k.chunks.get(key)?.stage === 'planned';

/** The wanderer to the middle of a place (the carpet moves, as `verifica.ts` does), until it is planned. */
async function vaiA(k: Kernel, key: string): Promise<void> {
  const [cx, cy] = key.split(',').map(Number);
  const S = k.config.chunkSize;
  const c = k.carpet()!;
  const p = k.wandererPos();
  c.ox = cx * S + S / 2 - p.x;
  c.oy = cy * S + S / 2 - p.y;
  for (let i = 0; i < 400 && !loaded(k, key); i++) {
    play(k, STEP);
    await new Promise((r) => setTimeout(r, 2));
  }
  expect(loaded(k, key), key).toBe(true);
  // The individuals of the place come a moment after its plan (the forms they stand by); they are who `people.json` says (their origin
  // is the object of the plan they stand for).
  const here = () => k.ecs.query('mind', 'origin').filter((id) => String(k.ecs.get(id, 'origin').key).startsWith(`${key}#`));
  for (let i = 0; i < 200 && !here().length; i++) {
    play(k, STEP);
    await new Promise((r) => setTimeout(r, 5));
  }
  for (const id of here()) await k.ensureIdentity(id);
}

/** Far away along x, until the place is let go (the kernel unloads only when many more are loaded than seen). */
async function lontano(k: Kernel, key: string): Promise<void> {
  for (let jump = 0; jump < 3 && loaded(k, key); jump++) {
    k.carpet()!.ox += 12 * k.config.chunkSize;
    for (let i = 0; i < 400 && loaded(k, key); i++) {
      play(k, STEP);
      await new Promise((r) => setTimeout(r, 2));
    }
  }
  expect(loaded(k, key), key).toBe(false);
}

const stageOf = (k: Kernel, origin: string) => {
  const id = k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key === origin);
  return id === undefined ? null : k.ecs.get(id, 'struttura').stadio;
};
const liveVentures = (k: Kernel) => (k as unknown as { ventureList: Venture[] }).ventureList;

describe('the trades of the three universes of Claude Cloud (T298)', () => {
  // The variety of the loaded world (at most `NPC_CAP` individuals of one kind) is not what this test is about: the places the offline
  // Cartographer makes around the case take individuals of the same kinds, and which ones come first depends on the order the places
  // load in. Here everyone of the place of the case is there.
  const cap = Kernel.NPC_CAP;
  beforeAll(() => {
    Kernel.NPC_CAP = 99;
  });
  afterAll(() => {
    Kernel.NPC_CAP = cap;
  });

  for (const caso of CASI) {
    describe(caso.nome, () => {
      it('every person with a trade has a program of its universe; every program passes its validator; the animals have none', async () => {
        const u = UNIVERSI.find((x) => x.nome === caso.nome)!;
        const { files } = componi(u);
        const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
        const programs = k.jobPrograms();
        // Every module with `mestieri` gives its program: none is dropped (the kernel would say why in the registry).
        const modules = Object.keys(files).filter((p) => /^modules\/lavoro\.[^/]+\/manifest\.json$/.test(p));
        expect(modules.length).toBe(caso.programmi);
        expect(programs.length).toBe(caso.programmi);
        expect(files['modules/sys.lavoro/manifest.json']).toBeTruthy();
        const world = { codes: new Set(Object.keys(k.palette)), items: new Set(k.content.items.keys()) };
        for (const p of modules) for (const raw of JSON.parse(files[p]).mestieri) expect(validateJobProgram(raw, world).errors, p).toEqual([]);
        // What rebuilds a house is in the registry, with a name of the world.
        for (const it of ['item.ciocco', 'item.chiodi']) expect(k.content.items.get(it)?.name, it).toBeTruthy();
        const persone = JSON.parse(files['world/people.json']).persone as Persona[];
        for (const p of persone) {
          const job = matchJob(p.mestiere, programs);
          if (p.specie === 'persona') expect(job?.id, `${p.nome}, ${p.mestiere}`).toBeDefined();
          else expect(job, `${p.nome}, ${p.mestiere}`).toBeUndefined();
        }
        // A name is in one program only.
        const names = programs.flatMap((p) => p.nomi);
        expect(new Set(names).size).toBe(names.length);
        // Their texts are of the world (rule 0): names, descriptions, what the items are, what people say at work.
        const words = lexiconWords(files['world/lessico.md'] ?? '');
        const texts = (o: unknown): string[] => (typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(texts) : o && typeof o === 'object' ? Object.values(o).flatMap(texts) : []);
        for (const p of modules) for (const t of texts(JSON.parse(files[p]))) expect(metaBreak(t, words), `${p}: ${t}`).toBeUndefined();
        expect(k.faults.list()).toEqual([]);
      }, 60000);

      it('a day of work, and a building that falls: it rises stage by stage and stands whole again; no fault', async () => {
        ticks = 0;
        faults.clear();
        const { k } = await avvia(caso.nome);
        const key = caso.luogo;
        const total = () => Object.values(k.placeDeposit(key)).reduce((a, b) => a + b, 0);

        // The world lives some days where nobody looks (the wanderer is far away from the start): the trades of the place fill its deposit.
        const S = k.config.chunkSize;
        k.carpet()!.ox += 24 * S;
        play(k, 2);
        expect(loaded(k, key)).toBe(false);
        for (let d = 1; d <= 8; d++) {
          k.time = at(d, 'sera');
          play(k, 3.5);
        }
        const dep = k.placeDeposit(key);
        expect(dep['item.ciocco'] ?? 0).toBeGreaterThan(0);
        expect(dep['item.chiodi'] ?? 0).toBeGreaterThan(0);

        // A day of work in the place: everyone with a program has their tasks; what the trade of the place makes is made and carried
        // to the deposit in the evening.
        await vaiA(k, key);
        k.time = at(9, 'mattina');
        play(k, 30);
        const workers = k.ecs.query('mestiere', 'identity').filter((id) => k.ecs.get(id, 'mestiere').luogo === key);
        expect(workers.length).toBeGreaterThan(0);
        expect(workers.some((id) => k.ecs.get(id, 'mestiere').id === caso.fa)).toBe(true);
        k.time = at(9, 'giorno');
        const made = () => workers.some((id) => Object.values((k.ecs.get(id, 'carico') ?? {}) as Record<string, number>).some((n) => n > 0));
        play(k, 150, made);
        expect(made()).toBe(true);
        const before = total();
        k.time = at(9, 'sera');
        play(k, 150, () => total() > before);
        expect(total()).toBeGreaterThan(before);
        k.time = at(9, 'notte');
        play(k, 10);

        // A building falls: its rebuilding is born with a team of people who have a program, at stage 0 (stakes and a rope).
        const sid = k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key.startsWith(`${key}#s`));
        expect(sid, `${key} has a building`).toBeDefined();
        const origin = k.ecs.get(sid!, 'origin').key as string;
        (k as unknown as { breakEntity(id: number): void }).breakEntity(sid!);
        const v = liveVentures(k).find((x) => x.origine === origin)!;
        expect(v).toMatchObject({ tipo: 'costruzione', luogo: key, nato_da: 'regola:ricostruzione' });
        expect(v.squadra.length).toBeGreaterThan(0);
        // Who is in it has a program (the people the offline Narrator adds in the places around count too).
        const ora = JSON.parse(k.files['world/people.json']).persone as Persona[];
        for (const m of v.squadra) expect(matchJob(ora.find((p) => p.nome === m.nome)?.mestiere, k.jobPrograms()), m.nome).toBeDefined();
        expect(stageOf(k, origin)).toBe(0);

        // In sight, in the day: the team brings from the deposit and works at the site.
        k.time = at(10, 'giorno');
        const cur = () => liveVentures(k).find((x) => x.id === v.id)!;
        const going = () => Object.values(cur().portati).some((n) => n > 0) && cur().lavorato > 0;
        play(k, 150, going);
        expect(Object.values(cur().portati).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);

        // Out of sight, by accounts: a day at a time it rises, never back, until it is done.
        await lontano(k, key);
        const stages: number[] = [];
        for (let d = 11; d <= 30 && liveVentures(k).find((x) => x.id === v.id)!.stato !== 'finita'; d++) {
          k.time = at(d, 'sera');
          play(k, 3.5);
          const now = liveVentures(k).find((x) => x.id === v.id)!;
          stages.push(ventureProgress(now).stadio);
        }
        expect(liveVentures(k).find((x) => x.id === v.id)!.stato).toBe('finita');
        for (let i = 1; i < stages.length; i++) expect(stages[i]).toBeGreaterThanOrEqual(stages[i - 1]);
        // At least one stage between the stakes and the whole was seen.
        expect(stages.some((s) => s > 0 && s < 1)).toBe(true);

        // Back: it stands whole, as it was.
        await vaiA(k, key);
        expect(stageOf(k, origin)).toBeUndefined();
        expect(ticks).toBeGreaterThanOrEqual(600);
        expect([...faults]).toEqual([]);
      }, 240000);
    });
  }
});
