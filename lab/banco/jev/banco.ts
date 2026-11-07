// The Jev bench (T313): closed decisions of the game and judgements on sculpture, asked to TypeSafe's Jev (a System One model:
// state + typed questions → choices, scores, probabilities) and to Gemini 3.1 Flash-Lite with the same questions. Every call goes
// to `consumi.jsonl` (model, case, tokens, cost, ms, outcome); the caps per provider are summed over the whole ledger, so they hold
// across runs. Nothing here reads a key: the script in lab/scripts reads them from the .env and passes them in.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { costOf } from '../../../src/kernel/ai/prices';
import type { AiModels, Schema, TextCall, Thinking } from '../../../src/kernel/ai/models';
import type { CallRecord } from '../../../src/kernel/ai/usage';
import { withQuestions } from './domande';

export const BENCH_DIR = path.dirname(fileURLToPath(import.meta.url));
export const LEDGER = path.join(BENCH_DIR, 'consumi.jsonl');
export const CASES_DIR = path.join(BENCH_DIR, 'casi');

/** Jev's price (docs.typesafe.ai/models.md, read on JEV_PRICE_READ_ON): input tokens only, output free. */
export const JEV_PRICE = { input: 0.042, output: 0 };
export const JEV_PRICE_READ_ON = '2026-11-06';
export const JEV_MODELS = ['jev-1.13.0', 'jev-1.14.0'] as const;
export const FLASH_LITE = 'gemini-3.1-flash-lite';
/**
 * The tokens of an image on Jev, for the estimate before a call (T324): TypeSafe does not say yet how it counts one («We'll be
 * providing guidance on estimating image token usage soon», docs.typesafe.ai/images.md). Measured on the bench: about two tokens per
 * square of 28 × 28 pixels and a hundred per image (≈ 390 pixels a token), rounded up.
 */
export const jevTokensOfImage = (w: number, h: number) => 2 * Math.ceil(w / 28) * Math.ceil(h / 28) + 120;

/** The tokens the images of a case may cost on Jev, every use of a reference counted (the estimate, not the bill). */
export function jevImageTokens(c: Case): number {
  if (!c.images) return 0;
  const uses = imageUses(c);
  return Object.entries(caseImages(c)).reduce((s, [ref, im]) => s + Math.max(1, uses[ref] ?? 1) * jevTokensOfImage(im.w, im.h), 0);
}

// ---------------------------------------------------------------------------------------------------------- cases and questions

export type Question =
  | { id: string; type: 'noul'; instructions: unknown; criteria?: { true?: unknown; false?: unknown } }
  | { id: string; type: 'choice'; instructions: unknown; criteria: Record<string, unknown> }
  | { id: string; type: 'score'; instructions: unknown; criteria: unknown[] };

/** noul: the right truth value; choice: the options that count as right; score: the right level (or levels). */
export type Expected = boolean | string[] | number | number[];

export type Group = 'decisioni' | 'scultura' | 'vita' | 'immagini';

export interface Case {
  id: string;
  group: Group;
  kind: string;
  state: unknown;
  questions: Question[];
  expected: Record<string, Expected>;
  /** What the kernel decides today without a model, where it decides (the floor if the answer is missing). */
  rule?: Record<string, string | boolean | number>;
  /** Cases asked together in one request (group 3): the ids of the cases it stands for, question by question. */
  batchOf?: string[];
  source?: string;
  note?: string;
  /**
   * The images of the case (T324): a reference → the PNG, relative to the root of the repository. Jev gets them as `assets` (the
   * reference is replaced by the image wherever it is written, the Danger Zone header on); Gemini gets them inline, in this order,
   * with a line that names each reference.
   */
  images?: Record<string, string>;
  /** How the images are cut (T324: `lati4`, `lato1`, `griglia`, `separate`; `nomi8`, `foto8`, `foto50` for the library): the variant of its runs. */
  form?: string;
  /** What the report needs of a case besides its answers (T324: whether it would pass seen from outside, the defect made on it). */
  meta?: Record<string, string | number | boolean>;
}

/** A case as its file keeps it: the questions come from its kind (domande.ts) when it does not bring them. */
export type CaseSpec = Omit<Case, 'questions'> & { questions?: Question[] };

export interface CaseFile {
  group: Group;
  description: string;
  cases: CaseSpec[];
}

export function loadCases(dir = CASES_DIR): Case[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => {
      const parsed = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as CaseFile;
      if (!parsed || !Array.isArray(parsed.cases)) return [];
      return parsed.cases.map(withQuestions);
    });
}

/** The same questions with the options in reverse order (Jev leans to the first option, jaggedness #8). */
export function reversed(c: Case): Case {
  return {
    ...c,
    questions: c.questions.map((q) => (q.type === 'choice' ? { ...q, criteria: Object.fromEntries(Object.entries(q.criteria).reverse()) } : q)),
  };
}

// ---------------------------------------------------------------------------------------------------------- answers

export interface Answer {
  type: Question['type'];
  /** noul: true when p ≥ 0.5; choice: the option; score: the most likely level. */
  value: boolean | string | number;
  /** noul: probability of yes; score: the expected score. */
  p?: number;
  probabilities?: Record<string, number>;
  confidence?: number;
}

export interface Usage {
  input: number;
  output: number;
  cached?: number;
  thoughts?: number;
}

export interface Reply {
  answers: Record<string, Answer>;
  usage: Usage;
  ms: number;
  /** The model that answered (an alias names the version here). */
  answeredBy: string;
}

export interface Judge {
  provider: 'typesafe' | 'gemini' | 'offline' | 'locale';
  /** The label in the ledger and in the tables. */
  label: string;
  ask(c: Case): Promise<Reply>;
  /** Dollars a call would cost at most, before sending it. */
  estimate(c: Case): number;
  cost(u: Usage): number;
}

const chars = (v: unknown) => JSON.stringify(v ?? '').length;

// ---------------------------------------------------------------------------------------------------------- Jev

export interface JevOptions {
  key: string;
  model: string;
  endpoint?: string;
  fetchImpl?: typeof fetch;
  timeout?: number;
}

/** The request body Jev gets: the state once, every question under its id. */
export function jevBody(c: Case, model: string, images?: Record<string, ImageData>): Record<string, unknown> {
  const questions = Object.fromEntries(
    c.questions.map((q) => [q.id, q.type === 'noul' ? { type: 'noul', instructions: q.instructions, ...(q.criteria ? { criteria: q.criteria } : {}) } : { type: q.type, instructions: q.instructions, criteria: q.criteria }]),
  );
  const assets = images && Object.keys(images).length ? Object.fromEntries(Object.entries(images).map(([ref, im]) => [ref, { type: 'image', format: 'png', data_base64: im.base64 }])) : undefined;
  return { model, state: c.state, questions, ...(assets ? { assets } : {}) };
}

/** An image of a case, read from the disk: its bytes in base64, its size in pixels (from the PNG header). */
export interface ImageData {
  base64: string;
  w: number;
  h: number;
}

/** The images of a case, read from the repository (lab/out/jev/foto, written by `--prepara immagini`). */
export function caseImages(c: Case, root = path.resolve(BENCH_DIR, '../../..')): Record<string, ImageData> {
  const out: Record<string, ImageData> = {};
  for (const [ref, file] of Object.entries(c.images ?? {})) {
    const bytes = fs.readFileSync(path.resolve(root, file));
    out[ref] = { base64: bytes.toString('base64'), w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
  }
  return out;
}

/** How many times each reference is written in the request: Jev adds the image again at every use (docs.typesafe.ai/images.md). */
export function imageUses(c: Case): Record<string, number> {
  const text = JSON.stringify({ state: c.state, questions: c.questions });
  return Object.fromEntries(Object.keys(c.images ?? {}).map((ref) => [ref, text.split(ref).length - 1]));
}

export function jevAnswers(raw: Record<string, any>, c: Case): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  for (const q of c.questions) {
    const a = raw?.[q.id];
    if (!a) continue;
    if (q.type === 'noul') out[q.id] = { type: 'noul', value: Number(a.noul) >= 0.5, p: Number(a.noul) };
    else if (q.type === 'choice') out[q.id] = { type: 'choice', value: String(a.choice), probabilities: a.probabilities, confidence: a.confidence };
    else {
      const probs: Record<string, number> = a.probabilities ?? {};
      const best = Object.entries(probs).sort((x, y) => y[1] - x[1])[0]?.[0];
      out[q.id] = { type: 'score', value: best !== undefined ? Number(best) : Math.round(Number(a.score)), p: Number(a.score), probabilities: probs, confidence: a.confidence };
    }
  }
  return out;
}

export class JevJudge implements Judge {
  readonly provider = 'typesafe' as const;
  readonly label: string;
  constructor(private o: JevOptions) {
    this.label = o.model;
  }
  cost(u: Usage): number {
    return (u.input * JEV_PRICE.input + u.output * JEV_PRICE.output) / 1e6;
  }
  estimate(c: Case): number {
    // About 270 tokens of the request's own, then ~3.2 characters a token (measured on the first requests); an image at every use.
    return this.cost({ input: 300 + Math.ceil(chars(jevBody(c, this.o.model)) / 3) + jevImageTokens(c), output: 0 });
  }
  async ask(c: Case): Promise<Reply> {
    const t0 = Date.now();
    const f = this.o.fetchImpl ?? fetch;
    const images = c.images ? caseImages(c) : undefined;
    const body = JSON.stringify(jevBody(c, this.o.model, images));
    let last = '';
    for (let attempt = 0; attempt < 4; attempt++) {
      const r = await f(`${this.o.endpoint ?? 'https://api.typesafe.ai'}/v1/systemone`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.o.key}`, 'Content-Type': 'application/json', ...(images ? { 'TypeSafe-Danger-Zone-Images': 'true' } : {}) },
        body,
        signal: AbortSignal.timeout(this.o.timeout ?? 60_000),
      });
      const j: any = await r.json().catch(() => ({}));
      if (r.ok) return { answers: jevAnswers(j.answers ?? {}, c), usage: { input: j.usage?.input_tokens ?? 0, output: j.usage?.output_tokens ?? 0 }, ms: Date.now() - t0, answeredBy: String(j.model ?? this.o.model) };
      last = `${r.status} ${JSON.stringify(j.detail ?? j).slice(0, 300)}`;
      if (r.status !== 429 && r.status !== 529 && r.status < 500) break;
      await new Promise((ok) => setTimeout(ok, 1000 * 2 ** attempt));
    }
    throw new Error(`TypeSafe ${this.o.model}: ${last}`);
  }
}

// ---------------------------------------------------------------------------------------------------------- Gemini, same questions

const text = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

/** What an image may cost on Gemini before a call (the estimate only: the bill is `promptTokenCount`). */
export const GEMINI_IMAGE_TOKENS = 1300;

export const TYPED_SYSTEM = [
  'You judge decisions in a video game world. You get a state (JSON) and some typed questions about it.',
  'Answer every question about the state only, only with the allowed values, in the JSON asked.',
].join(' ');

/** The prompt and the schema that ask Gemini exactly what Jev is asked: the same state, the same questions, the same options. */
export function typedPrompt(c: Case): { prompt: string; schema: Schema } {
  const refs = Object.keys(c.images ?? {});
  const lines: string[] = [
    ...(refs.length ? ['## Images', `The images attached after this text, in this order, stand for these references wherever they are written: ${refs.map((r, i) => `image ${i + 1} = \`${r}\``).join(', ')}.`, ''] : []),
    '## State',
    '```json',
    JSON.stringify(c.state, null, 1),
    '```',
    '',
    '## Questions',
  ];
  const properties: Record<string, Schema> = {};
  for (const q of c.questions) {
    if (q.type === 'noul') {
      lines.push(`### ${q.id} (true or false)`, text(q.instructions));
      if (q.criteria?.true !== undefined) lines.push(`true: ${text(q.criteria.true)}`);
      if (q.criteria?.false !== undefined) lines.push(`false: ${text(q.criteria.false)}`);
      properties[q.id] = { type: 'BOOLEAN' };
    } else if (q.type === 'choice') {
      lines.push(`### ${q.id} (exactly one of the options)`, text(q.instructions), 'Options:');
      for (const [k, v] of Object.entries(q.criteria)) lines.push(v === null || v === undefined ? `- ${k}` : `- ${k}: ${text(v)}`);
      properties[q.id] = { type: 'STRING', enum: Object.keys(q.criteria) };
    } else {
      lines.push(`### ${q.id} (a level, the number before the description)`, text(q.instructions), 'Levels:');
      q.criteria.forEach((v, i) => lines.push(`- ${i}: ${text(v)}`));
      properties[q.id] = { type: 'STRING', enum: q.criteria.map((_, i) => String(i)) };
    }
    lines.push('');
  }
  return { prompt: lines.join('\n'), schema: { type: 'OBJECT', properties, required: c.questions.map((q) => q.id) } };
}

export function typedAnswers(raw: Record<string, unknown>, c: Case): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  for (const q of c.questions) {
    const v = raw?.[q.id];
    if (v === undefined || v === null) continue;
    if (q.type === 'noul') {
      const b = v === true || v === 'true';
      out[q.id] = { type: 'noul', value: b, p: b ? 1 : 0 };
    } else if (q.type === 'choice') out[q.id] = { type: 'choice', value: String(v) };
    else out[q.id] = { type: 'score', value: Number(v), p: Number(v) };
  }
  return out;
}

export interface GeminiOptions {
  /** A fresh model layer per call (the lab's `direct()`): its `onCall` reports only that call. */
  models: () => AiModels;
  model: string;
  thinking?: Thinking;
  temperature?: number;
}

export class GeminiJudge implements Judge {
  readonly provider = 'gemini' as const;
  readonly label: string;
  constructor(private o: GeminiOptions) {
    this.label = o.thinking && o.thinking !== 'low' ? `${o.model}:${o.thinking}` : o.model;
  }
  cost(u: Usage): number {
    return costOf(this.o.model, { prompt: u.input, cached: u.cached ?? 0, output: u.output, thoughts: u.thoughts ?? 0 }) ?? 0;
  }
  estimate(c: Case): number {
    const { prompt, schema } = typedPrompt(c);
    const pics = Object.keys(c.images ?? {}).length * GEMINI_IMAGE_TOKENS;
    return this.cost({ input: Math.ceil((prompt.length + TYPED_SYSTEM.length + chars(schema)) / 3) + 50 + pics, output: 120 + 40 * c.questions.length, thoughts: 600 });
  }
  async ask(c: Case): Promise<Reply> {
    const { prompt, schema } = typedPrompt(c);
    const images = c.images ? Object.values(caseImages(c)).map((im) => `data:image/png;base64,${im.base64}`) : undefined;
    return askGemini(this.o, { agent: 'banco', task: `jev.${c.kind}`, system: TYPED_SYSTEM, prompt, schema, temperature: this.o.temperature ?? 0.3, ...(images ? { images } : {}) }, (raw) => typedAnswers(raw, c));
  }
}

/** One call through the kernel's Gemini layer, timed, with its own usage record. */
export async function askGemini(o: GeminiOptions, call: Omit<TextCall, 'model' | 'thinking'>, map: (raw: Record<string, unknown>) => Record<string, Answer>): Promise<Reply> {
  const m = o.models();
  let rec: CallRecord | undefined;
  m.onCall = (r) => (rec = r);
  const t0 = Date.now();
  const out = await m.text({ ...call, model: o.model, thinking: o.thinking ?? 'low' });
  const ms = Date.now() - t0;
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(out.replace(/^```(?:json)?\s*|```\s*$/g, ''));
  } catch {
    raw = {};
  }
  return { answers: map(raw), usage: { input: rec?.prompt ?? 0, output: rec?.output ?? 0, cached: rec?.cached ?? 0, thoughts: rec?.thoughts ?? 0 }, ms, answeredBy: o.model };
}

// ---------------------------------------------------------------------------------------------------------- offline

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};

/**
 * Fake answers, without network or keys (the test, `--offline`): right four times in five, always the same for the same case and label;
 * tokens are what the real judge would count, the cost is zero.
 */
export class OfflineJudge implements Judge {
  readonly provider = 'offline' as const;
  constructor(readonly label: string) {}
  cost(): number {
    return 0;
  }
  estimate(): number {
    return 0;
  }
  async ask(c: Case): Promise<Reply> {
    const answers: Record<string, Answer> = {};
    for (const q of c.questions) {
      const h = hash(`${this.label}|${c.id}|${q.id}`);
      const right = h % 5 !== 0;
      const e = c.expected[q.id];
      if (q.type === 'noul') {
        const truth = typeof e === 'boolean' ? e : h % 2 === 0;
        const v = right ? truth : !truth;
        answers[q.id] = { type: 'noul', value: v, p: v ? 0.8 : 0.2 };
      } else if (q.type === 'choice') {
        const keys = Object.keys(q.criteria);
        const good = Array.isArray(e) ? (e as unknown[]).map(String).filter((k) => keys.includes(k)) : [];
        const v = right && good.length ? good[h % good.length] : keys[h % keys.length];
        answers[q.id] = { type: 'choice', value: v, probabilities: Object.fromEntries(keys.map((k) => [k, k === v ? 0.7 : 0.3 / Math.max(1, keys.length - 1)])), confidence: 0.6 };
      } else {
        const lv = typeof e === 'number' ? e : Array.isArray(e) ? Number(e[0]) : 0;
        const v = right ? lv : (lv + 1) % q.criteria.length;
        answers[q.id] = { type: 'score', value: v, p: v };
      }
    }
    return { answers, usage: { input: 300 + Math.ceil(chars(jevBody(c, this.label)) / 3) + jevImageTokens(c), output: 20 * c.questions.length }, ms: 0, answeredBy: this.label };
  }
}

// ---------------------------------------------------------------------------------------------------------- scoring

/** Whether an answer is right; undefined when the case has no right answer for that question (a speculative one). */
export function isRight(q: Question, a: Answer | undefined, e: Expected | undefined): boolean | undefined {
  if (e === undefined) return undefined;
  if (!a) return false;
  if (q.type === 'noul') return a.value === e;
  if (q.type === 'choice') return (Array.isArray(e) ? (e as unknown[]).map(String) : [String(e)]).includes(String(a.value));
  const levels = Array.isArray(e) ? (e as unknown[]).map(Number) : [Number(e)];
  return levels.includes(Number(a.value));
}

export function grade(c: Case, r: Reply): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const q of c.questions) {
    const ok = isRight(q, r.answers[q.id], c.expected[q.id]);
    if (ok !== undefined) out[q.id] = ok;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------- ledger and caps

export interface LedgerLine {
  t: string;
  run: string;
  provider: Judge['provider'];
  model: string;
  answeredBy?: string;
  group: Group;
  kind: string;
  case: string;
  /** `base`, `rovescio` (options reversed), `oggi` (the game's own prompt), `lotto` (several cases in one request)… */
  variant: string;
  questions: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens?: number;
  thought_tokens?: number;
  usd: number;
  ms: number;
  ok: boolean;
  error?: string;
  answers?: Record<string, { v: Answer['value']; p?: number; c?: number; top?: Array<[string, number]> }>;
  right?: Record<string, boolean>;
  /** The game's Artist (T324, `oggi`): its mark, whether it recognises the thing, its first problems. */
  critique?: { voto: number; riconoscibile: boolean; problemi: string[] };
}

export function readLedger(file = LEDGER): LedgerLine[] {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as LedgerLine);
}

/** Dollars spent per provider in a ledger, every run. */
export function spent(lines: LedgerLine[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of lines) out[l.provider] = (out[l.provider] ?? 0) + l.usd;
  return out;
}

export class Budget {
  private used: Record<string, number>;
  constructor(
    private caps: Record<string, number>,
    lines: LedgerLine[],
  ) {
    this.used = spent(lines);
  }
  /** Whether a call that may cost `usd` fits under the cap of its provider; the call is then reserved. */
  take(provider: string, usd: number): boolean {
    const cap = this.caps[provider];
    if (cap === undefined) return true;
    if ((this.used[provider] ?? 0) + usd > cap) return false;
    this.used[provider] = (this.used[provider] ?? 0) + usd;
    return true;
  }
  /** After the call: the real cost replaces the estimate. */
  settle(provider: string, estimate: number, real: number): void {
    this.used[provider] = (this.used[provider] ?? 0) - estimate + real;
  }
  get(provider: string): number {
    return this.used[provider] ?? 0;
  }
}

const compact = (a: Answer): NonNullable<LedgerLine['answers']>[string] => ({
  v: a.value,
  ...(a.p !== undefined ? { p: Math.round(a.p * 1000) / 1000 } : {}),
  ...(a.confidence !== undefined ? { c: Math.round(a.confidence * 1000) / 1000 } : {}),
  ...(a.probabilities
    ? {
        top: Object.entries(a.probabilities)
          .sort((x, y) => y[1] - x[1])
          .slice(0, 3)
          .map(([k, v]) => [k, Math.round(v * 1000) / 1000] as [string, number]),
      }
    : {}),
});

// ---------------------------------------------------------------------------------------------------------- the run

export interface RunOptions {
  run: string;
  judges: Judge[];
  cases: Case[];
  variant?: string;
  /** Change a case before asking (the reversed options, other questions). */
  transform?: (c: Case) => Case;
  /**
   * Answers the code composes from the model's (the companion Noul, the four Nouls of the fourth wall): graded with the case's own
   * questions, the ones the expected answers name.
   */
  derive?: (original: Case, answers: Record<string, Answer>) => Record<string, Answer>;
  ledger?: string;
  budget: Budget;
  /** Calls in flight per judge. */
  concurrency?: number;
  /** Writes nothing (the dry run). */
  dry?: boolean;
  log?: (s: string) => void;
  /** Every line, as it is written. */
  onLine?: (l: LedgerLine) => void;
}

export function appendLine(ledger: string, l: LedgerLine): void {
  fs.mkdirSync(path.dirname(ledger), { recursive: true });
  fs.appendFileSync(ledger, JSON.stringify(l) + '\n');
}

export async function runBench(o: RunOptions): Promise<LedgerLine[]> {
  const out: LedgerLine[] = [];
  const ledger = o.ledger ?? LEDGER;
  const write = (l: LedgerLine) => {
    out.push(l);
    if (!o.dry) appendLine(ledger, l);
    o.onLine?.(l);
  };
  for (const judge of o.judges) {
    let next = 0;
    const worker = async () => {
      while (next < o.cases.length) {
        const original = o.cases[next++];
        const c = o.transform ? o.transform(original) : original;
        const base: Omit<LedgerLine, 'input_tokens' | 'output_tokens' | 'usd' | 'ms' | 'ok'> = { t: new Date().toISOString(), run: o.run, provider: judge.provider, model: judge.label, group: c.group, kind: c.kind, case: c.id, variant: o.variant ?? 'base', questions: c.questions.length };
        const est = judge.estimate(c);
        if (!o.budget.take(judge.provider, est)) {
          write({ ...base, input_tokens: 0, output_tokens: 0, usd: 0, ms: 0, ok: false, error: 'tetto' });
          continue;
        }
        try {
          const r = await judge.ask(c);
          const usd = judge.cost(r.usage);
          o.budget.settle(judge.provider, est, usd);
          const derived = o.derive?.(original, r.answers);
          if (derived) {
            r.answers = { ...r.answers, ...derived };
          }
          const graded = derived ? { ...c, questions: [...c.questions.filter((q) => !(q.id in derived)), ...original.questions.filter((q) => q.id in derived)], expected: original.expected } : c;
          write({
            ...base,
            answeredBy: r.answeredBy,
            input_tokens: r.usage.input,
            output_tokens: r.usage.output,
            ...(r.usage.cached ? { cached_tokens: r.usage.cached } : {}),
            ...(r.usage.thoughts ? { thought_tokens: r.usage.thoughts } : {}),
            usd,
            ms: r.ms,
            ok: true,
            answers: Object.fromEntries(Object.entries(r.answers).map(([k, a]) => [k, compact(a)])),
            right: grade(graded, r),
          });
        } catch (e) {
          // A failed call may still have been billed by Gemini: the estimate stays on the cap.
          write({ ...base, input_tokens: 0, output_tokens: 0, usd: judge.provider === 'gemini' ? est : 0, ms: 0, ok: false, error: (e as Error).message.slice(0, 300) });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, o.concurrency ?? 4) }, worker));
    o.log?.(`${judge.label}: ${o.cases.length} casi (${o.variant ?? 'base'}), speso finora ${judge.provider} $${o.budget.get(judge.provider).toFixed(4)}`);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------- the report

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : '—');

export interface Row {
  group: string;
  kind: string;
  variant: string;
  model: string;
  calls: number;
  failed: number;
  decisions: number;
  right: number;
  /** Per question id: right / asked. */
  perQuestion: Record<string, [number, number]>;
  usd: number;
  usdPer1000: number;
  input: number;
  output: number;
  msMedian: number;
  msP90: number;
}

/** The lines of the ledger, by group, kind, variant and model: what was right, what it cost, how long it took. */
export function summarize(lines: LedgerLine[], filter: (l: LedgerLine) => boolean = () => true): Row[] {
  const rows = new Map<string, Row>();
  for (const l of lines.filter(filter)) {
    const key = `${l.group}|${l.kind}|${l.variant}|${l.model}`;
    const r = rows.get(key) ?? { group: l.group, kind: l.kind, variant: l.variant, model: l.model, calls: 0, failed: 0, decisions: 0, right: 0, perQuestion: {}, usd: 0, usdPer1000: 0, input: 0, output: 0, msMedian: 0, msP90: 0 };
    rows.set(key, r);
    r.calls++;
    r.usd += l.usd;
    if (!l.ok) {
      r.failed++;
      continue;
    }
    r.input += l.input_tokens;
    r.output += l.output_tokens + (l.thought_tokens ?? 0);
    for (const [q, ok] of Object.entries(l.right ?? {})) {
      const pq = (r.perQuestion[q] ??= [0, 0]);
      pq[1]++;
      r.decisions++;
      if (ok) {
        pq[0]++;
        r.right++;
      }
    }
  }
  const ms = new Map<string, number[]>();
  for (const l of lines.filter(filter)) if (l.ok) (ms.get(`${l.group}|${l.kind}|${l.variant}|${l.model}`) ?? ms.set(`${l.group}|${l.kind}|${l.variant}|${l.model}`, []).get(`${l.group}|${l.kind}|${l.variant}|${l.model}`)!).push(l.ms);
  for (const [k, r] of rows) {
    const xs = ms.get(k) ?? [];
    r.msMedian = median(xs);
    r.msP90 = quantile(xs, 0.9);
    // Dollars per 1000 decisions: every question asked is a decision, the ones without a right answer too.
    const asked = lines.filter((l) => filter(l) && l.ok && `${l.group}|${l.kind}|${l.variant}|${l.model}` === k).reduce((s, l) => s + l.questions, 0);
    r.usdPer1000 = asked ? (1000 * r.usd) / asked : 0;
  }
  return [...rows.values()].sort((a, b) => a.group.localeCompare(b.group) || a.kind.localeCompare(b.kind) || a.variant.localeCompare(b.variant) || a.model.localeCompare(b.model));
}

export function reportTable(rows: Row[]): string {
  const head = '| gruppo | compito | variante | modello | chiamate | decisioni | giuste | per domanda | $ per 1000 decisioni | token in / out medi | ms mediana (p90) |';
  const sep = '|---|---|---|---|---|---|---|---|---|---|---|';
  const body = rows.map((r) => {
    const ok = r.calls - r.failed;
    const per = Object.entries(r.perQuestion)
      .map(([q, [a, b]]) => `${q} ${pct(a, b)}`)
      .join(', ');
    return `| ${r.group} | ${r.kind} | ${r.variant} | ${r.model} | ${r.calls}${r.failed ? ` (${r.failed} fallite)` : ''} | ${r.decisions} | ${pct(r.right, r.decisions)} | ${per} | ${r.usdPer1000.toFixed(4)} | ${ok ? Math.round(r.input / ok) : 0} / ${ok ? Math.round(r.output / ok) : 0} | ${r.msMedian} (${r.msP90}) |`;
  });
  return [head, sep, ...body].join('\n');
}

/** How often the same model gave the same answers with the options in another order. */
export function consistency(lines: LedgerLine[], a: string, b: string): Array<{ model: string; kind: string; same: number; total: number }> {
  const by = new Map<string, LedgerLine>();
  for (const l of lines) if (l.ok && (l.variant === a || l.variant === b)) by.set(`${l.model}|${l.case}|${l.variant}`, l);
  const out = new Map<string, { model: string; kind: string; same: number; total: number }>();
  for (const l of lines) {
    if (!l.ok || l.variant !== a) continue;
    const other = by.get(`${l.model}|${l.case}|${b}`);
    if (!other) continue;
    const row = out.get(`${l.model}|${l.kind}`) ?? out.set(`${l.model}|${l.kind}`, { model: l.model, kind: l.kind, same: 0, total: 0 }).get(`${l.model}|${l.kind}`)!;
    for (const [q, x] of Object.entries(l.answers ?? {})) {
      const y = other.answers?.[q];
      if (!y) continue;
      row.total++;
      if (String(x.v) === String(y.v)) row.same++;
    }
  }
  return [...out.values()];
}
