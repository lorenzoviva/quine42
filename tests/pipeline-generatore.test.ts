import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The generator of the leftover credits (T88): plain `.mjs`, imported by a computed URL so tsc does not look for a declaration.
type Storia = { t: string; residuo: number }[];
type Budget = Record<string, { residuo: number; sessione?: number; storia?: Storia; resetSettimana?: string; slot?: number; tetto?: number; fermoFino?: string }>;
type Decision = { azione: string; motivo?: string; tetto?: number; leftover?: number; universo?: { universo: string } };
type Gen = {
  paceOf(storia: Storia, nowMs?: number, giorni?: number): number | undefined;
  leftoverAtReset(o: Record<string, unknown>): number | undefined;
  weekSpent(progress: unknown, reset?: string): number;
  readOutcome(text: string): { esito: string; motivo?: string } | undefined;
  fillCommand(cmd: string[], values: Record<string, unknown>): string[] | undefined;
  Generator: new (o: Record<string, unknown>) => {
    tick(o: { budget: Budget; live?: number; ceiling?: number; wanting?: boolean; stopping?: boolean; nowMs?: number }): Decision;
    load(): Record<string, any>;
    running(): boolean;
    stop(motivo: string, budget?: Budget): void;
    describe(budget?: Budget): string[];
  };
  setGeneratorSwitch(file: string, spento: boolean, chi?: string): void;
};
const G = (await import(pathToFileURL(path.resolve('tools/pipeline/generatore.mjs')).href)) as Gen;
const P = (await import(pathToFileURL(path.resolve('tools/pipeline/pipeline.mjs')).href)) as {
  generatorPlace(candidates: unknown[], o: Record<string, unknown>): { live: number; ceiling: number; wanting: boolean };
};

const NOW = Date.parse('2026-11-08T12:00:00.000Z');
const H = 3_600_000;
const RESET = new Date(NOW + 48 * H).toISOString();
/** A week used at 1 % an hour for the last ten hours, now at `residuo`. */
const storia = (residuo: number, at = NOW): Storia => Array.from({ length: 11 }, (_, i) => ({ t: new Date(at - (10 - i) * H).toISOString(), residuo: residuo + (10 - i) }));

describe('la previsione dell’avanzo', () => {
  it('il ritmo dagli ultimi campioni, a slot pieni, fino al reset', () => {
    expect(G.paceOf(storia(60), NOW)! * H).toBeCloseTo(1);
    // 60 % ora, 1 % l'ora per 48 ore: 12 % al reset; a slot pieni (3 su 1) il ritmo triplica e non avanza niente.
    expect(G.leftoverAtReset({ residuo: 60, storia: storia(60), reset: RESET, slot: 3, tetto: 3, nowMs: NOW })).toBe(12);
    expect(G.leftoverAtReset({ residuo: 60, storia: storia(60), reset: RESET, slot: 1, tetto: 3, nowMs: NOW })).toBe(-84);
    // Senza reset o con meno di un'ora di campioni non si sa.
    expect(G.leftoverAtReset({ residuo: 60, storia: storia(60), nowMs: NOW })).toBeUndefined();
    expect(G.leftoverAtReset({ residuo: 60, storia: storia(60).slice(-1), reset: RESET, nowMs: NOW })).toBeUndefined();
  });

  it('lo speso della settimana dal file del progresso, l’esito dal log, il comando con i suoi valori', () => {
    expect(G.weekSpent({ consumo: { reset: RESET, speso: 7 } }, RESET)).toBe(7);
    expect(G.weekSpent({ consumo: { reset: new Date(NOW - 100 * H).toISOString(), speso: 7 } }, RESET)).toBe(0);
    expect(G.readOutcome('passo 1\ntetto: 25 % della settimana — 3 passi in questa esecuzione\n')).toEqual({ esito: 'tetto', motivo: '25 % della settimana' });
    expect(G.readOutcome('finito — 9 passi in questa esecuzione')).toEqual({ esito: 'finito' });
    expect(G.readOutcome('niente')).toBeUndefined();
    expect(G.fillCommand(['genera', '{universo}', '--tetto', '{tetto}'], { universo: 'neapolis', tetto: 9.5 })).toEqual(['genera', 'neapolis', '--tetto', '9.5']);
    expect(G.fillCommand(['{universo}'], { universo: 'a b; rm' })).toBeUndefined();
  });
});

describe('il generatore sui crediti che avanzano', () => {
  const dirs: string[] = [];
  afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

  /** A pipeline's state and universes in a temporary folder, a fake generation that only records its processes. */
  const world = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-'));
    dirs.push(dir);
    const progress = path.join(dir, 'universes', '.generation');
    fs.mkdirSync(progress, { recursive: true });
    const procs: Array<{ pid: number; args: string[]; alive: boolean; log: string }> = [];
    let next = 1000;
    const spawnFn = (cmd: string, args: string[], o: { stdio: [string, number, number] }) => {
      const p = { pid: next++, args: [cmd, ...args], alive: true, log: '' };
      procs.push(p);
      return { pid: p.pid, on() {}, unref() {} };
    };
    const said: string[] = [];
    const config = {
      riserva: 3, giorniPrevisione: 3,
      providers: { claude: { cmd: 'claude' } },
      limiti: { provider: { claude: 3 } },
      generatore: { provider: 'claude', minimo: 10, sessioneMinima: 30, sessioneArresto: 15, comando: ['genera', '{universo}', '--tema', '{ambientazione}', '--tetto', '{tetto}'], coda: [] },
      generazione: [
        { universo: 'orichalcum', ambientazione: 'steampunk', tettoSettimana: 25 },
        { universo: 'neapolis', ambientazione: 'moderno', tettoSettimana: 25 },
      ],
    };
    const gen = new G.Generator({
      config, repo: dir, logs: path.join(dir, 'log'), stateFile: path.join(dir, 'generatore.json'), switchFile: path.join(dir, 'spento.json'),
      spawnFn, kill: (pid: number) => { const p = procs.find((x) => x.pid === pid); if (p) p.alive = false; },
      isAlive: (pid: number) => Boolean(procs.find((x) => x.pid === pid)?.alive),
      say: (l: string) => said.push(l),
    });
    const spend = (name: string, speso: number) => fs.writeFileSync(path.join(progress, `${name}.json`), JSON.stringify({ passi: [], tetto: 25, consumo: { reset: RESET, ultimo: 0, speso } }));
    /** The fake generation of the running process ends, printing what the real one prints. */
    const end = (line: string) => {
      const run = gen.load().corrente;
      fs.writeFileSync(run.log, `${line}\n`);
      procs.find((p) => p.pid === run.pid)!.alive = false;
    };
    return { dir, gen, procs, said, spend, end, config };
  };
  // 60 % della settimana a 1 % l'ora con 3 slot su 3: al reset tra 48 ore avanza il 12 %.
  const budget = (o: Partial<Budget[string]> = {}): Budget => ({ claude: { residuo: 60, sessione: 80, storia: storia(60), resetSettimana: RESET, slot: 3, tetto: 3, ...o } });

  it('crediti avanzati anche a slot pieni → parte sul primo universo, entro ciò che avanza e il suo tetto', () => {
    const w = world();
    const d = w.gen.tick({ budget: budget(), live: 1, ceiling: 3, nowMs: NOW });
    expect(d).toMatchObject({ azione: 'avvia', leftover: 12, tetto: 9 }); // 0 speso + 12 avanzati − 3 di riserva
    expect(w.procs.map((p) => p.args)).toEqual([['genera', 'orichalcum', '--tema', 'steampunk', '--tetto', '9']]);
    expect(w.gen.load().corrente).toMatchObject({ universo: 'orichalcum', tetto: 9, speso0: 0 });
    // Al controllo dopo continua: niente secondo processo.
    expect(w.gen.tick({ budget: budget(), live: 1, ceiling: 3, nowMs: NOW + 60_000 }).azione).toBe('continua');
    expect(w.procs).toHaveLength(1);
    expect(w.gen.describe(budget()).join('\n')).toMatch(/genera orichalcum .* tetto 9 %, speso 0 % in questa esecuzione/);
  });

  it('niente avanza, slot non pieni, la finestra delle 5 ore bassa o nessun posto sotto il tetto → non parte', () => {
    const w = world();
    expect(w.gen.tick({ budget: budget({ slot: 1 }), live: 0, ceiling: 3, nowMs: NOW })).toMatchObject({ azione: 'attende', motivo: expect.stringMatching(/avanzerebbe il -84 %/) });
    expect(w.gen.tick({ budget: budget({ sessione: 20 }), live: 0, ceiling: 3, nowMs: NOW })).toMatchObject({ azione: 'attende', motivo: expect.stringMatching(/finestra delle 5 ore/) });
    expect(w.gen.tick({ budget: budget(), live: 3, ceiling: 3, nowMs: NOW })).toMatchObject({ azione: 'attende', motivo: expect.stringMatching(/tetto della CLI/) });
    expect(w.gen.tick({ budget: budget(), live: 0, ceiling: 3, wanting: true, nowMs: NOW })).toMatchObject({ azione: 'attende', motivo: 'un task pronto vuole lo slot' });
    expect(w.procs).toHaveLength(0);
    expect(w.gen.describe(budget()).join('\n')).toContain('fermo: un task pronto vuole lo slot');
  });

  it('un task pronto che ha bisogno dello slot → si ferma tenendo il lavoro, e riprende quando il task non lo vuole più', () => {
    const w = world();
    w.gen.tick({ budget: budget(), live: 2, ceiling: 3, nowMs: NOW });
    const first = w.procs[0];
    w.spend('orichalcum', 4);
    expect(w.gen.tick({ budget: budget(), live: 2, ceiling: 3, wanting: true, nowMs: NOW + 60_000 })).toMatchObject({ azione: 'ferma', motivo: 'un task pronto vuole lo slot' });
    expect(first.alive).toBe(false);
    expect(w.gen.load().corrente).toBeUndefined();
    expect(w.gen.load()).toMatchObject({ ultimo: { universo: 'orichalcum', esito: 'fermato', speso: 4 } });
    // Lo stato dell'universo non cambia: niente «finito» né «tetto».
    expect(w.gen.load().universi?.orichalcum).toBeUndefined();
    // Il task parte e prende il posto: il generatore aspetta.
    expect(w.gen.tick({ budget: budget(), live: 3, ceiling: 3, nowMs: NOW + 120_000 }).azione).toBe('attende');
    // Il task finisce: riparte sullo stesso universo, che riprende dai suoi passi, con il tetto da ciò che ha già speso.
    expect(w.gen.tick({ budget: budget(), live: 2, ceiling: 3, nowMs: NOW })).toMatchObject({ azione: 'avvia', tetto: 13 });
    expect(w.procs.at(-1)!.args).toEqual(['genera', 'orichalcum', '--tema', 'steampunk', '--tetto', '13']);
    expect(w.said.join('\n')).toMatch(/fermo orichalcum \(un task pronto vuole lo slot\), il lavoro fatto resta/);
  });

  it('tetto dell’universo raggiunto → passa al prossimo; finito → non ci torna', () => {
    const w = world();
    w.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW });
    w.spend('orichalcum', 25);
    w.end('tetto: 25 % della settimana per questo universo — 6 passi in questa esecuzione');
    const d = w.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW + 60_000 });
    expect(w.gen.load().universi.orichalcum).toMatchObject({ stato: 'tetto', fino: RESET });
    expect(d).toMatchObject({ azione: 'avvia', universo: { universo: 'neapolis' } });
    expect(w.procs.at(-1)!.args.slice(0, 2)).toEqual(['genera', 'neapolis']);
    w.end('finito — 30 passi in questa esecuzione');
    expect(w.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW + 120_000 })).toMatchObject({ azione: 'attende', motivo: 'nessun universo da generare' });
    expect(w.gen.load().universi.neapolis).toMatchObject({ stato: 'finito' });
    // Dopo il reset l'universo al tetto torna in gioco, quello finito no.
    w.spend('orichalcum', 0);
    const later = NOW + 49 * H;
    const after = w.gen.tick({ budget: budget({ residuo: 100, storia: storia(100, later), resetSettimana: new Date(later + 48 * H).toISOString() }), live: 0, ceiling: 3, nowMs: later });
    expect(after).toMatchObject({ azione: 'avvia', universo: { universo: 'orichalcum' }, tetto: 25 });
  });

  it('il tetto di un’esecuzione (ciò che avanzava) non chiude l’universo; un errore lo rimanda di qualche ora', () => {
    const w = world();
    w.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW });
    w.spend('orichalcum', 9);
    w.end('tetto: 9 % — 2 passi in questa esecuzione');
    // Ciò che avanzava è speso: ora la previsione non lascia abbastanza, e l'universo non è segnato.
    expect(w.gen.tick({ budget: budget({ residuo: 51, storia: storia(51) }), live: 0, ceiling: 3, nowMs: NOW + 60_000 }).azione).toBe('attende');
    expect(w.gen.load().universi?.orichalcum).toBeUndefined();
    const v = world();
    v.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW });
    v.end('errore: la coda degli abbonamenti non risponde — 0 passi in questa esecuzione');
    const d = v.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW + 60_000 });
    expect(v.gen.load().universi.orichalcum).toMatchObject({ stato: 'errore', motivo: 'la coda degli abbonamenti non risponde' });
    expect(d.universo?.universo).toBe('neapolis');
  });

  it('l’autore lo spegne e lo riaccende; lo spegnimento della pipeline lo ferma', () => {
    const w = world();
    w.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW });
    G.setGeneratorSwitch(path.join(w.dir, 'spento.json'), true, 'autore');
    expect(w.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW + 60_000 })).toMatchObject({ azione: 'ferma', motivo: 'spento dall’autore' });
    expect(w.procs[0].alive).toBe(false);
    expect(w.gen.describe(budget())[0]).toMatch(/spento dall’autore/);
    G.setGeneratorSwitch(path.join(w.dir, 'spento.json'), false);
    expect(w.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW + 120_000 }).azione).toBe('avvia');
    w.gen.stop('ferma --ora', budget());
    expect(w.procs.every((p) => !p.alive)).toBe(true);
    expect(w.gen.load()).toMatchObject({ ultimo: { esito: 'fermato', motivo: 'ferma --ora' } });
    expect(w.gen.tick({ budget: budget(), live: 0, ceiling: 3, stopping: true, nowMs: NOW + 180_000 }).azione).toBe('attende');
  });

  it('la finestra delle 5 ore che scende sotto la soglia lo ferma', () => {
    const w = world();
    w.gen.tick({ budget: budget(), live: 0, ceiling: 3, nowMs: NOW });
    expect(w.gen.tick({ budget: budget({ sessione: 12 }), live: 0, ceiling: 3, nowMs: NOW + 60_000 })).toMatchObject({ azione: 'ferma', motivo: expect.stringMatching(/finestra delle 5 ore al 12 %/) });
  });
});

describe('il posto del generatore tra i task', () => {
  const config = {
    riserva: 3, sogliaUnSolo: 10, intervalloLanciMinuti: 0, maxParalleli: 5,
    limiti: { provider: { claude: 3, agy: 1 } },
    generatore: { provider: 'claude' },
    providers: { claude: { cmd: 'claude', browser: true }, sonnet: { cmd: 'claude', stessoContoDi: 'claude', browser: true }, gemini: { cmd: 'agy' } },
  };
  const b = { residuo: 80, sessione: 80, slot: 3, tetto: 3 };
  const budget = { claude: b, sonnet: b, gemini: b };
  const task = (id: string, provider: string, estimate = 2) => ({ id, provider, estimate, priority: 10, status: 'da fare' });

  it('un task pronto della stessa CLI che entrerebbe lo vuole; uno di un’altra CLI o che non entra no', () => {
    const live = [{ id: 'T9', provider: 'claude', stima: 2 }];
    expect(P.generatorPlace([task('T1', 'sonnet')], { budget, live, config })).toEqual({ live: 1, ceiling: 3, wanting: true });
    expect(P.generatorPlace([task('T1', 'gemini')], { budget, live, config }).wanting).toBe(false);
    expect(P.generatorPlace([task('T1', 'claude', 200)], { budget, live, config }).wanting).toBe(false);
    expect(P.generatorPlace([], { budget, live, config }).wanting).toBe(false);
  });
});
