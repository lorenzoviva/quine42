// The strata as rules (T478, ADR-0249, the row 5 of T459): an environment's program of the strata, a MarkovJunior program in 3D on the
// place's box under the surface of the draft, tried by the validator on the drafts of trial; a new plan has six rows by it and says so
// (`strataDepth`), a plan of before keeps the draft's four; the Cartographer writes the strata of the world and the programs at the Genesis.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { MemoryChunks, type ChunkRecord } from '../src/kernel/chunks';
import { CENSUS } from '../src/kernel/coefficients';
import { CARD_MAKERS } from '../src/kernel/cards';
import { ownStrata } from '../src/kernel/agents/genesis';
import {
  draftStrata,
  programStrata,
  runStrata,
  SEED_STRATA,
  STRATA_DEPTH,
  STRATA_EXAMPLE,
  STRATA_LIMITS,
  strataPalette,
  strataProgramErrors,
} from '../src/kernel/strata';
import type { TerrainDef } from '../src/kernel/types';

const seedTerrain = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']!);
const palette = seedTerrain.tiles as Record<string, TerrainDef>;
const strata = strataPalette(seedTerrain.strata);
const seedLayouts = JSON.parse(bundledFiles['modules/world.layouts/manifest.json']!).layouts as Record<string, { strata?: string }>;

const S = 18;
/** A draft of every biome: meadow, sand, mountain, sea, water, wood, snow, rows of 18. */
const DRAFT = Array.from({ length: S * S }, (_, i) => 'ggggggssskkkoowwtn'[i % 18]).join('');
const rows = (d: string) => Array.from({ length: S }, (_, y) => d.slice(y * S, y * S + S));

/** A program of the strata of the seed's earth: under the land the earth, under the sea the mud, the bedrock under all. */
const SIMPLE = `<sequence values="Egswok#1#4#5" symmetry="(xy)">
  <union symbol="?" values="g"/>
  <all in="? E" out="* #1"/>
  <all in="w E" out="w #4"/>
  <all in="o E" out="o #4"/>
  <all in="#1 E" out="#1 #5"/>
  <all in="#4 E" out="#4 #5"/>
  <all in="#5 E" out="#5 #5"/>
</sequence>`;

describe('the program of the strata (T478)', () => {
  it('says what lies under what, a layer at a time; where it decides nothing the draft does', () => {
    const r = runStrata(SIMPLE, DRAFT, S, 1, palette, strata);
    if ('error' in r) throw new Error(r.error);
    expect(r.finished).toBe(true);
    expect(r.foreign).toEqual([]);
    // Column 0 is a meadow: the earth, then the bedrock to the bottom; column 12 the sea: the mud; column 6 the sand: nothing it reads.
    expect(r.rows.map((row) => row[0])).toEqual(['1', '5', '5', '5', '5', '5']);
    expect(r.rows.map((row) => row[12])).toEqual(['4', '5', '5', '5', '5', '5']);
    expect(r.rows.map((row) => row[6])).toEqual(['', '', '', '', '', '']);
    // The mountain is rock to a program that reads no `k` but `r`… this one reads neither: the draft says it.
    const made = programStrata(SIMPLE, DRAFT, 2, -3, S, 7, palette, strata);
    expect(made.error).toBeUndefined();
    expect(made.rows).toHaveLength(STRATA_DEPTH);
    const draft = draftStrata(DRAFT, 2, -3, S, 7, palette, strata);
    for (let d = 0; d < STRATA_DEPTH; d++) {
      expect(made.rows[d]![0]).toBe(r.rows[d]![0]);
      expect(made.rows[d]![6]).toBe(draft[d]![6]);
      expect(made.rows[d]![9]).toBe(draft[d]![9]);
    }
    // The same place, the same strata; the sea under a program that knows only the water is water to it.
    expect(programStrata(SIMPLE, DRAFT, 2, -3, S, 7, palette, strata)).toEqual(made);
    const onlyWater = SIMPLE.replace('<all in="o E" out="o #4"/>', '').replace('Egswok', 'Egswk');
    const w = runStrata(onlyWater, DRAFT, S, 1, palette, strata);
    if ('error' in w) throw new Error(w.error);
    expect(w.rows[0]![12]).toBe('4');
  });

  it('the dice of a program are the place\'s: another place, other strata; the same, the same', () => {
    const veins = SIMPLE.replace('</sequence>', '  <one in="#5" out="#7" steps="6"/>\n</sequence>').replace('#5"', '#5#7"');
    const a = programStrata(veins, DRAFT, 2, -3, S, 7, palette, strata).rows;
    expect(programStrata(veins, DRAFT, 2, -3, S, 7, palette, strata).rows).toEqual(a);
    expect(programStrata(veins, DRAFT, 3, -3, S, 7, palette, strata).rows).not.toEqual(a);
    expect(programStrata(veins, DRAFT, 2, -3, S, 8, palette, strata).rows).not.toEqual(a);
    expect(a.join('').split('7').length - 1).toBe(6);
  });

  it('the validator wants rules and their order, the up and the down kept, only strata under the ground, an end', () => {
    const drafts = [rows(DRAFT)];
    expect(strataProgramErrors(SIMPLE, drafts, palette, strata)).toEqual([]);
    expect(strataProgramErrors(STRATA_EXAMPLE, drafts, palette, { ...strata, ...Object.fromEntries([...'TCAMBV'].map((c) => [c, { name: c, color: '#123456', solid: true, layer: 'stratum' as const }])) })).toEqual([]);
    // MarkovJunior's default in 3D turns a rule every way of the cube: «under the grass» becomes «beside the grass».
    expect(strataProgramErrors(SIMPLE.replace(' symmetry="(xy)"', ''), drafts, palette, strata)[0]).toMatch(/symmetry="\(xy\)"/);
    expect(strataProgramErrors(SIMPLE.replace('<all in="#5 E"', '<all symmetry="(xyz)" in="#5 E"'), drafts, palette, strata)[0]).toMatch(/alto e il basso/);
    expect(strataProgramErrors(SIMPLE.replace(' symmetry="(xy)"', ' symmetry="()"'), drafts, palette, strata)).toEqual([]);
    // Nothing but rules: a path, a convolution, a wfc are not strata.
    expect(strataProgramErrors(SIMPLE.replace('</sequence>', '<path from="#1" to="#5" on="E" color="#4"/></sequence>'), drafts, palette, strata).join(' ')).toMatch(/<path> non serve/);
    // Under the ground only strata: the grass is not one.
    expect(strataProgramErrors(SIMPLE.replace('out="* #1"', 'out="* g"'), drafts, palette, strata).join(' ')).toMatch(/scrive sotto il suolo g, che non sono strati \(gli strati: #1 terra/);
    // The first value is the earth not yet decided: neither a stratum nor a code of the surface.
    expect(strataProgramErrors('<sequence values="#2g#1" symmetry="(xy)"><all in="g #2" out="g #1"/></sequence>', drafts, palette, strata).join(' ')).toMatch(/«#2».*non uno strato/);
    expect(strataProgramErrors('<sequence values="g#1" symmetry="(xy)"><all in="#1 g" out="#1 #1"/></sequence>', drafts, palette, strata).join(' ')).toMatch(/non un codice della superficie/);
    // A program that never ends, one that decides nothing, one that is not XML, one too long.
    const flip = '<markov values="Eg#1#2" symmetry="(xy)"><all in="g E" out="g #1"/><prl in="#1" out="#2"/><prl in="#2" out="#1"/></markov>';
    expect(strataProgramErrors(flip, drafts, palette, strata).join(' ')).toMatch(new RegExp(`non finisce in (${STRATA_LIMITS.steps} passi|${STRATA_LIMITS.ms} ms)`));
    expect(strataProgramErrors('<sequence values="Ez#1" symmetry="(xy)"><all in="z E" out="z #1"/></sequence>', drafts, palette, strata)[0]).toMatch(/non decide nessuno strato/);
    expect(strataProgramErrors('<sequence', drafts, palette, strata)[0]).toMatch(/XML/);
    expect(strataProgramErrors(42, drafts, palette, strata)[0]).toMatch(/testo XML/);
    expect(strataProgramErrors(SIMPLE + ' '.repeat(STRATA_LIMITS.chars), drafts, palette, strata)[0]).toMatch(/al più/);
  });

  it('every environment of the seed has one, and each is good on the drafts of trial of the kernel', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(Object.keys(k.content.layouts).length).toBeGreaterThan(10);
    for (const [id, def] of Object.entries(k.content.layouts)) {
      expect(typeof def.strata, id).toBe('string');
      expect(seedLayouts[id]?.strata, id).toBe(def.strata);
      expect(k.validator.validateLayout(id, def, k.palette, k.sampleDrafts(), k.strata), id).toEqual([]);
    }
    // The seed's strata, with the three its programs write besides the draft.
    expect(Object.keys(SEED_STRATA)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    expect(seedTerrain.strata).toEqual(JSON.parse(JSON.stringify(SEED_STRATA)));
    // The validator of the layouts sends a bad one back, by its id.
    const lake = k.content.layouts.lake!;
    expect(k.validator.validateLayout('lake', { ...lake, strata: lake.strata!.replace(' symmetry="(xy)"', '') }, k.palette, k.sampleDrafts(), k.strata)[0]).toMatch(/^lake: strati: la simmetria/);
  }, 60_000);
});

/** A kernel whose loaded places have all been planned by the Cartographer (offline). */
async function boot(files = bundledFiles, chunks = new MemoryChunks()) {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), chunks });
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
  return { k, chunks };
}

const saved = (chunks: MemoryChunks) => (chunks as unknown as { m: Map<string, ChunkRecord> }).m;

describe('the strata of a new plan (T478)', () => {
  it('six rows by its environment\'s program; a program that does not run gives the draft\'s, and the kernel says it once', async () => {
    const { k, chunks } = await boot();
    const plans = [...saved(chunks).values()].map((r) => r.plan);
    expect(plans.length).toBeGreaterThan(3);
    for (const p of plans) {
      expect(p.strataDepth).toBe(STRATA_DEPTH);
      expect(p.strata).toHaveLength(STRATA_DEPTH);
    }
    // Somewhere the programs wrote what the draft never does: the water under the ground, a vein, the roots.
    const written = new Set(plans.flatMap((p) => p.strata!.join('').split('')));
    expect([...written].some((c) => '678'.includes(c))).toBe(true);

    // The same world with its environments' programs broken by hand: its places have the draft's strata, and nothing else changes.
    const lm = JSON.parse(bundledFiles['modules/world.layouts/manifest.json']!);
    for (const def of Object.values<{ strata?: string }>(lm.layouts)) def.strata = '<sequence values="E"><teleport/></sequence>';
    const broken = await boot({ ...bundledFiles, 'modules/world.layouts/manifest.json': JSON.stringify(lm, null, 2) });
    const ch = broken.k.chunks.get('0,0')!;
    expect(ch.stage).toBe('planned');
    expect(broken.k.strataOf(ch)).toEqual(draftStrata(ch.draft, 0, 0, broken.k.config.chunkSize, broken.k.config.seed, broken.k.palette, broken.k.strata, STRATA_DEPTH));
    expect(ch.tiles).toBe(k.chunks.get('0,0')!.tiles);
    const said = broken.k.feed().filter((e) => /gli strati di «/.test(e.text));
    expect(said.length).toBeGreaterThan(0);
    expect(new Set(said.map((e) => e.text)).size).toBe(said.length);
  }, 120_000);
});

describe('the strata at the Genesis (T478)', () => {
  it('the Cartographer writes the strata of the world, one letter each but E, never a terrain\'s code, a role once', () => {
    const read = ownStrata(
      [
        { code: 'L', name: 'loess', description: 'polvere gialla compatta', color: '#c8b070', role: 'topsoil' },
        { code: 'K', name: 'basalto', description: 'roccia nera', color: '#333333', role: 'bedrock' },
        { code: 'Q', name: 'altro loess', description: 'ancora', color: '#c8b071', role: 'topsoil' },
        { code: 'E', name: 'terra', description: 'la terra', color: '#6b4a30', role: 'other' },
        { code: 'g', name: 'erba', description: 'minuscola', color: '#6b4a30', role: 'other' },
        { code: 'L', name: 'doppio', description: 'doppio', color: '#6b4a31', role: 'other' },
        { code: 'Z', name: 'cenere', description: 'cenere grigia', color: 'grigio', role: 'other' },
        'niente',
      ],
      { ...palette, K: { name: 'un terreno K', color: '#000000', layer: 'ground' } as TerrainDef },
    );
    expect(Object.keys(read.strata)).toEqual(['L', 'Q']);
    expect(read.strata.L).toEqual({ id: 'topsoil', name: 'loess', description: 'polvere gialla compatta', color: '#c8b070', solid: true, layer: 'stratum' });
    // The role once: the second topsoil is a stratum without one.
    expect(read.strata.Q!.id).toBeUndefined();
    expect(read.problems.join(' ')).toMatch(/strato K: il codice è già un terreno/);
    expect(read.problems.join(' ')).toMatch(/non E/);
    expect(read.problems.join(' ')).toMatch(/strato L: il codice è già un altro strato/);
    expect(read.problems.length).toBe(6);
  });

  it('a Genesis offline: the strata of the world in its terrains, a program for each environment, the one sent back asked again', async () => {
    const asked: Array<{ task?: string; prompt: string }> = [];
    class Listening extends MockAiModels {
      async text(call: Parameters<MockAiModels['text']>[0]) {
        asked.push({ task: call.task, prompt: String(call.prompt) });
        return super.text(call);
      }
    }
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Listening() });
    expect(await k.runGenesis('un regno di pastori sulle colline')).toBe(true);
    const tm = JSON.parse(k.repo.working['modules/world.terrain/manifest.json']!);
    expect(Object.keys(tm.strata)).toEqual(['T', 'C', 'A', 'M', 'B', 'V']);
    expect(tm.strata.T).toMatchObject({ id: 'topsoil', name: 'terra rossa', layer: 'stratum', solid: true });
    // The draft takes the world's own for its roles; the seed's stay under them.
    expect(k.strata.T!.name).toBe('terra rossa');
    expect(k.strata['1']).toEqual(SEED_STRATA['1']);
    const lm = JSON.parse(k.repo.working['modules/world.layouts/manifest.json']!);
    expect(lm.layouts.stazzo.strata).toBe(STRATA_EXAMPLE);
    expect(lm.layouts.macchia.strata).toBe(STRATA_EXAMPLE);
    // The first answer for «stazzo» had no symmetry: asked once more, with the reason, for it alone.
    const strataAsks = asked.filter((a) => a.task === 'genesis.strata');
    expect(strataAsks).toHaveLength(2);
    expect(strataAsks[0]!.prompt).toMatch(/symmetry="\(xy\)"/);
    expect(strataAsks[1]!.prompt).toMatch(/SOME PROGRAMS WERE INVALID, fix them: stazzo: strati: la simmetria/);
    expect(strataAsks[1]!.prompt).toMatch(/- stazzo: Stazzo/);
    expect(strataAsks[1]!.prompt).not.toMatch(/- macchia:/);
    expect(strataAsks[1]!.prompt).toMatch(/The strata are these; keep them as they are: T terra rossa \(topsoil\)/);
    // A task of the Genesis, in the census and in the card of the environments.
    expect(CENSUS.find((c) => c.compito === 'genesis.strata')).toMatchObject({ agente: 'cartographer', modo: 'non regolabile' });
    expect(CARD_MAKERS['genesis.layouts']).toContain('genesis.strata');
    // The world's places have the world's strata, by the programs.
    for (let i = 0; i < 80; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 25));
      if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
    }
    const planned = [...k.chunks.values()].filter((c) => c.stage === 'planned' && (c.plan?.layout === 'stazzo' || c.plan?.layout === 'macchia'));
    expect(planned.length).toBeGreaterThan(0);
    const codes = new Set(planned.flatMap((c) => k.strataOf(c).join('').split('')));
    expect(codes.has('T') || codes.has('B')).toBe(true);
  }, 120_000);
});
