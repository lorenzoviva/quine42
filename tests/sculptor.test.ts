// The Sculptor and the Artist (ADR-0042): programs written per class, checked by the kernel, judged on
// photographs; the models the world lacks are sculpted and enter the library.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { emptyUsage, type Models, type TextCall } from '../src/kernel/ai/models';
import { Council } from '../src/kernel/agents/council';
import { checkProgram, DEFAULT_SCULPTORS, modelFor, sculpt, withSize } from '../src/kernel/agents/sculptor';
import { classOf } from '../src/mj/classes';
import { encodePng } from '../src/mj/png';
import type { FormComp } from '../src/kernel/forms';

const FLOATING = '<sequence values="BW" size="20 20 16"><box at="10 10 8" size="8 8 4" color="W"/></sequence>';
const ROCK = (h: number) => `<sequence values="BRD" size="20 20 16"><ellipsoid at="10 10 0" size="16 16 ${h}" color="R"/><prl in="B R" out="* D" p="0.3" steps="1"/></sequence>`;

/** A model layer that answers from a script and records what it was asked. */
class Scripted implements Models {
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

describe('the Sculptor', () => {
  it('sends a program back with the reason, writes two for simple things, the Artist keeps the better', async () => {
    let sculpts = 0;
    const m = new Scripted((c) => {
      if (c.task === 'model.sculpt') return ++sculpts === 1 ? FLOATING : `Ecco:\n\`\`\`xml\n${ROCK(sculpts === 2 ? 10 : 14)}\n\`\`\``;
      // The Artist prefers the taller rock (it sees it in the photographs).
      return JSON.stringify({ voto: /scatola/.test(c.prompt) && c.images?.length === 1 ? (sculpts === 2 ? 5 : 8) : 0, riconoscibile: true, problemi: [], consigli: [] });
    });
    const c = new Council(m, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const r = await sculpt(c, { id: 'masso-rosso', nome: 'Masso rosso', aspetto: 'un masso rossiccio', classe: 'roccia' });
    expect(r).toBeDefined();
    const sculptCalls = m.calls.filter((x) => x.task === 'model.sculpt');
    // The first program floats: it goes back with the reason; then two valid programs.
    expect(sculptCalls[1].prompt).toMatch(/Non va: .*galleggia|tocca terra/);
    expect(sculptCalls).toHaveLength(3);
    expect(sculptCalls.every((x) => x.model === 'gemini-3.1-flash-lite')).toBe(true);
    // The instructions are the universe's, with the classes and the palette; the examples of the class follow.
    expect(sculptCalls[0].system).toContain('roccia (roccia o masso): 20×20×16');
    expect(sculptCalls[0].system).not.toContain('@@');
    expect(sculptCalls[0].system).toContain('## Esempi');
    // The Artist sees one image (four views) per program; its model is its own.
    const judges = m.calls.filter((x) => x.task === 'model.judge');
    expect(judges).toHaveLength(2);
    expect(judges.every((x) => x.model === DEFAULT_SCULPTORS.artista && x.images?.[0].startsWith('data:image/png;base64,'))).toBe(true);
    expect(r!.voto).toBe(8);
    expect(r!.xml).toContain('size="16 16 14"');
    expect(r!.xml).toMatch(/^<!-- Masso rosso: scolpito da gemini-3\.1-flash-lite .* 8\/10 -->/);
    expect(r!.xml).toContain('size="20 20 16"');
  });

  it('sends figures and structures to the better model, and the structures that matter to the best one while its price lasts', () => {
    const req = { id: 'x', nome: 'x', aspetto: 'x', classe: 'grande', importante: true };
    expect(modelFor({ ...req, classe: 'persona' }, classOf('persona')!, DEFAULT_SCULPTORS)).toBe('gemini-3.8-flash');
    expect(modelFor(req, classOf('grande')!, DEFAULT_SCULPTORS, '2026-11-01')).toBe('gemini-4-argon');
    expect(modelFor(req, classOf('grande')!, DEFAULT_SCULPTORS, '2026-12-02')).toBe('gemini-3.8-flash');
    expect(modelFor({ ...req, importante: false }, classOf('grande')!, DEFAULT_SCULPTORS, '2026-11-01')).toBe('gemini-3.8-flash');
    expect(modelFor({ ...req, classe: 'albero' }, classOf('albero')!, DEFAULT_SCULPTORS)).toBe('gemini-3.1-flash-lite');
  });

  it('checks programs as the kernel will run them, in the class box', () => {
    expect(checkProgram(ROCK(14), classOf('roccia')!).error).toBeUndefined();
    expect(checkProgram('<sequence values="BW" size="4 4 4"><all in="B" out="W"/></sequence>', classOf('roccia')!).error).toMatch(/riempie/);
    expect(checkProgram('<sequence values="BW"><one in="BW" out="WW"/>', classOf('roccia')!).error).toMatch(/riga/);
    expect(withSize('<sequence values="BW" size="4 4 4"><x/></sequence>', [20, 20, 16])).toContain('size="20 20 16"');
    expect(withSize('<sequence values="BW"><x/></sequence>', [20, 20, 16])).toContain('values="BW" size="20 20 16"');
    // A program that maps up keeps its own coarse size.
    expect(withSize('<sequence values="BW" size="8 8 8"><map scale="3 3 3"/></sequence>', [20, 20, 16])).toContain('size="8 8 8"');
  });

  it('writes PNG files the image models read', () => {
    const png = encodePng({ w: 2, h: 1, data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 128]) });
    expect([...png.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(String.fromCharCode(...png.slice(12, 16))).toBe('IHDR');
  });
});

describe('the models the world lacks', () => {
  it('a forged thing names a model of its own; the Sculptor writes it and the thing wears it', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    const r = await k.forgeModule('un mugnaio che macina il grano', 'agente', 'npc');
    expect(r.ok).toBe(true);
    const man = k.modules.get(r.id!)!.manifest;
    expect(man.appearance!.model).toBe(r.id!.replace(/\./g, '-'));
    expect(man.appearance!.classe).toBe('persona');
    const missing = k.sculpting.missing();
    const req = missing.find((m) => m.id === man.appearance!.model)!;
    expect(req.classe).toBe('persona');
    // Until it is sculpted the thing shows the generic model of its class.
    const id = k.spawnModuleEntity(k.modules.get(r.id!)!, 2.5, 2.5, undefined, 'test#mugnaio');
    expect((k.ecs.get(id, 'form') as FormComp).model).toBe('persona');
    expect(await k.sculpting.make(req)).toBe(true);
    expect(k.repo.head().files[`models/${req.id}.xml`]).toContain('scolpito da');
    expect(JSON.parse(k.repo.head().files['models/index.json']!)[req.id]).toMatchObject({ classe: 'persona' });
    expect(k.sculpting.missing().some((m) => m.id === req.id)).toBe(false);
    const again = k.spawnModuleEntity(k.modules.get(r.id!)!, 4.5, 2.5, undefined, 'test#mugnaio2');
    expect((k.ecs.get(again, 'form') as FormComp).model).toBe(req.id);
  }, 30_000);

  it('items get a common shape: one program per shape, tinted for each item', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    expect(await k.growContent('prova', 8, true)).toBe(true);
    const shaped = [...k.content.items.values()].filter((d) => d.model?.startsWith('forma-'));
    expect(shaped.length).toBeGreaterThan(0);
    const req = k.sculpting.missing().find((m) => m.id === shaped[0].model)!;
    expect(req).toMatchObject({ classe: 'oggetto', tinta: true });
    expect(await k.sculpting.make(req)).toBe(true);
    expect(JSON.parse(k.repo.head().files['models/index.json']!)[req.id].tinta).toBe('C');
  }, 30_000);
});
