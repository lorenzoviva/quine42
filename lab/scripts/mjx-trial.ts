// Step 8.2B: one complex model, sculpted by several Gemini models with the same protocol, and what each
// costs. One request per call (no retries: a request that times out may still be billed), the usage of
// every answer recorded, the same judge for all.
//
//   npx vite-node lab/scripts/mjx-trial.ts -- --model gemini-3.1-flash-lite [--rounds 1] [--samples 1]
//        [--judge gemini-3.8-flash] [--retries 2] [--thinking low] [--run nome] [--root H:/projects/rune]
//
// Protocol: `samples` independent first programs (each with up to `retries` fixes when invalid), the
// judge votes each, the best goes through `rounds` rounds of improvement with its views and the vote.

import fs from 'node:fs';
import path from 'node:path';
import type { Models, TextCall } from '../../src/kernel/ai/models';
import { emptyUsage } from '../../src/kernel/ai/models';
import { costOf, usd } from '../../src/kernel/ai/prices';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import { contactSheet, review, type Critique, type Target } from '../mjx/target';
import { sculptMjx, type MjxSculpture } from '../mjx/sculptor';
import { runMjx } from '../../src/mj/run';
import { png } from './png';

const argv = process.argv.slice(2);
const opt = (n: string) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);
const root = path.resolve(opt('root') ?? (fs.existsSync('.env') ? '.' : '../../..'));
const key = /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(path.join(root, '.env'), 'utf8'))?.[1]?.trim();
if (!key) throw new Error('nessuna GEMINI_API_KEY');

export const TARGET: Target = {
  id: 'trial:mulino',
  name: 'Mulino a vento',
  category: 'struttura',
  kind: 'grande',
  description:
    "Un mulino a vento di pietra in cui si può entrare: torre tonda che si restringe verso l'alto, tetto conico di assi, " +
    "quattro pale di legno e tela fissate a un mozzo sul davanti, porta ad arco con una soglia, due finestrelle, " +
    'un ballatoio di legno con la ringhiera a metà torre, qualche sacco di farina accanto alla porta.',
};

interface Call {
  model: string;
  role: 'scultore' | 'giudice';
  ms: number;
  prompt: number;
  cached: number;
  output: number;
  thoughts: number;
  finish?: string;
  error?: string;
}

/** One request per call; the usage of each answer goes into `log`. */
class Direct implements Models {
  readonly name = 'gemini';
  readonly usage = emptyUsage();
  limits = { text: 1e9 };
  constructor(private model: string, private role: Call['role'], private log: Call[], private thinking?: string) {}
  async text(call: TextCall): Promise<string> {
    const t0 = Date.now();
    const inline = (u: string) => {
      const m = /^data:([^;]+);base64,(.*)$/.exec(u)!;
      return { inlineData: { mimeType: m[1], data: m[2] } };
    };
    const body = {
      systemInstruction: { parts: [{ text: call.system }] },
      contents: [{ role: 'user', parts: [{ text: call.prompt }, ...(call.images ?? []).map(inline)] }],
      generationConfig: {
        temperature: call.temperature ?? 0.8,
        ...(call.schema ? { responseMimeType: 'application/json', responseSchema: call.schema } : {}),
        ...(this.thinking ? { thinkingConfig: { thinkingLevel: this.thinking } } : {}),
      },
    };
    const entry: Call = { model: this.model, role: this.role, ms: 0, prompt: 0, cached: 0, output: 0, thoughts: 0 };
    this.log.push(entry);
    this.usage.text++;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key! },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(900_000),
    });
    const j = await r.json().catch(() => ({}));
    entry.ms = Date.now() - t0;
    const u = j.usageMetadata ?? {};
    Object.assign(entry, { prompt: u.promptTokenCount ?? 0, cached: u.cachedContentTokenCount ?? 0, output: u.candidatesTokenCount ?? 0, thoughts: u.thoughtsTokenCount ?? 0, finish: j.candidates?.[0]?.finishReason });
    if (!r.ok) {
      entry.error = `${r.status} ${j.error?.message ?? ''}`;
      throw new Error(`Gemini ${this.model}: ${entry.error}`);
    }
    const text = (j.candidates?.[0]?.content?.parts ?? []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? '').join('');
    if (!text) throw new Error(`risposta vuota (${entry.finish})`);
    return text;
  }
}

const model = opt('model') ?? 'gemini-3.1-flash-lite';
const judgeModel = opt('judge') ?? 'gemini-3.8-flash';
const thinking = opt('thinking') ?? 'low';
const rounds = Number(opt('rounds') ?? 1);
const samples = Number(opt('samples') ?? 1);
const retries = Number(opt('retries') ?? 2);
const runName = opt('run') ?? `trial-${model}${rounds > 1 || samples > 1 ? `-r${rounds}-s${samples}` : ''}`;
const outDir = path.resolve('lab/out', runName);
if (fs.existsSync(path.join(outDir, 'summary.json')) && !argv.includes('--again')) throw new Error(`${runName} è già stata eseguita (--again per rifarla)`);
fs.mkdirSync(outDir, { recursive: true });

const log: Call[] = [];
const sculptor = new Direct(model, 'scultore', log, thinking);
const judge = new Direct(judgeModel, 'giudice', log, 'low');
const style = (() => {
  const f = path.join(root, 'universes', 'valmora', 'world', 'style.md');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter((l) => /^(Stile|Prospettiva|Luce|Palette):/.test(l)).join('\n') : undefined;
})();
const dataUrl = (p: Picture) => `data:image/png;base64,${png(p).toString('base64')}`;

function photos(s: MjxSculpture): Picture {
  const views = [0, 1, 2, 3].map((v) => render(s.result!.grid, s.model!.program.palette, v, DEFAULT_RENDER));
  for (const seed of [2, 3]) views.push(render(runMjx(s.model!, seed).grid, s.model!.program.palette, 0, DEFAULT_RENDER));
  return sheet(views, 2, 4, [112, 150, 84]);
}

interface Version {
  tag: string;
  valid: boolean;
  calls: number;
  vote?: number;
  critique?: Critique;
  error?: string;
}
const versions: Version[] = [];

async function judgeIt(s: MjxSculpture, tag: string): Promise<Critique | undefined> {
  fs.writeFileSync(path.join(outDir, `${tag}.png`), png(photos(s)));
  const c = await review(judge, TARGET, dataUrl(contactSheet(s.result!, s.model!.program)), undefined, style).catch((e) => (console.warn(`${tag}: giudizio fallito: ${e.message}`), undefined));
  if (c) fs.writeFileSync(path.join(outDir, `${tag}.review.json`), JSON.stringify(c, null, 2));
  return c;
}

const t0 = Date.now();
console.log(`${TARGET.name} · scultore ${model} (ragionamento ${thinking}) · giudice ${judgeModel} · ${samples} campioni, ${rounds} giri → ${outDir}`);
let best: { s: MjxSculpture; c: Critique; tag: string } | undefined;
for (let i = 0; i < samples; i++) {
  const tag = `campione-${i + 1}`;
  const before = log.length;
  const s = await sculptMjx(sculptor, TARGET, { retries, style }).catch((e) => ({ attempts: [{ xml: '', error: (e as Error).message }] }) as MjxSculpture);
  if (s.xml) fs.writeFileSync(path.join(outDir, `${tag}.xml`), s.xml + '\n');
  const err = s.attempts.at(-1)?.error;
  const v: Version = { tag, valid: !err && !!s.result, calls: log.filter((c, k) => k >= before && c.role === 'scultore').length, ...(err ? { error: err } : {}) };
  if (v.valid) {
    const c = await judgeIt(s, tag);
    if (c) {
      v.vote = c.voto;
      v.critique = c;
      if (!best || c.voto > best.c.voto) best = { s, c, tag };
    }
  }
  versions.push(v);
  console.log(`${tag}: ${v.valid ? `valido, voto ${v.vote ?? '?'}` : `non valido — ${err?.slice(0, 160)}`} (${v.calls} chiamate)`);
}
for (let r = 1; best && r <= rounds; r++) {
  const tag = `giro-${r}`;
  const before = log.length;
  const s = await sculptMjx(sculptor, TARGET, { retries, style }, { xml: best.s.xml!, critique: best.c, views: dataUrl(contactSheet(best.s.result!, best.s.model!.program)) }).catch(
    (e) => ({ attempts: [{ xml: '', error: (e as Error).message }] }) as MjxSculpture,
  );
  if (s.xml) fs.writeFileSync(path.join(outDir, `${tag}.xml`), s.xml + '\n');
  const err = s.attempts.at(-1)?.error;
  const v: Version = { tag, valid: !err && !!s.result, calls: log.filter((c, k) => k >= before && c.role === 'scultore').length, ...(err ? { error: err } : {}) };
  if (v.valid) {
    const c = await judgeIt(s, tag);
    if (c) {
      v.vote = c.voto;
      v.critique = c;
      // The next round improves the best so far.
      if (c.voto >= best.c.voto) best = { s, c, tag };
    }
  }
  versions.push(v);
  console.log(`${tag}: ${v.valid ? `valido, voto ${v.vote ?? '?'}` : `non valido — ${err?.slice(0, 160)}`} (${v.calls} chiamate)`);
}

const sum = (role: Call['role']) => {
  const xs = log.filter((c) => c.role === role);
  const t = { calls: xs.length, prompt: 0, cached: 0, output: 0, thoughts: 0, ms: 0 };
  for (const c of xs) for (const k of ['prompt', 'cached', 'output', 'thoughts', 'ms'] as const) t[k] += c[k];
  return t;
};
const sc = sum('scultore');
const jd = sum('giudice');
const summary = {
  run: runName,
  target: TARGET.name,
  model,
  judge: judgeModel,
  thinking,
  samples,
  rounds,
  best: best && { tag: best.tag, vote: best.c.voto, verdict: best.c.verdetto },
  versions,
  sculptor: { ...sc, usd: costOf(model, sc) },
  judgeUsage: { ...jd, usd: costOf(judgeModel, jd) },
  calls: log,
  minutes: (Date.now() - t0) / 60000,
};
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
if (best) fs.copyFileSync(path.join(outDir, `${best.tag}.png`), path.join(outDir, 'migliore.png'));
console.log(`migliore: ${best ? `${best.tag}, voto ${best.c.voto}` : 'nessuno'}`);
console.log(`scultore: ${sc.calls} chiamate · input ${sc.prompt} (cache ${sc.cached}) · risposta ${sc.output} · ragionamento ${sc.thoughts} · ${usd(summary.sculptor.usd)} · ${Math.round(sc.ms / 1000)} s`);
console.log(`giudice:  ${jd.calls} chiamate · input ${jd.prompt} · risposta ${jd.output} · ragionamento ${jd.thoughts} · ${usd(summary.judgeUsage.usd)}`);
