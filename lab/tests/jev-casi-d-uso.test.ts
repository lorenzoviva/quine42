// The use cases of TypeSafe (T325) without network or keys: the case files hold together, every recorded request is cut into its parts and
// put back together character by character, the routes of the guardrails and the decision of a line reused, the choice of the context and
// the request it thins, the trials and the measure run offline, the caps stop the calls, and a key never reaches the ledger.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Budget, JevJudge, readLedger, runBench, type Answer } from '../banco/jev/banco';
import { cut, cutPrompt, cutSystem, estimateCounter, familyOf, FAMILIES, geminiCounter, hashOf, hourCalls, hourTable, measure, partsHour, rejoin, PARTS } from '../banco/jev/casi-d-uso/contesto';
import { GUARD_QUESTIONS, guardRoute, reuseDecision } from '../banco/jev/casi-d-uso/domande';
import { loadUseCases, runTrials } from '../banco/jev/casi-d-uso/prove';
import { candidates, CUTS, loadChoiceCases, runChoice, selectionOf, selectionQuestions, thinned } from '../banco/jev/casi-d-uso/scelta';
import { RecordingModels, type RecordedCall } from '../banco/jev/casi-d-uso/registratore';
import { reuseFromLedger, reportText } from '../banco/jev/casi-d-uso/rapporto';
import { runContext } from '../banco/jev/casi-d-uso/misura';
import { COUNCIL_PRINCIPLES } from '../../src/kernel/fourthwall';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'jev-casi-d-uso-'));
const cases = loadUseCases();
const choices = loadChoiceCases();
const quiet = () => {};

describe('i casi delle prove di T325', () => {
  it('le guardie: 63 testi dalle quattro porte, una risposta giusta per ogni pericolo', () => {
    const guard = cases.filter((c) => c.group === ('guardia' as never));
    expect(guard.length).toBe(63);
    for (const c of guard) {
      expect(['parole', 'altro', 'fabbrica', 'referente']).toContain((c.state as { channel: string }).channel);
      expect(Object.keys(c.expected).sort()).toEqual(GUARD_QUESTIONS.map((q) => q.id).sort());
      for (const v of Object.values(c.expected)) expect(typeof v).toBe('boolean');
    }
    // Almost half of them are of the world, the tricky ones included: a guard that stops them would be wrong.
    expect(guard.filter((c) => Object.values(c.expected).every((v) => !v)).length).toBeGreaterThan(25);
  });

  it('le battute: la domanda uguale è una dell’archivio o nessuna, e si riusa solo una battuta della stessa domanda', () => {
    const lines = cases.filter((c) => c.group === ('battute' as never));
    expect(lines.length).toBe(46);
    for (const c of lines) {
      const ids = (c.state as { archive: Array<{ id: string }> }).archive.map((l) => l.id);
      const same = (c.expected.same as string[])[0];
      expect([...ids, 'none']).toContain(same);
      const reuse = (c as unknown as { reuse: string }).reuse;
      for (const id of ids) expect(c.expected[`fits_${id}`]).toBe(id === reuse);
      if (reuse !== 'none') expect(reuse).toBe(same);
      // One Choice and a companion Noul per line of the archive.
      expect(c.questions.length).toBe(ids.length + 1);
      expect(Object.keys((c.questions[0] as { criteria: Record<string, unknown> }).criteria)).toEqual([...ids, 'none']);
    }
    expect(lines.filter((c) => (c as unknown as { reuse: string }).reuse !== 'none').length).toBe(24);
  });

  it('la scelta del contesto: richieste vere del Concilio, con i principi e il contesto dell’agente', () => {
    expect(choices.length).toBeGreaterThanOrEqual(20);
    for (const c of choices) {
      expect(c.system).toContain(COUNCIL_PRINCIPLES);
      expect(c.context && c.system.includes(c.context)).toBe(true);
      expect(Object.keys(candidates(c)).length).toBeGreaterThan(0);
    }
  });
});

describe('il taglio delle richieste', () => {
  it('ogni richiesta registrata torna intera, carattere per carattere, dai suoi pezzi', () => {
    for (const c of choices) {
      expect(rejoin(cutSystem(c.system, c.context), '\n\n')).toBe(c.system);
      expect(rejoin(cutPrompt(c.prompt), '\n')).toBe(c.prompt);
    }
  });

  it('una battuta del Narratore: ruolo, principi, canone, lessico, regole e focus nel system; la frase del viandante è la richiesta', () => {
    const c = choices.find((x) => x.task === 'npc.reply' && x.agent === 'narrator')!;
    const parts = new Set([...cutSystem(c.system, c.context), ...cutPrompt(c.prompt)].map((p) => p.part));
    for (const p of ['ruolo', 'principi', 'canone', 'lessico', 'grafo', 'richiesta', 'persona', 'stato'] as const) expect(parts.has(p), p).toBe(true);
    const request = cutPrompt(c.prompt).filter((p) => p.part === 'richiesta').map((p) => p.text).join('\n');
    expect(request).toMatch(/^Il viandante dice: «/);
    // The focus is never in the prefix the cache serves; the agent's context is.
    const sys = cutSystem(c.system, c.context);
    expect(sys.find((p) => p.part === 'grafo')!.prefix).toBe(false);
    expect(sys.find((p) => p.part === 'canone')!.prefix).toBe(true);
  });

  it('un elenco di ciò che esiste dentro una riga va al catalogo, e la riga si ricompone', () => {
    // As craft.judge writes it: the request, then the tools that exist, then the instruction, on one line.
    const prompt = 'Il giocatore prova a combinare «Corda» con «Ramo». Ha senso? Strumenti già esistenti: Pane, Vino, Lanterna. Sii severo: la maggior parte non produce nulla.';
    const pieces = cutPrompt(prompt);
    expect(pieces.find((p) => p.part === 'catalogo')!.text).toBe('Pane, Vino, Lanterna.');
    expect(pieces[0].part).toBe('richiesta');
    expect(rejoin(pieces, '\n')).toBe(prompt);
    // At the start of a line the list is a line of the catalog of its own.
    expect(cutPrompt('Inventa 16 oggetti.\nEsistono già (non ripeterli): Pane, Vino.').map((p) => p.part)).toEqual(['compito', 'catalogo']);
  });

  it('le famiglie sommano i token in ingresso; il conteggio offline è una stima', async () => {
    const call: RecordedCall = { universe: 'prova', n: 0, agent: 'narrator', task: 'npc.reply', system: `# Il Narratore\n\n${COUNCIL_PRINCIPLES}\n\n## Il mondo\nTitolo: Prova`, prompt: 'Interpreta questo personaggio.\n\nIl viandante dice: «Ciao»', images: 0 };
    const [m] = await measure([call], estimateCounter);
    expect(FAMILIES.reduce((s, f) => s + familyOf(m, f), 0)).toBe(m.input);
    expect(m.parts.richiesta).toBeGreaterThan(0);
    expect(m.parts.bibbia).toBeGreaterThan(0);
    for (const p of Object.keys(m.parts)) expect(Object.keys(PARTS)).toContain(p);
  });

  it('countTokens di Gemini: la chiave solo nell’intestazione, e un testo già contato non si chiede di nuovo', async () => {
    const key = 'chiave-gemini-finta';
    const asked: string[] = [];
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      asked.push(String((init.headers as Record<string, string>)['x-goog-api-key']));
      const text = JSON.parse(String(init.body)).contents[0].parts[0].text as string;
      return new Response(JSON.stringify({ totalTokens: Math.ceil(text.length / 3) }), { status: 200 });
    }) as unknown as typeof fetch;
    const cache: Record<string, number> = {};
    const counter = geminiCounter(key, cache, undefined, fetchImpl);
    expect(await counter.count(['uno due tre', 'quattro', 'uno due tre'])).toEqual([4, 3, 4]);
    expect(asked.length).toBeLessThanOrEqual(3);
    await counter.count(['uno due tre']);
    expect(asked.every((h) => h === key)).toBe(true);
    expect(cache[hashOf('uno due tre')]).toBe(4);
    expect(JSON.stringify(cache)).not.toContain(key);
  });
});

describe('le decisioni', () => {
  it('le guardie: il senza senso e il mondo reale ai modelli locali, gli ordini isolati, il codice nello studio passa', () => {
    expect(guardRoute('parole', { nonsense: 0.9 })).toBe('locale');
    expect(guardRoute('parole', { outside: 0.8 })).toBe('locale');
    expect(guardRoute('parole', { meta: 0.8 })).toBe('locale');
    expect(guardRoute('referente', { meta: 0.95 })).toBe('passa');
    expect(guardRoute('altro', { steers: 0.75 })).toBe('isola');
    expect(guardRoute('parole', { steers: 0.6, meta: 0.6 })).toBe('passa');
  });

  it('una battuta si riusa solo se la Choice la sceglie e la sua Noul compagna dice che vale ancora', () => {
    const a = (v: string, p: Record<string, number>, fits: number): Record<string, Answer> => ({ same: { type: 'choice', value: v, probabilities: p }, [`fits_${v}`]: { type: 'noul', value: fits >= 0.5, p: fits } });
    expect(reuseDecision(a('b1', { b1: 0.9, none: 0.1 }, 0.8), ['b1', 'b2'])).toBe('b1');
    expect(reuseDecision(a('b1', { b1: 0.9, none: 0.1 }, 0.3), ['b1', 'b2'])).toBe('none');
    expect(reuseDecision(a('none', { none: 0.9 }, 0.9), ['b1'])).toBe('none');
    expect(reuseDecision(a('b2', { b2: 0.4, b1: 0.35, none: 0.25 }, 0.9), ['b1', 'b2'])).toBe('none');
    // From the ledger: the Choice's probability is in `top`, the Noul's in `p`.
    expect(reuseFromLedger({ provider: 'typesafe', answers: { same: { v: 'b1', top: [['b1', 0.8]] }, fits_b1: { v: true, p: 0.7 } } } as never, 0.5, 0.5)).toBe('b1');
    expect(reuseFromLedger({ provider: 'typesafe', answers: { same: { v: 'b1', top: [['b1', 0.8]] }, fits_b1: { v: true, p: 0.7 } } } as never, 0.5, 0.8)).toBe('none');
  });

  it('la scelta del contesto: una Choice per parte e la Noul compagna; il taglio tiene per probabilità, la Noul bassa toglie la parte', () => {
    const c = choices.find((x) => x.task === 'npc.reply')!;
    const cands = candidates(c);
    const qs = selectionQuestions(cands);
    for (const part of Object.keys(cands)) {
      expect(qs.some((q) => q.id === `pick_${part}` && q.type === 'choice')).toBe(true);
      expect(qs.some((q) => q.id === `need_${part}` && q.type === 'noul')).toBe(true);
    }
    for (const q of qs) if (q.type === 'choice') expect(Object.keys(q.criteria).length).toBeLessThanOrEqual(250);
    const canon = cands.canon.map((l) => l.id);
    const answers: Record<string, Answer> = {
      pick_canon: { type: 'choice', value: canon[0], probabilities: Object.fromEntries(canon.map((id, i) => [id, i === 0 ? 0.6 : i === 1 ? 0.3 : 0.1 / (canon.length - 2)])) },
      need_canon: { type: 'noul', value: true, p: 0.9 },
      need_lexicon: { type: 'noul', value: false, p: 0.1 },
    };
    const s = selectionOf(cands, answers, CUTS.stretto);
    expect(s.kept.canon.slice(0, 2)).toEqual([canon[0], canon[1]]);
    expect(s.kept.canon.length).toBeGreaterThanOrEqual(CUTS.stretto.min);
    expect(s.kept.lexicon).toEqual([]);
  });

  it('la richiesta assottigliata: tutto tenuto è la richiesta di prima; un modulo del catalogo va o resta in ogni elenco che lo nomina', () => {
    for (const c of choices) {
      const cands = candidates(c);
      const all = thinned(c, { kept: Object.fromEntries(Object.entries(cands).map(([k, ls]) => [k, ls.map((l) => l.id)])) });
      expect(all.system).toBe(c.system);
      expect(all.prompt).toBe(c.prompt);
    }
    const plan = choices.find((x) => x.task === 'chunk.plan')!;
    const mods = candidates(plan).catalog.map((l) => l.id);
    const keep = mods.slice(0, 2);
    const t = thinned(plan, { kept: { catalog: keep } });
    for (const m of mods) {
      const listed = (t.system + t.prompt).includes(`- ${m} «`);
      expect(listed, m).toBe(keep.includes(m));
    }
    expect(t.system.length + t.prompt.length).toBeLessThan(plan.system.length + plan.prompt.length);
  });
});

describe('le prove senza chiavi', () => {
  it('le guardie e le battute girano offline e scrivono il registro e il riepilogo senza spendere', async () => {
    const dir = tmp();
    const ledger = path.join(dir, 'consumi.jsonl');
    const lines = await runTrials({ groups: ['guardia', 'battute'], models: ['jev-1.13.0', 'gemini-3.1-flash-lite'], cases: [], run: 'prova', offline: true, caps: { typesafe: 0.5, gemini: 0.8 }, ledger, log: quiet });
    expect(lines.length).toBe(2 * (63 + 46));
    expect(lines.every((l) => l.usd === 0 && l.ok)).toBe(true);
    const text = reportText({ lines: readLedger(ledger), choice: [], guard: cases.filter((c) => c.group === ('guardia' as never)) as never, reuse: cases.filter((c) => c.group === ('battute' as never)) as never });
    expect(text).toContain('## 2a. Le guardie');
    expect(text).toContain('jev-1.13.0');
  });

  it('la scelta del contesto gira offline: le due richieste, la scelta, i giudici, i risultati', async () => {
    const dir = tmp();
    const results = path.join(dir, 'scelta.json');
    const ids = [choices.find((c) => c.task === 'npc.reply')!.id, choices.find((c) => c.task === 'chunk.plan')!.id];
    const lines = await runChoice({ run: 'prova', cases: ids, offline: true, ledger: path.join(dir, 'consumi.jsonl'), budget: new Budget({ typesafe: 0.5, gemini: 0.8 }, []), log: quiet, results });
    expect(lines.filter((l) => l.variant === 'intero').length).toBe(2);
    expect(lines.filter((l) => l.variant === 'scelto').length).toBe(2);
    const out = JSON.parse(fs.readFileSync(results, 'utf8')).results;
    expect(out.map((r: { id: string }) => r.id).sort()).toEqual([...ids].sort());
    for (const r of out) expect(r.thin.input).toBeLessThanOrEqual(r.full.input);
  });

  it('il tetto ferma le chiamate e lo dice nel registro', async () => {
    const dir = tmp();
    const ledger = path.join(dir, 'consumi.jsonl');
    const fetchImpl = (async () => new Response('{}', { status: 500 })) as unknown as typeof fetch;
    const judge = new JevJudge({ key: 'k', model: 'jev-1.13.0', fetchImpl });
    const lines = await runBench({ run: 'tetto', judges: [judge], cases: cases.slice(0, 3), ledger, budget: new Budget({ typesafe: 0 }, []) });
    expect(lines.every((l) => l.error === 'tetto')).toBe(true);
  });

  it('la chiave di TypeSafe va solo nell’intestazione, mai nel registro', async () => {
    const dir = tmp();
    const ledger = path.join(dir, 'consumi.jsonl');
    const key = 'chiave-typesafe-finta-mai-nel-registro';
    const seen: string[] = [];
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      seen.push(String((init.headers as Record<string, string>).Authorization));
      const body = JSON.parse(String(init.body));
      const answers = Object.fromEntries(Object.entries(body.questions as Record<string, { type: string; criteria?: Record<string, unknown> }>).map(([id, q]) => [id, q.type === 'noul' ? { type: 'noul', noul: 0.2 } : { type: 'choice', choice: Object.keys(q.criteria ?? {})[0], confidence: 1, probabilities: { [Object.keys(q.criteria ?? {})[0]]: 1 } }]));
      return new Response(JSON.stringify({ model: body.model, answers, usage: { input_tokens: 800, output_tokens: 0 } }), { status: 200 });
    }) as unknown as typeof fetch;
    const lines = await runTrials({ groups: ['guardia'], models: ['jev-1.13.0'], cases: cases.filter((c) => c.group === ('guardia' as never)).slice(0, 4).map((c) => c.id), run: 'chiave', offline: false, typesafeKey: key, caps: { typesafe: 0.5, gemini: 0 }, ledger, log: quiet, fetchImpl });
    expect(lines.length).toBe(4);
    expect(seen.every((h) => h === `Bearer ${key}`)).toBe(true);
    expect(fs.readFileSync(ledger, 'utf8')).not.toContain(key);
    expect(lines[0].usd).toBeCloseTo((800 * 0.042) / 1e6, 10);
  });
});

describe('la spesa di oggi', () => {
  it('il registratore registra ogni chiamata con il contesto dell’agente e lascia rispondere i modelli locali, sotto un altro nome', async () => {
    const rec = new RecordingModels('prova');
    rec.contextOf = () => '## Il mondo\nTitolo: Prova';
    const out = await rec.text({ agent: 'narrator', task: 'text.examine', system: 'sistema', prompt: 'Il viandante osserva da vicino «Sasso» (un sasso).', data: { what: { name: 'Sasso', description: 'un sasso' }, facts: {} }, temperature: 0.9 });
    expect(rec.name).not.toBe('offline');
    expect(JSON.parse(out).testo).toBeTruthy();
    expect(rec.calls).toHaveLength(1);
    expect(rec.calls[0]).toMatchObject({ task: 'text.examine', context: '## Il mondo\nTitolo: Prova', temperature: 0.9 });
  });

  it('un’ora di gioco dalle misure: ogni compito del censimento fuori dalla Genesi ha una riga, il contesto non supera il tutto', async () => {
    const m = await measure(choices.map((c, n) => ({ universe: c.universe, n, agent: c.agent, task: c.task, system: c.system, prompt: c.prompt, ...(c.schema ? { schema: c.schema } : {}), images: 0, ...(c.context ? { context: c.context } : {}) })), estimateCounter);
    const hour = hourTable(m);
    expect(hour.length).toBe(hourCalls().length);
    for (const r of hour) {
      expect(r.usdContext).toBeLessThanOrEqual(r.usd);
      expect(r.usdWarm).toBeLessThanOrEqual(r.usdCached + 1e-12);
      expect(r.usdCached).toBeLessThanOrEqual(r.usd + 1e-12);
    }
    expect(partsHour(m).length).toBeGreaterThan(5);
  });

  it(
    'la misura gira offline su un universo, senza chiavi, e non tocca le misure vere',
    async () => {
      const dir = tmp();
      const out = path.join(dir, 'contesto.json');
      const real = path.resolve('lab/banco/jev/casi-d-uso/misure/contesto.json');
      const before = fs.existsSync(real) ? fs.readFileSync(real, 'utf8') : '';
      const r = await runContext({ universes: ['sidera'], offline: true, places: 2, out, log: quiet });
      expect(r.exact).toBe(false);
      expect(r.universes[0].calls).toBeGreaterThan(10);
      expect(r.hour.reduce((s, x) => s + x.usd, 0)).toBeGreaterThan(0);
      expect(fs.existsSync(out)).toBe(true);
      expect(fs.existsSync(real) ? fs.readFileSync(real, 'utf8') : '').toBe(before);
    },
    120_000,
  );
});

describe('ciò che le misure vere dicono (il registro e le misure committati)', () => {
  it('il registro di T325 sta nei tetti del task e nessuna riga contiene una chiave', () => {
    const file = path.resolve('lab/banco/jev/casi-d-uso/consumi.jsonl');
    if (!fs.existsSync(file)) return;
    const lines = readLedger(file);
    const spent = (p: string) => lines.filter((l) => l.provider === p).reduce((s, l) => s + l.usd, 0);
    expect(spent('typesafe')).toBeLessThanOrEqual(0.5);
    expect(spent('gemini')).toBeLessThanOrEqual(0.8);
    expect(fs.readFileSync(file, 'utf8')).not.toMatch(/AIza[0-9A-Za-z_-]{20,}|Bearer /);
  });

  it('ogni pezzo delle richieste misurate ha la sua famiglia', () => {
    const c = choices[0];
    for (const p of cut({ universe: c.universe, n: 0, agent: c.agent, task: c.task, system: c.system, prompt: c.prompt, images: 0, context: c.context })) expect(PARTS[p.part]).toBeTruthy();
  });
});
