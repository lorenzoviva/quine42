import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { MOCK_STRUCTURE_PROGRAM } from '../src/kernel/ai/mockStructure';
import type { AiModels, TextCall } from '../src/kernel/ai/models';
import { memoryStore } from '../src/kernel/repo';
import { bundledFiles } from '../src/kernel/bundle';
const loadBundledUniverse = (): FileMap => ({ ...bundledFiles });
import { Council } from '../src/kernel/agents/council';
import { designInterior, describeBuilding, interiorSchema } from '../src/kernel/agents/scenographer';
import { sculpt, type SculptRequest } from '../src/kernel/agents/sculptor';
import { buildGraph, chunksOf, GRAPH_FILE, readGraph } from '../src/kernel/graph';
import { Forms, InlineRunner } from '../src/kernel/forms';
import { furnishWithRules, hasStratumRules, interiorRooms, interiorText, pieceOf, readRules, ruleFor, type InteriorRule } from '../src/kernel/furnish';
import { interiorPlan } from '../src/kernel/interior';
import { requestOf, wearersOf } from '../src/kernel/regenerate';
import { dominantCellarStratum, sampleLotStrata, SEED_STRATA, STRATA_DEPTH, stratumKey, summarizePlaceStrata } from '../src/kernel/strata';
import { apiErrors, LUA_API } from '../src/kernel/validator';
import { compileMjx } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { ThinClient } from '../src/session/thin';
import { SessionClient } from '../src/session/client';
import type { FileMap, TerrainDef } from '../src/kernel/types';

function uniformStrata(S: number, rows: string[]): string[] {
  return rows.map((c) => c.repeat(S * S));
}

function makeCellarBuilding(files: FileMap, modelId: string, rules?: InteriorRule[]): FileMap {
  const index = JSON.parse(files['models/index.json']);
  index[modelId] = {
    class: 'structure',
    size: 'large',
    name: 'La casa con cantina',
    cellar: 1,
    ...(rules ? { interior: { rules, author: 'test' } } : {}),
  };
  return {
    ...files,
    [`models/${modelId}.xml`]: MOCK_STRUCTURE_PROGRAM,
    'models/index.json': JSON.stringify(index, null, 2),
  };
}

describe('T479 · Gli strati nel Concilio (ADR-0253)', () => {
  // --- 1. Lua API: world.stratum_at(x, y, depth) ---------------------------------------------------------

  describe('1 · API Lua world.stratum_at(x, y, depth)', () => {
    it('è nell’elenco del validatore e nel prompt dell’Ingegnere', () => {
      const files = loadBundledUniverse();
      expect(LUA_API.world).toContain('stratum_at');
      expect(apiErrors('local s = world.stratum_at(1, 2, 1)')).toEqual([]);
      expect(apiErrors('local s = world.stratum(1, 2)')).toHaveLength(1);
      expect(files['prompts/agents/engineer.md']).toMatch(/world\.stratum_at\(x, y, depth\)/);
    });

    it('legge lo strato per profondità, gestisce bordi/input invalidi, non genera luoghi ed è una copia in sola lettura', async () => {
      const files = loadBundledUniverse();
      const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
      k.tick(1 / 60);
      const S = k.config.chunkSize;
      const ch = k.chunks.get('0,0')!;
      ch.strata = uniformStrata(S, ['1', '2', '6', '7', '5', '5']);

      expect(
        k.sandbox.loadModule(
          'probe.stratum',
          `local M = {}
function M.go()
  local s0 = world.stratum_at(2.8, 3.1)
  local s1 = world.stratum_at(2, 3, 1)
  local s2 = world.stratum_at(2, 3, 2)
  local s3 = world.stratum_at(2, 3, 3)
  local sDeep = world.stratum_at(2, 3, 99)
  local sNeg = world.stratum_at(2, 3, -5)
  local sFar = world.stratum_at(9999, 9999, 0)
  local sBad1 = world.stratum_at(0/0, 1, 0)
  local sBad2 = world.stratum_at(1, 1, "uno")
  local sBad3 = world.stratum_at("x", 1)
  -- Mutazione della copia: non tocca il kernel (regole 1 e 7).
  s2.name = "manomesso"
  s2.color = "#000000"
  local s2Again = world.stratum_at(2, 3, 2)
  return {
    c0 = s0 and s0.code, id0 = s0 and s0.id, n0 = s0 and s0.name, col0 = s0 and s0.color,
    c1 = s1 and s1.code, id1 = s1 and s1.id, n1 = s1 and s1.name,
    c2 = s2Again and s2Again.code, id2 = s2Again and s2Again.id, n2 = s2Again and s2Again.name, col2 = s2Again and s2Again.color,
    c3 = s3 and s3.code, id3 = s3 and s3.id,
    cDeep = sDeep and sDeep.code,
    cNeg = sNeg and sNeg.code,
    farNil = sFar == nil,
    badNil = sBad1 == nil and sBad2 == nil and sBad3 == nil,
  }
end
return M`,
        ),
      ).toBeNull();
      const seen = k.sandbox.run('probe.stratum', 'go') as Record<string, unknown>;

      expect(seen.c0).toBe('1');
      expect(seen.id0).toBe('topsoil');
      expect(seen.n0).toBe(SEED_STRATA['1']!.name);
      expect(seen.col0).toBe(SEED_STRATA['1']!.color);
      expect(seen.c1).toBe('2');
      expect(seen.id1).toBe('clay');
      expect(seen.n1).toBe('argilla');
      expect(seen.c2).toBe('6');
      expect(seen.id2).toBe('aquifer');
      expect(seen.n2).toBe('falda');
      expect(seen.col2).toBe(SEED_STRATA['6']!.color);
      expect(seen.c3).toBe('7');
      expect(seen.id3).toBe('ore');
      expect(seen.cDeep).toBe('5');
      expect(seen.cNeg).toBe('1');
      expect(seen.farNil).toBe(true);
      expect(seen.badNil).toBe(true);
      // Unloaded coordinate never generates a chunk.
      expect(k.chunks.has(`${Math.floor(9999 / S)},${Math.floor(9999 / S)}`)).toBe(false);
      // Kernel's own palette definition stayed intact.
      expect(k.strata['6']!.name).toBe('falda');
    });

    it('un modulo Lua (un pozzo / un minatore) legge la falda e la vena di minerale, e anche uno strato senza id della Genesi', async () => {
      const base = loadBundledUniverse();
      const terrain = JSON.parse(base['modules/world.terrain/manifest.json']);
      terrain.strata = {
        ...(terrain.strata ?? {}),
        B: { name: 'basalto', description: 'pietra nera vulcanica', color: '#2b2d30', solid: true, layer: 'stratum' },
      };
      const files: FileMap = {
        ...base,
        'modules/world.terrain/manifest.json': JSON.stringify(terrain, null, 2),
        'modules/object.pozzoprova/manifest.json': JSON.stringify({
          id: 'object.pozzoprova',
          name: 'Pozzo di prova',
          kind: 'entity',
          logic: 'logic.lua',
          interaction: { type: 'lua' },
          appearance: { glyph: 'O', color: '#4488cc', class: 'building' },
          physics: { solid: true, radius: 0.4 },
        }),
        'modules/object.pozzoprova/logic.lua': `local M = {}
function M.on_interact(id)
  local p = ecs.get(id, "pos")
  for d = 0, 5 do
    local s = world.stratum_at(p.x, p.y, d)
    if s and s.id == "aquifer" then return "Acqua dalla " .. s.name .. " a profondità " .. d end
    if s and s.id == "ore" then return "Trovata " .. s.name end
    if s and s.code == "B" then return "Solo " .. s.name .. (s.id == nil and " (senza id)" or "") end
  end
  return "Asciutto."
end
return M
`,
      };
      const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
      k.tick(1 / 60);
      expect(k.faults.list().filter((f) => f.key.includes('pozzoprova'))).toEqual([]);
      const S = k.config.chunkSize;
      const ch = k.chunks.get('0,0')!;
      const wellId = k.ecs.spawn({ pos: { x: 4.5, y: 4.5 }, module: { id: 'object.pozzoprova' }, interact: { type: 'lua' } });

      ch.strata = uniformStrata(S, ['1', '2', '6', '5', '5', '5']);
      expect(k.sandbox.run('object.pozzoprova', 'on_interact', wellId)).toBe('Acqua dalla falda a profondità 2');

      ch.strata = uniformStrata(S, ['1', '5', '7', '5', '5', '5']);
      expect(k.sandbox.run('object.pozzoprova', 'on_interact', wellId)).toBe('Trovata vena');

      ch.strata = uniformStrata(S, ['1', 'B', '5', '5', '5', '5']);
      expect(k.sandbox.run('object.pozzoprova', 'on_interact', wellId)).toBe('Solo basalto (senza id)');

      ch.strata = uniformStrata(S, ['1', '2', '5', '5', '5', '5']);
      expect(k.sandbox.run('object.pozzoprova', 'on_interact', wellId)).toBe('Asciutto.');
    });
  });

  // --- 2. Narrator context (graph / focus + worldFacts) --------------------------------------------------

  describe('2 · Contesto del Narratore (grafo / focus e worldFacts)', () => {
    it('summarizePlaceStrata privilegia gli strati speciali (falda, vena, radici, Genesi) e li ordina dall’alto al basso', () => {
      const strata: Record<string, TerrainDef> = {
        ...SEED_STRATA,
        B: { name: 'basalto', color: '#2a2a2e', solid: true, layer: 'stratum' },
      };
      // 4x4 chunk: row 0 topsoil, row 1 clay + 2 aquifer cells, row 2..5 bedrock + 1 ore cell in row 4.
      const rows = [
        '1'.repeat(16),
        '2'.repeat(14) + '66',
        '5'.repeat(16),
        '5'.repeat(16),
        '5'.repeat(15) + '7',
        '5'.repeat(16),
      ];
      const names = summarizePlaceStrata(rows, strata, 4);
      // Must include both special strata (falda, vena) plus the two main non-topsoil strata (argilla, roccia viva), ordered top-down.
      expect(names).toContain('falda');
      expect(names).toContain('vena');
      expect(names).toContain('argilla');
      expect(names).toContain('roccia viva');
      expect(names.indexOf('argilla')).toBeLessThan(names.indexOf('vena'));
      // Custom Genesis stratum without id is treated as special and surfaced.
      const custom = summarizePlaceStrata(['1'.repeat(16), 'B'.repeat(16), '5'.repeat(16)], strata, 3);
      expect(custom).toEqual(['terra', 'basalto', 'roccia viva']);
    });

    it('il grafo conserva gli strati del luogo nel file e li scrive nella riga del focus (senza cambiare i luoghi senza strati)', () => {
      const files = loadBundledUniverse();
      const g1 = buildGraph(files, [
        { cx: 0, cy: 0, nome: 'Piazza del Borgo', ambiente: 'village', strata: ['terra', 'argilla', 'falda', 'roccia viva'] },
        { cx: 1, cy: 0, nome: 'Radura Vecchia', ambiente: 'clearing' },
      ]);
      expect(g1.describe('chunk:0_0')).toContain('sotto terra, argilla, falda, roccia viva');
      expect(g1.describe('chunk:1_0')).not.toContain('sotto ');

      // Round-trip through world/graph.json keeps strata and hash identical.
      const text = g1.toJson();
      const saved = chunksOf(readGraph({ ...files, [GRAPH_FILE]: text }));
      expect(saved.find((c) => c.cx === 0 && c.cy === 0)?.strata).toEqual(['terra', 'argilla', 'falda', 'roccia viva']);
      expect(saved.find((c) => c.cx === 1 && c.cy === 0)?.strata).toBeUndefined();
      const g2 = buildGraph({ ...files, [GRAPH_FILE]: text });
      expect(g2.hash).toBe(g1.hash);
      expect(g2.describe('chunk:0_0')).toContain('sotto terra, argilla, falda, roccia viva');
    });

    it('il Kernel porta gli strati nel grafo del luogo, nel focus del Narratore e nel contesto non focalizzato', async () => {
      const files = loadBundledUniverse();
      const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
      // Wait for start chunk (0,0) to finish planning.
      for (let i = 0; i < 80 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
        k.tick(1 / 60);
        await new Promise((r) => setTimeout(r, 25));
      }
      const ch = k.chunks.get('0,0')!;
      expect(ch.stage).toBe('planned');
      const node = k.graph().node('chunk:0_0');
      expect(Array.isArray(node?.strata)).toBe(true);
      expect((node?.strata as string[]).length).toBeGreaterThan(0);

      const focusText = k.council.focusContext(k.focusOn([]));
      expect(focusText).toContain('sotto ');
      for (const s of node!.strata as string[]) expect(focusText).toContain(s);

      // Unfocused Narrator and Engineer receive the world's strata palette.
      expect(k.council.context('narrator', false)).toContain('## Strata under the ground');
      expect(k.council.context('narrator', false)).toContain('falda');
      expect(k.council.context('engineer')).toContain('## Strata under the ground');
      expect(k.council.context('engineer')).toContain('aquifer');
      // Focused Narrator keeps its lean system prompt (gets place strata from focusContext).
      expect(k.council.context('narrator', true)).not.toContain('## Strata under the ground');
    });
  });

  // --- 3. Sculptor Architect request (strata under the lot) ----------------------------------------------

  describe('3 · Richiesta dello Scultore Architetto (strati sotto il lotto)', () => {
    it('sampleLotStrata legge lo strato dominante per riga e segnala gli strati notevoli (falda, vena) sotto il lotto', () => {
      const grid: string[][] = [
        ['1', '1', '1', '1'],
        ['2', '2', '2', '6'],
        ['5', '5', '5', '7'],
      ];
      const rows = sampleLotStrata(
        (c, r, d) => {
          const code = grid[d]?.[r * 2 + c];
          const def = code ? SEED_STRATA[code] : undefined;
          return code && def ? { code, def } : undefined;
        },
        { x0: 0, y0: 0, x1: 1, y1: 1 },
        3,
      );
      expect(rows).toHaveLength(3);
      expect(rows[0]).toMatchObject({ depth: 0, key: 'topsoil', name: 'terra' });
      expect(rows[1]).toMatchObject({ depth: 1, key: 'clay', name: 'argilla' });
      expect(rows[1]!.also?.map((a) => a.name)).toEqual(['falda']);
      expect(rows[2]).toMatchObject({ depth: 2, key: 'bedrock', name: 'roccia viva' });
      expect(rows[2]!.also?.map((a) => a.name)).toEqual(['vena']);
    });

    it('la richiesta all’Architetto include gli strati sotto il lotto e le indicazioni per part-cellar e fondamenta', async () => {
      const files = loadBundledUniverse();
      const prompts: string[] = [];
      const mock = new MockAiModels();
      const spy: AiModels = {
        name: 'spy',
        usage: mock.usage,
        limits: mock.limits,
        async text(call: TextCall): Promise<string> {
          if (call.task === 'model.sculpt') prompts.push(call.prompt);
          return mock.text(call);
        },
      };
      const council = new Council(spy, () => ({ files, palette: {}, strata: { ...SEED_STRATA }, catalog: [] }));
      const req: SculptRequest = {
        id: 'struttura-cantina-prova',
        nome: 'la casa del vasaio',
        aspetto: 'casa con laboratorio e cantina',
        classe: 'structure',
        taglia: 'large',
        cellar: 1,
        strata: [
          { depth: 0, code: '1', key: 'topsoil', name: 'terra', color: '#6b4a30', description: 'terra scura' },
          { depth: 1, code: '2', key: 'clay', name: 'argilla', color: '#a0643f', description: 'argilla rossiccia', also: [{ name: 'falda', color: '#3768b0' }] },
          { depth: 2, code: '5', key: 'bedrock', name: 'roccia viva', color: '#6d6a68' },
          { depth: 3, code: '5', key: 'bedrock', name: 'roccia viva', color: '#6d6a68' },
        ],
      };
      const res = await sculpt(council, req);
      expect(res).toBeDefined();
      expect(prompts.length).toBeGreaterThan(0);
      const first = prompts[0]!;
      // Depth ranges merged cleanly (2–4 tiles roccia viva), colours, notable aquifer, and cellar wall/floor guidance.
      expect(first).toContain('Strata under the lot (below the soil):');
      expect(first).toContain('0–1 tiles terra (#6b4a30, terra scura)');
      expect(first).toContain('1–2 tiles argilla (#a0643f, argilla rossiccia) + falda (#3768b0)');
      expect(first).toContain('2–4 tiles roccia viva (#6d6a68)');
      expect(first).toContain('walls (V) and floor (D) in part-cellar');
      expect(first).toContain('bedrock layer');
    });

    it('ModelDirector.missing e la rigenerazione passano gli strati del lotto nella richiesta della struttura', async () => {
      const files = loadBundledUniverse();
      const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
      k.tick(1 / 60);
      const S = k.config.chunkSize;
      const ch = k.chunks.get('0,0')!;
      ch.strata = uniformStrata(S, ['1', '2', '5', '5', '5', '5']);
      // Spawn a structure awaiting sculpting at (5.5, 5.5).
      k.ecs.spawn({
        pos: { x: 5.5, y: 5.5 },
        structure: { concept: 'la fornace del borgo', class: 'structure', size: 'large', model: 'struttura-fornace-prova', cellar: 1 },
        form: { model: 'structure', seed: 1, yaw: 0, wanted: 'struttura-fornace-prova', classe: 'structure' },
        chunk: { key: '0,0' },
      });
      const req = k.sculpting.missing(true).find((r) => r.id === 'struttura-fornace-prova');
      expect(req).toBeDefined();
      expect(req?.cellar).toBe(1);
      expect(req?.strata?.map((s) => s.key)).toEqual(['topsoil', 'clay', 'bedrock']);

      // Regeneration also picks up plan strata for structures.
      const k2 = await Kernel.boot({ files: makeCellarBuilding(files, 'struttura-forno-borgo'), store: memoryStore(), ai: new MockAiModels() });
      const place = {
        cx: 0,
        cy: 0,
        plan: {
          place: { name: 'Borgo', description: 'un borgo' },
          layout: 'village',
          objects: [],
          ground: [],
          fresh: [],
          runes: [],
          structures: [{ concept: 'il forno del borgo', cellar: true }],
          strataDepth: STRATA_DEPTH,
          strata: uniformStrata(S, ['1', '2', '5', '5', '5', '5']),
        },
      };
      const wearers = wearersOf(k2, [place]);
      const id = k2.structureModelOf('il forno del borgo');
      const regenReq = requestOf(id, { class: 'structure', size: 'large', name: 'il forno del borgo', cellar: 1 }, wearers.get(id) ?? []);
      expect(regenReq.strata?.map((s) => s.key)).toEqual(['topsoil', 'clay', 'bedrock', 'bedrock']);
    });
  });

  // --- 4. Scenografo: rooms per stratum ------------------------------------------------------------------

  describe('4 · Stanze dello Scenografo per strato (interior.design, furnish, Forms, sessione)', () => {
    it('readRules e ruleFor leggono e abbinano `stratum` solo per la cantina con ripiego sulla regola generale', () => {
      const known = (id: string) => ['barile', 'cellar-shelf', 'cellar-rack', 'banco'].includes(id);
      const { rules } = readRules(
        {
          rules: [
            { storey: 0, room: 'hall', stratum: 'clay', furniture: ['banco'], count: 2 }, // stratum ignored above ground
            { room: 'cellar', stratum: 'Clay', furniture: ['barile'], count: 4 },
            { stratum: 'bedrock', furniture: ['cellar-shelf'], count: 3 }, // inferred room: 'cellar'
            { room: 'cellar', stratum: '*', furniture: ['cellar-rack'], count: 2 }, // wildcard → fallback
            { room: 'cellar', stratum: 'bogus', furniture: ['barile'], count: 1 }, // rejected by knownStratum
          ],
        },
        known,
        (s) => ['clay', 'bedrock'].includes(s),
      );

      expect(rules[0]).toEqual({ storey: 0, room: 'hall', furniture: ['banco'], count: 2 });
      expect(rules[1]).toEqual({ room: 'cellar', stratum: 'clay', furniture: ['barile'], count: 4 });
      expect(rules[2]).toEqual({ room: 'cellar', stratum: 'bedrock', furniture: ['cellar-shelf'], count: 3 });
      expect(rules[3]).toEqual({ room: 'cellar', furniture: ['cellar-rack'], count: 2 });
      expect(rules[4]).toEqual({ room: 'cellar', furniture: ['barile'], count: 1 });
      expect(hasStratumRules(rules)).toBe(true);
      expect(hasStratumRules([rules[0]!, rules[3]!])).toBe(false);

      expect(ruleFor(rules, { storey: -1, kind: 'cellar', stratum: 'clay' })?.furniture).toEqual(['barile']);
      expect(ruleFor(rules, { storey: -1, kind: 'cellar', stratum: 'bedrock' })?.furniture).toEqual(['cellar-shelf']);
      expect(ruleFor(rules, { storey: -1, kind: 'cellar', stratum: 'sandbed' })?.furniture).toEqual(['cellar-rack']);
      expect(ruleFor(rules, { storey: -1, kind: 'cellar' })?.furniture).toEqual(['cellar-rack']);
      expect(ruleFor(rules, { storey: 0, kind: 'hall' })?.furniture).toEqual(['banco']);
    });

    it('interiorSchema e describeBuilding espongono gli strati solo quando l’edificio ha una cantina', () => {
      const files = loadBundledUniverse();
      const sWithout = interiorSchema(['barile']);
      expect((sWithout.properties!.rules!.items!.properties as Record<string, unknown>).stratum).toBeUndefined();
      const sWith = interiorSchema(['barile'], ['clay', 'bedrock']);
      expect((sWith.properties!.rules!.items!.properties as Record<string, { enum?: string[] }>).stratum?.enum).toEqual(['clay', 'bedrock']);

      const m = compileMjx(MOCK_STRUCTURE_PROGRAM, { size: [100, 100, 120], base: 20, files: { 'part-cellar.xml': files['models/part-cellar.xml']!, 'part-stair.xml': files['models/part-stair.xml']!, 'part-door.xml': files['models/part-door.xml']! } });
      const r = runMjx(m, 1, { deadline: 8_000 });
      const cellarPlan = interiorPlan({ grid: r.grid, palette: m.program.palette, vpt: 16, base: 20, actions: m.actions, seed: 1 });
      const text = describeBuilding({
        name: 'Casa con cantina',
        box: [100, 100, 120],
        vpt: 16,
        seeds: [{ seed: 1, plan: cellarPlan }],
        strata: [
          { key: 'clay', name: 'argilla', description: 'argilla rossiccia', underBuilding: true },
          { key: 'bedrock', name: 'roccia viva', description: 'roccia dura' },
        ],
      });
      expect(text).toContain('Strata under the ground');
      expect(text).toContain('`clay` (argilla) [under this building]');
      expect(text).toContain('`bedrock` (roccia viva)');

      const barePlan = interiorPlan({ grid: r.grid, palette: m.program.palette, vpt: 16, base: 0, actions: m.actions, seed: 1 });
      const noCellarText = describeBuilding({
        name: 'Casa senza cantina',
        box: [100, 100, 100],
        vpt: 16,
        seeds: [{ seed: 1, plan: barePlan }],
        strata: [{ key: 'clay', name: 'argilla' }],
      });
      expect(noCellarText).not.toContain('Strata under the ground');
    });

    it('lo stesso edificio arreda la cantina diversamente nell’argilla (botti) e nella roccia viva (scaffali/rastrelliere), con chiavi di cache distinte', async () => {
      const base = loadBundledUniverse();
      const rules: InteriorRule[] = [
        { storey: 0, room: 'hall', furniture: ['banco'], count: 2 },
        { room: 'cellar', stratum: 'clay', furniture: ['barile'], count: 4 },
        { room: 'cellar', stratum: 'bedrock', furniture: ['cellar-shelf', 'cellar-rack'], count: 4 },
        { room: 'cellar', furniture: ['cellar-shelf'], count: 2 },
      ];
      const files = makeCellarBuilding(base, 'struttura-cantina-strati', rules);
      const forms = new Forms(new InlineRunner());
      forms.load(files);

      const fClay = await forms.settled('struttura-cantina-strati', 1, undefined, undefined, { stratum: 'clay' });
      const fRock = await forms.settled('struttura-cantina-strati', 1, undefined, undefined, { stratum: 'bedrock' });
      expect(fClay?.status).toBe('ready');
      expect(fRock?.status).toBe('ready');
      expect(fClay!.key).not.toBe(fRock!.key);

      // Verify actual furniture placed in the cellar differs by stratum.
      const clayCellarIds = new Set(fClay!.result!.furniture!.filter((p) => p.box[2] < fClay!.base).map((p) => p.id));
      const rockCellarIds = new Set(fRock!.result!.furniture!.filter((p) => p.box[2] < fRock!.base).map((p) => p.id));
      expect(clayCellarIds.size).toBeGreaterThan(0);
      expect(rockCellarIds.size).toBeGreaterThan(0);
      expect([...clayCellarIds]).toEqual(['barile']);
      expect([...rockCellarIds].every((id) => id === 'cellar-shelf' || id === 'cellar-rack')).toBe(true);

      // A building whose rules do NOT depend on stratum shares a single cached form regardless of stratum.
      const plainFiles = makeCellarBuilding(base, 'struttura-cantina-normale', [
        { storey: 0, room: 'hall', furniture: ['banco'], count: 2 },
        { room: 'cellar', furniture: ['barile'], count: 3 },
      ]);
      forms.load(plainFiles);
      const pClay = await forms.settled('struttura-cantina-normale', 1, undefined, undefined, { stratum: 'clay' });
      const pRock = await forms.settled('struttura-cantina-normale', 1, undefined, undefined, { stratum: 'bedrock' });
      expect(pClay!.key).toBe(pRock!.key);
      // And interiorText without stratum matches the legacy shape.
      const qPlain = forms.request('struttura-cantina-normale', 1, undefined, { stratum: 'clay' })!;
      expect(qPlain.interior?.stratum).toBeUndefined();
      expect(JSON.parse(interiorText(qPlain.interior!))).toHaveLength(4);
    });

    it('InteriorDirector.make e designInterior offline generano regole per strato per un edificio con cantina e le salvano nell’indice', async () => {
      const files = makeCellarBuilding(loadBundledUniverse(), 'struttura-cantina-dir');
      const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
      k.tick(1 / 60);
      const S = k.config.chunkSize;
      const ch = k.chunks.get('0,0')!;
      ch.strata = uniformStrata(S, ['1', '2', '5', '5', '5', '5']);
      const st = k.cellarStratumAt(5.5, 5.5, 1, ch);
      expect(st).toBe('clay');
      k.ecs.spawn({
        pos: { x: 5.5, y: 5.5 },
        structure: { concept: 'la casa con cantina', class: 'structure', size: 'large', model: 'struttura-cantina-dir', cellar: 1 },
        form: { model: 'struttura-cantina-dir', seed: 1, yaw: 0, stratum: st },
        chunk: { key: '0,0' },
      });

      const res = await k.furnishing.make('struttura-cantina-dir');
      expect(res.ok).toBe(true);
      const spec = k.forms.interiorSpec('struttura-cantina-dir');
      expect(spec).toBeDefined();
      expect(hasStratumRules(spec!.rules)).toBe(true);
      expect(spec!.rules.some((r) => r.room === 'cellar' && r.stratum === 'clay')).toBe(true);
      expect(spec!.rules.some((r) => r.room === 'cellar' && r.stratum === 'bedrock')).toBe(true);
      expect(spec!.rules.some((r) => r.room === 'cellar' && !r.stratum)).toBe(true);

      // Without strata offered (no cellar or omitted), designInterior stays backward compatible.
      const plainCouncil = new Council(new MockAiModels(), () => ({ files, palette: {}, catalog: [] }));
      const fBare = await k.forms.settled('struttura-cantina-dir', 1, undefined, undefined, { bare: true });
      const plan = interiorPlan({ grid: fBare!.result!.grid, palette: fBare!.result!.palette, vpt: fBare!.vpt, base: fBare!.base, actions: k.forms.compiled('struttura-cantina-dir')!.actions, seed: 1 });
      const legacy = await designInterior(plainCouncil, {
        model: 'struttura-cantina-dir',
        name: 'Casa',
        box: [fBare!.result!.grid.X, fBare!.result!.grid.Y, fBare!.result!.grid.Z],
        vpt: fBare!.vpt,
        seeds: [{ seed: 1, plan }],
        catalogue: [{ id: 'barile', name: 'Barile', size: [0.8, 0.8, 1] }, { id: 'cellar-shelf', name: 'Scaffale', size: [1, 0.5, 1.5] }],
      });
      expect(legacy?.rules.some((r) => r.stratum)).toBe(false);
    });

    it('in multigiocatore lo strato della cantina (`FormView.stratum`) viaggia sul filo fino allo specchio del client', async () => {
      const base = loadBundledUniverse();
      const cfg = JSON.parse(base['universe.json']!);
      const files = makeCellarBuilding(
        { ...base, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) },
        'struttura-cantina-wire',
        [
          { room: 'cellar', stratum: 'clay', furniture: ['barile'], count: 3 },
          { room: 'cellar', stratum: 'bedrock', furniture: ['cellar-shelf'], count: 3 },
        ],
      );
      const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
      k.tick(1 / 60);
      const S = k.config.chunkSize;
      const ch = k.chunks.get('0,0')!;
      ch.strata = uniformStrata(S, ['1', '2', '5', '5', '5', '5']);
      const pc = k.wandererCarpet();
      k.ecs.spawn({
        pos: { x: pc.x + 2, y: pc.y + 2 },
        glyph: { ch: '⌂', color: '#9a4632' },
        body: { r: 0.5, solid: true },
        structure: { concept: 'cantina', class: 'structure', size: 'large', model: 'struttura-cantina-wire', cellar: 1 },
        form: { model: 'struttura-cantina-wire', seed: 1, yaw: 0, stratum: 'clay' },
        chunk: { key: '0,0' },
      });

      const server = new SessionServer(k);
      const { server: s, client: c } = fakeLink();
      server.connect(s);
      const session = new SessionClient(c, { id: 'alice', name: 'Alice' });
      await session.ready;
      const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
      const thin = new ThinClient(mirror, session);
      for (let i = 0; i < 6; i++) {
        mirror.tick(1 / 60);
        thin.frame(1 / 60);
        server.tick(1 / 60);
      }
      const mirrored = mirror.ecs
        .query('form')
        .map((id) => mirror.ecs.get(id, 'form'))
        .find((fc) => fc.model === 'struttura-cantina-wire');
      expect(mirrored?.stratum).toBe('clay');
    });

    it('dominantCellarStratum e stratumKey gestiscono strati del seme e strati senza id della Genesi', () => {
      const basalt: TerrainDef = { name: 'Basalto scuro', color: '#222226', solid: true, layer: 'stratum' };
      expect(stratumKey(SEED_STRATA['2']!, '2')).toBe('clay');
      expect(stratumKey(basalt, 'B')).toBe('basalto_scuro');
      expect(dominantCellarStratum(() => ({ code: 'B', def: basalt }), { x0: 0, y0: 0, x1: 2, y1: 2 }, 1)?.key).toBe('basalto_scuro');
      expect(dominantCellarStratum(() => ({ code: '2', def: SEED_STRATA['2']! }), { x0: 0, y0: 0, x1: 2, y1: 2 }, 0)).toBeUndefined();
      // Verify furnishWithRules directly with stratum argument.
      const files = loadBundledUniverse();
      const m = compileMjx(MOCK_STRUCTURE_PROGRAM, { size: [100, 100, 120], base: 20, files: { 'part-cellar.xml': files['models/part-cellar.xml']!, 'part-stair.xml': files['models/part-stair.xml']!, 'part-door.xml': files['models/part-door.xml']! } });
      const r = runMjx(m, 1, { deadline: 8_000 });
      const plan = interiorPlan({ grid: r.grid, palette: m.program.palette, vpt: 16, base: 20, actions: m.actions, seed: 1 });
      const rooms = interiorRooms(plan, undefined, 'basalto_scuro');
      expect(rooms.some((rm) => rm.kind === 'cellar' && rm.stratum === 'basalto_scuro')).toBe(true);
      const barrelModel = compileMjx(files['models/barile.xml']!);
      const barrelRun = runMjx(barrelModel, 1, { deadline: 4_000 });
      const barrel = pieceOf('barile', { grid: barrelRun.grid, palette: barrelModel.program.palette }, 20, 16)!;
      const out = furnishWithRules(plan, [{ room: 'cellar', stratum: 'basalto_scuro', furniture: ['barile'], count: 2 }], new Map([['barile', barrel]]), 1, undefined, 'basalto_scuro');
      expect(out.pieces).toBeGreaterThan(0);
    });
  });
});
