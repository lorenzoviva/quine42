import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The pipeline is a plain `.mjs` with no types: imported by a computed URL so tsc does not look for a declaration.
type Task = { id: string; title: string; status: string; deps: string[]; provider?: string; estimate?: number; approved?: boolean; priority?: number; parent?: string; needsBrowser?: boolean; step?: number };
type Counter = { nome: string; finestra: '5h' | 'settimana'; residuo: number; reset?: string };
type Pipeline = {
  parseBacklog(text: string): Task[];
  parsePipelineLine(line: string): { provider?: string; estimate?: number; approved: boolean; priority: number; needsBrowser: boolean };
  taskNeedsBrowser(block: string): boolean;
  parseUsage(provider: string, text: string): Counter[] | undefined;
  canOrchestrate(provider: string, config?: unknown): boolean;
  usageLimit(output: string, from?: Date): Date | undefined;
  readOutput(text: string): { session?: string; cost?: number; error: boolean; result: string; outcome?: string; browser?: string };
  capOf(o: { left: number; session?: number; provider: string; orchestrator?: string; slot?: number; tetto?: number; threshold: number; urgent?: boolean; resuming?: boolean }): number;
  ceilingOf(provider: string, config: unknown): number;
  forecastEmpty(storia: { t: string; residuo: number }[], nowMs?: number, giorni?: number): string | undefined;
  weeklyResetOf(b: unknown, conf: unknown, nowMs?: number): string | undefined;
  nextSlot(o: { slot?: number; tetto?: number; previsione?: string; reset?: string; domanda?: number }): number;
  demandOf(queues: Record<string, (Task & { missing?: string[] })[]>): Record<string, number>;
  updateSlots(budget: Record<string, Record<string, unknown>>, queues: Record<string, (Task & { missing?: string[] })[]>, o?: { config?: unknown; nowMs?: number }): Record<string, Record<string, unknown>>;
  computeBudget(provider: string, conf?: unknown, counters?: Counter[]): { residuo: number; sessione: number };
  plan(tasks: Task[], runs: Record<string, any>, budget: Record<string, any>, only?: string): { inCorso: any[]; daIntegrare: any[]; pronti: any[]; daApprovare: any[]; daStimare: any[]; bloccati: any[]; inAttesa: any[] };
  isSuspended(b: unknown, nowMs?: number): boolean;
  suspendProvider(provider: string, finoA?: string, opts?: unknown): { provider: string; sospeso: string | boolean };
  resumeProvider(provider: string, opts?: unknown): { provider: string; sospeso: boolean };
  providerHasBrowser(provider: string, config?: unknown): boolean;
  allowedProviders(t: { provider?: string; needsBrowser?: boolean }, config?: unknown): string[];
  planOf(provider: string, config?: unknown): { nome: string; moltiplicatoreStima: number; disponibili: string[] } | undefined;
  providerEnabled(provider: string, config?: unknown): boolean;
  scaledEstimate(provider: string, estimate: number, config?: unknown): number;
  sessionCost(provider: string, estimate: number, config?: unknown): number;
  windowAdmits(prov: string, t: { estimate?: number; priority?: number }, o: { b: unknown; live?: unknown[]; config?: unknown; nowMs?: number }): boolean;
  fitsOn(prov: string, t: { estimate?: number; priority?: number }, o: { budget: Record<string, unknown>; live?: unknown[]; orch?: string; resuming?: boolean; config?: unknown; nowMs?: number }): boolean;
  taskContext(t: { id: string; deps?: string[]; parent?: string }, opts?: unknown): string;
  recordOutcome(text: string, id: string, hash: string, esito?: string): string;
  renameAdrRefs(text: string, renames: { from: string; to: string; fromFile: string; toFile: string }[], baseText?: string): string;
  integrateTask(id: string, opts?: unknown): { ok: boolean; message: string; conflicts?: string[] };
  summarizeTurn(kind: string, output: string, code: number, logFile: string): string;
  runInTurn(kind: string, command: string[], o: { dir: string; logDir: string; every?: number }): Promise<number>;
};

let P: Pipeline;
beforeAll(async () => {
  const url = pathToFileURL(path.resolve(__dirname, '../tools/pipeline/pipeline.mjs')).href;
  P = (await import(/* @vite-ignore */ url)) as Pipeline;
});
afterEach(() => vi.useRealTimers());

const BACKLOG = `# Backlog

Testo prima dei task, con un ### che non è un task.

### T10 · Un task semplice — \`fatto\` (\`abc1234\`)
- Contesto: niente.

### T11 · Con la riga della pipeline — \`da fare\` (dipende da T10)
- Pipeline: claude · stima 4% · approvato · priorità 2
- Fare: qualcosa, dopo T9 e T12.

### T56 · Il salto — T56a \`fatto\` (\`e5f8099\`), T56b \`da fare\` (dopo T53a)
- Pipeline: gemini · stima 5% · priorità 20

### T43 · Tra giocatori — spezzato in T43a-T43c (dipende da T33, T39)

### T43a · Parole tra viandanti — \`in attesa\` (domande in \`docs/pipeline/domande/T43a.md\`)
- Dipendenze: T43, T63.

### T6 · Un id corto — \`da fare\`
- Fare: dipende da T63; nulla da T6a.

### T63 · Senza stato
`;

describe('parseBacklog', () => {
  const byId = () => new Map(P.parseBacklog(BACKLOG).map((t) => [t.id, t]));

  it('legge stato, titolo e la riga della pipeline', () => {
    const t = byId();
    expect(t.get('T10')).toMatchObject({ title: 'Un task semplice', status: 'fatto', deps: [] });
    expect(t.get('T11')).toMatchObject({ status: 'da fare', provider: 'claude', estimate: 4, approved: true, priority: 2 });
    expect(t.get('T10')?.provider).toBeUndefined();
  });

  it('raccoglie «dipende da», «dopo» e «Dipendenze:»', () => {
    const t = byId();
    expect(t.get('T11')?.deps.sort()).toEqual(['T10', 'T12', 'T9']);
    expect(t.get('T43a')?.deps.sort()).toEqual(['T43', 'T63']);
    expect(t.get('T43')?.deps.sort()).toEqual(['T33', 'T39']);
  });

  it('dà un task per sotto-task dell\'intestazione', () => {
    const t = byId();
    expect(t.has('T56')).toBe(false);
    expect(t.get('T56a')).toMatchObject({ status: 'fatto', parent: 'T56', provider: 'gemini', estimate: 5, approved: false, priority: 20 });
    expect(t.get('T56b')).toMatchObject({ status: 'da fare', parent: 'T56', deps: ['T53a'] });
  });

  it('«spezzato in …» non è eseguibile; senza stato è da fare', () => {
    const t = byId();
    expect(t.get('T43')?.status).toBe('spezzato in T43a-T43c (dipende da T33, T39)');
    expect(t.get('T43a')?.status).toBe('in attesa');
    expect(t.get('T63')?.status).toBe('da fare');
  });

  it('un id corto non scambia per sé i task che iniziano come lui', () => {
    expect(byId().get('T6')?.deps).toEqual(['T63']);
  });

  it('espande gli intervalli di lettere nelle dipendenze senza espandere i soli numeri né includere sé stesso (T253)', () => {
    const text = [
      '### T89e · Forma corta — `da fare` (dipende da T89a-d)',
      '',
      '### T90e · Forma lunga — `da fare` (dipende da T89a-T89d)',
      '',
      '### T91 · Elenco misto — `da fare`',
      '- Dipendenze: T10, T89a-c, T90b-T90d e T95.',
      '',
      '### T92 · Soli numeri — `da fare` (dopo T230-T242)',
      '',
      '### T89c · Sé stesso nell\'intervallo — `da fare` (dipende da T89a-d)',
      '',
      '### T89 · Padre con sotto-task nell\'intervallo — `da fare` (dipende da T89a-d, T10)',
    ].join('\n');
    const m = new Map(P.parseBacklog(text).map((t) => [t.id, t.deps]));
    expect(m.get('T89e')).toEqual(['T89a', 'T89b', 'T89c', 'T89d']);
    expect(m.get('T90e')).toEqual(['T89a', 'T89b', 'T89c', 'T89d']);
    expect(m.get('T91')).toEqual(['T10', 'T89a', 'T89b', 'T89c', 'T90b', 'T90c', 'T90d', 'T95']);
    expect(m.get('T92')).toEqual(['T230', 'T242']);
    expect(m.get('T89c')).toEqual(['T89a', 'T89b', 'T89d']);
    expect(m.get('T89')).toEqual(['T10']);
  });
});

describe('parsePipelineLine', () => {
  it('provider, stima, approvazione e priorità in qualunque ordine', () => {
    expect(P.parsePipelineLine('gemini · priorità 7 · stima 2.5 %')).toEqual({ provider: 'gemini', estimate: 2.5, approved: false, priority: 7, needsBrowser: false });
    expect(P.parsePipelineLine('Claude · Approvato')).toEqual({ provider: 'claude', estimate: undefined, approved: true, priority: 100, needsBrowser: false });
    expect(P.parsePipelineLine('claude · stima 3% · approvato · browser')).toEqual({ provider: 'claude', estimate: 3, approved: true, priority: 100, needsBrowser: true });
  });
});

describe('taskNeedsBrowser e gestione browser (T87)', () => {
  it('riconosce richieste di verifica nel browser da Fatto quando, Fare o riga Pipeline', () => {
    expect(P.taskNeedsBrowser('### T1\n- Fare: qualcosa\n- Fatto quando: verificare nel browser con ?dev\n')).toBe(true);
    expect(P.taskNeedsBrowser('### T2\n- Fare: verificare nel browser se il pulsante clicca\n- Fatto quando: commit\n')).toBe(true);
    expect(P.taskNeedsBrowser('### T3\n- Fare: altro\n- Fatto quando: screenshot della prova confrontato con la foto\n')).toBe(true);
    expect(P.taskNeedsBrowser('### T4\n- Pipeline: claude · stima 2% · browser\n- Fare: niente\n- Fatto quando: commit\n')).toBe(true);
    expect(P.taskNeedsBrowser('### T5\n- Fare: codice puro\n- Fatto quando: test verdi\n')).toBe(false);
  });

  it('riconosce verifiche browser anche con «Quando è fatto:» e «Cosa fare:» (T111)', () => {
    // T109 usava «Quando è fatto:» con screenshot e nel browser
    expect(P.taskNeedsBrowser('### T109 · Sito\n- Quando è fatto: le pagine aperte nel browser (screenshot)\n')).toBe(true);
    // T110 usava «Cosa fare:» con turno browser e «Quando è fatto:» con screenshot
    expect(P.taskNeedsBrowser('### T110 · Verificare sito\n- Cosa fare: nel turno browser servi...\n- Quando è fatto: screenshot di ogni pagina\n')).toBe(true);
    // Un task che cita la regola per altri task (come T111) non richiede il browser
    expect(P.taskNeedsBrowser('### T111 · Pipeline: un task con verifica nel browser non ripiega\n- Cosa fare: non scegliere un provider senza browser per un task che chiede la verifica nel browser\n- Quando è fatto: test della pipeline verdi con il caso nuovo; typecheck verde.\n')).toBe(false);
  });

  it('un task gira solo sul suo provider: nessun ripiego, nemmeno con una voce `alternative` rimasta (ADR-0119)', () => {
    const taskBrowser: Task = { id: 'T110', title: 'Task browser', status: 'da fare', deps: [], provider: 'claude', estimate: 3, approved: true, priority: 30, needsBrowser: true };
    const taskNormale: Task = { id: 'T111', title: 'Task normale', status: 'da fare', deps: [], provider: 'claude', estimate: 2, approved: true, priority: 20, needsBrowser: false };
    const config = {
      providers: {
        claude: { browser: true },
        gemini: { browser: false },
        argon: { browser: false },
      },
      alternative: {
        claude: ['argon', 'gemini'],
      },
    };

    expect(P.allowedProviders(taskBrowser, config)).toEqual(['claude']);
    expect(P.allowedProviders(taskNormale, config)).toEqual(['claude']);
    // Un task col browser su un provider che non ce l'ha aspetta: non va su un altro.
    expect(P.allowedProviders({ ...taskBrowser, provider: 'gemini' }, config)).toEqual([]);
    const real = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tools/pipeline/config.json'), 'utf8'));
    expect(real.alternative).toBeUndefined();
  });

  it('parseBacklog marca needsBrowser per i task pertinenti', () => {
    const text = [
      '### T90 · Task browser — `da fare`',
      '- Pipeline: claude · stima 2% · approvato',
      '- Fare: correggi la vista',
      '- Fatto quando: verificare nel browser con ?dev&teleport=46,0',
      '',
      '### T91 · Task senza browser — `da fare`',
      '- Pipeline: gemini · stima 1% · approvato',
      '- Fare: scrivi documentazione',
      '- Fatto quando: test verdi',
    ].join('\n');
    const tasks = P.parseBacklog(text);
    expect(tasks.find((t) => t.id === 'T90')?.needsBrowser).toBe(true);
    expect(tasks.find((t) => t.id === 'T91')?.needsBrowser).toBe(false);
  });

  it('plan blocca i task con needsBrowser assegnati a provider senza browser (gemini/argon)', () => {
    const tasks: Task[] = [
      { id: 'T92', title: 'Task UI', status: 'da fare', deps: [], provider: 'gemini', estimate: 2, approved: true, priority: 10, needsBrowser: true },
      { id: 'T93', title: 'Task UI Claude', status: 'da fare', deps: [], provider: 'claude', estimate: 2, approved: true, priority: 10, needsBrowser: true },
    ];
    const queues = P.plan(tasks, {}, {});
    expect(queues.pronti.map((t: any) => t.id)).toEqual(['T93']);
    expect(queues.bloccati.map((t: any) => t.id)).toEqual(['T92']);
    expect(queues.bloccati[0].missing).toEqual(['provider con browser (claude)']);
  });
});

describe('parseUsage', () => {
  it('claude -p /usage: sessione e settimana, nell\'ora locale', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 28, 20, 0));
    const text = [
      'Current session: 6% used · resets Oct 29, 12:10am (Europe/Rome)',
      'Current week (all models): 99% used · resets Oct 29, 5pm (Europe/Rome)',
      'Altro testo',
    ].join('\r\n');
    const c = P.parseUsage('claude', text)!;
    expect(c.map(({ nome, finestra, residuo }) => ({ nome, finestra, residuo }))).toEqual([
      { nome: 'session', finestra: '5h', residuo: 94 },
      { nome: 'week (all models)', finestra: 'settimana', residuo: 1 },
    ]);
    expect(new Date(c[0].reset!)).toEqual(new Date(2026, 9, 29, 0, 10));
    expect(new Date(c[1].reset!)).toEqual(new Date(2026, 9, 29, 17, 0));
  });

  it('claude: un reset di gennaio visto a dicembre è dell\'anno dopo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 30, 10, 0));
    const [c] = P.parseUsage('claude', 'Current week (all models): 40% used · resets Jan 2, 9am (Europe/Rome)')!;
    expect(new Date(c.reset!)).toEqual(new Date(2027, 0, 2, 9, 0));
  });

  it('agy -p /usage: righe separate da tabulazioni', () => {
    const text = [
      'Model\tLimit\tRemaining\tResets',
      'Gemini Models\tWeekly Limit Remaining\t100%\t2026-11-04T18:44:53Z',
      'Gemini Models\tFive Hour Limit Remaining\t37%\t2026-10-29T15:00:00Z',
      'Gemini Pro\tWeekly Limit Remaining\t50%',
    ].join('\n');
    expect(P.parseUsage('gemini', text)).toEqual([
      { nome: 'Gemini Models', finestra: 'settimana', residuo: 100, reset: '2026-11-04T18:44:53.000Z' },
      { nome: 'Gemini Models', finestra: '5h', residuo: 37, reset: '2026-10-29T15:00:00.000Z' },
      { nome: 'Gemini Pro', finestra: 'settimana', residuo: 50, reset: undefined },
    ]);
  });

  it('niente contatori: undefined', () => {
    expect(P.parseUsage('claude', 'Error: not logged in')).toBeUndefined();
    expect(P.parseUsage('gemini', '')).toBeUndefined();
  });

  it('Argon in agy /usage ha solo il limite settimanale (senza 5h)', () => {
    const text = [
      'Model\tLimit\tRemaining\tResets',
      'Gemini 4 Argon\tGemini 4 Argon Weekly Limit\t28%\t2026-11-04T18:44:35Z',
    ].join('\n');
    expect(P.parseUsage('argon', text)).toEqual([
      { nome: 'Gemini 4 Argon', finestra: 'settimana', residuo: 28, reset: '2026-11-04T18:44:35.000Z' },
    ]);
  });
});

describe('computeBudget', () => {
  it('calcola residuo e sessione per claude con sessione di 5h', () => {
    const counters: Counter[] = [
      { nome: 'session', finestra: '5h', residuo: 94 },
      { nome: 'week', finestra: 'settimana', residuo: 1 },
    ];
    expect(P.computeBudget('claude', { finestra5h: true }, counters)).toEqual({ residuo: 1, sessione: 94 });
  });

  it('per Argon (settimanale senza 5h) la sessione si basa sul limite settimanale', () => {
    const counters: Counter[] = [
      { nome: 'Gemini 4 Argon', finestra: 'settimana', residuo: 28 },
    ];
    expect(P.computeBudget('argon', { finestra5h: false }, counters)).toEqual({ residuo: 28, sessione: 28 });
  });

  it('anche senza configurazione esplicita, un provider senza contatore 5h basa la sessione sul settimanale', () => {
    const counters: Counter[] = [
      { nome: 'SoloSettimanale', finestra: 'settimana', residuo: 35 },
    ];
    expect(P.computeBudget('custom', {}, counters)).toEqual({ residuo: 35, sessione: 35 });
  });
});

describe('usageLimit', () => {
  it('l\'epoca dopo «|» dice quando riparte', () => {
    expect(P.usageLimit('Claude AI usage limit reached|1761735600')).toEqual(new Date(1761735600 * 1000));
  });

  it('senza epoca: tra `attesaLimiteMinuti`', () => {
    const at = P.usageLimit('Error 429: RESOURCE_EXHAUSTED')!;
    expect(at.getTime()).toBeGreaterThan(Date.now() + 30 * 60_000);
  });

  it('nessun limite', () => {
    expect(P.usageLimit('Tutto bene, 14290 righe lette')).toBeUndefined();
    expect(P.usageLimit('')).toBeUndefined();
  });

  it('«429» da solo è un limite', () => {
    expect(P.usageLimit('HTTP 429 Too Many Requests')).toBeDefined();
  });

  it('il limite delle 5 ore di Claude riparte all\'ora che dice, il giorno dopo se è passata', () => {
    const from = new Date(2026, 9, 29, 20, 15);
    expect(P.usageLimit('You\'ve hit your 5-hour limit · resets 10pm (Europe/Rome)', from)).toEqual(new Date(2026, 9, 29, 22, 1));
    expect(P.usageLimit('You\'ve hit your limit · resets 9:30am', from)).toEqual(new Date(2026, 9, 30, 9, 31));
  });
});

describe('Fable (ADR-0115)', () => {
  const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tools/pipeline/config.json'), 'utf8'));
  const reads = (p: string, name: string) => new RegExp(config.providers[p].contatori).test(name);

  it("non orchestra e non è nell'ordine", () => {
    expect(P.canOrchestrate('fable')).toBe(false);
    expect(P.canOrchestrate('claude')).toBe(true);
    expect(P.canOrchestrate('nessuno')).toBe(false);
    expect(config.orchestra.ordine).not.toContain('fable');
  });

  it('il suo contatore ferma lui, non Claude; il comune ferma entrambi', () => {
    expect(reads('claude', 'week (Fable)')).toBe(false);
    expect(reads('fable', 'week (Fable)')).toBe(true);
    for (const p of ['claude', 'fable']) for (const n of ['session', 'week (all models)']) expect(reads(p, n)).toBe(true);
  });

  it("sotto la soglia non riprende sul conto dell'orchestratore", () => {
    const low = { threshold: 10, orchestrator: 'claude', left: 5, session: 5, resuming: true };
    expect(P.capOf({ ...low, provider: 'fable' })).toBe(0);
    expect(P.capOf({ ...low, provider: 'gemini' })).toBe(1);
  });

  it('i modelli sono scritti, il tetto è 1', () => {
    expect(config.providers.fable.args).toContain('claude-fable-5-1');
    expect(config.providers.claude.args).toContain('claude-opus-5-5');
    expect(config.limiti.modello.fable).toBe(1);
    expect(config.limiti.provider.claude).toBe(3);
  });
});

describe('piani e finestra delle 5 ore (ADR-0119)', () => {
  const real = () => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tools/pipeline/config.json'), 'utf8'));
  const withPlans = (claude: string, google = 'ultra') => ({ ...real(), abbonamenti: { claude, google } });
  const NOW = Date.parse('2026-11-03T12:00:00Z');
  const counters = (residuo: number, reset: string) => [{ nome: 'session', finestra: '5h', residuo, reset }];
  const FAR = '2026-11-03T15:00:00Z';

  it('ogni provider dice se può orchestrare e il suo rapporto sessione/settimana', () => {
    const c = real();
    expect(c.providers.claude).toMatchObject({ orchestrabile: true, ratioSessioneSettimana: 12 });
    expect(c.providers.fable).toMatchObject({ orchestrabile: false, ratioSessioneSettimana: 8 });
    expect(c.providers.gemini).toMatchObject({ orchestrabile: true, ratioSessioneSettimana: 3.3 });
    expect(c.providers.argon).toMatchObject({ orchestrabile: true, ratioSessioneSettimana: 1, finestra5h: false });
    expect(c.orchestra.rotazione).toBe(0.35);
  });

  it('il piano scala le stime e dice chi è disponibile', () => {
    expect(P.scaledEstimate('claude', 2, withPlans('pro'))).toBe(10);
    expect(P.scaledEstimate('claude', 2, withPlans('max5x'))).toBe(2);
    expect(P.scaledEstimate('claude', 2, withPlans('max20x'))).toBe(0.5);
    expect(P.scaledEstimate('gemini', 2, withPlans('max5x', 'pro'))).toBe(5);
    expect(P.providerEnabled('fable', withPlans('pro'))).toBe(false);
    expect(P.providerEnabled('fable', withPlans('max20x'))).toBe(true);
    expect(P.providerEnabled('gemini', withPlans('max5x', 'pro'))).toBe(true);
    expect(P.providerEnabled('argon', withPlans('max5x', 'nessuno'))).toBe(false);
    // Una configurazione senza piani non scala e non disabilita nulla.
    expect(P.scaledEstimate('claude', 2, { providers: { claude: {} } })).toBe(2);
    expect(P.providerEnabled('claude', { providers: { claude: {} } })).toBe(true);
  });

  it('Argon sta anche nel piano Google Pro, ed è quello attivo (T305)', () => {
    expect(real().abbonamenti.google).toBe('pro');
    expect(P.providerEnabled('argon', real())).toBe(true);
    expect(P.canOrchestrate('argon', real())).toBe(true);
    expect(P.ceilingOf('argon', real())).toBe(1);
    for (const google of ['pro', 'ultra']) expect(P.providerEnabled('argon', withPlans('max5x', google))).toBe(true);
  });

  it('il piano «nessuno» dà tetto 0 ai suoi provider e nessuno orchestra da lì', () => {
    const c = withPlans('nessuno');
    expect(P.ceilingOf('claude', c)).toBe(0);
    expect(P.ceilingOf('fable', c)).toBe(0);
    expect(P.ceilingOf('gemini', c)).toBe(1);
    expect(P.canOrchestrate('claude')).toBe(true);
    expect(P.allowedProviders({ provider: 'claude' }, c)).toEqual([]);
  });

  it('un task nuovo parte solo se la sessione regge il suo costo', () => {
    const c = withPlans('max5x');
    expect(P.sessionCost('claude', 2, c)).toBe(24);
    const t = { estimate: 2, priority: 10 };
    expect(P.windowAdmits('claude', t, { b: { sessione: 24, contatori: counters(24, FAR) }, config: c, nowMs: NOW })).toBe(true);
    expect(P.windowAdmits('claude', t, { b: { sessione: 23, contatori: counters(23, FAR) }, config: c, nowMs: NOW })).toBe(false);
    // Lo stesso task su Pro pesa cinque volte tanto.
    expect(P.windowAdmits('claude', t, { b: { sessione: 90, contatori: counters(90, FAR) }, config: withPlans('pro'), nowMs: NOW })).toBe(true); // al più 85
    expect(P.windowAdmits('claude', { estimate: 1, priority: 10 }, { b: { sessione: 50, contatori: counters(50, FAR) }, config: withPlans('pro'), nowMs: NOW })).toBe(false);
  });

  it('una stima enorme chiede al più 85 punti, altrimenti non partirebbe mai', () => {
    const c = withPlans('max5x');
    const t = { estimate: 20, priority: 10 };
    expect(P.windowAdmits('claude', t, { b: { sessione: 85 }, config: c, nowMs: NOW })).toBe(true);
    expect(P.windowAdmits('claude', t, { b: { sessione: 84 }, config: c, nowMs: NOW })).toBe(false);
  });

  it('la sessione impegnata conta i task in corso dello stesso conto, Fable con Claude, non Gemini', () => {
    const c = withPlans('max5x');
    const t = { estimate: 2, priority: 10 };
    const b = { sessione: 60, contatori: counters(60, FAR) };
    expect(P.windowAdmits('claude', t, { b, live: [{ provider: 'gemini', stima: 5 }], config: c, nowMs: NOW })).toBe(true);
    expect(P.windowAdmits('claude', t, { b, live: [{ provider: 'claude', stima: 3 }], config: c, nowMs: NOW })).toBe(true); // 60 - 36 = 24
    expect(P.windowAdmits('claude', t, { b, live: [{ provider: 'claude', stima: 4 }], config: c, nowMs: NOW })).toBe(false); // 60 - 48
    expect(P.windowAdmits('claude', t, { b, live: [{ provider: 'fable', stima: 6 }], config: c, nowMs: NOW })).toBe(false); // 60 - 48
    expect(P.windowAdmits('fable', { estimate: 1, priority: 10 }, { b, live: [{ provider: 'claude', stima: 5 }], config: c, nowMs: NOW })).toBe(false); // 60 - 60 < 8
  });

  it('le eccezioni: il reset entro 20 minuti, la priorità 0, chi non ha la finestra', () => {
    const c = withPlans('max5x');
    const t = { estimate: 4, priority: 10 };
    const low = (reset: string) => ({ sessione: 15, contatori: counters(15, reset) });
    expect(P.windowAdmits('claude', t, { b: low('2026-11-03T12:20:00Z'), config: c, nowMs: NOW })).toBe(true);
    expect(P.windowAdmits('claude', t, { b: low('2026-11-03T12:21:00Z'), config: c, nowMs: NOW })).toBe(false);
    expect(P.windowAdmits('claude', t, { b: low('2026-11-03T11:59:00Z'), config: c, nowMs: NOW })).toBe(false); // un reset già passato non conta
    expect(P.windowAdmits('claude', { estimate: 4, priority: 0 }, { b: low(FAR), config: c, nowMs: NOW })).toBe(true);
    expect(P.windowAdmits('argon', t, { b: { sessione: 1 }, config: c, nowMs: NOW })).toBe(true);
  });

  it('fitsOn: la settimana è scalata, la finestra conta solo per i task nuovi, nessuna eccezione sotto la soglia', () => {
    const c = withPlans('pro');
    const budget = (residuo: number, sessione: number) => ({ claude: { residuo, sessione, slot: 2, tetto: 2, contatori: counters(sessione, FAR) } });
    const t = { estimate: 1, priority: 10 };
    expect(P.fitsOn('claude', t, { budget: budget(50, 70), config: c, nowMs: NOW })).toBe(true);
    // 1 % su Pro è 5 % della settimana: con la riserva di 3 non ci sta.
    expect(P.fitsOn('claude', t, { budget: budget(13, 70), config: c, nowMs: NOW })).toBe(true);
    expect(P.fitsOn('claude', t, { budget: budget(7, 70), config: c, nowMs: NOW })).toBe(false);
    expect(P.fitsOn('claude', t, { budget: budget(50, 40), config: c, nowMs: NOW })).toBe(false);
    expect(P.fitsOn('claude', t, { budget: budget(50, 40), resuming: true, orch: 'gemini', config: c, nowMs: NOW })).toBe(true);
    expect(P.fitsOn('claude', { estimate: 1, priority: 0 }, { budget: budget(50, 5), orch: 'gemini', config: c, nowMs: NOW })).toBe(false);
    // Su un provider fermo o senza piano non parte nulla.
    const off = { ...withPlans('nessuno') };
    expect(P.fitsOn('claude', t, { budget: { claude: { residuo: 90, sessione: 90, slot: 1 } }, config: off, nowMs: NOW })).toBe(false);
  });
});

describe('il contesto dei task e il backlog (ADR-0119)', () => {
  it('il prompt manda a .pipeline-task.md e tiene gli agenti fuori dal backlog', () => {
    const c = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tools/pipeline/config.json'), 'utf8'));
    expect(c.prompt).toContain('.pipeline-task.md');
    expect(c.prompt).toMatch(/non leggere e non modificare `docs\/plans\/backlog\.md`/i);
    for (const k of ['{id}', '{dir}', '{branch}', '{base}']) expect(c.prompt).toContain(k);
    expect(fs.readFileSync(path.resolve(__dirname, '../.gitignore'), 'utf8')).toMatch(/^\.pipeline-task\.md$/m);
  });

  it('taskContext: il blocco, i dossier di chi dipende e da chi nasce, le regole; non il resto del backlog', () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'quine-contesto-'));
    fs.mkdirSync(path.join(repo, 'docs', 'plans'), { recursive: true });
    fs.mkdirSync(path.join(repo, 'docs', 'pipeline'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'docs', 'plans', 'backlog.md'), [
      '### T1 · La base — `fatto` (`aaa`)', '- Fare: BLOCCO-T1.', '',
      '### T2 · Il bug — `fatto` (`bbb`)', '- Fare: BLOCCO-T2.', '',
      '### T3 · Il mio — `da fare` (dipende da T1)', '- Pipeline: claude · stima 1% · approvato · priorità 1', '- Contesto: nasce da T2.', '',
      '### T4 · Estraneo — `da fare`', '- Fare: BLOCCO-T4.', '',
    ].join('\n'));
    fs.writeFileSync(path.join(repo, 'docs', 'pipeline', 'README.md'), '# X\n\n## Regole per chi esegue un task (ambiente condiviso)\n\nREGOLA-UNO\n\n## Altro\n\nNON-QUESTA\n');
    const text = P.taskContext({ id: 'T3', deps: ['T1'] }, { repo, config: { providers: {} } });
    expect(text).toContain('# Il tuo task: T3');
    expect(text).toContain('nasce da T2');
    expect(text).toContain('BLOCCO-T1');
    expect(text).toContain('BLOCCO-T2');
    expect(text).toContain('REGOLA-UNO');
    expect(text).not.toContain('NON-QUESTA');
    expect(text).not.toContain('BLOCCO-T4');
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it('recordOutcome: lo stato segue l\'esito, i backtick del titolo restano', () => {
    const text = '### T8 · R1: `Building` → `Lot` — `da fare` (dipende da T7)\n- Fare: x.\n\n### T9 · Dopo — `da fare`\n- Fare: y.\n';
    const done = P.recordOutcome(text, 'T8', 'abc1234', 'ESITO: fatto — rinominato tutto');
    expect(done).toContain('### T8 · R1: `Building` → `Lot` — `fatto` (`abc1234`) (dipende da T7)');
    expect(done).toContain('- Fare: x.\n- Esito: rinominato tutto\n\n### T9 · Dopo — `da fare`');
    expect(P.parseBacklog(done).find((t) => t.id === 'T8')?.status).toBe('fatto');
    const waiting = P.recordOutcome(text, 'T8', 'abc1234', 'ESITO: in attesa — domanda scritta');
    expect(P.parseBacklog(waiting).find((t) => t.id === 'T8')?.status).toBe('in attesa');
    const failed = P.recordOutcome(text, 'T8', 'abc1234', 'ESITO: fallito (codice 1)');
    expect(P.parseBacklog(failed).find((t) => t.id === 'T8')?.status).toBe('da fare');
    expect(failed).toContain('- Esito: (codice 1)');
    // Senza esito (integrato tramite un altro task) è fatto; un blocco che lo dice già non cambia.
    expect(P.parseBacklog(P.recordOutcome(text, 'T8', 'abc1234')).find((t) => t.id === 'T8')?.status).toBe('fatto');
    expect(P.recordOutcome(done, 'T8', 'fff', 'ESITO: fatto — di nuovo')).toBe(done);
    // Un sotto-task nel titolo del padre.
    const sub = P.recordOutcome('### T56 · Il salto — T56a `fatto` (`e5f`), T56b `da fare` (dopo T53a)\n', 'T56b', 'abc', 'ESITO: fatto — ok');
    expect(sub).toContain('T56a `fatto` (`e5f`), T56b `fatto` (`abc`) (dopo T53a)');
    // `$` nell'esito resta com'è.
    expect(P.recordOutcome(text, 'T8', 'abc', 'ESITO: fatto — costa 5 $& basta')).toContain('costa 5 $& basta');
  });

  it('renameAdrRefs: i riferimenti del task cambiano, le righe uguali al base no', () => {
    const r = [{ from: '0002', to: '0003', fromFile: '0002-b.md', toFile: '0003-b.md' }];
    const base = 'Vedi ADR-0002 del base.\n';
    const text = 'Vedi ADR-0002 del base.\nIl task: ADR-0002, non ADR-00021.\n| [0002](0002-b.md) | x |\n';
    expect(P.renameAdrRefs(text, r, base)).toBe('Vedi ADR-0002 del base.\nIl task: ADR-0003, non ADR-00021.\n| [0003](0003-b.md) | x |\n');
  });
});

describe('integrateTask in un repository vero (ADR-0119)', () => {
  const run = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const write = (root: string, f: string, text: string) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), text); };
  const INDEX = '# ADR\n\n| N | D |\n|---|---|\n| [0001](0001-a.md) | a |\n\nModello: copia.\n';
  const BACKLOG_TEXT = '# Backlog\n\n### T7 · Il task `con` backtick — `da fare`\n- Fare: x.\n\n### T8 · Un altro — `da fare`\n- Fare: y.\n';

  /** A repository with a base branch and `task/T7` in its own worktree, which adds ADR 0002; the base then takes 0002 too. */
  const sandbox = (esito = 'ESITO: fatto — ha funzionato') => {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'quine-integra-')));
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    run(repo, 'init', '-q', '-b', 'base3d');
    run(repo, 'config', 'user.email', 'prova@example.com');
    run(repo, 'config', 'user.name', 'Prova');
    run(repo, 'config', 'commit.gpgsign', 'false');
    fs.copyFileSync(path.resolve(__dirname, '../.gitattributes'), path.join(repo, '.gitattributes'));
    write(repo, '.gitignore', '.pipeline/\n.pipeline-task.md\ndocs/pipeline/orchestrazione.md\n'); // il diario lo scrive `say`
    write(repo, 'docs/adr/README.md', INDEX);
    write(repo, 'docs/adr/0001-a.md', '# ADR-0001 — A\n');
    write(repo, 'docs/plans/backlog.md', BACKLOG_TEXT);
    write(repo, 'note.md', 'Comune.\n');
    run(repo, 'add', '-A');
    run(repo, 'commit', '-qm', 'inizio');
    const wt = path.join(root, 't7');
    run(repo, 'worktree', 'add', '-q', '-b', 'task/T7', wt);
    write(wt, '.pipeline-task.md', 'generato, ignorato da git\n');
    write(wt, 'docs/adr/0002-b.md', '# ADR-0002 — B\n');
    write(wt, 'docs/adr/README.md', INDEX.replace('\n\nModello', '\n| [0002](0002-b.md) | Vedi ADR-0002 |\n\nModello'));
    write(wt, 'note.md', 'Comune.\nSecondo ADR-0002.\n');
    run(wt, 'add', '-A');
    run(wt, 'commit', '-qm', 'il task');
    write(repo, 'docs/adr/0002-c.md', '# ADR-0002 — C\n');
    write(repo, 'docs/adr/README.md', INDEX.replace('\n\nModello', '\n| [0002](0002-c.md) | Il base |\n\nModello'));
    run(repo, 'add', '-A');
    run(repo, 'commit', '-qm', 'il base prende lo 0002');
    const stateDir = path.join(repo, '.pipeline');
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(path.join(stateDir, 'esecuzioni.json'), JSON.stringify({ T7: { id: 'T7', stato: 'finito', esito } }));
    return { root, repo, wt, opts: { repo, stateDir, config: { base: 'base3d', providers: { claude: {} } } } };
  };

  it('rinumera l\'ADR, tiene le due righe dell\'indice, scrive stato ed esito nel commit di merge', () => {
    const { root, repo, wt, opts } = sandbox();
    const tip = run(repo, 'rev-parse', '--short', 'task/T7');
    const res = P.integrateTask('T7', opts);
    expect(res.message).toContain('ADR-0002 → ADR-0003');
    expect(res.ok).toBe(true);
    expect(fs.existsSync(path.join(repo, 'docs/adr/0003-b.md'))).toBe(true);
    expect(fs.existsSync(path.join(repo, 'docs/adr/0002-b.md'))).toBe(false);
    expect(fs.readFileSync(path.join(repo, 'docs/adr/0002-c.md'), 'utf8')).toContain('ADR-0002');
    expect(fs.readFileSync(path.join(repo, 'docs/adr/0003-b.md'), 'utf8')).toContain('# ADR-0003');
    expect(fs.readFileSync(path.join(repo, 'note.md'), 'utf8')).toContain('Secondo ADR-0003.');
    const index = fs.readFileSync(path.join(repo, 'docs/adr/README.md'), 'utf8');
    expect(index).toContain('| [0002](0002-c.md) | Il base |');
    expect(index).toContain('| [0003](0003-b.md) | Vedi ADR-0003 |');
    expect(index).not.toContain('<<<<');
    // Il backlog è nel commit di merge stesso, non in uno dopo, e il base è pulito.
    const merge = run(repo, 'log', '-1', '--format=%s %P');
    expect(merge.split(' ').length).toBeGreaterThan(4);
    expect(merge).toContain('Pipeline: integra T7');
    expect(run(repo, 'show', '--format=', '--name-only', '--first-parent', 'HEAD')).toContain('docs/plans/backlog.md');
    expect(run(repo, 'status', '--porcelain')).toBe('');
    const backlog = fs.readFileSync(path.join(repo, 'docs/plans/backlog.md'), 'utf8');
    expect(backlog).toContain('### T7 · Il task `con` backtick — `fatto`');
    expect(backlog).toContain('- Esito: ha funzionato');
    expect(backlog).toContain('### T8 · Un altro — `da fare`');
    expect(tip).toMatch(/^[0-9a-f]+$/);
    // Worktree e branch tolti, anche con .pipeline-task.md dentro.
    expect(fs.existsSync(wt)).toBe(false);
    expect(run(repo, 'branch', '--list', 'task/T7')).toBe('');
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('un ADR con un numero libero non si tocca; un task in attesa non diventa fatto', () => {
    const { root, repo, wt, opts } = sandbox('ESITO: in attesa — chiedo');
    run(wt, 'mv', 'docs/adr/0002-b.md', 'docs/adr/0009-b.md');
    run(wt, 'commit', '-qm', 'un numero libero');
    const res = P.integrateTask('T7', opts);
    expect(res.ok).toBe(true);
    expect(res.message).not.toContain('→');
    expect(fs.existsSync(path.join(repo, 'docs/adr/0009-b.md'))).toBe(true);
    const tasks = P.parseBacklog(fs.readFileSync(path.join(repo, 'docs/plans/backlog.md'), 'utf8'));
    expect(tasks.find((t) => t.id === 'T7')?.status).toBe('in attesa');
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('un conflitto vero lascia il base com\'era', () => {
    const { root, repo, wt, opts } = sandbox();
    write(wt, 'note.md', 'Del task.\n');
    run(wt, 'add', '-A');
    run(wt, 'commit', '-qm', 'conflitto');
    write(repo, 'note.md', 'Del base.\n');
    run(repo, 'add', '-A');
    run(repo, 'commit', '-qm', 'conflitto');
    const head = run(repo, 'rev-parse', 'HEAD');
    const exit = process.exitCode;
    const res = P.integrateTask('T7', opts);
    process.exitCode = exit;
    expect(res.ok).toBe(false);
    expect(res.conflicts).toContain('note.md');
    expect(run(repo, 'rev-parse', 'HEAD')).toBe(head);
    expect(run(repo, 'status', '--porcelain')).toBe('');
    expect(fs.readFileSync(path.join(repo, 'docs/plans/backlog.md'), 'utf8')).toBe(BACKLOG_TEXT);
    run(repo, 'worktree', 'remove', '--force', wt);
    fs.rmSync(root, { recursive: true, force: true });
  });
});

describe("l'uscita dei turni (ADR-0119)", () => {
  it('riuscito: le ultime 20 righe e il log', () => {
    const output = Array.from({ length: 50 }, (_, i) => `riga ${i}`).join('\n') + '\n';
    const s = P.summarizeTurn('test', output, 0, 'x/turno-test.log').split('\n');
    expect(s).toHaveLength(21);
    expect(s[0]).toBe('riga 30');
    expect(s.at(-1)).toContain('x/turno-test.log');
    expect(s.at(-1)).toContain('riuscito');
  });

  it('fallito: solo i blocchi di errore, al più 120 righe, e il log', () => {
    const noise = Array.from({ length: 500 }, (_, i) => `rumore ${i}`);
    noise[100] = '\u001b[31m FAIL  tests/a.test.ts > cade\u001b[0m';
    noise[101] = 'dettaglio del guasto';
    noise[300] = "src/a.ts(1,1): error TS2322: Type 'x'";
    const s = P.summarizeTurn('typecheck', noise.join('\n'), 2, 'l.log');
    expect(s).toContain(' FAIL  tests/a.test.ts > cade');
    expect(s).not.toContain('\u001b');
    expect(s).toContain('dettaglio del guasto');
    expect(s).toContain('error TS2322');
    expect(s).not.toContain('rumore 200');
    expect(s).toContain('FALLITO (codice 2)');
    const flood = P.summarizeTurn('test', Array.from({ length: 900 }, () => 'FAIL x').join('\n'), 1, 'l.log').split('\n');
    expect(flood).toHaveLength(121);
    // Nessun errore riconosciuto: la coda, non il vuoto.
    expect(P.summarizeTurn('build', 'qualcosa è andato storto\n', 1, 'l.log')).toContain('qualcosa è andato storto');
  });

  it('runInTurn scrive tutto nel log, stampa il riassunto e passa il codice', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quine-turno-log-'));
    const script = path.join(dir, 'parla.cjs');
    fs.writeFileSync(script, 'for (let i = 0; i < 40; i++) console.log("riga " + i); process.exit(3);');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = process.listeners('exit').length;
    try {
      const code = await P.runInTurn('test', [`"${process.execPath}"`, `"${script}"`], { dir: path.join(dir, 'lock'), logDir: path.join(dir, 'log') });
      expect(code).toBe(3);
      const whole = fs.readFileSync(path.join(dir, 'log', 'turno-test.log'), 'utf8');
      expect(whole).toContain('riga 0');
      expect(whole).toContain('riga 39');
      expect(String(log.mock.calls.at(-1)?.[0])).toContain('FALLITO (codice 3)');
    } finally {
      log.mockRestore();
      err.mockRestore();
      for (const l of process.listeners('exit').slice(before)) process.off('exit', l);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('capOf', () => {
  const base = { threshold: 10, orchestrator: 'claude', slot: 2, tetto: 3 };

  it('sopra la soglia: gli slot dinamici, mai oltre il tetto', () => {
    expect(P.capOf({ ...base, left: 50, session: 80, provider: 'claude' })).toBe(2);
    expect(P.capOf({ ...base, slot: 5, left: 50, session: 80, provider: 'claude' })).toBe(3);
    expect(P.capOf({ ...base, slot: 0, left: 50, session: 80, provider: 'claude' })).toBe(0);
  });

  it('la riserva: un task urgente usa uno slot oltre quelli dinamici, mai oltre il tetto', () => {
    expect(P.capOf({ ...base, left: 50, session: 80, provider: 'claude', urgent: true })).toBe(3);
    expect(P.capOf({ ...base, slot: 0, left: 50, session: 80, provider: 'claude', urgent: true })).toBe(1);
    expect(P.capOf({ ...base, slot: 3, left: 50, session: 80, provider: 'claude', urgent: true })).toBe(3);
  });

  it('vicino a 0 %: nessun task nuovo, al più uno in corso, nessuno sul provider dell\'orchestratore', () => {
    expect(P.capOf({ ...base, left: 8, provider: 'argon' })).toBe(0);
    expect(P.capOf({ ...base, left: 8, provider: 'argon', urgent: true })).toBe(0);
    expect(P.capOf({ ...base, left: 8, provider: 'argon', resuming: true })).toBe(1);
    expect(P.capOf({ ...base, left: 50, session: 5, provider: 'gemini', resuming: true })).toBe(1);
    expect(P.capOf({ ...base, left: 50, session: 5, provider: 'claude', resuming: true })).toBe(0);
    expect(P.capOf({ ...base, orchestrator: 'argon', left: 8, provider: 'argon', resuming: true })).toBe(0);
  });

  it('per Argon (senza 5h) conta solo la settimana', () => {
    expect(P.capOf({ ...base, left: 28, session: 2, provider: 'argon' })).toBe(2);
    expect(P.capOf({ ...base, left: 8, session: 100, provider: 'argon', resuming: true })).toBe(1);
    expect(P.capOf({ ...base, orchestrator: 'argon', left: 8, session: 100, provider: 'argon', resuming: true })).toBe(0);
  });
});

describe('gli slot dinamici', () => {
  const NOW = Date.parse('2026-10-30T12:00:00Z');
  const at = (h: number, residuo: number) => ({ t: new Date(NOW - h * 3_600_000).toISOString(), residuo });

  it('il tetto: il più basso tra quello del modello e quello della CLI, senza limiti maxParalleli', () => {
    const providers = { claude: { cmd: 'claude' }, gemini: { cmd: 'agy' }, argon: { cmd: 'agy' } };
    const config = { maxParalleli: 5, providers, limiti: { provider: { claude: 3, agy: 1 }, modello: { claude: 2, gemini: 4 } } };
    expect(P.ceilingOf('claude', config)).toBe(2);
    expect(P.ceilingOf('gemini', config)).toBe(1);
    expect(P.ceilingOf('argon', config)).toBe(1);
    expect(P.ceilingOf('claude', { maxParalleli: 5, providers })).toBe(5);
  });

  it('la previsione: al ritmo degli ultimi giorni, dall\'ultimo reset', () => {
    // 10 % in 10 ore, ne restano 50: altre 50 ore.
    expect(P.forecastEmpty([at(10, 60), at(5, 55), at(0, 50)], NOW)).toBe(new Date(NOW + 50 * 3_600_000).toISOString());
    // Un residuo che risale è un reset: conta solo da lì.
    expect(P.forecastEmpty([at(30, 5), at(20, 100), at(0, 80)], NOW)).toBe(new Date(NOW + 80 * 3_600_000).toISOString());
    // Fermo, o troppo poco da dire: nessuna previsione.
    expect(P.forecastEmpty([at(10, 60), at(0, 60)], NOW)).toBeUndefined();
    expect(P.forecastEmpty([at(0.5, 61), at(0, 60)], NOW)).toBeUndefined();
    expect(P.forecastEmpty([at(0, 60)], NOW)).toBeUndefined();
    // Oltre i giorni della previsione non conta.
    expect(P.forecastEmpty([at(100, 100), at(80, 60), at(0, 60)], NOW, 3)).toBeUndefined();
  });

  it('il reset: dal contatore settimanale o da `resetSettimanale`', () => {
    const contatori = [{ nome: 'session', finestra: '5h', residuo: 10, reset: '2026-10-30T15:00:00Z' }, { nome: 'week', finestra: 'settimana', residuo: 40, reset: '2026-11-05T09:00:00Z' }];
    expect(P.weeklyResetOf({ contatori }, {}, NOW)).toBe('2026-11-05T09:00:00Z');
    const reset = P.weeklyResetOf({}, { resetSettimanale: 'gio 10:00' }, NOW)!;
    expect(new Date(reset).getDay()).toBe(4);
    expect(Date.parse(reset)).toBeGreaterThan(NOW);
    expect(Date.parse(reset) - NOW).toBeLessThanOrEqual(7 * 86_400_000);
    expect(P.weeklyResetOf({}, { resetSettimanale: '' }, NOW)).toBeUndefined();
  });

  it('dopo il reset uno slot in più, prima uno in meno, mai sotto 1 e fino al tetto (T96)', () => {
    const reset = '2026-11-05T09:00:00Z';
    expect(P.nextSlot({ slot: 1, tetto: 3, previsione: '2026-11-06T00:00:00Z', reset })).toBe(2);
    expect(P.nextSlot({ slot: 1, tetto: 3, previsione: undefined, reset })).toBe(2); // non si consuma
    expect(P.nextSlot({ slot: 3, tetto: 3, previsione: '2026-11-06T00:00:00Z', reset })).toBe(3);
    expect(P.nextSlot({ slot: 2, tetto: 3, previsione: '2026-11-01T00:00:00Z', reset })).toBe(1);
    expect(P.nextSlot({ slot: 1, tetto: 3, previsione: '2026-11-01T00:00:00Z', reset })).toBe(1); // non scende mai sotto 1
    expect(P.nextSlot({ slot: 0, tetto: 3, previsione: '2026-11-01T00:00:00Z', reset })).toBe(1); // da 0 risale ad almeno 1
    expect(P.nextSlot({ slot: 4, tetto: 2, previsione: '2026-11-06T00:00:00Z', reset })).toBe(2); // il tetto scende
    expect(P.nextSlot({ slot: 2, tetto: 3, previsione: '2026-11-01T00:00:00Z' })).toBe(2); // senza reset restano
    // Non salgono oltre ciò che il programma chiede.
    expect(P.nextSlot({ slot: 1, tetto: 3, reset, domanda: 1 })).toBe(1);
    expect(P.nextSlot({ slot: 2, tetto: 3, reset, domanda: 0 })).toBe(2);
  });

  it('il programma: eseguibili e bloccati da altri task, non chi aspetta l\'autore', () => {
    const t = (id: string, provider: string, missing?: string[]) => ({ id, title: id, status: 'da fare', deps: missing ?? [], provider, missing });
    const queues = {
      inCorso: [t('T1', 'claude')], pronti: [t('T2', 'claude'), t('T3', 'gemini')],
      bloccati: [t('T4', 'claude', ['T1']), t('T5', 'claude', ['T9']), t('T6', 'gemini', ['T5']), t('T7', 'argon', ['T4'])],
      inAttesa: [t('T9', 'claude')], daIntegrare: [], daApprovare: [], daStimare: [],
    };
    expect(P.demandOf(queues)).toEqual({ claude: 3, gemini: 1, argon: 1 });
  });

  it('a ogni controllo: storia, previsione, reset, e gli slot si muovono al più ogni `usoSecondi`', () => {
    const providers = { claude: { cmd: 'claude', resetSettimanale: 'gio 10:00' } };
    const config = { maxParalleli: 5, usoSecondi: 300, providers, limiti: { modello: { claude: 3 } } };
    const queues = { inCorso: [], pronti: ['T1', 'T2', 'T3'].map((id) => ({ id, title: id, status: 'da fare', deps: [], provider: 'claude' })), bloccati: [], inAttesa: [], daIntegrare: [], daApprovare: [], daStimare: [] };
    const budget: Record<string, Record<string, unknown>> = { claude: { residuo: 90 } };
    P.updateSlots(budget, queues, { config, nowMs: NOW });
    expect(budget.claude).toMatchObject({ slot: 1, tetto: 3, domanda: 3 });
    P.updateSlots(budget, queues, { config, nowMs: NOW + 60_000 });
    expect(budget.claude.slot).toBe(2); // primo spostamento
    P.updateSlots(budget, queues, { config, nowMs: NOW + 120_000 });
    expect(budget.claude.slot).toBe(2); // meno di usoSecondi dopo
    // Consumo forte: 50 % in due ore, la settimana finirebbe prima del reset.
    budget.claude.residuo = 40;
    budget.claude.storia = [{ t: new Date(NOW - 2 * 3_600_000).toISOString(), residuo: 90 }];
    P.updateSlots(budget, queues, { config, nowMs: NOW + 600_000 });
    expect(Date.parse(budget.claude.previsione as string)).toBeLessThan(Date.parse(budget.claude.resetSettimana as string));
    expect(budget.claude.slot).toBe(1);
    expect((budget.claude.storia as unknown[]).length).toBe(2);
    // Un ulteriore controllo prima del reset non porta mai lo slot a zero (T96).
    P.updateSlots(budget, queues, { config, nowMs: NOW + 1_200_000 });
    expect(budget.claude.slot).toBe(1);
  });
});

describe('readOutput', () => {
  const json = { type: 'result', is_error: false, session_id: 'abc-123', total_cost_usd: 0.42, result: 'Fatto il lavoro.\n\nESITO: fatto — test della pipeline\n' };

  it('la riga BROWSER, se c\'è', () => {
    const result = 'ESITO: fatto — il pannello\nBROWSER: da verificare — niente strumenti del browser\n';
    expect(P.readOutput(JSON.stringify({ ...json, result })).browser).toBe('BROWSER: da verificare — niente strumenti del browser');
    expect(P.readOutput(JSON.stringify(json)).browser).toBeUndefined();
  });

  it('il JSON di claude --output-format json', () => {
    expect(P.readOutput(JSON.stringify(json))).toEqual({ session: 'abc-123', cost: 0.42, error: false, result: json.result, outcome: 'ESITO: fatto — test della pipeline' });
  });

  it('il JSON dopo altre righe, anche se l\'ultima è un numero', () => {
    const out = P.readOutput(`avviso su stderr\n${JSON.stringify({ ...json, is_error: true })}\n0\n`);
    expect(out).toMatchObject({ session: 'abc-123', error: true, outcome: 'ESITO: fatto — test della pipeline' });
  });

  it('JSON su più righe', () => {
    expect(P.readOutput(JSON.stringify(json, null, 2)).session).toBe('abc-123');
  });

  it('testo semplice: il risultato è il testo', () => {
    const out = P.readOutput('Niente JSON qui.\nESITO: in attesa — domande in T62.md');
    expect(out).toMatchObject({ session: undefined, cost: undefined, error: false, outcome: 'ESITO: in attesa — domande in T62.md' });
  });
});

// The orchestrator's environment (ADR-0079): what it reads and changes in the backlog, and its own pure parts.
type Orchestra = {
  contextOf(json: unknown): number;
  pickOrchestrator(order: string[], budget: Record<string, { residuo?: number; sessione?: number; fermoFino?: string }>, threshold: number, at?: Date): string | undefined;
  composeTurn(messages: string[], events: { testo: string }[]): string;
  wakes(line: string): boolean;
  shouldRunTurn(messages?: string[], events?: { testo?: string; sveglia?: boolean }[]): boolean;
  compactChat(chatLines?: unknown[], maxItems?: number, maxLen?: number): string[];
  startPage(s: { epoca: number; provider: string }, reason: string, opts?: unknown): string;
};
type Edits = {
  taskBlock(text: string, id: string): string | undefined;
  setPipelineLine(text: string, id: string, change: (i?: { provider?: string; estimate?: number; approved: boolean; priority: number }) => { provider: string; estimate: number; approved: boolean; priority: number }): string;
  nextTaskId(text: string): string;
};

describe('il backlog per l\'orchestratore', () => {
  const text = '## Sezione\n\n### T7 · Uno — `da fare`\n- Fare: qualcosa.\n\n### T8 · Due — `da fare`\n- Pipeline: gemini · stima 3% · priorità 5\n- Fare: altro.\n\n#### T9a · Pezzo — `fatto`\n';
  let E: Edits;
  beforeAll(async () => { E = (await import(/* @vite-ignore */ pathToFileURL(path.resolve(__dirname, '../tools/pipeline/pipeline.mjs')).href)) as Edits; });

  it('il blocco di un task arriva fino al titolo dopo', () => {
    expect(E.taskBlock(text, 'T7')).toBe('### T7 · Uno — `da fare`\n- Fare: qualcosa.\n\n');
    expect(E.taskBlock(text, 'T99')).toBeUndefined();
  });

  it('approva e assegna scrivono la riga Pipeline, sotto il titolo se manca', () => {
    const a = E.setPipelineLine(text, 'T8', (i) => ({ ...i!, provider: i!.provider!, estimate: i!.estimate!, approved: true }));
    expect(a).toContain('- Pipeline: gemini · stima 3% · approvato · priorità 5\n- Fare: altro.');
    const b = E.setPipelineLine(text, 'T7', () => ({ provider: 'argon', estimate: 2, approved: false, priority: 0 }));
    expect(b).toContain('### T7 · Uno — `da fare`\n- Pipeline: argon · stima 2% · priorità 0\n- Fare: qualcosa.');
    expect(() => E.setPipelineLine(text, 'T99', (i) => i as never)).toThrow(/non c'è/);
  });

  it('il prossimo numero libero conta anche i pezzi', () => {
    expect(E.nextTaskId(text)).toBe('T10');
  });
});

// The `step` command (T231, ADR-0128): the table of docs/fasi.md → `- Step:` in the backlog, always on a copy.
describe('gli step nella pipeline (T231)', () => {
  type Steps = {
    parseBacklog(text: string): Task[];
    parseStepTable(text: string): { step: number; tasks: string[] }[];
    setStepLine(text: string, id: string, step: number): string;
    stepCommand(args: string[], opts?: unknown): string[];
    dossierOf(id: string, opts?: unknown): { step?: number; markdown: string };
    assignTask(id: string, a: { provider: string; stima: number }, opts?: unknown): unknown;
  };
  const TABLE = [
    '# Fasi', '',
    '| step | obiettivo | fase | stato | task |',
    '|---|---|---|---|---|',
    '| 1 | Il primo mondo (l\'altro T9, vedi sotto) | I | raggiunto | — |',
    '| 9 | Il 3D | I | raggiunto | T1 T2 T56a T56b |',
    '| 28 | Parole | I | in corso | T3 T4 T5 T43 T77 |',
    '',
    'Testo dopo, con T9.',
  ].join('\n');
  const LOG = [
    '# Backlog', '',
    '### T1 · Finito — `fatto` (`abc1234`)', '- Fare: base.', '',
    '### T2 · Doppio — `fatto` (`abc1235`)', '- Fare: il primo.', '',
    '### T2 · Doppio, il secondo — `fatto` (`abc1236`)', '- Fare: il secondo.', '',
    '### T3 · Pronto — `da fare`', '- Pipeline: gemini · stima 3% · approvato · priorità 50', '- Fare: altro.', '',
    '### T4 · Senza riga — `da fare`', '- Fare: non stimato.', '',
    '### T5 · In attesa — `in attesa`', '- Pipeline: claude · stima 2% · browser · priorità 20', '- Fare: domanda.', '',
    '### T43 · Tra giocatori — spezzato in T43a-T43c', '',
    '### T56 · Il salto — T56a `fatto` (`e5f8099`), T56b `da fare`', '- Pipeline: gemini · stima 5% · priorità 20', '',
    '### T60 · Fuori tabella — `da fare`', '- Fare: nessuno step.', '',
  ].join('\n');
  let S: Steps;
  let repo: string;
  const backlog = () => fs.readFileSync(path.join(repo, 'docs/plans/backlog.md'), 'utf8');
  const opts = () => ({ repo, config: { providers: { claude: {}, gemini: {}, argon: {} }, piani: {} } });
  const task = (id: string) => S.parseBacklog(backlog()).find((t) => t.id === id);

  beforeAll(async () => { S = (await import(/* @vite-ignore */ pathToFileURL(path.resolve(__dirname, '../tools/pipeline/pipeline.mjs')).href)) as unknown as Steps; });
  const sandbox = (table = TABLE, log = LOG) => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'quine-step-'));
    fs.mkdirSync(path.join(repo, 'docs/plans'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'docs/fasi.md'), table);
    fs.writeFileSync(path.join(repo, 'docs/plans/backlog.md'), log);
  };
  afterEach(() => { if (repo) fs.rmSync(repo, { recursive: true, force: true }); });

  it('un task senza step resta valido; un `- Step:` non numerico non è un tag', () => {
    expect(S.parseBacklog(LOG).find((t) => t.id === 'T3')?.step).toBeUndefined();
    const text = '### T7 · Uno — `da fare`\n- Step: 12\n\n### T8 · Due — `da fare`\n- Step: 8.2B\n';
    expect(S.parseBacklog(text).map((t) => t.step)).toEqual([12, undefined]);
  });

  it('il tag va sotto la riga Pipeline, o sotto il titolo; e si sostituisce', () => {
    const a = S.setStepLine(LOG, 'T3', 28);
    expect(a).toContain('priorità 50\n- Step: 28\n- Fare: altro.');
    expect(S.setStepLine(LOG, 'T4', 28)).toContain('`da fare`\n- Step: 28\n- Fare: non stimato.');
    const b = S.setStepLine(a, 'T3', 29);
    expect(b).toContain('- Step: 29\n- Fare: altro.');
    expect(b).not.toContain('- Step: 28');
    expect(() => S.setStepLine(LOG, 'T99', 1)).toThrow(/non c'è/);
  });

  it('la tabella si legge solo nella colonna task, e un errore si dice', () => {
    expect(S.parseStepTable(TABLE)).toEqual([{ step: 1, tasks: [] }, { step: 9, tasks: ['T1', 'T2', 'T56a', 'T56b'] }, { step: 28, tasks: ['T3', 'T4', 'T5', 'T43', 'T77'] }]);
    expect(() => S.parseStepTable(TABLE.replace('T3 T4', 'T1 T4'))).toThrow(/T1 sta in due righe, 9 e 28/);
    expect(() => S.parseStepTable(TABLE.replace('T3 T4', 'T3-T4'))).toThrow(/«T3-T4» non è un id/);
    expect(() => S.parseStepTable('niente')).toThrow(/non c'è la tabella/);
  });

  it('la tabella vera di docs/fasi.md si legge: ogni task in una sola riga', () => {
    const rows = S.parseStepTable(fs.readFileSync(path.resolve(__dirname, '../docs/fasi.md'), 'utf8'));
    expect(rows.find((r) => r.step === 25)?.tasks).toContain('T221');
    expect(rows.find((r) => r.step === 23)?.tasks).not.toContain('T59');
  });

  it('step --da-tabella mette i tag, dice ciò che non torna, e rifatto non cambia nulla', () => {
    sandbox();
    const lines = S.stepCommand(['--da-tabella'], opts());
    expect(lines[0]).toBe('8 task nella tabella, 8 con un tag nuovo o cambiato.');
    expect(lines).toContain('Nella tabella e non nel backlog: T77');
    expect(lines).toContain('Nel backlog e non nella tabella (nessuno step): T60');
    expect(task('T1')?.step).toBe(9);
    expect(task('T3')?.step).toBe(28);
    expect(task('T56b')?.step).toBe(9); // il blocco del padre, condiviso
    expect(task('T60')?.step).toBeUndefined();
    // Due blocchi con un id: il tag va al primo, come dice docs/fasi.md.
    expect(backlog()).toContain('### T2 · Doppio — `fatto` (`abc1235`)\n- Step: 9\n');
    expect(backlog()).toContain('### T2 · Doppio, il secondo — `fatto` (`abc1236`)\n- Fare');
    const once = backlog();
    expect(S.stepCommand(['--da-tabella'], opts())[0]).toContain(', 0 con un tag');
    expect(backlog()).toBe(once);
  });

  it('una tabella sbagliata non scrive nulla', () => {
    sandbox(TABLE.replace('T1 T2 T56a T56b', 'T1 T2 T56a').replace('T3 T4', 'T56b T3 T4'));
    expect(() => S.stepCommand(['--da-tabella'], opts())).toThrow(/pezzi di T56 stanno negli step 9 e 28/);
    expect(backlog()).toBe(LOG);
  });

  it('step <n> Txx… assegna il tag, tutto o niente', () => {
    sandbox();
    expect(S.stepCommand(['31', 'T60', 'T56a'], opts())).toEqual(['Step 31: T60 T56a']);
    expect(task('T60')?.step).toBe(31);
    expect(task('T56b')?.step).toBe(31);
    const before = backlog();
    expect(() => S.stepCommand(['32', 'T60', 'T99'], opts())).toThrow(/T99: non c'è/);
    expect(backlog()).toBe(before);
  });

  it('step <n> elenca i task del suo step', () => {
    sandbox();
    S.stepCommand(['--da-tabella'], opts());
    const lines = S.stepCommand(['28'], opts());
    expect(lines.map((l) => l.split(' · ')[0])).toEqual(['T3', 'T4', 'T5', 'T43']);
    expect(lines[0]).toContain('step 28');
    expect(S.stepCommand(['30'], opts())).toEqual(['Step 30: nessun task con questo tag.']);
  });

  it('step <n> --priorita tocca solo i non finiti e tiene il resto della riga', () => {
    sandbox();
    S.stepCommand(['--da-tabella'], opts());
    expect(S.stepCommand(['28', '--priorita', '1'], opts())).toEqual(['Step 28: priorità 1 a T3 T4 T5']); // T43 è spezzato
    expect(backlog()).toContain('- Pipeline: gemini · stima 3% · approvato · priorità 1\n- Step: 28');
    expect(backlog()).toContain('- Pipeline: claude · stima 2% · browser · priorità 1\n- Step: 28');
    expect(task('T4')?.priority).toBe(1);
    expect(task('T4')?.provider).toBeUndefined();
    expect(backlog()).not.toContain('undefined');
    // Lo step 9: T56b è da fare e condivide la riga con T56a, finito; T1 non ha riga e non ne prende una.
    expect(S.stepCommand(['9', '--priorita', '2'], opts())).toEqual(['Step 9: priorità 2 a T56b']);
    expect(task('T56b')?.priority).toBe(2);
    expect(task('T1')?.priority).toBeUndefined();
  });

  it('il task non stimato con la priorità si assegna e la tiene', () => {
    sandbox();
    S.stepCommand(['--da-tabella'], opts());
    S.stepCommand(['28', '--priorita', '1'], opts());
    S.assignTask('T4', { provider: 'claude', stima: 3 }, { repo });
    expect(task('T4')).toMatchObject({ provider: 'claude', estimate: 3, priority: 1, step: 28 });
  });

  it('il dossier dice lo step', () => {
    sandbox();
    S.stepCommand(['--da-tabella'], opts());
    const d = S.dossierOf('T3', { repo });
    expect(d.step).toBe(28);
    expect(d.markdown).toContain('- step: 28');
    expect(S.dossierOf('T60', { repo }).markdown).not.toContain('- step:');
  });

  it('gli argomenti sbagliati non scrivono', () => {
    sandbox();
    for (const args of [[], ['x'], ['0'], ['28', '--priorita'], ['28', '--priorita', 'alta'], ['28', 'pippo'], ['--da-tabella', '28']]) {
      expect(() => S.stepCommand(args, opts()), args.join(' ')).toThrow(/Uso: step/);
    }
    expect(backlog()).toBe(LOG);
  });
});

describe('orchestra', () => {
  let O: Orchestra;
  beforeAll(async () => { O = (await import(/* @vite-ignore */ pathToFileURL(path.resolve(__dirname, '../tools/pipeline/orchestra.mjs')).href)) as Orchestra; });

  it('il contesto: l\'ultima chiamata del turno di Claude, altrimenti la media', () => {
    expect(O.contextOf({ iterations: [{ input_tokens: 5, cache_read_input_tokens: 1000, output_tokens: 10 }, { input_tokens: 2, cache_read_input_tokens: 90_000, cache_creation_input_tokens: 500, output_tokens: 300 }] })).toBe(90_802);
    expect(O.contextOf({ usage: { input_tokens: 20_000, cache_read_tokens: 100_000 }, num_turns: 4 })).toBe(30_000);
    expect(O.contextOf(undefined)).toBe(0);
  });

  it('l\'orchestratore va sul primo provider dell\'ordine che ha crediti', () => {
    const at = new Date('2026-10-30T10:00:00Z');
    const budget = { claude: { residuo: 50, sessione: 8 }, argon: { residuo: 60, fermoFino: '2026-10-30T12:00:00Z' }, gemini: { residuo: 80 } };
    expect(O.pickOrchestrator(['claude', 'argon', 'gemini'], budget, 10, at)).toBe('gemini');
    expect(O.pickOrchestrator(['claude', 'argon', 'gemini'], { ...budget, claude: { residuo: 50, sessione: 40 } }, 10, at)).toBe('claude');
    expect(O.pickOrchestrator(['argon'], budget, 10, new Date('2026-10-30T13:00:00Z'))).toBe('argon');
    expect(O.pickOrchestrator(['claude'], budget, 10, at)).toBeUndefined();
  });

  it('per Argon (senza 5h) l\'orchestratore si basa sul limite settimanale', () => {
    const at = new Date('2026-10-30T10:00:00Z');
    // Argon con 28% settimanale e senza sessione 5h è sopra la soglia (10%)
    expect(O.pickOrchestrator(['argon'], { argon: { residuo: 28 } }, 10, at)).toBe('argon');
    // Argon sotto la soglia (8%): non è usabile come orchestratore
    expect(O.pickOrchestrator(['argon'], { argon: { residuo: 8 } }, 10, at)).toBeUndefined();
    // Anche se nel budget ci fosse sessione: 100 fittizia, per Argon vale il limite settimanale (8%)
    expect(O.pickOrchestrator(['argon'], { argon: { residuo: 8, sessione: 100 } }, 10, at)).toBeUndefined();
    // Fallback su Gemini se Claude è a 0% e Argon è a 8% (anche con sessione: 100 fittizia)
    const budget = {
      claude: { residuo: 50, sessione: 0 },
      argon: { residuo: 8, sessione: 100 },
      gemini: { residuo: 80, sessione: 100 },
    };
    expect(O.pickOrchestrator(['claude', 'argon', 'gemini'], budget, 10, at)).toBe('gemini');
  });

  it('un turno: prima gli eventi, poi i messaggi dell\'autore', () => {
    expect(O.composeTurn(['ciao'], [{ testo: 'T1: ESITO: fatto' }])).toBe('[eventi della pipeline]\n- T1: ESITO: fatto\n\n[autore] ciao');
    expect(O.composeTurn([], [])).toBe('');
  });

  it('svegliano l\'orchestratore gli esiti e i limiti, non i lanci', () => {
    expect(O.wakes('[t] T1: ESITO: fatto — x')).toBe(true);
    expect(O.wakes('[t] T1: limite di claude, riprendo dopo …')).toBe(true);
    expect(O.wakes('[t] lancio T1 su claude (…)')).toBe(false);
  });

  it('con soli eventi di routine non apre turni (T84)', () => {
    const routine = [
      '[t] lancio T1 su claude (H:/worktree/t1)',
      '[t] riprendo T1 su claude (H:/worktree/t1)',
      '[t] T1: ancora al lavoro (processo 1234), lo seguo',
      '[t] T1: il suo processo non c\'è più, riprende la sua conversazione',
      '[t] T1: claude non può, va su argon',
      '[t] T1: rimesso in coda (riprende la sua conversazione)',
      '[t] task/T1 integrato in 3d; worktree e branch tolti.',
      '[t] tutti fermi per i limiti; riprendo il 2026-10-30T22:00:00.000Z',
      '[t] orchestratore: epoca 2 su claude (avvio)',
      '[t] nota: quadro aggiornato',
    ];
    for (const line of routine) {
      expect(O.wakes(line)).toBe(false);
    }
    const events = routine.map((testo) => ({ testo, sveglia: O.wakes(testo) }));
    // Nessun messaggio dell'autore e soli eventi di routine: non apre turni
    expect(O.shouldRunTurn([], events)).toBe(false);

    // Eventi che chiedono decisioni: svegliano e aprono il turno
    const decisionLines = [
      '[t] T1: ESITO: fatto — completato',
      '[t] T1: ESITO: fallito (codice 1)',
      '[t] T1: ESITO: in attesa — domande in T1.md',
      '[t] T1: fallito (codice 1)',
      '[t] T1: limite di claude, riprendo dopo 2026-10-30T22:00:00.000Z',
      '[t] orchestratore: limite di gemini fino a 2026-10-30T22:00:00.000Z',
      '[t] integra T1: conflitti in kernel.ts; il base è com\'era',
    ];
    for (const line of decisionLines) {
      expect(O.wakes(line)).toBe(true);
      expect(O.shouldRunTurn([], [{ testo: line, sveglia: O.wakes(line) }])).toBe(true);
    }
    // Un messaggio dell'autore apre sempre il turno
    expect(O.shouldRunTurn(['ciao'], events)).toBe(true);
  });

  it('misura del contesto corretta senza raddoppio della cache Gemini (T84)', () => {
    // Claude con iterazioni: prende l'ultima iterazione
    expect(O.contextOf({ iterations: [{ input_tokens: 5, cache_read_input_tokens: 1000, output_tokens: 10 }, { input_tokens: 2, cache_read_input_tokens: 90_000, cache_creation_input_tokens: 500, output_tokens: 300 }] })).toBe(90_802);
    // Anthropic con cache_read_input_tokens separato
    expect(O.contextOf({ usage: { input_tokens: 20_000, cache_read_input_tokens: 100_000 }, num_turns: 4 })).toBe(30_000);
    // Gemini/agy: input_tokens include già la cache (promptTokenCount), non va sommata due volte
    expect(O.contextOf({ usage: { input_tokens: 570_000, cache_read_tokens: 550_000 } })).toBe(570_000);
    expect(O.contextOf({ usage: { input_tokens: 100_000, cache_read_tokens: 80_000 }, num_turns: 1 })).toBe(100_000);
    // Valore nullo o vuoto
    expect(O.contextOf(undefined)).toBe(0);
  });

  it('avvio.md d\'esempio è compatto e sotto il tetto di dimensione (T84)', async () => {
    const fsMod = await import('node:fs');
    const rawChat = [
      { t: '12:00', chi: 'autore', testo: 'puoi controllare T83?' },
      { t: '12:01', chi: 'orchestratore', provider: 'claude', testo: 'controllo subito il dossier di T83 e lo stato.' },
      { t: '12:02', chi: 'orchestratore', provider: 'claude', testo: 'quadro aggiornato' },
      { t: '12:03', chi: 'orchestratore', provider: 'claude', testo: 'quadro aggiornato' }, // duplicato/boilerplate
      { t: '12:04', chi: 'pipeline', testo: 'T83: ESITO: fatto' },
      { t: '12:05', chi: 'orchestratore', provider: 'claude', testo: 'T83 finito, integro e passo a T84.'.repeat(20) }, // lungo, da troncare
    ];
    const page = O.startPage({ epoca: 3, provider: 'gemini' }, 'contesto a metà finestra', {
      chat: rawChat,
      maxChat: 8,
      maxLen: 200,
      quadro: path.resolve(__dirname, '../docs/pipeline/quadro.md'),
    });
    // Niente indice intero dei task
    expect(page).not.toContain('## Indice dei task');
    expect(page).not.toContain('node tools/pipeline/pipeline.mjs indice');
    // Chat troncata e senza messaggi ripetuti dell'orchestratore
    expect(page).toContain('puoi controllare T83?');
    expect(page).not.toContain('quadro aggiornato');
    // Sotto il tetto di dimensione: oltre al quadro (che l'orchestratore tiene e cresce), al più 2000 caratteri
    const quadro = fsMod.readFileSync(path.resolve(__dirname, '../docs/pipeline/quadro.md'), 'utf8').trim();
    expect(page.length - quadro.length).toBeLessThan(2000);
    expect(Buffer.byteLength(page, 'utf8') - Buffer.byteLength(quadro, 'utf8')).toBeLessThan(2500);
  });
});

type WebModule = {
  handleApi(method: string, rawUrl: string, body?: unknown, opts?: { repo?: string; stateDir?: string }): { status: number; data: Record<string, any> };
  parseQuestionFile(id: string, text: string): { id: string; items: { numero: number; domanda: string; risposta: string }[]; answered: boolean; stato?: string };
  applyAnswersToMarkdown(text: string, risposte: Record<string, string>): string;
  renderHtml(): string;
  startWebServer(opts?: { port?: number; fallbackPort?: boolean; repo?: string; stateDir?: string }): Promise<{ server: import('node:http').Server; port: number }>;
};

describe('interfaccia web della pipeline (T69)', () => {
  let W: WebModule;
  let fsMod: typeof import('node:fs');
  let osMod: typeof import('node:os');
  let tmpRepo: string;

  beforeAll(async () => {
    fsMod = await import('node:fs');
    osMod = await import('node:os');
    W = (await import(/* @vite-ignore */ pathToFileURL(path.resolve(__dirname, '../tools/pipeline/web.mjs')).href)) as WebModule;
  });

  const makeSandbox = () => {
    tmpRepo = fsMod.mkdtempSync(path.join(osMod.tmpdir(), 'quine-pipe-web-'));
    fsMod.mkdirSync(path.join(tmpRepo, 'docs', 'plans'), { recursive: true });
    fsMod.mkdirSync(path.join(tmpRepo, 'docs', 'pipeline', 'domande'), { recursive: true });
    fsMod.mkdirSync(path.join(tmpRepo, 'docs', 'userchats'), { recursive: true });
    fsMod.mkdirSync(path.join(tmpRepo, '.pipeline', 'orchestra'), { recursive: true });
    fsMod.mkdirSync(path.join(tmpRepo, '.pipeline', 'log'), { recursive: true });
    fsMod.mkdirSync(path.join(tmpRepo, '.pipeline', 'conversazioni'), { recursive: true });

    fsMod.writeFileSync(path.join(tmpRepo, 'docs', 'plans', 'backlog.md'), [
      '# Backlog',
      '',
      '### T1 · Base fatta — `fatto` (`111aaaa`)',
      '- Fare: base.',
      '',
      '### T2 · In corso adesso — `in corso` (dipende da T1)',
      '- Pipeline: claude · stima 4% · approvato · priorità 1',
      '- Fare: lavoro attivo.',
      '',
      '### T3 · Pronto da approvare — `da fare` (dipende da T1)',
      '- Pipeline: argon · stima 5% · priorità 10',
      '- Fare: aspetta approvazione.',
      '',
      '### T4 · Da stimare — `da fare`',
      '- Fare: senza riga pipeline.',
      '',
      '### T5 · In attesa di risposta — `in attesa`',
      '- Pipeline: gemini · stima 3% · approvato · priorità 20',
      '- Fare: aspetta domande.',
      '',
      '### T6 · Bloccato — `da fare` (dipende da T3)',
      '- Pipeline: claude · stima 2% · approvato · priorità 30',
      '- Fare: aspetta T3.',
      '',
    ].join('\n'));

    fsMod.writeFileSync(path.join(tmpRepo, 'docs', 'pipeline', 'domande', 'T5.md'), [
      '# T5 · Domande',
      '',
      '1. **Quale opzione scegli?** Opzione A o B.',
      '   Risposta: ',
      '2. **Confermi?** Sì o no.',
      '   Risposta: ',
      '',
    ].join('\n'));

    fsMod.writeFileSync(path.join(tmpRepo, 'docs', 'userchats', 'to-do.md'), '# Modifiche da fare\n\n');
    fsMod.writeFileSync(path.join(tmpRepo, 'docs', 'pipeline', 'quadro.md'), '# Il quadro\n\nTutto sotto controllo.\n');
    fsMod.writeFileSync(path.join(tmpRepo, 'docs', 'pipeline', 'consumi.jsonl'),
      JSON.stringify({ task: 'T1', provider: 'claude', stima: 3, prima: { settimana: 90, sessione: 80 }, dopo: { settimana: 87, sessione: 70 }, costoUsd: 1.25, minuti: 6, tentativi: 1, esito: 'ESITO: fatto — base', data: '2026-10-30T01:00:00Z' }) + '\n');

    fsMod.writeFileSync(path.join(tmpRepo, '.pipeline', 'esecuzioni.json'), JSON.stringify({
      T2: { id: 'T2', provider: 'claude', stima: 4, tentativi: 1, stato: 'in corso', sessione: 'sess-t2', dir: tmpRepo },
    }, null, 2));
    fsMod.writeFileSync(path.join(tmpRepo, '.pipeline', 'budget.json'), JSON.stringify({
      claude: { residuo: 75, sessione: 60, letto: '2026-10-30T03:00:00Z', contatori: [{ nome: 'session', finestra: '5h', residuo: 60 }] },
      argon: { residuo: 88, sessione: 100 },
      gemini: { residuo: 92, sessione: 100 },
    }, null, 2));
    fsMod.writeFileSync(path.join(tmpRepo, '.pipeline', 'log', 'T2.1.log'),
      JSON.stringify({ session_id: 'sess-t2', result: 'Sto lavorando su T2.\nESITO: fatto — T2 completato' }) + '\n');
    fsMod.writeFileSync(path.join(tmpRepo, '.pipeline', 'conversazioni', 'T2.jsonl'), [
      JSON.stringify({ type: 'user', timestamp: '2026-10-30T03:01:00Z', message: { role: 'user', content: 'Lavora su T2. Regole inviolabili in AGENTS.md.' } }),
      JSON.stringify({ type: 'assistant', timestamp: '2026-10-30T03:01:05Z', message: { role: 'assistant', content: [{ type: 'thinking', thinking: 'Controllo i file' }, { type: 'tool_use', name: 'Read', input: { file_path: 'AGENTS.md' } }, { type: 'text', text: 'Ho letto AGENTS.md e procedo.' }] } }),
    ].join('\n') + '\n');

    return { repo: tmpRepo };
  };

  afterEach(() => {
    if (tmpRepo && fsMod.existsSync(tmpRepo)) {
      fsMod.rmSync(tmpRepo, { recursive: true, force: true });
    }
  });

  it('GET /api/stato restituisce lavagne, tabella dei task, budget, consumi, domande e to-do', () => {
    const opts = makeSandbox();
    const res = W.handleApi('GET', '/api/stato', {}, opts);
    expect(res.status).toBe(200);
    expect(res.data.code.inCorso.map((t: any) => t.id)).toEqual(['T2']);
    expect(res.data.code.daApprovare.map((t: any) => t.id)).toEqual(['T3']);
    expect(res.data.code.daStimare.map((t: any) => t.id)).toEqual(['T4']);
    expect(res.data.code.inAttesa.map((t: any) => t.id)).toEqual(['T5']);
    expect(res.data.code.bloccati.map((t: any) => t.id)).toEqual(['T6']);
    expect(res.data.consumi).toHaveLength(1);
    expect(res.data.domande[0]).toMatchObject({ id: 'T5', answered: false });
    expect(W.renderHtml()).toContain('QUINE42 · Pipeline Agentica');
  });

  it('POST /api/assegna e POST /api/approva aggiornano il backlog e le code di PIANO.md', () => {
    const opts = makeSandbox();
    expect(W.handleApi('POST', '/api/assegna', { id: 'T4', provider: 'argon', stima: 6, priorita: 5, approva: false }, opts).status).toBe(200);
    let st = W.handleApi('GET', '/api/stato', {}, opts).data;
    expect(st.code.daApprovare.map((t: any) => t.id).sort()).toEqual(['T3', 'T4']);

    expect(W.handleApi('POST', '/api/approva', { ids: ['T3', 'T4'] }, opts).status).toBe(200);
    st = W.handleApi('GET', '/api/stato', {}, opts).data;
    expect(st.code.pronti.map((t: any) => t.id)).toEqual(['T4', 'T3']); // p5 before p10
    const piano = fsMod.readFileSync(path.join(tmpRepo, 'docs', 'pipeline', 'PIANO.md'), 'utf8');
    expect(piano).toContain('**T4**');
  });

  it('POST /api/interrompi e POST /api/riprendi fermano e rimettono in coda un task', () => {
    const opts = makeSandbox();
    const intRes = W.handleApi('POST', '/api/interrompi', { ids: ['T2'] }, opts);
    expect(intRes.status).toBe(200);
    expect(intRes.data.interrotti).toEqual(['T2']);

    let st = W.handleApi('GET', '/api/stato', {}, opts).data;
    expect(st.tasks.find((t: any) => t.id === 'T2').esecuzione.stato).toBe('interrotto');

    const resRes = W.handleApi('POST', '/api/riprendi', { ids: ['T2'] }, opts);
    expect(resRes.status).toBe(200);
    expect(resRes.data.ripresi).toEqual(['T2']);

    st = W.handleApi('GET', '/api/stato', {}, opts).data;
    expect(st.tasks.find((t: any) => t.id === 'T2').esecuzione.stato).toBe('sospeso');
  });

  it('GET /api/task/:id restituisce il dossier, il log e la conversazione dal vivo', () => {
    const opts = makeSandbox();
    const res = W.handleApi('GET', '/api/task/T2', {}, opts);
    expect(res.status).toBe(200);
    expect(res.data.dossier.markdown).toContain('# Dossier di T2');
    expect(res.data.dossier.deps).toEqual(['T1']);
    expect(res.data.traccia.agents).toBe(true);
    expect(res.data.traccia.conversazione.map((c: any) => c.ruolo)).toEqual(['utente', 'pensiero', 'strumento', 'agente']);
    expect(res.data.traccia.conversazione[2]).toMatchObject({ nome: 'Read', argomenti: 'AGENTS.md' });
  });

  it('POST /api/chat, POST /api/domande/:id e POST /api/todo scrivono nella coda e nei file reali', () => {
    const opts = makeSandbox();
    const chatRes = W.handleApi('POST', '/api/chat', { testo: 'Stato dei lavori?' }, opts);
    expect(chatRes.status).toBe(200);
    expect(chatRes.data.inCoda).toHaveLength(1);
    expect(chatRes.data.inCoda[0].testo).toBe('Stato dei lavori?');

    const domRes = W.handleApi('POST', '/api/domande/T5', { risposte: { 1: 'Opzione A', 2: 'Sì, confermo' }, avvisa: true }, opts);
    expect(domRes.status).toBe(200);
    expect(domRes.data.parsed.answered).toBe(true);
    const savedDom = fsMod.readFileSync(path.join(tmpRepo, 'docs', 'pipeline', 'domande', 'T5.md'), 'utf8');
    expect(savedDom).toContain('Risposta: Opzione A');
    expect(savedDom).toContain('Risposta: Sì, confermo');

    const todoRes = W.handleApi('POST', '/api/todo', {
      aggiungi: { titolo: 'Nuovo strumento', testo: 'Descrizione', provider: 'Antigravity', dipende: 'T1' },
      avvisa: false,
    }, opts);
    expect(todoRes.status).toBe(200);
    expect(todoRes.data.todo).toContain('## Nuovo strumento');
    expect(todoRes.data.todo).toContain('> Provider proposto: Antigravity');

    const st = W.handleApi('GET', '/api/stato', {}, opts).data;
    expect(st.orchestratore.inCoda).toHaveLength(2); // chat message + domande notification
  });

  describe('lo stato delle domande (T208)', () => {
    const answered = (text: string) => W.parseQuestionFile('T9', text).answered;

    it('la riga in testa decide, anche contro ciò che sembra il file', () => {
      expect(W.parseQuestionFile('T9', '# T9\n\nStato: aperta\n\n## Domanda\nA o B?\n\n## Risposta\nA\n')).toMatchObject({ answered: false, stato: 'aperta' });
      expect(W.parseQuestionFile('T9', '# T9\n\nStato: chiusa\n\nDomanda in forma libera, risolta a parole.\n')).toMatchObject({ answered: true, stato: 'chiusa' });
      expect(W.parseQuestionFile('T9', '# T9\r\n\r\nStato: chiusa\r\n\r\n**Risposta:**\r\n').stato).toBe('chiusa');
    });

    it('la riga conta solo in testa: citata nel testo o sconosciuta non decide', () => {
      expect(W.parseQuestionFile('T9', '# T9\n\nUn testo.\n\nStato: chiusa\n')).toMatchObject({ answered: false, stato: undefined });
      expect(W.parseQuestionFile('T9', '# T9\n\nStato: boh\n')).toMatchObject({ answered: false, stato: undefined });
    });

    it("senza riga una risposta vuota è vuota: mai oltre l'a capo, e ** non è una risposta", () => {
      expect(answered('# T9\n\nDomanda?\n\n**Risposta:**\n')).toBe(false);
      expect(answered('# T9\n\nDomanda?\n\n**Risposta:**\n\nAltro testo sotto.\n')).toBe(false);
      expect(answered('# T9\n\nDomanda?\n\nRisposta:\nAltro testo sotto.\n')).toBe(false);
      expect(answered('# T9\n\nUna?\n\n**Risposta:** sì\n\nDue?\n\n**Risposta:**\n')).toBe(false);
      expect(answered('# T9\n\nUna?\n\n**Risposta:** sì\n\nDue?\n\n**Risposta**: no\n')).toBe(true);
      expect(answered('# T9\n\nDomanda?\n\nRisposta: sì\n')).toBe(true);
      expect(answered('# T9\n\nDomanda?\n\n## Risposta\n\n## Note\nniente\n')).toBe(false);
      expect(answered('# T9\n\nDomanda?\n\n## Risposta\nsì\n')).toBe(true);
      expect(answered('# T9\n\n## Domanda\nA o B?\n\n## Risposta\n**\n')).toBe(false);
    });

    it('senza riga le domande numerate leggono anche **Risposta:**, e il salvataggio ci scrive', () => {
      const text = '# T9\n\n1. **Prima?**\n   Risposta:\n   testo che non è una risposta\n2. **Seconda?**\n**Risposta:**\n';
      expect(W.parseQuestionFile('T9', text).items.map((i) => i.risposta)).toEqual(['', '']);
      const saved = W.applyAnswersToMarkdown(text, { 1: 'uno', 2: 'due' });
      expect(saved).toContain('   Risposta: uno\n');
      expect(saved).toContain('**Risposta:** due\n');
      expect(W.parseQuestionFile('T9', saved).items.map((i) => i.risposta)).toEqual(['uno', 'due']);
    });

    it('la forma libera senza riga resta da rispondere', () => {
      expect(W.parseQuestionFile('T9', '# T9\n\nDeciso a parole: si fa così.\n')).toMatchObject({ items: [], answered: false, stato: undefined });
    });

    it('/api/stato conta solo le aperte e le mette per prime, anche se il task è in attesa', () => {
      const opts = makeSandbox();
      const dir = path.join(tmpRepo, 'docs', 'pipeline', 'domande');
      fsMod.writeFileSync(path.join(dir, 'T1.md'), '# T1\n\nStato: chiusa\n\nRisolta a parole.\n');
      fsMod.writeFileSync(path.join(dir, 'T2.md'), '# T2\n\nStato: aperta\n\n**Risposta:**\n');
      fsMod.writeFileSync(path.join(dir, 'T5.md'), '# T5\n\nStato: chiusa\n\n**Risposta:**\n'); // T5 is `in attesa` in the backlog
      fsMod.writeFileSync(path.join(dir, 'T6.md'), '# T6\n\n**Risposta:**\n');
      const st = W.handleApi('GET', '/api/stato', {}, opts).data;
      expect(st.domande.map((d: any) => d.id)).toEqual(['T2', 'T6', 'T1', 'T5']);
      expect(st.domande.map((d: any) => d.stato)).toEqual(['aperta', undefined, 'chiusa', 'chiusa']);
      expect(st.domandeAperte).toBe(2);
    });

    it('la pagina scrive il conteggio del server e nomina lo stato della riga', () => {
      const html = W.renderHtml();
      expect(html).toContain("getElementById('count-domande').textContent = s.domandeAperte");
      expect(html).toContain("d.stato ?? (d.answered ? 'risposto' : 'da rispondere')");
    });

    it('POST /api/domande non toglie la riga e non chiude la domanda', () => {
      const opts = makeSandbox();
      const file = path.join(tmpRepo, 'docs', 'pipeline', 'domande', 'T5.md');
      const numbered = '# T5\n\nStato: aperta\n\n1. **Prima?**\n   Risposta: \n';
      fsMod.writeFileSync(file, numbered);
      const res = W.handleApi('POST', '/api/domande/T5', { risposte: { 1: 'sì' } }, opts);
      expect(res.data.parsed).toMatchObject({ answered: false, stato: 'aperta' });
      expect(fsMod.readFileSync(file, 'utf8')).toContain('Stato: aperta\n');
      expect(fsMod.readFileSync(file, 'utf8')).toContain('Risposta: sì\n');

      const section = '# T5\n\nStato: aperta\n\n## Domanda\nA o B?\n\n## Risposta\nvecchia\n';
      W.handleApi('POST', '/api/domande/T5', { content: section, risposte: { 1: 'nuova' } }, opts);
      expect(fsMod.readFileSync(file, 'utf8')).toBe('# T5\n\nStato: aperta\n\n## Domanda\nA o B?\n\n## Risposta\nnuova\n');
    });
  });

  it('POST /api/budget e POST /api/orchestratore aggiornano budget.json e orchestratore.json', () => {
    const opts = makeSandbox();
    expect(W.handleApi('POST', '/api/budget', { provider: 'claude', residuo: 42 }, opts).status).toBe(200);
    expect(W.handleApi('POST', '/api/budget', { provider: 'argon', residuo: 25 }, opts).status).toBe(200);
    expect(W.handleApi('POST', '/api/orchestratore', { provider: 'argon' }, opts).status).toBe(200);

    const st = W.handleApi('GET', '/api/stato', {}, opts).data;
    expect(st.budget.claude.residuo).toBe(42);
    expect(st.budget.argon.residuo).toBe(25);
    expect(st.budget.argon.sessione).toBe(25);
    expect(st.orchestratore.provider).toBe('argon');
  });

  it('legge la conversazione dal vivo anche nel formato transcript.jsonl di Antigravity e serve HTTP su porta effimera', async () => {
    const opts = makeSandbox();
    const runs = JSON.parse(fsMod.readFileSync(path.join(tmpRepo, '.pipeline', 'esecuzioni.json'), 'utf8'));
    runs.T3 = { id: 'T3', provider: 'argon', stima: 5, tentativi: 1, stato: 'in corso' };
    fsMod.writeFileSync(path.join(tmpRepo, '.pipeline', 'esecuzioni.json'), JSON.stringify(runs, null, 2));
    fsMod.writeFileSync(path.join(tmpRepo, '.pipeline', 'conversazioni', 'T3.jsonl'), [
      JSON.stringify({ step_index: 0, type: 'USER_INPUT', created_at: '2026-10-30T04:00:00Z', content: 'Esegui T3' }),
      JSON.stringify({ step_index: 1, type: 'PLANNER_RESPONSE', created_at: '2026-10-30T04:00:05Z', thinking: 'Leggo AGENTS.md', tool_calls: [{ name: 'read_file', args: { Path: 'H:/projects/rune/AGENTS.md' } }], content: 'Fatto.' }),
    ].join('\n') + '\n');

    const { server, port } = await W.startWebServer({ port: 0, ...opts });
    try {
      const htmlRes = await fetch(`http://127.0.0.1:${port}/`);
      expect(htmlRes.status).toBe(200);
      expect(await htmlRes.text()).toContain('Lavagne &amp; Chat');

      const taskRes = await fetch(`http://127.0.0.1:${port}/api/task/T3`);
      expect(taskRes.status).toBe(200);
      const taskData = await taskRes.json();
      expect(taskData.traccia.agents).toBe(true);
      expect(taskData.traccia.conversazione.map((c: any) => c.ruolo)).toEqual(['utente', 'pensiero', 'strumento', 'agente']);
      expect(taskData.traccia.conversazione[2]).toMatchObject({ nome: 'read_file', argomenti: 'H:/projects/rune/AGENTS.md' });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('POST /api/config cambia piani e «Può orchestrare» sul file e in memoria (ADR-0119)', () => {
    const sandbox = makeSandbox();
    const real = JSON.parse(fsMod.readFileSync(path.resolve(__dirname, '../tools/pipeline/config.json'), 'utf8'));
    const configFile = path.join(tmpRepo, 'config.json');
    fsMod.writeFileSync(configFile, JSON.stringify(real));
    const config = structuredClone(real);
    const opts = { ...sandbox, config, configFile };

    const start = W.handleApi('GET', '/api/stato', {}, opts).data;
    expect(start.config.abbonamenti).toEqual({ claude: 'max5x', google: 'pro' });
    expect(start.config.piani.claude).toEqual(['pro', 'max5x', 'max20x', 'nessuno']);
    expect(start.config.orchestrabili).toEqual(['claude', 'gemini', 'argon']);
    expect(start.config.alternative).toBeUndefined();

    // Da Ultra a Pro Argon resta acceso (T305).
    expect(W.handleApi('POST', '/api/config', { abbonamenti: { google: 'ultra' } }, opts).status).toBe(200);
    const plan = W.handleApi('POST', '/api/config', { abbonamenti: { google: 'pro' } }, opts);
    expect(plan.status).toBe(200);
    expect(JSON.parse(fsMod.readFileSync(configFile, 'utf8')).abbonamenti).toEqual({ claude: 'max5x', google: 'pro' });
    const pro = W.handleApi('GET', '/api/stato', {}, opts).data;
    expect(pro.config.abilitati).toContain('argon');
    expect(pro.config.orchestrabili).toEqual(['claude', 'gemini', 'argon']);
    // Senza abbonamento Google Argon esce dal piano: non è più disponibile, né per orchestrare.
    expect(W.handleApi('POST', '/api/config', { abbonamenti: { google: 'nessuno' } }, opts).status).toBe(200);
    const after = W.handleApi('GET', '/api/stato', {}, opts).data;
    expect(after.config.abilitati).not.toContain('argon');
    expect(after.config.orchestrabili).toEqual(['claude']);
    expect(W.handleApi('POST', '/api/orchestratore', { provider: 'argon' }, opts).status).toBe(400);

    const off = W.handleApi('POST', '/api/config', { orchestrabile: { gemini: false, fable: true } }, opts);
    expect(off.data.orchestrabili).toEqual(['claude', 'fable']); // Google è a «nessuno»: gemini è comunque fuori
    const saved = JSON.parse(fsMod.readFileSync(configFile, 'utf8'));
    expect(saved.providers.gemini.orchestrabile).toBe(false);
    expect(saved.providers.fable.orchestrabile).toBe(true);

    // Ciò che non esiste viene rifiutato e non scrive nulla.
    expect(W.handleApi('POST', '/api/config', { abbonamenti: { claude: 'gratis' } }, opts).status).toBe(400);
    expect(W.handleApi('POST', '/api/config', { abbonamenti: { altro: 'pro' } }, opts).status).toBe(400);
    expect(W.handleApi('POST', '/api/config', { orchestrabile: { gemini: 'sì' } }, opts).status).toBe(400);
    expect(JSON.parse(fsMod.readFileSync(configFile, 'utf8'))).toEqual(saved);
  });

  it('la pagina ha i selettori dei piani, la casella e il menu dinamico (ADR-0119)', () => {
    const html = W.renderHtml();
    expect(html).toContain('plan-selectors');
    expect(html).toContain('Può orchestrare');
    expect(html).toContain('/api/config');
    expect(html).toContain('s.config.orchestrabili.map');
    expect(/<select id="orch-switch"[^>]*>\s*<option value="">Passa a…<\/option>\s*<\/select>/.test(html)).toBe(true);
  });

  it('renderHtml serve uno script inline sintatticamente valido senza errori di regex (T81)', () => {
    const html = W.renderHtml();
    const scriptMatch = /<script>([\s\S]*?)<\/script>/i.exec(html);
    expect(scriptMatch).not.toBeNull();
    const script = scriptMatch![1];
    expect(() => new Function(script)).not.toThrow();
  });

  it('il campo step arriva alla pagina: nello stato, nella tabella e sulle carte (T231)', () => {
    const opts = makeSandbox();
    const backlog = path.join(tmpRepo, 'docs', 'plans', 'backlog.md');
    fsMod.writeFileSync(backlog, fsMod.readFileSync(backlog, 'utf8').replace('- Fare: aspetta approvazione.', '- Step: 28\n- Fare: aspetta approvazione.'));
    const tasks = W.handleApi('GET', '/api/stato', {}, opts).data.tasks as Task[];
    expect(tasks.find((t) => t.id === 'T3')?.step).toBe(28);
    expect(tasks.find((t) => t.id === 'T4')?.step).toBeUndefined();
    const html = W.renderHtml();
    expect(html).toContain('<th>Step</th>');
    expect(html).toContain("<td>${t.step ?? '—'}</td>");
    expect(html).toContain('stepStyle(t.step)'); // the tile's step label, with its colour (T304)
    expect(html).toContain('step ${esc(t.step)}');
  });

  it('assignTask impedisce l\'assegnazione a gemini o argon di un task con verifica nel browser (T87)', () => {
    const opts = makeSandbox();
    fsMod.appendFileSync(path.join(tmpRepo, 'docs', 'plans', 'backlog.md'), [
      '',
      '### T99 · Task con browser — `da fare`',
      '- Fare: correggi la vista',
      '- Fatto quando: verificare nel browser con ?dev',
      '',
      '### T99b · Task con Quando è fatto — `da fare`',
      '- Cosa fare: nel turno browser servi le pagine',
      '- Quando è fatto: screenshot di ogni pagina; typecheck verde.',
      '',
    ].join('\n'));
    const badRes = W.handleApi('POST', '/api/assegna', { id: 'T99', provider: 'gemini', stima: 2, approva: false }, opts);
    expect(badRes.status).toBe(400);
    expect(badRes.data.error).toMatch(/richiede verifica nel browser/);
    expect(W.handleApi('POST', '/api/assegna', { id: 'T99', provider: 'claude', stima: 2, approva: false }, opts).status).toBe(200);

    const badRes2 = W.handleApi('POST', '/api/assegna', { id: 'T99b', provider: 'gemini', stima: 3, approva: false }, opts);
    expect(badRes2.status).toBe(400);
    expect(badRes2.data.error).toMatch(/richiede verifica nel browser/);
    expect(W.handleApi('POST', '/api/assegna', { id: 'T99b', provider: 'claude', stima: 3, approva: false }, opts).status).toBe(200);
  });
});


// The turns of the heavy operations (ADR-0088): one browser verification and one full test suite at a time.
type Turns = {
  tryTurn(kind: string, me: { chi: string; pid: number; comando: string; arrivo?: number }, o: { dir: string; nowMs?: number; isAlive?: (pid: number) => boolean }): { taken: boolean; holder?: { chi: string; pid: number }; queued?: boolean };
  leaveTurn(kind: string, pid: number, o: { dir: string }): void;
  coveredBy(kind: string, me: { chi: string }, o: { held?: string; dir: string; isAlive?: (pid: number) => boolean }): boolean;
  holderOf(kind: string, o: { dir: string; nowMs?: number; isAlive?: (pid: number) => boolean; minutes?: number }): { chi: string; pid: number; dal: string } | undefined;
  holdBack(t: { needsBrowser?: boolean }, live: { needsBrowser?: boolean }[], o?: { resuming?: boolean; lastLaunch?: number; nowMs?: number; minutes?: number }): string | undefined;
};

describe('i turni delle operazioni pesanti (T83)', () => {
  let T: Turns;
  let fsMod: typeof import('node:fs');
  let osMod: typeof import('node:os');
  let dir: string;
  const living = new Set<number>();
  const isAlive = (pid: number) => living.has(pid);
  const me = (pid: number, arrivo: number) => ({ chi: `T${pid}`, pid, comando: 'npm test', arrivo });

  beforeAll(async () => {
    fsMod = await import('node:fs');
    osMod = await import('node:os');
    T = (await import(/* @vite-ignore */ pathToFileURL(path.resolve(__dirname, '../tools/pipeline/pipeline.mjs')).href)) as Turns;
  });
  const fresh = () => { dir = fsMod.mkdtempSync(path.join(osMod.tmpdir(), 'quine-turni-')); living.clear(); };

  it('uno alla volta, gli altri in coda nell\'ordine d\'arrivo', () => {
    fresh();
    [1, 2, 3].forEach((p) => living.add(p));
    expect(T.tryTurn('test', me(1, 100), { dir, isAlive }).taken).toBe(true);
    expect(T.tryTurn('test', me(3, 300), { dir, isAlive })).toMatchObject({ taken: false, holder: { chi: 'T1' } });
    expect(T.tryTurn('test', me(2, 200), { dir, isAlive }).taken).toBe(false);
    T.leaveTurn('test', 1, { dir });
    // Il 3 ha chiesto per primo un nuovo tentativo, ma il 2 è arrivato prima.
    expect(T.tryTurn('test', me(3, 300), { dir, isAlive })).toMatchObject({ taken: false, queued: true, holder: { chi: 'T2' } });
    expect(T.tryTurn('test', me(2, 200), { dir, isAlive }).taken).toBe(true);
    T.leaveTurn('test', 2, { dir });
    expect(T.tryTurn('test', me(3, 300), { dir, isAlive }).taken).toBe(true);
  });

  it('i turni sono indipendenti: il browser non aspetta i test', () => {
    fresh();
    [1, 2].forEach((p) => living.add(p));
    expect(T.tryTurn('test', me(1, 100), { dir, isAlive }).taken).toBe(true);
    expect(T.tryTurn('browser', me(2, 200), { dir, isAlive }).taken).toBe(true);
  });

  it('chi è morto o lo tiene da troppo non lo tiene più, e chi è morto in coda non blocca', () => {
    fresh();
    [1, 2, 3].forEach((p) => living.add(p));
    const t0 = Date.parse('2026-10-30T12:00:00Z');
    expect(T.tryTurn('browser', me(1, 100), { dir, isAlive, nowMs: t0 }).taken).toBe(true);
    expect(T.tryTurn('browser', me(2, 200), { dir, isAlive, nowMs: t0 }).taken).toBe(false);
    expect(T.tryTurn('browser', me(3, 300), { dir, isAlive, nowMs: t0 }).taken).toBe(false);
    living.delete(1); // il task 1 è stato ucciso senza lasciare il turno
    living.delete(2); // il 2 ha smesso di aspettare
    expect(T.holderOf('browser', { dir, isAlive })).toBeUndefined();
    expect(T.tryTurn('browser', me(3, 300), { dir, isAlive, nowMs: t0 }).taken).toBe(true);
    // Oltre il limite (45 minuti per il browser) il turno è abbandonato.
    living.add(4);
    expect(T.holderOf('browser', { dir, isAlive, nowMs: t0 + 10 * 60_000 })).toMatchObject({ chi: 'T3' });
    expect(T.tryTurn('browser', me(4, 400), { dir, isAlive, nowMs: t0 + 46 * 60_000 }).taken).toBe(true);
  });

  it('solo chi lo tiene lo lascia', () => {
    fresh();
    [1, 2].forEach((p) => living.add(p));
    T.tryTurn('test', me(1, 100), { dir, isAlive });
    T.leaveTurn('test', 2, { dir });
    expect(T.holderOf('test', { dir, isAlive })).toMatchObject({ chi: 'T1' });
  });

  it('la pipeline non lancia insieme due task col browser e distanzia i lanci nuovi', () => {
    const NOW = Date.parse('2026-10-30T12:00:00Z');
    const o = { nowMs: NOW, minutes: 10 };
    expect(T.holdBack({ needsBrowser: true }, [{ needsBrowser: true }], { ...o, lastLaunch: NOW - 3_600_000 })).toMatch(/browser/);
    expect(T.holdBack({ needsBrowser: true }, [{ needsBrowser: true }], { ...o, resuming: true })).toMatch(/browser/);
    expect(T.holdBack({ needsBrowser: true }, [{ needsBrowser: false }], { ...o, lastLaunch: NOW - 3_600_000 })).toBeUndefined();
    expect(T.holdBack({}, [{}], { ...o, lastLaunch: NOW - 5 * 60_000 })).toMatch(/10 minuti/);
    expect(T.holdBack({}, [{}], { ...o, lastLaunch: NOW - 5 * 60_000, resuming: true })).toBeUndefined();
    expect(T.holdBack({}, [], { ...o, lastLaunch: NOW - 60_000 })).toBeUndefined(); // niente in corso: si parte
  });

  it('turno test -- <comando>: due processi veri non si sovrappongono, il codice d\'uscita passa', async () => {
    fresh();
    const { spawn } = await import('node:child_process');
    const script = path.resolve(__dirname, '../tools/pipeline/pipeline.mjs');
    const out = path.join(dir, 'tempi.txt');
    const work = path.join(dir, 'lavoro.cjs');
    fsMod.writeFileSync(work, [
      "const fs = require('fs'); const [out, name, code] = process.argv.slice(2);",
      "fs.appendFileSync(out, name + '+' + String.fromCharCode(10));",
      "setTimeout(() => { fs.appendFileSync(out, name + '-' + String.fromCharCode(10)); process.exit(Number(code)); }, 600);",
    ].join('\n'));
    const job = (name: string, code: number) => new Promise<number>((resolve) => {
      const c = spawn(process.execPath, [script, 'turno', 'test', '--', `"${process.execPath}"`, `"${work}"`, `"${out}"`, name, String(code)], {
        env: { ...process.env, PIPELINE_LOCK: dir, PIPELINE_TURNO_OGNI: '100', PIPELINE_TASK: name, PIPELINE_TURNO: '' }, stdio: 'ignore',
      });
      c.on('close', (k) => resolve(k ?? -1));
    });
    const codes = await Promise.all([job('A', 0), job('B', 3)]);
    expect(codes).toEqual([0, 3]);
    const lines = fsMod.readFileSync(out, 'utf8').trim().split('\n');
    expect(lines.map((l) => l.slice(1))).toEqual(['+', '-', '+', '-']);
    expect(lines[0][0]).toBe(lines[1][0]);
    expect(fsMod.existsSync(path.join(dir, 'test.json'))).toBe(false); // lasciato
  }, 20_000);

  it('typecheck e build hanno il loro turno, indipendente dagli altri (T118)', () => {
    fresh();
    [1, 2, 3].forEach((p) => living.add(p));
    expect(T.tryTurn('test', me(1, 100), { dir, isAlive }).taken).toBe(true);
    expect(T.tryTurn('typecheck', me(2, 200), { dir, isAlive }).taken).toBe(true);
    expect(T.tryTurn('build', me(3, 300), { dir, isAlive }).taken).toBe(true);
    expect(T.tryTurn('build', me(1, 400), { dir, isAlive }).taken).toBe(false);
  });

  it('un comando dentro un turno già tenuto non aspetta se stesso (T118)', () => {
    fresh();
    const covered = (kind: string, held: string) => T.coveredBy(kind, { chi: 'T9' }, { held, dir, isAlive });
    expect(covered('typecheck', 'build')).toBe(true); // il typecheck dentro npm run build
    expect(covered('build', 'browser')).toBe(true); // la build prima della preview
    expect(covered('test', 'test')).toBe(true);
    expect(covered('typecheck', 'browser,build')).toBe(true);
    expect(covered('build', 'typecheck')).toBe(false); // il typecheck non copre la build
    expect(covered('test', 'build')).toBe(false); // né una build copre una suite
    expect(covered('browser', 'test')).toBe(false); // lo strumento del browser resta uno solo
    expect(covered('build', '')).toBe(false);
  });

  it('la preview in background di un task copre le sue build, non quelle degli altri, e non le sue suite (T118)', () => {
    fresh();
    living.add(1);
    T.tryTurn('browser', { chi: 'T9', pid: 1, comando: 'npx vite preview' }, { dir, isAlive });
    const covered = (kind: string, chi: string) => T.coveredBy(kind, { chi }, { held: '', dir, isAlive });
    expect(covered('build', 'T9')).toBe(true);
    expect(covered('browser', 'T9')).toBe(true); // riaprire la preview non aspetta quella vecchia
    expect(covered('test', 'T9')).toBe(false);
    expect(covered('build', 'T8')).toBe(false);
    living.delete(1);
    expect(covered('build', 'T9')).toBe(false);
  });

  it('turno build -- turno typecheck: due processi veri, il secondo non aspetta il primo né resta in coda (T118)', async () => {
    fresh();
    const { spawn } = await import('node:child_process');
    const script = path.resolve(__dirname, '../tools/pipeline/pipeline.mjs');
    const work = path.join(dir, 'esci.cjs');
    fsMod.writeFileSync(work, 'process.exit(5);');
    const inner = `node "${script}" turno typecheck -- node "${work}"`;
    const code = await new Promise<number>((resolve) => {
      const c = spawn(process.execPath, [script, 'turno', 'build', '--', inner], {
        env: { ...process.env, PIPELINE_LOCK: dir, PIPELINE_TURNO_OGNI: '100', PIPELINE_TASK: 'T9', PIPELINE_TURNO: '' }, stdio: 'ignore',
      });
      c.on('close', (k) => resolve(k ?? -1));
    });
    expect(code).toBe(5); // il codice del comando più interno arriva fin qui
    expect(fsMod.existsSync(path.join(dir, 'build.json'))).toBe(false);
  }, 20_000);

  it('i worker di vitest: limitati sotto la pipeline, quelli di sempre a mano (T118)', async () => {
    const { testWorkers } = await import('../server/testWorkers');
    expect(testWorkers({}, 6)).toEqual({});
    expect(testWorkers({ PIPELINE_TASK: 'T9' }, 6)).toEqual({ maxWorkers: 6 });
    expect(testWorkers({ PIPELINE_TURNO: 'test' }, 6)).toEqual({ maxWorkers: 6 });
    expect(testWorkers({ PIPELINE_TASK: 'T9' }, 0)).toEqual({});
    // Il numero sta in config.json, dove la pipeline tiene i turni.
    expect(testWorkers({ PIPELINE_TASK: 'T9' }).maxWorkers).toBeGreaterThan(0);
  });
});

// Spegnere la pipeline (T85, ADR-0090): `ferma --ora`, `ferma --dopo`, ciò che il riavvio ritrova e dice all'orchestratore.
type Run = { id: string; provider: string; stima: number; tentativi: number; stato: string; sessione?: string; pid?: number; dir?: string; inizio?: string; fine?: string; esito?: string; fermoFino?: string; spegnimento?: boolean; log?: string };
type Stop = {
  requestStop(modo: 'ora' | 'dopo', o?: { chi?: string; stateDir?: string }): { stop: { modo: string; t: string }; interrupted: string[]; running?: number };
  recoverRuns(runs: Record<string, Run>, o?: { isAlive?: (pid?: number) => boolean; readLog?: (r: Run) => string; at?: string }): Record<'seguiti' | 'finiti' | 'persi' | 'ripresi', Run[]>;
  shutdownRecord(runs: Record<string, Run>, stop: { modo: string; t?: string; chi?: string }, at?: string): { t: string; modo: string; interrotti: string[]; finitiNellAttesa: string[]; inCorso: string[]; sospesi: string[] };
  shutdownSummary(record: unknown, runs: Record<string, Run>): string[];
};

describe('spegnere la pipeline (T85)', () => {
  let S: Stop;
  let O: { startPage(s: { epoca: number; provider: string; riavvio?: string[] }, reason: string, opts?: unknown): string };
  let fsMod: typeof import('node:fs');
  let osMod: typeof import('node:os');
  const script = path.resolve(__dirname, '../tools/pipeline/pipeline.mjs');
  beforeAll(async () => {
    S = (await import(/* @vite-ignore */ pathToFileURL(script).href)) as Stop;
    O = (await import(/* @vite-ignore */ pathToFileURL(path.resolve(__dirname, '../tools/pipeline/orchestra.mjs')).href)) as typeof O;
    fsMod = await import('node:fs');
    osMod = await import('node:os');
  });
  const tmp = () => fsMod.mkdtempSync(path.join(osMod.tmpdir(), 'quine-ferma-'));
  const run = (id: string, o: Partial<Run> = {}): Run => ({ id, provider: 'finto', stima: 1, tentativi: 1, stato: 'in corso', sessione: `s-${id}`, inizio: '2026-10-30T10:00:00.000Z', ...o });

  it('ferma --ora senza una pipeline accesa interrompe, tiene la conversazione e registra lo spegnimento', () => {
    const dir = tmp();
    fsMod.writeFileSync(path.join(dir, 'esecuzioni.json'), JSON.stringify({ T1: run('T1'), T2: run('T2', { stato: 'sospeso' }), T3: run('T3', { stato: 'finito', esito: 'ESITO: fatto' }) }));
    const r = S.requestStop('ora', { stateDir: dir, chi: 'prova' });
    expect(r.interrupted).toEqual(['T1']);
    expect(r.running).toBeUndefined();
    const runs = JSON.parse(fsMod.readFileSync(path.join(dir, 'esecuzioni.json'), 'utf8'));
    expect(runs.T1).toMatchObject({ stato: 'interrotto', spegnimento: true, sessione: 's-T1' });
    expect(runs.T2.stato).toBe('sospeso');
    const record = JSON.parse(fsMod.readFileSync(path.join(dir, 'spegnimento.json'), 'utf8'));
    expect(record).toMatchObject({ modo: 'ora', chi: 'prova', interrotti: ['T1'], sospesi: ['T2'] });
    expect(fsMod.existsSync(path.join(dir, 'arresto.json'))).toBe(false); // nessuno a cui chiederlo: già fatto
  });

  it('al riavvio gli interrotti riprendono, chi ha finito da spento si chiude, chi è sparito riprende', () => {
    const runs: Record<string, Run> = {
      A: run('A', { stato: 'interrotto', spegnimento: true, pid: 11 }),
      B: run('B', { pid: 12 }), // ancora vivo (lasciato con /esci)
      C: run('C', { pid: 13 }), // finito mentre era spenta: l'esito è nel log
      D: run('D', { pid: 14 }), // sparito senza esito
      E: run('E', { stato: 'interrotto' }), // interrotto dall'orchestratore: aspetta riprendi
    };
    const found = S.recoverRuns(runs, { isAlive: (pid) => pid === 12, readLog: (r) => (r.id === 'C' ? '{"result":"ESITO: fatto — prova","session_id":"s-C"}' : ''), at: '2026-10-31T08:00:00.000Z' });
    expect(found.ripresi.map((r) => r.id)).toEqual(['A']);
    expect(found.seguiti.map((r) => r.id)).toEqual(['B']);
    expect(found.finiti.map((r) => r.id)).toEqual(['C']);
    expect(found.persi.map((r) => r.id)).toEqual(['D']);
    expect(runs.A).toMatchObject({ stato: 'sospeso', fermoFino: '2026-10-31T08:00:00.000Z', sessione: 's-A' });
    expect(runs.A.spegnimento).toBeUndefined();
    expect(runs.E.stato).toBe('interrotto');
  });

  it('il riepilogo del riavvio va nella pagina di avvio dell\'orchestratore', () => {
    const t = '2026-10-30T20:00:00.000Z';
    const record = { t, modo: 'ora', chi: 'Ctrl+C', richiesta: t, interrotti: ['T1'], finitiNellAttesa: [], inCorso: ['T4'], sospesi: ['T2'] };
    const runs: Record<string, Run> = {
      T1: run('T1', { stato: 'sospeso' }),
      T2: run('T2', { stato: 'sospeso' }),
      T3: run('T3', { stato: 'finito', fine: '2026-10-31T07:00:00.000Z', esito: 'ESITO: fatto — il menu' }),
      T4: run('T4'),
      T5: run('T5', { stato: 'finito', fine: '2026-10-29T07:00:00.000Z', esito: 'ESITO: fatto — vecchio' }),
    };
    const lines = S.shutdownSummary(record, runs);
    const text = lines.join('\n');
    expect(text).toContain('ferma --ora');
    expect(text).toMatch(/Interrotti allo spegnimento.*T1/);
    expect(text).toMatch(/Finiti mentre era spenta: T3 — ESITO: fatto — il menu/);
    expect(text).toMatch(/Ancora al lavoro: T4/);
    expect(text).toMatch(/limiti.*T2/);
    expect(text).not.toContain('T5');
    expect(S.shutdownSummary(undefined, runs)).toEqual([]);
    const page = O.startPage({ epoca: 4, provider: 'claude', riavvio: lines }, 'riavvio dopo lo spegnimento', { chat: [], quadro: path.join(tmp(), 'nessuno.md') });
    expect(page).toContain('## Lo spegnimento di prima');
    expect(page).toContain('Finiti mentre era spenta: T3');
    expect(O.startPage({ epoca: 4, provider: 'claude' }, 'avvio', { chat: [], quadro: path.join(tmp(), 'nessuno.md') })).not.toContain('Lo spegnimento');
  });

  // La pipeline vera (`esegui`) con una CLI finta: un processo node che dorme e poi risponde come Claude.
  const world = (ms: number, ids: string[]) => {
    const dir = tmp();
    const cli = path.join(dir, 'cli.cjs');
    fsMod.writeFileSync(cli, `setTimeout(() => console.log(JSON.stringify({ session_id: 'nuova', result: 'ESITO: fatto — prova' })), ${ms});\n`);
    const config = {
      base: '3d', orchestratore: 'nessuno', maxParalleli: 1, riserva: 0, sogliaUnSolo: 0, attesaLimiteMinuti: 60, controlloSecondi: 1, usoSecondi: 3600,
      intervalloLanciMinuti: 0, approvazione: 'manuale', prompt: 'prova {id}',
      providers: { finto: { cmd: process.execPath, args: [cli], resume: ['--resume', '{sessione}'], resetSettimanale: '', browser: true } },
    };
    fsMod.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config));
    const letto = new Date().toISOString();
    fsMod.writeFileSync(path.join(dir, 'budget.json'), JSON.stringify({ finto: { residuo: 100, sessione: 100, letto, aggiornato: letto, contatori: [{ nome: 'x', finestra: 'settimana', residuo: 100 }] } }));
    const runs = Object.fromEntries(ids.map((id) => [id, run(id, { stato: 'sospeso', tentativi: 0, fermoFino: '2026-01-01T00:00:00.000Z', dir })]));
    fsMod.writeFileSync(path.join(dir, 'esecuzioni.json'), JSON.stringify(runs));
    return { dir, env: { ...process.env, PIPELINE_STATE: dir, PIPELINE_CONFIG: path.join(dir, 'config.json') } };
  };
  const readRuns = (dir: string): Record<string, Run> => { try { return JSON.parse(fsMod.readFileSync(path.join(dir, 'esecuzioni.json'), 'utf8')); } catch { return {}; } };
  const until = async (ok: () => boolean, ms = 20_000) => { for (const end = Date.now() + ms; !ok(); ) { if (Date.now() > end) throw new Error('tempo scaduto'); await new Promise((r) => setTimeout(r, 200)); } };
  const pipeline = async (w: { dir: string; env: NodeJS.ProcessEnv }) => {
    const { spawn, spawnSync } = await import('node:child_process');
    let out = '';
    const child = spawn(process.execPath, [script, 'esegui', '--sempre', '--solo', 'finto', '--max', '1'], { env: w.env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    const ended = new Promise<number>((resolve) => child.on('close', (c) => resolve(c ?? -1)));
    const ferma = (modo: string) => spawnSync(process.execPath, [script, 'ferma', `--${modo}`], { env: w.env, encoding: 'utf8' }).stdout;
    return { ended, ferma, out: () => out };
  };
  const within = (p: Promise<number>) => Promise.race([p, new Promise<number>((r) => setTimeout(() => r(-2), 30_000))]);

  it('ferma --ora: la pipeline accesa interrompe il task, tiene la sua conversazione e si spegne', async () => {
    const w = world(60_000, ['T1']);
    const p = await pipeline(w);
    await until(() => readRuns(w.dir).T1?.stato === 'in corso' && Boolean(readRuns(w.dir).T1?.pid));
    expect(p.ferma('ora')).toMatch(/si spegne ora: interrotti T1/);
    expect(await within(p.ended), p.out()).toBe(0);
    const runs = readRuns(w.dir);
    expect(runs.T1).toMatchObject({ stato: 'interrotto', spegnimento: true, sessione: 's-T1' });
    const record = JSON.parse(fsMod.readFileSync(path.join(w.dir, 'spegnimento.json'), 'utf8'));
    expect(record).toMatchObject({ modo: 'ora', interrotti: ['T1'] });
    expect(fsMod.existsSync(path.join(w.dir, 'arresto.json'))).toBe(false);
    expect(p.out()).toContain('pipeline spenta (ferma --ora)');
  }, 60_000);

  it('ferma --dopo: niente lanci nuovi, aspetta che il task in corso finisca e si spegne', async () => {
    const w = world(3_000, ['T1', 'T2']);
    const p = await pipeline(w);
    await until(() => readRuns(w.dir).T1?.stato === 'in corso' && Boolean(readRuns(w.dir).T1?.pid));
    expect(p.ferma('dopo')).toMatch(/si spegne dopo la fine/);
    expect(await within(p.ended), p.out()).toBe(0);
    const runs = readRuns(w.dir);
    expect(runs.T1).toMatchObject({ stato: 'finito', esito: 'ESITO: fatto — prova' });
    expect(runs.T2).toMatchObject({ stato: 'sospeso', tentativi: 0 }); // mai lanciato
    const record = JSON.parse(fsMod.readFileSync(path.join(w.dir, 'spegnimento.json'), 'utf8'));
    expect(record).toMatchObject({ modo: 'dopo', interrotti: [], finitiNellAttesa: ['T1'], sospesi: ['T2'] });
    // Al riavvio l'orchestratore lo sa.
    expect(S.shutdownSummary(record, runs).join('\n')).toMatch(/Finiti mentre aspettava di spegnersi: T1 — ESITO: fatto/);
  }, 60_000);
});

type Usage = { chiamate: number; input: number; cache: number; scritti: number; output: number };
type Trace = { sessione?: string; file?: string; riprendi?: string; consumo: Usage; ultime: string[]; agents: boolean };
type Tracing = {
  traceOf(id: string, opts?: unknown): Trace | undefined;
  findAgyConversation(o: { home: string; dir?: string; id?: string; dal?: string }): string | undefined;
  watchAgyConversation(id: string, run: { dir?: string; sessione?: string }, save: (id: string) => void, o?: { every?: number; home?: string }): ReturnType<typeof setInterval>;
  traceOrchestrator(opts?: unknown): { provider?: string; epoca: number; epoche: Record<string, any>[] };
  liveConversations(opts?: unknown): Record<string, any>[];
};

describe('tracciare le conversazioni in corso (T86)', () => {
  let P: Tracing;
  let O: { openEpoch(s: Record<string, any>, at?: string): Record<string, any>; noteTurn(s: Record<string, any>, json: unknown, session?: string): Record<string, any> };
  let W: { handleApi(method: string, url: string, body?: unknown, opts?: unknown): { status: number; data: any } };
  let fsMod: typeof import('node:fs');
  let osMod: typeof import('node:os');
  beforeAll(async () => {
    const at = (f: string) => pathToFileURL(path.resolve(__dirname, '../tools/pipeline', f)).href;
    P = (await import(/* @vite-ignore */ at('pipeline.mjs'))) as Tracing;
    O = (await import(/* @vite-ignore */ at('orchestra.mjs'))) as typeof O;
    W = (await import(/* @vite-ignore */ at('web.mjs'))) as typeof W;
    fsMod = await import('node:fs');
    osMod = await import('node:os');
  });

  const config = {
    providers: {
      claude: { cmd: 'claude', args: [], resume: ['--resume', '{sessione}'], sessioneNuova: ['--session-id', '{sessione}'] },
      gemini: { cmd: 'agy', args: [], resume: ['--conversation', '{sessione}'] },
    },
  };
  const jsonl = (rows: unknown[]) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
  const write = (file: string, text: string) => { fsMod.mkdirSync(path.dirname(file), { recursive: true }); fsMod.writeFileSync(file, text); };
  const brain = (home: string, conv: string) => path.join(home, '.gemini', 'antigravity-cli', 'brain', conv, '.system_generated', 'logs', 'transcript.jsonl');
  /** A home with Claude sessions and Antigravity conversations, and a state with a run per provider. */
  const world = () => {
    const root = fsMod.mkdtempSync(path.join(osMod.tmpdir(), 'quine-traccia-'));
    const home = path.join(root, 'home');
    const stateDir = path.join(root, 'stato');
    const wt = (id: string) => path.join(root, 'worktrees', id);
    const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
    // Claude: the task's session and the orchestrator's (a call repeated on two blocks counts once).
    const claudeTurn = (id: string, text: string) => [
      { type: 'user', message: { content: 'Regole inviolabili: leggi AGENTS.md' } },
      { type: 'assistant', message: { id: `${id}-1`, usage: { input_tokens: 10, cache_read_input_tokens: 1000, cache_creation_input_tokens: 200, output_tokens: 50 }, content: [{ type: 'thinking', thinking: 'penso' }] } },
      { type: 'assistant', message: { id: `${id}-1`, usage: { input_tokens: 10, cache_read_input_tokens: 1000, cache_creation_input_tokens: 200, output_tokens: 50 }, content: [{ type: 'tool_use', name: 'Bash', input: { command: 'npm test' } }] } },
      { type: 'assistant', message: { id: `${id}-2`, usage: { input_tokens: 5, cache_read_input_tokens: 2000, output_tokens: 20 }, content: [{ type: 'text', text }] } },
    ];
    write(path.join(home, '.claude', 'projects', 'progetto', 'sess-t1.jsonl'), jsonl(claudeTurn('t1', 'fatto il primo pezzo')));
    write(path.join(home, '.claude', 'projects', 'repo', 'sess-orch.jsonl'), jsonl(claudeTurn('o', 'T2 va integrato')));
    // Antigravity: the task's conversation, one of a worktree with a longer name, one older than the run.
    const agy = (conv: string, dir: string, created: string) => write(brain(home, conv), jsonl([
      { type: 'USER_INPUT', source: 'USER_EXPLICIT', created_at: created, content: `Lavora nel worktree \`${dir}\` (branch \`task/T2\`). Leggi \`AGENTS.md\`` },
      { type: 'PLANNER_RESPONSE', created_at: created, input_tokens: 3000, cache_read_tokens: 2500, output_tokens: 40, tool_calls: [{ name: 'view_file', args: { Path: `${dir}\\AGENTS.md` } }] },
      { type: 'PLANNER_RESPONSE', created_at: created, input_tokens: 4000, cache_read_tokens: 3000, output_tokens: 60, content: 'scrivo i test' },
    ]));
    agy('conv-t2', wt('t2'), ago(9));
    agy('conv-t20', wt('t20'), ago(8));
    agy('conv-vecchia', wt('t2'), ago(3000));
    const old = new Date(ago(3000));
    fsMod.utimesSync(brain(home, 'conv-vecchia'), old, old);
    write(path.join(stateDir, 'esecuzioni.json'), JSON.stringify({
      T1: { id: 'T1', provider: 'claude', stato: 'in corso', tentativi: 1, sessione: 'sess-t1', inizio: ago(10), dir: wt('t1') },
      T2: { id: 'T2', provider: 'gemini', stato: 'in corso', tentativi: 1, inizio: ago(10), dir: wt('t2') },
      T3: { id: 'T3', provider: 'claude', stato: 'finito', tentativi: 1, sessione: 'sess-t3', dir: wt('t3') },
    }));
    return { home, stateDir, wt, ago, opts: { repo: path.join(root, 'repo'), stateDir, home, config } };
  };
  const until = async (ok: () => boolean) => { for (let i = 0; i < 100 && !ok(); i++) await new Promise((r) => setTimeout(r, 20)); };

  it('traccia di un task Claude in corso: id, file, comando per riprenderlo, consumo e ultime azioni', () => {
    const w = world();
    const t = P.traceOf('T1', w.opts)!;
    expect(t.sessione).toBe('sess-t1');
    expect(t.file).toBe(path.join(w.home, '.claude', 'projects', 'progetto', 'sess-t1.jsonl'));
    expect(t.riprendi).toBe(`cd "${w.wt('t1')}" && claude --resume sess-t1`);
    expect(t.agents).toBe(true);
    expect(t.consumo).toEqual({ chiamate: 2, input: 15, cache: 3000, scritti: 200, output: 70 });
    expect(t.ultime).toEqual(['pensiero: penso', 'strumento: Bash npm test', 'agente: fatto il primo pezzo']);
  });

  it('traccia di un task agy in corso: l\'id trovato dai file di Antigravity, prima che agy lo dica', () => {
    const w = world();
    expect(P.findAgyConversation({ home: w.home, dir: w.wt('t2'), dal: w.ago(10) })).toBe('conv-t2');
    expect(P.findAgyConversation({ home: w.home, dir: w.wt('t9'), dal: w.ago(10) })).toBeUndefined();
    const t = P.traceOf('T2', w.opts)!;
    expect(t.sessione).toBe('conv-t2');
    expect(t.riprendi).toBe(`cd "${w.wt('t2')}" && agy --conversation conv-t2`);
    expect(t.agents).toBe(true);
    // agy counts the cache inside input_tokens.
    expect(t.consumo).toEqual({ chiamate: 2, input: 1500, cache: 5500, scritti: 0, output: 100 });
    expect(t.ultime.at(-1)).toBe('agente: scrivo i test');
  });

  it('all\'avvio di agy l\'id della conversazione si salva appena agy la scrive', async () => {
    const w = world();
    const run: { dir: string; sessione?: string } = { dir: w.wt('t2') };
    const saved: string[] = [];
    const first = P.watchAgyConversation('T2', run, (id) => saved.push(id), { every: 20, home: w.home });
    await until(() => Boolean(run.sessione));
    clearInterval(first);
    // Started now: the conversations begun before it (a minute of margin) are not its own.
    expect(run.sessione).toBeUndefined();
    write(brain(w.home, 'conv-nuova'), jsonl([{ type: 'USER_INPUT', created_at: new Date().toISOString(), content: `Lavora nel worktree \`${w.wt('t2')}\`` }]));
    const second = P.watchAgyConversation('T2', run, (id) => saved.push(id), { every: 20, home: w.home });
    await until(() => Boolean(run.sessione));
    clearInterval(second);
    expect(run.sessione).toBe('conv-nuova');
    expect(saved).toEqual(['T2']);
  });

  it('traccia orchestratore: le epoche con provider, turni, consumi, e la conversazione di quella in corso', () => {
    const w = world();
    const s: Record<string, any> = { provider: 'gemini', epoca: 1, motivo: 'avvio' };
    O.openEpoch(s, '2026-10-31T08:00:00Z');
    O.noteTurn(s, { usage: { input_tokens: 9000, cache_read_tokens: 8000, output_tokens: 100 } }, 'conv-orch-vecchia');
    Object.assign(s, { provider: 'claude', epoca: 2, motivo: 'gemini sotto il 10 %', sessione: undefined });
    O.openEpoch(s, '2026-10-31T09:00:00Z');
    O.noteTurn(s, { usage: { input_tokens: 10, cache_read_input_tokens: 1000, cache_creation_input_tokens: 90, output_tokens: 50 }, total_cost_usd: 0.25 }, 'sess-orch');
    O.noteTurn(s, { usage: { input_tokens: 5, cache_read_input_tokens: 1100, output_tokens: 20 }, total_cost_usd: 0.05 });
    expect(s.epoche).toEqual([
      { epoca: 1, provider: 'gemini', dal: '2026-10-31T08:00:00Z', motivo: 'avvio', turni: 1, token: 9100, sessione: 'conv-orch-vecchia' },
      { epoca: 2, provider: 'claude', dal: '2026-10-31T09:00:00Z', motivo: 'gemini sotto il 10 %', turni: 2, token: 2275, sessione: 'sess-orch', costoUsd: 0.3 },
    ]);
    write(path.join(w.stateDir, 'orchestra', 'stato.json'), JSON.stringify({ ...s, sessione: 'sess-orch', contesto: 3000 }));
    const o = P.traceOrchestrator(w.opts);
    expect(o).toMatchObject({ provider: 'claude', epoca: 2 });
    expect(o.epoche[0].inCorso).toBeUndefined();
    const cur = o.epoche[1];
    expect(cur).toMatchObject({ inCorso: true, sessione: 'sess-orch', contesto: 3000, costoUsd: 0.3 });
    expect(cur.file).toBe(path.join(w.home, '.claude', 'projects', 'repo', 'sess-orch.jsonl'));
    expect(cur.riprendi).toBe(`cd "${w.opts.repo}" && claude --resume sess-orch`);
    expect(cur.consumo.chiamate).toBe(2);
    expect(cur.ultime.at(-1)).toBe('agente: T2 va integrato');
  });

  it('nell\'interfaccia web le conversazioni in corso, con il consumo di ciascuna', () => {
    const w = world();
    write(path.join(w.stateDir, 'orchestra', 'stato.json'), JSON.stringify({ provider: 'claude', epoca: 1, sessione: 'sess-orch', epoche: [{ epoca: 1, provider: 'claude', turni: 1, token: 10 }] }));
    const r = W.handleApi('GET', '/api/conversazioni', {}, w.opts);
    expect(r.status).toBe(200);
    const byWho = new Map(r.data.map((c: any) => [c.chi, c]));
    expect([...byWho.keys()].sort()).toEqual(['T1', 'T2', 'orchestratore']); // T3 è finito
    expect(byWho.get('T1')).toMatchObject({ provider: 'claude', sessione: 'sess-t1', consumo: { chiamate: 2 } });
    expect(byWho.get('T2')).toMatchObject({ provider: 'gemini', sessione: 'conv-t2', consumo: { output: 100 } });
    expect(byWho.get('orchestratore')).toMatchObject({ epoca: 1, sessione: 'sess-orch', riprendi: expect.stringContaining('claude --resume sess-orch') });
    expect(P.liveConversations(w.opts)).toHaveLength(3);
  });
});

describe('mai zero slot e sospendi/riattiva (T96)', () => {
  const NOW = Date.parse('2026-10-31T12:00:00Z');

  it('isSuspended riconosce sospensione indefinita, a tempo, scaduta o assente', () => {
    const nowMs = 1700000000000;
    expect(P.isSuspended(undefined, nowMs)).toBe(false);
    expect(P.isSuspended({}, nowMs)).toBe(false);
    expect(P.isSuspended({ sospeso: false }, nowMs)).toBe(false);
    expect(P.isSuspended({ sospeso: true }, nowMs)).toBe(true);
    expect(P.isSuspended({ sospeso: new Date(nowMs + 60_000).toISOString() }, nowMs)).toBe(true);
    expect(P.isSuspended({ sospeso: new Date(nowMs - 60_000).toISOString() }, nowMs)).toBe(false);
    expect(P.isSuspended({ sospeso: { fino: new Date(nowMs + 60_000).toISOString() } }, nowMs)).toBe(true);
    expect(P.isSuspended({ sospeso: { fino: new Date(nowMs - 60_000).toISOString() } }, nowMs)).toBe(false);
  });

  it('suspendProvider e resumeProvider scrivono budget.json e diario in directory isolata', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-t96-'));
    const stateDir = path.join(root, '.pipeline');
    const config = { providers: { claude: { cmd: 'claude' }, gemini: { cmd: 'agy' } } };
    const opts = { stateDir, config };

    // Sospensione a tempo
    const future = new Date(Date.now() + 3_600_000).toISOString();
    const r1 = P.suspendProvider('claude', future, opts);
    expect(r1.provider).toBe('claude');
    expect(r1.sospeso).toBe(future);

    const b1 = JSON.parse(fs.readFileSync(path.join(stateDir, 'budget.json'), 'utf8'));
    expect(b1.claude.sospeso).toBe(future);

    // Riattivazione
    const r2 = P.resumeProvider('claude', opts);
    expect(r2.provider).toBe('claude');
    expect(r2.sospeso).toBe(false);

    const b2 = JSON.parse(fs.readFileSync(path.join(stateDir, 'budget.json'), 'utf8'));
    expect(b2.claude.sospeso).toBeUndefined();

    // Sospensione indefinita (senza data)
    const r3 = P.suspendProvider('gemini', undefined, opts);
    expect(r3.provider).toBe('gemini');
    expect(r3.sospeso).toBe(true);

    const b3 = JSON.parse(fs.readFileSync(path.join(stateDir, 'budget.json'), 'utf8'));
    expect(b3.gemini.sospeso).toBe(true);

    // Errori su provider sconosciuto o data invalida
    expect(() => P.suspendProvider('sconosciuto', undefined, opts)).toThrow('Provider sconosciuto');
    expect(() => P.suspendProvider('claude', 'data-non-valida', opts)).toThrow('Data non valida');
    expect(() => P.resumeProvider('sconosciuto', opts)).toThrow('Provider sconosciuto');

    fs.rmSync(root, { recursive: true, force: true });
  });

  it('web /api/chat gestisce comandi /sospendi e /riattiva', async () => {
    const W = (await import(/* @vite-ignore */ pathToFileURL(path.resolve(__dirname, '../tools/pipeline/web.mjs')).href)) as any;
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-t96-web-'));
    const stateDir = path.join(root, '.pipeline');
    const config = { providers: { claude: { cmd: 'claude' } } };
    const opts = { stateDir, config };

    const future = new Date(Date.now() + 86_400_000).toISOString();
    const res1 = W.handleApi('POST', '/api/chat', { testo: `/sospendi claude fino a ${future}` }, opts);
    expect(res1.status).toBe(200);

    const b1 = JSON.parse(fs.readFileSync(path.join(stateDir, 'budget.json'), 'utf8'));
    expect(b1.claude.sospeso).toBe(future);

    const res2 = W.handleApi('POST', '/api/chat', { testo: '/riattiva claude' }, opts);
    expect(res2.status).toBe(200);

    const b2 = JSON.parse(fs.readFileSync(path.join(stateDir, 'budget.json'), 'utf8'));
    expect(b2.claude.sospeso).toBeUndefined();

    fs.rmSync(root, { recursive: true, force: true });
  });

  it('showSlots e updateSlots correggono slot da 0 a 1 quando tetto >= 1', () => {
    const providers = { claude: { cmd: 'claude', resetSettimanale: 'gio 10:00' } };
    const config = { maxParalleli: 5, usoSecondi: 300, providers, limiti: { modello: { claude: 3 } } };
    const queues = { inCorso: [], pronti: [], bloccati: [], inAttesa: [], daIntegrare: [], daApprovare: [], daStimare: [] };
    const budget: Record<string, Record<string, unknown>> = { claude: { residuo: 90, slot: 0 } };

    P.updateSlots(budget, queues, { config, nowMs: NOW });
    expect(budget.claude.slot).toBe(1); // non resta a 0

    budget.claude.slot = 0;
    // updateSlots con previsione prima del reset non porta mai a zero
    budget.claude.storia = [{ t: new Date(NOW - 2 * 3_600_000).toISOString(), residuo: 90 }];
    budget.claude.residuo = 20;
    P.updateSlots(budget, queues, { config, nowMs: NOW + 600_000 });
    expect(budget.claude.slot).toBe(1);
  });
});

describe('un task che torna da fare riparte da capo (T256)', () => {
  type Run = Record<string, any>;
  type Mod = {
    plan: (tasks: unknown[], runs: Record<string, Run>, budget: unknown, only?: string) => Record<string, { id: string }[]>;
    parseBacklog: (text: string) => unknown[];
    resumeTasks: (ids: string[], opts: unknown) => string[];
    dossierOf: (id: string, opts: unknown) => { markdown: string };
    traceOf: (id: string, opts: unknown) => { log: string };
  };
  let S: Mod;
  const script = path.resolve(__dirname, '../tools/pipeline/pipeline.mjs');
  beforeAll(async () => { S = (await import(/* @vite-ignore */ pathToFileURL(script).href)) as Mod; });

  const DA_FARE = '`da fare`';
  const block = (state: string) => `# Backlog\n\n### T1 · Il task — ${state}\n- Pipeline: finto · stima 1% · approvato · priorità 5\n`;
  const oldRun = (o: Run = {}): Run => ({ id: 'T1', provider: 'finto', stima: 1, tentativi: 3, stato: 'finito', sessione: 'vecchia', inizio: '2026-11-01T10:00:00.000Z', fine: '2026-11-01T11:00:00.000Z', esito: 'ESITO: fatto — prima', log: 'vecchio.log', ...o });

  /** Un repository vero con una copia dello script: REPO è dove sta lo script, così i worktree non toccano questo repository. */
  const world = (state: string, runs: Record<string, Run>) => {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'quine-dacapo-')));
    const repo = path.join(root, 'repo');
    const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const copy = path.join(repo, 'tools', 'pipeline', 'pipeline.mjs');
    fs.mkdirSync(path.dirname(copy), { recursive: true });
    fs.mkdirSync(path.join(repo, 'docs', 'plans'), { recursive: true });
    fs.copyFileSync(script, copy);
    fs.writeFileSync(path.join(repo, 'docs', 'plans', 'backlog.md'), block(state));
    fs.writeFileSync(path.join(repo, '.gitignore'), '.pipeline/\n.pipeline-task.md\n.claude/\ndocs/pipeline/\n');
    git('init', '-q', '-b', 'base3d');
    git('config', 'user.email', 'prova@example.com');
    git('config', 'user.name', 'Prova');
    git('config', 'commit.gpgsign', 'false');
    git('add', '-A');
    git('commit', '-qm', 'inizio');
    const stateDir = path.join(root, 'stato');
    fs.mkdirSync(stateDir);
    const cli = path.join(root, 'cli.cjs');
    fs.writeFileSync(cli, "console.log(JSON.stringify({ session_id: 'nuova', argv: process.argv.slice(2), result: 'ESITO: fatto — di nuovo' }));\n");
    const config = {
      base: 'base3d', orchestratore: 'nessuno', maxParalleli: 1, riserva: 0, sogliaUnSolo: 0, attesaLimiteMinuti: 60, controlloSecondi: 1, usoSecondi: 3600,
      intervalloLanciMinuti: 0, approvazione: 'manuale', prompt: 'prova {id}',
      providers: { finto: { cmd: process.execPath, args: [cli], resume: ['--resume', '{sessione}'], resetSettimanale: '', browser: true } },
    };
    fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify(config));
    const letto = new Date().toISOString();
    fs.writeFileSync(path.join(stateDir, 'budget.json'), JSON.stringify({ finto: { residuo: 100, sessione: 100, letto, aggiornato: letto, contatori: [{ nome: 'x', finestra: 'settimana', residuo: 100 }] } }));
    const runsFile = path.join(stateDir, 'esecuzioni.json');
    fs.writeFileSync(runsFile, JSON.stringify(runs));
    const env = { ...process.env, PIPELINE_STATE: stateDir, PIPELINE_CONFIG: path.join(root, 'config.json') };
    const readRuns = (): Record<string, Run> => JSON.parse(fs.readFileSync(runsFile, 'utf8'));
    const setRuns = (r: Record<string, Run>) => fs.writeFileSync(runsFile, JSON.stringify(r));
    const esegui = () => execFileSync(process.execPath, [copy, 'esegui', '--max', '1'], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 });
    const clean = () => fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
    return { root, repo, git, readRuns, setRuns, esegui, clean, opts: { repo, stateDir, config } };
  };

  // `plan` qui legge la configurazione vera: un provider che c'è.
  const queuesOf = (state: string, run: Run) => S.plan(S.parseBacklog(block(state).replace('finto', 'claude')), { T1: run }, {});
  const ids = (list: { id: string }[]) => list.map((t) => t.id);

  it('il piano: integrata e da fare è pronta, finita e non integrata resta da integrare, al lavoro resta in corso', () => {
    expect(ids(queuesOf(DA_FARE, oldRun({ integrato: 'ieri' })).pronti)).toEqual(['T1']);
    expect(ids(queuesOf(DA_FARE, { id: 'T1', stato: 'da capo', tentativi: 0 }).pronti)).toEqual(['T1']);
    const notIntegrated = queuesOf(DA_FARE, oldRun());
    expect(ids(notIntegrated.daIntegrare)).toEqual(['T1']);
    expect(notIntegrated.pronti).toEqual([]);
    expect(ids(queuesOf(DA_FARE, oldRun({ integrato: 'ieri', stato: 'in corso' })).inCorso)).toEqual(['T1']);
    expect(ids(queuesOf('`in attesa`', oldRun({ integrato: 'ieri' })).inAttesa)).toEqual(['T1']);
  });

  it('voce integrata e blocco da fare: viene lanciato con worktree, branch e conversazione nuovi', () => {
    const w = world(DA_FARE, { T1: oldRun({ integrato: '2026-11-01T12:00:00.000Z', dir: 'non-esiste-piu', branch: 'task/T1' }) });
    expect(w.esegui()).toContain('lancio T1 da capo');
    const r = w.readRuns().T1;
    expect(r).toMatchObject({ stato: 'finito', tentativi: 1, branch: 'task/T1', esito: 'ESITO: fatto — di nuovo', sessione: 'nuova' });
    expect(r.integrato).toBeUndefined();
    expect(fs.existsSync(r.dir)).toBe(true);
    expect(w.git('branch', '--list', 'task/T1')).toContain('task/T1');
    // Il prompt del task, non la ripresa della vecchia conversazione.
    expect(JSON.parse(fs.readFileSync(r.log, 'utf8').trim()).argv).toEqual(['-p', 'prova T1']);
    expect(fs.existsSync(path.join(r.dir, '.pipeline-task.md'))).toBe(true);
    // Il tentativo di prima resta, e il suo log non si sovrascrive.
    expect(r.precedenti).toHaveLength(1);
    expect(r.precedenti[0]).toMatchObject({ tentativi: 3, sessione: 'vecchia', esito: 'ESITO: fatto — prima', integrato: '2026-11-01T12:00:00.000Z', log: 'vecchio.log' });
    expect(path.basename(r.log)).toBe('T1.d1.1.log');
    expect(S.traceOf('T1', w.opts).log).toBe(r.log);
    expect(S.dossierOf('T1', w.opts).markdown).toContain('tentativo di prima: finto, 3 tentativo/i, finito, integrato il 2026-11-01T12:00:00.000Z — ESITO: fatto — prima · sessione vecchia');
    w.git('worktree', 'remove', '--force', r.dir);
    w.clean();
  }, 90_000);

  it('riprendi sulla voce integrata di un task da fare: riparte da capo, senza riaprire la conversazione', () => {
    const w = world(DA_FARE, { T1: oldRun({ integrato: 'ieri', dir: 'non-esiste-piu' }) });
    expect(S.resumeTasks(['T1'], w.opts)).toEqual(['T1']);
    const r = w.readRuns().T1;
    expect(r).toMatchObject({ id: 'T1', stato: 'da capo', tentativi: 0, provider: 'finto' });
    expect(r.sessione).toBeUndefined();
    expect(r.dir).toBeUndefined();
    expect(r.precedenti[0]).toMatchObject({ sessione: 'vecchia', tentativi: 3 });
    // Rifatto non perde e non duplica nulla.
    S.resumeTasks(['T1'], w.opts);
    expect(w.readRuns().T1.precedenti).toHaveLength(1);
    expect(w.esegui()).toContain('lancio T1 da capo');
    const after = w.readRuns().T1;
    expect(after).toMatchObject({ stato: 'finito', tentativi: 1, sessione: 'nuova' });
    expect(after.precedenti).toHaveLength(1);
    w.git('worktree', 'remove', '--force', after.dir);
    w.clean();
  }, 90_000);

  it('riprendi con il worktree assente: riparte da capo e lo dice, anche se git ricorda ancora la cartella', () => {
    const w = world(DA_FARE, {});
    const gone = path.join(w.root, 'sparito');
    w.git('worktree', 'add', '-q', '-b', 'task/T1', gone);
    fs.rmSync(gone, { recursive: true, force: true });
    w.setRuns({ T1: oldRun({ esito: 'ESITO: fallito (codice -1)', dir: gone }) });
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      S.resumeTasks(['T1'], w.opts);
      expect(log.mock.calls.flat().join('\n')).toContain("T1: rimesso in coda (riparte da capo: il suo worktree non c'è più)");
    } finally { log.mockRestore(); }
    expect(w.readRuns().T1).toMatchObject({ stato: 'da capo', tentativi: 0 });
    w.esegui();
    const r = w.readRuns().T1;
    expect(r).toMatchObject({ stato: 'finito', tentativi: 1, sessione: 'nuova' });
    expect(r.dir).not.toBe(gone);
    expect(fs.existsSync(r.dir)).toBe(true);
    w.git('worktree', 'remove', '--force', r.dir);
    w.clean();
  }, 90_000);

  it('riprendi con il worktree presente e la conversazione: la riprende, come prima', () => {
    const w = world(DA_FARE, {});
    w.setRuns({ T1: oldRun({ stato: 'interrotto', dir: w.repo }) });
    S.resumeTasks(['T1'], w.opts);
    expect(w.readRuns().T1).toMatchObject({ stato: 'sospeso', sessione: 'vecchia', tentativi: 3, dir: w.repo });
    w.clean();
  });

  it('voce integrata e blocco fatto: nulla cambia, né con esegui né con riprendi', () => {
    const before = oldRun({ integrato: 'ieri', dir: 'non-esiste-piu' });
    const w = world('`fatto` (`abc1234`)', { T1: before });
    expect(S.resumeTasks(['T1'], w.opts)).toEqual([]);
    expect(w.readRuns().T1).toEqual(before);
    expect(w.esegui()).not.toContain('lancio');
    expect(w.readRuns().T1).toEqual(before);
    expect(w.git('branch', '--list', 'task/T1')).toBe('');
    w.clean();
  }, 90_000);

  it('voce finita e non integrata: resta da integrare, esegui non la rilancia', () => {
    const before = oldRun({ dir: 'non-esiste-piu' });
    const w = world(DA_FARE, { T1: before });
    expect(w.esegui()).not.toContain('lancio');
    expect(w.readRuns().T1).toEqual(before);
    w.clean();
  }, 90_000);
});

describe('i modelli di Claude distinti e lo sforzo (T255)', () => {
  type Sforzo = Pipeline & {
    normalizeEffort(v?: string): string | undefined;
    modelOf(provider: string, config?: unknown): string;
    accountOf(provider: string, config?: unknown): string;
    parseAssignArgs(rest: string[]): { id: string; provider: string; stima: string; priorita?: string; sforzo?: string; approva: boolean };
    assignTask(id: string, a: { provider: string; stima: number; sforzo?: string; approva?: boolean }, opts?: unknown): { sforzo?: string; modello: string };
    approveTasks(ids: string[], opts?: unknown): void;
    setPipelineLine(text: string, id: string, change: (i: any) => any): string;
    launchArgs(t: unknown, run?: unknown, o?: { resume?: boolean; config?: unknown }): string[];
    launch(t: unknown, run: any, save?: () => void, o?: unknown): Promise<unknown>;
    consumptionRow(run: unknown, out: unknown, dopo?: unknown, config?: unknown): Record<string, unknown>;
    writePlan(queues: unknown, budget: unknown, opts: unknown): void;
    canOrchestrate(provider: string, config?: unknown): boolean;
  };
  const S = () => P as unknown as Sforzo;
  const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tools/pipeline/config.json'), 'utf8'));
  const NUOVI = ['sonnet', 'haiku', 'agy-opus', 'agy-sonnet'];
  const tmp: string[] = [];
  afterEach(() => { for (const d of tmp.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
  const sandbox = () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-t255-'));
    tmp.push(repo);
    fs.mkdirSync(path.join(repo, 'docs', 'plans'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'docs', 'plans', 'backlog.md'), '# Backlog\n\n### T1 · Uno — `da fare`\n- Fare: qualcosa.\n\n### T2 · Due — `da fare`\n- Pipeline: claude · sforzo max · stima 2% · approvato · priorità 5\n');
    return repo;
  };

  it('i provider nuovi stanno nei piani e nei limiti, nessuno orchestra e nessun tetto sale', () => {
    for (const p of NUOVI) {
      expect(config.providers[p].orchestrabile).toBe(false);
      expect(P.canOrchestrate(p)).toBe(false);
      expect(config.orchestra.ordine).not.toContain(p);
      expect(config.limiti.modello[p]).toBe(1);
    }
    for (const piano of ['pro', 'max5x', 'max20x']) for (const p of ['sonnet', 'haiku']) expect(config.piani.claude[piano].disponibili).toContain(p);
    for (const piano of ['pro', 'ultra']) for (const p of ['agy-opus', 'agy-sonnet']) expect(config.piani.google[piano].disponibili).toContain(p);
    expect(config.limiti.provider).toEqual({ claude: 3, agy: 1 });
    for (const p of ['agy-opus', 'agy-sonnet']) expect(config.providers[p]).toMatchObject({ cmd: 'agy', browser: false, abbonamento: 'google', ratioSessioneSettimana: 2, contatori: '^Claude and GPT models$' });
    expect(config.providers.sonnet.ratioSessioneSettimana).toBe(config.providers.claude.ratioSessioneSettimana);
    expect(config.providers.haiku.ratioSessioneSettimana).toBe(config.providers.claude.ratioSessioneSettimana);
    expect(P.ceilingOf('agy-opus', config)).toBe(1);
  });

  it("Fable può orchestrare solo se è spuntato: fuori dall'ordine, con la sua finestra", () => {
    expect(config.providers.fable.orchestrabile).toBe(false);
    expect(config.orchestra.ordine).not.toContain('fable');
    expect(config.orchestra.finestra.fable).toBeGreaterThan(0);
    const spuntato = structuredClone(config);
    spuntato.providers.fable.orchestrabile = true;
    expect(S().canOrchestrate('fable', spuntato)).toBe(true);
  });

  it("chi l'autore sceglie con /agente resta, anche nei momenti quieti", async () => {
    const url = pathToFileURL(path.resolve(__dirname, '../tools/pipeline/orchestra.mjs')).href;
    const O = (await import(/* @vite-ignore */ url)) as { backToPreferred(o: unknown): boolean };
    const base = { provider: 'argon', queued: false, order: ['claude', 'argon'], budget: { claude: { residuo: 90, sessione: 90 } }, soglia: 10 };
    expect(O.backToPreferred(base)).toBe(true);
    expect(O.backToPreferred({ ...base, chosen: 'argon' })).toBe(false);
    expect(O.backToPreferred({ ...base, queued: true })).toBe(false);
    expect(O.backToPreferred({ ...base, chosen: 'gemini' })).toBe(true);
  });

  it('il modello si dice per nome: claude è Opus', () => {
    expect(S().modelOf('claude')).toBe('Opus 5.5');
    expect(S().modelOf('sonnet')).toBe('Sonnet 5.5');
    expect(S().modelOf('agy-opus')).toBe('Opus 5.5 (agy)');
    // Senza `modello`: l'id di --model, poi il provider.
    expect(S().modelOf('x', { providers: { x: { args: ['--model', 'm-1'] } } })).toBe('m-1');
    expect(S().modelOf('x', { providers: { x: { args: [] } } })).toBe('x');
  });

  it('il conto è condiviso: la settimana conta anche gli altri modelli dello stesso conto, e il tetto della CLI regge', () => {
    expect(S().accountOf('sonnet')).toBe('claude');
    expect(S().accountOf('haiku')).toBe('claude');
    expect(S().accountOf('agy-sonnet')).toBe(S().accountOf('agy-opus'));
    expect(S().accountOf('agy-opus')).not.toBe(S().accountOf('gemini'));
    const t = { estimate: 5, priority: 10 };
    const budget = { sonnet: { residuo: 20, sessione: 100, slot: 1, tetto: 1 } };
    expect(P.fitsOn('sonnet', t, { budget, live: [], config })).toBe(true);
    expect(P.fitsOn('sonnet', t, { budget, live: [{ provider: 'claude', stima: 14 }], config })).toBe(false); // 20 - 14 < 5 + riserva
    expect(P.fitsOn('sonnet', t, { budget, live: [{ provider: 'gemini', stima: 14 }], config })).toBe(true);
    // Tre task sulla CLI di Claude, di qualunque modello, e il quarto aspetta.
    const full = { sonnet: { residuo: 90, sessione: 100, slot: 1, tetto: 1 } };
    const small = { estimate: 1, priority: 10 };
    const three = [{ provider: 'claude', stima: 1 }, { provider: 'claude', stima: 1 }, { provider: 'fable', stima: 1 }];
    expect(P.fitsOn('sonnet', small, { budget: full, live: three, config })).toBe(false);
    expect(P.fitsOn('sonnet', small, { budget: full, live: three.slice(1), config })).toBe(true);
    // agy: uno solo, anche se è di un altro modello.
    const agy = { 'agy-sonnet': { residuo: 90, sessione: 100, slot: 1, tetto: 1 } };
    expect(P.fitsOn('agy-sonnet', small, { budget: agy, live: [{ provider: 'argon', stima: 1 }], config })).toBe(false);
    expect(P.fitsOn('agy-sonnet', small, { budget: agy, live: [], config })).toBe(true);
  });

  it.each(['low', 'medium', 'high', 'extra', 'xhigh', 'max'])('la riga Pipeline legge e riscrive lo sforzo %s', (sforzo) => {
    const line = `claude · sforzo ${sforzo} · stima 4% · approvato · priorità 9`;
    expect(P.parsePipelineLine(line)).toMatchObject({ provider: 'claude', sforzo, estimate: 4, approved: true, priority: 9 });
    const text = `### T1 · Uno — \`da fare\`\n- Pipeline: ${line}\n`;
    expect(S().setPipelineLine(text, 'T1', (i) => ({ ...i, priority: 2 }))).toContain(`- Pipeline: claude · sforzo ${sforzo} · stima 4% · approvato · priorità 2`);
  });

  it("uno sforzo sconosciuto non entra e la riga senza sforzo resta com'era", () => {
    expect(P.parsePipelineLine('claude · sforzo enorme · stima 4%')).not.toHaveProperty('sforzo');
    expect(P.parsePipelineLine('claude · stima 4%')).not.toHaveProperty('sforzo');
    expect(S().setPipelineLine('### T1 · Uno — `da fare`\n- Pipeline: gemini · stima 4% · priorità 3\n', 'T1', (i) => i)).toContain('- Pipeline: gemini · stima 4% · priorità 3');
    expect(() => S().normalizeEffort('enorme')).toThrow(/Sforzo non valido/);
  });

  it('assegna: --sforzo, il token sforzo, il predefinito, lo sforzo di prima', () => {
    expect(S().parseAssignArgs(['T1', 'sonnet', '2', '7', '--sforzo', 'max', '--approva'])).toEqual({ id: 'T1', provider: 'sonnet', stima: '2', priorita: '7', sforzo: 'max', approva: true });
    expect(S().parseAssignArgs(['T1', 'sonnet', 'sforzo', 'extra', '2'])).toMatchObject({ provider: 'sonnet', stima: '2', priorita: undefined, sforzo: 'extra', approva: false });
    expect(S().parseAssignArgs(['T1', 'claude', '2']).sforzo).toBeUndefined();
    expect(() => S().parseAssignArgs(['T1', 'claude', '2', '--sforzo'])).toThrow(/Sforzo non valido/);
    expect(() => S().parseAssignArgs(['T1', 'claude', '2', '--sforzo', 'enorme'])).toThrow(/Sforzo non valido/);

    const repo = sandbox();
    const backlog = () => fs.readFileSync(path.join(repo, 'docs', 'plans', 'backlog.md'), 'utf8');
    // Mai uno sforzo: il predefinito dell'autore.
    expect(config.sforzoPredefinito).toBe('high');
    expect(S().assignTask('T1', { provider: 'claude', stima: 3 }, { repo })).toMatchObject({ sforzo: 'high', modello: 'Opus 5.5' });
    expect(backlog()).toContain('- Pipeline: claude · sforzo high · stima 3% · priorità 100');
    // Chiesto: vale. Non chiesto: resta quello di prima, anche cambiando provider.
    S().assignTask('T1', { provider: 'claude', stima: 3, sforzo: 'extra' }, { repo });
    expect(backlog()).toContain('- Pipeline: claude · sforzo extra · stima 3%');
    expect(S().assignTask('T2', { provider: 'sonnet', stima: 1 }, { repo }).sforzo).toBe('max');
    expect(backlog()).toContain('- Pipeline: sonnet · sforzo max · stima 1% · approvato · priorità 5');
    expect(() => S().assignTask('T2', { provider: 'claude', stima: 1, sforzo: 'enorme' }, { repo })).toThrow(/Sforzo non valido/);
    expect(backlog()).toContain('- Pipeline: sonnet · sforzo max');
    // approva non lo perde.
    S().approveTasks(['T1'], { repo });
    expect(backlog()).toContain('- Pipeline: claude · sforzo extra · stima 3% · approvato');
  });

  it('al lancio: --effort sulla CLI di Claude, extra diventa xhigh, anche riprendendo', () => {
    const args = (provider: string, sforzo?: string) => S().launchArgs({ id: 'T1', provider, sforzo }, { dir: '.' }, { resume: false, config });
    const effort = (a: string[]) => (a.includes('--effort') ? a[a.indexOf('--effort') + 1] : undefined);
    for (const p of ['claude', 'sonnet', 'haiku', 'fable']) {
      expect(effort(args(p, 'max'))).toBe('max');
      expect(effort(args(p, 'extra'))).toBe('xhigh');
      expect(effort(args(p, 'xhigh'))).toBe('xhigh');
      expect(effort(args(p, 'low'))).toBe('low');
      expect(args(p)).not.toContain('--effort');
    }
    // Il prompt non è toccato: -p resta seguito dal suo argomento.
    const a = args('claude', 'max');
    expect(a.indexOf('-p')).toBe(a.length - 2);
    // Il provider può dirlo in config.json; il task lo scavalca; la ripresa lo ripete.
    const conProvider = structuredClone(config);
    conProvider.providers.sonnet.sforzo = 'medium';
    expect(effort(S().launchArgs({ id: 'T1', provider: 'sonnet' }, {}, { resume: false, config: conProvider }))).toBe('medium');
    expect(effort(S().launchArgs({ id: 'T1', provider: 'sonnet', sforzo: 'max' }, {}, { resume: false, config: conProvider }))).toBe('max');
    const ripresa = S().launchArgs({ id: 'T1', provider: 'claude' }, { sessione: 'sid', sforzo: 'extra' }, { resume: true, config });
    expect(effort(ripresa)).toBe('xhigh');
    expect(ripresa).toContain('--resume');
  });

  it('al lancio: il suffisso del modello su agy, senza --effort', () => {
    const model = (provider: string, sforzo?: string) => {
      const a = S().launchArgs({ id: 'T1', provider, sforzo }, {}, { resume: false, config });
      expect(a).not.toContain('--effort');
      return a[a.indexOf('--model') + 1];
    };
    expect(model('argon', 'low')).toBe('gemini-4-argon-low');
    expect(model('gemini', 'medium')).toBe('gemini-3.8-flash-medium');
    expect(model('agy-opus', 'low')).toBe('claude-opus-5-5-low');
    expect(model('agy-sonnet', 'medium')).toBe('claude-sonnet-5-5-medium');
    for (const s of ['high', 'extra', 'xhigh', 'max']) expect(model('agy-opus', s)).toBe('claude-opus-5-5-high');
    expect(model('argon')).toBe('gemini-4-argon-high');
    // config.json non si tocca.
    expect(config.providers.argon.args).toContain('gemini-4-argon-high');
  });

  it('launch passa lo sforzo alla CLI e lo registra nella corsa', async () => {
    const repo = sandbox();
    const calls: { cmd: string; args: string[] }[] = [];
    const spawn = (cmd: string, args: string[]) => {
      calls.push({ cmd, args });
      const handlers: Record<string, (x?: unknown) => void> = {};
      setTimeout(() => handlers.close?.(0), 0);
      return { pid: 1234, on: (e: string, f: (x?: unknown) => void) => { handlers[e] = f; }, unref() {} };
    };
    const run: any = { id: 'T2', provider: 'sonnet', dir: repo, tentativi: 1 };
    await S().launch({ id: 'T2', provider: 'sonnet', sforzo: 'extra', deps: [] }, run, () => {}, { spawn, logs: path.join(repo, 'log'), config, repo });
    expect(run.sforzo).toBe('extra');
    expect(calls[0].cmd).toBe('claude');
    expect(calls[0].args).toEqual(expect.arrayContaining(['--effort', 'xhigh', '--model', 'claude-sonnet-5-5']));
  });

  it("consumi.jsonl registra lo sforzo solo se c'è", () => {
    const run = { id: 'T2', provider: 'sonnet', sforzo: 'max', stima: 2, prima: { settimana: 90 }, inizio: '2026-11-05T10:00:00Z', fine: '2026-11-05T10:30:00Z', tentativi: 1, esito: 'ESITO: fatto' };
    expect(S().consumptionRow(run, { cost: 1.5 }, { settimana: 88 }, config)).toMatchObject({ task: 'T2', provider: 'sonnet', sforzo: 'max', piano: config.abbonamenti.claude, stima: 2, costoUsd: 1.5, minuti: 30 });
    expect(S().consumptionRow({ ...run, sforzo: undefined }, {}, undefined, config)).not.toHaveProperty('sforzo');
  });

  it('PIANO.md dice modello e sforzo accanto a provider e stima', () => {
    const repo = sandbox();
    const stateDir = path.join(repo, 'stato');
    fs.mkdirSync(stateDir, { recursive: true });
    const q = { inCorso: [], daIntegrare: [], pronti: [{ id: 'T2', title: 'Due', provider: 'sonnet', sforzo: 'max', estimate: 2 }, { id: 'T1', title: 'Uno', provider: 'claude', estimate: 3 }], daApprovare: [], daStimare: [], bloccati: [], inAttesa: [] };
    S().writePlan(q, { claude: { residuo: 50 } }, { stateDir, config });
    const text = fs.readFileSync(path.join(stateDir, 'PIANO.md'), 'utf8');
    expect(text).toContain('**T2** Due — sonnet (Sonnet 5.5), sforzo max, 2 %');
    expect(text).toContain('**T1** Uno — claude (Opus 5.5), 3 %');
    expect(text).toContain('**claude** (Opus 5.5)');
  });

  it('la pagina web offre ogni provider col suo modello e lo sforzo, e /api/assegna lo scrive', async () => {
    const url = pathToFileURL(path.resolve(__dirname, '../tools/pipeline/web.mjs')).href;
    const W = (await import(/* @vite-ignore */ url)) as { renderHtml(): string; handleApi(m: string, p: string, b: unknown, o: unknown): { status: number; data: any } };
    const html = W.renderHtml();
    for (const p of NUOVI) expect(html).toContain(`<option value="${p}">`);
    expect(html).toContain('<option value="claude">claude (Opus 5.5)</option>');
    expect(html).toContain('id="modal-sforzo"');
    expect(html).toContain('<option value="extra">extra</option>');
    const repo = sandbox();
    const res = W.handleApi('POST', '/api/assegna', { id: 'T1', provider: 'haiku', stima: 1, sforzo: 'medium' }, { repo });
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({ sforzo: 'medium', modello: 'Haiku 5.5' });
    expect(W.handleApi('POST', '/api/assegna', { id: 'T1', provider: 'haiku', stima: 1, sforzo: 'enorme' }, { repo }).status).toBe(400);
  });
});
