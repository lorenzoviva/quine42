// The sculptor of step 8.2A: writes MarkovJunior XML (lab/mjx/model.ts) for a whole model, instead of the
// JSON programs of steps 8A-8E. Same targets, classes and artist as lab/mj3d/sculptor.ts; the lab runs the
// program, measures it and sends it back with the reason while it does not work.

import type { Models } from '../../src/kernel/ai/models';
import { analyse, type Analysis } from '../../src/mj/check';
import { Mj3Error, type RunResult } from '../../src/mj/engine';
import { classFor, describe, type Critique, type Target } from './target';
import { boxOf, CLASSES, TILE, type AssetClass } from '../../src/mj/classes';
import { compileMjx, type MjxModel } from '../../src/mj/model';
import { MJ_PALETTE } from '../../src/mj/palette';
import { runMjx } from '../../src/mj/run';
import SCULPTOR from '../prompts/scultore-mj.md?raw';

const examples = import.meta.glob('./models/*.xml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const example = (id: string) => examples[`./models/${id}.xml`]?.trim();

/** The examples that teach most for a class (at most two: they are most of what a call pays in input). */
const EXAMPLES_FOR: Record<string, string[]> = {
  persona: ['viandante', 'fabbro'],
  animale: ['gatto', 'viandante'],
  bestia: ['lupo', 'viandante'],
  albero: ['pino', 'fiore'],
  cespuglio: ['fiore', 'cespuglio'],
  roccia: ['masso', 'fiore'],
  sasso: ['masso', 'fiore'],
  oggetto: ['falo', 'barile'],
  mobile: ['barile', 'falo'],
  monumento: ['casa', 'falo'],
  edificio: ['casa', 'falo'],
  grande: ['fattoria', 'falo'],
};

const classLine = (c: AssetClass) => {
  const b = boxOf(c);
  return `  - ${c.id} (${c.name}): ${b.join('×')} voxel = ${c.tiles.join('×')} caselle${c.minHeight ? `, alto almeno ${Math.round(c.minHeight * b[2])}` : ''}; ${c.hint}`;
};

export function mjxSystem(kind: string, withExamples = true): string {
  const palette = Object.entries(MJ_PALETTE)
    .map(([k, v]) => `${k} ${v.color.slice(1)}`)
    .join(' · ');
  let s = SCULPTOR.replaceAll('@@TILE@@', String(TILE))
    .replace('@@CLASSES@@', CLASSES.map(classLine).join('\n'))
    .replace('@@PALETTE@@', palette);
  if (withExamples) {
    const ids = EXAMPLES_FOR[kind] ?? ['masso', 'casa'];
    s += `\n## Esempi (programmi del laboratorio)\n${ids.map((id) => example(id)).filter(Boolean).join('\n\n')}\n`;
  }
  return s.trim();
}

/** The XML in an answer: inside a code fence if there is one, from the first "<" to the last ">". */
export function extractXml(raw: string): string {
  const fence = /```(?:xml)?\s*([\s\S]*?)```/.exec(raw);
  const s = fence ? fence[1] : raw;
  const a = s.indexOf('<'), b = s.lastIndexOf('>');
  return a >= 0 && b > a ? s.slice(a, b + 1) : s;
}

export interface MjxAttempt {
  xml: string;
  error?: string;
  analysis?: Analysis;
}

export interface MjxSculpture {
  xml?: string;
  model?: MjxModel;
  result?: RunResult;
  analysis?: Analysis;
  attempts: MjxAttempt[];
}

function attempt(raw: string, t: Target): { a: MjxAttempt; model?: MjxModel; result?: RunResult } {
  const xml = extractXml(raw);
  const { box, minHeight } = classFor(t);
  try {
    const model = compileMjx(xml, { size: box });
    const result = runMjx(model, 1, { deadline: 20_000 });
    if (!result.finished) return { a: { xml, error: 'il programma non finisce in 20 secondi: ogni crescita deve avere steps' }, model };
    const analysis = analyse(result, model.program.palette, { grounded: true, minHeight });
    const notes = [...analysis.errors];
    // A model that fills (nearly) the whole box is a block, not a shape: something grew without limit.
    const cells = result.grid.X * result.grid.Y * result.grid.Z;
    if (analysis.voxels > cells * 0.85) notes.push(`riempie il ${Math.round((analysis.voxels / cells) * 100)}% della scatola: qualcosa cresce senza limite (manca steps?) o la prima lettera di values non è la cella vuota`);
    return { a: { xml, analysis, ...(notes.length ? { error: notes.join('; ') } : {}) }, model, result };
  } catch (e) {
    return { a: { xml, error: e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}` } };
  }
}

export interface MjxPrevious {
  xml: string;
  critique?: Critique;
  views?: string;
}

/**
 * Asks for a program and sends it back with the reason while it is invalid (compile error, empty,
 * floating, too low, never ending). Nodes that never did anything go back too, as a hint.
 */
export async function sculptMjx(models: Models, t: Target, opts: { retries: number; style?: string; examples?: boolean }, previous?: MjxPrevious): Promise<MjxSculpture> {
  const kind = classFor(t).cls.id;
  const system = mjxSystem(kind, opts.examples !== false);
  let prompt = describe(t, opts.style).replace(/scatola \(size\)/, 'scatola');
  const images: string[] = [];
  if (previous) {
    prompt += `\n\nIl tuo programma precedente:\n${previous.xml}`;
    if (previous.views) {
      prompt += "\nL'immagine allegata mostra il modello da quattro lati (fronte, destra, retro, sinistra).";
      images.push(previous.views);
    }
    if (previous.critique) prompt += `\nL'Artista gli ha dato ${previous.critique.voto}/10.\nProblemi: ${previous.critique.problemi.join('; ') || '—'}\nConsigli: ${previous.critique.consigli.join('; ') || '—'}`;
    prompt += '\nMiglioralo: rispondi con il programma completo.';
  }
  const attempts: MjxAttempt[] = [];
  let last: ReturnType<typeof attempt> | undefined;
  for (let i = 0; i <= opts.retries; i++) {
    const p =
      i === 0
        ? prompt
        : `${prompt}\n\nIl programma che hai scritto:\n${last!.a.xml.slice(0, 6000)}\nNon va: ${last!.a.error}\n${last!.result?.unused?.length ? `Nodi che non hanno mai fatto nulla: ${last!.result.unused.join(' | ')}\n` : ''}Correggilo e rispondi con il programma completo.`;
    const raw = await models.text({ agent: 'Scultore', task: 'lab.sculpt.mjx', system, prompt: p, images, temperature: 0.7, data: { target: t, attempt: i, previous } });
    last = attempt(raw, t);
    attempts.push(last.a);
    if (!last.a.error) break;
  }
  return { xml: last!.a.xml, model: last!.model, result: last!.result, analysis: last!.a.analysis, attempts };
}
