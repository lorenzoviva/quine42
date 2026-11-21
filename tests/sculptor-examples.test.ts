// The Sculptor's examples chosen well (T467, S1 of T458 § 3.2): a model written by hand of the seed of the request's class, then the best
// of the universe of the same class, size and kind with a vote of at least EXAMPLE_SCORE; never the studio, the showcase, a part, a program
// that grows by rules, a vessel that does not float, the request itself; always the same for the same library.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { Council } from '../src/kernel/agents/council';
import { DEFAULT_SCULPTORS, EXAMPLE_CHARS, EXAMPLE_SCORE, examplesFor, sculpt, type ExampleRequest, type SculptRequest } from '../src/kernel/agents/sculptor';
import type { FileMap } from '../src/kernel/types';

const SEED_INDEX: Record<string, Record<string, unknown>> = JSON.parse(bundledFiles['models/index.json']);

/** The ids of the examples, from the library they were chosen in. */
function idsOf(files: FileMap, examples: string[]): string[] {
  return examples.map((x) => Object.keys(files).find((p) => /^models\/[^/]+\.xml$/.test(p) && files[p].trim() === x)?.slice(7, -4) ?? '?');
}

const pick = (files: FileMap, req: ExampleRequest | string) => idsOf(files, examplesFor(files, req));

/** A small program of its own text for each id (two models are never the same program). */
const program = (id: string, extra = '') => `<!-- ${id} -->\n<sequence values="BW" size="20 20 20"${extra}><box at="10 10 0" size="8 8 8" color="W"/></sequence>`;
const WORN = (id: string) => `${program(id)}\n<worn zone="head"><all in="z" out="W"/></worn>`;

/** The seed with models of a universe added (a vote, an author, a size), the index in the order given. */
function universe(models: Record<string, { info: Record<string, unknown>; xml?: string }>, reversed = false): FileMap {
  const files: Record<string, string> = { ...bundledFiles };
  const index: Record<string, unknown> = { ...SEED_INDEX };
  for (const [id, m] of Object.entries(models)) {
    index[id] = m.info;
    files[`models/${id}.xml`] = m.xml ?? program(id);
  }
  const entries = Object.entries(index);
  files['models/index.json'] = JSON.stringify(Object.fromEntries(reversed ? entries.reverse() : entries));
  return files;
}

const sculpted = (cls: string, score: number, more: Record<string, unknown> = {}) => ({ class: cls, author: 'gemini-3.1-flash-lite', score, card: { author: 'sculptor', payer: 'comune', holder: 'me' }, ...more });

describe('gli esempi dello Scultore (T467)', () => {
  it('nel seme: un modello a mano della classe, il generico per primo, mai lo studio, la vetrina, le parti, ciò che cresce a regole', () => {
    const one: Record<string, string> = { pebble: 'pebble', rock: 'rock', bush: 'bush', tree: 'tree', furniture: 'furniture', person: 'person', animal: 'animal', beast: 'beast', monument: 'monument', building: 'building', vessel: 'vessel' };
    for (const [classe, id] of Object.entries(one)) expect(pick(bundledFiles, classe), classe).toEqual([id]);
    // The object: the scissors in its box, not the star of the generic, at 32 voxels a tile; tinted, worn or not.
    expect(pick(bundledFiles, 'object')).toEqual(['forbici']);
    const shape: SculptRequest = { id: 'shape-sack', nome: 'sacco (forma comune degli oggetti)', aspetto: 'un sacco', classe: 'object', tinta: true };
    expect(pick(bundledFiles, shape)).toEqual(['forbici']);
    expect(pick(bundledFiles, { classe: 'object', worn: 'head' })).toEqual(['forbici']);
    // A medium structure does not grow by rules: the structures of the seed do (the farm, the half-timbered house), it learns from the buildings.
    expect(pick(bundledFiles, { classe: 'structure', taglia: 'medium' })).toEqual(['building']);
    // A person learns from the generic, not from the wanderer's body; a vessel from one that floats, not from the capsule of the void.
    expect(pick(bundledFiles, 'person')).not.toContain('viandante');
    expect(examplesFor(bundledFiles, 'vessel').every((x) => /waterline="\d+"/.test(x))).toBe(true);
    for (const classe of Object.keys(one)) for (const id of pick(bundledFiles, classe)) expect(id).not.toMatch(/^(corona-|schermo-|circuito-|part-|struttura-|fattoria$)/);
  });

  it('il migliore dell’universo con voto ≥ EXAMPLE_SCORE, dopo quello a mano: il voto, poi l’id; la stessa scelta in ogni ordine dell’indice', () => {
    expect(EXAMPLE_SCORE).toBe(6);
    const models = {
      'mobile-b': { info: sculpted('furniture', 7) },
      'mobile-a': { info: sculpted('furniture', 7) },
      'mobile-c': { info: sculpted('furniture', 6) },
      'mobile-basso': { info: sculpted('furniture', 5) },
      'mobile-grande': { info: sculpted('furniture', 9, { size: 'large' }) },
      'corona-mobile': { info: sculpted('furniture', 10) },
    };
    for (const reversed of [false, true]) {
      const files = universe(models, reversed);
      expect(pick(files, 'furniture')).toEqual(['furniture', 'mobile-a']);
      // The request itself is never its example (a model sculpted again): the next.
      expect(pick(files, { classe: 'furniture', id: 'mobile-a' })).toEqual(['furniture', 'mobile-b']);
      // Another size, another box: the large chest at 9 is the example of a large request, not of a medium one.
      expect(pick(files, { classe: 'furniture', taglia: 'large' })).toEqual(['furniture', 'mobile-grande']);
    }
    // At the threshold it is in, under it out; without votes, only the one written by hand.
    expect(pick(universe({ x: { info: sculpted('rock', EXAMPLE_SCORE) } }), 'rock')).toEqual(['rock', 'x']);
    expect(pick(universe({ x: { info: sculpted('rock', EXAMPLE_SCORE - 1) } }), 'rock')).toEqual(['rock']);
    expect(pick(universe({ x: { info: { class: 'rock', author: 'gemini-3.1-flash-lite' } } }), 'rock')).toEqual(['rock']);
  });

  it('della stessa specialità: un capo indossato solo a chi si indossa, una nave che galleggia, una struttura media senza regole', () => {
    const files = universe({
      cappello: { info: sculpted('object', 6), xml: WORN('cappello') },
      lanterna: { info: sculpted('object', 7) },
      zattera: { info: sculpted('vessel', 6), xml: program('zattera', ' waterline="4"') },
      navetta: { info: sculpted('vessel', 9) },
      bottega: { info: sculpted('structure', 7, { size: 'medium' }) },
      palazzo: { info: sculpted('structure', 10) },
      lungo: { info: sculpted('animal', 10), xml: `<!-- ${'x'.repeat(EXAMPLE_CHARS)} -->\n${program('lungo')}` },
    });
    expect(pick(files, 'object')).toEqual(['forbici', 'lanterna']);
    expect(pick(files, { classe: 'object', worn: 'head' })).toEqual(['forbici', 'cappello']);
    expect(pick(files, 'vessel')).toEqual(['vessel', 'zattera']);
    // The medium structure learns from a building and from the universe's medium structure; the large one grows by rules: never.
    expect(pick(files, { classe: 'structure', taglia: 'medium' })).toEqual(['building', 'bottega']);
    // Longer than EXAMPLE_CHARS: it would go into every request of its class.
    expect(pick(files, 'animal')).toEqual(['animal']);
  });

  it('un indice che non si legge non getta: nessun esempio', () => {
    for (const index of ['{', '[]', 'null', '{"x": null, "y": 3}']) expect(examplesFor({ ...bundledFiles, 'models/index.json': index }, 'rock')).toEqual([]);
  });

  it('vanno nel sistema dello Scultore, quello a mano per primo', async () => {
    const calls: TextCall[] = [];
    class Recording extends MockAiModels {
      async text(call: TextCall): Promise<string> {
        calls.push(call);
        return super.text(call);
      }
    }
    const files = universe({ 'mobile-a': { info: sculpted('furniture', 8) } });
    const c = new Council(new Recording(), () => ({ files, palette: {}, catalog: [] }));
    await sculpt(c, { id: 'baule', nome: 'Baule', aspetto: 'un baule di legno', classe: 'furniture' }, DEFAULT_SCULPTORS, { semplici: 1, revisione: false, giudizio: false });
    const system = calls.find((x) => x.task === 'model.sculpt')!.system ?? '';
    const [hand, best] = examplesFor(files, 'furniture');
    expect(system).toContain('## Examples (programs of the library)');
    expect(system.indexOf(hand)).toBeGreaterThan(system.indexOf('## Examples'));
    expect(system.indexOf(best)).toBeGreaterThan(system.indexOf(hand));
  });
});
