// What the Council could not do (T238, ADR-0130): a request that ends badly is one line of the report, and stays on the server.

import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { readShortfalls, shortfallReport, ShortfallLog, SHORTFALLS_FILE, type ShortfallNote } from '../src/kernel/shortfalls';
import { shortfallsOnDisk } from '../tools/mancanze/leggi';

/** The offline models, but some tasks answer what the test says (or throw). */
class Scripted extends MockAiModels {
  constructor(private script: Record<string, (call: TextCall) => unknown>) {
    super();
    this.latency = 0;
  }

  override async text(call: TextCall): Promise<string> {
    const answer = this.script[call.task];
    if (!answer) return super.text(call);
    const a = answer(call);
    return typeof a === 'string' ? a : JSON.stringify(a);
  }
}

const boot = (script: Record<string, (call: TextCall) => unknown> = {}, files = bundledFiles) => Kernel.boot({ files, store: memoryStore(), ai: new Scripted(script) });

const REFUSED = { 'referente.coordinate': () => ({ risposta: 'Questo no.', incarico: 'nessuno', rifiuto: 'distruggerebbe il mondo' }) };

const NOTE: ShortfallNote = { request: 'una torre che vola', who: 'me', agent: 'engineer', task: 'forge.code', outcome: 'invalid', reason: 'funzione sconosciuta' };

describe('il registro delle mancanze', () => {
  it('una richiesta rifiutata dal Referente diventa una riga del rapporto, con chi, agente, motivo e volte', async () => {
    const k = await boot(REFUSED);
    await k.talkToAgent('liaison', 'cancella il mondo');
    await k.talkToAgent('liaison', 'Cancella  il mondo');
    expect(k.shortfalls.list()).toHaveLength(1);
    const report = shortfallReport([{ universo: 'prova', voci: k.shortfalls.list() }]);
    expect(report).toContain('| 2 | cancella il mondo | me | liaison | referente.coordinate | refusal | distruggerebbe il mondo | prova |');
  });

  it('la Fucina: il validatore che rifiuta anche l\'ultimo tentativo finisce sull\'Ingegnere', async () => {
    const k = await boot({ 'forge.code': () => ({ logic: 'questo non è lua (', note: '' }) });
    const r = await k.forgeModule('una madia di legno', 'agente', 'oggetto', true);
    expect(r.ok).toBe(false);
    expect(k.shortfalls.list()).toEqual([expect.objectContaining({ request: 'una madia di legno', who: ['me'], agent: 'engineer', task: 'forge.concept', outcome: 'invalid', times: 1 })]);
    expect(k.shortfalls.list()[0].reason).toContain('modulo non valido');
  });

  it('la Fucina: un modello che tace dice di quale agente era la chiamata, e ciò che chiede il mondo è del mondo', async () => {
    const k = await boot({
      'forge.physics': () => {
        throw new Error('rete caduta');
      },
    });
    await k.forgeModule('un abitante', 'cartografo', 'npc');
    expect(k.shortfalls.list()).toEqual([expect.objectContaining({ who: ['comune'], agent: 'physicist', outcome: 'error', reason: 'rete caduta' })]);
  });

  it('le azioni libere: il rifiuto si conta anche quando è già una regola, il silenzio del modello è un errore', async () => {
    const k = await boot({ 'action.judge': () => ({ possibile: false, racconto: 'Non si vola.', effetti: [], ripetibile: false, etichetta: '' }) });
    const pc = k.wandererCarpet();
    const npc = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 2, pc.y, undefined, 'prova');
    await k.freeAction(npc, 'volo via');
    await k.freeAction(npc, 'volo via');
    const [v] = k.shortfalls.list();
    expect(v).toMatchObject({ who: ['me'], agent: 'narrator', task: 'action.judge', outcome: 'refusal', reason: 'Non si vola.', times: 2 });

    const silent = await boot({
      'action.judge': () => {
        throw new Error('scaduta');
      },
    });
    const p2 = silent.wandererCarpet();
    await silent.freeAction(silent.spawnModuleEntity(silent.modules.get('npc.villager')!, p2.x + 2, p2.y, undefined, 'prova'), 'volo via');
    expect(silent.shortfalls.list()[0]).toMatchObject({ outcome: 'error', reason: 'scaduta' });
  });

  it('l\'Ingegnere che non ripara lascia una voce, chi è del mondo', async () => {
    const k = await boot({ 'forge.fix': () => ({ logic: 'ancora non lua (', note: '' }) });
    const f = await k.forgeModule('una madia di legno per il pane', 'agente', 'oggetto');
    expect(f.ok).toBe(true);
    expect(await k.repairGenerated(`module:${f.id}:on_act`, 'attempt to index nil')).toBe(false);
    const [v] = k.shortfalls.list();
    expect(v).toMatchObject({ who: ['comune'], agent: 'engineer', task: 'forge.fix', outcome: 'fault' });
    expect(v.request).toContain('attempt to index nil');
  });

  it('sul ramo del master la voce va al registro del mondo, a nome del master', async () => {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3, master: 'capo' } }, null, 2) };
    const k = await boot(REFUSED, files);
    expect(k.giveCredits('capo', 10)).toBe(true);
    const fork = await k.branchKernel({ ...k.files }, 'capo');
    await fork.talkToAgent('liaison', 'cancella il mondo');
    expect(fork.shortfalls.list()).toEqual([]);
    expect(k.shortfalls.list()).toEqual([expect.objectContaining({ request: 'cancella il mondo', who: ['capo'], outcome: 'refusal' })]);
  });

  it('il salvataggio porta le voci anche se non è cambiato altro, un rollback non le perde, un riavvio le ritrova', async () => {
    const store = memoryStore();
    const k = await Kernel.boot({ files: bundledFiles, store, ai: new Scripted(REFUSED) });
    k.tick(1 / 60);
    k.saveState();
    expect(k.repo.head().files[SHORTFALLS_FILE]).toBeUndefined();
    await k.talkToAgent('liaison', 'cancella il mondo');
    expect(k.saveState()).toBe(true);
    const saved = k.repo.head().files[SHORTFALLS_FILE]!;
    expect(readShortfalls(saved)).toHaveLength(1);
    expect(k.files[SHORTFALLS_FILE]).toBe(saved);
    expect(k.saveState()).toBe(false);

    const first = k.repo.log().at(-1)!;
    k.rollback(first.id);
    expect(k.repo.working[SHORTFALLS_FILE]).toBeUndefined();
    k.saveFile('world/style.md', '# Stile\n', true);
    expect(k.repo.head().files[SHORTFALLS_FILE]).toBe(saved);

    const again = await Kernel.boot({ files: bundledFiles, store, ai: new Scripted(REFUSED) });
    await again.talkToAgent('liaison', 'cancella il mondo');
    expect(again.shortfalls.list()[0].times).toBe(2);
  });
});

describe('ShortfallLog', () => {
  it('ciò che scrive un giocatore resta una riga e una cella', () => {
    const log = new ShortfallLog();
    log.note({ ...NOTE, request: 'a | b\n# titolo\t\u0007fine', reason: 'x'.repeat(1000) }, '2026-11-04');
    const [v] = log.list();
    expect(v.request).toBe('a | b # titolo fine');
    expect(v.reason).toHaveLength(300);
    const lines = shortfallReport([{ universo: 'u', voci: log.list() }]).split('\n');
    expect(lines.filter((l) => l.includes('# titolo'))).toEqual([expect.stringContaining('a \\| b # titolo fine')]);
  });

  it('i testi troppo lunghi e le richieste vuote', () => {
    const log = new ShortfallLog();
    log.note({ ...NOTE, request: '   ' });
    expect(log.list()).toEqual([]);
    expect(log.version).toBe(0);
    log.note({ ...NOTE, request: 'r'.repeat(500) });
    expect(log.list()[0].request).toHaveLength(200);
  });

  it('oltre il tetto se ne va la più vecchia tra le meno contate, e chi è una sola volta', () => {
    const log = new ShortfallLog();
    log.note(NOTE);
    log.note({ ...NOTE, who: 'altro' });
    log.note(NOTE);
    expect(log.list()[0].who).toEqual(['altro', 'me']);
    expect(log.list()[0].times).toBe(3);
    for (let i = 0; i < 600; i++) log.note({ ...NOTE, request: `inventata ${i}` });
    const all = log.list();
    expect(all).toHaveLength(500);
    expect(all.some((v) => v.request === NOTE.request)).toBe(true);
    expect(all.some((v) => v.request === 'inventata 0')).toBe(false);
    expect(all.some((v) => v.request === 'inventata 599')).toBe(true);
  });

  it('un file rotto o scritto a mano non rompe niente', () => {
    expect(readShortfalls('non json')).toEqual([]);
    expect(readShortfalls('{"voci":3}')).toEqual([]);
    const [v, ...rest] = readShortfalls(JSON.stringify({ voci: [null, { richiesta: 'senza esito' }, { richiesta: 'ok', esito: 'rifiuto', volte: -2, chi: [1, 'me'] }] }));
    expect(rest).toEqual([]);
    expect(v).toMatchObject({ request: 'ok', times: 1, who: ['me'] });
    const log = new ShortfallLog();
    log.note(NOTE, '2026-11-04');
    const round = new ShortfallLog();
    round.load(log.toJson());
    expect(round.toJson()).toBe(log.toJson());
  });
});

describe('il rapporto', () => {
  const dir = () => mkdtempSync(path.join(tmpdir(), 'mancanze-'));

  it('legge ogni universo sul disco, le cartelle con un punto no, i più frequenti prima', () => {
    const root = dir();
    try {
      const put = (name: string, volte: number) => {
        mkdirSync(path.join(root, name, 'world'), { recursive: true });
        writeFileSync(path.join(root, name, 'world', 'mancanze.json'), JSON.stringify({ voci: [{ richiesta: `in ${name}`, chi: ['me'], agente: 'narrator', compito: 'action.judge', esito: 'rifiuto', motivo: 'no', volte, primo: '2026-11-04', ultimo: '2026-11-04' }] }));
      };
      put('alfa', 1);
      put('beta', 7);
      put('.trash', 99);
      mkdirSync(path.join(root, 'vuoto'));
      const all = shortfallsOnDisk(root);
      expect(all.map((u) => u.universo)).toEqual(['alfa', 'beta', 'vuoto']);
      const report = shortfallReport(all);
      expect(report).toContain('Richieste: 2. Volte: 8. Universi con voci: 2.');
      expect(report.indexOf('in beta')).toBeLessThan(report.indexOf('in alfa'));
      expect(report).not.toContain('.trash');
      expect(shortfallsOnDisk(root, 'alfa').map((u) => u.universo)).toEqual(['alfa']);
      expect(() => shortfallsOnDisk(root, '../alfa')).toThrow('universo sconosciuto');
      expect(() => shortfallsOnDisk(root, 'manca')).toThrow('universo sconosciuto');
      expect(shortfallReport(shortfallsOnDisk(root, 'vuoto'))).toContain('Nessuna voce in «vuoto».');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('senza cartella di universi non c\'è niente da dire', () => {
    expect(shortfallsOnDisk(path.join(tmpdir(), 'non-esiste-mancanze'))).toEqual([]);
  });
});
