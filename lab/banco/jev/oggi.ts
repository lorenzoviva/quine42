// «Oggi» (T313): the cases of group 1 through the game's own calls — judgeAction, judgeCombination, judgeCraft, liaisonReply and the
// Arbiter's review of the fourth wall — with the Council of a booted kernel (its system prompt, principles, bible, catalog) on Flash-Lite,
// and on the game's local models (MockAiModels: what the kernel does when the knob or the credits send a call there). Their answers are
// mapped to the same typed questions, so the same expected answers score them.

import path from 'node:path';
import { Kernel } from '../../../src/kernel/kernel';
import { bundledFiles } from '../../../src/kernel/bundle';
import { memoryStore } from '../../../src/kernel/repo';
import { MockAiModels } from '../../../src/kernel/ai/mock';
import { costOf } from '../../../src/kernel/ai/prices';
import { internalName } from '../../../src/kernel/internalNames';
import type { AiModels } from '../../../src/kernel/ai/models';
import type { CallRecord } from '../../../src/kernel/ai/usage';
import { judgeAction, judgeCraft } from '../../../src/kernel/agents/effects';
import { judgeCombination } from '../../../src/kernel/agents/forge';
import { liaisonReply } from '../../../src/kernel/agents/minds';
import { avvia } from '../universi-cloud/strumenti/carica';
import { appendLine, FLASH_LITE, grade, type Answer, type Budget, type Case, type LedgerLine } from './banco';
import { ROOT } from './domande';

export interface TodayOptions {
  run: string;
  cases: Case[];
  ledger: string;
  budget: Budget;
  offline: boolean;
  log: (s: string) => void;
  /** A fresh Flash-Lite layer per call; without it only the local models answer. */
  models?: () => AiModels;
  dry?: boolean;
}

/** The universe whose Council judges a case: the one its state comes from. */
function universeOf(c: Case): 'seme' | 'neapolis' | 'orichalcum' | 'sidera' {
  const s = `${c.source ?? ''} ${JSON.stringify((c.state as any)?.known_items ?? '')}`;
  if (/neapolis/.test(s)) return 'neapolis';
  if (/orichalcum/.test(s)) return 'orichalcum';
  if (/sidera/.test(s)) return 'sidera';
  return 'seme';
}

const kernels = new Map<string, Promise<Kernel>>();
function kernelOf(u: string): Promise<Kernel> {
  if (!kernels.has(u)) kernels.set(u, u === 'seme' ? Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() }) : avvia(path.join(ROOT, 'lab/banco/universi-cloud', u)).then((r) => r.k));
  return kernels.get(u)!;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const known = (name: string | undefined, names: string[]) => (name ? names.find((n) => norm(n) === norm(name)) : undefined);

type Call = { answers: Record<string, Answer>; calls: number };

/** One case through the game's call; the Council's model is set by the caller. */
async function askGame(k: Kernel, c: Case): Promise<Call> {
  const s = c.state as any;
  if (c.kind === 'azione') {
    const j = await judgeAction(k.council, {
      text: s.player_writes,
      target: { name: s.target.name, description: s.target.description, tags: [], container: !!s.target.container, kind: s.target.kind },
      carrying: s.carrying,
      holding: s.holding,
      tile: s.under_target,
      terrains: Object.entries(k.palette).filter(([code]) => code !== '?').map(([, t]) => t.name),
      summonable: [...k.modules.values()].filter((e) => e.manifest.kind === 'entity' && !e.manifest.unique).map((e) => e.manifest.name),
      loot: Object.keys(k.content.loot),
      place: s.place,
    });
    const types = j.effects.map((e: any) => internalName('effetti', String(e?.tipo ?? e?.type ?? '')));
    const main = types.find((t) => t !== 'message') ?? 'message';
    const answers: Record<string, Answer> = {
      possible: { type: 'noul', value: j.possible, p: j.possible ? 1 : 0 },
      effect: { type: 'choice', value: main },
      repeatable: { type: 'noul', value: j.repeatable, p: j.repeatable ? 1 : 0 },
    };
    if (Array.isArray(s.carrying) && s.carrying.length) answers.requires = { type: 'choice', value: known(j.requires, s.carrying) ?? 'none' };
    return { answers, calls: 1 };
  }
  if (c.kind === 'combinazione') {
    const r = await judgeCombination(k.council, s.a, s.b, s.known_items);
    const hit = r.possible ? known(r.result, s.known_items) : undefined;
    return { answers: { makes: { type: 'noul', value: !!hit, p: hit ? 1 : 0 }, result: { type: 'choice', value: r.possible ? (hit ?? `fuori elenco: ${r.result}`) : 'nessuno' } }, calls: 1 };
  }
  if (c.kind === 'fabbricazione') {
    const r = await judgeCraft(k.council, s.wants_to_make, s.carrying, s.known_items);
    return { answers: { possible: { type: 'noul', value: r.possible, p: r.possible ? 1 : 0 }, result: { type: 'choice', value: known(r.result, s.known_items) ?? 'nuovo' } }, calls: 1 };
  }
  if (c.kind === 'referente') {
    const history = (s.history ?? []).map((t: any) => ({ who: t.chi === 'viandante' ? 'giocatore' : 'agente', text: t.dice }));
    const r = await liaisonReply(k.council, history, s.request);
    return { answers: { team: { type: 'choice', value: r.task }, refuse: { type: 'noul', value: !!r.refusal, p: r.refusal ? 1 : 0 } }, calls: 1 };
  }
  throw new Error(`nessuna chiamata del gioco per ${c.kind}`);
}

/** The Arbiter's review of the fourth wall as the kernel asks it (kernel.ts → reviewFourthWall): every text in one list. */
async function reviewGame(k: Kernel, cases: Case[]): Promise<Record<string, boolean>> {
  const lines = cases.map((c, i) => `- m${i + 1} «${(c.state as any).text.split('.')[0].slice(0, 40)}»: ${(c.state as any).text.slice(0, 300)}`);
  const r = await k.council.ask<{ ritira?: string[] }>(
    'arbitro',
    'review.fourthwall',
    `Rivedi questi moduli creati dal Concilio. Ritira quelli che rompono la quarta parete (riferimenti a codice, simulazione, realtà instabile o finta, mondi che si ripetono, ruoli astratti come custodi della realtà, censori, archivisti del mondo, misuratori di anomalie; anche travestiti da leggenda: chi torna sempre in piazza, chi osserva ogni viandante, confini che nessuno supera), quelli che duplicano le rune (altri simboli luminosi nel terreno) e i doppioni. Tieni tutto ciò che è una persona o una cosa vera del mondo.\n${lines.join('\n')}`,
    { type: 'OBJECT', properties: { ritira: { type: 'ARRAY', items: { type: 'STRING' } }, motivo: { type: 'STRING' } }, required: ['ritira'] },
    { data: { ids: cases.map((_, i) => `m${i + 1}`) }, temperature: 0.2 },
  );
  const out = new Set((r.ritira ?? []).map((x) => String(x).trim()));
  return Object.fromEntries(cases.map((c, i) => [c.id, out.has(`m${i + 1}`)]));
}

export async function runToday(o: TodayOptions): Promise<void> {
  const write = (l: LedgerLine) => {
    if (!o.dry) appendLine(o.ledger, l);
    o.log(`${l.model} ${l.case} [${l.variant}] ${l.ok ? Object.entries(l.answers ?? {}).map(([q, a]) => `${q}=${String(a.v)}${l.right?.[q] === undefined ? '' : l.right[q] ? '✓' : '✗'}`).join(' ') : `ERRORE ${l.error}`} · ${l.input_tokens}+${l.output_tokens} tok · $${l.usd.toFixed(5)} · ${l.ms} ms`);
  };
  const line = (c: Case, provider: LedgerLine['provider'], model: string, variant: string, rec: Partial<CallRecord> | undefined, ms: number, answers?: Record<string, Answer>, error?: string): LedgerLine => {
    const usd = rec ? (costOf(FLASH_LITE, { prompt: rec.prompt ?? 0, cached: rec.cached ?? 0, output: rec.output ?? 0, thoughts: rec.thoughts ?? 0 }) ?? 0) : 0;
    return {
      t: new Date().toISOString(),
      run: o.run,
      provider,
      model,
      group: c.group,
      kind: c.kind,
      case: c.id,
      variant,
      questions: c.questions.length,
      input_tokens: rec?.prompt ?? 0,
      output_tokens: rec?.output ?? 0,
      ...(rec?.cached ? { cached_tokens: rec.cached } : {}),
      ...(rec?.thoughts ? { thought_tokens: rec.thoughts } : {}),
      usd: provider === 'gemini' ? usd : 0,
      ms,
      ok: !error,
      ...(error ? { error } : {}),
      ...(answers ? { answers: Object.fromEntries(Object.entries(answers).map(([q, a]) => [q, { v: a.value }])), right: grade(c, { answers, usage: { input: 0, output: 0 }, ms, answeredBy: model }) } : {}),
    };
  };
  const single = o.cases.filter((c) => ['azione', 'combinazione', 'fabbricazione', 'referente'].includes(c.kind));
  const walls = o.cases.filter((c) => c.kind === 'quarta-parete');
  // The local models first: free, and the floor of every decision.
  for (const c of single) {
    const k = await kernelOf(universeOf(c));
    k.council.ai = new MockAiModels();
    const t0 = Date.now();
    try {
      const r = await askGame(k, c);
      write(line(c, 'locale', 'locale', 'locale', undefined, Date.now() - t0, r.answers));
    } catch (e) {
      write(line(c, 'locale', 'locale', 'locale', undefined, 0, undefined, (e as Error).message));
    }
  }
  if (walls.length) {
    // Offline the Arbiter says nothing (reviewFourthWall does not ask): what stays is the kernel's filter of words.
    const { metaBreak } = await import('../../../src/kernel/fourthwall');
    for (const c of walls) write(line(c, 'locale', 'locale', 'locale', undefined, 0, { breaks: { type: 'noul', value: !!metaBreak((c.state as any).text), p: metaBreak((c.state as any).text) ? 1 : 0 } }));
  }
  if (o.offline || !o.models) return;
  const ask = async <T>(k: Kernel, est: number, fn: () => Promise<T>): Promise<{ v?: T; rec?: CallRecord; ms: number; error?: string }> => {
    if (!o.budget.take('gemini', est)) return { ms: 0, error: 'tetto' };
    const m = o.models!();
    let rec: CallRecord | undefined;
    m.onCall = (r) => (rec = rec ? { ...r, prompt: rec.prompt + r.prompt, cached: rec.cached + r.cached, output: rec.output + r.output, thoughts: rec.thoughts + r.thoughts } : r);
    k.council.ai = m;
    const t0 = Date.now();
    try {
      const v = await fn();
      const real = rec ? (costOf(FLASH_LITE, { prompt: rec.prompt, cached: rec.cached, output: rec.output, thoughts: rec.thoughts }) ?? est) : est;
      o.budget.settle('gemini', est, real);
      return { v, rec, ms: Date.now() - t0 };
    } catch (e) {
      return { rec, ms: Date.now() - t0, error: (e as Error).message.slice(0, 300) };
    } finally {
      k.council.ai = new MockAiModels();
    }
  };
  // One at a time: the Council of a kernel has one model at a time.
  for (const c of single) {
    const k = await kernelOf(universeOf(c));
    const r = await ask(k, 0.004, () => askGame(k, c));
    write(line(c, 'gemini', FLASH_LITE, 'oggi', r.rec, r.ms, r.v?.answers, r.error));
  }
  if (walls.length) {
    const k = await kernelOf('seme');
    const r = await ask(k, 0.01, () => reviewGame(k, walls));
    // One call for every text: its cost goes on the first line, the others have none.
    walls.forEach((c, i) => write(line(c, 'gemini', FLASH_LITE, 'oggi', i === 0 ? r.rec : undefined, i === 0 ? r.ms : 0, r.v ? { breaks: { type: 'noul', value: !!r.v[c.id], p: r.v[c.id] ? 1 : 0 } } : undefined, r.error)));
  }
}
