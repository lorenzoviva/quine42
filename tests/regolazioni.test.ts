// Every consumption has a knob, set before entering and fixed during the match (T247, ADR-0133).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { AgentId } from '../src/kernel/agents/council';
import type { TextCall } from '../src/kernel/ai/models';
import { CENSUS, COEFFICIENT_INFO, COEFFICIENT_KEYS, FULL_DETAIL, hourlyEstimate, LOW_DETAIL, Rationing, RATIONED_KEYS, rationedKnob, repairCoefficients, type CoefficientKey, type Coefficients } from '../src/kernel/coefficients';
import { BUDGET_SCALE, readConfig, repairAiSettings, repairMinimums, withinMinimums } from '../src/kernel/universe';
import { fakeLink, type ClientLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { publicFiles } from '../src/session/files';
import { universeHandler } from '../server/universeStore';
import { LobbyScreen } from '../src/ui/lobby';
import { develop } from './world';

const DT = 1 / 60;

/** What reaches the online models: the local ones, keeping every call. */
class Online extends MockAiModels {
  calls: string[] = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push(call.task);
    return super.text(call);
  }
}

const zeroAll = (): Coefficients => Object.fromEntries(COEFFICIENT_KEYS.map((k) => [k, 0])) as Coefficients;

async function boot(ai: Record<string, unknown> = {}, game: Record<string, unknown> = {}, models = new Online()): Promise<{ k: Kernel; online: Online }> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, ...ai }, game: { ...cfg.game, ...game } }, null, 2) };
  return { k: await Kernel.boot({ files, store: memoryStore(), ai: models }), online: models };
}

const bootMany = (ai: Record<string, unknown> = {}) => boot(ai, { mode: 'multiplayer' });

function enter(server: SessionServer, id: string, opts: { tetto?: number; regolazioni?: never | Record<string, unknown> } = {}): { session: SessionClient; link: ClientLink; refused: () => string | undefined } {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, ...(opts.tetto !== undefined ? { cap: opts.tetto } : {}), ...(opts.regolazioni ? { settings: opts.regolazioni } : {}) } as ConstructorParameters<typeof SessionClient>[1]);
  return { session, link: c, refused: () => session.refused };
}

describe('nessun compito senza manopola', () => {
  it('ogni riga del censimento ha una manopola, o è della Genesi con il suo motivo', () => {
    for (const row of CENSUS) {
      if (row.coefficiente) {
        expect(COEFFICIENT_KEYS, row.compito).toContain(row.coefficiente);
        expect(row.modo, row.compito).not.toBe('non regolabile');
        continue;
      }
      expect(row.compito, `${row.compito} non ha una manopola`).toMatch(/^genesis\./);
      expect(row.modo).toBe('non regolabile');
      expect(row.nota, row.compito).toMatch(/lobby/);
    }
  });

  it('ogni compito che il codice chiede ai modelli è nel censimento', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = path.join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.ts')) files.push(p);
      }
    };
    walk('src/kernel');
    const asked = new Set<string>();
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\.(?:ask|write)(?:<[^(]*?>)?\(\s*['\w.]+,\s*'([a-zA-Z]+\.[a-zA-Z]+)'/gs)) asked.add(m[1]);
    }
    expect(asked.size).toBeGreaterThan(15);
    const known = new Set(CENSUS.map((c) => c.compito));
    expect([...asked].filter((t) => !known.has(t))).toEqual([]);
  });

  it('ogni manopola dice cosa fa il gioco al minimo, senza parole della simulazione', () => {
    for (const k of COEFFICIENT_KEYS) {
      expect(COEFFICIENT_INFO[k].minimo.length, k).toBeGreaterThan(5);
      expect(FULL_DETAIL[k], k).toBe(1);
      expect(LOW_DETAIL.coefficients[k], k).toBeLessThanOrEqual(1);
    }
    // What the wanderer asks stays answered in «Low Detail»: saving does not take a way of playing away without saying.
    for (const k of RATIONED_KEYS) expect(LOW_DETAIL.coefficients[k]).toBe(1);
  });
});

describe('la riparazione delle regolazioni', () => {
  it('passano solo i campi nominati, i modelli del listino e i budget entro la scala', () => {
    const { settings, riparati } = repairAiSettings({
      textModel: '../../etc/passwd',
      provider: 'claude',
      agenti: { narratore: 'claude' },
      chiave: 'segreto',
      maxText: 1e12,
      maxForges: -4,
      maxPacks: 'tanti',
      maxModels: NaN,
      placesPerMinute: 0,
      thinking: 'infinito',
      coefficienti: { parole: 7, luoghi: -1, sconosciuto: 0.5, sguardi: '50%' },
      scultori: { figura: 'gemini-3.8-flash', struttura: 'inventato', altro: 'gemini-3.8-flash' },
      attore: { acceso: true, modello: 'inventato' },
    });
    expect(settings.textModel).toBeUndefined();
    expect(settings).not.toHaveProperty('provider');
    expect(settings).not.toHaveProperty('agenti');
    expect(settings).not.toHaveProperty('chiave');
    expect(settings.maxText).toBe(BUDGET_SCALE.maxText[1]);
    expect(settings.maxForges).toBe(0);
    expect(settings).not.toHaveProperty('maxPacks');
    expect(settings).not.toHaveProperty('maxModels');
    expect(settings.placesPerMinute).toBe(1);
    expect(settings.thinking).toBeUndefined();
    const c = repairCoefficients(settings.coefficients);
    expect(c.words).toBe(1);
    expect(c.chunks).toBe(0);
    expect(c.looks).toBe(0.5);
    expect(settings.sculptors).toEqual({ figure: 'gemini-3.8-flash' });
    expect(settings.actor).toEqual({ on: true });
    expect(riparati.length).toBeGreaterThan(3);
  });

  it('ciò che non è un oggetto non getta eccezioni', () => {
    for (const raw of [null, undefined, 3, 'x', [], [1]]) expect(repairAiSettings(raw).settings).toEqual({});
  });

  it('un minimo non detto non è un minimo: la riparazione tiene solo ciò che nomina', () => {
    const m = repairMinimums({ coefficienti: { sessioni: 0.5 }, scultori: { struttura: 'gemini-3.8-flash', altro: 1 } })!;
    expect(m.coefficients).toEqual({ sessions: 0.5 });
    expect(m.sculptors).toEqual({ structure: 'gemini-3.8-flash' });
  });

  it('i valori non scendono sotto i minimi, anche scritti a mano in universe.json', () => {
    const ai = withinMinimums({
      textModel: 'gemini-3.1-flash-lite',
      maxText: 1,
      maxForges: 0,
      coefficients: { ...FULL_DETAIL, words: 0.1, chunks: 0.9 },
      sculptors: { figure: 'gemini-3.1-flash-lite' },
      minimums: { textModel: 'gemini-3.8-flash', coefficients: { words: 0.5, chunks: 0.2 }, sculptors: { figure: 'gemini-3.8-flash' } },
    });
    expect(ai.textModel).toBe('gemini-3.8-flash');
    const c = ai.coefficients as Coefficients;
    expect(c.words).toBe(0.5);
    expect(c.chunks).toBe(0.9);
    expect(ai.sculptors?.figure).toBe('gemini-3.8-flash');
    const read = readConfig({ 'universe.json': JSON.stringify({ ai: { textModel: 'gemini-3.1-flash-lite', coefficienti: { parole: 0 }, minimi: { coefficienti: { parole: 0.5 } } } }) }).config.ai;
    expect((read.coefficients as Coefficients).words).toBe(0.5);
  });
});

describe('la stima di un’ora segue i valori', () => {
  const ai = readConfig(bundledFiles).config.ai;
  const with0 = (k: CoefficientKey) => hourlyEstimate({ ...ai, coefficients: { ...FULL_DETAIL, [k]: 0 } });

  it('ogni manopola di ciò che si chiede spesso abbassa la stima', () => {
    const full = hourlyEstimate(ai);
    for (const k of ['chunks', 'words', 'actions', 'looks'] as const) {
      expect(with0(k).chiamate, k).toBeLessThan(full.chiamate);
      expect(with0(k).dollari, k).toBeLessThan(full.dollari);
    }
  });

  it('a pieno dettaglio la somma delle righe è quella di prima, e tutto a zero non costa nulla', () => {
    const none = hourlyEstimate({ ...ai, coefficients: zeroAll() });
    expect(none.chiamate).toBe(0);
    expect(none.dollari).toBe(0);
    expect(hourlyEstimate(ai).righe.every((r) => r.modo !== 'non regolabile')).toBe(true);
    expect(hourlyEstimate({ ...ai, maxModels: 0 }).dollari).toBeLessThan(hourlyEstimate(ai).dollari);
  });

  it('un modello più caro alza la stima', () => {
    expect(hourlyEstimate({ ...ai, textModel: 'gemini-3.8-flash' }).dollari).toBeGreaterThan(hourlyEstimate({ ...ai, textModel: 'gemini-3.1-flash-lite' }).dollari);
  });
});

describe('ogni manopola al minimo', () => {
  it('il razionamento è una quota senza estrazioni', () => {
    const r = new Rationing();
    const pass = (c: number, n: number) => Array.from({ length: n }, () => r.allows('words', c)).filter(Boolean).length;
    expect(pass(1, 10)).toBe(10);
    expect(pass(0, 10)).toBe(0);
    expect(pass(0.5, 10)).toBe(5);
    expect(new Rationing().allows('words', 0.5)).toBe(false);
  });

  // The closed decisions (ADR-0157) do not write: tests/decisions.test.ts holds their knob at 0.
  const knobbed = CENSUS.filter((c) => c.coefficiente && c.compito !== 'forge.fix' && !c.via);

  it.each(knobbed.map((c) => [c.compito, c.coefficiente!, c.agente] as const))('%s con %s a 0 non chiama i modelli e risponde', async (task, key, agent) => {
    const { k, online } = await boot({ coefficienti: { [key]: 0 } });
    online.calls = [];
    // The local models answer every task of the census: what the game does when the credits run out.
    const answer = await k.council.write(agent as AgentId, task, 'prova', {}).catch((e: Error) => `errore: ${e.message}`);
    expect(online.calls).not.toContain(task);
    expect(answer).toBeDefined();
    expect(k.feed().some((e) => e.task === task && /modelli locali/.test(e.text))).toBe(true);
  });

  it('a 1 la stessa chiamata va ai modelli', async () => {
    const { k, online } = await boot();
    online.calls = [];
    await k.council.write('narrator', 'npc.reply', 'prova', {}).catch(() => undefined);
    expect(online.calls).toContain('npc.reply');
  });

  it('le riparazioni a 0: il modulo guasto resta com\'era, nessuno chiama, e resta scritto che manca', async () => {
    const { k, online } = await boot();
    const f = await k.forgeModule('una madia di legno per il pane', 'agente', 'object');
    expect(f.ok).toBe(true);
    const entry = k.modules.get(f.id!)!;
    const before = k.repo.working[entry.logicPath!];
    expect(k.setAi({ coefficients: { ...FULL_DETAIL, repairs: 0 } })).toBe(true);
    online.calls = [];
    expect(rationedKnob('forge.fix')).toBeUndefined();
    expect(await k.repairGenerated(`module:${f.id}:on_act`, 'attempt to index nil')).toBe(false);
    expect(online.calls).toEqual([]);
    expect(k.repo.working[entry.logicPath!]).toBe(before);
    expect(k.shortfalls.list().at(-1)).toMatchObject({ task: 'forge.fix', outcome: 'fault' });
  });

  it('tutte a zero, con il budget a zero: il gioco regge e nessuna chiamata parte', async () => {
    const { k, online } = await boot({ coefficienti: zeroAll(), maxText: 0, maxForges: 0, maxPacks: 0, maxCast: 0, maxModels: 0, maxPieces: 0 });
    await develop(k);
    online.calls = [];
    const before = k.wandererPos().x;
    for (let i = 0; i < 300; i++) k.tick(DT);
    await new Promise((r) => setTimeout(r, 20));
    expect(online.calls).toEqual([]);
    expect(Number.isFinite(k.wandererPos().x)).toBe(true);
    expect(before).toBeDefined();
    // The wanderer talks, examines, tries: there is an answer, from the local models.
    const pc = k.wandererCarpet();
    const npc = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1, pc.y, undefined, 'prova');
    const talk = await k.talk(npc, 'Che notizie porti?', k.wanderer().id);
    expect(typeof talk.say).toBe('string');
    expect(talk.say.length).toBeGreaterThan(0);
    await k.freeAction(npc, 'gli tiro il cappello');
    expect(online.calls).toEqual([]);
  });
});

describe('a partita in corso non si cambia nulla, nemmeno dal master', () => {
  it('il kernel rifiuta setAi e applySettings', async () => {
    const { k } = await boot();
    expect(k.setAi({ textModel: 'gemini-3.8-flash' })).toBe(true);
    expect(k.config.ai.textModel).toBe('gemini-3.8-flash');
    k.lockSettings();
    expect(k.settingsLocked).toBe(true);
    expect(k.setAi({ textModel: 'gemini-4-argon', coefficients: zeroAll() })).toBe(false);
    expect(k.applySettings({ maxText: 1 }).ok).toBe(false);
    expect(k.config.ai.textModel).toBe('gemini-3.8-flash');
    expect(k.config.ai.maxText).not.toBe(1);
    expect(JSON.parse(k.repo.working['universe.json']!).ai.textModel).toBe('gemini-3.8-flash');
  });

  it('l\'editor, il rollback e la pubblicazione non le muovono', async () => {
    const { k } = await boot({ textModel: 'gemini-3.1-flash-lite' });
    k.lockSettings();
    const raw = JSON.parse(k.repo.working['universe.json']!);
    const changed = JSON.stringify({ ...raw, ai: { ...raw.ai, textModel: 'gemini-4-argon', maxText: 99999 } }, null, 2) + '\n';
    // The editor.
    k.repo.write('universe.json', changed);
    k.applyFiles({ ...k.repo.working });
    expect(k.config.ai.textModel).toBe('gemini-3.1-flash-lite');
    expect(JSON.parse(k.repo.working['universe.json']!).ai.maxText).toBe(raw.ai.maxText);
    expect(k.feed().some((e) => /si fissano entrando/.test(e.text))).toBe(true);
    // A publication of the master: what else it brings stays, the settings do not.
    const r = k.publish({ 'universe.json': changed }, 'pubblicazione');
    expect(r.ok).toBe(true);
    expect(k.config.ai.textModel).toBe('gemini-3.1-flash-lite');
    expect(JSON.parse(k.repo.working['universe.json']!).ai.textModel).toBe('gemini-3.1-flash-lite');
    // A broken universe.json does not bring the default settings.
    k.repo.write('universe.json', '{ non è json');
    k.applyFiles({ ...k.repo.working });
    expect(k.config.ai.maxText).toBe(raw.ai.maxText);
    // The file the branch brings is cleaned the same way.
    const clean = JSON.parse(k.withHeldSettings(changed));
    expect(clean.ai.textModel).toBe('gemini-3.1-flash-lite');
  });

  it('il tetto del singolo viandante resta suo anche a partita in corso', async () => {
    const { k } = await bootMany();
    k.giveCredits('carlo', 5);
    k.lockSettings();
    k.setSessionCap('carlo', 1);
    expect(k.sessionCapOf('carlo')).toBe(1);
  });
});

describe('sul server, entrando', () => {
  it('il master regola entrando per primo: riparato, scritto, committato, e da lì fisso', async () => {
    const { k } = await bootMany();
    const server = new SessionServer(k);
    const master = enter(server, 'me', { regolazioni: { textModel: 'gemini-3.8-flash', maxText: 1e9, coefficienti: { ...FULL_DETAIL, words: 0 } } });
    await master.session.ready;
    expect(master.session.settingsAnswer?.ok).toBe(true);
    expect(master.session.settingsAnswer?.repaired?.join(' ')).toMatch(/maxText/);
    expect(k.config.ai.textModel).toBe('gemini-3.8-flash');
    expect(k.config.ai.maxText).toBe(BUDGET_SCALE.maxText[1]);
    expect(k.ai.limits.text).toBe(BUDGET_SCALE.maxText[1]);
    expect(k.coefficients().words).toBe(0);
    expect(k.settingsLocked).toBe(true);
    expect(JSON.parse(k.repo.head().files['universe.json']!).ai.textModel).toBe('gemini-3.8-flash');
  });

  it('`vite` segue la sorte di `dialoghi` (T245a): entra con il master, poi è fissa; assente vale 0', async () => {
    const { k } = await bootMany();
    expect(k.coefficients().lives).toBe(0);
    expect(k.coefficients().dialogues).toBe(1);
    const server = new SessionServer(k);
    const master = enter(server, 'me', { regolazioni: { coefficienti: { ...FULL_DETAIL, dialogues: 0.5, lives: 0.5 } } });
    await master.session.ready;
    expect(master.session.settingsAnswer?.ok).toBe(true);
    expect(k.coefficients()).toMatchObject({ dialogues: 0.5, lives: 0.5 });
    expect(JSON.parse(k.repo.head().files['universe.json']!).ai.coefficients).toMatchObject({ dialogues: 0.5, lives: 0.5 });
    expect(k.settingsLocked).toBe(true);
    // Fixed for both: a universe.json that says otherwise is written back, setAi says no.
    const raw = JSON.parse(k.repo.working['universe.json']!);
    k.repo.write('universe.json', JSON.stringify({ ...raw, ai: { ...raw.ai, coefficienti: { ...raw.ai.coefficients, dialogues: 1, lives: 1 } } }));
    k.applyFiles({ ...k.repo.working });
    expect(k.coefficients()).toMatchObject({ dialogues: 0.5, lives: 0.5 });
    expect(k.setAi({ coefficients: { ...FULL_DETAIL, dialogues: 1, lives: 1 } })).toBe(false);
    expect(k.coefficients()).toMatchObject({ dialogues: 0.5, lives: 0.5 });
  });

  it('chi non è il master non cambia nulla, nemmeno entrando per primo, e i minimi restano', async () => {
    const { k } = await bootMany({ minimi: { tetto: 2, coefficienti: { parole: 0.5 } } });
    const before = k.repo.working['universe.json'];
    const server = new SessionServer(k);
    const anna = enter(server, 'anna', { regolazioni: { maxText: 1, coefficienti: zeroAll(), minimi: {} } });
    await anna.session.ready;
    expect(anna.session.settingsAnswer).toEqual({ ok: false, reason: 'solo il master regola il mondo' });
    expect(k.repo.working['universe.json']).toBe(before);
    expect(k.config.ai.minimums?.cap).toBe(2);
    expect(k.coefficients().words).toBe(1);
  });

  it('il master che entra a partita in corso è rifiutato: il mondo resta com\'era', async () => {
    const { k } = await bootMany();
    const server = new SessionServer(k);
    const anna = enter(server, 'anna');
    await anna.session.ready;
    const before = k.repo.working['universe.json'];
    const master = enter(server, 'me', { regolazioni: { textModel: 'gemini-4-argon' } });
    await master.session.ready;
    expect(master.session.me).toBeDefined();
    expect(master.session.settingsAnswer?.ok).toBe(false);
    expect(master.session.settingsAnswer?.reason).toMatch(/in corso/);
    expect(k.repo.working['universe.json']).toBe(before);
  });

  it('nessun messaggio cambia le regolazioni a partita in corso', async () => {
    const { k } = await bootMany();
    const server = new SessionServer(k);
    const master = enter(server, 'me');
    await master.session.ready;
    const before = k.repo.working['universe.json'];
    const answers: Array<{ ok: boolean }> = [];
    void master.session.act({ t: 'attore', acceso: true } as never).then((r) => answers.push(r));
    // Their branch brings other settings: on the branch they are already the match's.
    void master.session.act({ t: 'branch', files: { 'universe.json': JSON.stringify({ ...JSON.parse(before!), ai: { textModel: 'gemini-4-argon' } }) }, base: {} }).then((r) => answers.push(r));
    for (let i = 0; i < 12 && answers.length < 2; i++) {
      server.tick(DT);
      await new Promise((r) => setTimeout(r, 1));
    }
    expect(answers[0].ok).toBe(false);
    expect(answers[1].ok).toBe(true);
    expect(k.repo.working['universe.json']).toBe(before);
    const held = (server as unknown as { branch: { files: Record<string, string> } }).branch.files['universe.json'];
    expect(JSON.parse(held).ai.textModel).toBe(k.config.ai.textModel);
  });

  it('quando nel mondo non c\'è più nessuno il master torna a regolare', async () => {
    const { k } = await bootMany();
    const server = new SessionServer(k);
    const anna = enter(server, 'anna');
    await anna.session.ready;
    const other = enter(server, 'carlo');
    await other.session.ready;
    expect(k.settingsLocked).toBe(true);
    anna.link.close();
    expect(k.settingsLocked).toBe(true);
    other.link.close();
    expect(k.settingsLocked).toBe(false);
    const master = enter(server, 'me', { regolazioni: { maxText: 123 } });
    await master.session.ready;
    expect(master.session.settingsAnswer?.ok).toBe(true);
    expect(k.config.ai.maxText).toBe(123);
    expect(k.settingsLocked).toBe(true);
  });

  it('un tetto sotto il minimo non entra; zero (i modelli locali) e nessun tetto sì', async () => {
    const { k } = await bootMany({ minimi: { tetto: 2 } });
    k.giveCredits('carlo', 10);
    k.giveCredits('dina', 10);
    k.giveCredits('elio', 10);
    const server = new SessionServer(k);
    const low = enter(server, 'carlo', { tetto: 1 });
    await low.session.ready;
    expect(low.refused()).toMatch(/tetto/);
    const offline = enter(server, 'dina', { tetto: 0 });
    await offline.session.ready;
    expect(offline.refused()).toBeUndefined();
    const fine = enter(server, 'elio', { tetto: 3 });
    await fine.session.ready;
    expect(fine.refused()).toBeUndefined();
    expect(k.sessionCapOf('elio')).toBe(3);
  });

  it('la lobby legge dai file pubblici anche i budget che regola', async () => {
    const { k } = await bootMany({ maxPieces: 3, placesPerMinute: 7, thinking: 'off', provider: 'claude' });
    const ai = JSON.parse(publicFiles(k.files)['universe.json']).ai;
    expect(ai).toMatchObject({ maxPieces: 3, placesPerMinute: 7, thinking: 'off' });
    expect(ai.provider).toBeUndefined();
  });
});

describe('il deposito di un universo di molti', () => {
  let dir: string;
  let store: http.Server;
  let base: string;
  const headers = { 'Content-Type': 'application/json' };

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'quine-regolazioni-'));
    const handler = universeHandler(dir, { internal: 'finto' });
    store = http.createServer((req, res) => void handler(req, res, () => void res.writeHead(404).end()));
    await new Promise<void>((r) => store.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(store.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((r) => store.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  const post = (url: string, body: unknown, more: Record<string, string> = {}) => fetch(`${base}${url}`, { method: 'POST', headers: { ...headers, ...more }, body: JSON.stringify(body) });

  it('da fuori il master non scrive `ai` nemmeno sul disco; il resto di universe.json sì', async () => {
    const universe = { name: 'molti', game: { mode: 'multiplayer', master: 'me' }, ai: { textModel: 'gemini-3.1-flash-lite', maxText: 10 } };
    const me = { 'X-Quine-Viandante': 'me' };
    const made = await post('/api/universe/molti/create', { files: { 'universe.json': JSON.stringify(universe) }, message: 'nasce' }, me);
    expect(made.status).toBe(200);
    const refused = await post('/api/universe/molti/commit', { changes: { 'universe.json': JSON.stringify({ ...universe, ai: { ...universe.ai, maxText: 99 } }) }, message: 'x', author: 'player' }, me);
    expect(refused.status).toBe(403);
    expect((await refused.json()).error).toMatch(/lobby/);
    const same = await post('/api/universe/molti/commit', { changes: { 'universe.json': JSON.stringify({ ...universe, rilievo: { mare: 3 } }) }, message: 'y', author: 'player' }, me);
    expect(same.status).toBe(200);
    expect(JSON.parse(readFileSync(path.join(dir, 'molti', 'universe.json'), 'utf8')).ai.maxText).toBe(10);
  });
});

describe('la lobby', () => {
  class Fake {
    tagName: string;
    className = '';
    hidden = false;
    disabled = false;
    checked = false;
    value = '';
    private text = '';
    children: Fake[] = [];
    attributes: Record<string, string> = {};
    onclick?: () => void;
    oninput?: () => void;
    onchange?: () => void;
    constructor(tag: string) {
      this.tagName = tag.toUpperCase();
    }
    get textContent(): string {
      return this.children.length ? this.children.map((c) => c.textContent).join('') : this.text;
    }
    set textContent(v: string) {
      this.text = v;
      this.children = [];
    }
    setAttribute(k: string, v: string) {
      this.attributes[k] = v;
      if (k === 'value') this.value = v;
      if (k === 'hidden') this.hidden = true;
    }
    append(...items: Array<Fake | string>) {
      for (const it of items) {
        if (typeof it === 'string') {
          if (!it) continue;
          const t = new Fake('span');
          t.textContent = it;
          this.children.push(t);
        } else this.children.push(it);
      }
    }
    appendChild(it: Fake) {
      this.append(it);
      return it;
    }
    replaceChildren(...items: Array<Fake | string>) {
      this.children = [];
      this.text = '';
      this.append(...items);
    }
    find(test: (f: Fake) => boolean): Fake | undefined {
      for (const c of this.children) {
        if (test(c)) return c;
        const hit = c.find(test);
        if (hit) return hit;
      }
      return undefined;
    }
    byId(id: string): Fake {
      return this.find((f) => f.attributes.id === id)!;
    }
    all(test: (f: Fake) => boolean, out: Fake[] = []): Fake[] {
      for (const c of this.children) {
        if (test(c)) out.push(c);
        c.all(test, out);
      }
      return out;
    }
  }

  const open = (opts: Partial<ConstructorParameters<typeof LobbyScreen>[0]>, ai: Record<string, unknown> = {}) => {
    const body = new Fake('body');
    (globalThis as any).document = { body, getElementById: () => null, createElement: (t: string) => new Fake(t) };
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ name: 'molti', game: { mode: 'multiplayer', master: 'me' }, ai: { textModel: 'gemini-3.1-flash-lite', maxText: 800, maxForges: 3, ...ai } }) };
    const lobby = new LobbyScreen({ name: 'molti', files, wandererId: 'me', credits: 5, ...opts });
    const done = lobby.open();
    const root = (lobby as unknown as { root: Fake }).root;
    return { lobby, done, root, enter: () => root.find((f) => f.className.split(' ').includes('primary'))!.onclick!() };
  };

  afterAll(() => {
    delete (globalThis as any).document;
  });

  it('sta sopra la schermata iniziale: il tasto che la chiude si ascolta solo dopo la lobby', () => {
    const css = readFileSync('src/style.css', 'utf8');
    const z = (id: string) => Number(new RegExp(`#${id} [{][^}]*?z-index: ([0-9]+)`).exec(css)![1]);
    expect(z('lobby')).toBeGreaterThan(z('intro'));
  });

  it('il master regola ogni cosa, la stima segue, e manda solo se ha cambiato', async () => {
    const { root, done, enter } = open({});
    const before = root.find((f) => f.className === 'estimate-row')!.textContent;
    expect(root.byId('lobby-knob-words').disabled).toBe(false);
    for (const id of ['lobby-preset', 'lobby-modello-testo', 'lobby-scultore-figure', 'lobby-ragionamento', 'lobby-budget-maxText', 'lobby-budget-maxPieces', 'lobby-minimo-tetto', 'lobby-minimo-words', 'lobby-attore']) expect(root.byId(id), id).toBeDefined();
    // One slider for every coefficient, and what it does at 0 written beside it.
    for (const k of COEFFICIENT_KEYS) {
      expect(root.byId(`lobby-knob-${k}`), k).toBeDefined();
      expect(root.textContent).toContain(COEFFICIENT_INFO[k].minimo);
    }
    const slider = root.byId('lobby-knob-words');
    slider.value = '0';
    slider.oninput!();
    expect(root.find((f) => f.className === 'estimate-row')!.textContent).not.toBe(before);
    expect(root.byId('lobby-preset').value).toBe('misura');
    const budget = root.byId('lobby-budget-maxText');
    budget.value = '50';
    budget.oninput!();
    expect(root.find((f) => f.className === 'estimate-row')!.textContent).toContain('50 chiamate');
    enter();
    const r = await done;
    expect(repairCoefficients(r.regolazioni?.coefficients).words).toBe(0);
    expect(r.regolazioni?.maxText).toBe(50);
  });

  it('senza modifiche non manda nulla', async () => {
    const { done, enter } = open({});
    enter();
    expect((await done).regolazioni).toBeUndefined();
  });

  it('il preset porta i coefficienti', async () => {
    const { root, done, enter } = open({});
    const preset = root.byId('lobby-preset');
    preset.value = 'low';
    preset.onchange!();
    expect(root.byId('lobby-knob-sessions').value).toBe(String(LOW_DETAIL.coefficients.sessions));
    enter();
    expect(repairCoefficients((await done).regolazioni?.coefficients).sessions).toBe(LOW_DETAIL.coefficients.sessions);
  });

  it('un altro viandante vede e non tocca', async () => {
    const { root, done, enter } = open({ wandererId: 'carlo' });
    const controls = root.all((f) => f.tagName === 'SELECT' || f.attributes.type === 'range' || f.attributes.type === 'checkbox');
    expect(controls.length).toBeGreaterThan(COEFFICIENT_KEYS.length);
    expect(controls.every((c) => c.disabled)).toBe(true);
    expect(root.byId('lobby-budget-maxText')).toBeUndefined();
    expect(root.textContent).toContain('Chiamate di testo per sessione: 800');
    enter();
    expect((await done).regolazioni).toBeUndefined();
  });

  it('a partita in corso anche il master vede e non tocca', async () => {
    const { root, done, enter } = open({ inCorso: true });
    expect(root.textContent).toContain('La partita è in corso');
    expect(root.byId('lobby-knob-words').disabled).toBe(true);
    expect(root.byId('lobby-budget-maxText').disabled).toBe(true);
    enter();
    expect((await done).regolazioni).toBeUndefined();
  });

  it('da soli: solo le regolazioni, senza tetto né carte', async () => {
    const { root, done, enter } = open({ alone: true, wandererId: 'me' });
    expect(root.textContent).toContain('PRIMA DI ENTRARE');
    expect(root.textContent).not.toContain('Tetto di spesa');
    expect(root.textContent).not.toContain('collezione');
    const slider = root.byId('lobby-knob-chunks');
    slider.value = '0.5';
    slider.oninput!();
    enter();
    expect(repairCoefficients((await done).regolazioni?.coefficients).chunks).toBe(0.5);
  });
});
