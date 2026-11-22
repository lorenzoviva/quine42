// T495 (ADR-0247): the structures a universe has are worn again with a seed of their own, and the new programs of the structures have a
// ceiling per hour. The Cartographer is offered the structures of the world (concept, sizes, cellar, places that have one) and asks a new
// concept only when none fits; over the ceiling only those (the schema lets nothing else through); the kernel gives the lot of one worn again a
// seed from its place, never from a clock; the Sculptor never hears of it; the `ModelDirector` begins no more new programs of the structures than
// the ceiling of the hour; the knob is the lobby's, fixed on entering.
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { MemoryChunks } from '../src/kernel/chunks';
import type { Schema, TextCall } from '../src/kernel/ai/models';
import { planChunk, readStructure, type PlanContext } from '../src/kernel/agents/cartography';
import { ModelDirector } from '../src/kernel/modeldirector';
import { FRESH_EVERY, NEW_STRUCTURES_PER_HOUR, nearestSize, reusableOf, newSeedFor, REUSE_SEED_FROM, REUSE_SEED_SPAN, reusableStructures, reuseLines, reuseSeed, STRUCTURE_HOUR, StructureHour } from '../src/kernel/reuse';
import { BUDGET_SCALE, repairAiSettings } from '../src/kernel/universe';
import { WORLD_THEMES } from '../src/kernel/themes';
import { CENSUS } from '../src/kernel/coefficients';
import type { Council } from '../src/kernel/agents/council';
import { SEED_FILE, seedHashes } from '../src/kernel/universes';

const SEED_STRUCTURES = Object.entries(JSON.parse(bundledFiles['models/index.json']) as Record<string, { class?: string; name?: string }>)
  .filter(([id, i]) => id.startsWith('struttura-') && (i.class === 'structure' || i.class === 'building') && bundledFiles[`models/${id}.xml`] !== undefined)
  .map(([id]) => id);

/** The local models, writing down every call and the context of every plan. */
class Recording extends MockAiModels {
  calls: string[] = [];
  plans: PlanContext[] = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push(call.task ?? '?');
    if (call.task === 'chunk.plan') this.plans.push(call.data as PlanContext);
    return super.text(call);
  }
}

async function boot(ai: Record<string, unknown> = {}, extra: Record<string, string> = {}) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, ...extra, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, ...ai } }, null, 2) };
  const models = new Recording();
  const chunks = new MemoryChunks();
  const k = await Kernel.boot({ files, store: memoryStore(), ai: models, chunks });
  return { k, models, chunks };
}

/** A council that answers a plan with what is given and keeps the schema it was asked with. */
function council(answer: unknown): { c: Council; schemas: Schema[]; prompts: string[] } {
  const schemas: Schema[] = [];
  const prompts: string[] = [];
  const c = { ask: async (_a: string, _t: string, prompt: string, schema: Schema) => (prompts.push(prompt), schemas.push(schema), answer) } as unknown as Council;
  return { c, schemas, prompts };
}

const CTX: PlanContext = { cx: 3, cy: 1, terrain: 'erba 80%', neighbors: [], layouts: [{ id: 'village', name: 'Borgo', description: 'case', environment: 'borgo' }], catalog: [], fragments: [], wanted: [], start: false, attempt: 0 };
const KNOWN = [
  { concept: 'il mulino sul fiume', sizes: ['large' as const, 'huge' as const], uses: 3, cellar: false },
  { concept: 'la cantina del vino', sizes: ['medium' as const], uses: 0, cellar: true },
];

describe('le strutture del mondo (T495)', () => {
  it('nel mondo del seme sono le strutture del seme, mai le parti, le case comuni né gli edifici della corona; in un mondo di un’altra epoca no', async () => {
    const { k } = await boot();
    const list = reusableStructures(k.files);
    const ids = list.flatMap((s) => s.entries.map((e) => e.id));
    expect(ids.sort()).toEqual([...SEED_STRUCTURES].sort());
    expect(ids.some((id) => /^(part-|corona-|casa-comune-)/.test(id))).toBe(false);
    // One with a cellar says so; a program that grows by rules and has no box of its own serves the larger sizes too.
    const forge = list.find((s) => s.entries.some((e) => e.id === 'struttura-fucina'))!;
    expect(forge.cellar).toBe(true);
    expect(forge.sizes).toContain('large');
    // In a world of another age (its theme is not the seed's), the seed's programs as it took them (`seed.json`) are not its own.
    const steam = WORLD_THEMES.find((t) => t.id !== 'medievale')!;
    const prints = JSON.stringify(seedHashes(bundledFiles));
    expect(reusableStructures({ ...k.files, [SEED_FILE]: prints, 'prompts/theme.md': steam.text })).toEqual([]);
    // But what the Sculptor made for it is.
    const index = JSON.parse(k.files['models/index.json']);
    const own = { ...k.files, [SEED_FILE]: prints, 'prompts/theme.md': steam.text, 'models/index.json': JSON.stringify({ ...index, 'struttura-il-faro-a-gas': { class: 'structure', name: 'il faro a gas', seeds: 4 } }), 'models/struttura-il-faro-a-gas.xml': k.files['models/struttura-fortino.xml'] };
    expect(reusableStructures(own).map((s) => s.concept)).toEqual(['il faro a gas']);
  });

  it('il seme di una struttura riusata viene dal luogo: lo stesso a ogni volta, un altro altrove, oltre i semi che lo Scultore ha provato', () => {
    const a = reuseSeed(1234, 3, -2, 0);
    expect(reuseSeed(1234, 3, -2, 0)).toBe(a);
    expect(a).toBeGreaterThanOrEqual(REUSE_SEED_FROM);
    expect(a).toBeLessThan(REUSE_SEED_FROM + REUSE_SEED_SPAN);
    const many = new Set(Array.from({ length: 40 }, (_, i) => reuseSeed(1234, i, 0, 0)));
    expect(many.size).toBeGreaterThan(35);
    expect(reuseSeed(1234, 3, -2, 1)).not.toBe(a);
    expect(reuseSeed(99, 3, -2, 0)).not.toBe(a);
    // A structure with a cellar and a brought card keep the seeds the Sculptor tried (the cellar falls more often past them).
    expect(newSeedFor({ cellar: false, brought: false })).toBe(true);
    expect(newSeedFor({ cellar: true, brought: false })).toBe(false);
    expect(newSeedFor({ cellar: false, brought: true })).toBe(false);
    expect(nearestSize(['medium', 'huge'], 'large')).toBe('medium');
    // A name cut short (or made longer) in at least four words is the same structure; two words are not.
    const list = [{ concept: "il capanno di collaudo delle chiatte a vapore, su palafitte sopra l'acqua", class: 'structure' as const, entries: [], sizes: [], uses: 0, cellar: false }, { concept: 'Officina meccanica', class: 'structure' as const, entries: [], sizes: [], uses: 0, cellar: false }];
    expect(reusableOf(list, 'Il capanno di collaudo delle chiatte a vapore')).toBe(list[0]);
    expect(reusableOf(list, 'il capanno di collaudo')).toBe(list[0]);
    expect(reusableOf(list, 'il capanno di')).toBeUndefined();
    expect(reusableOf(list, 'Officina meccanica dei palombari')).toBeUndefined();
    expect(reusableOf(list, 'officina  MECCANICA')).toBe(list[1]);
    expect(nearestSize(['huge'], 'small')).toBe('huge');
  });

  it('il Cartografo vede le strutture del mondo; oltre il tetto lo schema lascia passare solo quelle, e il seme non è mai suo', async () => {
    const fresh = council({ place: { name: 'Prato', description: 'un prato' }, environment: 'village', objects: [], runes: [], structures: [{ concept: 'il mulino sul fiume', size: 'large', seed: 77 }] });
    const plan = await planChunk(fresh.c, { ...CTX, known: KNOWN, newStructures: true });
    expect(fresh.prompts[0]).toContain('«il mulino sul fiume» (large, huge; in 3 places)');
    expect(fresh.prompts[0]).toContain('«la cantina del vino» (medium, with a cellar; not used yet)');
    expect(fresh.prompts[0]).toMatch(/a new concept only when none of them suits the place/);
    expect(fresh.schemas[0].properties!.structures.items!.properties!.concept.enum).toBeUndefined();
    // The seed the answer says is dropped: only the kernel writes it.
    expect(plan.structures).toEqual([{ concept: 'il mulino sul fiume', size: 'large' }]);

    const over = council({ place: { name: 'Prato', description: 'un prato' }, environment: 'village', objects: [], runes: [] });
    await planChunk(over.c, { ...CTX, known: KNOWN, newStructures: false });
    expect(over.schemas[0].properties!.structures.items!.properties!.concept.enum).toEqual(['il mulino sul fiume', 'la cantina del vino']);
    expect(over.prompts[0]).toMatch(/only these now/);
    // Over the ceiling and with no structure in the world: none.
    const none = council({ place: { name: 'Prato', description: 'un prato' }, environment: 'village', objects: [], runes: [] });
    await planChunk(none.c, { ...CTX, known: [], newStructures: false });
    expect(none.schemas[0].properties!.structures).toBeUndefined();
    expect(reuseLines([], false)[0]).toMatch(/none this time/);
    expect(reuseLines([], true)).toEqual([]);
    // A saved plan keeps the kernel's seed.
    expect(readStructure({ concept: 'x', seed: 4321 })).toEqual({ concept: 'x', seed: 4321 });
    expect(readStructure({ concept: 'x', seed: -1 })).toEqual({ concept: 'x' });
  });

  it('il Cartografo offline oltre il tetto riusa una struttura del seme: un seme suo dal luogo, niente da scolpire', async () => {
    const { k, models } = await boot({ newStructuresPerHour: 0 });
    expect(k.newStructuresPerHour()).toBe(0);
    expect(k.newStructureAllowed()).toBe(false);
    // The start's plan: the offline Cartographer would ask the bakery of the village, a concept new to the world; now one of the world's.
    for (let i = 0; i < 600 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 0));
    }
    const ch = k.chunks.get('0,0')!;
    expect(ch.stage).toBe('planned');
    const ctx = models.plans.find((p) => p.cx === 0 && p.cy === 0)!;
    expect(ctx.newStructures).toBe(false);
    expect(ctx.known!.length).toBe(reusableStructures(k.files).length);
    const s = ch.plan!.structures![0];
    const known = reusableStructures(k.files).find((x) => x.concept === s.concept)!;
    expect(known).toBeDefined();
    expect(known.sizes).toContain(s.size);
    const lot = ch.lots.findIndex(() => true);
    expect(lot).toBeGreaterThanOrEqual(0);
    const id = k.ecs.query('structure').find((e) => (k.ecs.get(e, 'structure') as { concept: string }).concept === s.concept)!;
    const comp = k.ecs.get(id, 'structure') as { model: string; seed?: number };
    // The seed's entry at its size, or the same program under the id of another size (a program that scales: no call, ADR-0160).
    const req = k.sculpting.missing(true).find((r) => r.id === comp.model);
    if (req) expect(k.files[`models/${known.entries.find((e) => e.scales)!.id}.xml`]).toBe(k.sculpting.shared(req)?.xml);
    else expect(known.entries.map((e) => e.id)).toContain(comp.model);
    // Asked without a cellar, one without: a seed of its own, from the place.
    expect(known.cellar).toBe(false);
    expect(s.seed).toBe(reuseSeed(k.config.seed, 0, 0, 0));
    expect(comp.seed).toBe(s.seed);
    // Once the lot wears its model (the copy of another size costs no call), it wears it at that seed.
    if (req) expect(k.sculpting.free(req)).toBe(true);
    expect(k.ecs.get(id, 'form')).toMatchObject({ model: comp.model, seed: s.seed });
    expect(s.seed).toBeGreaterThanOrEqual(REUSE_SEED_FROM);
    // Nothing for the Sculptor nor for the Artist.
    expect(models.calls).not.toContain('model.sculpt');
    expect(models.calls).not.toContain('model.judge');
    // Worn again, nothing new counted in the hour.
    expect(k.structureHour.count(k.time)).toBe(0);
  });

  it('un concetto nuovo conta nell’ora; al tetto il Cartografo deve riusare, un’ora dopo può di nuovo', async () => {
    const { k } = await boot({ newStructuresPerHour: 2 });
    const wear = (k as unknown as { wearAgain(ch: { cx: number; cy: number }, plan: { structures?: unknown[] }): void }).wearAgain.bind(k);
    const known = reusableStructures(k.files)[0];
    const before = k.structureHour.count(k.time);
    const plan = { structures: [{ concept: 'la torre dell’orologio' }, { concept: known.concept.toUpperCase() }] };
    wear({ cx: 7, cy: -3 }, plan);
    expect(k.structureHour.count(k.time)).toBe(before + 1);
    // The concept of the world is written as the library names it, at a size it has, with the seed of the place if it has no cellar.
    expect(plan.structures[1]).toMatchObject({ concept: known.concept, size: expect.any(String) });
    if (!known.cellar) expect(plan.structures[1]).toMatchObject({ seed: reuseSeed(k.config.seed, 7, -3, 1) });
    expect(plan.structures[0]).toEqual({ concept: 'la torre dell’orologio' });
    // A new concept starts the count of the plans again; one worn again does not.
    expect(k.plansSinceFresh).toBe(0);
    wear({ cx: 8, cy: -3 }, { structures: [{ concept: known.concept }] });
    expect(k.plansSinceFresh).toBe(1);
    while (k.structureHour.count(k.time) < 2) k.structureHour.note(k.time);
    expect(k.newStructureAllowed()).toBe(false);
    const hour = new StructureHour();
    hour.note(10);
    hour.note(20);
    expect(hour.allows(30, 2)).toBe(false);
    expect(hour.allows(10 + STRUCTURE_HOUR, 2)).toBe(true);
    expect(hour.count(20 + STRUCTURE_HOUR)).toBe(0);
  });

  it('dopo FRESH_EVERY piani senza un concetto nuovo, sotto il tetto, il Cartografo è invitato a darne uno', async () => {
    const { k, models } = await boot();
    expect(reuseLines(KNOWN, true, true)[1]).toMatch(/no new kind of building has come for a while/);
    expect(reuseLines(KNOWN, false, true)[1]).toMatch(/only these now/);
    k.plansSinceFresh = FRESH_EVERY - 1;
    await k.planAhead(6, 2);
    const ctx = models.plans.find((p) => p.cx === 6 && p.cy === 2)!;
    expect(ctx).toBeDefined();
    expect(ctx.freshWanted).toBe(true);
    // Over the ceiling, no invitation.
    for (let i = 0; i < 3; i++) k.structureHour.note(k.time);
    k.plansSinceFresh = FRESH_EVERY;
    await k.planAhead(6, 3);
    expect(models.plans.find((p) => p.cx === 6 && p.cy === 3)?.freshWanted).toBe(false);
  });

  it('il direttore dei modelli non comincia più programmi nuovi di strutture di quanti ne dice l’ora; le case comuni e le cose sì', async () => {
    const { k } = await boot({ newStructuresPerHour: 1 });
    const d = k.sculpting;
    const structure = { id: 'struttura-la-torre', nome: 'la torre', aspetto: 'una torre', classe: 'structure', shareWith: [] };
    const house = { id: 'casa-comune-structure-abc', nome: 'una casa', aspetto: 'una casa', classe: 'structure', shareWith: [] };
    const thing = { id: 'obj-botte', nome: 'botte', aspetto: 'una botte', classe: 'furniture' };
    expect(ModelDirector.planStructure(structure)).toBe(true);
    expect(ModelDirector.planStructure(house)).toBe(false);
    expect(ModelDirector.planStructure(thing)).toBe(false);
    expect(d.overHour(structure)).toBe(false);
    d.noteProgram(structure);
    d.noteProgram(thing);
    expect(d.programs.count(k.time)).toBe(1);
    expect(d.overHour(structure)).toBe(true);
    expect(d.overHour(house)).toBe(false);
    expect(d.overHour(thing)).toBe(false);
  });

  it('la manopola è della lobby: fra 0 e 60, 2 se non detta, ferma a partita in corso', async () => {
    expect(NEW_STRUCTURES_PER_HOUR).toBe(2);
    expect(BUDGET_SCALE.newStructuresPerHour).toEqual([0, 60]);
    expect(repairAiSettings({ newStructuresPerHour: 500 }).settings.newStructuresPerHour).toBe(60);
    expect(repairAiSettings({ newStructuresPerHour: -3 }).settings.newStructuresPerHour).toBe(0);
    const { k } = await boot();
    expect(k.newStructuresPerHour()).toBe(NEW_STRUCTURES_PER_HOUR);
    expect(k.applySettings({ newStructuresPerHour: 6 }).ok).toBe(true);
    expect(k.newStructuresPerHour()).toBe(6);
    k.lockSettings();
    expect(k.applySettings({ newStructuresPerHour: 30 })).toMatchObject({ ok: false });
    expect(k.newStructuresPerHour()).toBe(6);
    // The census says which knob holds the new programs of the structures.
    expect(CENSUS.find((c) => c.compito === 'model.sculpt')?.tetto).toBe('newStructuresPerHour');
  });
});
