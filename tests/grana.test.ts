// The grain of the ground (T547, C3 of docs/design/terreno-ricco.md, ADR-0267): specks of one voxel a terrain's material shows over its
// colour, said by `TerrainDef.grain` or by its name (the repair of the universes of before), read without trusting, carried by the tops of
// the place's mesh as one attribute (no triangle more), the same through the worker, drawn by the ground's material.

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { GRAIN_LIMITS, grainByName, grainByte, grainErrors, grainKind, grainOf, readGrain } from '../src/kernel/grain';
import { toPalette } from '../src/kernel/agents/genesis';
import { Validator } from '../src/kernel/validator';
import { buildChunk, chunkInput } from '../src/render/terrain';
import { answerChunk, chunkArrays, inputSource } from '../src/render/terrainmesh';
import { MAT } from '../src/render/materials';

describe('la grana del suolo: il campo e la riparazione dal nome (T547)', () => {
  it('si legge senza fidarsi: colore #rrggbb, densità nel suo intervallo e al suo passo, 0 nessuna', () => {
    expect(readGrain({ color: '#A0B0C0', density: 0.33 })).toEqual({ color: '#a0b0c0', density: 0.35 });
    expect(readGrain({ color: '#a0b0c0', density: 4 })).toEqual({ color: '#a0b0c0', density: GRAIN_LIMITS.density[1] });
    expect(readGrain({ color: '#a0b0c0', density: -1 })).toBeNull();
    expect(readGrain({ density: 0 })).toBeNull();
    for (const bad of [undefined, null, 3, 'ghiaia', [], { color: 'rosso', density: 0.3 }, { color: '#a0b0c0', density: NaN }, { color: '#a0b0c0' }])
      expect(readGrain(bad), JSON.stringify(bad)).toBeUndefined();
  });

  it('il nome dice la grana del suolo che si cammina: brecciolino, ghiaia, binari e massicciata, foglie secche, in italiano e in inglese', () => {
    const ground = (name: string, extra: object = {}) => ({ name, layer: 'ground', solid: false, color: '#a89c88', ...extra });
    expect(grainKind(ground('brecciolino'))).toBe('gravel');
    expect(grainKind(ground('Ghiaia del viale'))).toBe('gravel');
    expect(grainKind(ground('gravel path'))).toBe('gravel');
    expect(grainKind(ground('binari'))).toBe('ballast');
    expect(grainKind(ground('massicciata della ferrovia'))).toBe('ballast');
    expect(grainKind(ground('railway tracks'))).toBe('ballast');
    expect(grainKind(ground('foglie secche'))).toBe('leaves');
    expect(grainKind(ground('tappeto di foglie morte'))).toBe('leaves');
    expect(grainKind(ground('dry leaves'))).toBe('leaves');
    // The id says it too (a terrain of the seed has its English id).
    expect(grainKind(ground('viale', { id: 'gravel' }))).toBe('gravel');
    // Not what is not the ground one walks, nor what the name does not say.
    for (const name of ['prato', 'sentiero', 'strada', 'marciapiede', 'asfalto bagnato', 'sabbia', 'terra battuta'])
      expect(grainKind(ground(name)), name).toBeUndefined();
    expect(grainKind({ name: 'muro di ghiaia', layer: 'wall', solid: true })).toBeUndefined();
    expect(grainKind({ name: 'pavimento di ghiaia', layer: 'floor', solid: false })).toBeUndefined();
    expect(grainKind({ name: 'ghiaia del fondo', layer: 'liquid', solid: true })).toBeUndefined();
  });

  it('i colori delle macchie vengono dal tipo, mescolati col colore del terreno, e stanno nell’intervallo', () => {
    const gravel = grainByName({ name: 'brecciolino', layer: 'ground', color: '#a89c88' })!;
    const ballast = grainByName({ name: 'binari', layer: 'ground', color: '#4a4440' })!;
    const leaves = grainByName({ name: 'foglie secche', layer: 'ground', color: '#6a5a3a' })!;
    for (const g of [gravel, ballast, leaves]) {
      expect(g.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(g.density).toBeGreaterThan(0);
      expect(g.density).toBeLessThanOrEqual(GRAIN_LIMITS.density[1]);
      expect(grainErrors('x', g)).toEqual([]);
    }
    // Gravel lighter than its ground, the ballast's stones lighter than the dark sleepers, the leaves warmer than green.
    const lum = (c: string) => [1, 3, 5].reduce((s, i) => s + parseInt(c.slice(i, i + 2), 16), 0);
    expect(lum(gravel.color)).toBeGreaterThan(lum('#a89c88'));
    expect(lum(ballast.color)).toBeGreaterThan(lum('#4a4440'));
    expect(parseInt(leaves.color.slice(1, 3), 16)).toBeGreaterThan(parseInt(leaves.color.slice(5, 7), 16));
  });

  it('ciò che il terreno dice vince sul nome, e la densità 0 la toglie', () => {
    const t = { name: 'brecciolino', layer: 'ground', color: '#a89c88' };
    expect(grainOf({ ...t, grain: { color: '#ffffff', density: 0.2 } })).toEqual({ color: '#ffffff', density: 0.2 });
    expect(grainOf({ ...t, grain: { color: '#ffffff', density: 0 } })).toBeUndefined();
    expect(grainOf({ ...t, grain: 'tanta' })).toBeUndefined();
    expect(grainOf(t)).toEqual(grainByName(t));
    expect(grainOf(undefined)).toBeUndefined();
  });

  it('il byte della grana tiene la densità a passi e il sale della casella, mai 0', () => {
    expect(grainByte({ color: '#000000', density: 0.35 }, 0) >> 4).toBe(7);
    expect(grainByte({ color: '#000000', density: 0.35 }, 0x1f) & 15).toBe(15);
    expect(grainByte({ color: '#000000', density: 0.01 }, 0)).toBeGreaterThan(0);
    expect(grainByte({ color: '#000000', density: 9 }, 0) >> 4).toBe(15);
  });

  it('il validatore vuole una grana con colore e densità nell’intervallo', () => {
    expect(grainErrors('n', undefined)).toEqual([]);
    expect(grainErrors('n', { color: '#aabbcc', density: 0.3 })).toEqual([]);
    expect(grainErrors('n', { density: 0 })).toEqual([]);
    expect(grainErrors('n', { color: '#aabbcc', density: 2 })).toHaveLength(1);
    expect(grainErrors('n', { color: 'grigio', density: 0.3 })).toHaveLength(1);
    expect(grainErrors('n', 'ghiaia')).toHaveLength(1);
    const manifest = (grain: unknown) =>
      JSON.stringify({ id: 'world.prova', name: 'prova', kind: 'generator', tiles: { n: { name: 'brecciolino', color: '#a89c88', solid: false, layer: 'ground', cross: 'walk', grain } } });
    const v = new Validator({ check: () => undefined } as never);
    expect(v.parseManifest('modules/world.prova/manifest.json', manifest({ color: '#d8d0c0', density: 0.4 })).errors).toEqual([]);
    expect(v.parseManifest('modules/world.prova/manifest.json', manifest({ color: '#d8d0c0', density: 7 })).errors.join(' ')).toMatch(/grain\.density/);
  });

  it('la Genesi passa la grana che il Cartografo dice solo al suolo che si cammina, letta senza fidarsi', () => {
    const raw = (code: string, name: string, layer: string, grain?: unknown) => ({ code, name, description: '', color: '#a89c88', layer, solid: layer !== 'ground', speed: 1, grain }) as never;
    const p = toPalette([
      raw('g', 'prato', 'ground'),
      raw('n', 'brecciolino', 'ground', { color: '#E0D8C8', density: 0.42 }),
      raw('h', 'muro', 'wall', { color: '#e0d8c8', density: 0.4 }),
      raw('x', 'scorie', 'ground', { color: 'nero', density: 0.4 }),
    ]);
    expect(p.n!.grain).toEqual({ color: '#e0d8c8', density: 0.4 });
    expect(p.g!.grain).toBeUndefined();
    expect(p.h!.grain).toBeUndefined();
    expect(p.x!.grain).toBeUndefined();
  });
});

async function world() {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 400 && ![...k.chunks.values()].every((c) => c.stage === 'planned' || c.held); i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 5));
  }
  k.tick(1 / 60);
  return k;
}

describe('la grana nella mesh dei luoghi (T547)', () => {
  it('nel seme nessun terreno ha grana: la mesh è quella di prima, senza attributo e col materiale del mondo', async () => {
    const k = await world();
    for (const t of Object.values(k.palette)) expect(grainOf(t), t.name).toBeUndefined();
    for (const ch of k.chunks.values()) {
      const g = buildChunk(k, ch).group.children[0] as THREE.Mesh;
      expect(g.geometry.getAttribute('grain')).toBeUndefined();
      expect(g.material).toBe(MAT.world);
    }
  });

  it('le cime di un terreno con la grana la portano, senza un triangolo in più, uguali nel worker; i lati e gli altri terreni no', async () => {
    const k = await world();
    const code = Object.keys(k.palette).find((c) => k.palette[c]!.layer === 'ground' && !k.palette[c]!.solid && [...k.chunks.values()].some((ch) => ch.tiles.includes(c)))!;
    expect(code).toBeDefined();
    const before = new Map([...k.chunks.values()].map((ch) => [ch.key, chunkArrays(inputSource(chunkInput(k, ch)))]));
    // The universe of before: the name of the terrain says gravel.
    const name = k.palette[code]!.name;
    k.palette[code]!.name = 'brecciolino';
    try {
      let grained = 0;
      for (const ch of k.chunks.values()) {
        const a = chunkArrays(inputSource(chunkInput(k, ch)));
        const was = before.get(ch.key)!;
        // No triangle more, and the same vertices.
        expect(a.ground.position).toEqual(was.ground.position);
        expect(a.ground.color).toEqual(was.ground.color);
        if (!ch.tiles.includes(code)) {
          expect(a.ground.grain, ch.key).toBeUndefined();
          continue;
        }
        const grain = a.ground.grain!;
        expect(grain.length).toBe((a.ground.position.length / 3) * 4);
        for (let v = 0; v < a.ground.position.length / 3; v++) {
          const has = grain[v * 4 + 3]! > 0;
          // Only on tops (facing up), and so on a top at least once.
          if (has) expect(a.ground.normal[v * 3 + 1]).toBe(1);
          if (has) grained++;
        }
        // The worker's copy (structured as postMessage sends it) makes the same grain.
        const { answer } = answerChunk(1, structuredClone(chunkInput(k, ch)));
        if (!answer.ok) throw new Error(answer.error);
        expect(answer.arrays.ground.grain).toEqual(grain);
        // On the page, the material that reads it.
        const g = buildChunk(k, ch).group.children[0] as THREE.Mesh;
        expect(g.material).toBe(MAT.ground);
        expect(g.geometry.getAttribute('grain')?.itemSize).toBe(4);
      }
      expect(grained).toBeGreaterThan(0);
      // The specks' bytes: the colour and the density of gravel on every grained vertex, the salt of its tile.
      const look = grainByName({ ...k.palette[code]!, name: 'brecciolino' })!;
      const ch = [...k.chunks.values()].find((c) => c.tiles.includes(code))!;
      const grain = chunkArrays(inputSource(chunkInput(k, ch))).ground.grain!;
      const levels = new Set<number>();
      for (let v = 3; v < grain.length; v += 4) if (grain[v]) levels.add(grain[v]! >> 4);
      expect([...levels]).toEqual([grainByte(look, 0) >> 4]);
    } finally {
      k.palette[code]!.name = name;
    }
  });

  it('il materiale del suolo disegna le macchie nel fragment shader, sulle forme del mondo di sempre', () => {
    for (const lib of [THREE.ShaderLib.lambert, THREE.ShaderLib.toon]) {
      const sh = { vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader, uniforms: {} } as unknown as THREE.WebGLProgramParametersWithUniforms;
      MAT.ground.onBeforeCompile(sh, undefined as unknown as THREE.WebGLRenderer);
      expect(sh.vertexShader).toMatch(/attribute vec4 grain;/);
      expect(sh.vertexShader).toMatch(/vGrainAt = position\.xz;/);
      expect(sh.fragmentShader).toMatch(/grainHash/);
      expect(sh.fragmentShader).toMatch(/if \(length\(vClipXZ\) > uClipR\) discard;/);
      expect(sh.fragmentShader.indexOf('#include <color_fragment>')).toBeLessThan(sh.fragmentShader.indexOf('grainOn'));
    }
    expect(MAT.ground.customProgramCacheKey()).not.toBe(MAT.world.customProgramCacheKey());
  });
});
