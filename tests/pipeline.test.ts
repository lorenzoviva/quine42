import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The pipeline is a plain `.mjs` with no types: imported by a computed URL so tsc does not look for a declaration.
type Task = { id: string; title: string; status: string; deps: string[]; provider?: string; estimate?: number; approved?: boolean; priority?: number; parent?: string };
type Counter = { nome: string; finestra: '5h' | 'settimana'; residuo: number; reset?: string };
type Pipeline = {
  parseBacklog(text: string): Task[];
  parsePipelineLine(line: string): { provider?: string; estimate?: number; approved: boolean; priority: number };
  parseUsage(provider: string, text: string): Counter[] | undefined;
  usageLimit(output: string, from?: Date): Date | undefined;
  readOutput(text: string): { session?: string; cost?: number; error: boolean; result: string; outcome?: string; browser?: string };
  capOf(o: { left: number; session?: number; provider: string; orchestrator?: string; max: number; threshold: number }): number;
  computeBudget(provider: string, conf?: unknown, counters?: Counter[]): { residuo: number; sessione: number };
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
    expect(P.parsePipelineLine('gemini · priorità 7 · stima 2.5 %')).toEqual({ provider: 'gemini', estimate: 2.5, approved: false, priority: 7 });
    expect(P.parsePipelineLine('Claude · Approvato')).toEqual({ provider: 'claude', estimate: undefined, approved: true, priority: 100 });
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
  const base = { max: 5, threshold: 10, orchestrator: 'claude' };

  it('sopra la soglia: fino a `max`', () => {
    expect(P.capOf({ ...base, left: 50, session: 80, provider: 'claude' })).toBe(5);
  });

  it('sotto la soglia: uno, nessuno sul provider dell\'orchestratore', () => {
    expect(P.capOf({ ...base, left: 8, provider: 'argon' })).toBe(1);
    expect(P.capOf({ ...base, left: 8, provider: 'claude' })).toBe(0);
    expect(P.capOf({ ...base, left: 50, session: 5, provider: 'claude' })).toBe(0);
    expect(P.capOf({ ...base, orchestrator: 'argon', left: 8, provider: 'argon' })).toBe(0);
    expect(P.capOf({ ...base, orchestrator: 'argon', left: 8, provider: 'claude' })).toBe(1);
  });

  it('per Argon (senza 5h) le soglie dei task si basano sul limite settimanale', () => {
    expect(P.capOf({ ...base, left: 28, provider: 'argon' })).toBe(5);
    expect(P.capOf({ ...base, orchestrator: 'argon', left: 28, provider: 'argon' })).toBe(5);
    // Sotto la soglia (8%): 1 se non è orchestratore, 0 se è orchestratore
    expect(P.capOf({ ...base, left: 8, provider: 'argon' })).toBe(1);
    expect(P.capOf({ ...base, orchestrator: 'argon', left: 8, provider: 'argon' })).toBe(0);
    // Anche se un vecchio stato passasse session: 100, per Argon vale il residuo settimanale (left)
    expect(P.capOf({ ...base, left: 8, session: 100, provider: 'argon' })).toBe(1);
    expect(P.capOf({ ...base, orchestrator: 'argon', left: 8, session: 100, provider: 'argon' })).toBe(0);
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
});

