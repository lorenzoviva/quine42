import { describe, expect, it } from 'vitest';
import { renderQueue, renderStatus, renderStep, snapshotsFor, type RenderAction, type RenderEvent, type RenderState } from '../lab/editor/renderqueue';

// The queue of the editor's runs (T518): an edit during a run never shows the old result after the new one, and the run that starts is
// always of the text of now.

function play(s: RenderState<string>, events: RenderEvent<string>[]): { state: RenderState<string>; actions: RenderAction<string>[] } {
  const actions: RenderAction<string>[] = [];
  for (const e of events) {
    const r = renderStep(s, e);
    s = r.state;
    actions.push(...r.actions);
  }
  return { state: s, actions };
}

describe('la coda delle corse dell’editor (T518)', () => {
  it('con l’auto-render una modifica parte dopo la pausa, dal testo di allora', () => {
    const { state, actions } = play(renderQueue(true, 300), [
      { kind: 'edit', request: 'A', now: 0 },
      { kind: 'tick', now: 100 },
      { kind: 'edit', request: 'AB', now: 200 },
      { kind: 'tick', now: 400 },
      { kind: 'edit', request: 'ABC', now: 450 },
      { kind: 'tick', now: 760 },
    ]);
    expect(actions).toEqual([{ kind: 'start', id: 1, request: 'ABC' }]);
    expect(state.running?.id).toBe(1);
    expect(renderStatus(state, 1760).phase).toBe('running');
  });

  it('una corsa nuova annulla quella in corso, e il risultato vecchio non si mostra mai', () => {
    // A → corsa A; B durante la corsa; C: parte C, non B, e A non arriva sullo schermo.
    let s = renderQueue<string>(true, 300);
    let r = play(s, [{ kind: 'edit', request: 'A', now: 0 }, { kind: 'tick', now: 300 }]);
    expect(r.actions).toEqual([{ kind: 'start', id: 1, request: 'A' }]);
    s = r.state;
    r = play(s, [
      { kind: 'edit', request: 'B', now: 1000 },
      { kind: 'edit', request: 'C', now: 1100 },
      { kind: 'tick', now: 1400 },
    ]);
    expect(r.actions).toEqual([
      { kind: 'cancel', id: 1 },
      { kind: 'start', id: 2, request: 'C' },
    ]);
    s = r.state;
    // The worker of A was ended; if its answer arrived anyway it is thrown away.
    r = play(s, [{ kind: 'done', id: 1, ok: true, now: 1500 }]);
    expect(r.actions).toEqual([{ kind: 'drop', id: 1 }]);
    r = play(r.state, [{ kind: 'done', id: 2, ok: true, now: 2400 }]);
    expect(r.actions).toEqual([{ kind: 'show', id: 2 }]);
    expect(r.state.shown).toEqual({ id: 2, version: 3 });
    expect(renderStatus(r.state, 2500)).toMatchObject({ phase: 'current', seconds: 1 });
  });

  it('senza l’auto-render le modifiche aspettano «Render», che parte dal testo di ora', () => {
    const { state, actions } = play(renderQueue(false), [
      { kind: 'edit', request: 'A', now: 0 },
      { kind: 'tick', now: 5000 },
      { kind: 'edit', request: 'AB', now: 6000 },
      { kind: 'tick', now: 9000 },
    ]);
    expect(actions).toEqual([]);
    expect(renderStatus(state, 9000).phase).toBe('stale');
    const r = play(state, [{ kind: 'render', now: 9100 }]);
    expect(r.actions).toEqual([{ kind: 'start', id: 1, request: 'AB' }]);
  });

  it('«Render» durante una corsa la annulla e riparte subito', () => {
    const r = play(renderQueue(false), [
      { kind: 'render', request: 'A', now: 0 },
      { kind: 'edit', request: 'AB', now: 100 },
      { kind: 'render', now: 200 },
    ]);
    expect(r.actions).toEqual([
      { kind: 'start', id: 1, request: 'A' },
      { kind: 'cancel', id: 1 },
      { kind: 'start', id: 2, request: 'AB' },
    ]);
  });

  it('senza l’auto-render una corsa finisce anche se il testo è cambiato, e lo dice', () => {
    const r = play(renderQueue(false), [
      { kind: 'render', request: 'A', now: 0 },
      { kind: 'edit', request: 'AB', now: 100 },
    ]);
    expect(renderStatus(r.state, 500).label).toContain('il testo è cambiato');
    const done = play(r.state, [{ kind: 'done', id: 1, ok: true, now: 800 }]);
    expect(done.actions).toEqual([{ kind: 'show', id: 1 }]);
    expect(renderStatus(done.state, 900).phase).toBe('stale');
  });

  it('accendere l’auto-render con il testo indietro parte subito; spegnerlo toglie l’attesa', () => {
    let r = play(renderQueue(false), [
      { kind: 'edit', request: 'A', now: 0 },
      { kind: 'auto', on: true, now: 10 },
    ]);
    expect(r.actions).toEqual([{ kind: 'start', id: 1, request: 'A' }]);
    r = play(r.state, [
      { kind: 'done', id: 1, ok: true, now: 20 },
      { kind: 'edit', request: 'AB', now: 30 },
      { kind: 'auto', on: false, now: 40 },
      { kind: 'tick', now: 10_000 },
    ]);
    expect(r.actions).toEqual([{ kind: 'show', id: 1 }]);
    expect(r.state.due).toBeNull();
    // On again with the screen up to date: nothing to run.
    const again = play(play(renderQueue(true), [{ kind: 'render', request: 'A', now: 0 }, { kind: 'done', id: 1, ok: true, now: 1 }]).state, [{ kind: 'auto', on: false, now: 2 }, { kind: 'auto', on: true, now: 3 }]);
    expect(again.actions).toEqual([]);
  });

  it('«Ferma» annulla la corsa e una corsa fallita non si mostra', () => {
    let r = play(renderQueue(true, 100), [{ kind: 'edit', request: 'A', now: 0 }, { kind: 'tick', now: 100 }, { kind: 'stop', now: 200 }]);
    expect(r.actions).toEqual([
      { kind: 'start', id: 1, request: 'A' },
      { kind: 'cancel', id: 1 },
    ]);
    expect(renderStatus(r.state, 300).phase).toBe('cancelled');
    r = play(r.state, [{ kind: 'render', now: 400 }, { kind: 'done', id: 2, ok: false, now: 500 }]);
    expect(r.actions).toEqual([{ kind: 'start', id: 2, request: 'A' }]);
    expect(r.state.shown).toBeNull();
    expect(renderStatus(r.state, 600).phase).toBe('failed');
  });

  it('una modifica che non cambia il testo non rifà la corsa', () => {
    const r = play(renderQueue(true, 100), [
      { kind: 'render', request: 'A', now: 0 },
      { kind: 'edit', request: 'A', now: 10 },
      { kind: 'tick', now: 500 },
    ]);
    expect(r.actions).toEqual([{ kind: 'start', id: 1, request: 'A' }]);
    expect(r.state.running?.version).toBe(r.state.version);
  });

  it('niente testo, niente corsa', () => {
    expect(play(renderQueue<string>(true), [{ kind: 'render', now: 0 }, { kind: 'tick', now: 1000 }]).actions).toEqual([]);
  });

  it('una griglia grande tiene pochi fotogrammi, una piccola i 60 di prima', () => {
    expect(snapshotsFor(12 * 12 * 12)).toBe(60);
    expect(snapshotsFor(500 * 500 * 150)).toBe(3);
    expect(snapshotsFor(2000 * 2000 * 200)).toBe(2);
    expect(snapshotsFor(Number.NaN)).toBe(60);
  });
});
