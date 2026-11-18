// The Scenografo in the game, the way of data (T410, ADR-0214): the rules read without trusting them, the key of a furnished building, a
// building of the seed furnished from data with the guard of T409 (nothing on the building, the door and the storeys kept), the director
// offline from the bakery of the village sculpted offline to its furniture, and the task in the census, the knob, the queue and the payer.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { slowTask } from '../src/kernel/ai/subscription';
import { catalogueText, describeBuilding, interiorSchema, INTERIOR_TASK } from '../src/kernel/agents/scenographer';
import { AGENTS } from '../src/kernel/agents/council';
import { bundledFiles } from '../src/kernel/bundle';
import { isCommonTask } from '../src/kernel/cards';
import { CENSUS, COEFFICIENT_INFO, FULL_DETAIL, hourlyEstimate, interiorGap, LOW_DETAIL, repairCoefficients } from '../src/kernel/coefficients';
import { campaignSectionsFor } from '../src/kernel/campaign';
import { SEATS } from '../src/kernel/corona';
import { FormCache, formKey, Forms, InlineRunner, storeysOf, walkIn } from '../src/kernel/forms';
import { FURNISH_CAPS, furnishWithRules, furniturePiece, interiorRooms, INTERIOR_LIMITS, readInterior, readRules, ruleFor, turned } from '../src/kernel/furnish';
import { InteriorGuard, interiorPlan } from '../src/kernel/interior';
import { internalAgent } from '../src/kernel/internalNames';
import { partErrors } from '../src/mj/check';
import { habitableParts } from '../src/kernel/forms';
import { partVoxels } from '../src/mj/classes';
import { boot, run } from './world';

/** The bench's offline answer (`lab/banco/scenografo/offline/dati.json`), the local models' too. */
const RULES = {
  rules: [
    { storey: 0, room: 'hall', furniture: ['banco', 'credenza', 'barile'], count: 3 },
    { room: 'room', furniture: ['letto', 'furniture'], count: 2 },
    { furniture: ['barile'], count: 1 },
  ],
};
const HOUSE = 'struttura-casa-del-borgomastro';

/** The seed with an interior on one of its buildings, in a library of its own. */
function withInterior(model: string, interior: unknown): Forms {
  const index = JSON.parse(bundledFiles['models/index.json']);
  index[model] = { ...index[model], interior };
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load({ ...bundledFiles, 'models/index.json': JSON.stringify(index) });
  return forms;
}

describe('le regole dello Scenografo, lette senza fidarsi (T410)', () => {
  const known = (id: string) => ['banco', 'letto', 'barile'].includes(id);
  it('tiene ciò che il kernel sa usare e dice a parte gli id che non conosce', () => {
    const { rules, unknown } = readRules(
      {
        rules: [
          { storey: 0, room: 'hall', area: 'house', furniture: ['banco', 'trono-d-oro', 'letto', 'letto'], count: 9 },
          { room: 'salotto', area: '*', furniture: ['barile'], count: 2.6 },
          { storey: -1, furniture: ['barile'], count: 1 },
          { furniture: ['nulla'], count: 3 },
          { furniture: ['banco'], count: 0 },
          'non una regola',
        ],
      },
      known,
    );
    expect(rules).toEqual([
      { storey: 0, area: 'house', room: 'hall', furniture: ['banco', 'letto', 'letto'], count: INTERIOR_LIMITS.count },
      { furniture: ['barile'], count: 3 },
      { furniture: ['barile'], count: 1 },
    ]);
    expect(unknown.sort()).toEqual(['nulla', 'trono-d-oro']);
    expect(readRules({ rules: 'tutte' }, known).rules).toEqual([]);
    expect(readRules(null, known).rules).toEqual([]);
  });
  it('al più 16 regole; un interno senza regole usabili non c’è', () => {
    const many = { rules: Array.from({ length: 40 }, () => ({ furniture: ['banco'], count: 1 })) };
    expect(readRules(many, known).rules.length).toBe(INTERIOR_LIMITS.rules);
    expect(readInterior({ rules: [{ furniture: ['nulla'], count: 2 }] }, known)).toBeUndefined();
    expect(readInterior({ ...RULES, author: 'x'.repeat(200) }, known)?.author).toBeUndefined();
    expect(readInterior({ ...RULES, author: 'offline' }, known)?.author).toBe('offline');
  });
  it('la prima regola che corrisponde a una stanza decide', () => {
    const { rules } = readRules(RULES, () => true);
    expect(ruleFor(rules, { storey: 0, kind: 'hall' })?.furniture).toEqual(['banco', 'credenza', 'barile']);
    expect(ruleFor(rules, { storey: 1, kind: 'hall' })?.furniture).toEqual(['barile']);
    expect(ruleFor(rules, { storey: 1, kind: 'room' })?.furniture).toEqual(['letto', 'furniture']);
  });
});

describe('un edificio del seme arredato dai dati con la guardia (T410)', () => {
  it('la richiesta porta l’interno, la chiave è un’altra voce, la forma nuda resta la sua', () => {
    const forms = withInterior(HOUSE, RULES);
    const q = forms.request(HOUSE, 1)!;
    expect(q.interior?.rules.length).toBe(3);
    expect(Object.keys(q.interior!.furniture).sort()).toEqual(['banco', 'barile', 'credenza', 'furniture', 'letto']);
    const bare = forms.request(HOUSE, 1, undefined, { bare: true })!;
    expect(bare.interior).toBeUndefined();
    expect(formKey(q)).not.toBe(formKey(bare));
    expect(formKey(q).startsWith('["interior","data"')).toBe(true);
    expect(formKey(q).endsWith(formKey(bare))).toBe(true);
    // Other rules, another entry; the same rules, the same entry.
    const other = withInterior(HOUSE, { rules: [{ furniture: ['letto'], count: 2 }] }).request(HOUSE, 1)!;
    expect(formKey(other)).not.toBe(formKey(q));
    expect(formKey(withInterior(HOUSE, RULES).request(HOUSE, 1)!)).toBe(formKey(q));
    // A building that does not grow by rules, a piece that is not furniture, a corona's lamp: no interior.
    expect(withInterior('building', RULES).request('building', 1)!.interior).toBeUndefined();
    expect(withInterior(HOUSE, { rules: [{ furniture: ['corona-lampione', 'structure'], count: 2 }] }).request(HOUSE, 1)!.interior).toBeUndefined();
    expect(forms.furniture().some((id) => id.startsWith('corona-'))).toBe(false);
  });

  it('i mobili stanno sul pavimento libero, mai sull’edificio né sul protetto; i piani, la porta e la stanza dello Scultore restano', async () => {
    const forms = withInterior(HOUSE, RULES);
    for (const seed of [1, 2]) {
      const bare = (await forms.settled(HOUSE, seed, undefined, undefined, { bare: true }))!;
      const f = (await forms.settled(HOUSE, seed))!;
      expect(f.status).toBe('ready');
      expect(f.furnished).toBe(true);
      expect(forms.current(f)).toBe(true);
      const g0 = bare.result!.grid, g = f.result!.grid;
      const actions = forms.compiled(HOUSE)!.actions;
      // The building is not touched: every voxel of it is the same letter.
      let added = 0;
      for (let i = 0; i < g.cells.length; i++) {
        if (g0.cells[i]) expect(g.alphabet[g.cells[i]]).toBe(g0.alphabet[g0.cells[i]]);
        else if (g.cells[i]) added++;
      }
      expect(added).toBeGreaterThan(1000);
      expect(g.alphabet.length).toBeLessThanOrEqual(255);
      // Nothing on what the plan keeps (the door and the way in, the stairs and their feet) on the feet layer of a storey: there the grid is
      // the building's (the door's leaf where it is shut).
      const plan = interiorPlan({ grid: g0, palette: bare.result!.palette, vpt: bare.vpt, base: bare.base, actions, seed });
      const XY = plan.X * plan.Y;
      let kept = 0;
      for (const p of plan.storeys)
        for (let i = 0; i < XY; i++)
          if (p.kept[i]) {
            kept++;
            expect(g.cells[i + p.z * XY]).toBe(g0.cells[i + p.z * XY]);
          }
      expect(kept).toBeGreaterThan(0);
      expect(plan.door).toBeDefined();
      expect(plan.ground!.kept[plan.door!.x + plan.door!.y * plan.X]).toBe(1);
      // Every storey still reached from the door, and the Sculptor's parts as they were.
      const w0 = walkIn(g0, bare.result!.palette, bare.vpt, bare.base, actions, seed);
      const w1 = walkIn(g, f.result!.palette, f.vpt, f.base, actions, seed);
      expect(storeysOf(w1, f.vpt)).toEqual(storeysOf(w0, bare.vpt));
      const clear = partVoxels(f.vpt).storey.clear;
      const before = partErrors(habitableParts(g0, bare.result!.palette, bare.vpt, clear, bare.base, actions, seed), f.vpt);
      expect(partErrors(habitableParts(g, f.result!.palette, f.vpt, clear, f.base, actions, seed), f.vpt).filter((e) => !before.includes(e))).toEqual([]);
    }
  }, 240_000);

  it('il kernel posa ciò che la guardia ammette, e la stessa forma su ogni macchina', async () => {
    const forms = withInterior(HOUSE, RULES);
    const bare = (await forms.settled(HOUSE, 1, undefined, undefined, { bare: true }))!;
    const actions = forms.compiled(HOUSE)!.actions;
    const plan = () => interiorPlan({ grid: bare.result!.grid, palette: bare.result!.palette, vpt: bare.vpt, base: bare.base, actions, seed: 1 });
    const pieces = new Map(['banco', 'credenza', 'barile', 'letto', 'furniture'].map((id) => [id, furniturePiece(id, forms.request(id, 1, undefined, { bare: true })!, bare.vpt)!]));
    // A piece of one tile at 20 is one tile at 16 (resampled), and turned it keeps its voxels.
    const banco = pieces.get('banco')!;
    expect(banco.X / bare.vpt).toBeLessThanOrEqual(1);
    expect(turned(banco, 1).X).toBe(banco.Y);
    expect(turned(banco, 4).cells).toEqual(banco.cells);
    const { rules } = readRules(RULES, () => true);
    const a = furnishWithRules(plan(), rules, pieces, 1);
    const b = furnishWithRules(plan(), rules, pieces, 1);
    expect(a.pieces).toBeGreaterThan(3);
    expect([...a.voxels]).toEqual([...b.voxels]);
    expect(furnishWithRules(plan(), rules, pieces, 2).voxels).not.toEqual(a.voxels);
    // Whatever the rules ask (six pieces in every room), what a building's furnishing does is bounded, counted and not timed.
    const greedy = readRules({ rules: [{ furniture: ['banco', 'credenza', 'barile', 'letto', 'furniture'], count: 6 }] }, () => true).rules;
    const g = furnishWithRules(plan(), greedy, pieces, 1);
    expect(g.pieces).toBeLessThanOrEqual(FURNISH_CAPS.pieces);
    expect(g.refused.wall + g.refused.animals + g.refused.cellar + g.refused.room).toBeLessThanOrEqual(FURNISH_CAPS.guard);
    // Every voxel of furniture is air of the building, and a storey has one hall.
    expect([...a.voxels].every((v) => bare.result!.grid.cells[v] === 0)).toBe(true);
    const rooms = interiorRooms(plan());
    expect(rooms.filter((r) => r.storey === 0 && r.kind === 'hall').length).toBe(1);
    // The guard of T409 refuses a piece on the building: what it admitted it would admit again only off it.
    const guard = new InteriorGuard(plan());
    const wall = bare.result!.grid.cells.findIndex((c) => c !== 0);
    expect(guard.refusal([wall])).toBe('wall');
  }, 240_000);

  it('finché i mobili non ci sono si vede l’edificio nudo; un interno che non si posa lascia l’edificio com’è', async () => {
    const forms = withInterior(HOUSE, RULES);
    await forms.settled(HOUSE, 3, undefined, undefined, { bare: true });
    const f = forms.get(HOUSE, 3)!;
    expect(f.furnished).toBe(true);
    if (f.status === 'pending') expect(forms.ready(HOUSE, 3)?.furnished).toBeUndefined();
    await forms.settled(HOUSE, 3);
    expect(forms.ready(HOUSE, 3)?.furnished).toBe(true);
    // A farm whose storey is too small for a piece: furnished form, the same voxels as built.
    const farm = withInterior('fattoria', RULES);
    const ff = (await farm.settled('fattoria', 1))!;
    const fb = (await farm.settled('fattoria', 1, undefined, undefined, { bare: true }))!;
    expect(ff.status).toBe('ready');
    expect([...ff.result!.grid.cells]).toEqual([...fb.result!.grid.cells]);
  }, 240_000);
});

describe('lo Scenografo nel Concilio (T410)', () => {
  it('il compito ha la sua riga del censimento, la sua manopola, la coda degli abbonamenti, e lo paga il mondo', () => {
    const row = CENSUS.find((c) => c.compito === INTERIOR_TASK)!;
    expect(row).toMatchObject({ agente: 'scenographer', modo: 'diretta', coefficiente: 'interiors' });
    expect(COEFFICIENT_INFO.interiors.agente).toBe('scenographer');
    expect(FULL_DETAIL.interiors).toBe(1);
    expect(LOW_DETAIL.coefficients.interiors).toBeLessThan(1);
    expect(repairCoefficients(undefined).interiors).toBe(1);
    expect(repairCoefficients({ interni: 0 }).interiors).toBe(0);
    expect(interiorGap(0)).toBe(Infinity);
    expect(interiorGap(1)).toBe(0);
    expect(slowTask(INTERIOR_TASK)).toBe(true);
    expect(isCommonTask(INTERIOR_TASK)).toBe(true);
    expect(internalAgent('scenografo')).toBe('scenographer');
    expect(AGENTS.scenographer.name).toBe('Scenografo');
    expect(campaignSectionsFor('scenographer')).toEqual(['all', 'sculptor-artist']);
    expect(SEATS.some((s) => s.agent === 'scenographer' && s.room === 'galleria')).toBe(true);
    const hour = hourlyEstimate({ textModel: 'gemini-3.1-flash-lite', maxText: 800, maxForges: 3 } as never);
    const line = hour.righe.find((r) => r.voce === COEFFICIENT_INFO.interiors.nome)!;
    expect(line.chiamate).toBeGreaterThan(0);
    expect(line.dollari).toBeLessThan(0.05);
  });

  it('lo schema elenca gli id del catalogo; i modelli locali rispondono con le regole del banco', async () => {
    const schema = interiorSchema(['banco', 'letto']);
    expect(schema.properties!.rules.items!.properties!.furniture.items!.enum).toEqual(['banco', 'letto']);
    expect(catalogueText([{ id: 'banco', name: 'Banco', size: [0.9, 0.7, 0.6] }])).toContain('- `banco`: Banco, 0.9 × 0.7 tiles, 0.6 tall');
    const mock = new MockAiModels();
    mock.latency = 0;
    const answer = JSON.parse(await mock.text({ agent: 'scenographer', task: INTERIOR_TASK, system: '', prompt: '', data: { catalogue: ['banco', 'barile', 'letto', 'furniture'] } }));
    // And the cellar (T419): the pieces of the cellar the catalogue has, here the barrel.
    expect(answer).toEqual({ rules: [{ storey: 0, room: 'hall', furniture: ['banco', 'barile'], count: 3 }, { room: 'room', furniture: ['letto', 'furniture'], count: 2 }, { furniture: ['barile'], count: 1 }, { room: 'cellar', furniture: ['barile'], count: 4 }] });
  });

  it('offline: il forno del borgo scolpito dallo Scultore, arredato dallo Scenografo, a ogni seme (la verifica nel browser)', async () => {
    const k = await boot();
    const model = 'struttura-il-forno-del-borgo';
    // The local models do not furnish by themselves, as they do not sculpt: the director is called by hand.
    expect(k.furnishing.blocked()).toMatch(/locali/);
    k.furnishing.pump();
    expect(k.repo.head().message).toBe('genesi');
    const req = k.sculpting.missing().find((r) => r.id === model)!;
    expect(await k.sculpting.make(req)).toBe(true);
    run(k, 0.5);
    expect(k.furnishing.missing()).toContain(model);
    // The generic house of the village stands in for what is still to sculpt: never furnished.
    expect(k.furnishing.wants('structure')).toBe(false);
    // What the Scenografo is told: two seeds, the rooms, never the program.
    const bare = (await k.forms.settled(model, 1, undefined, undefined, { bare: true }))!;
    const plan = interiorPlan({ grid: bare.result!.grid, palette: bare.result!.palette, vpt: bare.vpt, base: bare.base, actions: k.forms.compiled(model)!.actions, seed: 1 });
    const text = describeBuilding({ name: 'il forno del borgo', box: [100, 100, 80], vpt: bare.vpt, seeds: [{ seed: 1, plan }] });
    expect(text).toMatch(/hall/);
    expect(text).not.toMatch(/<sequence|<rule/);
    const r = await k.furnishing.make(model);
    expect(r.ok).toBe(true);
    expect(k.repo.head().message).toBe('scenografo: il forno del borgo');
    expect(k.forms.interiorSpec(model)).toMatchObject({ author: 'offline' });
    expect(k.furnishing.wants(model)).toBe(false);
    expect(k.furnishing.missing()).not.toContain(model);
    expect(k.feed().some((e) => e.from === 'scenographer' && e.task === INTERIOR_TASK)).toBe(true);
    for (const seed of [1, 2]) {
      const f = (await k.forms.settled(model, seed))!;
      expect(f.furnished).toBe(true);
      const g0 = k.forms.bare(model, seed)!.result!.grid;
      expect([...f.result!.grid.cells].filter((c, i) => c && !g0.cells[i]).length).toBeGreaterThan(1000);
    }
  }, 300_000);
});
