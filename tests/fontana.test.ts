// A fountain asked of the Council (T515): in the run of 26/11 the Referente took «a fountain in the map» for a tool, the Narrator gave it the
// class of a structure one enters, and the Sculptor refused its model («piani: 1 (serve ≥ 2)»). The built landscape is a thing of the world.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { classOf, guessClass, isDwelling, landmarkClassOf, thingClass } from '../src/mj/classes';
import { assembleManifest, standsInPlace, type Concept } from '../src/kernel/agents/forge';

const DT = 1 / 60;
const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The offline models, but some tasks answer as Gemini did in the run (or as the test says). */
class Scripted extends MockAiModels {
  constructor(private script: Record<string, (call: TextCall, mock: string) => unknown>) {
    super();
    this.latency = 0;
  }

  override async text(call: TextCall): Promise<string> {
    const answer = this.script[call.task];
    if (!answer) return super.text(call);
    const a = answer(call, await super.text(call));
    return typeof a === 'string' ? a : JSON.stringify(a);
  }
}

/** A kernel whose place under the wanderer is planned. */
async function planned(ai = new MockAiModels()): Promise<Kernel> {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
  for (let i = 0; i < 400; i++) {
    const ch = k.chunkAt(k.wandererCarpet().x, k.wandererCarpet().y);
    if (ch?.stage === 'planned') break;
    k.tick(DT);
    await settle(1);
  }
  expect(k.chunkAt(k.wandererCarpet().x, k.wandererCarpet().y)?.stage).toBe('planned');
  return k;
}

/** The module's model sculpted now, as the director does: no shortfall of the Sculptor. */
async function sculpted(k: Kernel, id: string): Promise<string> {
  const model = k.modules.get(id)!.manifest.appearance!.model!;
  const req = k.sculpting.missing(true).find((r) => r.id === model);
  expect(req, `il modello di ${id} è chiesto`).toBeDefined();
  expect(req!.classe).not.toBe('structure');
  expect(await k.sculpting.make(req!)).toBe(true);
  expect(k.forms.info(model)).toBeDefined();
  return req!.classe;
}

const thingsOf = (k: Kernel, id: string) => k.ecs.query('module').filter((e) => k.ecs.get(e, 'module').id === id);

describe('il paesaggio costruito (T515)', () => {
  it('fontane, pozzi, statue e monumenti hanno la loro classe; una struttura di una cosa del mondo no', () => {
    expect(landmarkClassOf('Fontana di Piazza della Pesa')).toBe('building');
    expect(landmarkClassOf("l'abbeveratoio di pietra")).toBe('building');
    expect(landmarkClassOf('Vecchio pozzo')).toBe('building');
    expect(landmarkClassOf('The old well')).toBe('building');
    expect(landmarkClassOf('Statua del Fondatore')).toBe('monument');
    expect(landmarkClassOf('Monumento ai Fonditori')).toBe('monument');
    // The head of the name decides: a tower with a fountain, a bottle of the fountain's water are not.
    expect(landmarkClassOf('Torre della fontana')).toBeUndefined();
    expect(landmarkClassOf('Borraccia di acqua della fontana')).toBeUndefined();
    const guess = () => classOf('furniture')!;
    expect(thingClass('structure', 'Fontana di Piazza della Pesa', guess).id).toBe('building');
    expect(thingClass('structure', 'Argano a vapore', guess).id).toBe('building');
    expect(thingClass(undefined, 'Statua del Fondatore', guess).id).toBe('monument');
    expect(thingClass('furniture', 'Fontanella', guess).id).toBe('furniture');
    expect(thingClass(undefined, 'Capanno', () => classOf('structure')!).id).toBe('building');
    expect(thingClass(undefined, 'Madia', () => guessClass('madia')).id).toBe('furniture');
    // A fountain is no dwelling: no rooms nor storeys are asked of it.
    expect(isDwelling('Fontana di Piazza della Pesa')).toBe(false);
  });

  it('la Fucina non fa di una fontana uno strumento né una struttura', () => {
    const concept: Concept = {
      name: 'Fontana di Piazza della Pesa', type: 'object', description: 'una fontana in ghisa', lore: '', look: 'tre vasche in ghisa', class: 'structure',
      context: { terrains: ['p'], places: 'piazza', rarity: 0.05 }, interaction: 'none', controls: [], tags: ['fontana'],
    };
    expect(standsInPlace(concept)).toBe(true);
    expect(standsInPlace({ name: 'Spada', class: 'object' })).toBe(false);
    const m = assembleManifest('obj.fontana', concept, { solid: true, pushable: false, mass: 100, friction: 1, radius: 0.5, speed: 0, weight: 50, stackable: false, max_stack: 1, equippable: false }, { logic: 'local M = {} return M' }, ['g', 'p'], 'agente');
    expect(m.appearance!.class).toBe('building');
    expect(m.kind).toBe('entity');
  });

  it('offline, «metti una fontana in piazza» dà una cosa del luogo con un modello, senza fallire', async () => {
    const k = await planned();
    const here = k.chunkAt(k.wandererCarpet().x, k.wandererCarpet().y)!;
    const r = await k.talkToAgent('liaison', 'metti una fontana in piazza');
    expect(r.forged).toMatch(/Nuovo oggetto «Fontana»/);
    const id = [...k.modules.keys()].find((m) => k.modules.get(m)!.manifest.name === 'Fontana')!;
    const man = k.modules.get(id)!.manifest;
    expect(man.kind).toBe('entity');
    expect(man.appearance!.class).toBe('building');
    // In the place where the wanderer is: in its plan, and in the world now.
    expect(r.forged).toContain(`a «${here.plan!.place.name}»`);
    expect(here.plan!.objects.some((o) => o.module === id)).toBe(true);
    expect(thingsOf(k, id)).toHaveLength(1);
    expect(await sculpted(k, id)).toBe('building');
    expect(k.shortfalls.list()).toEqual([]);
  });

  it('come nella run: il Referente dice strumento e il Narratore struttura, e la fontana nasce lo stesso', async () => {
    const k = await planned(
      new Scripted({
        // The Referente of the run: a tool for the Forge.
        'referente.coordinate': () => ({ reply: 'La Fucina la forgerà.', task: 'item', request: 'Una fontana in ghisa al centro della Piazza della Pesa' }),
        // The Narrator of the run: a structure, a tool with a use.
        'forge.concept': (_c, mock) => ({
          ...JSON.parse(mock),
          name: 'Fontana di Piazza della Pesa', type: 'item', class: 'structure', look: 'tre vasche sovrapposte in ghisa', unique: true,
          controls: [{ action: 'use', description: 'Osservi il gorgoglio del fluido rosso nella vasca' }],
        }),
      }),
    );
    const r = await k.talkToAgent('liaison', 'introduci una fontana nella mappa');
    expect(r.forged).toMatch(/Nuovo oggetto «Fontana di Piazza della Pesa»/);
    const id = [...k.modules.keys()].find((m) => k.modules.get(m)!.manifest.name === 'Fontana di Piazza della Pesa')!;
    expect(id).toMatch(/^obj\./);
    const man = k.modules.get(id)!.manifest;
    expect(man.kind).toBe('entity');
    expect(man.item).toBeUndefined();
    expect(man.appearance!.class).toBe('building');
    expect(thingsOf(k, id)).toHaveLength(1);
    expect(await sculpted(k, id)).toBe('building');
    expect(k.shortfalls.list()).toEqual([]);
  });

  it('una fontana di prima, con la classe di una struttura, chiede il modello di un edificio piccolo', async () => {
    const k = await planned();
    const manifest = {
      id: 'item.fontana-di-piazza-della-', name: 'Fontana di Piazza della Pesa', kind: 'item', version: '0.1.0', origin: 'agente', description: 'una fontana in ghisa',
      appearance: { glyph: 'F', color: 'hsl(271 65% 68%)', look: 'tre vasche in ghisa', model: 'item-fontana-di-piazza-della', class: 'structure' },
      item: { stackable: false, maxStack: 1, weight: 50, equippable: false, controls: {} },
    };
    k.saveFile('modules/item.fontana-di-piazza-della-/manifest.json', JSON.stringify(manifest, null, 2) + '\n', true);
    expect(await sculpted(k, 'item.fontana-di-piazza-della-')).toBe('building');
    expect(k.shortfalls.list().filter((s) => s.agent === 'sculptor')).toEqual([]);
  });
});
