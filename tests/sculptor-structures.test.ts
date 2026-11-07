// The procedural prompt in the game's Sculptor (T156, ADR-0160): the large structures get the bench's prompt with its skeleton,
// no box of their own, more seeds and the next size in the checks, the trace in the second request; one program serves two sizes.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { emptyUsage, type AiModels, type TextCall } from '../src/kernel/ai/models';
import { Council } from '../src/kernel/agents/council';
import { checkProgram, procedural, sculpt, sculptorRole, shareableProgram, skeletonOf, STRUCTURE_SEEDS, STRUCTURES_MARK, triedSizes, withoutSize } from '../src/kernel/agents/sculptor';
import { modelSize, structureModel, structureSiblings } from '../src/kernel/modeldirector';
import { MODEL_RE } from '../src/kernel/validator';
import { classOf } from '../src/mj/classes';

class Scripted implements AiModels {
  readonly name = 'scripted';
  readonly usage = emptyUsage();
  limits = { text: 100 };
  calls: TextCall[] = [];
  constructor(private answer: (c: TextCall, n: number) => string) {}
  async text(c: TextCall): Promise<string> {
    this.calls.push(c);
    return this.answer(c, this.calls.length);
  }
}

const structure = classOf('structure')!;
const skeleton = skeletonOf(sculptorRole(bundledFiles, true))!;

describe('the procedural prompt of the structures (T156)', () => {
  it('is the part of the prompt after the mark, with its skeleton; the other classes keep theirs', () => {
    const general = sculptorRole(bundledFiles);
    const structures = sculptorRole(bundledFiles, true);
    expect(bundledFiles['prompts/agents/sculptor.md']).toContain(STRUCTURES_MARK);
    expect(general).not.toContain('The skeleton');
    expect(general).toContain('## Traps');
    expect(general).toContain('rock: 20×20×16');
    expect(structures).not.toContain('## Traps');
    expect(structures).not.toContain('@@');
    // The game asks no cellar: its recipe stays on the bench.
    expect(structures).not.toMatch(/cellar is a \*\*well/);
    expect(skeleton).toMatch(/^<sequence values="B[^"]*" symmetry="\(xy\)" soil="E" origin="bottom">/);
    expect(skeleton).not.toMatch(/\ssize="/);
  });

  it('holds for the large structures, from Large up', () => {
    expect(procedural(structure)).toBe(true);
    expect(procedural(structure, 'huge')).toBe(true);
    expect(procedural(structure, 'medium')).toBe(false);
    expect(procedural(classOf('building')!)).toBe(false);
    expect(triedSizes(structure)).toEqual(['large', 'huge']);
    expect(triedSizes(structure, 'gargantuan')).toEqual(['gargantuan', 'huge']);
  });

  it('checks the skeleton at every seed and at the next size, and says where a program falls', () => {
    expect(checkProgram(skeleton, structure).error).toBeUndefined();
    expect(checkProgram(skeleton, structure, 'huge').error).toBeUndefined();
    const low = checkProgram('<sequence values="BW" origin="True"><one in="W B" out="B W"/><all in="B W" out="W *" steps="4"/></sequence>', structure);
    expect(low.error).toMatch(/^taglia Grande, seme 1: /);
    expect(low.failedAt).toEqual({ taglia: 'large', seed: 1 });
  });

  it('rejects a structure program when the stair does not reach the upper floor (T320)', () => {
    // The skeleton without the stair rules: ground floor holds, second floor cannot be reached
    const broken = skeleton
      .replace('<all in="*BB *B* TY*" out="*TY *K* KK*" steps="16"/>', '')
      .replace('<all in="K B" out="* K" symmetry="()"/>', '');
    const c = checkProgram(broken, structure);
    expect(c.error).toBe('taglia Grande, seme 1: piani: 1 (serve ≥ 2)');
    expect(c.failedAt).toEqual({ taglia: 'large', seed: 1 });
  });

  it('writes no box into the program, sends no box programs as examples, and puts the trace in the second request', async () => {
    const m = new Scripted((c, n) => {
      if (c.task === 'model.sculpt') return n === 1 ? '<sequence values="BW" size="100 100 80" origin="True"><one in="W B" out="B W"/><all in="B W" out="W *" steps="4"/></sequence>' : skeleton;
      return JSON.stringify({ voto: 8, riconoscibile: true, problemi: [], consigli: [] });
    });
    const c = new Council(m, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const r = await sculpt(c, { id: structureModel('una rocca', 'huge'), nome: 'una rocca', aspetto: 'una rocca di frontiera', classe: 'structure', taglia: 'huge' });
    expect(r).toBeDefined();
    const calls = m.calls.filter((x) => x.task === 'model.sculpt');
    expect(calls).toHaveLength(2);
    expect(calls[0].system).toContain('The skeleton');
    expect(calls[0].system).not.toContain('## Examples');
    expect(calls[0].system).not.toContain('## Traps');
    expect(calls[0].prompt).toMatch(/The same program also serves the size gargantuan/);
    expect(calls[0].prompt).toMatch(/a tile is 16 voxels, a step 3/);
    expect(calls[1].prompt).toMatch(/It does not pass: taglia Enorme, seme 1: /);
    expect(calls[1].prompt).toContain('node by node');
    expect(r!.xml).not.toMatch(/<sequence[^>]*\ssize="/);
    expect(shareableProgram(r!.xml)).toBe(true);
  }, 120_000);
});

describe('one program for two sizes (ADR-0160)', () => {
  it('names a structure by its concept and its size; the class size keeps the name it had', () => {
    expect(structureModel('una rocca')).toBe('struttura-una-rocca');
    expect(structureModel('una rocca', 'large')).toBe('struttura-una-rocca');
    expect(structureModel('una rocca', 'huge')).toBe('struttura-una-rocca-huge');
    const long = structureModel('una fortezza di frontiera con le mura e il mastio', 'gargantuan');
    expect(long.endsWith('-gargantuan')).toBe(true);
    expect(MODEL_RE.test(long)).toBe(true);
    expect(structureSiblings('una rocca')).toContain('struttura-una-rocca-gargantuan');
    expect(withoutSize('<sequence values="BW" size="1 2 3" origin="True"/>')).toBe('<sequence values="BW" origin="True"/>');
  });

  it('a Gargantuan fort wears the program of the Huge one at its own size, with no call; an old entry of the same size is kept as it is', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const huge = { id: structureModel('una rocca', 'huge'), nome: 'una rocca', aspetto: 'una rocca', classe: 'structure', taglia: 'huge' as const };
    expect(await k.sculpting.make(huge)).toBe(true);
    const index = JSON.parse(k.repo.head().files['models/index.json']!);
    expect(index[huge.id]).toMatchObject({ class: 'structure', size: 'huge', seeds: STRUCTURE_SEEDS });
    expect(k.forms.seedsOf(huge.id)).toBe(STRUCTURE_SEEDS);
    const gar = { ...huge, id: structureModel('una rocca', 'gargantuan'), taglia: 'gargantuan' as const, shareWith: structureSiblings('una rocca').filter((x) => x !== structureModel('una rocca', 'gargantuan')) };
    const s = k.sculpting.shared(gar)!;
    expect(s.xml).toBe(k.files[`models/${huge.id}.xml`]);
    expect(s.info).toMatchObject({ class: 'structure', ...modelSize(gar), seeds: STRUCTURE_SEEDS });
    expect(k.addModel(gar.id, s.xml, s.info, 'prova')).toBe(true);
    // The same text, two boxes of the same voxels: a Gargantuan tile is 12 voxels, a Huge one 16.
    expect(k.forms.request(gar.id, 1)!.size).toEqual(k.forms.request(huge.id, 1)!.size);
    expect(k.forms.request(gar.id, 1)!.vpt).toBe(12);
    expect(k.forms.request(huge.id, 1)!.vpt).toBe(16);
    // An entry of before (a Huge fort named without its size, its box written in) goes on as it was, under the new name.
    const old = '<sequence values="BW" size="120 120 96"><box at="60 60 0" size="40 40 60" color="W"/></sequence>';
    expect(k.addModel('struttura-un-forte', old, { class: 'structure', ...modelSize({ classe: 'structure', taglia: 'huge' }) }, 'prova')).toBe(true);
    const again = k.sculpting.shared({ ...huge, id: structureModel('un forte', 'huge'), nome: 'un forte', shareWith: ['struttura-un-forte'] })!;
    expect(again).toEqual({ xml: k.files['models/struttura-un-forte.xml'], info: k.forms.info('struttura-un-forte') });
    // At another size a program with its own box is not shared: it is sculpted.
    expect(k.sculpting.shared({ ...gar, nome: 'un forte', shareWith: ['struttura-un-forte'] })).toBeUndefined();
  }, 120_000);
});
