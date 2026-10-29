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
  usageLimit(output: string): Date | undefined;
  readOutput(text: string): { session?: string; cost?: number; error: boolean; result: string; outcome?: string };
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
});

describe('readOutput', () => {
  const json = { type: 'result', is_error: false, session_id: 'abc-123', total_cost_usd: 0.42, result: 'Fatto il lavoro.\n\nESITO: fatto — test della pipeline\n' };

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
