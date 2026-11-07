// T325 (c): Jev chooses the context. The Council's real requests (recorded in three universes with the local models answering: the prompts
// are the game's, word for word) are asked to Gemini twice: with the whole context, and with the lines of the canon, the lexicon, the rules,
// the graph's focus, the society and the catalog that Jev chose (one Choice per part over its line ids, as in the cookbook «Line-by-line
// search», with a companion Noul that drops a part the request does not need). A blind judge (Flash-Lite, and Jev too) compares the two
// answers with the whole world in front of it; tokens, cache and dollars of every call go to the ledger.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { cutPrompt, cutSystem, principlesIn, rejoin, type Part, type Piece } from './contesto';
import { explore, RecordingModels } from './registratore';
import { bootLikeTheGame, universeDir, USE_DIR } from './misura';
import { appendLine, FLASH_LITE, GeminiJudge, JevJudge, OfflineJudge, type Answer, type Budget, type Case, type Judge, type LedgerLine, type Question, type Reply } from '../banco';
import { direct } from '../../../scripts/gemini';
import { UsageLog, type CallRecord } from '../../../../src/kernel/ai/usage';
import { costOf } from '../../../../src/kernel/ai/prices';
import { parseJson, type Schema } from '../../../../src/kernel/ai/models';
import { COUNCIL_PRINCIPLES, metaBreak } from '../../../../src/kernel/fourthwall';
import type { Kernel } from '../../../../src/kernel/kernel';

export const CHOICE_FILE = path.join(USE_DIR, 'casi', 'scelta.json');
export const CHOICE_RESULTS = path.join(USE_DIR, 'misure', 'scelta.json');

/** A request of the Council as it was sent. */
export interface ChoiceCase {
  id: string;
  universe: string;
  task: string;
  agent: string;
  system: string;
  prompt: string;
  schema?: string;
  temperature?: number;
  model?: string;
  /** The agent's context: where it ends in the system (its text is the system's, after the principles). */
  contextLength?: number;
  context?: string;
  /** For npc.individuate: who already exists (a new name must differ). */
  people?: string[];
}

// ---------------------------------------------------------------------------------------------------------- recording the cases

/** What the wanderer asks the people of each universe: the canon, the customs, the people they love. */
export const CHOICE_QUESTIONS = ['Cosa sono quelle lastre che brillano per terra? Sono pericolose?', 'Come si usa salutare qui, quando si entra in casa d’altri?', 'Chi è la persona della tua famiglia a cui tieni di più, e perché?'];
export const CHOICE_UNIVERSES = ['neapolis', 'orichalcum', 'sidera'];

const peopleNames = (k: Kernel): string[] => {
  try {
    const raw = JSON.parse(k.files['world/people.json'] ?? '{}');
    return ((raw.people ?? raw.persone ?? []) as Array<{ name?: string; nome?: string }>).map((p) => String(p.name ?? p.nome ?? '')).filter(Boolean);
  } catch {
    return [];
  }
};

/** The requests of the trial: a few places explored, then the questions to people of the universe, by the Narrator and by the Actor. */
export async function recordChoiceCases(universe: string, log: (s: string) => void = () => {}): Promise<ChoiceCase[]> {
  const dir = universeDir(universe);
  if (!dir) return [];
  const rec = new RecordingModels(universe);
  const k = await bootLikeTheGame(dir, rec);
  const names = new Set(peopleNames(k));
  await explore(k, rec, 20);
  const explored = rec.calls.length;
  // People with an identity of the universe's own (not one the local models made up during the walk).
  const people: number[] = [];
  for (const id of k.ecs.query('mind').filter((id) => k.ecs.alive.has(id))) {
    if (people.length >= 3) break;
    await (k as any).ensureIdentity(id);
    const name = k.ecs.get(id, 'identity')?.name;
    if (name && names.has(name) && !people.some((p) => k.ecs.get(p, 'identity')?.name === name)) people.push(id);
  }
  for (const [i, id] of people.entries()) await k.talk(id, CHOICE_QUESTIONS[i % CHOICE_QUESTIONS.length]);
  (k as any).config.ai.actor = { on: true, model: 'gemini-3.8-flash' };
  if (universe !== 'orichalcum') for (const [i, id] of people.entries()) await k.talk(id, CHOICE_QUESTIONS[i % CHOICE_QUESTIONS.length]);
  (k as any).config.ai.actor = { on: false };
  const pick = (task: string, n: number, from = 0) => rec.calls.slice(from).filter((c) => c.task === task).slice(0, n);
  const chosen = [...pick('chunk.plan', 2), ...pick('npc.individuate', 2), ...pick('npc.reply', 6, explored)];
  log(`${universe}: ${rec.calls.length} chiamate registrate, ${chosen.length} casi (${people.length} persone del mondo)`);
  const count = new Map<string, number>();
  return chosen.map((c) => {
    const kind = c.task === 'npc.reply' ? `npc.reply:${c.agent}` : c.task;
    const n = (count.get(kind) ?? 0) + 1;
    count.set(kind, n);
    return {
      id: `scelta/${universe}/${kind.replace(':', '-')}-${n}`,
      universe,
      task: c.task,
      agent: c.agent,
      system: c.system,
      prompt: c.prompt,
      ...(c.schema ? { schema: c.schema } : {}),
      ...(c.temperature !== undefined ? { temperature: c.temperature } : {}),
      ...(c.model ? { model: c.model } : {}),
      ...(c.context ? { contextLength: c.context.length } : {}),
      ...(c.task === 'npc.individuate' ? { people: [...names] } : {}),
    };
  });
}

export async function writeChoiceCases(log: (s: string) => void = () => {}): Promise<string> {
  const cases: ChoiceCase[] = [];
  for (const u of CHOICE_UNIVERSES) cases.push(...(await recordChoiceCases(u, log)));
  fs.mkdirSync(path.dirname(CHOICE_FILE), { recursive: true });
  fs.writeFileSync(CHOICE_FILE, JSON.stringify({ description: 'Richieste vere del Concilio (T325, idea (c)), registrate negli universi con i modelli locali: system, prompt e schema come li manda il gioco.', cases }, null, 1) + '\n');
  return CHOICE_FILE;
}

export function loadChoiceCases(file = CHOICE_FILE): ChoiceCase[] {
  if (!fs.existsSync(file)) return [];
  return (JSON.parse(fs.readFileSync(file, 'utf8')).cases as ChoiceCase[]).map((c) => {
    if (c.context || !c.contextLength) return c;
    // The recorded cases carry the principles of their time (Italian before T310).
    const principles = principlesIn(c.system) ?? COUNCIL_PRINCIPLES;
    const at = c.system.indexOf(principles) + principles.length + 2;
    return { ...c, context: c.system.slice(at, at + c.contextLength) };
  });
}

// ---------------------------------------------------------------------------------------------------------- the candidates

/** The parts Jev may thin: the context that is lines of a list (the bible and the role stay whole). */
export const SELECTABLE: Part[] = ['canone', 'lessico', 'regole', 'grafo', 'societa', 'catalogo'];
const KEY: Record<string, string> = { canone: 'canon', lessico: 'lexicon', regole: 'rules', grafo: 'graph', societa: 'society', catalogo: 'catalog' };

export interface Candidate {
  id: string;
  text: string;
}

/** A line that stays whatever Jev says: a heading, a blank line, the first line of the part (its own heading). */
const fixedLine = (line: string, first: boolean) => first || !line.trim() || /^#/.test(line.trim()) || /:$/.test(line.trim());

/** The module id of a line of the catalog («- npc.barista «Barista» [npc]…»), so that the same module goes or stays in both lists. */
const moduleOf = (line: string) => /^- ([\w.-]+) «/.exec(line.trim())?.[1];

/** The lines of each selectable part of a request, with an id; a module of the catalog has the same id wherever it is listed. */
export function candidates(c: ChoiceCase): Record<string, Candidate[]> {
  const out: Record<string, Candidate[]> = {};
  for (const { piece, ids } of lineIds([...cutSystem(c.system, c.context), ...cutPrompt(c.prompt)])) {
    if (!ids) continue;
    const key = KEY[piece.part];
    const list = (out[key] ??= []);
    piece.text.split(NL).forEach((line, i) => {
      const id = ids[i];
      if (id && !list.some((l) => l.id === id)) list.push({ id, text: line.trim().replace(/^- /, '') });
    });
  }
  for (const k of Object.keys(out)) if (!out[k].length) delete out[k];
  return out;
}

/**
 * The id of every line of the selectable pieces, in order (undefined for a line that stays whatever Jev says); the same numbering for
 * choosing and for thinning. A module of the catalog has its own id, so that it goes or stays in every list that names it.
 */
function lineIds(pieces: Piece[]): Array<{ piece: Piece; ids?: Array<string | undefined> }> {
  const counters: Record<string, number> = {};
  return pieces.map((piece) => {
    if (!SELECTABLE.includes(piece.part)) return { piece };
    const key = KEY[piece.part];
    const ids = piece.text.split(NL).map((line, i) => {
      if (fixedLine(line, i === 0)) return undefined;
      const mod = piece.part === 'catalogo' ? moduleOf(line) : undefined;
      return mod ?? `${key}${(counters[key] = (counters[key] ?? 0) + 1)}`;
    });
    return { piece, ids };
  });
}

/** What the request asks, for Jev: the task and the request's own lines (the wanderer's words, the place, the person). */
export function requestSummary(c: ChoiceCase): string {
  const parts = cutPrompt(c.prompt).filter((p) => ['richiesta', 'stato', 'persona', 'storia'].includes(p.part));
  const text = parts.map((p) => p.text).join('\n').slice(0, 1600);
  const what: Record<string, string> = {
    'npc.reply': 'A person of the world answers what the wanderer says to them.',
    'npc.individuate': 'The narrator creates a new individual of a kind of person, with a name, a family and bonds to people who already exist.',
    'chunk.plan': 'The cartographer designs a new place of the world: its name, what stands in it (modules of the catalog), what lies on the ground.',
  };
  return `${what[c.task] ?? c.task}\n${text}`;
}

const MAX_OPTIONS = 250;
const NL = String.fromCharCode(10);

/** One Choice per part over its line ids (at most 250 options each: a part longer than that is split), and a companion Noul per part. */
export function selectionQuestions(cands: Record<string, Candidate[]>): Question[] {
  const qs: Question[] = [];
  for (const [part, list] of Object.entries(cands)) {
    for (let i = 0; i < list.length; i += MAX_OPTIONS) {
      const slice = list.slice(i, i + MAX_OPTIONS);
      qs.push({
        id: `pick_${part}${i ? `_${i / MAX_OPTIONS + 1}` : ''}`,
        type: 'choice',
        instructions: `Which line of \`${part}\` is the most useful to whoever writes the answer to \`request\`: a fact, a name, a word, a custom, a rule or a thing of the world that the answer needs or must respect?`,
        criteria: Object.fromEntries(slice.map((l) => [l.id, null])),
      });
    }
    qs.push({
      id: `need_${part}`,
      type: 'noul',
      instructions: `Does the answer to \`request\` need anything written in \`${part}\`: a fact, a name, a word, a custom, a rule or a thing it must use or respect?`,
      criteria: { true: `Something in \`${part}\` matters for this answer.`, false: `Nothing in \`${part}\` matters for this answer: it is about other things.` },
    });
  }
  return qs;
}

export interface Selection {
  /** The ids kept, per part; a part absent is kept whole, a part with an empty list is dropped (but its heading). */
  kept: Record<string, string[]>;
}

/**
 * The lines kept from Jev's answers: a part whose companion Noul is under `drop` goes; otherwise the lines by probability until `mass`
 * of it, at least `min` and at most `max` (the catalog of a place keeps more: the plan picks among them).
 */
/** How much is kept: `stretto` (the first run: the lines by probability to 85 % of it) and `largo` (the second: more lines, and the lists the answer picks from or must not repeat kept wider). */
export const CUTS = {
  stretto: { drop: 0.3, mass: 0.85, min: 3, max: 20, minList: 3, maxCatalog: 14 },
  largo: { drop: 0.2, mass: 0.97, min: 8, max: 30, minList: 14, maxCatalog: 24 },
};
export type CutName = keyof typeof CUTS;

export function selectionOf(cands: Record<string, Candidate[]>, answers: Record<string, Answer>, o: (typeof CUTS)[CutName] = CUTS.stretto): Selection {
  const kept: Record<string, string[]> = {};
  for (const [part, list] of Object.entries(cands)) {
    const need = answers[`need_${part}`]?.p;
    if (need !== undefined && need < o.drop) {
      kept[part] = [];
      continue;
    }
    const probs: Array<[string, number]> = [];
    for (const [qid, a] of Object.entries(answers)) if (qid === `pick_${part}` || qid.startsWith(`pick_${part}_`)) for (const [id, p] of Object.entries(a.probabilities ?? (a.value ? { [String(a.value)]: 1 } : {}))) probs.push([id, p]);
    probs.sort((x, y) => y[1] - x[1]);
    const total = probs.reduce((s, [, p]) => s + p, 0) || 1;
    // The lists the answer picks from (the catalog) or must not repeat (the society) are kept wider.
    const list_ = part === 'catalog' || part === 'society';
    const max = part === 'catalog' ? o.maxCatalog : o.max;
    const min = list_ ? o.minList : o.min;
    const out: string[] = [];
    let cum = 0;
    for (const [id, p] of probs) {
      if (out.length >= max || (out.length >= min && cum >= o.mass * total)) break;
      out.push(id);
      cum += p;
    }
    kept[part] = out.length ? out : list.slice(0, min).map((l) => l.id);
  }
  return { kept };
}

/** The request with only the lines kept: the same system and prompt, the other lines of the selectable parts gone. */
export function thinned(c: ChoiceCase, s: Selection): { system: string; prompt: string } {
  const sys = cutSystem(c.system, c.context);
  const pr = cutPrompt(c.prompt);
  const out = lineIds([...sys, ...pr]).map(({ piece, ids }) => {
    const keep = ids ? s.kept[KEY[piece.part]] : undefined;
    if (!ids || !keep) return piece;
    return { ...piece, text: piece.text.split(NL).filter((_, i) => ids[i] === undefined || keep.includes(ids[i]!)).join(NL) };
  });
  return { system: rejoin(out.slice(0, sys.length), NL + NL), prompt: rejoin(out.slice(sys.length), NL) };
}

// ---------------------------------------------------------------------------------------------------------- the run

export interface ChoiceOptions {
  run: string;
  cases: string[];
  offline: boolean;
  typesafeKey?: string;
  geminiKey?: string;
  ledger: string;
  budget: Budget;
  dry?: boolean;
  log: (s: string) => void;
  fetchImpl?: typeof fetch;
  /** Where the results go (the test writes elsewhere). */
  results?: string;
  /** How much Jev's choice keeps (CUTS). */
  cut?: CutName;
  /** The whole requests are not asked again: their answers come from the results of an earlier run (a second cut, the same reference). */
  reuseFull?: boolean;
}

export interface ChoiceResult {
  id: string;
  cut: CutName;
  universe: string;
  task: string;
  agent: string;
  model: string;
  full: Call;
  thin: Call;
  jev: { input: number; usd: number; ms: number; kept: Record<string, number>; of: Record<string, number> };
  /** The blind judges: which was better (`intero`, `scelto`, `pari`), and whether each broke the world. */
  judges: Record<string, { better: string; fullBreaks?: number; thinBreaks?: number }>;
  checks: { full: string[]; thin: string[] };
}

interface Call {
  input: number;
  cached: number;
  output: number;
  thoughts: number;
  usd: number;
  ms: number;
  answer?: string;
  error?: string;
}

const hashOf = (s: string) => parseInt(createHash('sha1').update(s).digest('hex').slice(0, 8), 16);

/** What the kernel would check of an answer: it parses, a line of a person passes the fourth wall, a plan keeps to the catalog, a new name is new. */
export function checksOf(c: ChoiceCase, answer: string | undefined, catalog: string[]): string[] {
  if (!answer) return ['nessuna risposta'];
  let a: any;
  try {
    a = parseJson(answer);
  } catch {
    return ['non è JSON'];
  }
  const out: string[] = [];
  if (c.task === 'npc.reply') {
    if (!String(a.dice ?? '').trim()) out.push('battuta vuota');
    const broke = metaBreak(String(a.dice ?? ''));
    if (broke) out.push(`quarta parete: ${broke}`);
  }
  if (c.task === 'chunk.plan') for (const o of a.oggetti ?? []) if (!catalog.includes(String(o.modulo))) out.push(`modulo fuori catalogo: ${o.modulo}`);
  if (c.task === 'npc.individuate') {
    const first = (n: string) => n.toLowerCase().split(/\s+/)[0];
    if ((c.people ?? []).some((p) => first(p) === first(String(a.nome ?? '')))) out.push(`nome già usato: ${a.nome}`);
  }
  return out;
}

/** What a judge reads of an answer: the line and the action of a person, the individual, the plan. */
export function answerText(c: ChoiceCase, answer: string | undefined): string {
  if (!answer) return '(nessuna risposta)';
  try {
    const a: any = parseJson(answer);
    if (c.task === 'npc.reply') return `dice: «${a.dice ?? ''}» (azione: ${a.azione ?? '-'}, umore: ${a.umore ?? '-'})`;
    return JSON.stringify(a).slice(0, 2500);
  } catch {
    return answer.slice(0, 2500);
  }
}

/** The world as the judge sees it: every selectable part whole, and the bible (its head) — the reference both answers are judged against. */
export function worldOf(c: ChoiceCase): string {
  const pieces = [...cutSystem(c.system, c.context), ...cutPrompt(c.prompt)];
  return pieces
    .filter((p) => SELECTABLE.includes(p.part) || p.part === 'bibbia' || p.part === 'partita')
    .map((p) => p.text)
    .join('\n\n')
    .slice(0, 24_000);
}

export const JUDGE_QUESTIONS: Question[] = [
  {
    id: 'better',
    type: 'choice',
    instructions: 'Which answer to `request` is better: more coherent with `world` (its facts, names, customs and the rune canon), more concrete, more in character, and closer to what `request` asks? Choose `same` if neither is better.',
    criteria: { A: '`answer_A` is better.', B: '`answer_B` is better.', same: 'Neither is better than the other.' },
  },
  { id: 'A_breaks', type: 'noul', instructions: 'Does `answer_A` contradict `world` or invent something `world` rules out: a rune that behaves as the canon does not say, a name or a bond that clashes with the people listed, a thing out of the era, a custom said wrong?' },
  { id: 'B_breaks', type: 'noul', instructions: 'Does `answer_B` contradict `world` or invent something `world` rules out: a rune that behaves as the canon does not say, a name or a bond that clashes with the people listed, a thing out of the era, a custom said wrong?' },
];

async function askGemini(model: string, key: string, c: ChoiceCase, system: string, prompt: string, budget: Budget): Promise<Call> {
  const est = (costOf(model, { prompt: Math.ceil((system.length + prompt.length) / 3), output: 1500 }) ?? 0.01) * 1.2;
  if (!budget.take('gemini', est)) return { input: 0, cached: 0, output: 0, thoughts: 0, usd: 0, ms: 0, error: 'tetto' };
  const sink = new UsageLog();
  const m = direct(model, key, sink, { thinking: 'low', timeout: 120_000 });
  let rec: CallRecord | undefined;
  m.onCall = (r) => (rec = r);
  const t0 = Date.now();
  try {
    const answer = await m.text({ agent: c.agent, task: c.task, system, prompt, schema: c.schema ? (JSON.parse(c.schema) as Schema) : undefined, temperature: c.temperature, model, thinking: 'low' });
    const usd = rec ? costOf(model, { prompt: rec.prompt, cached: rec.cached, output: rec.output, thoughts: rec.thoughts }) ?? est : est;
    budget.settle('gemini', est, usd);
    return { input: rec?.prompt ?? 0, cached: rec?.cached ?? 0, output: rec?.output ?? 0, thoughts: rec?.thoughts ?? 0, usd, ms: Date.now() - t0, answer };
  } catch (e) {
    return { input: rec?.prompt ?? 0, cached: rec?.cached ?? 0, output: 0, thoughts: 0, usd: est, ms: Date.now() - t0, error: (e as Error).message.slice(0, 200) };
  }
}

/** The fake answer of a request offline: the local models would not use the context, so the two answers are the same. */
function offlineCall(system: string, prompt: string): Call {
  return { input: Math.ceil((system.length + prompt.length) / 3.3), cached: 0, output: 0, thoughts: 0, usd: 0, ms: 0, answer: JSON.stringify({ dice: '…', azione: 'nessuna', umore: 'tranquillo' }) };
}

export async function runChoice(o: ChoiceOptions): Promise<LedgerLine[]> {
  const all = loadChoiceCases().filter((c) => !o.cases.length || o.cases.includes(c.id));
  const lines: LedgerLine[] = [];
  const results: ChoiceResult[] = [];
  const write = (l: LedgerLine) => {
    lines.push(l);
    if (!o.dry) appendLine(o.ledger, l);
  };
  const base = (c: ChoiceCase, provider: LedgerLine['provider'], model: string, variant: string): Omit<LedgerLine, 'input_tokens' | 'output_tokens' | 'usd' | 'ms' | 'ok'> => ({ t: new Date().toISOString(), run: o.run, provider, model, group: 'scelta' as never, kind: c.task === 'npc.reply' ? `npc.reply:${c.agent}` : c.task, case: c.id, variant, questions: 0 });
  const selector: Judge = o.offline ? new OfflineJudge('jev-1.13.0') : new JevJudge({ key: o.typesafeKey ?? '', model: 'jev-1.13.0', fetchImpl: o.fetchImpl });
  const judges: Judge[] = o.offline
    ? [new OfflineJudge(FLASH_LITE), new OfflineJudge('jev-1.13.0')]
    : [new GeminiJudge({ model: FLASH_LITE, thinking: 'low', models: () => direct(FLASH_LITE, o.geminiKey!, new UsageLog(), { thinking: 'low', timeout: 120_000 }) }), selector];
  if (!o.offline && (!o.typesafeKey || !o.geminiKey)) throw new Error('la scelta del contesto vuole TYPESAFE_KEY e GEMINI_API_KEY (passa --env)');
  // One universe and one task at a time, the whole requests first: what the implicit cache serves is measured as in a session.
  const order = [...all].sort((a, b) => a.universe.localeCompare(b.universe) || a.task.localeCompare(b.task) || a.agent.localeCompare(b.agent));
  const fulls = new Map<string, Call>();
  const cut: CutName = o.cut ?? 'stretto';
  const out = o.results ?? (o.offline ? path.resolve('lab/out/jev/scelta-offline.json') : CHOICE_RESULTS);
  const before: ChoiceResult[] = fs.existsSync(out) ? (JSON.parse(fs.readFileSync(out, 'utf8')).results ?? []).map((r: ChoiceResult) => ({ ...r, cut: r.cut ?? 'stretto' })) : [];
  for (const c of order) {
    const model = c.model ?? FLASH_LITE;
    const earlier = o.reuseFull ? before.find((r) => r.id === c.id && r.full.answer && !r.full.error) : undefined;
    if (earlier) {
      fulls.set(c.id, earlier.full);
      continue;
    }
    const full = o.offline ? offlineCall(c.system, c.prompt) : await askGemini(model, o.geminiKey!, c, c.system, c.prompt, o.budget);
    fulls.set(c.id, full);
    write({ ...base(c, o.offline ? 'offline' : 'gemini', model, 'intero'), input_tokens: full.input, output_tokens: full.output + full.thoughts, cached_tokens: full.cached, usd: full.usd, ms: full.ms, ok: !full.error, ...(full.error ? { error: full.error } : {}) });
    o.log(`${c.id} intero: ${full.input} token (${full.cached} in cache), $${full.usd.toFixed(5)}${full.error ? ` ERRORE ${full.error}` : ''}`);
  }
  for (const c of order) {
    const model = c.model ?? FLASH_LITE;
    const cands = candidates(c);
    const sel: Case = { id: c.id, group: 'scelta' as never, kind: 'scelta', state: { request: requestSummary(c), ...Object.fromEntries(Object.entries(cands).map(([k, ls]) => [k, Object.fromEntries(ls.map((l) => [l.id, l.text]))])) }, questions: selectionQuestions(cands), expected: {} };
    let reply: Reply | undefined;
    const est = selector.estimate(sel);
    if (o.budget.take('typesafe', est)) {
      try {
        reply = await selector.ask(sel);
        o.budget.settle('typesafe', est, selector.cost(reply.usage));
      } catch (e) {
        o.log(`${c.id} scelta: ${(e as Error).message}`);
      }
    }
    const selection = reply ? selectionOf(cands, reply.answers, CUTS[cut]) : { kept: {} };
    const t = thinned(c, selection);
    write({ ...base(c, selector.provider, selector.label, cut === 'stretto' ? 'selezione' : `selezione-${cut}`), questions: sel.questions.length, input_tokens: reply?.usage.input ?? 0, output_tokens: 0, usd: reply ? selector.cost(reply.usage) : 0, ms: reply?.ms ?? 0, ok: !!reply, answers: Object.fromEntries(Object.entries(selection.kept).map(([k, ids]) => [k, { v: ids.join(',') }])) });
    const thin = o.offline ? offlineCall(t.system, t.prompt) : await askGemini(model, o.geminiKey!, c, t.system, t.prompt, o.budget);
    write({ ...base(c, o.offline ? 'offline' : 'gemini', model, cut === 'stretto' ? 'scelto' : `scelto-${cut}`), input_tokens: thin.input, output_tokens: thin.output + thin.thoughts, cached_tokens: thin.cached, usd: thin.usd, ms: thin.ms, ok: !thin.error, ...(thin.error ? { error: thin.error } : {}) });
    const full = fulls.get(c.id)!;
    // The blind judges: which answer is A depends on the case, not on the run.
    const fullIsA = hashOf(c.id) % 2 === 0;
    const [A, B] = fullIsA ? [full.answer, thin.answer] : [thin.answer, full.answer];
    const jc: Case = { id: c.id, group: 'scelta' as never, kind: 'giudice', state: { world: worldOf(c), request: requestSummary(c), answer_A: answerText(c, A), answer_B: answerText(c, B) }, questions: JUDGE_QUESTIONS, expected: {} };
    const verdicts: ChoiceResult['judges'] = {};
    for (const j of judges) {
      const e = j.estimate(jc);
      if (!o.budget.take(j.provider, e)) continue;
      try {
        const r = await j.ask(jc);
        const usd = j.cost(r.usage);
        o.budget.settle(j.provider, e, usd);
        const v = String(r.answers.better?.value ?? 'same');
        const better = v === 'same' ? 'pari' : (v === 'A') === fullIsA ? 'intero' : 'scelto';
        const pA = r.answers.A_breaks?.p;
        const pB = r.answers.B_breaks?.p;
        verdicts[j.label] = { better, fullBreaks: fullIsA ? pA : pB, thinBreaks: fullIsA ? pB : pA };
        write({ ...base(c, j.provider, j.label, cut === 'stretto' ? 'giudice' : `giudice-${cut}`), questions: JUDGE_QUESTIONS.length, input_tokens: r.usage.input, output_tokens: r.usage.output + (r.usage.thoughts ?? 0), usd, ms: r.ms, ok: true, answers: { better: { v: better }, intero_rompe: { v: (verdicts[j.label].fullBreaks ?? 0) >= 0.5, p: verdicts[j.label].fullBreaks }, scelto_rompe: { v: (verdicts[j.label].thinBreaks ?? 0) >= 0.5, p: verdicts[j.label].thinBreaks } } });
      } catch (err) {
        write({ ...base(c, j.provider, j.label, 'giudice'), input_tokens: 0, output_tokens: 0, usd: j.provider === 'gemini' ? e : 0, ms: 0, ok: false, error: (err as Error).message.slice(0, 200) });
      }
    }
    const catalog = (cands.catalog ?? []).map((l) => l.id);
    results.push({
      id: c.id,
      cut,
      universe: c.universe,
      task: c.task,
      agent: c.agent,
      model,
      full: { ...full, answer: full.answer?.slice(0, 4000) },
      thin: { ...thin, answer: thin.answer?.slice(0, 4000) },
      jev: { input: reply?.usage.input ?? 0, usd: reply ? selector.cost(reply.usage) : 0, ms: reply?.ms ?? 0, kept: Object.fromEntries(Object.entries(selection.kept).map(([k, v]) => [k, v.length])), of: Object.fromEntries(Object.entries(cands).map(([k, v]) => [k, v.length])) },
      judges: verdicts,
      checks: { full: checksOf(c, full.answer, catalog), thin: checksOf(c, thin.answer, catalog) },
    });
    o.log(`${c.id}: intero ${full.input} → scelto ${thin.input} token (${thin.cached} in cache), Jev ${reply?.usage.input ?? 0}; giudici ${Object.entries(verdicts).map(([k, v]) => `${k}=${v.better}`).join(' ')}`);
  }
  if (!o.dry) {
    // A new run adds to the results of the earlier ones, case by case and cut by cut.
    const merged = [...before.filter((r) => !results.some((x) => x.id === r.id && x.cut === r.cut)), ...results];
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify({ run: o.run, results: merged }, null, 1) + '\n');
  }
  return lines;
}
