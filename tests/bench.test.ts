// T27: the bench of the Sala sistemi. A case of a system runs with the real code in a kernel in miniature
// (only core.*, the content and that system, on a scene of 5 × 5 tiles); the Engineer writes the cases of the
// mechanics he forges and the kernel keeps only those that show the mechanic working.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { BENCH, benchFiles, cleanCases, trialId } from '../src/kernel/bench';
import type { BenchCase, Manifest } from '../src/kernel/types';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
const seed = (k: Kernel, id: string) => ({ manifest: JSON.parse(k.files[`modules/${id}/manifest.json`]) as Manifest, logic: k.files[`modules/${id}/logic.lua`] });

describe('the bench of the Sala sistemi', () => {
  it('runs a case of a seed system with its real code, on its scene, without touching the universe', async () => {
    const k = await boot();
    const before = JSON.stringify(k.files);
    const { manifest, logic } = seed(k, 'sys.needs');
    const c: BenchCase = { titolo: 'La fame', racconto: 'Senza mangiare la salute cala.', viandante: { componenti: { needs: { hunger: 0, health: 50 } } }, durata: 5, guarda: ['needs.health', 'needs.thirst'] };
    const run = await k.runBenchCase(manifest, logic, c);
    expect(run.errori).toEqual([]);
    expect(run.prima['needs.health']).toBe(50);
    expect(run.dopo['needs.health'] as number).toBeCloseTo(47, 0);
    expect(run.cambiati).toEqual(['needs.health', 'needs.thirst']);
    // Frames every half second, the wanderer in the middle of the scene.
    expect(run.frames.length).toBe(11);
    expect(run.frames[0].pos[0]).toEqual([0.5, 0.5]);
    expect(JSON.stringify(k.files)).toBe(before);
    expect(k.needs()!.health).toBe(100);
  });

  it('puts the things of the case on its terrain: the fire burns the bramble and scorches the wanderer', async () => {
    const k = await boot();
    const { manifest, logic } = seed(k, 'sys.fire');
    const c: BenchCase = {
      titolo: 'Il fuoco',
      racconto: 'Una fiamma accanto al rovo e al viandante.',
      terreno: ['ggggg', 'ggggg', 'ggggg', 'ggggg', 'ggggg'],
      cose: [
        { modulo: 'object.bush', x: 1, y: 1 },
        { modulo: 'object.sign', x: 1, y: 0, componenti: { effimero: { fino: 99 }, fuoco: { raggio: 1 } } },
      ],
      durata: 2,
      guarda: ['0:body.solid', 'needs.health'],
    };
    const run = await k.runBenchCase(manifest, logic, c);
    expect(run.errori).toEqual([]);
    expect(run.prima['0:body.solid']).toBe(true);
    expect(run.dopo['0:body.solid']).toBe('assente');
    expect(run.dopo['needs.health'] as number).toBeLessThan(100);
    expect(run.frames.at(-1)!.pos[1]).toBeNull();
  });

  it('says why a case shows nothing: no change, a fault, a step that fails', async () => {
    const k = await boot();
    const { manifest } = seed(k, 'sys.needs');
    const idle = await k.runBenchCase(manifest, 'local M = {}\nfunction M.update(dt) end\nreturn M\n', { titolo: 'Niente', racconto: '', durata: 1, guarda: ['needs.health'] });
    expect(idle.errori.join()).toMatch(/non cambia nulla/);
    const broken = await k.runBenchCase(manifest, 'local M = {}\nfunction M.update(dt) error("rotto") end\nreturn M\n', { titolo: 'Rotto', racconto: '', durata: 1, guarda: ['needs.health'] });
    expect(broken.errori.join()).toMatch(/update: .*rotto/);
  });

  it('keeps only what the scene needs: core, content, the system; objects the universe lacks are trial objects', async () => {
    const k = await boot();
    const { manifest, logic } = seed(k, 'sys.fire');
    const c: BenchCase = { titolo: 'x', racconto: '', viandante: { oggetti: [{ nome: 'Elmo di prova', posto: 'testa', bonus: { difesa: 2 } }, { nome: 'Ciocco di legna' }] }, durata: 1, guarda: ['needs.health'] };
    const known = (n: string) => k.content.byName(n)?.id;
    const files = benchFiles(k.files, manifest, logic, c, known);
    const modules = [...new Set(Object.keys(files).filter((p) => p.startsWith('modules/')).map((p) => p.split('/')[1]))];
    expect(modules).toContain('sys.fire');
    expect(modules).toContain('core.carpet');
    expect(modules).toContain('items.base');
    expect(modules.filter((m) => m.startsWith('sys.'))).toEqual(['sys.fire']);
    expect(Object.keys(files).some((p) => p.startsWith('models/') || p.startsWith('world/'))).toBe(false);
    const trial = JSON.parse(files['modules/bench.prova/manifest.json']).items;
    expect(trial.map((i: { id: string }) => i.id)).toEqual([trialId('Elmo di prova')]);
    expect(trial[0]).toMatchObject({ slot: 'testa', bonus: { difesa: 2 }, category: 'vestiario' });
    expect(BENCH).toBe(5);
  });

  it('cleans the cases the Engineer writes: slots and buttons of the panel, paths to watch, at most 30 seconds', () => {
    const panel = { id: 'equip', titolo: 'Equip', elementi: [{ tipo: 'slot' as const, id: 'testa', etichetta: 'Testa' }, { tipo: 'pulsante' as const, id: 'riposa', etichetta: 'Riposa' }] };
    const { cases, errors } = cleanCases(
      [
        { titolo: 'A', racconto: 'a', viandante_json: '{"needs":{"health":10}}', oggetti: [{ nome: 'Elmo', posto: 'Testa', bonus_json: '{"difesa":1}' }], passi: [{ tipo: 'slot', slot: 'Testa', oggetto: 'Elmo' }, { tipo: 'slot', slot: 'piedi', oggetto: 'Elmo' }, { tipo: 'pulsante', azione: 'riposa' }, { tipo: 'vola' }], durata: 99, guarda: ['difesa.valore', 'non un campo'], righe: [2, 400] },
        { titolo: 'B', racconto: 'b', durata: 1, guarda: [] },
      ],
      panel,
      10,
    );
    expect(cases.length).toBe(1);
    expect(cases[0]).toMatchObject({ durata: 30, guarda: ['difesa.valore'], righe: [2], viandante: { componenti: { needs: { health: 10 } }, oggetti: [{ nome: 'Elmo', posto: 'testa', bonus: { difesa: 1 } }] } });
    expect(cases[0].passi).toEqual([{ tipo: 'slot', slot: 'testa', oggetto: 'Elmo' }, { tipo: 'pulsante', azione: 'riposa' }]);
    expect(errors.join()).toMatch(/piedi/);
    expect(errors.join()).toMatch(/«B»/);
  });

  it('a forged mechanic comes with its cases, run with its code; rewriting the code changes the case', async () => {
    const k = await boot();
    const r = await k.forgeMechanic('equipaggiamento: slot per indossare e impugnare');
    expect(r.ok).toBe(true);
    const { manifest, logic } = seed(k, r.id!);
    expect(manifest.casi?.map((c) => c.titolo)).toEqual(["Si indossa l'elmo"]);
    expect(manifest.casi![0].righe).toEqual([4, 9, 14, 17]);
    expect(logic.split('\n')[13]).toMatch(/ecs\.set\(user, "difesa"/);
    // The trial helmet stays on the bench.
    expect(k.content.get(trialId('Elmo di prova'))).toBeUndefined();
    const run = await k.runBenchCase(manifest, logic, manifest.casi![0]);
    expect(run.errori).toEqual([]);
    expect(run.prima['difesa.valore']).toBeNull();
    expect(run.dopo['difesa.valore']).toBe(3);
    expect(run.cambiati).toEqual(['difesa.valore', 'stati.equipaggiamento']);
    expect(run.messaggi).toContain('Ti senti più protetto.');
    // The player rewrites the mechanic: the case shows what the new code does.
    const doubled = logic.replace('difesa = difesa + items.bonus(it, "difesa")', 'difesa = difesa + 2 * items.bonus(it, "difesa")');
    expect((await k.runBenchCase(manifest, doubled, manifest.casi![0])).dopo['difesa.valore']).toBe(6);
    // T27d: the mechanic lives in the Sala sistemi, with the systems; the studio has no Archive for it.
    const ids = k.corona.buildings.map((b) => b.id);
    expect(ids).not.toContain('altro');
    expect(k.corona.folders.find((f) => f.id === 'sistemi')!.files).toContain(`modules/${r.id}/manifest.json`);
  });

  it('a mechanic whose cases show nothing goes back to the Engineer once', async () => {
    const models = new MockModels();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models });
    const asked: string[] = [];
    const real = models.text.bind(models);
    models.text = async (call) => {
      const text = await real(call);
      if (call.task !== 'mechanic.design') return text;
      asked.push(call.prompt);
      const out = JSON.parse(text);
      if (asked.length === 1) out.casi = [{ ...out.casi[0], passi: [], guarda: ['difesa.valore'] }];
      return JSON.stringify(out);
    };
    const r = await k.forgeMechanic('equipaggiamento');
    expect(r.ok).toBe(true);
    expect(asked.length).toBe(2);
    expect(asked[1]).toMatch(/non mostrano la meccanica: .*non cambia nulla/);
    expect(seed(k, r.id!).manifest.casi?.length).toBe(1);
  });
});
