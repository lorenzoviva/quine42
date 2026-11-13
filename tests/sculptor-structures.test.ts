// The Sculptor of the large structures (T156, ADR-0160; T354, ADR-0183): the prompt without a skeleton (the composition from the
// concept on a coarse plan, the parts of the seed), the requests in blocks with the views in text, no box of their own, more seeds and the
// next size in the checks, the parts listed in the request; one program serves two sizes; offline the local models answer with the
// country house written by hand as the prompt asks.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { MOCK_STRUCTURE_PROGRAM } from '../src/kernel/ai/mockStructure';
import { emptyUsage, type AiModels, type TextCall } from '../src/kernel/ai/models';
import { Council } from '../src/kernel/agents/council';
import { BLOCKS, checkProgram, filesOf, isPlanOnly, partResources, planBlock, procedural, sculpt, sculptorRole, shareableProgram, STRUCTURE_SEEDS, STRUCTURES_MARK, textViews, triedSizes, withMeaning, withoutSize } from '../src/kernel/agents/sculptor';
import { modelSize, structureModel, structureSiblings } from '../src/kernel/modeldirector';
import { entryBox } from '../src/kernel/forms';
import { MODEL_RE } from '../src/kernel/validator';
import { classOf } from '../src/mj/classes';
import { mapsBackToBox } from '../src/mj/model';

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
const house = MOCK_STRUCTURE_PROGRAM;
const seedFiles = (xml: string) => filesOf(xml, bundledFiles);
/** The first block of the house: the program without its second map (the plan on the coarse grid). */
const planOf = (xml: string) => {
  const at = xml.search(/<map scale="\d+ \d+ \d+"/);
  return xml.slice(0, at) + xml.slice(xml.lastIndexOf('</map>'));
};

describe('the prompt of the structures without a skeleton (T354)', () => {
  it('is the part of the prompt after the mark: the method, no stock building; the other classes keep theirs', () => {
    const general = sculptorRole(bundledFiles);
    const structures = sculptorRole(bundledFiles, true);
    expect(bundledFiles['prompts/agents/sculptor.md']).toContain(STRUCTURES_MARK);
    expect(general).toContain('## Traps');
    expect(general).toContain('rock: 20×20×16');
    expect(structures).not.toContain('## Traps');
    expect(structures).not.toContain('@@');
    expect(structures).toContain('## The method: three levels, one program');
    expect(structures).toContain('## How to answer, block by block');
    // No skeleton: no whole program to copy, only pieces of the toolbox (T337: a skeleton in the prompt is copied).
    expect(structures).not.toMatch(/<sequence values="B[^"]*" symmetry="\(xy\)" soil="E" origin="bottom">\s*<union/);
    expect(structures).not.toContain('The skeleton');
    expect(structures).toContain('Never use S nor #90-#97');
  });

  it('holds for the large structures, from Large up', () => {
    expect(procedural(structure)).toBe(true);
    expect(procedural(structure, 'huge')).toBe(true);
    expect(procedural(structure, 'medium')).toBe(false);
    expect(procedural(classOf('building')!)).toBe(false);
    expect(triedSizes(structure)).toEqual(['large', 'huge']);
    expect(triedSizes(structure, 'gargantuan')).toEqual(['gargantuan', 'huge']);
  });

  it('lists the parts of the seed in the request, each with the contract at the top of its file', () => {
    const parts = partResources(bundledFiles);
    expect(parts.map((p) => /file="([^"]+)"/.exec(p)![1])).toEqual(['part-battlements', 'part-door', 'part-slits', 'part-stair']);
    expect(parts.find((p) => p.includes('part-stair'))).toMatch(/union "=" is the letters of your floors and slabs/);
    expect(parts.find((p) => p.includes('part-stair'))).not.toMatch(/Written by|Alone it builds/);
    expect(parts.find((p) => p.includes('part-door'))).toMatch(/at least 11 wide/);
    expect(partResources({ 'models/x.xml': '<sequence values="BW"/>' })).toEqual([]);
  });

  it('the offline answer passes the checks at every seed and at the next size, with the parts of the seed; a program that falls says where', () => {
    const c = checkProgram(house, structure, undefined, seedFiles(house));
    expect(c.error).toBeUndefined();
    expect(c.others).toHaveLength(2);
    expect(checkProgram(house, structure, 'huge', seedFiles(house)).error).toBeUndefined();
    expect(mapsBackToBox(house)).toBe(true);
    expect(shareableProgram(house)).toBe(true);
    const low = checkProgram('<sequence values="BW" origin="True"><one in="W B" out="B W"/><all in="B W" out="W *" steps="4"/></sequence>', structure);
    expect(low.error).toMatch(/^taglia Grande, seme 1: /);
    expect(low.failedAt).toEqual({ taglia: 'large', seed: 1 });
  }, 120_000);

  it('rejects a structure program when the stair does not reach the upper floor (T320), and says what the measure means', () => {
    const broken = house.replace('<import file="part-stair"/>', '');
    const c = checkProgram(broken, structure, undefined, seedFiles(broken));
    expect(c.error).toBe('taglia Grande, seme 1: piani: 1 (serve ≥ 2)');
    expect(c.failedAt).toEqual({ taglia: 'large', seed: 1 });
    expect(withMeaning(c.error!)).toMatch(/^taglia Grande, seme 1: piani: 1 \(serve ≥ 2\) — the covered storeys a body reaches on foot/);
    expect(withMeaning('XML: riga 3')).toBe('XML: riga 3');
    // The views of the seed that fell, with two other seeds beside it.
    const v = textViews(c);
    expect(v).toContain('### Seed 1 at large');
    expect(v).toContain('Cut at z=11');
    expect(v).toContain('### Seed 2: plan and heights');
    expect(v).toContain('### Seed 3: plan and heights');
    expect(v).toMatch(/How much the plans of the seeds differ: 0\.\d\d/);
  }, 60_000);

  it('the first block is a plan: the coarse grid runs at three seeds and at the next size, and comes back as plans', () => {
    const plan = planOf(house);
    expect(isPlanOnly(plan)).toBe(true);
    expect(isPlanOnly(house)).toBe(false);
    const made = planBlock(plan, structure, undefined, seedFiles(plan));
    expect(made.error).toBeUndefined();
    expect(made.text).toContain('### large, seed 1: grid 20×20×80');
    expect(made.text).toContain('### large, seed 3');
    expect(made.text).toContain('### huge, seed 1: grid 30×30×120');
    expect(made.text).toContain('Plan (the letter of every cell)');
    expect(made.text).not.toContain('Heights');
    expect(made.text).toMatch(/w marker|w \w/);
    expect(made.text).toMatch(/How much the plans of the seeds differ: 0\.\d\d/);
    // A plan that does not run says so.
    const bad = planBlock('<sequence values="BHE" soil="E" origin="bottom"><map scale="1/5 1/5 1" values="BHE"><rule in="E" out="E"/><all in="E" out="H"', structure);
    expect(bad.error).toBeDefined();
    expect(bad.text).toMatch(/^It does not run: large, seed 1: /);
  }, 60_000);

  it('asks in blocks: the composition, then the whole program with the plans back; what does not pass comes back with the views and the trace', async () => {
    const m = new Scripted((c, n) => {
      if (c.task === 'model.sculpt') return n === 1 ? planOf(house) : n === 2 ? house.replace('<import file="part-stair"/>', '') : house;
      return JSON.stringify({ voto: 8, riconoscibile: true, problemi: [], consigli: [] });
    });
    const c = new Council(m, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const r = await sculpt(c, { id: structureModel('una villetta', 'huge'), nome: 'una villetta', aspetto: 'una villetta con il giardino', classe: 'structure', taglia: 'huge' });
    expect(r).toBeDefined();
    const calls = m.calls.filter((x) => x.task === 'model.sculpt');
    expect(calls).toHaveLength(3);
    expect(calls[0].system).toContain('## The method: three levels, one program');
    expect(calls[0].system).not.toContain('## Examples');
    expect(calls[0].system).not.toContain('## Traps');
    expect(calls[0].prompt).toContain(`## ${BLOCKS.plan}`);
    expect(calls[0].prompt).toMatch(/Parts of the seed the program includes with <import file="…"\/>/);
    expect(calls[0].prompt).toContain('<import file="part-stair"/>');
    expect(calls[0].prompt).toMatch(/The same program also serves the size gargantuan/);
    expect(calls[0].prompt).toMatch(/a tile is 20 voxels, a step 4/);
    expect(calls[0].prompt).toMatch(/a door at least 11 × 30, a room at least 28 a side/);
    expect(calls[1].prompt).toContain('## Your program so far');
    expect(calls[1].prompt).toContain('## What the game made of it');
    expect(calls[1].prompt).toContain('### huge, seed 1: grid 30×30×120');
    expect(calls[1].prompt).toContain(`## ${BLOCKS.whole}`);
    expect(calls[2].prompt).toMatch(/It does not pass: taglia Enorme, seme 1: piani: 1 \(serve ≥ 2\) — the covered storeys/);
    expect(calls[2].prompt).toContain('What the game made of it, in text:');
    expect(calls[2].prompt).toContain('### Seed 1 at huge');
    expect(calls[2].prompt).toContain('node by node');
    expect(r!.xml).not.toMatch(/<sequence[^>]*\ssize="/);
    expect(shareableProgram(r!.xml)).toBe(true);
  }, 180_000);

  it('an answer to the first block that is already a whole program is checked as such: offline, one call', async () => {
    const m = new MockAiModels();
    const c = new Council(m, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const r = await sculpt(c, { id: structureModel('una casa', 'large'), nome: 'una casa', aspetto: 'una casa', classe: 'structure' }, undefined, { semplici: 1, revisione: false, giudizio: false });
    expect(r).toBeDefined();
    expect(r!.calls).toBe(1);
    expect(r!.xml).toContain('<import file="part-stair"/>');
  }, 120_000);

  it('the bench keeps the fort written as the Sculptor writes it, and the kernel takes it too', () => {
    const fort = fs.readFileSync('lab/banco/taglie/scultore-rocca.xml', 'utf8');
    expect(fort).not.toMatch(/\ssize="/);
    expect(checkProgram(fort, structure, undefined, seedFiles(fort)).error).toBeUndefined();
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
    // The same text, two areas at the same scale (T338, ADR-0179): a tile is 20 voxels at both, the Gargantuan box is larger.
    expect(k.forms.request(gar.id, 1)!.size).toEqual([200, 200, 160]);
    expect(k.forms.request(huge.id, 1)!.size).toEqual([150, 150, 120]);
    expect(k.forms.request(gar.id, 1)!.vpt).toBe(20);
    expect(k.forms.request(huge.id, 1)!.vpt).toBe(20);
    // An entry sculpted before, at 16 voxels a tile, keeps the box it was sculpted in.
    expect(entryBox(structure, { size: 'huge', vpt: 16 })).toEqual([120, 120, 96]);
    expect(entryBox(structure, { size: 'gargantuan', vpt: 12 })).toEqual([120, 120, 96]);
    expect(entryBox(structure, { size: 'huge' })).toEqual([150, 150, 120]);
    // An entry of before (a Huge fort named without its size, its box written in) goes on as it was, under the new name.
    const old = '<sequence values="BW" size="120 120 96"><box at="60 60 0" size="40 40 60" color="W"/></sequence>';
    expect(k.addModel('struttura-un-forte', old, { class: 'structure', ...modelSize({ classe: 'structure', taglia: 'huge' }) }, 'prova')).toBe(true);
    const again = k.sculpting.shared({ ...huge, id: structureModel('un forte', 'huge'), nome: 'un forte', shareWith: ['struttura-un-forte'] })!;
    expect(again).toEqual({ xml: k.files['models/struttura-un-forte.xml'], info: k.forms.info('struttura-un-forte') });
    // At another size a program with its own box is not shared: it is sculpted.
    expect(k.sculpting.shared({ ...gar, nome: 'un forte', shareWith: ['struttura-un-forte'] })).toBeUndefined();
  }, 120_000);
});
