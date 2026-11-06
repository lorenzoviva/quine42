// The Jev bench (T313) without network or keys: the case files hold together, the offline mode runs every case and writes the ledger and
// the report, the caps stop the calls, the same questions go to both judges, and a key never reaches the ledger.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Budget, GeminiJudge, JevJudge, jevBody, loadCases, OfflineJudge, readLedger, reversed, runBench, spent, typedAnswers, typedPrompt, type Case, type Judge, type Reply } from '../banco/jev/banco';
import { second, SECOND } from '../banco/jev/domande';
import { reportText } from '../banco/jev/rapporto';
import type { AiModels, TextCall } from '../../src/kernel/ai/models';
import { emptyUsage } from '../../src/kernel/ai/models';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'jev-banco-'));
const cases = loadCases();

describe('i casi del banco di Jev', () => {
  it('ci sono i tre gruppi, e ogni risposta giusta è una delle risposte possibili', () => {
    const groups = new Set(cases.map((c) => c.group));
    expect([...groups].sort()).toEqual(['decisioni', 'scultura', 'vita']);
    expect(cases.length).toBeGreaterThan(300);
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    for (const c of cases) {
      const ids = new Set(c.questions.map((q) => q.id));
      for (const [q, e] of Object.entries(c.expected)) {
        expect(ids.has(q), `${c.id}: ${q}`).toBe(true);
        const question = c.questions.find((x) => x.id === q)!;
        if (question.type === 'choice') for (const k of e as string[]) expect(Object.keys(question.criteria), `${c.id}: ${q} = ${k}`).toContain(k);
        if (question.type === 'noul') expect(typeof e).toBe('boolean');
        if (question.type === 'score') expect(question.criteria.length).toBeGreaterThan(Number(e));
      }
      // What the kernel does today is one of the options too.
      for (const [q, r] of Object.entries(c.rule ?? {})) {
        const question = c.questions.find((x) => x.id === q)!;
        if (question.type === 'choice') expect(Object.keys(question.criteria), `${c.id}: regola ${q}`).toContain(String(r));
      }
      // A Choice of TypeSafe takes at most 255 options.
      for (const q of c.questions) if (q.type === 'choice') expect(Object.keys(q.criteria).length).toBeLessThanOrEqual(255);
    }
  });

  it('Jev e Gemini ricevono lo stesso stato e le stesse domande, con le stesse opzioni', () => {
    const c = cases.find((x) => x.id === 'azione/forza-cassa')!;
    const body = jevBody(c, 'jev-1.13.0') as { state: unknown; questions: Record<string, { type: string; criteria?: Record<string, unknown> }> };
    const { prompt, schema } = typedPrompt(c);
    expect(body.state).toEqual(c.state);
    expect(prompt).toContain(JSON.stringify(c.state, null, 1));
    for (const q of c.questions) {
      expect(body.questions[q.id].type).toBe(q.type);
      if (q.type === 'choice') expect(schema.properties![q.id].enum).toEqual(Object.keys(q.criteria));
      if (q.type === 'noul') expect(schema.properties![q.id].type).toBe('BOOLEAN');
    }
    expect(typedAnswers({ possible: true, effect: 'open', requires: 'Coltello', repeatable: false }, c)).toMatchObject({ possible: { value: true }, effect: { value: 'open' }, repeatable: { value: false } });
  });

  it('le opzioni al contrario cambiano solo l’ordine; le domande-2 compongono la decisione dai quattro Noul', () => {
    const c = cases.find((x) => x.kind === 'referente')!;
    const r = reversed(c);
    const team = (k: Case) => Object.keys((k.questions.find((q) => q.id === 'team') as { criteria: Record<string, unknown> }).criteria);
    expect(team(r)).toEqual([...team(c)].reverse());
    const wall = cases.find((x) => x.kind === 'quarta-parete')!;
    expect(second(wall).questions.map((q) => q.id)).toEqual(['meta', 'legend', 'doubles', 'roles']);
    const d = SECOND['quarta-parete'].derive(wall, { meta: { type: 'noul', value: false, p: 0.2 }, legend: { type: 'noul', value: true, p: 0.7 }, doubles: { type: 'noul', value: false, p: 0.1 }, roles: { type: 'noul', value: false, p: 0.3 } });
    expect(d.breaks).toMatchObject({ value: true, p: 0.7 });
  });
});

describe('la modalità offline', () => {
  it('fa girare ogni caso, scrive il registro e il riepilogo senza spendere', async () => {
    const dir = tmp();
    const ledger = path.join(dir, 'consumi.jsonl');
    const lines = await runBench({ run: 'prova', judges: [new OfflineJudge('jev-1.13.0'), new OfflineJudge('gemini-3.1-flash-lite')], cases, ledger, budget: new Budget({ typesafe: 3, gemini: 1 }, []) });
    expect(lines).toHaveLength(cases.length * 2);
    expect(lines.every((l) => l.ok && l.usd === 0 && l.provider === 'offline')).toBe(true);
    expect(readLedger(ledger)).toHaveLength(cases.length * 2);
    // Fake answers are right four times in five, the same every time.
    const right = lines.flatMap((l) => Object.values(l.right ?? {}));
    expect(right.filter(Boolean).length / right.length).toBeGreaterThan(0.6);
    const again = await runBench({ run: 'prova', judges: [new OfflineJudge('jev-1.13.0')], cases: cases.slice(0, 20), budget: new Budget({}, []), dry: true });
    expect(again.map((l) => l.answers)).toEqual(lines.slice(0, 20).map((l) => l.answers));
    // The report leaves the fake lines out: there is nothing real to tell.
    expect(reportText(lines)).toContain('Righe del registro: 0');
  });

  it('il tetto ferma le chiamate e lo dice nel registro', async () => {
    let calls = 0;
    const priced: Judge = {
      provider: 'gemini',
      label: 'caro',
      estimate: () => 0.4,
      cost: () => 0.4,
      ask: async (c: Case): Promise<Reply> => {
        calls++;
        return new OfflineJudge('caro').ask(c);
      },
    };
    const lines = await runBench({ run: 'tetto', judges: [priced], cases: cases.slice(0, 5), budget: new Budget({ gemini: 1 }, []), dry: true, concurrency: 1 });
    expect(calls).toBe(2);
    expect(lines.filter((l) => l.error === 'tetto')).toHaveLength(3);
    expect(spent(lines).gemini).toBeCloseTo(0.8);
    // The cap is summed over the whole ledger: what was spent before counts.
    const before = [{ ...lines[0], usd: 0.9 }];
    const more = await runBench({ run: 'tetto', judges: [priced], cases: cases.slice(0, 2), budget: new Budget({ gemini: 1 }, before), dry: true });
    expect(more.every((l) => l.error === 'tetto')).toBe(true);
  });

  it('la chiave di TypeSafe va solo nell’intestazione, mai nel registro', async () => {
    const dir = tmp();
    const ledger = path.join(dir, 'consumi.jsonl');
    const key = 'chiave-finta-mai-nel-registro';
    const seen: string[] = [];
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      seen.push(String((init.headers as Record<string, string>).Authorization));
      const body = JSON.parse(String(init.body));
      const answers = Object.fromEntries(Object.entries(body.questions as Record<string, { type: string; criteria?: Record<string, unknown> | unknown[] }>).map(([id, q]) => [id, q.type === 'noul' ? { type: 'noul', noul: 0.9 } : q.type === 'choice' ? { type: 'choice', choice: Object.keys(q.criteria as object)[0], confidence: 1, probabilities: { [Object.keys(q.criteria as object)[0]]: 1 } } : { type: 'score', score: 1, confidence: 1, probabilities: { 0: 0, 1: 1 }, legend: {} }]));
      return new Response(JSON.stringify({ model: body.model, answers, usage: { input_tokens: 500, output_tokens: 10 } }), { status: 200 });
    }) as unknown as typeof fetch;
    const judge = new JevJudge({ key, model: 'jev-1.13.0', fetchImpl });
    const lines = await runBench({ run: 'chiave', judges: [judge], cases: cases.filter((c) => c.kind === 'referente').slice(0, 3), ledger, budget: new Budget({ typesafe: 3 }, []) });
    expect(seen.every((h) => h === `Bearer ${key}`)).toBe(true);
    expect(fs.readFileSync(ledger, 'utf8')).not.toContain(key);
    expect(lines[0].usd).toBeCloseTo((500 * 0.042) / 1e6, 10);
  });

  it('Gemini con le stesse domande: lo schema chiude le risposte alle opzioni, i token vengono dal registro del modello', async () => {
    const calls: TextCall[] = [];
    const models = (): AiModels => {
      const m: AiModels = {
        name: 'finto',
        usage: emptyUsage(),
        limits: { text: Infinity },
        text: async (call: TextCall) => {
          calls.push(call);
          m.onCall?.({ model: 'gemini-3.1-flash-lite', agent: call.agent, task: call.task, prompt: 800, cached: 0, output: 30, thoughts: 100 });
          return JSON.stringify({ team: 'oggetto', refuse: false });
        },
      };
      return m;
    };
    const judge = new GeminiJudge({ model: 'gemini-3.1-flash-lite', models });
    const c = cases.find((x) => x.id === 'referente/spada')!;
    const r = await judge.ask(c);
    expect(r.answers).toMatchObject({ team: { value: 'oggetto' }, refuse: { value: false } });
    expect(calls[0].schema?.properties?.team.enum).toContain('oggetto');
    expect(judge.cost(r.usage)).toBeCloseTo((800 * 0.25 + 130 * 1.5) / 1e6, 10);
  });
});

describe('la spesa del banco riconciliata con la dashboard (T322)', () => {
  it('il calcolo della spesa di TypeSafe usa solo i token di input a 0,042 $/M con output gratuito', () => {
    const judge = new JevJudge({ key: 'test', model: 'jev-1.13.0' });
    expect(judge.cost({ input: 1_000_000, output: 50_000 })).toBeCloseTo(0.042, 6);
    expect(judge.cost({ input: 3_841_142, output: 440_789 })).toBeCloseTo(0.161327964, 6);
  });

  it('il registro reale riconcilia giro-1 ($0.1613) con la dashboard e l’intero registro ($0.1958)', () => {
    const lines = readLedger();
    expect(lines.length).toBeGreaterThan(0);

    const ts = lines.filter((l) => l.provider === 'typesafe');
    expect(ts).toHaveLength(2176);

    const g1 = ts.filter((l) => l.run === 'giro-1');
    expect(g1).toHaveLength(1568);
    const inG1 = g1.reduce((s, l) => s + l.input_tokens, 0);
    expect(inG1).toBe(3_841_142);
    const usdG1 = g1.reduce((s, l) => s + l.usd, 0);
    expect(usdG1).toBeCloseTo(0.1613, 3);

    // The base variant alone in giro-1 accounts for ~2.92 million input tokens (~3 M).
    const baseG1 = g1.filter((l) => l.variant === 'base');
    expect(baseG1).toHaveLength(822);
    expect(baseG1.reduce((s, l) => s + l.input_tokens, 0)).toBe(2_919_758);

    // Stability repeated run: 596 calls.
    const ripeti = ts.filter((l) => l.run === 'giro-1-ripeti');
    expect(ripeti).toHaveLength(596);
    expect(ripeti.reduce((s, l) => s + l.input_tokens, 0)).toBe(802_866);
    expect(ripeti.reduce((s, l) => s + l.usd, 0)).toBeCloseTo(0.0337, 3);

    // Preliminary trial runs.
    const proveTs = ts.filter((l) => l.run === 'prova-1');
    expect(proveTs).toHaveLength(12);

    // Total TypeSafe in ledger.
    expect(ts.reduce((s, l) => s + l.input_tokens, 0)).toBe(4_662_430);
    expect(ts.reduce((s, l) => s + l.usd, 0)).toBeCloseTo(0.1958, 3);

    // Gemini calls match prices.ts exactly.
    const gem = lines.filter((l) => l.provider === 'gemini');
    expect(gem).toHaveLength(611);
    const gemG1 = gem.filter((l) => l.run === 'giro-1');
    expect(gemG1).toHaveLength(598);
    expect(gemG1.reduce((s, l) => s + l.usd, 0)).toBeCloseTo(0.6621, 3);
    expect(gem.reduce((s, l) => s + l.usd, 0)).toBeCloseTo(0.6797, 3);

    // reportText explains the reconciliation.
    const rep = reportText(lines);
    expect(rep).toContain('$0.1613');
    expect(rep).toContain('$0.1958');
    expect(rep).toContain('$0.6621');
    expect(rep).toContain('$0.6797');
    expect(rep).toContain('0,042 $ al milione di token in ingresso');
  });
});
