// The SoundLab's work off the page: a program can take long, and a render takes tens of milliseconds at every turn of a knob.
// The page uses two of these: the one that runs programs can be killed when a program does not end, and the other keeps playing what it had.

import { describe, Mj3Error, run, type PaletteEntry } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { scoreOf, type Score, type SoundSettings } from '../../src/mj/sound';
import { renderScore, SOUND_LIMITS, SOUND_MAX_STEPS } from '../../src/mj/synth';
import { nodeName, traceProgram } from '../../src/mj/trace';
import { extractLineFromError } from '../editor/syntax';
import { retouch, runOnGrid, toGrid3, type GridData, type Retouched } from './logic';

/** About this many states of a run: the steps the page walks through. */
const SHOTS = 48;

export type SoundRequest =
  | { kind: 'run'; id: number; xml: string; seed: number }
  | { kind: 'retouch'; id: number; xml: string; seed: number; grid: GridData }
  | { kind: 'runOn'; id: number; xml: string; seed: number; grid: GridData }
  | { kind: 'render'; id: number; grid: GridData; settings: SoundSettings; seed: number }
  /** One cell, once: what a stroke of the brush sounds like. */
  | { kind: 'audition'; id: number; grid: GridData; settings: SoundSettings; seed: number };

export interface RunReply {
  kind: 'run';
  id: number;
  ok: true;
  grid: GridData;
  shots: Array<{ X: number; Y: number; Z: number; cells: Uint8Array; step: number }>;
  palette: Record<string, PaletteEntry>;
  settings: SoundSettings | undefined;
  name?: string;
  warnings: string[];
  steps: number;
  finished: boolean;
  ms: number;
  nodes: Array<{ what: string; runs: number; cells: number; why?: string }>;
}

export type SoundReply =
  | RunReply
  | { kind: 'run'; id: number; ok: false; error: string; line: number }
  | { kind: 'retouch'; id: number; result: Retouched }
  | { kind: 'runOn'; id: number; grid?: GridData; error?: string }
  | { kind: 'render'; id: number; samples: Float32Array; sampleRate: number; loopStart: number; loopEnd: number; truncated: boolean; steps: number; events: number; byTrack: Record<number, number>; ms: number }
  | { kind: 'audition'; id: number; samples: Float32Array; sampleRate: number };

const post = (r: SoundReply, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(r, transfer);
const plain = (g: GridData): GridData => ({ X: g.X, Y: g.Y, Z: g.Z, cells: g.cells, alphabet: g.alphabet });

function runProgram(q: Extract<SoundRequest, { kind: 'run' }>): void {
  try {
    const m = compileMjx(q.xml);
    // No deadline: the clock must not choose the notes. It is the page that kills a program that does not end.
    const t = traceProgram(m, q.seed, { deadline: 0, maxSteps: SOUND_MAX_STEPS, limits: SOUND_LIMITS });
    const r = run(m.program, q.seed, SOUND_MAX_STEPS, SOUND_LIMITS, { snapshots: SHOTS });
    post({
      kind: 'run',
      id: q.id,
      ok: true,
      grid: plain(r.grid),
      shots: r.snapshots ?? [],
      palette: m.program.palette,
      settings: m.sound,
      ...(m.name ? { name: m.name } : {}),
      warnings: m.warnings,
      steps: r.steps,
      finished: r.finished,
      ms: t.ms,
      nodes: t.nodes.filter((n) => n.node.type !== 'sequence' && n.node.type !== 'markov').map((n) => ({ what: describe(n.node) ?? nodeName(n.node), runs: n.runs, cells: n.cells, ...(n.why ? { why: n.why } : {}) })),
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    post({ kind: 'run', id: q.id, ok: false, error, line: extractLineFromError(error) });
  }
}

function renderGrid(q: Extract<SoundRequest, { kind: 'render' }>): void {
  const t0 = performance.now();
  const score = scoreOf(toGrid3(q.grid), q.settings);
  const r = renderScore(score, q.seed);
  const byTrack: Record<number, number> = {};
  for (const e of score.events) byTrack[e.track] = (byTrack[e.track] ?? 0) + 1;
  post(
    { kind: 'render', id: q.id, samples: r.samples, sampleRate: r.sampleRate, loopStart: r.loopStart, loopEnd: r.loopEnd, truncated: r.truncated, steps: score.steps, events: score.events.length, byTrack, ms: performance.now() - t0 },
    [r.samples.buffer],
  );
}

function audition(q: Extract<SoundRequest, { kind: 'audition' }>): void {
  const whole = scoreOf(toGrid3(q.grid), q.settings);
  // Long enough for a note, whatever the program's loop is.
  const score: Score = { ...whole, steps: 8, events: whole.events.map((e) => ({ ...e, step: 0 })) };
  const r = renderScore(score, q.seed, { loops: 1 });
  post({ kind: 'audition', id: q.id, samples: r.samples, sampleRate: r.sampleRate }, [r.samples.buffer]);
}

self.onmessage = (ev: MessageEvent<SoundRequest>) => {
  const q = ev.data;
  if (q.kind === 'run') runProgram(q);
  else if (q.kind === 'retouch') post({ kind: 'retouch', id: q.id, result: retouch(q.xml, q.seed, q.grid) });
  else if (q.kind === 'runOn') {
    try {
      post({ kind: 'runOn', id: q.id, grid: plain(runOnGrid(q.xml, q.seed, q.grid)) });
    } catch (e) {
      if (!(e instanceof Mj3Error)) throw e;
      post({ kind: 'runOn', id: q.id, error: e.message });
    }
  } else if (q.kind === 'render') renderGrid(q);
  else audition(q);
};
