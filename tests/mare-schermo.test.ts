// The sea on screen (T451, P8 of docs/design/acqua-spazio.md § 1.7): rendering only. The swell is the same sum of sines in the shader and
// here; the water is still where it meets anything that is not water of its level (so a bank never shows a slit under it) and moves
// fully on the open sea; the foam lies along the shores; a vehicle on the water rolls and leaves a wake of puffs that spread and fade,
// on land it stands straight and leaves none; a swimmer rides the swell.

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { buildChunk, WATER_Y } from '../src/render/terrain';
import { idsOf } from '../src/render/materials';
import {
  cornerWeight, dropsWake, FOAM_WIDTH, rollOf, ROLL, Sea, SEA_GLSL, SEA_MAT, seaLift, seaWeight, SWELL, SWELL_MAX, swellAt, WAKE, wakePuffs,
  waveAttribute, type WakePoint,
} from '../src/render/sea';

/** A carpet of water tiles at level 0, with land where `land` says. */
const tops = (land: (x: number, z: number) => boolean, level = (_x: number, _z: number) => 0) => (x: number, z: number) =>
  land(x, z) ? undefined : level(x, z) + WATER_Y;

describe('the swell (T451)', () => {
  it('stays within its height, moves with the time, and is the same sum in the shader', () => {
    let lo = Infinity, hi = -Infinity;
    for (let x = -50; x < 50; x += 0.7)
      for (let t = 0; t < 30; t += 1.3) {
        const h = swellAt(x, x * 0.3, t);
        lo = Math.min(lo, h);
        hi = Math.max(hi, h);
      }
    expect(hi).toBeLessThanOrEqual(SWELL_MAX + 1e-9);
    expect(lo).toBeGreaterThanOrEqual(-SWELL_MAX - 1e-9);
    expect(hi - lo).toBeGreaterThan(SWELL_MAX);
    // Under the land always: the water's rest level plus the highest swell stays under the ground of its level.
    expect(WATER_Y + SWELL_MAX).toBeLessThan(0);
    expect(swellAt(3, 4, 0)).not.toBeCloseTo(swellAt(3, 4, 1), 3);
    // The shader's numbers are these.
    for (const { k, w, a } of SWELL) for (const n of [k, w, a]) expect(SEA_GLSL).toContain(n.toFixed(4));
    expect(SEA_GLSL.match(/sin\(/g)).toHaveLength(SWELL.length);
    expect(SEA_GLSL.match(/cos\(/g)).toHaveLength(SWELL.length);
  });

  it('is still where the water meets the shore or water of another level, full on the open sea', () => {
    // An islet: tiles 4..5 × 4..5 are land.
    const top = tops((x, z) => x >= 4 && x <= 5 && z >= 4 && z <= 5);
    expect(cornerWeight(top, 0, 0)).toBe(1);
    // The islet's corners and edges, and those one tile off diagonally.
    for (const [x, z] of [[4, 4], [6, 6], [5, 4], [4, 6], [7, 7]]) expect(cornerWeight(top, x, z), `${x},${z}`).toBe(x === 7 && z === 7 ? 1 : 0);
    expect(seaWeight(top, 1.5, 1.5)).toBe(1);
    expect(seaWeight(top, 4.5, 4.5)).toBe(0);
    // Next to the islet: still at the shore, moving away from it, continuous across a tile's edge.
    expect(seaWeight(top, 6.01, 4.5)).toBeCloseTo(0.01, 9);
    expect(seaWeight(top, 6.99, 3.5)).toBeGreaterThan(0.4);
    expect(seaWeight(top, 6.999999, 2.5)).toBeCloseTo(seaWeight(top, 7, 2.5), 4);
    // Water of another level: the corners between the two still.
    const steps = tops(() => false, (x) => (x < 3 ? 0 : 1));
    expect(cornerWeight(steps, 3, 5)).toBe(0);
    expect(cornerWeight(steps, 2, 5)).toBe(1);
    expect(cornerWeight(steps, 4, 5)).toBe(1);
    // What floats rides it only where it moves.
    expect(seaLift(top, 4.5, 4.5, 3)).toBe(0);
    expect(seaLift(top, 1.5, 1.5, 3)).toBeCloseTo(swellAt(1.5, 1.5, 3), 12);
    // The attribute of a geometry: a vertex at each corner.
    expect([...waveAttribute([0, 0, 0, 4, 0, 4, 7, 0, 7, 6, 0, 4], top)]).toEqual([1, 0, 1, 0]);
  });
});

describe('the roll and the wake (T451)', () => {
  it('rocks a hull more on the open sea, heels it outward in a turn, within its limits', () => {
    let open = 0, still = 0;
    for (let t = 0; t < 40; t += 0.1) {
      open = Math.max(open, Math.abs(rollOf(t, 1, 1, 0, 0).roll));
      still = Math.max(still, Math.abs(rollOf(t, 1, 0, 0, 0).roll));
      const r = rollOf(t, 1, 1, 8, 2);
      expect(Math.abs(r.roll)).toBeLessThanOrEqual(ROLL.roll * 1.3 + ROLL.heel + 1e-9);
      expect(Math.abs(r.pitch)).toBeLessThanOrEqual(ROLL.pitch + 1e-9);
    }
    expect(open).toBeGreaterThan(still * 2);
    expect(rollOf(0, 0, 0, 3, 1).roll).toBeGreaterThan(rollOf(0, 0, 0, 3, -1).roll);
  });

  it('drops a puff every so often at way, spreads it and fades it until it is gone', () => {
    expect(dropsWake(WAKE.every, 2)).toBe(true);
    expect(dropsWake(WAKE.every / 2, 2)).toBe(false);
    expect(dropsWake(WAKE.every, WAKE.slow / 2)).toBe(false);
    const p: WakePoint = { x: 0, z: 0, heading: 0, born: 0, strength: 1, half: 0.5 };
    const young = wakePuffs(p, 0.1), old = wakePuffs(p, WAKE.life * 0.8);
    expect(young).toHaveLength(3);
    expect(old).toHaveLength(2);
    // Heading 0 (the bow towards +z): the arms spread across, along x.
    expect(Math.abs(old[0]!.x)).toBeGreaterThan(Math.abs(young[0]!.x));
    expect(old[0]!.z).toBeCloseTo(0, 9);
    expect(old[0]!.alpha).toBeLessThan(young[0]!.alpha);
    expect(old[0]!.r).toBeGreaterThan(young[0]!.r);
    expect(wakePuffs(p, WAKE.life)).toEqual([]);
  });

  it('leaves a wake and rocks a hull on the water; on land straight and no wake', () => {
    const world = new THREE.Group();
    const sea = new Sea(world);
    // Water for x < 20, land beyond.
    const top = tops((x) => x >= 20);
    const hull = () => {
      const root = new THREE.Group(), body = new THREE.Group();
      body.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 3)));
      root.add(body);
      return { root, body };
    };
    const boat = hull(), cart = hull();
    let t = 0;
    for (let i = 0; i < 120; i++, t += 1 / 60) {
      // The boat sails along +z at 3 tiles a second; the cart rolls on land.
      sea.hull(1, 5.5, 5 + t * 3, 0, boat.root, boat.body, 1 / 60, t, top);
      sea.hull(2, 25.5, 5 + t * 3, 0, cart.root, cart.body, 1 / 60, t, top);
      sea.update(t, new Set([1, 2]), top);
    }
    expect(sea.puffs).toBeGreaterThan(10);
    expect(boat.body.rotation.z).not.toBe(0);
    expect([cart.body.rotation.x, cart.body.rotation.z]).toEqual([0, 0]);
    // Every puff behind the boat's stern (1.5 behind its middle), never on land.
    const g = (world.children[0] as THREE.Mesh).geometry;
    const pos = g.getAttribute('position');
    for (let i = 0; i < g.drawRange.count; i++) {
      expect(pos.getX(i)).toBeLessThan(20);
      expect(pos.getZ(i)).toBeLessThan(5 + t * 3 - 1.2);
    }
    // At rest the wake fades and goes.
    for (let i = 0; i < 60 * (WAKE.life + 0.5); i++, t += 1 / 60) {
      sea.hull(1, 5.5, 5 + 2 * 3, 0, boat.root, boat.body, 1 / 60, t, top);
      sea.update(t, new Set([1]), top);
    }
    expect(sea.puffs).toBe(0);
    sea.dispose();
    expect(world.children).toHaveLength(0);
  });
});

describe('the shaders of the sea (T451)', () => {
  /** The shaders three would compile for a material: its library's, through `onBeforeCompile`. */
  const compiled = (m: THREE.Material) => {
    const lib = (m as THREE.Material & { isMeshToonMaterial?: boolean }).isMeshToonMaterial ? THREE.ShaderLib.toon : THREE.ShaderLib.lambert;
    const sh = { vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader, uniforms: {} as Record<string, unknown> } as unknown as THREE.WebGLProgramParametersWithUniforms;
    m.onBeforeCompile(sh, undefined as unknown as THREE.WebGLRenderer);
    return sh;
  };
  /** Whether a stage declares what it uses of ours (in the browser the foam's fragment used `uTime` undeclared). */
  const declares = (src: string, name: string) => !new RegExp(`\\b${name}\\b`).test(src) || new RegExp(`(uniform|varying|attribute)\\s+\\w+\\s+${name}\\b`).test(src);

  it('injects every piece where it belongs and declares what each stage uses', () => {
    for (const [name, m] of Object.entries(SEA_MAT)) {
      const sh = compiled(m);
      for (const stage of [sh.vertexShader, sh.fragmentShader])
        for (const id of ['uTime', 'wave', 'vFoam', 'vFoamPhase', 'vSeaH', 'alpha', 'vAlpha'])
          expect(declares(stage, id), `${name}: ${id}`).toBe(true);
      expect(sh.uniforms.uTime, name).toBeDefined();
    }
    const water = compiled(SEA_MAT.water), foam = compiled(SEA_MAT.foam);
    expect(water.vertexShader).toContain('transformed.y += wave * seaSwell(position.xz, uTime);');
    expect(water.vertexShader).toContain('objectNormal = normalize(vec3(-seaS.x, 1.0, -seaS.y));');
    expect(water.fragmentShader).toContain('smoothstep(0.3, 0.85, vSeaH)');
    expect(foam.vertexShader).toContain('vFoam = foam;');
    expect(foam.fragmentShader).toContain('foamReach');
  });
});

describe('the water and the foam of a place (T451)', () => {
  it('draws the water in its own mesh that the swell moves, still at the shore, and the foam along the islet', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    k.tick(1 / 60);
    const ch = [...k.chunks.values()][0]!;
    const S = k.config.chunkSize;
    const sea = Object.keys(k.palette).find((c) => k.palette[c]!.layer === 'liquid')!;
    const land = Object.keys(k.palette).find((c) => k.palette[c]!.layer === 'ground' && !k.palette[c]!.solid)!;
    // An islet of 4 × 4 in the middle of the sea.
    const islet = (c: number, r: number) => c >= 7 && c < 11 && r >= 7 && r < 11;
    ch.tiles = Array.from({ length: S * S }, (_, i) => (islet(i % S, Math.floor(i / S)) ? land : sea)).join('');
    const view = buildChunk(k, ch);
    const meshes = view.group.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh);
    const water = meshes.find((m) => m.material === SEA_MAT.water)!;
    const foam = meshes.find((m) => m.material === SEA_MAT.foam)!;
    expect(water).toBeDefined();
    expect(foam).toBeDefined();
    const pos = water.geometry.getAttribute('position'), wave = water.geometry.getAttribute('wave');
    expect(pos.count).toBe((S * S - 16) * 6);
    const X0 = ch.cx * S, Z0 = ch.cy * S;
    let moving = 0;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) - X0, z = pos.getZ(i) - Z0;
      expect([0, 1]).toContain(wave.getX(i));
      // The corners of the islet are still.
      if (x >= 7 && x <= 11 && z >= 7 && z <= 11) expect(wave.getX(i)).toBe(0);
      moving += wave.getX(i);
    }
    expect(moving).toBeGreaterThan(0);
    // The foam: a strip on every edge of the islet (16) and along the land of the places around (on the chunk's edges), in the water, over it.
    const fp = foam.geometry.getAttribute('position');
    const near = (v: number, a: number, b: number) => v >= a - FOAM_WIDTH - 1e-5 && v <= b + FOAM_WIDTH + 1e-5;
    let around = 0;
    for (let i = 0; i < fp.count; i++) {
      const x = fp.getX(i) - X0, z = fp.getZ(i) - Z0;
      expect(islet(Math.floor(x), Math.floor(z)) && x > 7 && x < 11 && z > 7 && z < 11).toBe(false);
      if (near(x, 7, 11) && near(z, 7, 11)) around++;
      else expect(Math.min(x, z, S - x, S - z), `${x},${z}`).toBeLessThanOrEqual(FOAM_WIDTH + 1e-5);
    }
    expect(around).toBe(16 * 6);
    // The ink's ids move the water's vertices as the water does; the foam has no ink.
    const ids = idsOf(SEA_MAT.water) as THREE.ShaderMaterial;
    expect(ids.vertexShader).toContain('seaSwell(position.xz, uTime)');
    expect(ids.vertexShader).toContain('attribute float wave;');
    expect(idsOf(SEA_MAT.foam)).toBeUndefined();
    expect(idsOf(SEA_MAT.wake)).toBeUndefined();
  }, 60_000);
});
