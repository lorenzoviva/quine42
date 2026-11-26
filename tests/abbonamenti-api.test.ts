// The queue of the subscriptions paid with Anthropic's API credits (T542, ADR-0262): only the child of the CLI gets ANTHROPIC_API_KEY, read
// from the `.env`; without `--api` it has none; each run says it pays as told; every run is priced in the ledger next to the queue, and past
// the ceiling the queue stops. The generator pays with it when config.json says so, and `stato` says the spend. Offline: the fake CLI
// (`lab/scripts/claude-finta.mjs`), no model is called.

import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { enqueue, look } from '../server/subscriptionQueue';
import { anthropicCost } from '../src/kernel/ai/prices';
import { API_LEDGER, apiSettings, capReached, childEnv, envValues, readLedger, recordCall, redact, spentIn, writeLedger } from '../tools/abbonamenti/api';
import { IsolationCheck, parseArgs, serve, serveOne } from '../tools/abbonamenti/servi';

const KEY = 'sk-ant-api03-FINTA-0123456789abcdefghijklmnopqrstuvwxyz';
const finta = path.resolve('lab/scripts/claude-finta.mjs');
const XML = '<sequence values="BA"><one in="B" out="A"/></sequence>';
const NOW = new Date(2026, 10, 26, 12);

const temps: string[] = [];
const temp = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'coda-api-'));
  temps.push(d);
  return d;
};
afterEach(() => {
  for (const d of temps.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

/** A queue with the fake CLI, its program and its log, and an `.env` with the key. */
function rig(extra = '') {
  const d = temp();
  const xml = path.join(d, 'p.xml');
  const log = path.join(d, 'log.jsonl');
  fs.writeFileSync(xml, XML);
  const env = path.join(d, '.env');
  fs.writeFileSync(env, `GEMINI_API_KEY=altra\nANTHROPIC_API_KEY="${KEY}"\n`);
  const queue = path.join(d, 'queue');
  fs.mkdirSync(queue);
  return { d, queue, log, env, cmd: `node ${finta} ${xml} ${log}${extra ? ` ${extra}` : ''}`, seen: () => fs.readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) };
}
const ask = (queue: string) => enqueue(queue, { provider: 'claude', agent: 'sculptor', task: 'model.sculpt', system: 'Sei lo Scultore', prompt: 'Scolpisci una sedia', model: 'claude-opus-5-5' });
const settings = (env: string, cap = 100) => {
  const s = apiSettings({ api: true, cap, files: [env] });
  if (!s || typeof s === 'string') throw new Error(String(s));
  return s;
};

describe('T542 — la chiave e il tetto dal .env', () => {
  it('legge solo i nomi chiesti, con le virgolette e senza commenti, senza toccare process.env', () => {
    expect(envValues('A=1\nexport B="due tre"\n# C=no\nD=4 # commento\nE=\'5\'\n', ['A', 'B', 'C', 'D', 'E'])).toEqual({ A: '1', B: 'due tre', D: '4', E: '5' });
    const { env } = rig();
    const before = process.env.ANTHROPIC_API_KEY;
    expect(settings(env)).toEqual({ key: KEY, cap: 100, from: env });
    expect(process.env.ANTHROPIC_API_KEY).toBe(before);
  });

  it('senza --api niente; --api senza tetto o senza chiave è un motivo che non contiene la chiave; QUINE_CODA_API=1 nel .env vale --api', () => {
    const { d, env } = rig();
    expect(apiSettings({ files: [env] })).toBeUndefined();
    const noCap = apiSettings({ api: true, files: [env] });
    expect(noCap).toMatch(/tetto/);
    expect(String(noCap)).not.toContain(KEY);
    expect(apiSettings({ api: true, cap: 0, files: [env] })).toMatch(/maggiore di zero/);
    const empty = path.join(d, 'vuoto.env');
    fs.writeFileSync(empty, 'QUINE_CODA_API=1\nQUINE_CODA_TETTO_API=50\n');
    expect(apiSettings({ files: [empty] })).toMatch(/ANTHROPIC_API_KEY non è in/);
    fs.appendFileSync(empty, `ANTHROPIC_API_KEY=${KEY}\n`);
    expect(apiSettings({ files: [empty] })).toMatchObject({ cap: 50, key: KEY });
    expect(parseArgs(['--api', '--tetto-api', '100', '--env', env]).apiAsk).toEqual({ api: true, cap: 100, envFile: env });
    expect(parseArgs([]).apiAsk).toEqual({ api: false });
  });

  it('l’ambiente del figlio: con la chiave la chiave e non il token dell’abbonamento; senza, nessuna chiave', () => {
    const reduced = { PATH: 'p', CLAUDE_CODE_OAUTH_TOKEN: 't', ANTHROPIC_API_KEY: 'di fuori', anthropic_auth_token: 'x' };
    expect(childEnv(reduced, KEY)).toEqual({ PATH: 'p', ANTHROPIC_API_KEY: KEY });
    expect(childEnv(reduced)).toEqual({ PATH: 'p', CLAUDE_CODE_OAUTH_TOKEN: 't' });
    expect(redact(`errore con ${KEY} dentro`, KEY)).toBe('errore con [chiave] dentro');
  });
});

describe('T542 — la coda servita con la CLI finta', () => {
  it('con --api il figlio vede la chiave e la CLI dice che paga con lei; la chiamata va nel registro al listino', async () => {
    const r = rig();
    const id = await ask(r.queue);
    const step = await serveOne(r.queue, 'claude', { cmd: r.cmd, api: settings(r.env), now: () => NOW });
    expect(step.status, step.errore).toBe('ok');
    const [seen] = r.seen();
    expect(seen).toMatchObject({ key: true, oauth: false, model: 'claude-opus-5-5', isolation: true });
    const ledger = readLedger(r.queue);
    expect(ledger.ultime).toHaveLength(1);
    const call = ledger.ultime[0];
    const written = Math.round(('Scolpisci una sedia'.length + 'Sei lo Scultore'.length) / 4);
    expect(call).toMatchObject({ id, task: 'model.sculpt', model: 'claude-opus-5-5', input: 12, written5m: written, read: 0, output: Math.round(XML.length / 4), usdCli: 0.01, esito: 'ok' });
    expect(call.usd).toBeCloseTo(anthropicCost('claude-opus-5-5', { input: 12, written5m: written, output: Math.round(XML.length / 4) })!, 9);
    expect(spentIn(ledger, NOW)).toMatchObject({ chiamate: 1, spesoCli: 0.01 });
    expect((await look(r.queue, id)).stato).toBe('fatta');
  });

  it('senza --api il figlio non ha la chiave, nemmeno se è nell’ambiente di chi serve; nessun registro', async () => {
    const r = rig();
    await ask(r.queue);
    const before = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = KEY;
    try {
      const step = await serveOne(r.queue, 'claude', { cmd: r.cmd });
      expect(step.status, step.errore).toBe('ok');
    } finally {
      if (before === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = before;
    }
    expect(r.seen()[0]).toMatchObject({ key: false });
    expect(fs.existsSync(path.join(r.queue, API_LEDGER))).toBe(false);
  });

  it('una corsa che non paga come le è detto si ferma al suo init, prima del modello', async () => {
    const api = rig('--paga none');
    await ask(api.queue);
    const a = await serveOne(api.queue, 'claude', { cmd: api.cmd, api: settings(api.env) });
    expect(a.status).toBe('billing');
    expect(a.errore).toMatch(/non con ANTHROPIC_API_KEY/);

    const sub = rig('--paga ANTHROPIC_API_KEY');
    await ask(sub.queue);
    expect((await serveOne(sub.queue, 'claude', { cmd: sub.cmd })).status).toBe('billing');

    const check = new IsolationCheck('ANTHROPIC_API_KEY');
    expect(check.see(JSON.stringify({ type: 'system', subtype: 'init', tools: [], mcp_servers: [], skills: [], slash_commands: [], plugins: [] }))).toBe(true);
    expect(check.billing).toMatch(/niente che dica/);
  });

  it('il tetto ferma: oltre il tetto del mese nessuna richiesta è presa e il servitore si ferma', async () => {
    const r = rig();
    const s = settings(r.env, 0.02);
    const first = await ask(r.queue);
    expect((await serveOne(r.queue, 'claude', { cmd: r.cmd, api: s, now: () => NOW })).status).toBe('ok');
    expect(capReached(readLedger(r.queue), 0.02, NOW)).toBe(false);
    recordCall(r.queue, { model: 'claude-opus-5-5', input: 0, written5m: 0, written1h: 0, read: 0, output: 1000, usd: 0.02, esito: 'ok' }, NOW);
    const second = await ask(r.queue);
    const stop = await serveOne(r.queue, 'claude', { cmd: r.cmd, api: s, now: () => NOW });
    expect(stop).toMatchObject({ served: false, status: 'cap' });
    expect((await look(r.queue, second)).stato).toBe('in coda');
    expect((await look(r.queue, first)).stato).toBe('fatta');
    expect(r.seen()).toHaveLength(1);
    // The month after, the ceiling is the month's again.
    expect(capReached(readLedger(r.queue), 0.02, new Date(2026, 11, 1, 9))).toBe(false);

    // The process that serves stops by itself, and says why in the ledger.
    await serve({ provider: 'claude', dir: r.queue, cmd: r.cmd, pollMs: 10, beatMs: 1000, api: s });
    expect(readLedger(r.queue).servitore).toBeUndefined();
    expect(r.seen()).toHaveLength(1);
  });

  it('una chiave che non è di un workspace: l’id del .env va alla CLI come intestazione; senza, la coda si ferma col motivo', async () => {
    const r = rig('--senza-workspace');
    await ask(r.queue);
    const stop = await serveOne(r.queue, 'claude', { cmd: r.cmd, api: settings(r.env) });
    expect(stop.status).toBe('billing');
    expect(stop.errore).toMatch(/ANTHROPIC_WORKSPACE_ID/);
    fs.appendFileSync(r.env, 'ANTHROPIC_WORKSPACE_ID=wrkspc_01FINTO\n');
    expect(settings(r.env).workspace).toBe('wrkspc_01FINTO');
    await ask(r.queue);
    const ok = await serveOne(r.queue, 'claude', { cmd: r.cmd, api: settings(r.env) });
    expect(ok.status, ok.errore).toBe('ok');
    expect(r.seen()[1]).toMatchObject({ key: true, headers: 'anthropic-workspace-id: wrkspc_01FINTO' });
    const bad = path.join(r.d, 'b.env');
    fs.writeFileSync(bad, `ANTHROPIC_API_KEY=${KEY}\nANTHROPIC_WORKSPACE_ID=a: b\n`);
    expect(apiSettings({ api: true, cap: 1, files: [bad] })).toMatch(/non è l’id di un workspace/);
    expect(childEnv({ ANTHROPIC_CUSTOM_HEADERS: 'x: y' }, undefined, 'wrkspc_1')).toEqual({});
  });

  it('quando l’API dice che i crediti sono finiti la coda si ferma come al tetto', async () => {
    const r = rig('--senza-crediti');
    await ask(r.queue);
    const step = await serveOne(r.queue, 'claude', { cmd: r.cmd, api: settings(r.env) });
    expect(step.status).toBe('cap');
    expect(readLedger(r.queue).fermo?.motivo).toMatch(/crediti API sono finiti/);
  });

  it('la chiave non è nel log della CLI, nel registro, nelle risposte né nel battito', async () => {
    const r = rig();
    await ask(r.queue);
    await serve({ provider: 'claude', dir: r.queue, cmd: r.cmd, pollMs: 10, beatMs: 1000, once: true, api: settings(r.env) });
    const files = [r.log, ...fs.readdirSync(r.queue).map((f) => path.join(r.queue, f))];
    expect(files.length).toBeGreaterThan(2);
    for (const f of files) expect(fs.readFileSync(f, 'utf8'), f).not.toContain(KEY);
  });

  it('il registro si legge anche guasto, e tiene le chiamate del mese', () => {
    const d = temp();
    fs.writeFileSync(path.join(d, API_LEDGER), '{rotto');
    expect(readLedger(d)).toEqual({ mesi: {}, ultime: [] });
    writeLedger(d, { mesi: { '2026-10': { speso: 99, spesoCli: 99, chiamate: 300 } }, ultime: [] });
    expect(capReached(readLedger(d), 100, NOW)).toBe(false);
    recordCall(d, { model: 'claude-opus-5-5', input: 1, written5m: 0, written1h: 0, read: 0, output: 0, usd: 100, esito: 'ok' }, NOW);
    expect(capReached(readLedger(d), 100, NOW)).toBe(true);
  });
});

type Gen = {
  withoutApiKeys(env: Record<string, string | undefined>): Record<string, string | undefined>;
  queueCommand(base: string[], api: boolean, cap?: number): string[];
  generatorConf(config: Record<string, unknown>): Record<string, any>;
  generatorDecision(o: Record<string, unknown>): { azione: string; motivo?: string; tetto?: number; universo?: { universo: string } };
  Generator: new (o: Record<string, unknown>) => { describe(): string[]; spawnLogged(cmd: string[], log: string): number | undefined };
};
const G = (await import(pathToFileURL(path.resolve('tools/pipeline/generatore.mjs')).href)) as Gen;

describe('T542 — la pipeline e il generatore', () => {
  it('nessuna chiave API nell’ambiente di ciò che la pipeline lancia', () => {
    expect(G.withoutApiKeys({ PATH: 'p', ANTHROPIC_API_KEY: KEY, Anthropic_Auth_Token: 'x', CLAUDE_CODE_OAUTH_TOKEN: 't' })).toEqual({ PATH: 'p', CLAUDE_CODE_OAUTH_TOKEN: 't' });
    const repo = temp();
    const calls: Array<Record<string, any>> = [];
    const gen = new G.Generator({ config: {}, repo, logs: repo, spawnFn: (_c: string, _a: string[], opts: Record<string, any>) => { calls.push(opts); return { pid: 7, on() {}, unref() {} }; }, kill() {}, isAlive: () => false });
    const before = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = KEY;
    try {
      gen.spawnLogged(['node', 'x.mjs'], path.join(repo, 'a.log'));
    } finally {
      if (before === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = before;
    }
    expect(calls[0].env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(calls[0].env.PATH ?? calls[0].env.Path).toBeDefined();
  });

  it('il comando della coda con --api e il tetto di config.json', () => {
    expect(G.queueCommand(['npm', 'run', 'abbonamento'], false, 100)).toEqual(['npm', 'run', 'abbonamento']);
    expect(G.queueCommand(['npm', 'run', 'abbonamento'], true)).toEqual(['npm', 'run', 'abbonamento', '--', '--api']);
    expect(G.queueCommand(['npm', 'run', 'abbonamento', '--', '--api'], true, 100)).toEqual(['npm', 'run', 'abbonamento', '--', '--api', '--tetto-api', '100']);
    expect(G.generatorConf({ generatore: { api: true, tettoApi: 100 } })).toMatchObject({ api: true, tettoApi: 100 });
  });

  it('sui crediti API la settimana e la finestra non contano, il tetto dei crediti sì', () => {
    const conf = G.generatorConf({ generatore: { api: true } });
    const list = [{ universo: 'aurora', rigenera: 'modelli', tettoSettimana: 25 }];
    const b = { residuo: 0, sessione: 0 };
    const go = G.generatorDecision({ conf, list, b, api: { speso: 3, tetto: 100 } });
    expect(go).toMatchObject({ azione: 'avvia', tetto: 100, universo: { universo: 'aurora' } });
    expect(G.generatorDecision({ conf, list, b, api: { speso: 100, tetto: 100 } })).toMatchObject({ azione: 'attende', motivo: expect.stringMatching(/crediti API al tetto/) });
    expect(G.generatorDecision({ conf, list, b, running: true, api: { speso: 100.2, tetto: 100 } })).toMatchObject({ azione: 'ferma' });
    expect(G.generatorDecision({ conf, list, b, running: true, api: { speso: 1, tetto: 100 } })).toMatchObject({ azione: 'continua' });
    expect(G.generatorDecision({ conf, list, b, wanting: true, api: { speso: 1, tetto: 100 } })).toMatchObject({ azione: 'attende' });
    // On the subscription the same week holds it back.
    expect(G.generatorDecision({ conf: G.generatorConf({}), list, b }).azione).toBe('attende');
  });

  it('stato dice la spesa dei crediti API del mese', () => {
    const repo = temp();
    const queue = path.join(repo, 'universes', '.queue');
    fs.mkdirSync(queue, { recursive: true });
    const gen = new G.Generator({ config: { generatore: { api: true } }, repo, logs: repo, spawnFn() {}, kill() {}, isAlive: () => false });
    expect(gen.describe().join('\n')).toMatch(/crediti API di Anthropic: speso 0\.00 \$/);
    recordCall(queue, { model: 'claude-opus-5-5', input: 0, written5m: 0, written1h: 0, read: 0, output: 0, usd: 1.5, usdCli: 1.6, esito: 'ok' });
    writeLedger(queue, { ...readLedger(queue), tetto: 100 });
    const text = gen.describe().join('\n');
    expect(text).toMatch(/generatore \(claude, crediti API\)/);
    expect(text).toMatch(/speso 1\.50 \$ di 100\.00 \$ a \w+ \(la CLI dice 1\.60 \$\), 1 chiamate/);
  });
});
