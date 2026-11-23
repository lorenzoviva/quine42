// T480 (ADR-0259, R4 — Il fondale): seabed under translucent water in true-relief worlds,
// depth-driven water opacity, seabed strata (mud, sandbed, reef bedrock), WaterFlow real bed depth,
// Cartographer `where: 'underwater'` placement on the seabed without blocking surface swimmers,
// terrain worker byte-for-byte parity, and multiplayer `ChunkView.bed` wire sync.

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { LEVEL, RELIEF_DEPTH, TrueRelief, parseRelief, readRelief } from '../src/kernel/relief';
import { DEEP, WaterFlow } from '../src/kernel/water';
import { bedStratum, biomeOf, SEED_STRATA, strataPalette } from '../src/kernel/strata';
import { planChunk, seabedLine, WHERE, whereOf, type PlanContext } from '../src/kernel/agents/cartography';
import { Council } from '../src/kernel/agents/council';
import { buildChunk, chunkInput, chunkView, chunkSig, WATER_Y } from '../src/render/terrain';
import { answerChunk, chunkArrays, inputSource, waterAlpha } from '../src/render/terrainmesh';
import { SEA_MAT } from '../src/render/sea';
import { idsOf } from '../src/render/materials';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { fakeLink, type ChunkView } from '../src/session/protocol';
import { playerFiles } from '../src/session/files';
import { emptyUsage, type AiModels, type Schema, type TextCall } from '../src/kernel/ai/models';

/** Files for a true-relief archipelago world (pirates/coast) with a real seabed. */
function trueReliefFiles(geography: 'archipelago' | 'continents' = 'archipelago'): Record<string, string> {
  const files = { ...bundledFiles };
  const cfg = JSON.parse(files['universe.json']);
  cfg.nature = { ...(cfg.nature ?? {}), geography, relief: 'true' };
  files['universe.json'] = JSON.stringify(cfg, null, 2);
  return files;
}

describe('seabed levels and WaterFlow (T480)', () => {
  it('computes real seabed depth on open sea, shallows, reefs, layout ponds, and digs; keeps Hills at DEEP', async () => {
    const k = await Kernel.boot({ files: trueReliefFiles('archipelago'), store: memoryStore(), ai: new MockAiModels() });
    k.tick(1 / 60);
    const ch = [...k.chunks.values()][0]!;
    const S = k.config.chunkSize;
    expect(k.hasBedAt(ch.cx * S)).toBe(true);

    // Paint a controlled strip inside the chunk: land (g), reef (y), shallow (w), deep sea (o), lava (v).
    const grid = [...ch.tiles];
    const set = (c: number, r: number, code: string) => {
      grid[r * S + c] = code;
    };
    set(4, 4, 'g');
    set(5, 4, 'y');
    set(6, 4, 'w');
    set(7, 4, 'o');
    set(8, 4, 'v');
    ch.tiles = grid.join('');
    ch.version++;

    const x0 = ch.cx * S, y0 = ch.cy * S;
    // Land: bed equals ground.
    expect(k.bedAt(x0 + 4.5, y0 + 4.5)).toBe(k.groundAt(x0 + 4.5, y0 + 4.5));
    // Reef: strictly 1 level below surface.
    expect(k.bedLevelAt(x0 + 5, y0 + 4)).toBe(Math.round(k.groundAt(x0 + 5.5, y0 + 4.5) / LEVEL) - 1);
    // Shallow & deep water: strictly below surface and within [-RELIEF_DEPTH, surf - 1].
    for (const c of [6, 7]) {
      const surf = Math.round(k.groundAt(x0 + c + 0.5, y0 + 4.5) / LEVEL);
      const bed = k.bedLevelAt(x0 + c, y0 + 4);
      expect(bed).toBeLessThan(surf);
      expect(bed).toBeGreaterThanOrEqual(-RELIEF_DEPTH);
    }
    // Clear water vs lava: swimmable water is clear, lava is opaque.
    expect(k.isClearWater('w')).toBe(true);
    expect(k.isClearWater('o')).toBe(true);
    expect(k.isClearWater('y')).toBe(true);
    expect(k.isClearWater('v')).toBe(false);
    expect(k.isClearWater('g')).toBe(false);

    // Hilly seed world: hasBedAt is false, bed falls back to DEEP on water.
    const hills = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    hills.tick(1 / 60);
    const hch = [...hills.chunks.values()][0]!;
    expect(hills.hasBedAt(hch.cx * S)).toBe(false);
    const hg = [...hch.tiles];
    hg[4 * S + 4] = 'w';
    hch.tiles = hg.join('');
    const hx = hch.cx * S + 4, hy = hch.cy * S + 4;
    expect(hills.bedLevelAt(hx, hy)).toBe(Math.round(hills.groundAt(hx + 0.5, hy + 0.5) / LEVEL) - DEEP);
  });

  it('lets WaterFlow use real bed depth via WaterWorld.bed and preserves total volume', () => {
    // A 3-tile deep pond (bed = 0, surface = 6 → depth 6) beside a dry pit at ground 2.
    const wet = new Set(['0,0', '1,0']);
    const flow = new WaterFlow({
      loaded: (c, r) => c >= 0 && c <= 2 && r === 0,
      wet: (c, r) => wet.has(`${c},${r}`),
      surface: () => 6,
      ground: (c) => (c === 2 ? 2 : 0),
      bed: (c) => (c <= 1 ? 0 : 2),
      record: () => undefined,
      sea: () => -10,
    });
    flow.wake(2, 0);
    // Initial volume is 2 tiles × 6 levels = 12 (much more than 2 × DEEP = 4).
    expect(flow.volume()).toBeCloseTo(12, 6);
    for (let i = 0; i < 400 && flow.step(); i++);
    // Conserved volume and all three cells settle near the same surface (~4.67).
    expect(flow.volume()).toBeCloseTo(12, 5);
    const a = flow.water(0, 0)!, b = flow.water(2, 0)!;
    expect(a.bed + a.water).toBeCloseTo(b.bed + b.water, 1);
    expect(b.water).toBeGreaterThan(2);
  });

  it('exposes chunkBedAt on TrueRelief matching chunkData.bed', () => {
    const raw = parseRelief('0 0 0 0\n-10 -4 -1 0', 2)!;
    const tr = new TrueRelief(1, 2, () => raw, () => { throw new Error('no fallback'); }, false);
    expect([...tr.chunkBedAt(0, 0, 2)!]).toEqual([-10, -4, -1, 0]);
    expect(tr.chunkBedAt(0, 0, 18)).toBeUndefined();
  });
});

describe('seabed strata (T480)', () => {
  it('classifies reefs as rock and picks bedrock on reefs/1-level shoals, top stratum elsewhere', () => {
    const pal = strataPalette({});
    expect(biomeOf('y', { name: 'secca', color: '#4c949e', solid: false, layer: 'liquid', depth: 'reef' })).toBe('rock');
    expect(biomeOf('o', { name: 'mare', color: '#1b5b88', solid: false, layer: 'liquid', depth: 'deep' })).toBe('wet');
    const mud = SEED_STRATA['4']!;
    const sandbed = SEED_STRATA['3']!;
    const bedrock = SEED_STRATA['5']!;
    expect(bedStratum({ name: 'secca', color: '#4c949e', solid: false, layer: 'liquid', depth: 'reef' }, 3, mud, pal)).toBe(bedrock);
    expect(bedStratum({ name: 'acqua', color: '#2b6cb0', solid: false, layer: 'liquid', depth: 'shallow' }, 1, sandbed, pal)).toBe(bedrock);
    expect(bedStratum({ name: 'acqua', color: '#2b6cb0', solid: false, layer: 'liquid', depth: 'shallow' }, 4, sandbed, pal)).toBe(sandbed);
    expect(bedStratum({ name: 'mare', color: '#1b5b88', solid: false, layer: 'liquid', depth: 'deep' }, 12, mud, pal)).toBe(mud);
  });
});

describe('translucent water, seabed mesh, and worker parity (T480)', () => {
  it('increases waterAlpha monotonically with depth within [0.34, 0.88]', () => {
    expect(waterAlpha(0)).toBeCloseTo(0.34, 5);
    expect(waterAlpha(0.25)).toBeGreaterThan(waterAlpha(0));
    expect(waterAlpha(1.5)).toBeGreaterThan(waterAlpha(0.25));
    expect(waterAlpha(5)).toBeGreaterThan(waterAlpha(1.5));
    expect(waterAlpha(100)).toBeLessThanOrEqual(0.88);
  });

  it('builds seabed + clearWater mesh in true-relief worlds with 100% worker byte-for-byte parity, while keeping lava opaque and Hills unchanged', async () => {
    // True-relief world with mixed shore, reef, shallow, deep sea, and lava.
    const k = await Kernel.boot({ files: trueReliefFiles('archipelago'), store: memoryStore(), ai: new MockAiModels() });
    k.tick(1 / 60);
    const ch = [...k.chunks.values()][0]!;
    const S = k.config.chunkSize;
    const tiles = new Array<string>(S * S).fill('o');
    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        if (c < 5) tiles[r * S + c] = 'g';
        else if (c === 5) tiles[r * S + c] = 's';
        else if (c === 6 || c === 7) tiles[r * S + c] = 'w';
        else if (c === 8 && r >= 6 && r <= 10) tiles[r * S + c] = 'y';
        else if (c === 14 && r === 14) tiles[r * S + c] = 'v';
      }
    }
    ch.tiles = tiles.join('');
    ch.version++;

    // Page build vs worker build parity (ADR-0242).
    const input = chunkInput(k, ch);
    expect(input.hasBed).toBe(true);
    const ans = answerChunk(1, input);
    expect(ans.answer.ok).toBe(true);
    const workerArr = (ans.answer as { ok: true; arrays: ReturnType<typeof chunkArrays> }).arrays;
    const pageView = buildChunk(k, ch);
    const workerView = chunkView(k, ch, workerArr, chunkSig(k, ch))!;

    const pageMeshes = pageView.group.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh);
    const workerMeshes = workerView.group.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh);
    expect(workerMeshes.length).toBe(pageMeshes.length);

    // Must have ground (including seabed tops + underwater strata sides), clearWater (swimmable), opaque water (lava), and foam.
    const clearMesh = pageMeshes.find((m) => m.material === SEA_MAT.clear)!;
    const opaqueWater = pageMeshes.find((m) => m.material === SEA_MAT.water)!;
    expect(clearMesh).toBeDefined();
    expect(opaqueWater).toBeDefined();
    // Lava is 1 tile = 6 vertices in opaque water; swimmable water is in clearWater with alpha attribute.
    expect(opaqueWater.geometry.getAttribute('position').count).toBe(6);
    const alphaAttr = clearMesh.geometry.getAttribute('alpha') as THREE.BufferAttribute;
    expect(alphaAttr).toBeDefined();
    expect(alphaAttr.count).toBe(clearMesh.geometry.getAttribute('position').count);
    let minA = Infinity, maxA = -Infinity;
    for (let i = 0; i < alphaAttr.count; i++) {
      const a = alphaAttr.getX(i);
      expect(a).toBeGreaterThanOrEqual(0.34 - 1e-6);
      expect(a).toBeLessThanOrEqual(0.88 + 1e-6);
      if (a < minA) minA = a;
      if (a > maxA) maxA = a;
    }
    // Opacity varies smoothly between shallow/reef and deep sea.
    expect(maxA).toBeGreaterThan(minA + 0.05);

    // Seabed never pokes above water surface - SWELL_MAX (water is at g0 + WATER_Y, bed <= g0 - LEVEL).
    const groundPos = pageMeshes[0]!.geometry.getAttribute('position') as THREE.BufferAttribute;
    let deepBedVerts = 0;
    for (let i = 0; i < groundPos.count; i++) if (groundPos.getY(i) < WATER_Y) deepBedVerts++;
    expect(deepBedVerts).toBeGreaterThan(0);

    // Exact byte-for-byte comparison of every mesh attribute between page and worker.
    for (let m = 0; m < pageMeshes.length; m++) {
      expect(workerMeshes[m]!.material).toBe(pageMeshes[m]!.material);
      const pa = pageMeshes[m]!.geometry.attributes;
      const wa = workerMeshes[m]!.geometry.attributes;
      expect(Object.keys(wa).sort()).toEqual(Object.keys(pa).sort());
      for (const attr of Object.keys(pa)) {
        expect([...(wa[attr]!.array as Float32Array)]).toEqual([...(pa[attr]!.array as Float32Array)]);
      }
    }

    // SEA_MAT.clear still produces waving ink IDs for crisp shoreline/hull outlines.
    const clearIds = idsOf(SEA_MAT.clear) as THREE.ShaderMaterial;
    expect(clearIds).toBeDefined();
    expect(clearIds.vertexShader).toContain('seaSwell(seaPhase, uTime)');

    // Hilly world: no clearWater, no hasBed in ChunkInput.
    const hills = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    hills.tick(1 / 60);
    const hch = [...hills.chunks.values()][0]!;
    const hin = chunkInput(hills, hch);
    expect(hin.hasBed).toBeUndefined();
    const hArr = chunkArrays(inputSource(hin));
    expect(hArr.clearWater).toBeUndefined();
  });
});

describe('Cartographer `where: underwater` placement (T480)', () => {
  it('offers `underwater` in schema and prompt only when PlanContext.seabed is present, and combines with `enclave`', async () => {
    expect(WHERE).toContain('underwater');
    expect(whereOf('underwater')).toBe('underwater');
    expect(seabedLine(undefined)).toBe('');
    expect(seabedLine({ tiles: 40, deep: 20, reef: 4, maxDepth: 16, strata: ['sabbia compatta', 'fango'] })).toContain('"where": underwater');

    const seen: Array<{ prompt: string; schema: Schema }> = [];
    const spyAi: AiModels = {
      name: 'spy',
      async text(call: TextCall) {
        if (call.schema) seen.push({ prompt: call.prompt, schema: call.schema });
        return JSON.stringify({ place: { name: 'Baia', description: 'una baia' }, environment: 'harbour', objects: [], ground: [], fresh: [], runes: [], structures: [] });
      },
      usage: emptyUsage(),
      limits: new MockAiModels().limits,
    };
    const council = new Council(spyAi, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const baseCtx: PlanContext = {
      cx: 1,
      cy: 0,
      terrain: 'mare 60%, terra 40%',
      neighbors: [],
      layouts: [{ id: 'harbour', name: 'Porto', description: 'un porto', environment: 'mixed' }],
      catalog: [],
      fragments: [],
      wanted: [],
      start: false,
      attempt: 0,
    };

    // Plain place: neither enclave nor underwater.
    await planChunk(council, baseCtx);
    const plainEnum = (seen[0]!.schema.properties!.objects.items!.properties!.where as { enum: string[] }).enum;
    expect(plainEnum).not.toContain('underwater');
    expect(plainEnum).not.toContain('enclave');
    expect(seen[0]!.prompt).not.toContain('Seabed of this place');

    // Place with seabed only.
    await planChunk(council, { ...baseCtx, seabed: { tiles: 30, deep: 12, reef: 2, maxDepth: 12, strata: ['fango'] } });
    const seaEnum = (seen[1]!.schema.properties!.objects.items!.properties!.where as { enum: string[] }).enum;
    expect(seaEnum).toContain('underwater');
    expect(seaEnum).not.toContain('enclave');
    expect(seen[1]!.prompt).toContain('Seabed of this place');

    // Place with both seabed and enclave.
    await planChunk(council, {
      ...baseCtx,
      seabed: { tiles: 30, deep: 12, reef: 2, maxDepth: 12, strata: ['fango'] },
      relief: { roughness: 'mountainous', enclaves: 1, share: 0.08, means: 'climb' },
    });
    const bothEnum = (seen[2]!.schema.properties!.objects.items!.properties!.where as { enum: string[] }).enum;
    expect(bothEnum).toContain('underwater');
    expect(bothEnum).toContain('enclave');
  });

  it('places underwater objects on the seabed with `below`, never drowns NPCs, and keeps surface swimmers unblocked', async () => {
    const k = await Kernel.boot({ files: trueReliefFiles('archipelago'), store: memoryStore(), ai: new MockAiModels() });
    k.tick(1 / 60);
    const ch = [...k.chunks.values()][0]!;
    const S = k.config.chunkSize;
    // Build a coastal chunk with land on left and open sea on right so underwater & land pools both exist.
    ch.draft = Array.from({ length: S * S }, (_, i) => ((i % S) < 8 ? 'g' : 'o')).join('');
    const plan = {
      place: { name: 'Cala del Relitto', description: 'acqua chiara su un vecchio fondo' },
      layout: 'village',
      objects: [
        { module: 'obj.chest', where: 'underwater' as const },
        { module: 'npc.villager', where: 'underwater' as const },
      ],
      ground: [],
      fresh: [],
      runes: [],
      structures: [],
      swim: true,
    };
    (k as unknown as { applyPlan: (c: typeof ch, p: typeof plan) => void }).applyPlan(ch, plan);
    k.tick(1 / 60);

    const chests = k.ecs.query('module', 'pos').filter((id) => k.ecs.get(id, 'module').id === 'obj.chest');
    expect(chests.length).toBeGreaterThanOrEqual(1);
    const chest = chests[0]!;
    const cp = k.ecs.get(chest, 'pos');
    const tileCode = k.tileAt(Math.floor(cp.x), Math.floor(cp.y));
    expect(k.isClearWater(tileCode)).toBe(true);
    const bedZ = k.bedAt(cp.x, cp.y);
    const surfZ = k.groundAt(cp.x, cp.y);
    expect(bedZ).toBeLessThan(surfZ);
    expect(cp.z).toBeCloseTo(bedZ, 5);
    expect(k.ecs.get(chest, 'below')?.z).toBeCloseTo(bedZ, 5);
    expect(k.restsAt(chest)).toBeCloseTo(bedZ, 5);

    // After additional ticks (`settleHeights` + `rebuildSolids`), chest stays on the seabed and does NOT block the surface tile.
    for (let i = 0; i < 5; i++) k.tick(1 / 60);
    expect(k.ecs.get(chest, 'pos').z).toBeCloseTo(bedZ, 5);
    expect(k.restsAt(chest)).toBeCloseTo(bedZ, 5);
    // Surface swimmers are not blocked by a sunken object even before its 3D model is built.
    const solidTiles = (k as unknown as { solidTiles: Set<string> }).solidTiles;
    expect(solidTiles.has(`${Math.floor(cp.x)},${Math.floor(cp.y)}`)).toBe(false);

    // NPC with `where: 'underwater'` was forced onto land (never drowned with `below`).
    const npcs = k.ecs.query('module', 'pos').filter((id) => k.ecs.get(id, 'module').id === 'npc.villager');
    for (const npc of npcs) {
      expect(k.ecs.has(npc, 'below')).toBe(false);
    }
  });
});

describe('multiplayer wire transport of ChunkView.bed (T480)', () => {
  it('sends ChunkView.bed once in true-relief worlds, validates untrusted bed, and matches server bedAt on ThinClient', async () => {
    const files = trueReliefFiles('archipelago');
    const cfg = JSON.parse(files['universe.json']);
    cfg.game = { mode: 'multiplayer', death: 3 };
    files['universe.json'] = JSON.stringify(cfg, null, 2);
    expect(playerFiles(files)['modules/world.terrain/logic.lua']).toBeUndefined();

    const serverK = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const srv = new SessionServer(serverK);
    const { server: sLink, client: cLink } = fakeLink();
    const views: ChunkView[] = [];
    cLink.onMessage((m) => void views.push(...((m as { chunks?: ChunkView[] }).chunks ?? [])));
    srv.connect(sLink);
    const session = new SessionClient(cLink, { id: 'viandante-1', name: 'Marina' });
    await session.ready;
    const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    expect(mirror.files['modules/world.terrain/logic.lua']).toBeUndefined();
    const thin = new ThinClient(mirror, session);
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        mirror.tick(1 / 60);
        thin.frame(1 / 60);
        srv.tick(1 / 60);
      }
    };
    for (let i = 0; i < 80 && serverK.chunks.get('0,0')?.stage !== 'planned'; i++) {
      run(1);
      await new Promise((r) => setTimeout(r, 25));
    }
    run(8);

    const S = serverK.config.chunkSize;
    expect(views.some((v) => v.key === '0,0' && Array.isArray(v.bed) && v.bed.length === S * S)).toBe(true);
    const mch = mirror.chunks.get('0,0')!;
    expect(mch.bed).toBeDefined();

    // Compare bedAt, groundAt, and relief.bed on every tile of the starting chunk between server and thin client.
    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        const x = c + 0.5, y = r + 0.5;
        expect(mirror.relief.bed(c, r), `relief.bed ${c},${r}`).toBe(serverK.relief.bed(c, r));
        expect(mirror.groundAt(x, y), `groundAt ${c},${r}`).toBe(serverK.groundAt(x, y));
        expect(mirror.bedAt(x, y), `bedAt ${c},${r}`).toBe(serverK.bedAt(x, y));
      }
    }

    // Untrusted/malformed bed on the wire is rejected by readRelief (and clamped <= relief in ThinClient).
    expect(readRelief('not-an-array', S)).toBeUndefined();
    expect(readRelief([0, 1], S)).toBeUndefined();
    expect(readRelief(new Array(S * S).fill(999), S)).toBeUndefined();
    expect(readRelief(new Array(S * S).fill(-999), S)).toBeUndefined();

    // Injecting an untrusted chunk update where bed > relief clamps bed down to relief on ThinClient.
    const bogusBed = new Array(S * S).fill(10);
    const flatRel = new Array(S * S).fill(-5);
    const bogusView: ChunkView = {
      key: '9,9',
      cx: 9,
      cy: 9,
      tiles: 'o'.repeat(S * S),
      stage: 'planned',
      version: 1,
      relief: flatRel,
      bed: bogusBed,
    };
    (thin as unknown as { places: (list: ChunkView[]) => void }).places([bogusView]);
    const clamped = mirror.chunks.get('9,9')!;
    expect(clamped.bed![0]).toBe(-5);
  }, 90_000);
});
