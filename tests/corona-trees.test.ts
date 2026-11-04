// T218: the corona's light trees were drawn with the simulation's wind material, which cuts all it draws beyond the circle
// once the corona is revealed. The campus stands beyond the circle: of the trees only the shadows were left.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Corona } from '../src/kernel/corona';
import { meshVoxels } from '../src/mj/mesh';
import { compileMjx } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { buildCoronaRing } from '../src/render/corona3d';
import { idsOf, MAT } from '../src/render/materials';
import { geometry, modelMaterials } from '../src/render/models';

const voxels = (sway: boolean) => meshVoxels({ X: 1, Y: 1, Z: 2, cells: new Uint8Array([1, 1]), alphabet: ['.', 'M'] }, { M: { color: '#14141a' } }, { vpt: 8, sway });

/** The shader a material compiles to, with the chunks its `onBeforeCompile` looks for. */
const compiled = (m: THREE.Material) => {
  const sh = {
    uniforms: {} as Record<string, unknown>,
    vertexShader: 'void main() {\n#include <begin_vertex>\n#include <project_vertex>\n}',
    fragmentShader: 'void main() {\n#include <emissivemap_fragment>\n#include <opaque_fragment>\n}',
  };
  m.onBeforeCompile(sh as never, undefined as never);
  return sh;
};

const campus = () => {
  const c = new Corona(42);
  c.build({ 'modules/sys.physics/manifest.json': '{}', 'universe.json': '{}' }, [], []);
  return c;
};

describe('the light trees of the corona', () => {
  it('the wind stays, the circle clip goes', () => {
    const { uniforms, vertexShader, fragmentShader } = compiled(MAT.coronaSway);
    expect(vertexShader).toContain('attribute float sway');
    expect(vertexShader).toContain('sway * uWind');
    expect(vertexShader).toContain('vGlow = glow');
    expect(uniforms.uClipR).toBeUndefined();
    expect(fragmentShader).not.toContain('discard');
    // What this looks at: the simulation's wind has the clip.
    expect(compiled(MAT.sway).fragmentShader).toContain('discard');
    expect(MAT.coronaSway.customProgramCacheKey()).not.toBe(MAT.sway.customProgramCacheKey());
  });

  it('nothing the ring draws is clipped, and the trees bend in the wind, animated ones too', () => {
    const c = campus();
    const trees = c.props.filter((p) => p.kind === 'albero');
    expect(trees.length).toBeGreaterThan(0);
    const form = (key: string, sway: boolean, frames: number) => {
      const m = voxels(sway);
      return { key, status: 'ready', result: { meshes: { body: m, limbs: [], frames: Array.from({ length: frames }, () => voxels(sway)) } } };
    };
    const k = {
      corona: c,
      forms: { version: 1, ready: (m: string, s: number) => (m === 'corona-albero-luce' ? form(`${m}#${s}`, true, 2) : form(`${m}#${s}`, false, 0)), get: () => undefined },
    };
    const ring = buildCoronaRing(k as never);
    const windy: THREE.Mesh[] = [];
    ring.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      for (const mat of [m.material].flat()) expect(mat.userData.clipped, m.name).toBeFalsy();
      if (m.material === MAT.coronaSway) windy.push(m);
    });
    expect(windy.length).toBe(trees.length * 2);
    expect(windy.every((m) => m.geometry.getAttribute('sway'))).toBe(true);
  });

  it('a prop without wind weights keeps the plain material of the corona', () => {
    const c = campus();
    const k = { corona: c, forms: { version: 1, ready: (m: string, s: number) => ({ key: `senza-vento-${m}#${s}`, status: 'ready', result: { meshes: { body: voxels(false), limbs: [], frames: [] } } }), get: () => undefined } };
    const ring = buildCoronaRing(k as never);
    ring.traverse((o) => expect((o as THREE.Mesh).material).not.toBe(MAT.coronaSway));
  });

  it('their glass, if they have any, is the corona\'s, and the ink bends with them without the clip', () => {
    const glassy = geometry(meshVoxels({ X: 2, Y: 1, Z: 1, cells: new Uint8Array([1, 2]), alphabet: ['.', 'M', 'v'] }, { M: { color: '#14141a' }, v: { color: '#29adff', alpha: 0.38 } }, { vpt: 8, sway: true }));
    expect(modelMaterials(glassy, MAT.coronaSway)).toEqual([MAT.coronaSway, MAT.coronaGlass]);
    const { vertexShader, fragmentShader } = idsOf(MAT.coronaSway) as THREE.ShaderMaterial;
    expect(vertexShader).toContain('sway * uWind');
    expect(fragmentShader).not.toContain('discard');
  });

  it('the program gives voxels with every seed the campus uses', () => {
    const seeds = [...new Set(campus().props.filter((p) => p.kind === 'albero').map((p) => p.seed))].sort();
    expect(seeds.length).toBeGreaterThan(1);
    const model = compileMjx(bundledFiles['models/corona-albero-luce.xml']);
    for (const seed of seeds) {
      const { grid } = runMjx(model, seed);
      expect(grid.cells.filter((c) => c !== 0).length, `seme ${seed}`).toBeGreaterThan(100);
    }
  }, 60_000);
});
