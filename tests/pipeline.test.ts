import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The pipeline is a plain `.mjs` with no types: imported by a computed URL so tsc does not look for a declaration.
type Task = { id: string; title: string; status: string; deps: string[]; provider?: string; estimate?: number; approved?: boolean; priority?: number; parent?: string; needsBrowser?: boolean };
type Counter = { nome: string; finestra: '5h' | 'settimana'; residuo: number; reset?: string };
type Pipeline = {
  parseBacklog(text: string): Task[];
  parsePipelineLine(line: string): { provider?: string; estimate?: number; approved: boolean; priority: number; needsBrowser: boolean };
  taskNeedsBrowser(block: string): boolean;
  parseUsage(provider: string, text: string): Counter[] | undefined;
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

  it('dopo il reset uno slot in più, prima uno in meno, tra 0 e il tetto', () => {
    const reset = '2026-11-05T09:00:00Z';
    expect(P.nextSlot({ slot: 1, tetto: 3, previsione: '2026-11-06T00:00:00Z', reset })).toBe(2);
    expect(P.nextSlot({ slot: 1, tetto: 3, previsione: undefined, reset })).toBe(2); // non si consuma
    expect(P.nextSlot({ slot: 3, tetto: 3, previsione: '2026-11-06T00:00:00Z', reset })).toBe(3);
    expect(P.nextSlot({ slot: 2, tetto: 3, previsione: '2026-11-01T00:00:00Z', reset })).toBe(1);
    expect(P.nextSlot({ slot: 0, tetto: 3, previsione: '2026-11-01T00:00:00Z', reset })).toBe(0);
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
  parseQuestionFile(id: string, text: string): { id: string; items: { numero: number; domanda: string; risposta: string }[]; answered: boolean };
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

  it('renderHtml serve uno script inline sintatticamente valido senza errori di regex (T81)', () => {
    const html = W.renderHtml();
    const scriptMatch = /<script>([\s\S]*?)<\/script>/i.exec(html);
    expect(scriptMatch).not.toBeNull();
    const script = scriptMatch![1];
    expect(() => new Function(script)).not.toThrow();
  });

  it('assignTask impedisce l\'assegnazione a gemini o argon di un task con verifica nel browser (T87)', () => {
    const opts = makeSandbox();
    fsMod.appendFileSync(path.join(tmpRepo, 'docs', 'plans', 'backlog.md'), [
      '',
      '### T99 · Task con browser — `da fare`',
      '- Fare: correggi la vista',
      '- Fatto quando: verificare nel browser con ?dev',
      '',
    ].join('\n'));
    const badRes = W.handleApi('POST', '/api/assegna', { id: 'T99', provider: 'gemini', stima: 2, approva: false }, opts);
    expect(badRes.status).toBe(400);
    expect(badRes.data.error).toMatch(/richiede verifica nel browser/);
    expect(W.handleApi('POST', '/api/assegna', { id: 'T99', provider: 'claude', stima: 2, approva: false }, opts).status).toBe(200);
  });
});


// The turns of the heavy operations (ADR-0088): one browser verification and one full test suite at a time.
type Turns = {
  tryTurn(kind: string, me: { chi: string; pid: number; comando: string; arrivo?: number }, o: { dir: string; nowMs?: number; isAlive?: (pid: number) => boolean }): { taken: boolean; holder?: { chi: string; pid: number }; queued?: boolean };
  leaveTurn(kind: string, pid: number, o: { dir: string }): void;
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
        env: { ...process.env, PIPELINE_LOCK: dir, PIPELINE_TURNO_OGNI: '100', PIPELINE_TASK: name }, stdio: 'ignore',
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
