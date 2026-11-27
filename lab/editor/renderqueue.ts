// The queue of the editor's runs (T518): which text runs, when, and whose result is shown. Pure: the page feeds it events and does the
// actions it returns (start a run in the worker, cancel one by ending the worker, show a result). A run in the worker cannot be
// interrupted, so a new one cancels the one under way; a result that is not of the run under way is never shown. With the auto-render
// on, an edit starts a run after a pause in the typing (`delay`), from the text as it is then; with it off, only «Render» starts one.

export interface RenderRun {
  id: number;
  /** The edit the run started from: the text of `version`. */
  version: number;
  since: number;
}

export interface RenderState<R> {
  auto: boolean;
  /** Milliseconds of quiet after an edit before the auto-render starts. */
  delay: number;
  /** The request as of the last edit (the text of now). */
  latest: R | undefined;
  /** Edits counted: a run of an older version is out of date. */
  version: number;
  /** When the debounced run starts; null when none is waiting. */
  due: number | null;
  running: RenderRun | null;
  /** The run whose result is on screen. */
  shown: { id: number; version: number } | null;
  /** How the last run ended. */
  last: 'none' | 'shown' | 'failed' | 'cancelled';
  /** How long the last shown run took. */
  lastMs: number;
  nextId: number;
}

export type RenderEvent<R> =
  | { kind: 'edit'; request: R; now: number }
  /** «Render» (or anything explicit: a seed, a model loaded): now, from `request` if given or the last edit. */
  | { kind: 'render'; now: number; request?: R }
  | { kind: 'tick'; now: number }
  | { kind: 'done'; id: number; ok: boolean; now: number }
  | { kind: 'stop'; now: number }
  | { kind: 'auto'; on: boolean; now: number };

export type RenderAction<R> =
  | { kind: 'cancel'; id: number }
  | { kind: 'start'; id: number; request: R }
  | { kind: 'show'; id: number }
  /** A result that is not of the run under way: thrown away. */
  | { kind: 'drop'; id: number };

export interface RenderStep<R> {
  state: RenderState<R>;
  actions: RenderAction<R>[];
}

export const RENDER_DELAY = 350;

export function renderQueue<R>(auto: boolean, delay = RENDER_DELAY): RenderState<R> {
  return { auto, delay, latest: undefined, version: 0, due: null, running: null, shown: null, last: 'none', lastMs: 0, nextId: 1 };
}

function start<R>(s: RenderState<R>, now: number, actions: RenderAction<R>[]): RenderState<R> {
  if (s.latest === undefined) return { ...s, due: null };
  if (s.running) actions.push({ kind: 'cancel', id: s.running.id });
  const id = s.nextId;
  actions.push({ kind: 'start', id, request: s.latest });
  return { ...s, due: null, nextId: id + 1, running: { id, version: s.version, since: now }, last: s.running ? 'cancelled' : s.last };
}

export function renderStep<R>(s: RenderState<R>, e: RenderEvent<R>): RenderStep<R> {
  const actions: RenderAction<R>[] = [];
  switch (e.kind) {
    case 'edit': {
      // The same text again (an input that changed nothing, a «Render» that already took it): nothing new to run.
      if (s.latest !== undefined && e.request === s.latest) return { state: s, actions };
      const next = { ...s, latest: e.request, version: s.version + 1 };
      return { state: next.auto ? { ...next, due: e.now + next.delay } : { ...next, due: null }, actions };
    }
    case 'render': {
      const next = e.request !== undefined ? { ...s, latest: e.request, version: s.version + 1 } : s;
      return { state: start(next, e.now, actions), actions };
    }
    case 'tick':
      if (s.due === null || e.now < s.due) return { state: s, actions };
      return { state: start(s, e.now, actions), actions };
    case 'done': {
      if (!s.running || s.running.id !== e.id) {
        actions.push({ kind: 'drop', id: e.id });
        return { state: s, actions };
      }
      const run = s.running;
      if (!e.ok) return { state: { ...s, running: null, last: 'failed' }, actions };
      actions.push({ kind: 'show', id: e.id });
      return { state: { ...s, running: null, shown: { id: run.id, version: run.version }, last: 'shown', lastMs: e.now - run.since }, actions };
    }
    case 'stop':
      if (!s.running) return { state: { ...s, due: null }, actions };
      actions.push({ kind: 'cancel', id: s.running.id });
      return { state: { ...s, running: null, due: null, last: 'cancelled' }, actions };
    case 'auto': {
      const next = { ...s, auto: e.on };
      if (!e.on) return { state: { ...next, due: null }, actions };
      // Turned on with a text the screen does not show: it runs now.
      const behind = s.latest !== undefined && (s.running ? s.running.version : s.shown?.version ?? -1) !== s.version;
      return { state: behind ? start(next, e.now, actions) : next, actions };
    }
  }
}

export type RenderPhase = 'idle' | 'waiting' | 'running' | 'stale' | 'current' | 'failed' | 'cancelled';

export interface RenderStatus {
  phase: RenderPhase;
  /** Seconds of the run under way, or of the last one shown. */
  seconds: number;
  label: string;
}

const secs = (ms: number) => (ms / 1000).toLocaleString('it', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** What the page says about the runs, in words of the editor. */
export function renderStatus<R>(s: RenderState<R>, now: number): RenderStatus {
  if (s.running) {
    const ms = now - s.running.since;
    const behind = s.running.version !== s.version;
    return { phase: 'running', seconds: ms / 1000, label: `Render in corso… ${secs(ms)} s${behind ? ' · il testo è cambiato' : ''}` };
  }
  if (s.due !== null) return { phase: 'waiting', seconds: 0, label: 'Render tra poco…' };
  if (s.last === 'failed') return { phase: 'failed', seconds: 0, label: 'Render non riuscito' };
  const behind = s.latest !== undefined && s.shown?.version !== s.version;
  if (behind) return { phase: s.last === 'cancelled' ? 'cancelled' : 'stale', seconds: 0, label: s.last === 'cancelled' ? 'Render fermato · premi Render' : 'Il testo è cambiato · premi Render' };
  if (s.shown) return { phase: 'current', seconds: s.lastMs / 1000, label: `Aggiornato · ${secs(s.lastMs)} s` };
  return { phase: 'idle', seconds: 0, label: '' };
}

/** Bytes the frames of a run may hold: every frame is a copy of the grid and has its mesh, and the author's fort is 37,5 million cells. */
export const SNAPSHOT_BYTES = 256 * 1024 * 1024;

/**
 * How many frames of the generation a run keeps for a grid of `cells`: the engine keeps up to twice as many, so a large grid keeps a few
 * (the fort 3, 6 kept, 5 s of meshes instead of 81), a small one the 60 of before.
 */
export function snapshotsFor(cells: number, most = 60): number {
  if (!(cells > 0)) return most;
  return Math.max(2, Math.min(most, Math.floor(SNAPSHOT_BYTES / (2 * cells))));
}
