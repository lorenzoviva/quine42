// Actions as rules (ADR-0044): what the wanderer does to a thing that changes its shape becomes an
// `<action>` of its model, tried by the kernel and learned by the whole kind; effects stay for the rest.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { checkAction } from '../src/kernel/agents/sculptor';
import { classOf } from '../src/mj/classes';
import type { FormComp } from '../src/kernel/forms';

const BARREL = bundledFiles['models/barile.xml'];
const mobile = classOf('mobile')!;

async function boot() {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
  k.tick(1 / 60);
  return k;
}

/** A thing of a module next to the wanderer, with its form ready. */
async function spawn(k: Kernel, mod: string, who: string) {
  const pc = k.playerCarpet();
  const id = k.spawnModuleEntity(k.modules.get(mod)!, pc.x + 2, pc.y, undefined, who);
  const fc = k.ecs.get(id, 'form') as FormComp;
  await k.forms.wait(fc.model, fc.seed, fc.tint);
  return id;
}

describe('actions as rules on the model', () => {
  it('the kernel tries a new action on the finished model: it must finish, change something, not empty it', () => {
    const ok = checkAction(BARREL, '<action name="annerisci" label="Annerisci"><prl in="W" out="D" p="0.3" steps="1"/></action>', 'annerisci', mobile);
    expect(ok.error).toBeUndefined();
    expect(ok.xml).toMatch(/<action name="annerisci"/);
    expect(checkAction(BARREL, '<action name="svuota" label="Svuota"><all><rule in="W" out="B"/><rule in="L" out="B"/><rule in="I" out="B"/><rule in="S" out="B"/></all></action>', 'svuota', mobile).error).toMatch(/svuota il modello/);
    expect(checkAction(BARREL, '<action name="niente" label="Niente"><prl in="T" out="T" steps="1"/></action>', 'niente', mobile).error).toMatch(/non cambia niente/);
    expect(checkAction(BARREL, '<action name="gira" label="Gira"><markov><one in="W" out="L"/><one in="L" out="W"/></markov></action>', 'gira', mobile).error).toMatch(/non finisce/);
    // A letter the model does not use takes its colour from MarkovJunior's palette (the front-end mends it).
    expect(checkAction(BARREL, '<action name="x" label="X"><prl in="W" out="Q" p="0.2" steps="1"/></action>', 'x', mobile).error).toBeUndefined();
    expect(checkAction(ok.xml!, '<action name="annerisci" label="Annerisci"><prl in="W" out="D" steps="1"/></action>', 'annerisci', mobile).error).toMatch(/già/);
  });

  it('"Altro…" that changes a thing\'s look writes an action into its program: the thing stays, changed, and its kind learns it', async () => {
    const k = await boot();
    const a = await spawn(k, 'obj.credenza', 'test#credenza-a');
    let said = '';
    k.bus.on('ui:dialog', ({ text }: { text: string }) => (said = text));
    await k.freeAction(a, 'scheggio la credenza');
    expect(k.ecs.alive.has(a)).toBe(true);
    expect(said).toMatch(/cambia/);
    const xml = k.files['models/credenza.xml'];
    expect(xml).toMatch(/<action name="scheggio-la-credenza" label="Scheggio la credenza">/);
    expect(k.repo.head().message).toMatch(/regola|azione imparata/);
    expect(k.repo.log().some((c) => /azione imparata: Scheggio la credenza \(credenza\)/.test(c.message))).toBe(true);
    expect((k.ecs.get(a, 'form') as FormComp).done).toEqual(['scheggio-la-credenza']);
    expect(k.rules().find((r) => /scheggio la credenza/.test(r.testo))?.effetti).toContain('forma');
    // No action with effects is learned besides: the rule of the model is the menu entry.
    expect(k.modules.get('obj.credenza')!.manifest.actions?.some((x) => x.effects?.length) ?? false).toBe(false);

    // Every sideboard has it in its menu, and it runs without asking anyone.
    const b = await spawn(k, 'obj.credenza', 'test#credenza-b');
    expect(k.actionsFor(b).some((o) => o.id === 'modello:scheggio-la-credenza')).toBe(true);
    const calls = k.models.usage.text;
    await k.freeAction(b, 'Scheggio la credenza');
    expect((k.ecs.get(b, 'form') as FormComp).done).toEqual(['scheggio-la-credenza']);
    expect(k.models.usage.text).toBe(calls);
  });

  it('a thing wearing the generic model of its class is not reshaped: many kinds share that program', async () => {
    const k = await boot();
    const crate = await spawn(k, 'object.crate', 'test#cassa');
    expect(k.shapeModel(crate)).toBeUndefined();
    const before = k.files['models/mobile.xml'];
    await k.freeAction(crate, 'scheggio la cassa');
    expect(k.files['models/mobile.xml']).toBe(before);
    expect(k.ecs.alive.has(crate)).toBe(true);
  });
});
