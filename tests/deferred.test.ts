import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { AiModels, TextCall } from '../src/kernel/ai/models';
import { emptyUsage } from '../src/kernel/ai/models';
import { QueueAiModels } from '../src/kernel/ai/subscription';
import { DeferredModels, deferredTable, spiral, StepGate, type GateTarget, type WeeklyUsage } from '../src/kernel/deferred';
import { answer, beat, diskQueueFetch, take } from '../server/subscriptionQueue';
import { isGenerating, isWorldLit, progressFile, takeGeneration, worldLit, worldOut } from '../server/generation';
import { worldRefusal } from '../server/session';
import { generateUniverse } from '../tools/generazione/genera';

// T207, ADR-0137: a universe generated before anyone plays, only on the subscriptions' queue.

/** A queue that is not a queue: the offline models answer, every call is counted. */
class FakeQueue implements AiModels {
  readonly name = 'abbonamento-claude';
  readonly usage = emptyUsage();
  limits = { text: Infinity };
  onCall?: AiModels['onCall'];
  calls: TextCall[] = [];
  private mock = new MockAiModels();
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    this.usage.text++;
    return this.mock.text(call);
  }
}

/** A week that never moves (the ceiling is not what is tested). */
const still = async (): Promise<WeeklyUsage> => ({ usato: 30, reset: '2026-11-12T08:00:00.000Z' });

let dir: string;
const realFetch = globalThis.fetch;
/** Every address fetched: none may be a model's API. */
let fetched: string[];

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'quine-differita-'));
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

const git = (name: string, ...args: string[]) => execFileSync('git', args, { cwd: path.join(dir, name), encoding: 'utf8' });
const universeJson = (name: string) => JSON.parse(readFileSync(path.join(dir, name, 'universe.json'), 'utf8'));
const mapsOf = (name: string) => (existsSync(path.join(dir, name, 'maps')) ? readdirSync(path.join(dir, name, 'maps')) : []);
const noApi = () => expect(fetched.filter((u) => /gemini|googleapis|\/api\/coda/.test(u))).toEqual([]);

describe('la generazione differita (T207)', () => {
  it('una Genesi e quattro luoghi dalla coda su disco servita da una CLI finta, senza alcuna chiamata alle API', async () => {
    const coda = path.join(dir, '.coda');
    await beat(coda, 'claude');
    const served: string[] = [];
    let serving = true;
    const mock = new MockAiModels();
    // The offline models answer from `data`, which never goes into the queue (a real CLI reads the prompt): the fake CLI finds it by prompt.
    const dataOf = new Map<string, unknown>();
    const cli = (async () => {
      while (serving) {
        const r = await take(coda, 'claude');
        if (r) {
          served.push(`${r.agent}:${r.task}`);
          try {
            const text = await mock.text({ agent: r.agent, task: r.task, system: r.system, prompt: r.prompt, schema: r.schema as never, data: dataOf.get(r.prompt) as never });
            await answer(coda, r.id, { text, usage: { prompt: 100, output: 50 } });
          } catch (e) {
            await answer(coda, r.id, { errore: (e as Error).message });
          }
        } else await new Promise((res) => setTimeout(res, 2));
      }
    })();
    const disk = new QueueAiModels({ provider: 'claude', fetchImpl: diskQueueFetch(coda), poll: 2, timeout: 60_000 });
    const queue: AiModels = {
      name: disk.name,
      usage: disk.usage,
      limits: disk.limits,
      text: (call) => (dataOf.set(call.prompt, call.data), disk.text(call)),
    };
    const out = await generateUniverse({ name: 'valle', dir, queue, weekly: still, luoghi: 4, modelli: 0, brani: 0, partita: 'multigiocatore' });
    serving = false;
    await cli;

    expect(out).toEqual({ esito: 'finito', fatti: ['genesi', 'luogo:0,0', 'luogo:1,0', 'luogo:1,1', 'luogo:0,1'] });
    noApi();
    expect(served).toContain('narratore:genesis.bible');
    expect(served.some((s) => s.endsWith(':chunk.plan'))).toBe(true);
    // On disk: the Genesis committed, the plans of the four places, the game chosen at the start.
    expect(git('valle', 'log', '--format=%s')).toMatch(/genesi: /);
    expect(git('valle', 'status', '--porcelain').trim()).toBe('');
    const maps = mapsOf('valle');
    for (const k of ['0_0', '1_0', '1_1', '0_1']) expect(maps.filter((f) => f.endsWith(`_${k}.json`))).toHaveLength(1);
    expect(universeJson('valle').partita.modalita).toBe('multigiocatore');
    expect(progressFile(dir, 'valle', { tetto: 10 }).load().passi).toEqual(out.fatti);
    expect(isGenerating(dir, 'valle')).toBe(false);
  }, 120_000);

  it('un compito che andrebbe alle API ferma il comando subito: niente chiamate dopo, niente scritto del passo', async () => {
    // The universe says the Narrator goes to the API: in the deferred generation that is a stop, not a payment.
    const q = new FakeQueue();
    const first = await generateUniverse({ name: 'ferma', dir, queue: q, weekly: still, luoghi: 0, modelli: 0, brani: 0 });
    expect(first.esito).toBe('finito');
    const cfg = universeJson('ferma');
    cfg.ai = { ...cfg.ai, agenti: { narratore: 'api' } };
    writeFileSync(path.join(dir, 'ferma', 'universe.json'), JSON.stringify(cfg, null, 2) + '\n');
    git('ferma', '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', 'il narratore alle API');
    rmSync(path.join(dir, '.generazione', 'ferma.json'));
    const commits = git('ferma', 'rev-list', '--count', 'HEAD');
    const before = q.calls.length;

    const out = await generateUniverse({ name: 'ferma', dir, queue: q, weekly: still, luoghi: 4, modelli: 0, brani: 0 });
    expect(out.esito).toBe('errore');
    expect(out.motivo).toMatch(/narratore: .*andrebbe alle API/);
    expect(q.calls.slice(before).filter((c) => c.agent === 'narratore')).toEqual([]);
    // The steps before it that did not need the Narrator are valid and kept; the one that stopped wrote nothing, not even its place's plan.
    const stopped = /^(luogo:-?\d+,-?\d+):/.exec(out.motivo!)![1];
    expect(out.fatti).not.toContain(stopped);
    expect(progressFile(dir, 'ferma', { tetto: 10 }).load().passi).toEqual(out.fatti);
    const maps = mapsOf('ferma');
    expect(maps).toHaveLength(out.fatti.length);
    expect(maps.some((f) => f.endsWith(`_${stopped.slice(6).replace(',', '_')}.json`))).toBe(false);
    expect(Number(git('ferma', 'rev-list', '--count', 'HEAD'))).toBeGreaterThanOrEqual(Number(commits));
    noApi();
  }, 120_000);

  it('interrotta e riavviata riprende da dove era arrivata, senza rifare ciò che è fatto', async () => {
    const q = new FakeQueue();
    let steps = 0;
    const log = (l: string) => void (l.startsWith('passo ') && steps++);
    const first = await generateUniverse({ name: 'ripresa', dir, queue: q, weekly: still, luoghi: 6, modelli: 0, brani: 0, log, interrupted: () => steps >= 3 });
    expect(first.esito).toBe('interrotto');
    expect(first.fatti).toEqual(['genesi', 'luogo:0,0', 'luogo:1,0']);
    const genesisCalls = q.calls.filter((c) => c.task.startsWith('genesis.')).length;
    expect(genesisCalls).toBeGreaterThan(0);

    const second = await generateUniverse({ name: 'ripresa', dir, queue: q, weekly: still, luoghi: 6, modelli: 0, brani: 0 });
    expect(second).toEqual({ esito: 'finito', fatti: ['luogo:1,1', 'luogo:0,1', 'luogo:-1,1', 'luogo:-1,0'] });
    expect(q.calls.filter((c) => c.task.startsWith('genesis.')).length).toBe(genesisCalls);
    expect(progressFile(dir, 'ripresa', { tetto: 10 }).load().passi).toHaveLength(7);
  }, 120_000);

  it('al tetto della settimana si ferma; il tetto si rilegge a ogni passo, e ciò che si usa tra due esecuzioni non è suo', async () => {
    const q = new FakeQueue();
    let used = 40;
    // Each reading of the week: 2 % more, as if every step used that much.
    const weekly = async (): Promise<WeeklyUsage> => ({ usato: (used += 2), reset: '2026-11-12T08:00:00.000Z' });
    const out = await generateUniverse({ name: 'tetto', dir, queue: q, weekly, luoghi: 9, modelli: 0, brani: 0, tetto: 5 });
    expect(out.esito).toBe('tetto');
    expect(out.motivo).toMatch(/usato 6 % della settimana, il tetto è 5 %/);
    expect(out.fatti).toEqual(['genesi', 'luogo:0,0']);

    // Between the runs the author used the subscription: not this universe's. The ceiling raised in the file holds from the next step.
    used = 80;
    const p = progressFile(dir, 'tetto', { tetto: 10 });
    p.save({ ...p.load(), tetto: 9 });
    const again = await generateUniverse({ name: 'tetto', dir, queue: q, weekly, luoghi: 9, modelli: 0, brani: 0 });
    expect(again.esito).toBe('tetto');
    expect(again.fatti).toEqual(['luogo:1,0']);
    expect(p.load().consumo?.speso).toBe(10);

    // A new week starts from zero.
    const week2 = await generateUniverse({ name: 'tetto', dir, queue: q, weekly: async () => ({ usato: 1, reset: '2026-11-19T08:00:00.000Z' }), luoghi: 9, modelli: 0, brani: 0 });
    expect(week2.esito).toBe('finito');
    // A week that cannot be read is no ceiling: nothing is generated.
    const blind = await generateUniverse({ name: 'tetto', dir, queue: q, weekly: async () => undefined, luoghi: 12, modelli: 0, brani: 0 });
    expect(blind.esito).toBe('errore');
    expect(blind.motivo).toMatch(/non si legge/);
  }, 120_000);

  it('rifiuta un universo con un mondo acceso; un mondo non si accende su un universo che si genera', async () => {
    const q = new FakeQueue();
    worldLit(dir, 'acceso');
    const out = await generateUniverse({ name: 'acceso', dir, queue: q, weekly: still, luoghi: 1 });
    expect(out).toEqual({ esito: 'errore', motivo: expect.stringMatching(/mondo acceso/), fatti: [] });
    expect(q.calls).toEqual([]);
    expect(existsSync(path.join(dir, 'acceso'))).toBe(false);
    worldOut(dir, 'acceso');
    expect(isWorldLit(dir, 'acceso')).toBe(false);

    // A marker left by a server that is gone does not count.
    writeFileSync(path.join(dir, '.accesi', 'morto.json'), JSON.stringify({ pid: 2 ** 22 + 12345 }));
    expect(isWorldLit(dir, 'morto')).toBe(false);

    // The other way round: while it generates, the server does not light its world; two generations do not run together.
    await generateUniverse({ name: 'molti', dir, queue: q, weekly: still, luoghi: 0, modelli: 0, brani: 0, partita: 'multigiocatore' });
    const held = takeGeneration(dir, 'molti');
    expect('release' in held).toBe(true);
    expect(worldRefusal(dir, 'molti', 0)).toMatch(/si sta generando/);
    expect(takeGeneration(dir, 'molti')).toEqual({ error: expect.stringMatching(/si sta già generando/) });
    if ('release' in held) held.release();
    expect(worldRefusal(dir, 'molti', 0)).toBeUndefined();
  }, 120_000);

  it('la partita si sceglie all’avvio e non cambia dopo la Genesi', async () => {
    const q = new FakeQueue();
    expect((await generateUniverse({ name: 'sola', dir, queue: q, weekly: still, luoghi: 0, modelli: 0, brani: 0, partita: 'singola' })).esito).toBe('finito');
    expect(universeJson('sola').partita?.modalita ?? 'singola').toBe('singola');
    const other = await generateUniverse({ name: 'sola', dir, queue: q, weekly: still, luoghi: 1, modelli: 0, brani: 0, partita: 'multigiocatore' });
    expect(other).toEqual({ esito: 'errore', motivo: expect.stringMatching(/già una partita in singola/), fatti: [] });
  }, 120_000);
});

describe('i pezzi della generazione differita (T207)', () => {
  it('la spirale parte dal centro, anello dopo anello, senza ripetere', () => {
    const s = spiral(25);
    expect(s[0]).toEqual([0, 0]);
    expect(new Set(s.map((p) => p.join())).size).toBe(25);
    expect(s.every(([x, y]) => Math.max(Math.abs(x), Math.abs(y)) <= 2)).toBe(true);
    expect(s.slice(1, 9).every(([x, y]) => Math.max(Math.abs(x), Math.abs(y)) === 1)).toBe(true);
  });

  it('la tabella: ogni agente all’abbonamento, salvo chi l’universo manda alle API', async () => {
    const t = deferredTable({ provider: 'api', agenti: { artista: 'api', narratore: 'claude' } });
    expect(t).toEqual({ provider: 'claude', agenti: { artista: 'api', narratore: 'claude' } });
    const q = new FakeQueue();
    const m = new DeferredModels(t, { claude: q });
    // Fast tasks too: npc.reply would go to the API in play.
    await m.text({ agent: 'narratore', task: 'npc.reply', system: '', prompt: 'ciao' });
    await expect(m.text({ agent: 'artista', task: 'model.judge', system: '', prompt: '' })).rejects.toThrow(/andrebbe alle API/);
    await expect(m.text({ agent: 'narratore', task: 'npc.reply', system: '', prompt: 'ancora' })).rejects.toThrow(/andrebbe alle API/);
    expect(q.calls.map((c) => c.prompt)).toEqual(['ciao']);
  });

  it('il cancello: ciò che un passo scrive arriva all’universo solo se il passo finisce valido', async () => {
    const written: string[] = [];
    const target: GateTarget = {
      name: 'x',
      pending: 0,
      lastError: '',
      commit: async (_c, m) => (written.push(`commit:${m}`), m === 'rifiutato' ? null : 'h'),
      putMap: async (k) => void written.push(`map:${k}`),
      checkout: async () => null,
      reset: async () => undefined,
    };
    const gate = new StepGate(target);
    void gate.commit({ 'world/a.json': '1' }, 'a', 'agent');
    gate.putMap('0,0', { plan: {} as never });
    expect(gate.map('0,0')).toEqual({ plan: {} });
    expect(gate.discard()).toBe(2);
    expect(written).toEqual([]);
    void gate.commit({ 'world/b.json': '2' }, 'b', 'agent');
    gate.putMap('0,1', { plan: {} as never });
    expect(await gate.flush()).toBe(2);
    expect(written).toEqual(['commit:b', 'map:0,1']);
    void gate.commit({ 'world/c.json': '3' }, 'rifiutato', 'agent');
    await expect(gate.flush()).rejects.toThrow(/non ha preso il commit «rifiutato»/);
  });
});
