// «Oggi» for the images (T324): the rubric cases through the game's own Artist — `judge` of src/kernel/agents/sculptor.ts, its prompt,
// its photograph (`views`: the four sides as the world draws them), its model (gemini-3.5-flash) — with the Council of a booted seed.
// Its critique (a mark 0-10, approved from 7) is mapped to the typed questions it answers: `passa` (mark ≥ 7) and `voto` (the four levels).

import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../../src/kernel/kernel';
import { bundledFiles } from '../../../src/kernel/bundle';
import { memoryStore } from '../../../src/kernel/repo';
import { MockAiModels } from '../../../src/kernel/ai/mock';
import { costOf } from '../../../src/kernel/ai/prices';
import { judge, type SculptRequest } from '../../../src/kernel/agents/sculptor';
import { classOf } from '../../../src/mj/classes';
import type { AiModels } from '../../../src/kernel/ai/models';
import type { CallRecord } from '../../../src/kernel/ai/usage';
import { bersaglio } from '../bersagli';
import { esegui, misura } from '../misure';
import { appendLine, grade, type Answer, type Budget, type Case, type LedgerLine } from './banco';
import { ROOT } from './domande';
import { withDefect, type Defect } from './immagini';

export interface ArtistTodayOptions {
  run: string;
  cases: Case[];
  ledger: string;
  budget: Budget;
  offline: boolean;
  log: (s: string) => void;
  /** The Artist's model (sculptor.ts → DEFAULT_SCULPTORS.artist). */
  model: string;
  /** A fresh layer per call; offline the local models answer. */
  models?: () => AiModels;
  dry?: boolean;
}

/** The mark as the four levels of `MARKS`. */
export const markLevel = (voto: number) => (voto <= 4 ? 0 : voto <= 6 ? 1 : voto <= 8 ? 2 : 3);

/** The program of a case and its grid as the case shows it (with its defect, if it has one). */
function checkedOf(c: Case) {
  const dir = /^lab\/banco\/(.+?)\/modello\.xml/.exec(c.source ?? '')?.[1];
  if (!dir) throw new Error(`il caso ${c.id} non dice da quale programma viene`);
  const b = bersaglio(dir.split('/')[1])!;
  const e = esegui(fs.readFileSync(path.join(ROOT, 'lab/banco', dir, 'modello.xml'), 'utf8'), b, 1);
  const d = c.meta?.defect as Defect | undefined;
  const grid = d ? withDefect(e, d, e.model.program.palette, misura(e, b).porta).grid : e.result.grid;
  const req: SculptRequest = { id: 'banco', nome: b.nome, aspetto: `${b.descrizione} Stile: ${b.stile}.`, classe: b.classe, ...(b.taglia ? { taglia: b.taglia } : {}) };
  return { req, cls: classOf(b.classe)!, checked: { xml: e.xml, model: e.model, result: { ...e.result, grid } } };
}

export async function runArtistToday(o: ArtistTodayOptions): Promise<void> {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
  const provider: LedgerLine['provider'] = o.offline || !o.models ? 'locale' : 'gemini';
  for (const c of o.cases) {
    const base = { t: new Date().toISOString(), run: o.run, provider, model: provider === 'gemini' ? o.model : 'locale', group: c.group, kind: c.kind, case: c.id, variant: 'oggi', questions: 2 };
    const est = 0.008;
    if (provider === 'gemini' && !o.budget.take('gemini', est)) {
      write(o, { ...base, input_tokens: 0, output_tokens: 0, usd: 0, ms: 0, ok: false, error: 'tetto' });
      continue;
    }
    let rec: CallRecord | undefined;
    const m: AiModels = provider === 'gemini' ? o.models!() : new MockAiModels();
    m.onCall = (r) => (rec = r);
    k.council.ai = m;
    const t0 = Date.now();
    let ms = 0;
    try {
      const { req, cls, checked } = checkedOf(c);
      const t1 = Date.now();
      const critique = await judge(k.council, req, cls, checked as never, o.model);
      ms = Date.now() - t1;
      const usd = provider === 'gemini' && rec ? (costOf(o.model, { prompt: rec.prompt, cached: rec.cached, output: rec.output, thoughts: rec.thoughts }) ?? est) : 0;
      if (provider === 'gemini') o.budget.settle('gemini', est, usd);
      if (!critique) throw new Error('nessun giudizio');
      const answers: Record<string, Answer> = {
        passa: { type: 'noul', value: critique.voto >= 7, p: critique.voto / 10 },
        voto: { type: 'score', value: markLevel(critique.voto), p: critique.voto },
      };
      const graded = { ...c, questions: c.questions.filter((q) => q.id in answers) };
      write(o, {
        ...base,
        answeredBy: o.model,
        input_tokens: rec?.prompt ?? 0,
        output_tokens: rec?.output ?? 0,
        ...(rec?.cached ? { cached_tokens: rec.cached } : {}),
        ...(rec?.thoughts ? { thought_tokens: rec.thoughts } : {}),
        usd,
        ms,
        ok: true,
        answers: { passa: { v: answers.passa.value, p: critique.voto / 10 }, voto: { v: answers.voto.value, p: critique.voto } },
        right: grade(graded, { answers, usage: { input: 0, output: 0 }, ms, answeredBy: o.model }),
        critique: { voto: critique.voto, riconoscibile: critique.riconoscibile, problemi: critique.problemi.slice(0, 4) },
      });
    } catch (e) {
      const usd = provider === 'gemini' ? (rec ? (costOf(o.model, { prompt: rec.prompt, cached: rec.cached, output: rec.output, thoughts: rec.thoughts }) ?? est) : est) : 0;
      write(o, { ...base, input_tokens: rec?.prompt ?? 0, output_tokens: rec?.output ?? 0, usd, ms: ms || Date.now() - t0, ok: false, error: (e as Error).message.slice(0, 300) });
    } finally {
      k.council.ai = new MockAiModels();
    }
  }
}

function write(o: ArtistTodayOptions, l: LedgerLine): void {
  if (!o.dry) appendLine(o.ledger, l);
  o.log(`${l.model} ${l.case} [oggi] ${l.ok ? Object.entries(l.answers ?? {}).map(([q, a]) => `${q}=${String(a.v)}${l.right?.[q] === undefined ? '' : l.right[q] ? '✓' : '✗'}`).join(' ') : `ERRORE ${l.error}`} · ${l.input_tokens}+${l.output_tokens} tok · $${l.usd.toFixed(5)} · ${l.ms} ms`);
}
