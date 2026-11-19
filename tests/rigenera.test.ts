import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { MOCK_STRUCTURE_PROGRAM } from '../src/kernel/ai/mockStructure';
import type { AiModels, TextCall } from '../src/kernel/ai/models';
import { emptyUsage } from '../src/kernel/ai/models';
import { QueueAiModels } from '../src/kernel/ai/subscription';
import type { WeeklyUsage } from '../src/kernel/deferred';
import { MAX_STEP_TRIES } from '../src/kernel/deferred';
import type { MjNode } from '../src/kernel/mj';
import { BEFORE_REGENERATION, hasStamps, kernelModel, RECUT_TRIES, REGEN_MODEL, requestOf, shownRank, stretchBoxes, stretchRule } from '../src/kernel/regenerate';
import { sizeRank } from '../src/mj/classes';
import { RECUT_TASK } from '../src/kernel/agents/cartography';
import { readShortfalls } from '../src/kernel/shortfalls';
import { answer, beat, diskQueueFetch, take } from '../server/subscriptionQueue';
import { isGenerating, progressFile, worldLit, worldOut } from '../server/generation';
import { generateUniverse, parseArgs, regenerateUniverse } from '../tools/generazione/genera';
import before from '../lab/banco/universi-cloud/ambienti-prima-T407.json';

// T411, ADR-0216: the regeneration of a universe's models, on the subscription's queue as the deferred generation.

/** A queue that is not a queue: the offline models answer, every call is counted. */
class FakeQueue implements AiModels {
  readonly name = 'abbonamento-claude';
  readonly usage = emptyUsage();
  limits = { text: Infinity };
  onCall?: AiModels['onCall'];
  calls: TextCall[] = [];
  private mock = new MockAiModels();
  constructor() {
    this.mock.latency = 0;
  }
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    this.usage.text++;
    return this.mock.text(call);
  }
}

const still = async (): Promise<WeeklyUsage> => ({ usato: 30, reset: '2026-11-19T09:00:00.000Z' });

let dir: string;
const realFetch = globalThis.fetch;
let fetched: string[];

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'quine-rigenera-'));
  fetched = [];
  vi.stubGlobal('fetch', (url: string | URL | Request, init?: RequestInit) => {
    fetched.push(String(url));
    if (!String(url).startsWith('http://127.0.0.1:')) throw new Error(`fetch fuori dalla macchina: ${String(url)}`);
    return realFetch(url, init);
  });
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
});

const git = (name: string, ...args: string[]) => execFileSync('git', ['-c', 'user.name=prova', '-c', 'user.email=prova@quine', ...args], { cwd: path.join(dir, name), encoding: 'utf8' });
const read = (name: string, file: string) => readFileSync(path.join(dir, name, file), 'utf8');
const json = (name: string, file: string) => JSON.parse(read(name, file));
const write = (name: string, file: string, data: unknown) => writeFileSync(path.join(dir, name, file), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');
const mapOf = (name: string, cx: number, cy: number) => readdirSync(path.join(dir, name, 'maps')).find((f) => f.endsWith(`_${cx}_${cy}.json`))!;
const noApi = () => expect(fetched.filter((u) => /gemini|googleapis|openrouter|\/api\/coda/.test(u))).toEqual([]);

const FORNO = 'struttura-il-forno-del-borgo';
/** The village of before T407 (houses of 6 × 5, cut for 20 voxels a tile), as a universe of before keeps it. */
const OLD_VILLAGE = (before as { layouts: Record<string, { program: MjNode }> }).layouts.village;

/** What the offline Genesis's world wears and the library does not have yet: a thing (furniture) and a character (person). */
const PANE = 'obj-pane';
const VECCHIO = 'npc-vecchio';

/**
 * A universe of before: born from the seed and its Genesis (offline), the start planned with the bakery, then made as one of before T405-T407
 * is: the start on the village of before (houses of 6 × 5, cut for 20 voxels a tile), its plan without `vpt`; the bakery's entry at 20 with a
 * program of before; the thing and the character its world wears with programs of before (the seed's bed and peasant woman).
 */
async function universeOfBefore(name: string): Promise<void> {
  const q = new FakeQueue();
  const made = await generateUniverse({ name, dir, queue: q, weekly: still, luoghi: 1, modelli: 0, brani: 0 });
  expect(made.esito).toBe('finito');
  const index = json(name, 'models/index.json');
  index[FORNO] = { class: 'structure', name: 'il forno del borgo', author: 'di prima (T273)', vpt: 20 };
  index[PANE] = { class: 'furniture', name: 'Pane', author: 'di prima (T270)' };
  index[VECCHIO] = { class: 'person', name: 'Vecchio pastore', author: 'di prima (T270)' };
  write(name, 'models/index.json', JSON.stringify(index, null, 1) + '\n');
  write(name, `models/${FORNO}.xml`, MOCK_STRUCTURE_PROGRAM);
  write(name, `models/${PANE}.xml`, readFileSync('universe/models/letto.xml', 'utf8'));
  write(name, `models/${VECCHIO}.xml`, readFileSync('universe/models/contadina.xml', 'utf8'));
  const lm = json(name, 'modules/world.layouts/manifest.json');
  lm.layouts.village = OLD_VILLAGE;
  write(name, 'modules/world.layouts/manifest.json', lm);
  const file = `maps/${mapOf(name, 0, 0)}`;
  const rec = json(name, file);
  expect(rec.plan.structures).toEqual([{ concept: 'il forno del borgo' }]);
  rec.plan.layout = 'village';
  delete rec.plan.vpt;
  write(name, file, rec);
  git(name, 'add', '-A');
  git(name, 'commit', '-qm', 'un universo di prima (T411)');
}

describe('la rigenerazione dei modelli (T411): i pezzi', () => {
  it('una regola che disegna un edificio cresce di 20/16, almeno 7, coi muri attorno e una porta sola', () => {
    const walls = new Set(['h']), doors = new Set(['d']);
    const box = { in: Array(5).fill('[gpmen]'.repeat(5)).join('/'), out: 'hhhhh/hfffh/hfffh/hfffh/hhdhh' };
    const s = stretchRule(box, walls, doors)!;
    const rows = s.out.split('/');
    expect(rows).toHaveLength(7);
    expect(rows.every((r) => r.length === 7)).toBe(true);
    expect(rows[0]).toBe('hhhhhhh');
    expect(rows.slice(1, -1).every((r) => r[0] === 'h' && r[6] === 'h' && /^hf+h$/.test(r))).toBe(true);
    expect([...s.out].filter((c) => c === 'd')).toHaveLength(1);
    expect(rows[6]).toBe('hhhdhhh');
    expect(s.in.split('/')).toEqual(Array(7).fill('[gpmen]'.repeat(7)));
    // 6 × 5 → 8 × 7: what held a Large at 20 holds it at 16.
    const wide = stretchRule({ in: Array(5).fill('g'.repeat(6)).join('/'), out: 'hhhhhh/hffffh/hffffh/hffffh/hhdhhh', p: 0.5 }, walls, doors)!;
    expect(wide.out.split('/').map((r) => r.length)).toEqual(Array(7).fill(8));
    expect(wide.p).toBe(0.5);
    // A small building's (side under 5), a path, a rule whose input is not one code, an open box: as they are.
    expect(stretchRule({ in: 'gggg/gggg/gggg/gggg', out: 'hhhh/hffh/hffh/hdhh' }, walls, doors)).toBeUndefined();
    expect(stretchRule({ in: 'ggggg', out: 'ppppp' }, walls, doors)).toBeUndefined();
    expect(stretchRule({ in: 'ggggg/gtggg/ggggg', out: 'hhhhh/hfffh/hhdhh' }, walls, doors)).toBeUndefined();
    expect(stretchRule({ in: Array(5).fill('ggggg').join('/'), out: 'hhhhh/hfffh/hfffh/hfffh/hhfhh' }, walls, doors)).toBeUndefined();
  });

  it('un programma: crescono le sue case, i nodi ne mettono quante coprivano prima, i timbri restano', () => {
    const palette = { g: { name: 'erba', layer: 'ground', solid: false }, h: { name: 'muro', layer: 'wall', solid: true }, f: { name: 'pavimento', layer: 'floor', solid: false, indoor: true }, d: { name: 'porta', layer: 'door', solid: false } } as never;
    const program = { type: 'sequence', children: [{ type: 'one', rules: [{ in: Array(5).fill('ggggg').join('/'), out: 'hhhhh/hfffh/hfffh/hfffh/hhdhh' }], steps: 4 }, { type: 'stamp', shape: 'house' }, { type: 'one', rules: [{ in: 'gggg/gggg/gggg/gggg', out: 'hhhh/hffh/hffh/hdhh' }], steps: 2 }] } as MjNode;
    const s = stretchBoxes(program, palette);
    expect(s.rules).toBe(1);
    const kids = (s.program as { children: Array<{ steps?: number; rules?: Array<{ out: string }> }> }).children;
    expect(kids[0].rules![0].out.split('/')).toHaveLength(7);
    expect(kids[0].steps).toBe(3);
    expect(kids[2]).toEqual((program as { children: unknown[] }).children[2]);
    expect(hasStamps(s.program)).toBe(true);
    expect(hasStamps(OLD_VILLAGE.program)).toBe(false);
    // The program given is never changed.
    expect((program as { children: Array<{ steps: number }> }).children[0].steps).toBe(4);
  });

  it('i modelli del kernel non si rigenerano; la richiesta dice ciò che il mondo indossa, mai il programma di prima', () => {
    expect(kernelModel('structure', { class: 'structure' })).toBe(true);
    expect(kernelModel('corona-concilio', { class: 'building' })).toBe(true);
    expect(kernelModel('part-cellar', { class: 'structure' })).toBe(true);
    expect(kernelModel('sound-music-woods', { class: 'suono' })).toBe(true);
    expect(kernelModel('letto', { class: 'furniture' })).toBe(false);
    const casa = requestOf('casa-comune-structure-1', { class: 'structure', cellar: 1, vpt: 20 }, [{ kind: 'house', name: 'case di mattoni rossi' }]);
    expect(casa).toMatchObject({ classe: 'structure', dwelling: true, cellar: 1, nome: 'case di mattoni rossi' });
    expect(casa.aspetto).toMatch(/with a cellar under it/);
    expect(casa.previous).toBeUndefined();
    const huge = requestOf('struttura-bistrot-huge', { class: 'structure', size: 'huge' }, [{ kind: 'structure', name: 'bistrot', size: 'huge', cellar: true, place: { name: 'Uffici', description: 'torri di vetro' } }]);
    expect(huge).toMatchObject({ taglia: 'huge', cellar: 2, contesto: 'Uffici' });
    expect(huge.aspetto).toMatch(/at «Uffici» \(torri di vetro\)/);
    const shared = requestOf('persona-vapore', { class: 'person', name: 'Persona del vapore', tint: 'C' }, [
      { kind: 'module', name: 'Fuochista', look: 'tuta di cuoio' },
      { kind: 'module', name: 'Macchinista', look: 'occhiali' },
    ]);
    expect(shared).toMatchObject({ nome: 'Persona del vapore', tinta: true, classe: 'person' });
    expect(shared.aspetto).toBe('Persona del vapore: worn by Fuochista, Macchinista');
    expect(requestOf('letto', { class: 'furniture', name: 'Letto' }, [{ kind: 'module', name: 'Letto', look: 'un letto di legno', context: 'nelle case' }])).toMatchObject({ nome: 'Letto', aspetto: 'un letto di legno', contesto: 'nelle case' });
  });

  it('il comando: --rigenera modelli con le sue opzioni; il resto si rifiuta', () => {
    const o = parseArgs(['neapolis', '--rigenera', 'modelli', '--tipi', 'struttura-cappella,letto', '--tetto', '25', '--modelli', '3'], dir);
    expect(o).toMatchObject({ rigenera: 'modelli', name: 'neapolis', tipi: ['struttura-cappella', 'letto'], tetto: 25, modelli: 3 });
    expect(parseArgs(['neapolis', '--rigenera', 'tutto'], dir)).toMatch(/rigenera: modelli/);
    expect(parseArgs(['neapolis', '--rigenera', 'modelli', '--tema', 'steampunk'], dir)).toMatch(/opzione sconosciuta con --rigenera/);
    expect(parseArgs(['neapolis', '--rigenera', 'modelli', '--classi', 'structure,draghi'], dir)).toMatch(/classi/);
    expect(parseArgs(['neapolis', '--rigenera', 'modelli', '--modello', 'gemini-4-argon'], dir)).toMatch(/modello della CLI/);
    expect(parseArgs(['neapolis', '--rigenera', 'modelli', '--sforzo', 'tantissimo'], dir)).toMatch(/sforzo della CLI/);
    expect(parseArgs(['neapolis', '--modello', 'claude-opus-5-5', '--sforzo', 'high'], dir)).toMatchObject({ modello: 'claude-opus-5-5', sforzo: 'high' });
  });
});

describe('la rigenerazione dei modelli (T411): un universo di prima, dalla coda', () => {
  it('rigenera i modelli che il mondo indossa, la struttura a 16 col suo interno sui lotti rifatti; bibbia, luoghi e persone restano', async () => {
    await universeOfBefore('vecchio');
    const head = git('vecchio', 'rev-parse', 'HEAD').trim();
    const bible = read('vecchio', 'world/bible.json');
    const people = existsSync(path.join(dir, 'vecchio', 'world/people.json')) ? read('vecchio', 'world/people.json') : undefined;
    // A plan the game wrote and the history does not have yet (the store writes the plans without a commit): the state of before has it.
    const start = `maps/${mapOf('vecchio', 0, 0)}`;
    const saved = json('vecchio', start);
    write('vecchio', start, { ...saved, plan: { ...saved.plan, seen: 4321 } });
    const plan0 = json('vecchio', start).plan;
    const q = new FakeQueue();
    const lines: string[] = [];
    const out = await regenerateUniverse({ name: 'vecchio', dir, queue: q, weekly: still, log: (l) => lines.push(l) });
    expect(out.esito).toBe('finito');
    noApi();
    // The environment first, then the types: the thing, the bakery and its interior, the character. Never the kernel's: the generics, the
    // corona, the parts, the wanderer's body; never what the world does not wear.
    expect(out.fatti).toEqual(['ambiente:village', `rigenera:${PANE}`, `rigenera:${FORNO}`, `interno:${FORNO}`, `rigenera:${VECCHIO}`]);
    const sculpted = out.fatti.filter((s) => s.startsWith('rigenera:'));
    // The state of before stays in the history, under its tag: the head of before and what the folder had, never the regeneration's.
    const tagged = git('vecchio', 'rev-parse', `${BEFORE_REGENERATION}^{commit}`).trim();
    expect(git('vecchio', 'rev-parse', `${tagged}^`).trim()).toBe(head);
    const atTag = JSON.parse(git('vecchio', 'show', `${BEFORE_REGENERATION}:${start}`)).plan;
    expect(atTag.seen).toBe(4321);
    expect(atTag.vpt).toBeUndefined();
    expect(JSON.parse(git('vecchio', 'show', `${BEFORE_REGENERATION}:modules/world.layouts/manifest.json`)).layouts.village).toEqual(OLD_VILLAGE);
    // The bakery: at 16 (no `vpt`), sculpted by the CLI's model, furnished by the Scenografo.
    const index = json('vecchio', 'models/index.json');
    expect(index[FORNO].vpt).toBeUndefined();
    expect(index[FORNO]).toMatchObject({ class: 'structure', name: 'il forno del borgo', author: REGEN_MODEL, seeds: 4 });
    expect(index[FORNO].interior.rules.length).toBeGreaterThan(0);
    expect(read('vecchio', `models/${FORNO}.xml`)).toMatch(/sculpted by claude-opus-5-5/);
    for (const s of sculpted) expect(index[s.slice('rigenera:'.length)].author).toBe(REGEN_MODEL);
    // The lots: the village is the seed's of today, the start's plan cut at 16, its place and its things as they were.
    const lm = json('vecchio', 'modules/world.layouts/manifest.json');
    expect(JSON.stringify(lm.layouts.village.program)).not.toBe(JSON.stringify(OLD_VILLAGE.program));
    const plan1 = json('vecchio', `maps/${mapOf('vecchio', 0, 0)}`).plan;
    expect(plan1.vpt).toBe(16);
    expect({ ...plan1, vpt: undefined }).toEqual({ ...plan0, vpt: undefined });
    expect(read('vecchio', 'world/bible.json')).toBe(bible);
    if (people !== undefined) expect(read('vecchio', 'world/people.json')).toBe(people);
    expect(lines.some((l) => /ambiente village: dal seme di oggi/.test(l))).toBe(true);
    // The Sculptor and the Artist on the CLI's model; nothing sculpted again from its program of before.
    const sculptor = q.calls.filter((c) => c.task === 'model.sculpt');
    expect(sculptor.length).toBeGreaterThan(0);
    expect(sculptor.every((c) => c.model === REGEN_MODEL && !/Its current program/.test(c.prompt))).toBe(true);
    expect(q.calls.filter((c) => c.task === 'model.judge').every((c) => c.model === REGEN_MODEL)).toBe(true);
    expect(q.calls.some((c) => c.task === 'interior.design')).toBe(true);
    expect(progressFile(dir, 'vecchio', { tetto: 10 }, 'rigenera-modelli').load().passi).toEqual(out.fatti);
    // The generation's own progress is another file: a universe generated and then regenerated keeps both.
    expect(progressFile(dir, 'vecchio', { tetto: 10 }).load().passi).toContain('genesi');
    expect(isGenerating(dir, 'vecchio')).toBe(false);

    // Again: nothing left, nothing asked, the tag where it was.
    const calls = q.calls.length;
    const again = await regenerateUniverse({ name: 'vecchio', dir, queue: q, weekly: still });
    expect(again).toEqual({ esito: 'finito', fatti: [] });
    expect(q.calls.length).toBe(calls);
    expect(git('vecchio', 'rev-parse', `${BEFORE_REGENERATION}^{commit}`).trim()).toBe(tagged);
  }, 300_000);

  it('il tetto ferma; interrotta e riavviata riprende da dove era arrivata, l’interno compreso; un mondo acceso la rifiuta', async () => {
    await universeOfBefore('ripresa');
    const q = new FakeQueue();
    // The ceiling: 2 % of the week a step, 3 % allowed: the thing, then the ceiling.
    let used = 40;
    const weekly = async (): Promise<WeeklyUsage> => ({ usato: (used += 2), reset: '2026-11-19T09:00:00.000Z' });
    const capped = await regenerateUniverse({ name: 'ripresa', dir, queue: q, weekly, tetto: 3 });
    expect(capped.esito).toBe('tetto');
    expect(capped.motivo).toMatch(/il tetto è 3 %/);
    expect(capped.fatti).toEqual(['ambiente:village']);

    // Raised in its file, the ceiling holds from the next run; stopped after two steps (the thing and the bakery), the next run does the rest.
    const p = progressFile(dir, 'ripresa', { tetto: 10 }, 'rigenera-modelli');
    p.save({ ...p.load(), tetto: 100 });
    let steps = 0;
    const log = (l: string) => void (l.startsWith('passo ') && steps++);
    const first = await regenerateUniverse({ name: 'ripresa', dir, queue: q, weekly: still, log, interrupted: () => steps >= 2 });
    expect(first).toEqual({ esito: 'interrotto', fatti: [`rigenera:${PANE}`, `rigenera:${FORNO}`] });
    const asked = q.calls.length;
    const second = await regenerateUniverse({ name: 'ripresa', dir, queue: q, weekly: still });
    expect(second).toEqual({ esito: 'finito', fatti: [`interno:${FORNO}`, `rigenera:${VECCHIO}`] });
    expect(q.calls.length).toBeGreaterThan(asked);
    expect(q.calls.slice(asked).some((c) => c.task === 'model.sculpt' && c.prompt.includes('forno'))).toBe(false);
    expect(progressFile(dir, 'ripresa', { tetto: 10 }, 'rigenera-modelli').load().passi).toEqual(['ambiente:village', ...first.fatti, ...second.fatti]);
    expect(json('ripresa', 'models/index.json')[FORNO].interior.rules.length).toBeGreaterThan(0);

    // A world lit: nothing asked, nothing written.
    worldLit(dir, 'ripresa');
    const calls = q.calls.length;
    const headBefore = git('ripresa', 'rev-parse', 'HEAD');
    const refused = await regenerateUniverse({ name: 'ripresa', dir, queue: q, weekly: still });
    expect(refused).toEqual({ esito: 'errore', motivo: expect.stringMatching(/mondo acceso/), fatti: [] });
    expect(q.calls.length).toBe(calls);
    expect(git('ripresa', 'rev-parse', 'HEAD')).toBe(headBefore);
    worldOut(dir, 'ripresa');
    // A universe that is not there is not made.
    expect(await regenerateUniverse({ name: 'nessuno', dir, queue: q, weekly: still })).toEqual({ esito: 'errore', motivo: expect.stringMatching(/non esiste/), fatti: [] });
    expect(existsSync(path.join(dir, 'nessuno'))).toBe(false);
    noApi();
  }, 300_000);

  it(`un tipo che la CLI non scrive ferma il giro e si ritenta; dopo ${MAX_STEP_TRIES} giri si lascia e il resto va avanti`, async () => {
    await universeOfBefore('ostinato');
    // A queue that fails every call (the CLI that times out): the step is the first furniture's, every run.
    const failing: AiModels = { name: 'abbonamento-claude', usage: emptyUsage(), limits: { text: Infinity }, text: async () => Promise.reject(new Error('claude: tempo scaduto (non ripetuta)')) };
    const runs = [];
    for (let i = 0; i < MAX_STEP_TRIES; i++) runs.push(await regenerateUniverse({ name: 'ostinato', dir, queue: failing, weekly: still, classi: ['furniture'] }));
    expect(runs.every((r) => r.esito === 'errore' && /tempo scaduto/.test(r.motivo ?? ''))).toBe(true);
    const step = /^(rigenera:[^:]+):/.exec(runs[0].motivo!)![1];
    expect(runs.every((r) => r.motivo!.startsWith(`${step}:`))).toBe(true);
    expect(progressFile(dir, 'ostinato', { tetto: 10 }, 'rigenera-modelli').load().tries).toEqual({ [step]: MAX_STEP_TRIES });
    // The fourth run leaves it and goes on with the others.
    const lines: string[] = [];
    const next = await regenerateUniverse({ name: 'ostinato', dir, queue: new FakeQueue(), weekly: still, classi: ['furniture'], log: (l) => lines.push(l) });
    expect(next.esito).toBe('finito');
    expect(next.fatti).not.toContain(step);
    expect(lines.some((l) => l.includes(`passo ${step} lasciato`))).toBe(true);
  }, 300_000);

  it('dalla coda su disco servita da una CLI finta: ogni richiesta dice il modello e lo sforzo della CLI, il giudizio va con le sue foto', async () => {
    await universeOfBefore('coda');
    const coda = path.join(dir, '.queue');
    await beat(coda, 'claude');
    const served: Array<{ task: string; model?: string; effort?: string; images: number }> = [];
    let serving = true;
    const mock = new MockAiModels();
    mock.latency = 0;
    const dataOf = new Map<string, unknown>();
    const cli = (async () => {
      while (serving) {
        const r = await take(coda, 'claude');
        if (r) {
          served.push({ task: r.task, model: r.model, effort: r.effort, images: r.images?.length ?? 0 });
          try {
            const text = await mock.text({ agent: r.agent, task: r.task, system: r.system, prompt: r.prompt, schema: r.schema as never, data: dataOf.get(r.prompt) as never });
            await answer(coda, r.id, { text, usage: { prompt: 100, output: 50 } });
          } catch (e) {
            await answer(coda, r.id, { errore: (e as Error).message });
          }
        } else await new Promise((res) => setTimeout(res, 2));
      }
    })();
    const disk = new QueueAiModels({ provider: 'claude', fetchImpl: diskQueueFetch(coda), poll: 2, timeout: 60_000, model: REGEN_MODEL, effort: 'low' });
    const queue: AiModels = { name: disk.name, usage: disk.usage, limits: disk.limits, text: (call) => (dataOf.set(call.prompt, call.data), disk.text(call)) };
    const out = await regenerateUniverse({ name: 'coda', dir, queue, weekly: still, classi: ['furniture'], modelli: 1 });
    serving = false;
    await cli;
    expect(out).toEqual({ esito: 'finito', fatti: [`rigenera:${PANE}`] });
    expect(served.length).toBeGreaterThan(0);
    expect(served.every((s) => s.model === REGEN_MODEL && s.effort === 'low')).toBe(true);
    expect(served.filter((s) => s.task === 'model.judge').every((s) => s.images === 1)).toBe(true);
    noApi();
  }, 300_000);
});

// T422: an environment of before that the kernel cannot grow (its houses drawn by a rule whose input is not one set everywhere, not the seed's,
// no stamps), on the start with the bakery: the Cartographer writes it again, the kernel checks the program on the place's draft.
const LANES = 'vicoli';
/** Houses of 6 × 5 with a porch row: the first row of the input is another set, so `stretchRule` does not take it. */
const LANES_PROGRAM: MjNode = {
  type: 'sequence',
  children: [
    { type: 'prl', rules: [{ in: 't', out: 'g', p: 0.8 }] },
    { type: 'one', rules: [{ in: `${'[gp]'.repeat(6)}/${'g'.repeat(6)}/${'g'.repeat(6)}/${'g'.repeat(6)}/${'g'.repeat(6)}`, out: 'hhhhhh/hffffh/hffffh/hffffh/hhhdhh' }], steps: 3 },
  ],
};

async function lanesOfBefore(name: string): Promise<void> {
  await universeOfBefore(name);
  const lm = json(name, 'modules/world.layouts/manifest.json');
  lm.layouts[LANES] = { name: 'Vicoli', description: 'case strette tra i vicoli', environment: 'mixed', program: LANES_PROGRAM };
  write(name, 'modules/world.layouts/manifest.json', lm);
  const file = `maps/${mapOf(name, 0, 0)}`;
  const rec = json(name, file);
  rec.plan.layout = LANES;
  write(name, file, rec);
  git(name, 'add', '-A');
  git(name, 'commit', '-qm', 'i vicoli di prima (T422)');
}

describe("la rigenerazione dei modelli (T422): l'ambiente che il kernel non sa allargare lo riscrive il Cartografo", () => {
  it('il Cartografo lo riscrive, il kernel lo prova sul luogo; i lotti a 16 e la struttura a 16', async () => {
    await lanesOfBefore('vicoli');
    const q = new FakeQueue();
    const lines: string[] = [];
    const out = await regenerateUniverse({ name: 'vicoli', dir, queue: q, weekly: still, classi: ['structure'], log: (l) => lines.push(l) });
    expect(out.esito).toBe('finito');
    expect(out.fatti).toEqual([`ambiente:${LANES}`, `rigenera:${FORNO}`, `interno:${FORNO}`]);
    noApi();
    expect(lines.some((l) => /ambiente vicoli: da riscrivere dal Cartografo, edifici di 7 × 7/.test(l))).toBe(true);
    expect(lines.some((l) => /vicoli: riscritto dal Cartografo al tentativo 1/.test(l))).toBe(true);
    expect(lines.some((l) => /dopo il Cartografo: nessuna struttura a 20/.test(l))).toBe(true);
    // One call of the Cartographer, told the place, its structure and what it needs; the program it wrote is the environment's now.
    const asked = q.calls.filter((c) => c.task === RECUT_TASK);
    expect(asked).toHaveLength(1);
    expect(asked[0].agent).toBe('cartographer');
    expect(asked[0].prompt).toMatch(/il forno del borgo/);
    expect(asked[0].prompt).toMatch(/at least 7 × 7 tiles, walls included/);
    const program = json('vicoli', 'modules/world.layouts/manifest.json').layouts[LANES].program;
    expect(JSON.stringify(program)).not.toBe(JSON.stringify(LANES_PROGRAM));
    expect(JSON.stringify(program)).toMatch(/hhhhhhh\/hfffffh/);
    // The start cut at 16, its place as it was; the bakery at 16, no `vpt`.
    const plan = json('vicoli', `maps/${mapOf('vicoli', 0, 0)}`).plan;
    expect(plan.vpt).toBe(16);
    expect(plan.layout).toBe(LANES);
    expect(json('vicoli', 'models/index.json')[FORNO].vpt).toBeUndefined();
    expect(git('vicoli', 'log', '--format=%s')).toMatch(/l'ambiente vicoli per le strutture a 16 \(riscritto dal Cartografo\)/);
  }, 300_000);

  it(`un programma che non tiene torna al Cartografo col motivo; dopo ${RECUT_TRIES} l'ambiente resta e la struttura a 20`, async () => {
    await lanesOfBefore('ostinati');
    // A Cartographer that answers with the houses of before, every time.
    class Stubborn extends FakeQueue {
      async text(call: TextCall): Promise<string> {
        if (call.task === RECUT_TASK) {
          this.calls.push(call);
          return JSON.stringify({ program_json: JSON.stringify(LANES_PROGRAM), note: 'come prima' });
        }
        return super.text(call);
      }
    }
    const q = new Stubborn();
    const lines: string[] = [];
    const out = await regenerateUniverse({ name: 'ostinati', dir, queue: q, weekly: still, classi: ['structure'], log: (l) => lines.push(l) });
    expect(out.esito).toBe('finito');
    expect(out.fatti).toEqual([`ambiente:${LANES}`, `rigenera:${FORNO}`, `interno:${FORNO}`]);
    const asked = q.calls.filter((c) => c.task === RECUT_TASK);
    expect(asked).toHaveLength(RECUT_TRIES);
    // The second is told why the first did not hold.
    expect(asked[1].prompt).toMatch(/THE PREVIOUS PROGRAM DID NOT HOLD THEM: .*«il forno del borgo» vuole 7 × 7/);
    expect(json('ostinati', 'modules/world.layouts/manifest.json').layouts[LANES].program).toEqual(LANES_PROGRAM);
    expect(json('ostinati', `maps/${mapOf('ostinati', 0, 0)}`).plan.vpt).toBeUndefined();
    expect(json('ostinati', 'models/index.json')[FORNO].vpt).toBe(20);
    expect(lines.some((l) => /vicoli: resta come prima/.test(l))).toBe(true);
    expect(readShortfalls(read('ostinati', 'world/shortfalls.json')).some((s) => s.task === RECUT_TASK && s.agent === 'cartographer')).toBe(true);
    noApi();
  }, 300_000);
});

// T436: an environment the kernel would cut without losing a structure, but that leaves one at 20 (neapolis: the Huge bistrot on houses of
// 7 × 8), goes to the Cartographer when the command names it (`--ambienti`); a run of its own (`--giro`) keeps its own progress.
describe('la rigenerazione dei modelli (T436): gli ambienti chiesti al Cartografo e il giro a parte', () => {
  it('resta a 20 solo dove il 16 la mostrerebbe più piccola: un lotto che non la tiene né a 20 né a 16 la scala comunque', () => {
    // The bistrot of neapolis: Huge (7.5 tiles at 20, 9.375 at 16) on a house of 7 × 8: Large either way, so it goes to 16.
    expect(shownRank({ w: 7, h: 8 }, 'huge', 0.8)).toBe(sizeRank('large'));
    expect(shownRank({ w: 7, h: 8 }, 'huge', 1)).toBe(sizeRank('large'));
    // The tower of the port: Large on a warehouse of 7 × 5, held at 20 (5 tiles), not at 16 (6.25): 20 keeps it.
    expect(shownRank({ w: 7, h: 5 }, 'large', 0.8)).toBe(sizeRank('large'));
    expect(shownRank({ w: 7, h: 5 }, 'large', 1)).toBeLessThan(sizeRank('large'));
    expect(shownRank({ w: 10, h: 10 }, 'huge', 1)).toBe(sizeRank('huge'));
    expect(shownRank(undefined, 'large', 1)).toBe(-1);
  });

  it('il comando: --ambienti e --giro; un giro dal nome che non sta in un file si rifiuta', () => {
    expect(parseArgs(['neapolis', '--rigenera', 'modelli', '--ambienti', 'uffici, porto', '--giro', 't436'], dir)).toMatchObject({ ambienti: ['uffici', 'porto'], giro: 't436' });
    expect(parseArgs(['neapolis', '--rigenera', 'modelli', '--giro', '../fuori'], dir)).toMatch(/giro: lettere minuscole/);
    expect(parseArgs(['neapolis', '--rigenera', 'modelli', '--ambienti', ','], dir)).toMatch(/ambienti/);
    expect(parseArgs(['neapolis', '--ambienti', 'uffici'], dir)).toMatch(/opzione sconosciuta/);
  });

  it("l'ambiente chiesto va al Cartografo anche dove il seme di oggi lo taglierebbe; il giro ha il suo progresso e non rifà ciò che ha fatto", async () => {
    await universeOfBefore('chiesti');
    const q = new FakeQueue();
    const lines: string[] = [];
    const out = await regenerateUniverse({ name: 'chiesti', dir, queue: q, weekly: still, classi: ['structure'], ambienti: ['village', 'nessuno'], giro: 'prova', log: (l) => lines.push(l) });
    expect(out.esito).toBe('finito');
    expect(out.fatti).toEqual(['ambiente:village', `rigenera:${FORNO}`, `interno:${FORNO}`]);
    expect(lines.some((l) => /ambiente village: da riscrivere dal Cartografo, edifici di 7 × 7 \(chiesto dal comando\)/.test(l))).toBe(true);
    expect(lines.some((l) => /ambiente nessuno: nessun luogo pianificato lo usa/.test(l))).toBe(true);
    expect(q.calls.filter((c) => c.task === RECUT_TASK)).toHaveLength(1);
    // The village is the Cartographer's, not the seed's of today nor the one of before; the start at 16.
    const program = json('chiesti', 'modules/world.layouts/manifest.json').layouts.village.program;
    expect(program).not.toEqual(OLD_VILLAGE.program);
    expect(git('chiesti', 'log', '--format=%s')).toMatch(/l'ambiente village per le strutture a 16 \(riscritto dal Cartografo\)/);
    expect(json('chiesti', `maps/${mapOf('chiesti', 0, 0)}`).plan.vpt).toBe(16);
    // Its own progress; the generator's file is not written.
    expect(progressFile(dir, 'chiesti', { tetto: 10 }, 'rigenera-modelli-prova').load().passi).toEqual(out.fatti);
    expect(existsSync(path.join(dir, '.generation', 'chiesti.rigenera-modelli.json'))).toBe(false);
    // Again, the same run: nothing to do, the Cartographer is not asked twice.
    const again = await regenerateUniverse({ name: 'chiesti', dir, queue: q, weekly: still, classi: ['structure'], ambienti: ['village'], giro: 'prova' });
    expect(again).toMatchObject({ esito: 'finito', fatti: [] });
    expect(q.calls.filter((c) => c.task === RECUT_TASK)).toHaveLength(1);
    noApi();
  }, 300_000);
});
